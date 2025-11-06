"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { displayTitle } from "@/lib/format";
import jsPDF from "jspdf";
// @ts-ignore
import autoTable from "jspdf-autotable";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  data: {
    productionName?: string;
    name: string;
    surname: string;
    ente: string;
    email: string;
    telephone: string;
    pickupDate: string;
    restitutionDate: string;
    techPerson: string;
    cart: any[];
    stockMap: Record<number, any>;
    transactionResults: any[];
  };
};

export default function CheckoutRecapModal({ isOpen, onClose, data }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  const downloadPDF = () => {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(18);
    doc.text("Riepilogo Checkout", 14, 20);

    // Production Manager Info
    doc.setFontSize(12);
    doc.text("Dati Production Manager", 14, 35);
    doc.setFontSize(10);
    let yPos = 42;

    if (data.productionName) {
      doc.setFontSize(11);
      doc.text(`Produzione: ${data.productionName}`, 14, yPos);
      yPos += 8;
      doc.setFontSize(10);
    }

    doc.text(`Nome: ${data.name} ${data.surname}`, 14, yPos);
    yPos += 6;
    doc.text(`Ente: ${data.ente}`, 14, yPos);
    yPos += 6;
    doc.text(`Email: ${data.email}`, 14, yPos);
    yPos += 6;
    doc.text(`Telefono: ${data.telephone}`, 14, yPos);
    yPos += 6;
    doc.text(`Data e Ora Ritiro: ${new Date(data.pickupDate).toLocaleString("it-IT", { dateStyle: 'short', timeStyle: 'short' })}`, 14, yPos);
    yPos += 6;
    doc.text(`Data e Ora Restituzione: ${new Date(data.restitutionDate).toLocaleString("it-IT", { dateStyle: 'short', timeStyle: 'short' })}`, 14, yPos);
    if (data.techPerson) {
      yPos += 6;
      doc.text(`Tecnico: ${data.techPerson}`, 14, yPos);
    }

    // Items Table
    let tableData: any[] = [];
    data.cart.forEach((item) => {
      const stockItem = data.stockMap[item.id];
      if (stockItem && stockItem.items && Array.isArray(stockItem.items) && stockItem.items.length > 0) {
        // È un set: mostra ogni componente
        stockItem.items.forEach((comp: any) => {
          tableData.push([
            `[SET] ${displayTitle(stockItem)} → ${displayTitle(comp.item)}`,
            (item.qty * comp.qty).toString()
          ]);
        });
      } else {
        const title = stockItem ? displayTitle(stockItem) : item.name;
        tableData.push([title, item.qty.toString()]);
      }
    });

    autoTable(doc, {
      startY: yPos + 10,
      head: [["Articolo", "Quantità"]],
      body: tableData,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [0, 0, 0] },
    });
    const now = new Date();
    const dateTime = now.toLocaleString("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    // Footer
    const finalY = (doc as any).lastAutoTable.finalY || yPos + 40;
    doc.setFontSize(8);
    doc.text(`Documento generato il ${dateTime}`, 14, finalY + 10);

    doc.save(`checkout_${data.surname}_${new Date(data.pickupDate).toISOString().split("T")[0]}.pdf`);
  };

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-light-blue/50 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-semibold">Riepilogo Checkout</h2>
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

        <div className="p-6 space-y-6">
          {/* Production Manager Info */}
          <div>
            <h3 className="font-semibold mb-4">Dati Production Manager</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              {data.productionName && (
                <div className="md:col-span-2">
                  <span className="text-zinc-500">Produzione:</span>{" "}
                  <span className="font-medium text-base">{data.productionName}</span>
                </div>
              )}
              <div>
                <span className="text-zinc-500">Nome:</span>{" "}
                <span className="font-medium">{data.name} {data.surname}</span>
              </div>
              <div>
                <span className="text-zinc-500">Ente:</span>{" "}
                <span className="font-medium">{data.ente}</span>
              </div>
              <div>
                <span className="text-zinc-500">Email:</span>{" "}
                <span className="font-medium">{data.email}</span>
              </div>
              <div>
                <span className="text-zinc-500">Telefono:</span>{" "}
                <span className="font-medium">{data.telephone}</span>
              </div>
              <div>
                <span className="text-zinc-500">Data e Ora Ritiro:</span>{" "}
                <span className="font-medium">
                  {new Date(data.pickupDate).toLocaleString("it-IT", {
                    dateStyle: 'short',
                    timeStyle: 'short'
                  })}
                </span>
              </div>
              <div>
                <span className="text-zinc-500">Data e Ora Restituzione:</span>{" "}
                <span className="font-medium">
                  {new Date(data.restitutionDate).toLocaleString("it-IT", {
                    dateStyle: 'short',
                    timeStyle: 'short'
                  })}
                </span>
              </div>
              {data.techPerson && (
                <div>
                  <span className="text-zinc-500">Tecnico:</span>{" "}
                  <span className="font-medium">{data.techPerson}</span>
                </div>
              )}
            </div>
          </div>

          {/* Items List */}
          <div>
            <h3 className="font-semibold mb-4">Articoli</h3>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500">
                      Articolo
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-zinc-500">
                      Quantità
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.cart.map((item, idx) => {
                    const stockItem = data.stockMap[item.id];
                    if (stockItem && stockItem.items && Array.isArray(stockItem.items) && stockItem.items.length > 0) {
                      // È un set: mostra ogni componente
                      return stockItem.items.map((comp: any, cidx: number) => (
                        <tr key={idx + "-" + cidx}>
                          <td className="px-4 py-3">
                            <span className="text-xs text-zinc-500">[SET] {displayTitle(stockItem)} → </span>
                            {displayTitle(comp.item)}
                          </td>
                          <td className="px-4 py-3 text-right font-medium">
                            {item.qty * comp.qty}
                          </td>
                        </tr>
                      ));
                    }
                    const title = stockItem ? displayTitle(stockItem) : item.name;
                    return (
                      <tr key={idx}>
                        <td className="px-4 py-3">{title}</td>
                        <td className="px-4 py-3 text-right font-medium">
                          {item.qty}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={downloadPDF}
              className="px-4 py-2 rounded-xl border hover:bg-zinc-50 transition flex items-center gap-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Scarica PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 rounded-xl bg-light-blue text-white hover:opacity-90 transition"
            >
              Chiudi
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

