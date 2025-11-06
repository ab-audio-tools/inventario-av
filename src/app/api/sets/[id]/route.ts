import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const setId = Number(id);
  if (!Number.isFinite(setId)) return NextResponse.json({ error: "ID non valido" }, { status: 400 });

  const set = await (prisma as any).set.findUnique({
    where: { id: setId },
    include: { items: { include: { item: true } } },
  });

  if (!set) return NextResponse.json({ error: "Set non trovato" }, { status: 404 });

  return NextResponse.json({ set });
}

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !["ADMIN", "TECH"].includes(session.role)) {
    return NextResponse.json({ error: "Accesso negato" }, { status: 403 });
  }

  const { id } = await context.params;
  const setId = Number(id);
  if (!Number.isFinite(setId)) return NextResponse.json({ error: "ID non valido" }, { status: 400 });

  const { name, imageUrl = null, restricted, items } = await req.json();

  // update core fields
  const data: any = {};
  if (typeof name === "string") data.name = name;
  if (imageUrl !== undefined) data.imageUrl = imageUrl;
  if (restricted !== undefined) data.restricted = Boolean(restricted);

  // update set
  const result = await prisma.$transaction(async (tx) => {
    const updated = await (tx as any).set.update({ where: { id: setId }, data });
    if (Array.isArray(items)) {
      // replace all components
      await (tx as any).setItem.deleteMany({ where: { setId } });
      const sanitized = items
        .map((it: any) => ({ itemId: Number(it.itemId), qty: Math.max(1, Number(it.qty) || 1) }))
        .filter((it: any) => Number.isFinite(it.itemId) && it.itemId > 0);
      if (sanitized.length > 0) {
        await (tx as any).setItem.createMany({
          data: sanitized.map((si: any) => ({ setId, itemId: si.itemId, qty: si.qty })),
          skipDuplicates: true,
        });
      }
    }
    return updated;
  });

  return NextResponse.json({ set: result });
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !["ADMIN", "TECH"].includes(session.role)) {
    return NextResponse.json({ error: "Accesso negato" }, { status: 403 });
  }

  const { id } = await context.params;
  const setId = Number(id);
  if (!Number.isFinite(setId)) return NextResponse.json({ error: "ID non valido" }, { status: 400 });

  await prisma.$transaction(async (tx) => {
    await (tx as any).setItem.deleteMany({ where: { setId } });
    await (tx as any).set.delete({ where: { id: setId } });
  });

  return NextResponse.json({ ok: true });
}


