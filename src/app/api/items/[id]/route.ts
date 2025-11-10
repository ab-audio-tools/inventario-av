import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  const { id } = await context.params;
  
  if (!session || !["ADMIN", "TECH"].includes(session.role)) {
    return NextResponse.json(
      { error: "Accesso negato" },
      { status: 403 }
    );
  }

  try {
    const itemId = parseInt(id);
    if (isNaN(itemId)) {
      return NextResponse.json(
        { error: "ID non valido" },
        { status: 400 }
      );
    }

    const data = await req.json();
    
    // Validazioni base come in POST
    const hasBrandModel = !!(data.brand && data.model);
    const hasName = !!data.name;
    if (!hasBrandModel && !hasName) {
      return NextResponse.json(
        { error: "Fornisci 'name' oppure 'brand' + 'model'." },
        { status: 400 }
      );
    }
    if (!data.categoryId) {
      return NextResponse.json(
        { error: "categoryId mancante." },
        { status: 400 }
      );
    }

    const exists = await prisma.item.findUnique({
      where: { id: itemId }
    });
    
    if (!exists) {
      return NextResponse.json(
        { error: "Articolo non trovato" },
        { status: 404 }
      );
    }

    const updateData: any = {
      brand: data.brand || null,
      model: data.model || null,
      name: data.name || null,
      typology: data.typology || null,
      categoryId: Number(data.categoryId),
      sku: data.sku || null,
      quantity: Number(data.quantity) || 0,
      description: data.description ?? exists.description ?? null,
      imageUrl: data.imageUrl || null,
    };
    if (data.restricted !== undefined) {
      updateData.restricted = Boolean(data.restricted);
    }

    // Gestione tag
    if (data.tagIds !== undefined) {
      // Elimina i tag esistenti e crea i nuovi
      await prisma.itemTag.deleteMany({
        where: { itemId },
      });
      
      if (data.tagIds.length > 0) {
        await prisma.itemTag.createMany({
          data: data.tagIds.map((tagId: number) => ({
            itemId,
            tagId,
          })),
        });
      }
    }

    const item = await prisma.item.update({
      where: { id: itemId },
      data: updateData,
      include: { 
        category: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    return NextResponse.json({ item });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Errore durante l'aggiornamento" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || !["ADMIN", "TECH"].includes(session.role)) {
    return NextResponse.json({ error: "Accesso negato" }, { status: 403 });
  }

  try {
    const { id } = await context.params;
    const itemId = parseInt(id, 10);
    if (isNaN(itemId)) {
      return NextResponse.json({ error: "ID non valido" }, { status: 400 });
    }

    const exists = await prisma.item.findUnique({ where: { id: itemId } });
    if (!exists) {
      return NextResponse.json({ error: "Articolo non trovato" }, { status: 404 });
    }

    // Prima elimina tutte le transazioni associate all'articolo
    await prisma.transaction.deleteMany({
      where: { itemId: itemId }
    });

    // Poi elimina l'articolo
    await prisma.item.delete({ where: { id: itemId } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Errore durante la cancellazione" },
      { status: 500 }
    );
  }
}