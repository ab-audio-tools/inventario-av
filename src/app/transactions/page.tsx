"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageFade from "@/components/PageFade";
import TransactionCard from "@/components/TransactionCard";
import type { ProductionCheckout } from "@/types/checkout";


export default function TransactionsPage() {
  const router = useRouter();
  const [checkouts, setCheckouts] = useState<ProductionCheckout[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"open" | "closed">("open");

  useEffect(() => {
    loadCheckouts();
  }, [activeTab]);

  async function loadCheckouts() {
    try {
      const res = await fetch(`/api/transactions/list?status=${activeTab === "open" ? "OPEN" : "CLOSED"}`);
      const data = await res.json();
      if (res.ok) {
        setCheckouts(data.checkouts || []);
      }
    } catch (error) {
      console.error("Error loading checkouts:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <PageFade>
        <div className="max-w-5xl mx-auto">
          <div className="text-center text-zinc-600">Caricamento...</div>
        </div>
      </PageFade>
    );
  }

  return (
    <PageFade>
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-semibold mb-6">Transazioni</h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b">
          <button
            type="button"
            onClick={() => setActiveTab("open")}
            className={`px-4 py-2 font-medium transition ${
              activeTab === "open"
                ? "border-b-2 border-black text-black"
                : "text-zinc-600 hover:text-black"
            }`}
          >
            Transazioni Aperte
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("closed")}
            className={`px-4 py-2 font-medium transition ${
              activeTab === "closed"
                ? "border-b-2 border-black text-black"
                : "text-zinc-600 hover:text-black"
            }`}
          >
            Transazioni Chiuse
          </button>
        </div>

        {/* Table */}
        {checkouts.length > 0 ? (
          <div className="bg-white rounded-xl overflow-hidden border">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3">Produzione</th>
                  <th className="text-left p-3">Ordine di</th>
                  <th className="text-left p-3">Ente</th>
                  <th className="text-right p-3">PDF</th>
                </tr>
              </thead>
              <tbody>
                {checkouts.map((checkout) => (
                  <tr key={checkout.id} className="border-t">
                    <td className="p-3 font-medium">{checkout.productionName}</td>
                    <td className="p-3">{checkout.name} {checkout.surname}</td>
                    <td className="p-3">{checkout.ente}</td>
                    <td className="p-3 text-right">
                      <TransactionCard checkout={checkout} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white rounded-xl border p-6 text-center text-zinc-600">
            Nessuna transazione {activeTab === "open" ? "aperta" : "chiusa"} trovata.
          </div>
        )}
      </div>
    </PageFade>
  );
}
