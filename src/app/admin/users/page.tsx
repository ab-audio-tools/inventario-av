import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import PageFade from "@/components/PageFade";
import UsersManagement from "@/components/UsersManagement";

export default async function UsersManagementPage() {
  const session = await getSession();
  
  if (!session) {
    redirect("/login");
  }

  // Only ADMIN can access user management
  if (session.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <PageFade>
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-semibold mb-6">Gestione Utenti</h1>
        <UsersManagement />
      </div>
    </PageFade>
  );
}

