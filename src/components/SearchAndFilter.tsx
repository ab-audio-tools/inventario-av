"use client";
import { useEffect, useMemo, useState } from "react";
import SearchBar from "@/components/SearchBar";
import CategoryFilter from "@/components/CategoryFilter";
import ItemCard from "@/components/ItemCard";
import SetCard from "@/components/SetCard";

type Category = { id: number; name: string };
type Tag = { id: number; name: string; color: string | null };
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
  tags?: { tag: Tag }[];
};

type SetDto = {
  id: number;
  name: string;
  imageUrl?: string | null;
  available: number;
  restricted?: boolean; // deve essere sempre presente!
  categoryId?: number | null; // <- nuovo campo
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
  const [sortBy, setSortBy] = useState<"category" | "tag" | "name-asc" | "name-desc">("category");

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
      const isRestricted = !!s.restricted;
      // filtro visibilità
      // userRole è nello scope del componente
      if (isRestricted && userRole !== "ADMIN" && userRole !== "TECH") return false;

      // filtro categoria (se selezionata)
      const matchCat = cat === "all" ? true : s.categoryId === cat;

      // filtro testo
      if (!q) return matchCat;
      const matchQ = s.name.toLowerCase().includes(ql) ||
        s.items.some(i => (i.name || i.brand || i.model || "").toLowerCase().includes(ql));
      return matchCat && matchQ;
    });
  }, [q, allSets, userRole, cat]);

  // Ordinamento items e sets
  const sortedItems = useMemo(() => {
    const items = [...filteredItems];
    
    switch (sortBy) {
      case "category":
        return items.sort((a, b) => {
          const catA = a.category?.name || "";
          const catB = b.category?.name || "";
          if (catA !== catB) return catA.localeCompare(catB);
          // Stesso category, ordina per nome
          const nameA = a.name || a.brand || a.model || "";
          const nameB = b.name || b.brand || b.model || "";
          return nameA.localeCompare(nameB);
        });
        
      case "tag":
        return items.sort((a, b) => {
          const tagA = a.tags?.[0]?.tag.name || "zzz"; // tag senza vanno alla fine
          const tagB = b.tags?.[0]?.tag.name || "zzz";
          if (tagA !== tagB) return tagA.localeCompare(tagB);
          // Stesso tag, ordina per nome
          const nameA = a.name || a.brand || a.model || "";
          const nameB = b.name || b.brand || b.model || "";
          return nameA.localeCompare(nameB);
        });
        
      case "name-asc":
        return items.sort((a, b) => {
          const nameA = a.name || a.brand || a.model || "";
          const nameB = b.name || b.brand || b.model || "";
          return nameA.localeCompare(nameB);
        });
        
      case "name-desc":
        return items.sort((a, b) => {
          const nameA = a.name || a.brand || a.model || "";
          const nameB = b.name || b.brand || b.model || "";
          return nameB.localeCompare(nameA);
        });
        
      default:
        return items;
    }
  }, [filteredItems, sortBy]);

  const sortedSets = useMemo(() => {
    // I set seguono lo stesso ordinamento (solo per categoria e nome)
    const sets = [...filteredSets];
    
    switch (sortBy) {
      case "category":
        return sets.sort((a, b) => {
          const catA = categories.find(c => c.id === a.categoryId)?.name || "";
          const catB = categories.find(c => c.id === b.categoryId)?.name || "";
          if (catA !== catB) return catA.localeCompare(catB);
          return a.name.localeCompare(b.name);
        });
        
      case "name-asc":
        return sets.sort((a, b) => a.name.localeCompare(b.name));
        
      case "name-desc":
        return sets.sort((a, b) => b.name.localeCompare(a.name));
        
      default:
        return sets;
    }
  }, [filteredSets, sortBy, categories]);

  return (
    <div className="w-full">
      <div className="flex gap-2 items-center mb-3">
        <SearchBar onChange={setQ} />
        <CategoryFilter categories={categories} value={cat} onChange={setCat} />
        
        {/* Selettore ordinamento */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="border rounded-xl px-3 py-2 bg-white text-sm shrink-0 h-10"
        >
          <option value="category">Ordina per Categoria</option>
          <option value="tag">Ordina per Tag</option>
          <option value="name-asc">Nome A → Z</option>
          <option value="name-desc">Nome Z → A</option>
        </select>
        
        <div className="flex gap-1 border rounded-xl overflow-hidden shrink-0 h-10 items-stretch">
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={`h-full px-3 transition flex items-center ${
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
            className={`h-full px-3 transition flex items-center ${
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

      <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-3" : "space-y-2 py-2"}>
        {sortedItems.map((it) => (
          <div key={`item-${it.id}`} className="h-full">
            <ItemCard item={it} viewMode={viewMode} allSets={allSets} />
          </div>
        ))}
        {sortedSets.map((s) => (
          <div key={`set-${s.id}`} className="h-full">
            <SetCard set={s} userRole={userRole} />
          </div>
        ))}
      </div>
    </div>
  );
}
