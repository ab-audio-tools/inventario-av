import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await getSession();
  
  if (!session) {
    return NextResponse.json(
      { error: "Accesso negato" },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    // Get production checkouts with their transactions
    // STANDARD, OFFICE and GUEST users only see their own checkouts
    // TECH and ADMIN see all checkouts
    const whereClause: any = {};
    
    if (session.role !== "ADMIN" && session.role !== "TECH") {
      // For STANDARD, OFFICE and GUEST roles restrict to user's own checkouts
      whereClause.userId = session.id;
    }

    // Handle status filter
    // Status should always be set (defaults to OPEN), but if status filter is provided, apply it
    if (status === "OPEN" || status === "CLOSED") {
      whereClause.status = status;
    }

    const productionCheckouts = await prisma.productionCheckout.findMany({
      where: whereClause,
      include: {
        transactions: {
          include: {
            item: true,
          },
        },
        user: {
          select: {
            id: true,
            username: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ checkouts: productionCheckouts });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Errore nel caricamento transazioni" },
      { status: 500 }
    );
  }
}

