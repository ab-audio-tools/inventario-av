"use client";
import { useEffect, useState } from "react";

type User = {
  id: number;
  username: string;
  name: string | null;
  role: "ADMIN" | "TECH" | "STANDARD" | "OFFICE" | "GUEST";
};

export default function UsersManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    role: "STANDARD" as "ADMIN" | "TECH" | "STANDARD" | "OFFICE" | "GUEST",
  });
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users || []);
      } else {
        setError(data.error || "Errore nel caricamento utenti");
      }
    } catch (error) {
      setError("Errore di connessione");
    } finally {
      setLoading(false);
    }
  }

  function startEdit(user: User) {
    setEditingId(user.id);
    setFormData({
      name: user.name || "",
      username: user.username,
      password: "",
      role: user.role,
    });
    setError("");
  }

  function cancelEdit() {
    setEditingId(null);
    setFormData({
      name: "",
      username: "",
      password: "",
      role: "STANDARD",
    });
    setError("");
  }

  async function handleSave(id: number) {
    setError("");
    if (!formData.username.trim()) {
      setError("Username richiesto");
      return;
    }

    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim() || null,
          username: formData.username.trim(),
          password: formData.password.trim() || undefined,
          role: formData.role,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Errore nell'aggiornamento");
        return;
      }

      cancelEdit();
      loadUsers();
    } catch (error) {
      setError("Errore di connessione");
    }
  }

  async function handleCreate() {
    setError("");
    if (!formData.username.trim()) {
      setError("Username richiesto");
      return;
    }
    if (!formData.password.trim()) {
      setError("Password richiesta per nuovi utenti");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim() || null,
          username: formData.username.trim(),
          password: formData.password.trim(),
          role: formData.role,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Errore nella creazione");
        return;
      }

      setFormData({
        name: "",
        username: "",
        password: "",
        role: "STANDARD",
      });
      loadUsers();
    } catch (error) {
      setError("Errore di connessione");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Sei sicuro di voler eliminare questo utente?")) {
      return;
    }

    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Errore nell'eliminazione");
        return;
      }

      loadUsers();
    } catch (error) {
      setError("Errore di connessione");
    }
  }

  const roleLabels: Record<string, string> = {
    ADMIN: "Admin",
    TECH: "Tecnico",
    STANDARD: "Standard",
    OFFICE: "Uffici",
    GUEST: "Guest",
  };

  if (loading) {
    return <div className="text-center text-zinc-600">Caricamento...</div>;
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Create new user form */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-lg font-semibold mb-4">Crea Nuovo Utente</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nome (opzionale)</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="Nome completo"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Username *</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="username"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password *</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="password"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Ruolo</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="STANDARD">Standard</option>
              <option value="TECH">Tecnico</option>
              <option value="ADMIN">Admin</option>
              <option value="OFFICE">Uffici</option>
              <option value="GUEST">Guest</option>
            </select>
          </div>
        </div>
        <div className="mt-4">
          <button
            type="button"
            onClick={handleCreate}
            disabled={creating}
            className="px-4 py-2 rounded-lg bg-light-blue text-white hover:opacity-90 transition disabled:opacity-40"
          >
            {creating ? "Creazione..." : "Crea Utente"}
          </button>
        </div>
      </div>

      {/* Users list */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3">Nome</th>
              <th className="text-left p-3">Username</th>
              <th className="text-left p-3">Ruolo</th>
              <th className="text-right p-3">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t">
                {editingId === user.id ? (
                  <>
                    <td className="p-3">
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full border rounded px-2 py-1"
                        placeholder="Nome"
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        className="w-full border rounded px-2 py-1"
                      />
                    </td>
                    <td className="p-3">
                      <select
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                        className="w-full border rounded px-2 py-1"
                      >
                        <option value="STANDARD">Standard</option>
                        <option value="TECH">Tecnico</option>
                        <option value="ADMIN">Admin</option>
                        <option value="OFFICE">Uffici</option>
                        <option value="GUEST">Guest</option>
                      </select>
                    </td>
                    <td className="p-3 text-right space-x-2">
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="border rounded px-2 py-1"
                        placeholder="Nuova password (opzionale)"
                      />
                      <button
                        type="button"
                        onClick={() => handleSave(user.id)}
                        className="px-3 py-1 bg-green-600 text-white rounded hover:opacity-90"
                      >
                        Salva
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="px-3 py-1 bg-gray-200 rounded hover:opacity-90"
                      >
                        Annulla
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="p-3">{user.name || "—"}</td>
                    <td className="p-3 font-medium">{user.username}</td>
                    <td className="p-3">
                      <span className="px-2 py-1 rounded-full text-xs bg-gray-100">
                        {roleLabels[user.role]}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => startEdit(user)}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:opacity-90 text-xs"
                      >
                        Modifica
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(user.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded hover:opacity-90 text-xs"
                      >
                        Elimina
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <div className="p-6 text-center text-zinc-600">Nessun utente trovato.</div>
        )}
      </div>
    </div>
  );
}

