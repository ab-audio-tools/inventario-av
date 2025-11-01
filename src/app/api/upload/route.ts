import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export const runtime = "nodejs";          // serve fs
export const dynamic = "force-dynamic";   // no cache

function safeBaseName(name: string) {
  return name.replace(/[^a-z0-9._-]+/gi, "_").toLowerCase();
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "Nessun file ricevuto" }, { status: 400 });
    }

    // limiti base
    const type = file.type || "";
    if (!type.startsWith("image/")) {
      return NextResponse.json({ error: "Il file deve essere un'immagine" }, { status: 400 });
    }
    const bytes = await file.arrayBuffer();
    if (bytes.byteLength > 10 * 1024 * 1024) { // 10MB
      return NextResponse.json({ error: "File troppo grande (max 10MB)" }, { status: 400 });
    }

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });

    const orig = safeBaseName(file.name || "image");
    const ext = path.extname(orig) || ".png";
    const base = path.basename(orig, ext);
    const filename = `${base}_${Date.now()}_${Math.random().toString(36).slice(2,8)}${ext}`;
    const filepath = path.join(uploadsDir, filename);

    await writeFile(filepath, Buffer.from(bytes));

    // URL servito staticamente da Next (public/)
    const url = `/uploads/${filename}`;
    return NextResponse.json({ url });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Upload fallito" }, { status: 500 });
  }
}
