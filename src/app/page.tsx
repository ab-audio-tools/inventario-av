import PageFade from "@/components/PageFade";
import SearchAndFilter from "@/components/SearchAndFilter";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic"; // evita cache server-side in produzione, mostra sempre dati aggiornati

export default async function Page() {
  console.log('Loading page data...');
  const session = await getSession();
  const isPrivileged = session && (session.role === "ADMIN" || session.role === "TECH");

  const [items, categories] = await Promise.all([
    prisma.item.findMany({
      where: isPrivileged ? undefined : { restricted: false },
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
