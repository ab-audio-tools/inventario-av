import PageFade from "@/components/PageFade";
import SearchAndFilter from "@/components/SearchAndFilter";
import { prisma } from "@/lib/prisma";
import type { Prisma, Category as CategoryModel } from "@prisma/client";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic"; // evita cache server-side in produzione, mostra sempre dati aggiornati

type ItemWithCategory = Prisma.ItemGetPayload<{ include: { category: true } }>;

type SetDto = {
  id: number;
  name: string;
  imageUrl?: string | null;
  available: number;
  restricted?: boolean;
  items: { itemId: number; qty: number; name?: string | null; brand?: string | null; model?: string | null }[];
};

export default async function Page() {
  console.log('Loading page data...');
  const session = await getSession();
  const isPrivileged = !!session && (session.role === "ADMIN" || session.role === "TECH");

  const [items, categories]: [ItemWithCategory[], CategoryModel[]] = await Promise.all([
    prisma.item.findMany({
      include: { category: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  const visibleItems = isPrivileged ? items : items.filter(i => !Boolean((i as any)?.restricted));

  // Carica i set dall'API interna
  const setsRaw = await (prisma as any).set.findMany({
    where: isPrivileged ? undefined : { restricted: false },
    include: {
      items: {
        include: { item: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Calcola la disponibilità per ogni set
  const visibleSets: SetDto[] = setsRaw.map((s: any) => {
    const available = s.items.length === 0
      ? 0
      : Math.max(
          0,
          Math.min(
            ...s.items.map((si: any) => Math.floor((si.item.quantity || 0) / Math.max(1, si.qty)))
          )
        );
    return {
      id: s.id,
      name: s.name,
      imageUrl: s.imageUrl,
      restricted: s.restricted,
      available,
      items: s.items.map((si: any) => ({
        itemId: si.itemId,
        qty: si.qty,
        name: si.item.name,
        brand: si.item.brand,
        model: si.item.model,
      })),
    };
  });

  console.log('Loaded items:', visibleItems.length, 'categories:', categories.length, 'sets:', visibleSets.length);
  console.log('Items details:', visibleItems.map((item: ItemWithCategory) => ({ id: item.id, name: item.name, brand: item.brand, model: item.model })));

  return (
    <PageFade>
      <div className="space-y-4">
        <SearchAndFilter categories={categories} allItems={visibleItems} allSets={visibleSets} />
      </div>
    </PageFade>
  );
}
