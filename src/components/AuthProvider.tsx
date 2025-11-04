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
      console.log('Checking session in production mode...');
      const sessionData = localStorage.getItem('user-session');
      console.log('Session data from localStorage:', sessionData);
      if (sessionData) {
        try {
          const user = JSON.parse(sessionData);
          console.log('Parsed user:', user);
          if (user) {
            setChecking(false);
            return;
          }
        } catch (error) {
          console.error('Error parsing session:', error);
        }
      }
      console.log('No valid session found, redirecting to login');
      router.push("/login");
      setChecking(false);
      return;
    }

    // In sviluppo, usa l'API normalmente
    console.log('Checking session in development mode...');
    fetch("/api/auth/session")
      .then((r) => {
        console.log('Session response status:', r.status);
        return r.json();
      })
      .then((data) => {
        console.log('Session data:', data);
        if (!data.user) {
          router.push("/login");
        }
      })
      .catch((error) => {
        console.error('Session check error:', error);
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

