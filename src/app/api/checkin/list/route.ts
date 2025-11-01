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
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ checkouts: productionCheckouts });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Errore nel caricamento check-in" },
      { status: 500 }
    );
  }
}

