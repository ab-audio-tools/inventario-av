"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const publicRoutes = ["/login"];

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (publicRoutes.includes(pathname)) {
      setChecking(false);
      return;
    }

    // In produzione, controlla localStorage invece dell'API
    if (process.env.NODE_ENV === 'production') {
      const sessionData = localStorage.getItem('user-session');
      if (sessionData) {
        try {
          const user = JSON.parse(sessionData);
          if (user) {
            setChecking(false);
            return;
          }
        } catch (error) {
          console.error('Error parsing session:', error);
        }
      }
      router.push("/login");
      setChecking(false);
      return;
    }

    // In sviluppo, usa l'API normalmente
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((data) => {
        if (!data.user) {
          router.push("/login");
        }
      })
      .catch(() => {
        router.push("/login");
      })
      .finally(() => setChecking(false));
  }, [pathname, router]);

  if (checking && !publicRoutes.includes(pathname)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-zinc-600">Caricamento...</div>
      </div>
    );
  }

  return <>{children}</>;
}

