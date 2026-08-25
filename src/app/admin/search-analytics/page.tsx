import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { SearchAnalyticsContent } from "@/components/admin/search-analytics-content";

export const dynamic = "force-dynamic";

export default async function AdminSearchAnalyticsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/auth/sign-in");

  return <SearchAnalyticsContent />;
}
