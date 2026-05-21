# Cloudflare Migration — Design Spec

**Date:** 2026-05-21
**Branch:** `cloudflare-migration`
**Scope of this spec:** foundation + schema design (one of five planned sub-projects).

## Background

The current repository is a Vite + React 18 SPA serving `archives.theguidon.com`. All data (issues, search, PDFs, cover images) is fetched at runtime from a WordPress REST API at `api.theguidon.com/archives/wp-json/api/v1/`. Deployment is via a `deploy.bat` script that force-pushes `dist/` to a `gh-pages` branch.

This spec defines the foundation work for migrating off WordPress entirely to a Cloudflare-native stack: Next.js running on Cloudflare Workers via `@opennextjs/cloudflare`, with D1 as the database, R2 for assets, and Drizzle ORM as the query layer.

## Goals

- Replace the Vite scaffold with a working Next.js 15 + TypeScript application that builds and starts under `next dev` and `wrangler dev`.
- Provision a single D1 database and a single R2 bucket in the **CJ-Uy** Cloudflare account, both named `theguidon-archives`.
- Wire bindings into `wrangler.jsonc` and into the Next.js dev runtime via `@opennextjs/cloudflare`.
- Land a Drizzle schema that covers the WP API's data shape and accommodates a future admin upload flow (PDF → per-page WebP).
- Generate and apply an initial Drizzle migration to the local D1 instance.
- Resolve `pnpm audit` vulnerabilities introduced or surfaced by the dependency change.
- Do **not** port the existing React app this session. The Vite app is removed; a placeholder Next.js page ships in its place.
- Do **not** import data from the WordPress API or upload any PDFs to R2 this session.
- Do **not** ship an admin upload UI this session. The schema and storage helpers must support one in a follow-up.

## Non-goals (deferred to follow-up sessions)

- Porting React pages and components from `src/pages` / `src/components` to the App Router.
- Replacing Redux Toolkit slices and async thunks with Drizzle queries.
- WordPress → D1 data import script.
- Migrating PDFs and cover images from `archives.theguidon.com` to R2.
- Admin upload UI (file picker, pdf.js worker, WebP encoder, progress UI).
- Authentication for the admin route.
- Custom DNS pointing `cdn.theguidon.com` at the R2 bucket.
- Replacing the gh-pages deploy with a Cloudflare Pages / Workers deploy. The old `deploy.bat` is removed but no new deploy automation is added.

## Stack decisions

| Concern | Choice | Reason |
| --- | --- | --- |
| Framework | Next.js 15 App Router | Required by the Drizzle guide; integrates with `@opennextjs/cloudflare` |
| Runtime | Cloudflare Workers via `@opennextjs/cloudflare` | Matches the guide; native D1 binding access; edge cache for free |
| Language | TypeScript everywhere | Drizzle inference and Cloudflare binding types depend on TS |
| Database | Cloudflare D1 (SQLite) | One row per issue, ~339 rows from current WP catalog, well under D1 free tier |
| ORM | Drizzle ORM (`drizzle-orm/d1`) | Per the supplied guide; type-safe queries; first-class D1 driver |
| Object storage | Cloudflare R2 | PDFs + per-page WebPs + cover images; S3-compatible API for presigned URLs |
| Styling | Keep existing CSS, relocate as-is | YAGNI on Tailwind for this phase; CSS migrates 1:1 during the later port |
| Client state | TBD next session | Redux Toolkit may be replaced with React state + server components |

## Cloudflare resources

Both created with the wrangler CLI against the CJ-Uy account (ID `8527ec1369d46f55304a6f59ab5356e4`):

```bash
npx wrangler d1 create theguidon-archives
npx wrangler r2 bucket create theguidon-archives
```

The D1 database UUID returned by `d1 create` is recorded into `wrangler.jsonc`. The R2 bucket is referenced by name.

