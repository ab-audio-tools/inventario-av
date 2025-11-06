import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  const isPrivileged = session && (session.role === "ADMIN" || session.role === "TECH");

  const sets = await (prisma as any).set.findMany({
    where: isPrivileged ? undefined : { restricted: false },
    include: {
      items: {
        include: { item: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // compute available quantity per set based on components
  const payload = sets.map((s: any) => {
    const available = s.items.length === 0
      ? 0
      : Math.max(
          0,
          Math.min(
            ...s.items.map((si: any) => Math.floor((si.item.quantity || 0) / Math.max(1, si.qty)))
          )
        );
    return {
      id: s.id,
      name: s.name,
      imageUrl: s.imageUrl,
      restricted: s.restricted,
      available,
      items: s.items.map((si: any) => ({
        itemId: si.itemId,
        qty: si.qty,
        name: si.item.name,
        brand: si.item.brand,
        model: si.item.model,
      })),
    };
  });

  return NextResponse.json({ sets: payload });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || !["ADMIN", "TECH"].includes(session.role)) {
    return NextResponse.json({ error: "Accesso negato" }, { status: 403 });
  }

  const { name, imageUrl = null, restricted = false, items = [] } = await req.json();
  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "name mancante" }, { status: 400 });
  }

  if (!Array.isArray(items)) {
    return NextResponse.json({ error: "items deve essere array" }, { status: 400 });
  }

  // sanitize items: [{ itemId, qty }]
  const setItems = items
    .map((it: any) => ({ itemId: Number(it.itemId), qty: Math.max(1, Number(it.qty) || 1) }))
    .filter((it: any) => Number.isFinite(it.itemId) && it.itemId > 0);

  const set = await (prisma as any).set.create({
    data: {
      name,
      imageUrl,
      restricted: Boolean(restricted),
      items: {
        create: setItems.map((si: any) => ({ itemId: si.itemId, qty: si.qty })),
      },
    },
  });
  return NextResponse.json({ set });
}


