"use client";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { displayTitle } from "@/lib/format";
import jsPDF from "jspdf";
// @ts-ignore
import autoTable from "jspdf-autotable";

type Transaction = {
  id: number;
  qty: number;
  itemId: number;
  item: {
    id: number;
    name: string | null;
    brand: string | null;
    model: string | null;
    typology: string | null;
  };
};

type ProductionCheckout = {
  id: number;
  productionName: string;
  name: string;
  ente: string;
  pickupDate: string;
  restitutionDate: string;
  surname: string;
  transactions: Transaction[];
  checkins?: { itemId: number; qty: number }[];
};

type Props = {
  checkout: ProductionCheckout;
  onClose: () => void;
  onComplete: () => void;
};

type ItemCheckin = {
  transactionId: number;
  itemId: number;
  originalQty: number;
  returnedQty: number;
  checked: boolean;
};
 function formatDateTime(dateString: string) {
    return new Date(dateString).toLocaleString("it-IT", {
      dateStyle: 'short',
      timeStyle: 'short'
    });
  }

function generateCheckinPDF(checkout: ProductionCheckout, checkedItems: ItemCheckin[]) {
  const doc = new jsPDF();

  // Title
  doc.setFontSize(18);
  doc.text("Ricevuta Check-in", 14, 20);

  // Production Info
  doc.setFontSize(12);
  doc.text("Dati Produzione", 14, 35);
  doc.setFontSize(10);
  let yPos = 42;

  doc.text(`Produzione: ${checkout.productionName}`, 14, yPos);
  yPos += 6;
  doc.text(`Responsabile: ${checkout.name} ${checkout.surname}`, 14, yPos);
  yPos += 10;
  doc.text(`Produzione: ${checkout.productionName}`, 14, yPos);
    yPos += 6;
    doc.text(`Responsabile: ${checkout.name} ${checkout.surname}`, 14, yPos);
    yPos += 6;
    doc.text(`Ente: ${checkout.ente}`, 14, yPos);
    yPos += 6;
    doc.text(`Data Ritiro: ${formatDateTime(checkout.pickupDate)}`, 14, yPos);
    yPos += 6;
    doc.text(`Data Restituzione: ${formatDateTime(checkout.restitutionDate)}`, 14, yPos);
    yPos += 10;

  // Items Table
  const tableData = checkedItems.map((item) => {
    const transaction = checkout.transactions.find((t) => t.id === item.transactionId);
    const title = transaction ? displayTitle(transaction.item) : "—";
    return [
      title,
      item.originalQty.toString(),
      item.returnedQty.toString(),
      item.originalQty === item.returnedQty ? "Completo" : "Parziale"
    ];
  });

  autoTable(doc, {
    startY: yPos,
    head: [["Articolo", "Qty Originale", "Qty Restituita", "Stato"]],
    body: tableData,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [0, 0, 0] },
  });

  // Footer
  const finalY = (doc as any).lastAutoTable.finalY || yPos + 40;
  doc.setFontSize(8);
  doc.text(
    `Check-in effettuato il ${new Date().toLocaleString("it-IT")}`,
    14,
    finalY + 10
  );

  return doc;
}

