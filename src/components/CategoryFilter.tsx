"use client";

export default function CategoryFilter({
  categories,
  value,
  onChange,
}: {
  categories: { id: number; name: string }[];
  value?: number | "all";
  onChange: (v: number | "all") => void;
}) {
  return (
    <select
      value={value ?? "all"}
      onChange={(e) => onChange(e.target.value === "all" ? "all" : Number(e.target.value))}
      className="h-10 rounded-xl border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-black/10"
    >
      <option value="all">Tutte le categorie</option>
      {categories.map((c) => (
        <option key={c.id} value={c.id}>{c.name}</option>
      ))}
    </select>
  );
}
