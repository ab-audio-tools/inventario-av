import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await getSession();
  
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Accesso negato" },
      { status: 403 }
    );
  }

  try {
    const { checkoutId, items } = await req.json();

    if (!checkoutId || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Dati non validi" },
        { status: 400 }
      );
    }

    // Get the checkout with all transactions
    const checkout = await prisma.productionCheckout.findUnique({
      where: { id: checkoutId },
      include: {
        transactions: true,
      },
    });

    if (!checkout || checkout.status === "CLOSED") {
      return NextResponse.json(
        { error: "Checkout non trovato o già chiuso" },
        { status: 404 }
      );
    }

    await prisma.$transaction(async (tx) => {
      // Get current state of check-ins for this checkout
      const existingCheckins = await tx.transaction.findMany({
        where: {
          productionCheckoutId: checkoutId,
          type: "CHECKIN",
        },
      });

      // Process each returned item
      for (const item of items) {
        // Get original checkout transaction and existing check-ins
        const checkoutTx = checkout.transactions.find(
          (t) => t.id === item.transactionId && t.itemId === item.itemId
        );

        if (!checkoutTx) {
          throw new Error(`Transazione ${item.transactionId} non trovata`);
        }

        // Get all check-ins for this specific item in this checkout
        const itemCheckins = await tx.transaction.findMany({
          where: {
            productionCheckoutId: checkoutId,
            itemId: item.itemId,
            type: "CHECKIN"
          }
        });

        const alreadyCheckedIn = itemCheckins.reduce((sum, t) => sum + t.qty, 0);
        const remainingToCheckin = checkoutTx.qty - alreadyCheckedIn;

        if (item.qty > remainingToCheckin) {
          throw new Error(
            `Quantità restituita (${item.qty}) superiore a quella rimanente da restituire (${remainingToCheckin})`
          );
        }

        // Restore quantity to inventory item
        const dbItem = await tx.item.findUnique({
          where: { id: item.itemId },
        });

        if (!dbItem) {
          throw new Error(`Articolo ${item.itemId} non trovato`);
        }

        // Add returned quantity back to stock
        await tx.item.update({
          where: { id: item.itemId },
          data: {
            quantity: dbItem.quantity + item.qty,
          },
        });

        // Create CHECKIN transaction
        await tx.transaction.create({
          data: {
            itemId: item.itemId,
            type: "CHECKIN",
            qty: item.qty,
            note: `Check-in parziale da produzione: ${checkout.productionName} (${item.qty}/${checkoutTx.qty})`,
            productionCheckoutId: checkoutId,
          },
        });
      }

      // Verifica se tutti gli articoli sono stati completamente restituiti
      const allCheckouts = await tx.transaction.findMany({
        where: {
          productionCheckoutId: checkoutId,
          type: "CHECKOUT",
        },
      });

      const allCheckins = await tx.transaction.findMany({
        where: {
          productionCheckoutId: checkoutId,
          type: "CHECKIN",
        },
      });

      const isComplete = allCheckouts.every(checkout => {
        const totalCheckedIn = allCheckins
          .filter(checkin => checkin.itemId === checkout.itemId)
          .reduce((sum, checkin) => sum + checkin.qty, 0);
        return totalCheckedIn >= checkout.qty;
      });

      if (isComplete) {
        await tx.productionCheckout.update({
          where: { id: checkoutId },
          data: { status: "CLOSED" },
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Errore durante il check-in" },
      { status: 500 }
    );
  }
}

