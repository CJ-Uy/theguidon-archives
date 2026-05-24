import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { issues, categories, issueCategories } from "@/lib/schema";
import { eq } from "drizzle-orm";
import EditIssueForm from "@/components/admin/edit-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Edit Issue | Admin" };

export default async function AdminEditIssuePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idStr } = await params;
  const id = parseInt(idStr, 10);
  if (Number.isNaN(id)) notFound();

  const rows = await db.select().from(issues).where(eq(issues.id, id)).limit(1);
  const issue = rows[0];
  if (!issue) notFound();

  const cats = await db
    .select({ slug: categories.slug })
    .from(issueCategories)
    .innerJoin(categories, eq(issueCategories.categoryId, categories.id))
    .where(eq(issueCategories.issueId, id));

  return (
    <EditIssueForm
      issue={{
        id: issue.id,
        slug: issue.slug,
        title: issue.title,
        datePublished: issue.datePublished,
        description: issue.description,
        isLegacy: issue.isLegacy,
        unsureDate: issue.unsureDate,
        volumeNum: issue.volumeNum,
        issueNum: issue.issueNum,
        status: issue.status,
        hasPdf: issue.hasPdf,
        hasPages: issue.hasPages,
        coverUploaded: issue.coverUploaded,
        numPages: issue.numPages,
        issueContent: issue.issueContent,
        contributors: issue.contributors,
        categorySlugs: cats.map((c) => c.slug),
      }}
    />
  );
}
