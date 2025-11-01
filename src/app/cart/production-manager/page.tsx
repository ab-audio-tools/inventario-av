"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageFade from "@/components/PageFade";
import { readCart, CartLine } from "@/lib/cart";
import ProductionManagerForm from "@/components/ProductionManagerForm";

export default function ProductionManagerPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartLine[]>([]);
  const [stockMap, setStockMap] = useState<Record<number, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cartData = readCart();
    if (cartData.length === 0) {
      router.push("/cart");
      return;
    }
    setCart(cartData);

    fetch("/api/items")
      .then((r) => r.json())
      .then((data) => {
        const map: Record<number, any> = {};
        (data.items || []).forEach((it: any) => {
          map[it.id] = {
            id: it.id,
            quantity: it.quantity,
            imageUrl: it.imageUrl,
            name: it.name,
            brand: it.brand,
            model: it.model,
            typology: it.typology,
            category: it.category ?? null,
            description: it.description,
          };
        });
        setStockMap(map);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <PageFade>
        <div className="max-w-5xl mx-auto p-6">
          <div className="text-center text-zinc-600">Caricamento...</div>
        </div>
      </PageFade>
    );
  }

  return (
    <PageFade>
      <ProductionManagerForm cart={cart} stockMap={stockMap} />
    </PageFade>
  );
}

