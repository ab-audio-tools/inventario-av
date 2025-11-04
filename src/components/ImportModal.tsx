"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import * as XLSX from "xlsx";
import Papa from "papaparse";

type ImportItem = {
  brand?: string;
  model?: string;
  name?: string;
  typology?: string;
  category?: string;
  sku?: string;
  quantity?: number;
  description?: string;
};

type DuplicateItem = {
  importItem: ImportItem;
  existingId: number;
  existingName: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function ImportModal({ isOpen, onClose }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<ImportItem[]>([]);
  const [duplicates, setDuplicates] = useState<DuplicateItem[]>([]);
  const [duplicateStrategy, setDuplicateStrategy] = useState<"overwrite" | "keep">("keep");
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      fetch("/api/categories")
        .then((r) => r.json())
        .then((data) => setCategories(data.categories || []));
    } else {
      document.body.style.overflow = "";
      setFile(null);
      setPreviewData([]);
      setDuplicates([]);
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setLoading(true);

    try {
      const ext = selectedFile.name.split(".").pop()?.toLowerCase();
      let data: ImportItem[] = [];

      if (ext === "csv") {
        const text = await selectedFile.text();
        const parsed = Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
        });
        data = parsed.data as ImportItem[];
        await processPreview(data);
      } else if (ext === "xlsx" || ext === "xls") {
        const arrayBuffer = await selectedFile.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        data = jsonData as ImportItem[];
        await processPreview(data);
      } else {
        alert("Formato file non supportato. Usa Excel (.xlsx, .xls) o CSV.");
        setFile(null);
      }
    } catch (error) {
      alert("Errore nella lettura del file");
      setFile(null);
    } finally {
      setLoading(false);
    }
  };

  const processPreview = async (data: ImportItem[]) => {
    setPreviewData(data);

    // Check for duplicates by SKU
    const skus = data
      .map((item) => item.sku)
      .filter((sku): sku is string => !!sku);
    
    if (skus.length > 0) {
      const res = await fetch("/api/items");
      const { items } = await res.json();
      const existingItems = items || [];

      const found: DuplicateItem[] = [];
      data.forEach((item) => {
        if (item.sku) {
          const existing = existingItems.find(
            (e: any) => e.sku === item.sku
          );
          if (existing) {
            found.push({
              importItem: item,
              existingId: existing.id,
              existingName: `${existing.brand || ""} ${existing.model || ""}`.trim() || existing.name || "—",
            });
          }
        }
      });

      setDuplicates(found);
    }
  };

  const downloadExample = () => {
    const exampleData = [
      {
        brand: "RCF",
        model: "ART 912-A",
        name: "",
        typology: "Diffusore attivo",
        category: "Diffusori",
        sku: "RCF-ART912A",
        quantity: 5,
        description: "Diffusore attivo 12 pollici",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(exampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Items");
    XLSX.writeFile(wb, "example_import.xlsx");
  };

  const handleImport = async () => {
    if (!file || previewData.length === 0) return;

    setLoading(true);

    try {
      // Map category names to IDs
      const categoryMap = new Map(
        categories.map((c) => [c.name.toLowerCase(), c.id])
      );

      const itemsToImport = previewData.map((item) => {
        const categoryId =
          categoryMap.get(item.category?.toLowerCase() || "") ||
          categories[0]?.id;

        return {
          brand: item.brand || null,
          model: item.model || null,
          name: item.name || null,
          typology: item.typology || null,
          categoryId: categoryId || 1,
          sku: item.sku || null,
          quantity: Number(item.quantity) || 0,
          description: item.description || null,
        };
      });

      const duplicatesToOverwrite = duplicates
        .filter((d) => duplicateStrategy === "overwrite")
        .map((d) => d.existingId);

      const res = await fetch("/api/items/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: itemsToImport,
          overwriteIds: duplicatesToOverwrite,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Errore durante l'importazione");
        return;
      }

      alert(`Importati ${data.count} articoli con successo`);
      onClose();
      window.location.reload();
    } catch (error) {
      alert("Errore durante l'importazione");
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
      <div className="absolute inset-0 bg-light-blue/50 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-semibold">Importa Articoli</h2>
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
          {/* Download Example */}
          <div>
            <button
              type="button"
              onClick={downloadExample}
              className="text-sm text-zinc-600 hover:text-zinc-900 underline flex items-center gap-2"
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
              Scarica file di esempio
            </button>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Seleziona file (Excel o CSV)
            </label>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="block w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-zinc-50 file:text-zinc-700 hover:file:bg-zinc-100"
            />
          </div>

          {/* Duplicates Handling */}
          {duplicates.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm font-medium text-yellow-800 mb-2">
                Trovati {duplicates.length} duplicati (SKU già esistenti):
              </p>
              <div className="space-y-2 mb-4">
                {duplicates.map((dup, idx) => (
                  <div key={idx} className="text-sm text-yellow-700">
                    <span className="font-medium">
                      {dup.importItem.brand} {dup.importItem.model} (
                      {dup.importItem.sku})
                    </span>
                    {" → "}
                    <span>Esistente: {dup.existingName}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="duplicateStrategy"
                    value="keep"
                    checked={duplicateStrategy === "keep"}
                    onChange={() => setDuplicateStrategy("keep")}
                  />
                  <span>Mantieni esistenti</span>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="duplicateStrategy"
                    value="overwrite"
                    checked={duplicateStrategy === "overwrite"}
                    onChange={() => setDuplicateStrategy("overwrite")}
                  />
                  <span>Sostituisci con nuovi</span>
                </label>
              </div>
            </div>
          )}

          {/* Preview */}
          {previewData.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-2">
                Anteprima ({previewData.length} articoli)
              </h3>
              <div className="border rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500">
                        Brand
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500">
                        Modello
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500">
                        Nome
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500">
                        SKU
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500">
                        Quantità
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {previewData.slice(0, 10).map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-3 py-2">{item.brand || "—"}</td>
                        <td className="px-3 py-2">{item.model || "—"}</td>
                        <td className="px-3 py-2">{item.name || "—"}</td>
                        <td className="px-3 py-2">{item.sku || "—"}</td>
                        <td className="px-3 py-2">{item.quantity || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {previewData.length > 10 && (
                  <div className="px-3 py-2 text-xs text-zinc-500 bg-zinc-50">
                    ... e altri {previewData.length - 10} articoli
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
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
              onClick={handleImport}
              disabled={!file || previewData.length === 0 || loading}
              className="px-4 py-2 rounded-xl bg-light-blue text-white hover:opacity-90 transition disabled:opacity-40"
            >
              {loading ? "Importazione..." : "Importa"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

