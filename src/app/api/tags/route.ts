import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/tags - Ottieni tutti i tag
export async function GET() {
  try {
    const tags = await prisma.tag.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { items: true },
        },
      },
    });

    return NextResponse.json({ tags });
  } catch (error: any) {
    console.error("Error fetching tags:", error);
    return NextResponse.json(
      { error: "Errore nel caricamento dei tag" },
      { status: 500 }
    );
  }
}

// POST /api/tags - Crea un nuovo tag
export async function POST(req: NextRequest) {
  try {
    const { name, color } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Il nome del tag è obbligatorio" },
        { status: 400 }
      );
    }

    // Verifica se il tag esiste già
    const existing = await prisma.tag.findUnique({
      where: { name: name.trim() },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Esiste già un tag con questo nome" },
        { status: 400 }
      );
    }

    const tag = await prisma.tag.create({
      data: {
        name: name.trim(),
        color: color || null,
      },
    });

    return NextResponse.json({ tag }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating tag:", error);
    return NextResponse.json(
      { error: "Errore nella creazione del tag" },
      { status: 500 }
    );
  }
}
