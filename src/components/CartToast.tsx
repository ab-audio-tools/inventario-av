"use client";
import { useEffect, useState } from "react";

type Line = { id:number; name:string; qty:number };

export default function CartToast() {
  const [msg, setMsg] = useState<Line | null>(null);

  useEffect(() => {
    function onAdded(e: any) {
      setMsg(e.detail as Line);
      const t = setTimeout(() => setMsg(null), 1200);
      return () => clearTimeout(t);
    }
    window.addEventListener("cart:added", onAdded as any);
    return () => window.removeEventListener("cart:added", onAdded as any);
  }, []);

  if (!msg) return null;

  return (
    <div className="fixed top-3 right-3 z-[60]">
      <div className="rounded-xl bg-black text-white text-sm px-3 py-2 shadow-lg">
        ✓ Aggiunto: <b>{msg.name}</b> × {msg.qty}
      </div>
    </div>
  );
}