### wrangler.jsonc

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "theguidon-archives",
  "main": ".open-next/worker.js",
  "compatibility_date": "2025-05-21",
  "compatibility_flags": ["nodejs_compat"],
  "assets": {
    "directory": ".open-next/assets",
    "binding": "ASSETS"
  },
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "theguidon-archives",
      "database_id": "<uuid from wrangler d1 create>"
    }
  ],
  "r2_buckets": [
    {
      "binding": "R2",
      "bucket_name": "theguidon-archives"
    }
  ]
}
```

`nodejs_compat` is mandatory — Drizzle's internals reach for `node:crypto` and similar Node APIs.

## Project structure (post-migration)

```
theguidon-archives/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout; placeholder this session
│   │   └── page.tsx                # Placeholder home
│   ├── lib/
│   │   ├── db.ts                   # Lazy Proxy DB client (per the supplied guide)
│   │   ├── schema.ts               # Drizzle schema (see below)
│   │   └── storage.ts              # R2 key conventions + presign helpers
│   └── styles/                     # Will host the migrated CSS in a later session
├── drizzle/                        # Generated migrations land here
├── docs/superpowers/specs/         # This spec lives here
├── content_script/                 # Existing Python helpers preserved
├── public/                         # Existing static assets preserved
├── .env.local.example
├── .gitignore
├── CLAUDE.md
├── README.md
├── drizzle.config.ts
├── next.config.ts
├── open-next.config.ts
├── tsconfig.json
├── wrangler.jsonc
└── package.json
```

### Files removed in this session

- `index.html`
- `vite.config.js`
- `.eslintrc.cjs` (Next.js bundles its own ESLint setup)
- `deploy.bat`
- All of `src/` except the placeholder above. The existing `App.jsx`, `main.jsx`, `pages/`, `components/`, `redux/`, `utils/`, `data/`, and `assets/` directories are deleted. They will be reintroduced incrementally during the port phase.

> The fonts under `src/assets/fonts/` and CSS under `src/assets/css/` are moved to a `src/styles/` subdirectory and the fonts moved to `public/fonts/` to preserve them for the port. They are not wired into any component yet.

## Drizzle schema (`src/lib/schema.ts`)

```ts
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
    datePublished: text("date_published").notNull(), // ISO 8601 string, sortable lexicographically
    unsureDate: integer("unsure_date", { mode: "boolean" }).notNull().default(false),
    isLegacy: integer("is_legacy", { mode: "boolean" }).notNull().default(false),
    numPages: integer("num_pages").notNull().default(0),
    shortlink: text("shortlink"),
    volumeNum: integer("volume_num"),
    issueNum: integer("issue_num"),
    description: text("description"),

    // Asset state. Object URLs are derived from id; see src/lib/storage.ts.
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
```

### Notes on schema decisions

- **`id` is the storage key source, `slug` is the URL key.** Renaming a slug never moves R2 objects.
- **`issueContent` and `contributors` are JSON strings, not joined tables.** The existing frontend already calls `JSON.parse` on these blobs from the WP API; matching that shape minimizes port friction. A future FTS5 virtual table can index them if search needs improvement.
- **`is_legacy` is a boolean on the row, not a category.** Matches the WP API behavior where the `legacy=true` query parameter is mutually exclusive with `categ=...`.
- **`status` is a state machine for upload.** `draft` → `processing` → `ready`. Public list/detail queries filter `status = 'ready'`.

### Categories seed data

Inserted by the first migration:

| slug | label |
| --- | --- |
| `press-issue` | Press Issues |
| `graduation-magazine` | Graduation Magazines |
| `freshmanual` | Freshmanuals |
| `uaap-primer` | UAAP Primers |
| `other` | Others |

## R2 storage layout (`src/lib/storage.ts`)

Object keys are derived from the integer `id`:

```ts
export const r2Keys = {
  pdf: (id: number) => `pdfs/${id}.pdf`,
  page: (id: number, pageNum: number) => `pages/${id}/${pageNum}.webp`,
  cover: (id: number) => `covers/${id}.webp`,
} as const;
```

**Cover resolution at read time**:

- If `coverUploaded === true`, use `r2Keys.cover(id)`.
- Else if `isLegacy === false` and `hasPages === true`, fall back to `r2Keys.page(id, 1)`.
- Else: no cover available (legacy issue with no cover uploaded yet).

This handles three cases without extra columns: custom-designed cover, derived-from-PDF cover, and not-yet-uploaded legacy issue.

## DB client (`src/lib/db.ts`)

Verbatim from the supplied guide. Lazy `Proxy` defers initialization to the first query so that `getCloudflareContext()` is available. In production (Workers runtime) it resolves to the native D1 binding; in `next dev` it falls back to the D1 HTTP REST API.

## Dev environment

`.env.local.example` (checked in, real values gitignored):

```
CLOUDFLARE_ACCOUNT_ID=8527ec1369d46f55304a6f59ab5356e4
CLOUDFLARE_D1_DATABASE_ID=<from wrangler d1 create>
CLOUDFLARE_D1_TOKEN=<api token with D1 read/write>

