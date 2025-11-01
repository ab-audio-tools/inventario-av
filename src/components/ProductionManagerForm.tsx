"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { readCart, clearCart, CartLine } from "@/lib/cart";
import CheckoutRecapModal from "./CheckoutRecapModal";

type ProductionData = {
  productionName: string;
  name: string;
  surname: string;
  ente: string;
  email: string;
  telephone: string;
  pickupDate: string;
  restitutionDate: string;
  techPerson: string;
  tosAccepted: boolean;
};

type Props = {
  cart: CartLine[];
  stockMap: Record<number, any>;
};

export default function ProductionManagerForm({ cart, stockMap }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<ProductionData>({
    productionName: "",
    name: "",
    surname: "",
    ente: "",
    email: "",
    telephone: "",
    pickupDate: "",
    restitutionDate: "",
    techPerson: "",
    tosAccepted: false,
  });
  const [loading, setLoading] = useState(false);
  const [showRecap, setShowRecap] = useState(false);
  const [checkoutData, setCheckoutData] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.tosAccepted) {
      alert("Devi accettare i termini di servizio per continuare");
      return;
    }

    if (!form.productionName || !form.name || !form.surname || !form.email || !form.pickupDate || !form.restitutionDate) {
      alert("Compila tutti i campi obbligatori");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "CHECKOUT",
          items: cart.map((c) => ({ id: c.id, qty: c.qty })),
          productionData: form,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(`Errore: ${data.error ?? "operazione fallita"}`);
        setLoading(false);
        return;
      }

      setCheckoutData({
        ...form,
        cart,
        stockMap,
        transactionResults: data.results,
      });
      clearCart();
      setShowRecap(true);
    } catch (error) {
      alert("Errore durante il checkout");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="max-w-2xl mx-auto">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-4 text-sm text-zinc-600 hover:text-black flex items-center gap-2"
        >
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
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Indietro
        </button>

        <h1 className="text-2xl font-semibold mb-6">Production Manager</h1>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-2xl border">
          <div>
            <label className="block text-sm font-medium mb-2">
              Nome Produzione/Evento <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.productionName}
              onChange={(e) => setForm({ ...form, productionName: e.target.value })}
              className="w-full border rounded-xl px-3 py-2"
              placeholder="Nome della produzione o evento"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Nome <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border rounded-xl px-3 py-2"
                placeholder="Nome"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Cognome <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.surname}
                onChange={(e) => setForm({ ...form, surname: e.target.value })}
                className="w-full border rounded-xl px-3 py-2"
                placeholder="Cognome"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Ente/Organizzazione <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.ente}
              onChange={(e) => setForm({ ...form, ente: e.target.value })}
              className="w-full border rounded-xl px-3 py-2"
              placeholder="Nome ente o organizzazione"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full border rounded-xl px-3 py-2"
                placeholder="email@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Telefono <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={form.telephone}
                onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                className="w-full border rounded-xl px-3 py-2"
                placeholder="+39 123 456 7890"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Data Ritiro <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={form.pickupDate}
                onChange={(e) => setForm({ ...form, pickupDate: e.target.value })}
                className="w-full border rounded-xl px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Data Restituzione <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={form.restitutionDate}
                onChange={(e) => setForm({ ...form, restitutionDate: e.target.value })}
                className="w-full border rounded-xl px-3 py-2"
                min={form.pickupDate}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Persona Tecnica di Riferimento
            </label>
            <input
              type="text"
              value={form.techPerson}
              onChange={(e) => setForm({ ...form, techPerson: e.target.value })}
              className="w-full border rounded-xl px-3 py-2"
              placeholder="Nome tecnico responsabile"
            />
          </div>

          <div className="flex items-start gap-3 p-4 bg-zinc-50 rounded-xl">
            <input
              type="checkbox"
              id="tos"
              checked={form.tosAccepted}
              onChange={(e) => setForm({ ...form, tosAccepted: e.target.checked })}
              className="mt-1"
              required
            />
            <label htmlFor="tos" className="text-sm text-zinc-700 cursor-pointer">
              Accetto i termini di servizio e le condizioni di utilizzo <span className="text-red-500">*</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 rounded-xl border hover:bg-zinc-50 transition"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 rounded-xl bg-black text-white hover:opacity-90 transition disabled:opacity-40"
            >
              {loading ? "Elaborazione..." : "Conferma Checkout"}
            </button>
          </div>
        </form>
      </div>

      {showRecap && checkoutData && (
        <CheckoutRecapModal
          isOpen={showRecap}
          onClose={() => {
            setShowRecap(false);
            router.push("/");
          }}
          data={checkoutData}
        />
      )}
    </>
  );
}

