import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, canImport } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await getSession();
  
  if (!session || !canImport(session.role)) {
    return NextResponse.json(
      { error: "Accesso negato" },
      { status: 403 }
    );
  }
  try {
    const { items, overwriteIds = [] } = await req.json();

    if (!Array.isArray(items)) {
      return NextResponse.json(
        { error: "items deve essere un array" },
        { status: 400 }
      );
    }

    let count = 0;
    const errors: string[] = [];

    for (const item of items) {
      try {
        const {
          brand = null,
          model = null,
          name = null,
          typology = null,
          categoryId,
          sku = null,
          quantity = 0,
          description = null,
        } = item;

        // Validation
        const hasBrandModel = !!(brand && model);
        const hasName = !!name;
        if (!hasBrandModel && !hasName) {
          errors.push(`SKU ${sku || "N/A"}: Manca nome o brand+modello`);
          continue;
        }

        if (!categoryId) {
          errors.push(`SKU ${sku || "N/A"}: Manca categoryId`);
          continue;
        }

        // Check if item exists (by SKU)
        const existing = sku
          ? await prisma.item.findUnique({ where: { sku } })
          : null;

        if (existing) {
          // If overwrite requested, update; otherwise skip
          if (overwriteIds.includes(existing.id)) {
            await prisma.item.update({
              where: { id: existing.id },
              data: {
                brand,
                model,
                name,
                typology,
                categoryId: Number(categoryId),
                sku,
                quantity: Number(quantity) || 0,
                description,
              },
            });
            count++;
          }
          // Otherwise skip (keep existing)
        } else {
          // Create new item
          await prisma.item.create({
            data: {
              brand,
              model,
              name,
              typology,
              categoryId: Number(categoryId),
              sku,
              quantity: Number(quantity) || 0,
              description,
            },
          });
          count++;
        }
      } catch (e: any) {
        errors.push(
          `SKU ${item.sku || "N/A"}: ${e.message || "Errore sconosciuto"}`
        );
      }
    }

    return NextResponse.json({
      count,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Errore durante l'importazione" },
      { status: 400 }
    );
  }
}

