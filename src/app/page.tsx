import PageFade from "@/components/PageFade";
import SearchAndFilter from "@/components/SearchAndFilter";
import { prisma } from "@/lib/prisma";
import type { Prisma, Category as CategoryModel } from "@prisma/client";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic"; // evita cache server-side in produzione, mostra sempre dati aggiornati

type ItemWithCategory = Prisma.ItemGetPayload<{ include: { category: true } }>;

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

  console.log('Loaded items:', visibleItems.length, 'categories:', categories.length);
  console.log('Items details:', visibleItems.map((item: ItemWithCategory) => ({ id: item.id, name: item.name, brand: item.brand, model: item.model })));

  return (
    <PageFade>
      <div className="space-y-4">
        <SearchAndFilter categories={categories} allItems={visibleItems} />
      </div>
    </PageFade>
  );
}
