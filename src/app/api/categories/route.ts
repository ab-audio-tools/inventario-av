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
    // Se errore di unique constraint su id, prova a resettare la sequenza
    if (e.code === 'P2002' && e.meta?.target?.includes('id')) {
      try {
        // Reset della sequenza PostgreSQL
        await prisma.$executeRawUnsafe(`
          SELECT setval(pg_get_serial_sequence('"Category"', 'id'), COALESCE(MAX(id), 1)) 
          FROM "Category"
        `);
        // Riprova la creazione
        const category = await prisma.category.create({ data: { name } });
        return NextResponse.json({ category });
      } catch (retryError: any) {
        return NextResponse.json({ error: retryError.message }, { status: 400 });
      }
    }
    
    // Gestisci duplicate name
    if (e.code === 'P2002' && e.meta?.target?.includes('name')) {
      return NextResponse.json({ error: "Una categoria con questo nome esiste già" }, { status: 400 });
    }
    
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
