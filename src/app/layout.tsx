import "@/styles/globals.css";
import Navbar from "@/components/Navbar";
import CartToast from "@/components/CartToast";
import AuthProvider from "@/components/AuthProvider";
import { ReactNode } from "react";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body className="min-h-screen bg-gradient-to-b from-zinc-50 to-white text-zinc-900">
        <AuthProvider>
          <Navbar />
          <CartToast />
          <main className="max-w-7xl mx-auto px-4 md:px-6 py-6">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
