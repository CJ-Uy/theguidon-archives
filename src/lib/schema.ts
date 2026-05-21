import {
  sqliteTable,
  text,
  integer,
  primaryKey,
  index,
} from "drizzle-orm/sqlite-core";

export const issues = sqliteTable(
  "issues",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    slug: text("slug").notNull().unique(),

    title: text("title").notNull(),
    datePublished: text("date_published").notNull(),
    unsureDate: integer("unsure_date", { mode: "boolean" }).notNull().default(false),
    isLegacy: integer("is_legacy", { mode: "boolean" }).notNull().default(false),
    numPages: integer("num_pages").notNull().default(0),
    shortlink: text("shortlink"),
    volumeNum: integer("volume_num"),
    issueNum: integer("issue_num"),
    description: text("description"),

    hasPdf: integer("has_pdf", { mode: "boolean" }).notNull().default(false),
    hasPages: integer("has_pages", { mode: "boolean" }).notNull().default(false),
    coverUploaded: integer("cover_uploaded", { mode: "boolean" }).notNull().default(false),
    status: text("status", { enum: ["draft", "processing", "ready"] })
      .notNull()
      .default("draft"),

    issueContent: text("issue_content").notNull().default("[]"),
    contributors: text("contributors").notNull().default("[]"),

    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (t) => ({
    byDate: index("idx_issues_date_published").on(t.datePublished),
    byVolume: index("idx_issues_volume").on(t.volumeNum),
    byLegacy: index("idx_issues_is_legacy").on(t.isLegacy),
    byStatus: index("idx_issues_status").on(t.status),
  }),
);

export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  label: text("label").notNull(),
});

export const issueCategories = sqliteTable(
  "issue_categories",
  {
    issueId: integer("issue_id")
      .notNull()
      .references(() => issues.id, { onDelete: "cascade" }),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.issueId, t.categoryId] }),
    byCategory: index("idx_issue_categories_category").on(t.categoryId),
  }),
);

export type Issue = typeof issues.$inferSelect;
export type NewIssue = typeof issues.$inferInsert;
export type Category = typeof categories.$inferSelect;