export default function CheckinModal({ checkout, onClose, onComplete }: Props) {
  const [mounted, setMounted] = useState(false);
  const [items, setItems] = useState<ItemCheckin[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setMounted(true);
    // Calcola la quantità rimanente per ogni articolo e mostra solo quelli con quantità > 0
    const mapped = checkout.transactions
      .map((tx) => {
        const alreadyCheckedIn =
          checkout.checkins
            ?.filter((c) => c.itemId === tx.itemId)
            .reduce((sum: number, c: { itemId: number; qty: number }) => sum + c.qty, 0) || 0;
        const remainingQty = Math.max(0, tx.qty - alreadyCheckedIn);
        if (remainingQty <= 0) return null;
        return {
          transactionId: tx.id,
          itemId: tx.itemId,
          originalQty: remainingQty,
          returnedQty: remainingQty,
          checked: false,
        } as ItemCheckin;
      })
      .filter((x): x is ItemCheckin => x !== null);
    setItems(mapped);
  }, [checkout]);

  useEffect(() => {
    if (mounted) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mounted]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (mounted) window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [mounted, onClose]);

  function updateItemQty(index: number, qty: number) {
    setItems((prev) => {
      const updated = [...prev];
      const item = updated[index];
      // Only allow downward editing (can't return more than original)
      const newQty = Math.max(0, Math.min(qty, item.originalQty));
      updated[index] = { ...item, returnedQty: newQty };
      return updated;
    });
  }

  function toggleChecked(index: number) {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], checked: !updated[index].checked };
      return updated;
    });
  }

  async function handleProcessCheckin() {
    const checkedItems = items.filter((item) => item.checked && item.returnedQty > 0);

    if (checkedItems.length === 0) {
      setError("Seleziona almeno un articolo da restituire");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/checkin/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checkoutId: checkout.id,
          items: checkedItems.map((item) => ({
            transactionId: item.transactionId,
            itemId: item.itemId,
            qty: item.returnedQty,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Errore durante il check-in");
        setLoading(false);
        return;
      }

      // Generate and download PDF
      const doc = generateCheckinPDF(checkout, checkedItems);
      doc.save(`checkin_${checkout.productionName.replace(/[^a-zA-Z0-9]/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`);

      // Success - close modal and reload
      onComplete();
    } catch (error) {
      setError("Errore di connessione");
      setLoading(false);
    }
  }

  const allChecked = items.length > 0 && items.every((item) => item.checked);
  const allReturnedFull = items.every(
    (item) => !item.checked || item.returnedQty === item.originalQty
  );

  if (!mounted) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-semibold">Check-in: {checkout.productionName}</h2>
            <p className="text-sm text-zinc-600 mt-1">
              {checkout.name} {checkout.surname}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-900 transition p-1"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Articoli da restituire</h3>
            <button
              type="button"
              onClick={() => {
                setItems((prev) =>
                  prev.map((item) => ({ ...item, checked: !allChecked }))
                );
              }}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {allChecked ? "Deseleziona tutti" : "Seleziona tutti"}
            </button>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3 w-12">
                    <input
                      type="checkbox"
                      checked={allChecked}
                      onChange={() => {
                        setItems((prev) =>
                          prev.map((item) => ({ ...item, checked: !allChecked }))
                        );
                      }}
                      className="rounded"
                    />
                  </th>
                  <th className="text-left p-3">Articolo</th>
                  <th className="text-right p-3">Quantità da restituire</th>
                  <th className="text-right p-3">Quantità Restituita</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => {
                  const transaction = checkout.transactions.find(
                    (t) => t.id === item.transactionId
                  );
                  const itemTitle = transaction?.item
                    ? displayTitle(transaction.item)
                    : "—";

                  return (
                    <tr
                      key={item.transactionId}
                      className={`border-t ${item.checked ? "bg-blue-50" : ""}`}
                    >
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={item.checked}
                          onChange={() => toggleChecked(index)}
                          className="rounded"
                        />
                      </td>
                      <td className="p-3 font-medium">{itemTitle}</td>
                      <td className="p-3 text-right">{item.originalQty}</td>
                      <td className="p-3 text-right">
                        <input
                          type="number"
                          min="0"
                          max={item.originalQty}
                          value={item.returnedQty}
                          onChange={(e) =>
                            updateItemQty(index, parseInt(e.target.value) || 0)
                          }
                          disabled={!item.checked}
                          className="w-20 text-right border rounded px-2 py-1 disabled:opacity-50 disabled:bg-gray-100"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border hover:bg-zinc-50 transition"
              disabled={loading}
            >
              Annulla
            </button>
            <button
              type="button"
              onClick={handleProcessCheckin}
              disabled={loading || !items.some((item) => item.checked)}
              className="px-6 py-2 rounded-xl bg-black text-white hover:opacity-90 transition disabled:opacity-40"
            >
              {loading ? "Elaborazione..." : "Processa Check-in e Genera Ricevuta"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

