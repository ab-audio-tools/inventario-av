"use client";
import { useEffect, useMemo, useState } from "react";
import SearchBar from "@/components/SearchBar";
import CategoryFilter from "@/components/CategoryFilter";
import ItemCard from "@/components/ItemCard";
import SetCard from "@/components/SetCard";

type Category = { id: number; name: string };
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
  categoryId: number;
  category?: { id: number; name: string } | null;
};

type SetDto = {
  id: number;
  name: string;
  imageUrl?: string | null;
  available: number;
  restricted?: boolean; // deve essere sempre presente!
  items: { itemId: number; qty: number; name?: string | null; brand?: string | null; model?: string | null }[];
};

export default function SearchAndFilter({ categories, allItems, allSets = [] }: {
  categories: Category[]; allItems: Item[]; allSets?: SetDto[];
}) {
  console.log('SearchAndFilter rendering with items:', allItems.length);
  console.log('Items details:', allItems.map(item => ({ id: item.id, name: item.name, brand: item.brand, model: item.model })));
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<"all" | number>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/session")
      .then(r => r.json())
      .then(d => setUserRole(d.user?.role || null))
      .catch(() => setUserRole(null));
  }, []);

  const filteredItems = useMemo(() => {
    const ql = q.toLowerCase();
    return allItems.filter(it => {
      if (q) {
        const searchFields = [it.brand, it.model, it.name, it.typology, it.sku, it.description];
        const matchesQ = searchFields.some(field => (field || "").toLowerCase().includes(ql));
        const matchesC = cat === "all" ? true : it.categoryId === cat;
        return matchesQ && matchesC;
      }
      return cat === "all" ? true : it.categoryId === cat;
    });
  }, [q, cat, allItems]);

  const filteredSets = useMemo(() => {
    const ql = q.toLowerCase();
    return allSets.filter(s => {
      // Se restricted è undefined, trattalo come false (visibile a tutti)
      const isRestricted = !!s.restricted;
      if (isRestricted && userRole !== "ADMIN" && userRole !== "TECH") return false;
      if (!q) return true;
      return s.name.toLowerCase().includes(ql) || 
        s.items.some(i => (i.name || i.brand || i.model || "").toLowerCase().includes(ql));
    });
  }, [q, allSets, userRole]);

  return (
    <div className="w-full">
      <div className="flex gap-2 items-center">
        <SearchBar onChange={setQ} />
        <CategoryFilter categories={categories} value={cat} onChange={setCat} />
        <div className="flex gap-1 border rounded-xl overflow-hidden shrink-0">
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={`p-2 transition ${
              viewMode === "grid"
                ? "bg-light-blue text-white"
                : "bg-white text-zinc-600 hover:bg-zinc-50"
            }`}
            aria-label="Vista griglia"
            title="Vista griglia"
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
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`p-2 transition ${
              viewMode === "list"
                ? "bg-light-blue text-white"
                : "bg-white text-zinc-600 hover:bg-zinc-50"
            }`}
            aria-label="Vista lista"
            title="Vista lista"
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
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-2"}>
        {filteredItems.map((it) => (
          <div key={`item-${it.id}`} className="h-full">
            <ItemCard item={it} viewMode={viewMode} allSets={allSets} />
          </div>
        ))}
        {filteredSets.map((s) => (
          <div key={`set-${s.id}`} className="h-full">
            <SetCard set={s} userRole={userRole} />
          </div>
        ))}
      </div>

      {/* {viewMode === "grid" ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
          {filteredItems.map((it) => (
            <div key={`item-${it.id}`} className="h-full">
              <ItemCard item={it} />
            </div>
          ))}
          {filteredSets.map((s) => (
            <div key={`set-${s.id}`} className="h-full">
              <SetCard set={s} userRole={userRole} />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3 mt-4">
          {filteredItems.map((it) => (
            <div key={`item-${it.id}`}>
              <ItemCard item={it} viewMode="list" />
            </div>
          ))}
          {filteredSets.map((s) => (
            <div key={`set-${s.id}`}>
              <SetCard set={s} userRole={userRole} />
            </div>
          ))}
        </div>
      )} */}
    </div>
  );
}
