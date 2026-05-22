import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { issues, categories, issueCategories } from "@/lib/schema";
import { eq, inArray } from "drizzle-orm";

type CreateBody = {
  slug: string;
  title: string;
  datePublished: string;        // ISO
  description?: string;
  isLegacy?: boolean;
  unsureDate?: boolean;
  volumeNum?: number | null;
  issueNum?: number | null;
  numPages: number;
  categorySlugs?: string[];     // DB slugs: ["press-issue", ...]
  issueContent?: string;        // JSON string; defaults to "[]"
  contributors?: string;        // JSON string; defaults to "[]"
};

export async function POST(req: Request) {
  const body = (await req.json()) as CreateBody;

  if (!body.slug || !/^[a-z0-9-]+$/.test(body.slug)) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }
  if (!body.title || !body.datePublished) {
    return NextResponse.json({ error: "Missing title or datePublished" }, { status: 400 });
  }

  const existing = await db.select({ id: issues.id }).from(issues).where(eq(issues.slug, body.slug)).limit(1);
  if (existing.length > 0) {
    return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
  }

  const now = new Date();
  const inserted = await db.insert(issues).values({
    slug: body.slug,
    title: body.title,
    datePublished: body.datePublished,
    description: body.description ?? null,
    isLegacy: body.isLegacy ?? false,
    unsureDate: body.unsureDate ?? false,
    volumeNum: body.volumeNum ?? null,
    issueNum: body.issueNum ?? null,
    numPages: body.numPages ?? 0,
    hasPdf: false,
    hasPages: false,
    coverUploaded: false,
    status: "draft",
    issueContent: body.issueContent ?? "[]",
    contributors: body.contributors ?? "[]",
    createdAt: now,
    updatedAt: now,
  }).returning({ id: issues.id });

  const id = inserted[0]?.id;
  if (!id) return NextResponse.json({ error: "Insert failed" }, { status: 500 });

  if (body.categorySlugs && body.categorySlugs.length > 0) {
    const catRows = await db.select({ id: categories.id, slug: categories.slug })
      .from(categories)
      .where(inArray(categories.slug, body.categorySlugs));
    if (catRows.length > 0) {
      await db.insert(issueCategories).values(catRows.map((c) => ({ issueId: id, categoryId: c.id })));
    }
  }

  return NextResponse.json({ id });
}
