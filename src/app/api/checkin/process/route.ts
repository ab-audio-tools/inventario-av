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
      // Process each returned item
      for (const item of items) {
        const transaction = checkout.transactions.find(
          (t) => t.id === item.transactionId && t.itemId === item.itemId
        );

        if (!transaction) {
          throw new Error(`Transazione ${item.transactionId} non trovata`);
        }

        if (item.qty > transaction.qty) {
          throw new Error(
            `Quantità restituita (${item.qty}) superiore a quella prelevata (${transaction.qty})`
          );
        }

        // Restore quantity to item
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
            note: `Check-in da produzione: ${checkout.productionName}`,
            productionCheckoutId: checkoutId,
          },
        });
      }

      // Check if all items have been fully returned
      // Get all CHECKOUT transactions for this checkout
      const checkoutTransactions = await tx.transaction.findMany({
        where: {
          productionCheckoutId: checkoutId,
          type: "CHECKOUT",
        },
      });

      // Get all CHECKIN transactions for this checkout (including the ones we just created)
      const checkinTransactions = await tx.transaction.findMany({
        where: {
          productionCheckoutId: checkoutId,
          type: "CHECKIN",
        },
      });

      // Calculate total quantities by item
      const checkoutByItem: Record<number, number> = {};
      const checkinByItem: Record<number, number> = {};

      checkoutTransactions.forEach((t) => {
        checkoutByItem[t.itemId] = (checkoutByItem[t.itemId] || 0) + t.qty;
      });

      checkinTransactions.forEach((t) => {
        checkinByItem[t.itemId] = (checkinByItem[t.itemId] || 0) + t.qty;
      });

      // Check if all items have been fully returned
      const allItemsReturned = Object.keys(checkoutByItem).every(
        (itemId) =>
          checkinByItem[Number(itemId)] >= checkoutByItem[Number(itemId)]
      );

      // If all items fully returned, close the checkout
      if (allItemsReturned) {
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

