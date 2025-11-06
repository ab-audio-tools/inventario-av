"use client";
import { useCallback, useRef, useState } from "react";

type Props = {
  value?: string;
  onUploaded: (url: string) => void;
  label?: string;
  maxSizeMB?: number;
};

export default function ImageUploader({ value, onUploaded, label = "Immagine", maxSizeMB = 10 }: Props) {
  const [drag, setDrag] = useState(false);
  const [preview, setPreview] = useState<string | null>(value || null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Controlla se Cloudinary è configurato
  const cloudinaryCloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const cloudinaryUploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  const useCloudinary = Boolean(cloudinaryCloudName && cloudinaryUploadPreset);

  const uploadToCloudinary = async (file: File): Promise<string> => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("upload_preset", cloudinaryUploadPreset!);
    fd.append("folder", "inventario-av");

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudinaryCloudName}/image/upload`,
      { method: "POST", body: fd }
    );

    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error?.error?.message || "Upload Cloudinary fallito");
    }

    const data = await res.json();
    return data.secure_url;
  };

  const uploadToLocal = async (file: File): Promise<string> => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.error || "Upload fallito");
    }

    return data.url;
  };

  const onFiles = useCallback(async (files: FileList | null) => {
    if (!files || !files[0]) return;
    const file = files[0];

    if (!file.type.startsWith("image/")) {
      alert("Carica un'immagine (png, jpg, webp...)");
      return;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      alert(`Immagine troppo grande (max ${maxSizeMB}MB)`);
      return;
    }

    // anteprima immediata
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);
    setUploading(true);

    try {
      const url = useCloudinary 
        ? await uploadToCloudinary(file)
        : await uploadToLocal(file);
      
      onUploaded(url);
      setPreview(url);
    } catch (e: any) {
      setPreview(value || null);
      alert(e.message || "Errore di rete durante l'upload");
    } finally {
      setUploading(false);
    }
  }, [maxSizeMB, onUploaded, value, useCloudinary, cloudinaryCloudName, cloudinaryUploadPreset]);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {label && <label className="text-sm text-zinc-600">{label}</label>}
        {useCloudinary && (
          <span className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-md">
            ☁️ Cloudinary
          </span>
        )}
      </div>

      <div
        className={`mt-1 rounded-2xl border-2 border-dashed p-4 transition
          ${drag ? "border-emerald-500 bg-emerald-50" : "border-zinc-300 hover:border-zinc-400"}
          ${uploading ? "opacity-70" : ""}
        `}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          onFiles(e.dataTransfer.files);
        }}
      >
        <div className="flex items-center gap-4">
          <div className="w-24 h-24 rounded-xl bg-zinc-100 overflow-hidden shrink-0 flex items-center justify-center">
            {preview ? (
              <img src={preview} alt="preview" className="max-w-full max-h-full object-contain" />
            ) : (
              <span className="text-xs text-zinc-400">Nessuna immagine</span>
            )}
          </div>

          <div className="flex-1">
            <div className="text-sm">
              Trascina un'immagine qui
              <span className="mx-1 text-zinc-400">oppure</span>
              <button
                type="button"
                className="underline"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
              >
                scegli file
              </button>
            </div>
            <div className="text-xs text-zinc-500 mt-1">
              Formati: PNG, JPG, WEBP · Max {maxSizeMB}MB
            </div>
            {uploading && <div className="text-xs text-emerald-600 mt-1">Caricamento…</div>}
          </div>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onFiles(e.target.files)}
        />
      </div>
    </div>
  );
}