import PageFade from "@/components/PageFade";
import SearchAndFilter from "@/components/SearchAndFilter";
import SetCard from "@/components/SetCard";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic"; // evita cache server-side in produzione, mostra sempre dati aggiornati
export const runtime = "nodejs"; // forza runtime Node per compatibilità Prisma su Vercel

export default async function Page() {
  console.log('Loading page data...');
  const session = await getSession();
  const isPrivileged = session && (session.role === "ADMIN" || session.role === "TECH");

  const whereClause: any = isPrivileged ? undefined : { restricted: false };
  const [items, categories, setsResp] = await Promise.all([
    prisma.item.findMany({
      where: whereClause,
      include: { category: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    (async () => {
      // call our own API to compute set availability consistently
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/sets`, { cache: "no-store" }).catch(() => null);
      if (!res || !res.ok) return { sets: [] } as any;
      return res.json();
    })(),
  ]);
  console.log('Loaded items:', items.length, 'categories:', categories.length);
  console.log('Items details:', items.map(item => ({ id: item.id, name: item.name, brand: item.brand, model: item.model })));

  return (
    <PageFade>
      <div className="space-y-4">
        <SearchAndFilter categories={categories} allItems={items} />
        {Array.isArray(setsResp?.sets) && setsResp.sets.length > 0 && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-2">Set</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
              {setsResp.sets.map((s: any) => (
                <div key={s.id} className="h-full">
                  <SetCard set={s} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </PageFade>
  );
}
