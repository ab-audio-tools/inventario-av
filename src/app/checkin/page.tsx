import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import PageFade from "@/components/PageFade";
import CheckinList from "@/components/CheckinList";

export default async function CheckinPage() {
  const session = await getSession();
  
  if (!session) {
    redirect("/login");
  }

  // Only ADMIN can access check-in
  if (session.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <PageFade>
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-semibold mb-6">Check-in</h1>
        <CheckinList />
      </div>
    </PageFade>
  );
}

