"use client";
import { useEffect } from "react";

type Item = {
  id: number;
  brand?: string | null;
  model?: string | null;
  name?: string | null;
  typology?: string | null;
  sku?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  quantity: number;
  category?: { id: number; name: string } | null;
};

type Props = {
  item: Item;
  isOpen: boolean;
  onClose: () => void;
};

export default function ProductDetailModal({ item, isOpen, onClose }: Props) {
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
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleEscape);
    }
    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const displayTitle = () => {
    if (item.brand && item.model) {
      return `${item.brand} ${item.model}`;
    }
    return item.name || "—";
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop - blur and darken */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal Content */}
      <div
        className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-20">
          <h2 className="text-xl font-semibold">Dettagli</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-900 transition p-1"
            aria-label="Chiudi"
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

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wide">Nome</label>
            <h3 className="text-lg font-semibold mt-1">{displayTitle()}</h3>
          </div>

          {/* Top section: Image and Info centered */}
          <div className="flex justify-center gap-6">
            {/* Image */}
            <div className="w-48 h-48 bg-zinc-100 rounded-xl overflow-hidden shrink-0">
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={displayTitle()}
                  className="object-contain w-full h-full"
                />
              ) : (
                <div className="w-full h-full grid place-content-center text-zinc-400 text-sm">
                  Nessuna immagine
                </div>
              )}
            </div>

            {/* Info */}
            <div className="space-y-3">
              {item.typology && (
                <div>
                  <label className="text-xs text-zinc-500 uppercase tracking-wide">Tipologia</label>
                  <p className="text-sm mt-1">{item.typology}</p>
                </div>
              )}
              {item.category && (
                <div>
                  <label className="text-xs text-zinc-500 uppercase tracking-wide">Categoria</label>
                  <p className="text-sm mt-1">{item.category.name}</p>
                </div>
              )}
              <div>
                <label className="text-xs text-zinc-500 uppercase tracking-wide">Quantità Disponibile</label>
                <p className="text-sm mt-1 font-semibold">{item.quantity} pezzi</p>
              </div>
            </div>
          </div>

          {/* Description - Below */}
          {item.description && (
            <div className="pt-4 border-t">
              <label className="text-xs text-zinc-500 uppercase tracking-wide">Descrizione</label>
              <p className="text-sm text-zinc-700 mt-2 whitespace-pre-line">{item.description}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-black text-white hover:opacity-90 transition"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
}

