"use client";
import { useEffect, useState } from "react";

export default function StickyHeader({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div className={`sticky top-0 z-40 backdrop-blur bg-white/80 border-b transition-shadow ${scrolled ? "shadow-sm" : ""}`}>
      {children}
    </div>
  );
}