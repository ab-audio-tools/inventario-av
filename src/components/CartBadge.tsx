"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { readCart, distinctCount } from "@/lib/cart";

export default function CartBadge() {
  const [count, setCount] = useState(0);   // numero di articoli diversi
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    // iniziale: articoli unici
    setCount(distinctCount());

    function onChange(e: any) {
      const d = e.detail || {};
      // se l'evento fornisce 'distinct' usalo, altrimenti ricalcola
      const next = typeof d.distinct === "number" ? d.distinct : distinctCount();
      setCount(next);
      setPulse(true);
      const t = setTimeout(() => setPulse(false), 250);
      return () => clearTimeout(t);
    }
    window.addEventListener("cart:change", onChange as any);
    return () => window.removeEventListener("cart:change", onChange as any);
  }, []);

  return (
    <Link
      href="/cart"
      className="ml-auto inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm hover:shadow-sm transition relative"
      aria-label={`Carrello: ${count} articoli`}
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
      >
        <circle cx="8" cy="21" r="1" />
        <circle cx="19" cy="21" r="1" />
        <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
      </svg>
      <span>Carrello</span>
      <span
        className={`min-w-5 h-5 px-1 rounded-full bg-black text-white text-xs grid place-items-center ${
          pulse ? "animate-pulse" : ""
        }`}
      >
        {count}
      </span>
    </Link>
  );
}
