import PageFade from "@/components/PageFade";
import SearchAndFilter from "@/components/SearchAndFilter";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic"; // evita cache server-side in produzione, mostra sempre dati aggiornati
export const runtime = "nodejs"; // forza runtime Node per compatibilità Prisma su Vercel

export default async function Page() {
  console.log('Loading page data...');
  const session = await getSession();
  const isPrivileged = session && (session.role === "ADMIN" || session.role === "TECH");

  const whereClause: any = isPrivileged ? undefined : { restricted: false };
  const [items, categories, sets] = await Promise.all([
    prisma.item.findMany({
      where: whereClause,
      include: { category: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.set.findMany({
      where: isPrivileged ? undefined : { restricted: false },
      include: { items: { include: { item: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  console.log('Loaded items:', items.length, 'categories:', categories.length);
  console.log('Items details:', items.map(item => ({ id: item.id, name: item.name, brand: item.brand, model: item.model })));

  // Compute set DTOs with availability
  const setsDto = sets.map((s: any) => {
    const available = s.items.length === 0 ? 0 : Math.max(0, Math.min(...s.items.map((si: any) => Math.floor((si.item.quantity || 0) / Math.max(1, si.qty)))));
    return {
      id: s.id,
      name: s.name,
      imageUrl: s.imageUrl,
      available,
      items: s.items.map((si: any) => ({ itemId: si.itemId, qty: si.qty, name: si.item.name, brand: si.item.brand, model: si.item.model })),
    };
  });

  return (
    <PageFade>
      <div className="space-y-4">
        <SearchAndFilter categories={categories} allItems={items} allSets={setsDto} />
      </div>
    </PageFade>
  );
}
