"use client";
import { useEffect, useMemo, useState } from "react";
import ImageUploader from "@/components/ImageUploader";

export default function NewSetPage() {
  const [allItems, setAllItems] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [form, setForm] = useState({ name: "", imageUrl: "", restricted: false });
  const [components, setComponents] = useState<{ itemId: number; qty: number; name: string }[]>([]);

  useEffect(() => {
    fetch("/api/items").then(r => r.json()).then(d => setAllItems(d.items || [])).catch(() => setAllItems([]));
  }, []);

  const filtered = useMemo(() => {
    const ql = q.toLowerCase();
    return allItems.filter((it) => {
      const fields = [it.name, it.brand, it.model, it.typology, it.sku, it.description];
      return fields.some((f: string) => (f || "").toLowerCase().includes(ql));
    });
  }, [allItems, q]);

  function addComponent(it: any) {
    if (components.some(c => c.itemId === it.id)) return;
    setComponents([...components, { itemId: it.id, qty: 1, name: it.name || `${it.brand || ""} ${it.model || ""}`.trim() || `Item ${it.id}` }]);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || components.length === 0) {
      alert("Inserisci un nome e almeno un articolo nel set");
      return;
    }
    const res = await fetch("/api/sets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        imageUrl: form.imageUrl || null,
        restricted: !!form.restricted, // forza booleano
        items: components.map(c => ({ itemId: c.itemId, qty: c.qty })),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Errore creazione set");
      return;
    }
    alert("Set creato");
    setTimeout(() => {
      window.location.href = "/";
    }, 300); // piccolo delay per sicurezza
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Nuovo Set</h1>
      <form onSubmit={submit} className="space-y-4 bg-white p-4 rounded-2xl border">
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-zinc-600">Nome</label>
            <input className="w-full border rounded-xl px-3 py-2" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome set" />
          </div>
          <div className="flex items-center gap-2 pt-6">
            <input id="restricted" type="checkbox" checked={form.restricted} onChange={(e) => setForm({ ...form, restricted: e.target.checked })} />
            <label htmlFor="restricted" className="text-sm text-zinc-700">Visibile solo a Admin/Tech</label>
          </div>
        </div>

        <div>
          <ImageUploader label="Immagine set" value={form.imageUrl} onUploaded={(url) => setForm({ ...form, imageUrl: url })} />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="border rounded-2xl p-3">
            <div className="flex items-center gap-2 mb-2">
              <input className="w-full border rounded-xl px-3 py-2" placeholder="Cerca articoli..." value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <div className="max-h-72 overflow-auto divide-y">
              {filtered.map((it) => (
                <button key={it.id} type="button" onClick={() => addComponent(it)} className="w-full text-left py-2 px-2 hover:bg-zinc-50">
                  {(it.name || `${it.brand || ""} ${it.model || ""}`).trim() || `Item ${it.id}`}
                </button>
              ))}
            </div>
          </div>

          <div className="border rounded-2xl p-3">
            <div className="font-medium mb-2">Componenti del set</div>
            {components.length === 0 ? (
              <div className="text-sm text-zinc-500">Nessun articolo selezionato</div>
            ) : (
              <div className="space-y-2">
                {components.map((c, idx) => (
                  <div key={c.itemId} className="flex items-center gap-2">
                    <div className="flex-1 min-w-0 truncate">{c.name}</div>
                    <input type="number" min={1} className="w-20 border rounded-lg px-2 py-1 text-sm" value={c.qty}
                      onChange={(e) => {
                        const v = Math.max(1, Number(e.target.value) || 1);
                        const next = [...components];
                        next[idx] = { ...next[idx], qty: v };
                        setComponents(next);
                      }} />
                    <button type="button" className="text-sm text-red-600 hover:underline" onClick={() => setComponents(components.filter(x => x.itemId !== c.itemId))}>Rimuovi</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={!form.name || components.length === 0} className="px-4 py-2 rounded-xl bg-light-blue text-white disabled:opacity-40">
            Salva set
          </button>
        </div>
      </form>
    </div>
  );
}


