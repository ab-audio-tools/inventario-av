import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/categories -> lista categorie con conteggio item
export async function GET() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { items: true }
      }
    }
  });
  return NextResponse.json({ categories });
}

// POST /api/categories -> crea una categoria { name }
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const name = (body?.name || "").trim();
  if (!name) return NextResponse.json({ error: "Nome categoria mancante" }, { status: 400 });

  try {
    const category = await prisma.category.create({ data: { name } });
    return NextResponse.json({ category });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
