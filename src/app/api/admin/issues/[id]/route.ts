import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { issues, categories, issueCategories } from "@/lib/schema";
import { and, eq, inArray, ne } from "drizzle-orm";
import { deleteIssueAssets } from "@/lib/storage";

type PatchBody = {
  slug?: string;
  title?: string;
  datePublished?: string;
  description?: string | null;
  isLegacy?: boolean;
  unsureDate?: boolean;
  volumeNum?: number | null;
  issueNum?: number | null;
  hasPdf?: boolean;
  hasPages?: boolean;
  coverUploaded?: boolean;
  numPages?: number;
  status?: "draft" | "processing" | "ready";
  issueContent?: string;
  contributors?: string;
  categorySlugs?: string[];
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: idStr } = await params;
  const id = parseInt(idStr, 10);
  if (Number.isNaN(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const rows = await db.select().from(issues).where(eq(issues.id, id)).limit(1);
  const issue = rows[0];
  if (!issue) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const cats = await db
    .select({ slug: categories.slug })
    .from(issueCategories)
    .innerJoin(categories, eq(issueCategories.categoryId, categories.id))
    .where(eq(issueCategories.issueId, id));

  return NextResponse.json({ ...issue, categorySlugs: cats.map((c) => c.slug) });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: idStr } = await params;
  const id = parseInt(idStr, 10);
  if (Number.isNaN(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const body = (await req.json()) as PatchBody;

  if (body.slug !== undefined) {
    if (!/^[a-z0-9-]+$/.test(body.slug)) {
      return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
    }
    const clash = await db
      .select({ id: issues.id })
      .from(issues)
      .where(and(eq(issues.slug, body.slug), ne(issues.id, id)))
      .limit(1);
    if (clash.length > 0) {
      return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
    }
  }

  const update: Partial<typeof issues.$inferInsert> = { updatedAt: new Date() };
  if (body.slug !== undefined) update.slug = body.slug;
  if (body.title !== undefined) update.title = body.title;
  if (body.datePublished !== undefined) update.datePublished = body.datePublished;
  if (body.description !== undefined) update.description = body.description;
  if (body.isLegacy !== undefined) update.isLegacy = body.isLegacy;
  if (body.unsureDate !== undefined) update.unsureDate = body.unsureDate;
  if (body.volumeNum !== undefined) update.volumeNum = body.volumeNum;
  if (body.issueNum !== undefined) update.issueNum = body.issueNum;
  if (body.hasPdf !== undefined) update.hasPdf = body.hasPdf;
  if (body.hasPages !== undefined) update.hasPages = body.hasPages;
  if (body.coverUploaded !== undefined) update.coverUploaded = body.coverUploaded;
  if (body.numPages !== undefined) update.numPages = body.numPages;
  if (body.status !== undefined) update.status = body.status;
  if (body.issueContent !== undefined) update.issueContent = body.issueContent;
  if (body.contributors !== undefined) update.contributors = body.contributors;

  await db.update(issues).set(update).where(eq(issues.id, id));

  if (body.categorySlugs !== undefined) {
    await db.delete(issueCategories).where(eq(issueCategories.issueId, id));
    if (body.categorySlugs.length > 0) {
      const catRows = await db
        .select({ id: categories.id, slug: categories.slug })
        .from(categories)
        .where(inArray(categories.slug, body.categorySlugs));
      if (catRows.length > 0) {
        await db
          .insert(issueCategories)
          .values(catRows.map((c) => ({ issueId: id, categoryId: c.id })));
      }
    }
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: idStr } = await params;
  const id = parseInt(idStr, 10);
  if (Number.isNaN(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const rows = await db.select({ id: issues.id }).from(issues).where(eq(issues.id, id)).limit(1);
  if (rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    await deleteIssueAssets(id);
  } catch (err) {
    return NextResponse.json(
      { error: `R2 cleanup failed: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 },
    );
  }

  await db.delete(issueCategories).where(eq(issueCategories.issueId, id));
  await db.delete(issues).where(eq(issues.id, id));

  return NextResponse.json({ ok: true });
}
