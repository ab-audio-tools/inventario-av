"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import PageFade from "@/components/PageFade";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Errore durante il login");
        setLoading(false);
        return;
      }

      // Save user session in localStorage for production
      if (data.user) {
        localStorage.setItem('user-session', JSON.stringify(data.user));
      }

      // Redirect to home and force refresh
      window.location.href = "/";
    } catch (error) {
      setError("Errore di connessione");
      setLoading(false);
    }
  };

  return (
    <PageFade>
      <div className="max-w-md mx-auto mt-20">
        <div className="bg-white rounded-2xl border p-8 shadow-lg">
          <h1 className="text-2xl font-semibold mb-6 text-center">
            Accedi a Inventario AV
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full border rounded-xl px-3 py-2"
                placeholder="Username"
                autoComplete="username"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full border rounded-xl px-3 py-2"
                placeholder="Password"
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 rounded-xl bg-black text-white hover:opacity-90 transition disabled:opacity-40 font-medium"
            >
              {loading ? "Accesso..." : "Accedi"}
            </button>
          </form>
        </div>
      </div>
    </PageFade>
  );
}

