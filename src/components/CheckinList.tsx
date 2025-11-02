"use client";
import { useEffect, useState } from "react";
import CheckinModal from "./CheckinModal";
import jsPDF from "jspdf";
// @ts-ignore
import autoTable from "jspdf-autotable";
import { displayTitle } from "@/lib/format";

type Transaction = {
  id: number;
  qty: number;
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
  surname: string;
  ente: string;
  pickupDate: string;
  restitutionDate: string;
  status: "OPEN" | "CLOSED";
  transactions: Transaction[];
};

export default function CheckinList() {
  const [checkouts, setCheckouts] = useState<ProductionCheckout[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCheckout, setSelectedCheckout] = useState<ProductionCheckout | null>(null);

  useEffect(() => {
    loadCheckouts();
  }, []);

  async function loadCheckouts() {
    try {
      const res = await fetch("/api/checkin/list");
      const data = await res.json();
      if (res.ok) {
        // Ora includiamo anche i check-in nel response
        setCheckouts(data.checkouts || []);
      }
    } catch (error) {
      console.error("Error loading checkouts:", error);
    } finally {
      setLoading(false);
    }
  }

  function handleCheckinComplete() {
    setSelectedCheckout(null);
    loadCheckouts();
  }

  function formatDateTime(dateString: string) {
    return new Date(dateString).toLocaleString("it-IT", {
      dateStyle: 'short',
      timeStyle: 'short'
    });
  }

  function generateCheckinPDF(checkout: ProductionCheckout) {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(18);
    doc.text("Stato Check-in", 14, 20);

    // Production Info
    doc.setFontSize(12);
    doc.text("Dati Produzione", 14, 35);
    doc.setFontSize(10);
    let yPos = 42;

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
    const tableData = checkout.transactions.map((t) => {
      // Calcola la quantità già restituita per questo item
      const checkedInQty = checkout.checkins?.filter(c => c.itemId === t.itemId)
        .reduce((sum, c) => sum + c.qty, 0) || 0;
      
      const remainingQty = t.qty - checkedInQty;
      const title = displayTitle(t.item);
      
      let status = "In attesa";
      if (checkedInQty > 0) {
        status = checkedInQty === t.qty ? "Completato" : "Parziale";
      }

      return [
        title,
        t.qty.toString(),
        checkedInQty.toString(),
        remainingQty.toString(),
        status
      ];
    });

    autoTable(doc, {
      startY: yPos,
      head: [["Articolo", "Qty Originale", "Qty Restituita", "Qty Rimanente", "Stato"]],
      body: tableData,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [0, 0, 0] },
    });

    // Footer
    const finalY = (doc as any).lastAutoTable.finalY || yPos + 40;
    doc.setFontSize(8);
    doc.text(
      `Riepilogo generato il ${new Date().toLocaleString("it-IT")}`,
      14,
      finalY + 10
    );

    return doc;
  }

  if (loading) {
    return <div className="text-center text-zinc-600">Caricamento...</div>;
  }

  return (
    <>
      {checkouts.length > 0 ? (
        <div className="bg-white rounded-xl overflow-hidden border">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3">Produzione</th>
                <th className="text-left p-3">Ordine di</th>
                <th className="text-left p-3">Ente</th>
                <th className="text-left p-3">Data Ritiro</th>
                <th className="text-left p-3">Data Restituzione</th>
                <th className="text-right p-3">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {checkouts.map((checkout) => (
                <tr key={checkout.id} className="border-t hover:bg-gray-50">
                  <td className="p-3 font-medium">{checkout.productionName}</td>
                  <td className="p-3">{checkout.name} {checkout.surname}</td>
                  <td className="p-3">{checkout.ente}</td>
                  <td className="p-3">
                    {formatDateTime(checkout.pickupDate)}
                  </td>
                  <td className="p-3">
                    {formatDateTime(checkout.restitutionDate)}
                  </td>
                  <td className="p-3 text-right space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        const doc = generateCheckinPDF(checkout);
                        doc.save(`checkin_${checkout.productionName.replace(/[^a-zA-Z0-9]/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`);
                      }}
                      className="px-3 py-1.5 bg-gray-600 text-white rounded-lg hover:opacity-90 transition text-sm"
                      title="Scarica PDF riepilogo"
                    >
                      PDF
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedCheckout(checkout)}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:opacity-90 transition text-sm"
                    >
                      Gestisci Check-in
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-xl border p-6 text-center text-zinc-600">
          Nessuna transazione aperta trovata.
        </div>
      )}

      {selectedCheckout && (
        <CheckinModal
          checkout={selectedCheckout}
          onClose={() => setSelectedCheckout(null)}
          onComplete={handleCheckinComplete}
        />
      )}
    </>
  );
}

