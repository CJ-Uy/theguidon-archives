import { db } from "./db";
import { issues, categories, issueCategories } from "./schema";
import { and, eq, gte, lt, lte, sql, desc, asc } from "drizzle-orm";
import type { Issue } from "./schema";

const DEFAULT_PAGE_SIZE = 20;

export type ListIssuesParams = {
  categorySlug?: string | null;
  isLegacy?: boolean;
  search?: string | null;
  volume?: number | null;
  year?: number | null;
  from?: string | null;
  until?: string | null;
  page?: number;
  pageSize?: number;
  order?: "asc" | "desc";
};

export type ListIssuesResult = {
  issues: Issue[];
  found: number;
  page: number;
  maxPages: number;
  order: "asc" | "desc";
  pageSize: number;
};

function whereForList(p: ListIssuesParams) {
  const clauses = [eq(issues.status, "ready" as const)];
  if (p.isLegacy === true) clauses.push(eq(issues.isLegacy, true));
  else if (p.isLegacy === false) clauses.push(eq(issues.isLegacy, false));
  if (p.volume != null) clauses.push(eq(issues.volumeNum, p.volume));
  if (p.year != null) {
    clauses.push(gte(issues.datePublished, `${p.year}-01-01`));
    clauses.push(lt(issues.datePublished, `${p.year + 1}-01-01`));
  }
  if (p.from) clauses.push(gte(issues.datePublished, p.from));
  if (p.until) {
    // exclusive upper bound on the day after to avoid lex-comparison bugs
    // when timestamps carry millisecond precision suffixes
    const d = new Date(p.until);
    d.setUTCDate(d.getUTCDate() + 1);
    clauses.push(lt(issues.datePublished, d.toISOString().slice(0, 10)));
  }
  if (p.search && p.search.trim()) {
    const like$ = `%${p.search.trim()}%`;
    clauses.push(
      sql`(${issues.title} LIKE ${like$} OR ${issues.description} LIKE ${like$})`,
    );
  }
  return and(...clauses);
}

export async function listIssues(p: ListIssuesParams = {}): Promise<ListIssuesResult> {
  const page = p.page ?? 1;
  const pageSize = p.pageSize ?? DEFAULT_PAGE_SIZE;
  const order = p.order ?? "desc";

  const baseWhere = whereForList(p);

  if (p.categorySlug) {
    const rows = await db
      .select({ issue: issues })
      .from(issues)
      .innerJoin(issueCategories, eq(issueCategories.issueId, issues.id))
      .innerJoin(categories, eq(categories.id, issueCategories.categoryId))
      .where(and(baseWhere, eq(categories.slug, p.categorySlug)))
      .orderBy(order === "asc" ? asc(issues.datePublished) : desc(issues.datePublished))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    const countRows = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(issues)
      .innerJoin(issueCategories, eq(issueCategories.issueId, issues.id))
      .innerJoin(categories, eq(categories.id, issueCategories.categoryId))
      .where(and(baseWhere, eq(categories.slug, p.categorySlug)));

    const found = Number(countRows[0]?.count ?? 0);
    return {
      issues: rows.map((r) => r.issue),
      found,
      page,
      maxPages: Math.max(1, Math.ceil(found / pageSize)),
      order,
      pageSize,
    };
  }

  const rows = await db
    .select()
    .from(issues)
    .where(baseWhere)
    .orderBy(order === "asc" ? asc(issues.datePublished) : desc(issues.datePublished))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const countRows = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(issues)
    .where(baseWhere);

  const found = Number(countRows[0]?.count ?? 0);
  return {
    issues: rows,
    found,
    page,
    maxPages: Math.max(1, Math.ceil(found / pageSize)),
    order,
    pageSize,
  };
}

export async function getIssue(slug: string): Promise<Issue | null> {
  const rows = await db
    .select()
    .from(issues)
    .where(and(eq(issues.slug, slug), eq(issues.status, "ready" as const)))
    .limit(1);
  return rows[0] ?? null;
}

export async function getCategoriesForIssue(issueId: number): Promise<string[]> {
  const rows = await db
    .select({ slug: categories.slug })
    .from(issueCategories)
    .innerJoin(categories, eq(categories.id, issueCategories.categoryId))
    .where(eq(issueCategories.issueId, issueId));
  return rows.map((r) => r.slug);
}

export async function getMinMaxDates(): Promise<{ min: string; max: string }> {
  const row = await db
    .select({
      min: sql<string | null>`MIN(${issues.datePublished})`,
      max: sql<string | null>`MAX(${issues.datePublished})`,
    })
    .from(issues)
    .where(eq(issues.status, "ready" as const));
  const r = row[0];
  if (!r?.min || !r?.max) {
    return { min: new Date(1929, 5, 22).toISOString(), max: new Date().toISOString() };
  }
  return { min: r.min, max: r.max };
}

export async function getRandom(): Promise<Issue | null> {
  const rows = await db
    .select()
    .from(issues)
    .where(eq(issues.status, "ready" as const))
    .orderBy(sql`RANDOM()`)
    .limit(1);
  return rows[0] ?? null;
}
