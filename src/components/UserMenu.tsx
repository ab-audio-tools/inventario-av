"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type User = {
  id: number;
  username: string;
  role: "ADMIN" | "TECH" | "STANDARD";
} | null;

export default function UserMenu() {
  const router = useRouter();
  const [user, setUser] = useState<User>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((data) => {
        setUser(data.user);
      });
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  if (!user) {
    return (
      <a
        href="/login"
        className="text-sm text-zinc-700 hover:text-black transition"
      >
        Login
      </a>
    );
  }

  const roleLabels: Record<string, string> = {
    ADMIN: "Admin",
    TECH: "Tecnico",
    STANDARD: "Standard",
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="text-sm text-zinc-700 hover:text-black transition inline-flex items-center gap-1"
      >
        <span>{user.username}</span>
        <span className="text-xs text-zinc-500">({roleLabels[user.role]})</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full mt-2 right-0 bg-white border rounded-xl shadow-lg py-2 min-w-[160px] z-20">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full px-4 py-2 text-left text-sm hover:bg-zinc-50"
            >
              Logout
            </button>
          </div>
        </>
      )}
    </div>
  );
}

