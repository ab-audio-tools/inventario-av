import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  const isPrivileged = session && (session.role === "ADMIN" || session.role === "TECH");

  const items = await prisma.item.findMany({
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  console.log('Creating new item...');
  const data = await req.json().catch(() => ({}));
  console.log('Received data:', data);
  const {
    brand = null,
    model = null,
    name = null,
    typology = null,
    categoryId,
    sku = null,
    quantity = 0,
    description = null,
    imageUrl = null,
    restricted = false,
  } = data || {};

  // Validazioni base
  const hasBrandModel = !!(brand && model);
  const hasName = !!name;
  if (!hasBrandModel && !hasName) {
    return NextResponse.json(
      { error: "Fornisci 'name' oppure 'brand' + 'model'." },
      { status: 400 }
    );
  }
  if (!categoryId) {
    return NextResponse.json({ error: "categoryId mancante." }, { status: 400 });
  }

  try {
    const item = await prisma.item.create({
      data: {
        brand, model, name, typology,
        sku, quantity: Number(quantity) || 0,
        description, imageUrl,
        categoryId: Number(categoryId),
      },
      include: { category: true },
    });
    console.log('Item created successfully:', item.id);
    return NextResponse.json({ item });
  } catch (e: any) {
    console.error('Error creating item:', e.message);
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
