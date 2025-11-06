import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendNotification } from "@/lib/mailer";
import { getSession } from "@/lib/auth";

const hasRestrictedTag = (d?: string | null) => typeof d === "string" && d.includes("[PRIVATE]");

export async function POST(req: Request) {
  const session = await getSession();
  
  if (!session) {
    return NextResponse.json(
      { error: "Accesso negato" },
      { status: 403 }
    );
  }

  const { type, items, note, productionData } = await req.json();
  if (!type || !["CHECKIN", "CHECKOUT"].includes(type)) {
    return NextResponse.json({ error: "type" }, { status: 400 });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "items" }, { status: 400 });
  }

  // Build note with production manager data if present
  let transactionNote = note || "";
  if (productionData) {
    const prodNote = JSON.stringify({
      productionManager: {
        productionName: productionData.productionName,
        name: productionData.name,
        surname: productionData.surname,
        ente: productionData.ente,
        email: productionData.email,
        telephone: productionData.telephone,
        pickupDate: productionData.pickupDate,
        restitutionDate: productionData.restitutionDate,
        techPerson: productionData.techPerson,
      },
    });
    transactionNote = prodNote;
  }

  const results: any[] = [];
  let productionCheckoutId: number | null = null;

  try {
    await prisma.$transaction(async (tx) => {
      // Create ProductionCheckout if productionData exists and type is CHECKOUT
      if (productionData && type === "CHECKOUT") {
        const checkout = await tx.productionCheckout.create({
          data: {
            productionName: productionData.productionName,
            name: productionData.name,
            surname: productionData.surname,
            ente: productionData.ente,
            email: productionData.email,
            telephone: productionData.telephone,
            pickupDate: new Date(productionData.pickupDate),
            restitutionDate: new Date(productionData.restitutionDate),
            techPerson: productionData.techPerson || null,
            type: "CHECKOUT",
            status: "OPEN",
            userId: session.id,
          },
        });
        productionCheckoutId = checkout.id;
      }

      for (const it of items) {
        const lineId = Number(it.id);
        const lineQty = Number(it.qty);

        // Check if it's a Set first
        const set = await (tx as any).set.findUnique({
          where: { id: lineId },
          include: { items: true },
        });

        if (set) {
          // Permission check for restricted sets
          if (set.restricted && !["ADMIN", "TECH"].includes(session.role)) {
            throw new Error(`Operazione non consentita su set riservato (${set.name})`);
          }
          // Process each component
          for (const comp of set.items) {
            const compItem = await tx.item.findUnique({ where: { id: comp.itemId } });
            if (!compItem) throw new Error(`Item componente ${comp.itemId} non trovato`);
            const compQtyTotal = (type === "CHECKOUT" ? -1 : 1) * (lineQty * comp.qty);
            const newQty = compItem.quantity + compQtyTotal;
            if (newQty < 0) throw new Error(`Stock insufficiente per componente ${compItem.name}`);
            await tx.item.update({ where: { id: compItem.id }, data: { quantity: newQty } });
            const tr = await tx.transaction.create({
              data: {
                itemId: compItem.id,
                type,
                qty: lineQty * comp.qty,
                note: transactionNote,
                productionCheckoutId: productionCheckoutId || null,
              },
            });
            results.push({ item: compItem, tr, newQty, set: { id: set.id, name: set.name } });
          }
          continue;
        }

        // Otherwise treat as single Item
        const item = await tx.item.findUnique({ where: { id: lineId } });
        if (!item) throw new Error(`Item ${it.id} not found`);

        const isRestrictedItem = Boolean((item as any).restricted);
        if (isRestrictedItem && !["ADMIN", "TECH"].includes(session.role)) {
          throw new Error(`Operazione non consentita su articolo riservato (${item.name || (item as any).brand || (item as any).model || item.id})`);
        }

        const delta = type === "CHECKOUT" ? -lineQty : lineQty;
        const newQty = item.quantity + delta;
        if (newQty < 0) throw new Error(`Stock insufficiente per ${item.name}`);
        await tx.item.update({ where: { id: item.id }, data: { quantity: newQty } });
        const tr = await tx.transaction.create({
          data: {
            itemId: item.id,
            type,
            qty: lineQty,
            note: transactionNote,
            productionCheckoutId: productionCheckoutId || null,
          },
        });
        results.push({ item, tr, newQty });
      }
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }

  const rows = results
    .map((r) => {
      const base = `<tr><td>${r.item.name}</td><td>${r.tr.qty}</td><td>${r.newQty}</td></tr>`;
      if (r.set) {
        // annotate that this row belongs to a set
        return `<tr><td><i>Set: ${r.set.name}</i> · incl. ${r.item.name}</td><td>${r.tr.qty}</td><td>${r.newQty}</td></tr>`;
      }
      return base;
    })
    .join("");

  let html = `
    <p>Operazione: <b>${type}</b></p>
    <table border="1" cellpadding="6" cellspacing="0">
      <thead><tr><th>Articolo</th><th>Qty</th><th>Giacenza</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;

  // Add production manager info if present
  if (productionData) {
    html += `
      <h3>Production Manager</h3>
      ${productionData.productionName ? `<p><b>Produzione:</b> ${productionData.productionName}</p>` : ""}
      <p><b>Nome:</b> ${productionData.name} ${productionData.surname}</p>
      <p><b>Ente:</b> ${productionData.ente}</p>
      <p><b>Email:</b> ${productionData.email}</p>
      <p><b>Telefono:</b> ${productionData.telephone}</p>
      <p><b>Data Ritiro:</b> ${new Date(productionData.pickupDate).toLocaleString("it-IT", { dateStyle: "short", timeStyle: "short" })}</p>
      <p><b>Data Restituzione:</b> ${new Date(productionData.restitutionDate).toLocaleString("it-IT", { dateStyle: "short", timeStyle: "short" })}</p>
      ${productionData.techPerson ? `<p><b>Tecnico:</b> ${productionData.techPerson}</p>` : ""}
    `;
  }

  if (note && !productionData) {
    html += `<p>Note: ${note}</p>`;
  }

  try {
    await sendNotification(`Inventario AV – ${type}`, html);
  } catch (e) {
    console.warn("[mailer] Invio fallito, continuo senza bloccare:", e);
  }

  return NextResponse.json({ ok: true, results });
}