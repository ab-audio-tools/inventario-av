"use client";
import { useState, useEffect } from "react";

export default function SearchBar({ onChange }: { onChange: (q: string) => void }) {
  const [q, setQ] = useState("");
  useEffect(() => { const t = setTimeout(() => onChange(q), 250); return () => clearTimeout(t); }, [q, onChange]);

  return (
    <div className="relative w-full md:w-1/2">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Cerca per nome o SKU…"
        className="w-full rounded-xl border bg-white px-4 py-2.5 pr-10 outline-none focus:ring-2 focus:ring-black/10"
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400">⌘K</span>
    </div>
  );
}
