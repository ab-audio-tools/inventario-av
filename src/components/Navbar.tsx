"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import CartBadge from "./CartBadge";
import StickyHeader from "./StickyHeader";
import ImportExportDropdown from "./ImportExportDropdown";
import UserMenu from "./UserMenu";

export default function Navbar() {
  const [user, setUser] = useState<{ role: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const res = await fetch("/api/auth/session");
        const data = await res.json();
        setUser(data.user || null);
      } catch (error) {
        console.error("Error loading session:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    
    loadSession();
    
    // Listen for storage events to refresh when login happens in another tab
    const handleStorage = () => {
      loadSession();
    };
    window.addEventListener("focus", loadSession);
    
    return () => {
      window.removeEventListener("focus", loadSession);
    };
  }, []);

  const canAccessNewItem = user?.role === "ADMIN" || user?.role === "TECH";
  const canAccessNewSet = canAccessNewItem;
  const canAccessTransactions = !!user && user.role !== "GUEST"; // i guest non vedono Movimenti
  const canAccessImportExport = user?.role === "ADMIN" || user?.role === "TECH" || user?.role === "OFFICE";
  const canAccessCategories = user?.role === "ADMIN" || user?.role === "TECH";

  const showCart = !!user && user.role !== "GUEST";

  return (
    <StickyHeader>
      <nav className="max-w-7xl mx-auto px-4 md:px-6 h-14 flex items-center gap-4">
        <Link href="/" className="font-semibold tracking-tight">Inventario AV</Link>
        <div className="hidden sm:flex items-center gap-3">
          {canAccessNewItem && (
            <>
              <Link href="/items/new" className="text-sm text-zinc-700 hover:text-black transition">Nuovo articolo</Link>
              <Link href="/sets/new" className="text-sm text-zinc-700 hover:text-black transition">Nuovo Set</Link>
            </>
          )}
          {canAccessCategories && (
            <Link href="/categories" className="text-sm text-zinc-700 hover:text-black transition">Gestione Categorie</Link>
          )}
          {canAccessTransactions && (
            <Link href="/transactions" className="text-sm text-zinc-700 hover:text-black transition">Movimenti</Link>
          )}
          {canAccessImportExport && <ImportExportDropdown />}
          {user?.role === "ADMIN" && (
            <>
              <Link href="/admin/users" className="text-sm text-zinc-700 hover:text-black transition">Utenti</Link>
              <Link href="/checkin" className="text-sm text-zinc-700 hover:text-black transition">Check-in</Link>
            </>
          )}
        </div>
        <div className="ml-auto flex items-center gap-3">
          {showCart && <CartBadge />}
          {!loading && <UserMenu />}
        </div>
      </nav>
    </StickyHeader>
  );
}
