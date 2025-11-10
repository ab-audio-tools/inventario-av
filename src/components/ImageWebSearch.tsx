"use client";
import { useState } from "react";

type Props = {
  searchQuery: string;
  onImageSelected: (url: string) => void;
  onClose: () => void;
};

type ImageResult = {
  url: string;
  thumbnail: string;
  title: string;
  source: string;
};

export default function ImageWebSearch({ searchQuery, onImageSelected, onClose }: Props) {
  const [images, setImages] = useState<ImageResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  async function handleSearch() {
    setLoading(true);
    setError("");
    setSearched(true);
    
    try {
      const res = await fetch(`/api/search-images?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Errore nella ricerca");
      }
      
      setImages(data.images || []);
    } catch (err: any) {
      setError(err.message || "Errore di connessione");
      setImages([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectImage(imageUrl: string) {
    // Scarica l'immagine e caricala su Cloudinary o locale
    try {
      setLoading(true);
      const res = await fetch("/api/download-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Errore nel caricamento dell'immagine");
      }
      
      onImageSelected(data.url);
      onClose();
    } catch (err: any) {
      alert(err.message || "Errore nel caricamento dell'immagine");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div 
        className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Cerca immagine sul web</h2>
            <p className="text-sm text-zinc-500">Ricerca: {searchQuery}</p>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="text-zinc-500 hover:text-zinc-900 p-1 text-2xl leading-none"
          >
            ✕
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {!searched && (
            <div className="text-center py-12">
              <button
                onClick={handleSearch}
                disabled={loading}
                className="px-6 py-3 rounded-xl bg-light-blue text-white font-medium hover:opacity-90 disabled:opacity-40"
              >
                {loading ? "Ricerca in corso..." : "🔍 Cerca immagini"}
              </button>
            </div>
          )}

          {loading && searched && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-light-blue"></div>
              <p className="mt-4 text-zinc-600">Ricerca immagini in corso...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4">
              {error}
            </div>
          )}

          {searched && !loading && images.length === 0 && !error && (
            <div className="text-center py-12 text-zinc-500">
              Nessuna immagine trovata. Prova con una ricerca diversa.
            </div>
          )}

          {images.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((img, idx) => (
                <div 
                  key={idx} 
                  className="group relative aspect-square rounded-xl overflow-hidden border-2 border-transparent hover:border-light-blue cursor-pointer transition-all"
                  onClick={() => handleSelectImage(img.url)}
                >
                  <img 
                    src={img.thumbnail} 
                    alt={img.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder.svg';
                    }}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center">
                    <span className="text-white opacity-0 group-hover:opacity-100 font-medium">
                      Seleziona
                    </span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white text-xs truncate">{img.title}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t px-6 py-4 bg-zinc-50 flex justify-between items-center">
          <p className="text-sm text-zinc-600">
            {images.length > 0 && `${images.length} immagini trovate`}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border bg-white hover:bg-zinc-50"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
}
