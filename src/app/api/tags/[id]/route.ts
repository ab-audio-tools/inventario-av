import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// DELETE /api/tags/[id] - Elimina un tag
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tagId = parseInt(id);

    if (isNaN(tagId)) {
      return NextResponse.json({ error: "ID non valido" }, { status: 400 });
    }

    await prisma.tag.delete({
      where: { id: tagId },
    });

    return NextResponse.json({ message: "Tag eliminato" });
  } catch (error: any) {
    console.error("Error deleting tag:", error);
    return NextResponse.json(
      { error: "Errore nell'eliminazione del tag" },
      { status: 500 }
    );
  }
}

// PATCH /api/tags/[id] - Modifica un tag
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tagId = parseInt(id);

    if (isNaN(tagId)) {
      return NextResponse.json({ error: "ID non valido" }, { status: 400 });
    }

    const { name, color } = await req.json();

    const tag = await prisma.tag.update({
      where: { id: tagId },
      data: {
        name: name?.trim() || undefined,
        color: color || null,
      },
    });

    return NextResponse.json({ tag });
  } catch (error: any) {
    console.error("Error updating tag:", error);
    return NextResponse.json(
      { error: "Errore nell'aggiornamento del tag" },
      { status: 500 }
    );
  }
}
