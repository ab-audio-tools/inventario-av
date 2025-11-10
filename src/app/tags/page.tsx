"use client";
import { useEffect, useState } from "react";
import PageFade from "@/components/PageFade";

type Tag = {
  id: number;
  name: string;
  color: string | null;
  _count?: { items: number };
};

const PRESET_COLORS = [
  { name: "Blu", value: "#3b82f6" },
  { name: "Verde", value: "#10b981" },
  { name: "Rosso", value: "#ef4444" },
  { name: "Giallo", value: "#f59e0b" },
  { name: "Viola", value: "#8b5cf6" },
  { name: "Rosa", value: "#ec4899" },
  { name: "Indigo", value: "#6366f1" },
  { name: "Teal", value: "#14b8a6" },
  { name: "Arancione", value: "#f97316" },
  { name: "Grigio", value: "#6b7280" },
];

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(PRESET_COLORS[0].value);
  const [creating, setCreating] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);

  useEffect(() => {
    loadTags();
  }, []);

  async function loadTags() {
    try {
      const res = await fetch("/api/tags");
      const data = await res.json();
      if (res.ok) {
        setTags(data.tags || []);
      }
    } catch (error) {
      console.error("Error loading tags:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateTag(e: React.FormEvent) {
    e.preventDefault();
    if (!newTagName.trim()) {
      alert("Inserisci un nome per il tag");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTagName, color: newTagColor }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Errore durante la creazione");
        setCreating(false);
        return;
      }

      setNewTagName("");
      setNewTagColor(PRESET_COLORS[0].value);
      loadTags();
    } catch (error) {
      alert("Errore di connessione");
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteTag(id: number) {
    if (!confirm("Sei sicuro di voler eliminare questo tag?")) {
      return;
    }

    try {
      const res = await fetch(`/api/tags/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Errore durante l'eliminazione");
        return;
      }

      loadTags();
    } catch (error) {
      alert("Errore di connessione");
    }
  }

  async function handleUpdateTag(tag: Tag) {
    try {
      const res = await fetch(`/api/tags/${tag.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: tag.name, color: tag.color }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Errore durante l'aggiornamento");
        return;
      }

      setEditingTag(null);
      loadTags();
    } catch (error) {
      alert("Errore di connessione");
    }
  }

  if (loading) {
    return (
      <PageFade>
        <div className="max-w-4xl mx-auto">
          <div className="text-center text-zinc-600">Caricamento...</div>
        </div>
      </PageFade>
    );
  }

  return (
    <PageFade>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-semibold mb-6">Gestione Tag</h1>

        {/* Form nuovo tag */}
        <form onSubmit={handleCreateTag} className="bg-white rounded-xl border p-4 mb-6">
          <h2 className="font-semibold mb-3">Nuovo Tag</h2>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="text-sm text-zinc-600 mb-1 block">Nome tag</label>
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="es. Audio, Video, Luci..."
                className="w-full border rounded-xl px-3 py-2"
              />
            </div>
            <div className="w-48">
              <label className="text-sm text-zinc-600 mb-1 block">Colore</label>
              <select
                value={newTagColor}
                onChange={(e) => setNewTagColor(e.target.value)}
                className="w-full border rounded-xl px-3 py-2"
              >
                {PRESET_COLORS.map((color) => (
                  <option key={color.value} value={color.value}>
                    {color.name}
                  </option>
                ))}
              </select>
            </div>
            <div
              className="w-10 h-10 rounded-lg border-2 shrink-0"
              style={{ backgroundColor: newTagColor }}
            />
            <button
              type="submit"
              disabled={creating || !newTagName.trim()}
              className="px-4 py-2 rounded-xl bg-light-blue text-white hover:opacity-90 transition disabled:opacity-40"
            >
              {creating ? "Creazione..." : "Crea"}
            </button>
          </div>
        </form>

        {/* Lista tag */}
        {tags.length > 0 ? (
          <div className="bg-white rounded-xl overflow-hidden border">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3">Tag</th>
                  <th className="text-left p-3">Colore</th>
                  <th className="text-right p-3">Articoli</th>
                  <th className="text-right p-3">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {tags.map((tag) => (
                  <tr key={tag.id} className="border-t hover:bg-gray-50">
                    <td className="p-3">
                      {editingTag?.id === tag.id ? (
                        <input
                          type="text"
                          value={editingTag.name}
                          onChange={(e) =>
                            setEditingTag({ ...editingTag, name: e.target.value })
                          }
                          className="border rounded px-2 py-1 w-full"
                        />
                      ) : (
                        <span
                          className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-white font-medium"
                          style={{ backgroundColor: tag.color || "#6b7280" }}
                        >
                          {tag.name}
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      {editingTag?.id === tag.id ? (
                        <div className="flex items-center gap-2">
                          <select
                            value={editingTag.color || ""}
                            onChange={(e) =>
                              setEditingTag({ ...editingTag, color: e.target.value })
                            }
                            className="border rounded px-2 py-1"
                          >
                            {PRESET_COLORS.map((color) => (
                              <option key={color.value} value={color.value}>
                                {color.name}
                              </option>
                            ))}
                          </select>
                          <div
                            className="w-8 h-8 rounded border-2"
                            style={{ backgroundColor: editingTag.color || "#6b7280" }}
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div
                            className="w-8 h-8 rounded border-2"
                            style={{ backgroundColor: tag.color || "#6b7280" }}
                          />
                          <span className="text-zinc-600">
                            {PRESET_COLORS.find((c) => c.value === tag.color)?.name || "Personalizzato"}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-right text-zinc-600">
                      {tag._count?.items ?? 0}
                    </td>
                    <td className="p-3 text-right">
                      {editingTag?.id === tag.id ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleUpdateTag(editingTag)}
                            className="text-emerald-600 hover:underline text-sm"
                          >
                            Salva
                          </button>
                          <button
                            onClick={() => setEditingTag(null)}
                            className="text-zinc-600 hover:underline text-sm"
                          >
                            Annulla
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setEditingTag(tag)}
                            className="text-blue-600 hover:underline text-sm"
                          >
                            Modifica
                          </button>
                          <button
                            onClick={() => handleDeleteTag(tag.id)}
                            className="text-red-600 hover:underline text-sm"
                          >
                            Elimina
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white rounded-xl border p-6 text-center text-zinc-600">
            Nessun tag trovato. Crea il primo tag per organizzare i tuoi articoli.
          </div>
        )}
      </div>
    </PageFade>
  );
}