# Set later when DNS is configured:
NEXT_PUBLIC_R2_PUBLIC_BASE_URL=https://cdn.theguidon.com
```

`next.config.ts` calls `initOpenNextCloudflareForDev()` so that `getCloudflareContext()` works during `next dev`.

## Public URL strategy for R2 assets

Assets (WebPs, PDFs, covers) are served from a **custom subdomain**: `cdn.theguidon.com`. DNS setup is out of scope for this session — the env var `NEXT_PUBLIC_R2_PUBLIC_BASE_URL` is left as a placeholder. Components built in later sessions read this env var to construct asset URLs:

```ts
const url = `${process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL}/${r2Keys.page(id, 1)}`;
```

The Worker only mints presigned PUT URLs for the admin upload flow (built in a later session). Public reads never touch the Worker.

## Dependency changes

### Removed

- `vite`, `@vitejs/plugin-react`, `@vitejs/plugin-legacy`
- `react-router-dom` (replaced by Next.js routing)
- `eslint`, `eslint-plugin-react`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh` (Next bundles its own)

### Kept (still useful in the port phase)

- `react`, `react-dom` (bumped to the version Next 15 requires)
- `react-pdf` (used only inside admin upload bundle in a future session)
- `@reduxjs/toolkit`, `react-redux` (may be replaced during the port; left in for now)

### Added

- `next`
- `@opennextjs/cloudflare`
- `drizzle-orm` (in `dependencies` — runs in the Worker)
- `drizzle-kit` (in `devDependencies` — Node-only, migration tooling)
- `aws4fetch` (for presigning R2 PUT URLs in the future admin upload flow)
- `typescript`, `@types/react`, `@types/react-dom`, `@types/node`
- `@cloudflare/workers-types`
- `wrangler` (devDependency, replaces relying on `npx`)

### Vulnerability handling

After `package.json` rewrites, run `pnpm install` then `pnpm audit`. Resolve every `high` or `critical` advisory by either:

- Accepting the `pnpm audit --fix` patch upgrade, or
- Pinning a known-good version manually if `audit fix` proposes a breaking change.

`moderate` and `low` advisories are documented in a follow-up comment in the spec rather than blanket-upgraded if they touch transitive deps with no realistic exploit path. Goal: zero `high`/`critical` reported after install.

## Migrations

The first migration is generated by `drizzle-kit generate` from the schema above. The categories seed is added as a hand-written SQL statement in the same migration file (Drizzle generates the table DDL; we append `INSERT INTO categories ...` for the seed).

Applied locally with:

```bash
npx wrangler d1 migrations apply theguidon-archives --local
```

Production application is deferred to whichever session does the deploy.

## Commit plan

The branch starts from `emman/main`. Commits are made in this order, with messages written in normal prose (no "Claude" or co-author attribution):

1. `chore: remove Vite scaffolding and gh-pages deploy script`
2. `chore: bootstrap Next.js 15 with TypeScript`
3. `chore: configure @opennextjs/cloudflare and wrangler.jsonc with D1 and R2 bindings`
4. `feat: add Drizzle ORM with lazy D1 client and base schema`
5. `feat: add R2 storage key conventions and presign helper`
6. `chore: generate initial Drizzle migration with categories seed`
7. `docs: cloudflare migration design spec`

The spec file itself is committed in the final commit so review of the spec happens against the in-progress branch.

## Risks and open issues

- **R2 OAuth scope warning.** `wrangler whoami` lists D1 write but does not list an `r2` scope explicitly. Bucket creation may prompt for re-login. If it fails, the user re-runs `wrangler login` and rebuilds the token.
- **No data in the database after this session.** The site, if deployed, would render empty. Migration of WP data is the next sub-project.
- **`react-pdf` peer-dep on React 19.** Next 15 ships React 19. `react-pdf` v9 supports React 18; v10 supports 19. Bump to v10 during this session.
- **Existing Python helpers (`content_script/`).** Kept as-is. They are unaffected by the migration and still useful for editors who want to convert plain-text issue contents into JSON before pasting into the admin UI (future).
- **Existing `CLAUDE.md`** describes the Vite + WP architecture. It will be rewritten in a follow-up session once the new architecture has actually landed, not in this session.

## Success criteria for this session

A reviewer of the branch should be able to:

1. Run `pnpm install` cleanly with zero high/critical advisories.
2. Run `npx wrangler d1 migrations apply theguidon-archives --local` and see the schema applied.
3. Run `pnpm dev` (`next dev`) and load a placeholder page without errors.
4. Inspect `wrangler.jsonc` and confirm D1 + R2 bindings reference real resources in the CJ-Uy account.
5. Read this spec and the schema and understand what the next session needs to build.
