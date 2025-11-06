import PageFade from "@/components/PageFade";
import SearchAndFilter from "@/components/SearchAndFilter";
import { prisma } from "@/lib/prisma";
import type { Prisma, Category as CategoryModel } from "@prisma/client";

export const dynamic = "force-dynamic"; // evita cache server-side in produzione, mostra sempre dati aggiornati

type ItemWithCategory = Prisma.ItemGetPayload<{ include: { category: true } }>;

export default async function Page() {
  console.log('Loading page data...');
  const [items, categories]: [ItemWithCategory[], CategoryModel[]] = await Promise.all([
    prisma.item.findMany({
      include: { category: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);
  console.log('Loaded items:', items.length, 'categories:', categories.length);
  console.log('Items details:', items.map((item: ItemWithCategory) => ({ id: item.id, name: item.name, brand: item.brand, model: item.model })));

  return (
    <PageFade>
      <div className="space-y-4">
        <SearchAndFilter categories={categories} allItems={items} />
      </div>
    </PageFade>
  );
}
