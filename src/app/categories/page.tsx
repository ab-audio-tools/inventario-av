"use client";
import { useEffect, useState } from "react";
import PageFade from "@/components/PageFade";

type Category = {
  id: number;
  name: string;
  _count?: { items: number };
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      if (res.ok) {
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error("Error loading categories:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newCategoryName.trim()) {
      alert("Inserisci un nome per la categoria");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategoryName }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Errore durante la creazione");
        setCreating(false);
        return;
      }

      setNewCategoryName("");
      loadCategories();
    } catch (error) {
      alert("Errore di connessione");
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteCategory(id: number) {
    if (!confirm("Sei sicuro di voler eliminare questa categoria?")) {
      return;
    }

    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Errore durante l'eliminazione");
        return;
      }

      loadCategories();
    } catch (error) {
      alert("Errore di connessione");
    }
  }

  async function handleUpdateCategory(category: Category) {
    if (!category.name.trim()) {
      alert("Il nome della categoria non può essere vuoto");
      return;
    }

    try {
      const res = await fetch(`/api/categories/${category.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: category.name }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Errore durante l'aggiornamento");
        return;
      }

      setEditingCategory(null);
      loadCategories();
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
        <h1 className="text-2xl font-semibold mb-6">Gestione Categorie</h1>

        {/* Form nuova categoria */}
        <form onSubmit={handleCreateCategory} className="bg-white rounded-xl border p-4 mb-6">
          <h2 className="font-semibold mb-3">Nuova Categoria</h2>
          <div className="flex gap-3">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Nome categoria"
              className="flex-1 border rounded-xl px-3 py-2"
            />
            <button
              type="submit"
              disabled={creating || !newCategoryName.trim()}
              className="px-4 py-2 rounded-xl bg-light-blue text-white hover:opacity-90 transition disabled:opacity-40"
            >
              {creating ? "Creazione..." : "Crea"}
            </button>
          </div>
        </form>

        {/* Lista categorie */}
        {categories.length > 0 ? (
          <div className="bg-white rounded-xl overflow-hidden border">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3">Nome Categoria</th>
                  <th className="text-right p-3">Articoli</th>
                  <th className="text-right p-3">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr key={cat.id} className="border-t hover:bg-gray-50">
                    <td className="p-3">
                      {editingCategory?.id === cat.id ? (
                        <input
                          type="text"
                          value={editingCategory.name}
                          onChange={(e) =>
                            setEditingCategory({ ...editingCategory, name: e.target.value })
                          }
                          className="border rounded-xl px-3 py-2 w-full font-medium"
                          autoFocus
                        />
                      ) : (
                        <span className="font-medium">{cat.name}</span>
                      )}
                    </td>
                    <td className="p-3 text-right text-zinc-600">
                      {cat._count?.items ?? 0}
                    </td>
                    <td className="p-3 text-right">
                      {editingCategory?.id === cat.id ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleUpdateCategory(editingCategory)}
                            className="text-emerald-600 hover:underline text-sm font-medium"
                          >
                            Salva
                          </button>
                          <button
                            onClick={() => setEditingCategory(null)}
                            className="text-zinc-600 hover:underline text-sm"
                          >
                            Annulla
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setEditingCategory(cat)}
                            className="text-blue-600 hover:underline text-sm"
                          >
                            Modifica
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(cat.id)}
                            className="text-red-600 hover:underline text-sm"
                            disabled={(cat._count?.items ?? 0) > 0}
                            title={(cat._count?.items ?? 0) > 0 ? "Non puoi eliminare una categoria con articoli associati" : "Elimina categoria"}
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
            Nessuna categoria trovata.
          </div>
        )}
      </div>
    </PageFade>
  );
}
