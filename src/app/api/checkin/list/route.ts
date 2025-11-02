import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Accesso negato" },
      { status: 403 }
    );
  }

  try {
    // Usa solo la relazione "transactions" con filtro per tipo CHECKOUT e CHECKIN
    const productionCheckouts = await prisma.productionCheckout.findMany({
      where: {
        status: "OPEN",
      },
      include: {
        transactions: {
          include: {
            item: {
              select: {
                id: true,
                name: true,
                brand: true,
                model: true,
                typology: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            username: true,
            name: true,
          }
        }
      },
      orderBy: { createdAt: "desc" },
    });

    // Separa le transazioni di tipo CHECKOUT e CHECKIN per il frontend
    const checkouts = productionCheckouts.map((checkout) => ({
      ...checkout,
      transactions: checkout.transactions.filter(t => t.type === "CHECKOUT"),
      checkins: checkout.transactions.filter(t => t.type === "CHECKIN").map(t => ({
        itemId: t.itemId,
        qty: t.qty,
      })),
    }));

    return NextResponse.json({ checkouts });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Errore nel caricamento check-in" },
      { status: 500 }
    );
  }
}

