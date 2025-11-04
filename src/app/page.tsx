import PageFade from "@/components/PageFade";
import SearchAndFilter from "@/components/SearchAndFilter";
import { prisma } from "@/lib/prisma";

export default async function Page() {
  console.log('Loading page data...');
  const [items, categories] = await Promise.all([
  prisma.item.findMany({
    include: { category: true },
    orderBy: { createdAt: "desc" },
  }),
  prisma.category.findMany({ orderBy: { name: "asc" } }),
]);
  console.log('Loaded items:', items.length, 'categories:', categories.length);
  console.log('Items details:', items.map(item => ({ id: item.id, name: item.name, brand: item.brand, model: item.model })));

  return (
    <PageFade>
      <div className="space-y-4">
        <SearchAndFilter categories={categories} allItems={items} />
      </div>
    </PageFade>
  );
}
