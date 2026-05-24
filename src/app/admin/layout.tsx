import { db } from "@/lib/db";
import { issues } from "@/lib/schema";
import { count, desc, max } from "drizzle-orm";
import { formatDate } from "@/lib/dates";
import AdminSidebar from "@/components/admin/sidebar";
import "./admin.css";

export const metadata = { title: "Admin | The GUIDON Archives" };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const [{ total }] = await db.select({ total: count() }).from(issues);
  const lastUpdatedRow = await db
    .select({ d: max(issues.datePublished) })
    .from(issues);
  const lastDate = lastUpdatedRow[0]?.d ?? null;

  const recent = await db
    .select({ id: issues.id, slug: issues.slug, title: issues.title })
    .from(issues)
    .orderBy(desc(issues.updatedAt))
    .limit(3);

  return (
    <div data-tw className="admin-theme min-h-screen">
      <div className="grid min-h-screen grid-cols-[17rem_minmax(0,1fr)]">
        <AdminSidebar
          totalIssues={total}
          lastPublished={lastDate ? formatDate(lastDate) : null}
          recent={recent}
        />
        <div className="admin-paper relative">{children}</div>
      </div>
    </div>
  );
}
