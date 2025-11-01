"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import jsPDF from "jspdf";
// @ts-ignore - jspdf-autotable doesn't have proper types
import autoTable from "jspdf-autotable";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function ExportModal({ isOpen, onClose }: Props) {
  const [format, setFormat] = useState<"excel" | "csv" | "pdf">("excel");
  const [loading, setLoading] = useState(false);

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

  const handleExport = async () => {
    setLoading(true);

    try {
      const res = await fetch("/api/items");
      const { items } = await res.json();

      if (!items || items.length === 0) {
        alert("Nessun articolo da esportare");
        setLoading(false);
        return;
      }

      const exportData = items.map((item: any) => ({
        brand: item.brand || "",
        model: item.model || "",
        name: item.name || "",
        typology: item.typology || "",
        category: item.category?.name || "",
        sku: item.sku || "",
        quantity: item.quantity || 0,
        description: item.description || "",
      }));

      const fileName = `inventario_${new Date().toISOString().split("T")[0]}`;

      if (format === "excel") {
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Articoli");
        XLSX.writeFile(wb, `${fileName}.xlsx`);
      } else if (format === "csv") {
        const csv = Papa.unparse(exportData);
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `${fileName}.csv`;
        link.click();
      } else if (format === "pdf") {
        const doc = new jsPDF();
        
        doc.setFontSize(16);
        doc.text("Inventario Articoli", 14, 15);

        autoTable(doc, {
          head: [["Brand", "Modello", "Nome", "Tipologia", "Categoria", "SKU", "Quantità"]],
          body: exportData.map((item: any) => [
            item.brand || "—",
            item.model || "—",
            item.name || "—",
            item.typology || "—",
            item.category || "—",
            item.sku || "—",
            item.quantity.toString(),
          ]),
          startY: 25,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [0, 0, 0] },
        });

        doc.save(`${fileName}.pdf`);
      }

      alert(`Esportazione completata: ${fileName}`);
      onClose();
    } catch (error) {
      alert("Errore durante l'esportazione");
    } finally {
      setLoading(false);
    }
  };

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-semibold">Esporta Articoli</h2>
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
          <div>
            <label className="block text-sm font-medium mb-3">
              Seleziona formato:
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-zinc-50 transition">
                <input
                  type="radio"
                  name="format"
                  value="excel"
                  checked={format === "excel"}
                  onChange={() => setFormat("excel")}
                  className="w-4 h-4"
                />
                <div className="flex-1">
                  <div className="font-medium">Excel (.xlsx)</div>
                  <div className="text-xs text-zinc-500">Formato Excel standard</div>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-zinc-50 transition">
                <input
                  type="radio"
                  name="format"
                  value="csv"
                  checked={format === "csv"}
                  onChange={() => setFormat("csv")}
                  className="w-4 h-4"
                />
                <div className="flex-1">
                  <div className="font-medium">CSV</div>
                  <div className="text-xs text-zinc-500">File di testo separato da virgole</div>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-zinc-50 transition">
                <input
                  type="radio"
                  name="format"
                  value="pdf"
                  checked={format === "pdf"}
                  onChange={() => setFormat("pdf")}
                  className="w-4 h-4"
                />
                <div className="flex-1">
                  <div className="font-medium">PDF</div>
                  <div className="text-xs text-zinc-500">Documento PDF</div>
                </div>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border hover:bg-zinc-50 transition"
            >
              Annulla
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-black text-white hover:opacity-90 transition disabled:opacity-40"
            >
              {loading ? "Esportazione..." : "Esporta"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

