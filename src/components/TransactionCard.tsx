"use client";
import jsPDF from "jspdf";
// @ts-ignore
import autoTable from "jspdf-autotable";
import { displayTitle } from "@/lib/format";

type ProductionCheckout = {
  id: number;
  productionName: string;
  name: string;
  surname: string;
  ente: string;
  email: string;
  telephone: string;
  pickupDate: Date | string;
  restitutionDate: Date | string;
  techPerson: string | null;
  type: string;
  createdAt: Date | string;
  transactions: Array<{
    id: number;
    qty: number;
    item: {
      id: number;
      name: string | null;
      brand: string | null;
      model: string | null;
      quantity: number;
    };
  }>;
};

type Props = {
  checkout: ProductionCheckout;
};
function formatDateTime(dateString: string) {
  return new Date(dateString).toLocaleString("it-IT", {
    dateStyle: 'short',
    timeStyle: 'short'
  });
}

export default function TransactionCard({ checkout }: Props) {
  const handleDownloadPDF = () => {
    const doc = new jsPDF();

    const now = new Date();
    const dateTime = now.toLocaleString("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    // Title
    doc.setFontSize(18);
    doc.text("Riepilogo Checkout", 14, 20);

    // Production Manager Info
    doc.setFontSize(12);
    doc.text("Dati Production Manager", 14, 35);
    doc.setFontSize(10);
    let yPos = 42;

    doc.setFontSize(11);
    doc.text(`Produzione: ${checkout.productionName}`, 14, yPos);
    yPos += 8;
    doc.setFontSize(10);

    doc.text(`Nome: ${checkout.name} ${checkout.surname}`, 14, yPos);
    yPos += 6;
    doc.text(`Ente: ${checkout.ente}`, 14, yPos);
    yPos += 6;
    doc.text(`Email: ${checkout.email}`, 14, yPos);
    yPos += 6;
    doc.text(`Telefono: ${checkout.telephone}`, 14, yPos);
    yPos += 6;
    doc.text(
      `Data e Ora Ritiro: ${new Date(checkout.pickupDate).toLocaleString("it-IT")}`,
      14,
      yPos
    );
    yPos += 6;
    doc.text(
      `Data e Ora Restituzione: ${new Date(checkout.restitutionDate).toLocaleString("it-IT")}`,
      14,
      yPos
    );
    if (checkout.techPerson) {
      yPos += 6;
      doc.text(`Tecnico: ${checkout.techPerson}`, 14, yPos);
    }

    // Items Table
    const tableData = checkout.transactions.map((t) => {
      const title = displayTitle(t.item) || t.item.name || "—";
      return [title, t.qty.toString()];
    });

    autoTable(doc, {
      startY: yPos + 10,
      head: [["Articolo", "Quantità"]],
      body: tableData,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [0, 0, 0] },
    });

    // Footer
    const finalY = (doc as any).lastAutoTable.finalY || yPos + 40;
    doc.setFontSize(8);
    doc.text(`Documento generato il ${dateTime}`, 14, finalY + 10);

    const fileName = `checkout_${checkout.productionName.replace(/[^a-zA-Z0-9]/g, "_")}_${new Date(checkout.pickupDate).toISOString().split("T")[0]}.pdf`;
    doc.save(fileName);
  };

  return (
    <button
      type="button"
      onClick={handleDownloadPDF}
      className="p-2 rounded-lg border hover:bg-zinc-50 transition inline-flex items-center justify-center"
      title="Scarica PDF recap"
      aria-label="Scarica PDF recap"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-zinc-600"
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
    </button>
  );
}
