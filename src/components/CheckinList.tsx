"use client";
import { useEffect, useState } from "react";
import CheckinModal from "./CheckinModal";

type Transaction = {
  id: number;
  qty: number;
  item: {
    id: number;
    name: string | null;
    brand: string | null;
    model: string | null;
    typology: string | null;
  };
};

type ProductionCheckout = {
  id: number;
  productionName: string;
  name: string;
  surname: string;
  ente: string;
  pickupDate: string;
  restitutionDate: string;
  status: "OPEN" | "CLOSED";
  transactions: Transaction[];
};

export default function CheckinList() {
  const [checkouts, setCheckouts] = useState<ProductionCheckout[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCheckout, setSelectedCheckout] = useState<ProductionCheckout | null>(null);

  useEffect(() => {
    loadCheckouts();
  }, []);

  async function loadCheckouts() {
    try {
      const res = await fetch("/api/checkin/list");
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

  function handleCheckinComplete() {
    setSelectedCheckout(null);
    loadCheckouts();
  }

  if (loading) {
    return <div className="text-center text-zinc-600">Caricamento...</div>;
  }

  return (
    <>
      {checkouts.length > 0 ? (
        <div className="bg-white rounded-xl overflow-hidden border">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3">Produzione</th>
                <th className="text-left p-3">Ordine di</th>
                <th className="text-left p-3">Ente</th>
                <th className="text-left p-3">Data Ritiro</th>
                <th className="text-left p-3">Data Restituzione</th>
                <th className="text-right p-3">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {checkouts.map((checkout) => (
                <tr key={checkout.id} className="border-t hover:bg-gray-50">
                  <td className="p-3 font-medium">{checkout.productionName}</td>
                  <td className="p-3">{checkout.name} {checkout.surname}</td>
                  <td className="p-3">{checkout.ente}</td>
                  <td className="p-3">
                    {new Date(checkout.pickupDate).toLocaleDateString("it-IT")}
                  </td>
                  <td className="p-3">
                    {new Date(checkout.restitutionDate).toLocaleDateString("it-IT")}
                  </td>
                  <td className="p-3 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedCheckout(checkout)}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:opacity-90 transition text-sm"
                    >
                      Gestisci Check-in
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-xl border p-6 text-center text-zinc-600">
          Nessuna transazione aperta trovata.
        </div>
      )}

      {selectedCheckout && (
        <CheckinModal
          checkout={selectedCheckout}
          onClose={() => setSelectedCheckout(null)}
          onComplete={handleCheckinComplete}
        />
      )}
    </>
  );
}

