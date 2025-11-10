import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteParams = {
  params: Promise<{ id: string }>;
};

// GET /api/categories/[id]
export async function GET(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const categoryId = parseInt(id);

  if (isNaN(categoryId)) {
    return NextResponse.json({ error: "ID non valido" }, { status: 400 });
  }

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    include: {
      _count: {
        select: { items: true }
      }
    }
  });

  if (!category) {
    return NextResponse.json({ error: "Categoria non trovata" }, { status: 404 });
  }

  return NextResponse.json({ category });
}

// PATCH /api/categories/[id] -> modifica categoria { name }
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const categoryId = parseInt(id);

  if (isNaN(categoryId)) {
    return NextResponse.json({ error: "ID non valido" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const name = (body?.name || "").trim();

  if (!name) {
    return NextResponse.json({ error: "Nome categoria mancante" }, { status: 400 });
  }

  try {
    const category = await prisma.category.update({
      where: { id: categoryId },
      data: { name },
    });

    return NextResponse.json({ category });
  } catch (e: any) {
    if (e.code === "P2025") {
      return NextResponse.json({ error: "Categoria non trovata" }, { status: 404 });
    }
    if (e.code === "P2002" && e.meta?.target?.includes("name")) {
      return NextResponse.json({ error: "Una categoria con questo nome esiste già" }, { status: 400 });
    }
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

// DELETE /api/categories/[id]
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const categoryId = parseInt(id);

  if (isNaN(categoryId)) {
    return NextResponse.json({ error: "ID non valido" }, { status: 400 });
  }

  try {
    // Verifica se ci sono articoli associati
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        _count: {
          select: { items: true }
        }
      }
    });

    if (!category) {
      return NextResponse.json({ error: "Categoria non trovata" }, { status: 404 });
    }

    if (category._count.items > 0) {
      return NextResponse.json(
        { error: `Impossibile eliminare: ${category._count.items} articoli sono associati a questa categoria` },
        { status: 400 }
      );
    }

    await prisma.category.delete({
      where: { id: categoryId },
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    if (e.code === "P2025") {
      return NextResponse.json({ error: "Categoria non trovata" }, { status: 404 });
    }
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
