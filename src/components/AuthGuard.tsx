"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import PageFade from "./PageFade";

type User = {
  id: number;
  username: string;
  role: "ADMIN" | "TECH" | "STANDARD";
} | null;

type Props = {
  children: React.ReactNode;
  requiredRole?: "ADMIN" | "TECH" | "STANDARD";
};

export default function AuthGuard({ children, requiredRole }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((data) => {
        if (!data.user) {
          router.push("/login");
          return;
        }

        setUser(data.user);

        // Check role if required
        if (requiredRole) {
          const roleHierarchy: Record<string, number> = {
            STANDARD: 1,
            TECH: 2,
            ADMIN: 3,
          };

          if (roleHierarchy[data.user.role] < roleHierarchy[requiredRole]) {
            router.push("/");
            return;
          }
        }
      })
      .catch(() => {
        router.push("/login");
      })
      .finally(() => setLoading(false));
  }, [router, pathname, requiredRole]);

  if (loading) {
    return (
      <PageFade>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-zinc-600">Caricamento...</div>
        </div>
      </PageFade>
    );
  }

  if (!user) {
    return null; // Redirect will happen
  }

  return <>{children}</>;
}

