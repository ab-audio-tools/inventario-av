import { NextResponse } from "next/server";
import { writeFile, mkdir, readFile } from "fs/promises";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// In produzione (Netlify o Vercel), usa una directory temporanea
const isProduction = process.env.NODE_ENV === 'production';

function safeBaseName(name: string) {
  return name.replace(/[^a-z0-9._-]+/gi, "_").toLowerCase();
}

// Serve file caricati: /api/upload?file=filename.ext
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const file = url.searchParams.get("file");
    if (!file) return NextResponse.json({ error: "Parametro 'file' mancante" }, { status: 400 });

    const clean = safeBaseName(file);
    const uploadsDir = isProduction
      ? path.join('/tmp', 'uploads')
      : path.join(process.cwd(), "public", "uploads");
    const filepath = path.join(uploadsDir, clean);

    const data = await readFile(filepath);
    const ext = path.extname(clean).toLowerCase();
    const type =
      ext === ".png" ? "image/png" :
      ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" :
      ext === ".webp" ? "image/webp" :
      ext === ".gif" ? "image/gif" :
      "application/octet-stream";

    return new NextResponse(data, {
      status: 200,
      headers: {
        "Content-Type": type,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "File non trovato" }, { status: 404 });
  }
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "Nessun file ricevuto" }, { status: 400 });
    }

    const type = file.type || "";
    if (!type.startsWith("image/")) {
      return NextResponse.json({ error: "Il file deve essere un'immagine" }, { status: 400 });
    }
    const bytes = await file.arrayBuffer();
    if (bytes.byteLength > 10 * 1024 * 1024) { // 10MB
      return NextResponse.json({ error: "File troppo grande (max 10MB)" }, { status: 400 });
    }

    const uploadsDir = isProduction
      ? path.join('/tmp', 'uploads')
      : path.join(process.cwd(), "public", "uploads");

    // In produzione scriviamo su /tmp per ottenere un URL stabile via GET
    await mkdir(uploadsDir, { recursive: true });

    const orig = safeBaseName(file.name || "image");
    const ext = path.extname(orig) || ".png";
    const base = path.basename(orig, ext);
    const filename = `${base}_${Date.now()}_${Math.random().toString(36).slice(2,8)}${ext}`;
    const filepath = path.join(uploadsDir, filename);

    await writeFile(filepath, Buffer.from(bytes));

    // URL servito:
    // - dev: statico da /public/uploads
    // - prod: servito da questa stessa route
    const url = isProduction
      ? `/api/upload?file=${encodeURIComponent(filename)}`
      : `/uploads/${filename}`;

    return NextResponse.json({ url });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Upload fallito" }, { status: 500 });
  }
}
