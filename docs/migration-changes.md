# Migration Changes — `cloudflare-migration` vs `emman/main`

Snapshot of everything that changed on the `cloudflare-migration` branch relative to `emman/main`. Covers commits `125e672` through `6be9bc5` (45 commits, ~18k insertions / ~17k deletions across 159 files).

## Stack swap

| | Before (`emman/main`) | After (`cloudflare-migration`) |
| --- | --- | --- |
| Framework | Vite + React SPA | Next.js 15 App Router |
| Language | JSX | TypeScript (strict) |
| Package manager | npm (`package-lock.json`) | pnpm (`pnpm-lock.yaml`, `packageManager` pinned) |
| Hosting | gh-pages static | Cloudflare Pages via `@opennextjs/cloudflare` |
| Data source | WordPress REST (`api.theguidon.com`) | Cloudflare D1 + Drizzle ORM |
| Asset storage | WP uploads + `archives.theguidon.com/issues/*.pdf` | Cloudflare R2 (PDFs, per-page WebPs, covers) |
| State | Redux (7 modules + store) | Server components + React context (`alert-bar-context`) |
| Styling | Plain CSS only | Tailwind v4 + shadcn/ui + retained per-route CSS |
| Linting | `.eslintrc.cjs` | `next lint` |
| Deploy | `deploy.bat` to gh-pages | Push to branch → Pages auto-build |

## Removed

- `src/App.jsx`, `src/main.jsx`, `index.html`, `vite.config.js`, `.eslintrc.cjs`, `deploy.bat`, `package-lock.json`
- `src/pages/**` — `home`, `browse`, `issue`, `search`, `about`, `404` (replaced by App Router equivalents)
- `src/redux/**` — entire store and 7 modules (`alert-bar`, `fullscreen`, `hide-modals`, `issue`, `issues`, `minmax-dates`, `random`)
- `src/components/issue/**` — old reader, slider-section, title-bar (multiple fullscreen/list/search CSS variants)
- `src/utils/index.jsx`, `src/utils/custom-renderer/index.jsx` — split into focused libs (`lib/dates.ts`, `lib/format.ts`, `lib/category-slug.ts`, `lib/utils.ts`)
- `src/assets/images/broadsheet-sample.png`

## Added — infrastructure

- [next.config.ts](../next.config.ts), [tsconfig.json](../tsconfig.json), [postcss.config.mjs](../postcss.config.mjs), [open-next.config.ts](../open-next.config.ts), [wrangler.jsonc](../wrangler.jsonc)
- [drizzle.config.ts](../drizzle.config.ts) + [drizzle/0000_init.sql](../drizzle/0000_init.sql) + meta snapshot/journal
- [.env.local.example](../.env.local.example) — D1 token + R2 keys + public base URL
- [public/pdf.worker.min.mjs](../public/pdf.worker.min.mjs) — pdfjs worker for client-side PDF→WebP

## Added — `src/lib/`

- [schema.ts](../src/lib/schema.ts) — Drizzle tables: `issues`, `categories`, `issue_categories`
- [db.ts](../src/lib/db.ts) — lazy Proxy client; native D1 in Worker, HTTP REST in dev
- [storage.ts](../src/lib/storage.ts) — R2 key conventions, cover-resolution fallback, `presignPutUrl()` via `aws4fetch`
- [queries.ts](../src/lib/queries.ts) — D1 read helpers used by routes
- [pdf-to-webp.ts](../src/lib/pdf-to-webp.ts) — pdfjs page render → `canvas.toBlob('image/webp')`
- [dates.ts](../src/lib/dates.ts), [format.ts](../src/lib/format.ts), [category-slug.ts](../src/lib/category-slug.ts), [utils.ts](../src/lib/utils.ts)
- [alert-bar-context.tsx](../src/lib/alert-bar-context.tsx), [use-click-outside.ts](../src/lib/use-click-outside.ts)

## Added — App Router routes

Public:
- [app/layout.tsx](../src/app/layout.tsx), [app/page.tsx](../src/app/page.tsx) (home)
- [app/about/page.tsx](../src/app/about/page.tsx)
- [app/releases/[[...slug]]/page.tsx](../src/app/releases/[[...slug]]/page.tsx) — replaces `BrowsePage`, optional-catch-all for category routing
- [app/issue/[slug]/page.tsx](../src/app/issue/[slug]/page.tsx)
- [app/search/page.tsx](../src/app/search/page.tsx)
- [app/not-found.tsx](../src/app/not-found.tsx)

Admin (new sub-app):
- [app/admin/layout.tsx](../src/app/admin/layout.tsx), [app/admin/page.tsx](../src/app/admin/page.tsx) — issues list
- [app/admin/upload/page.tsx](../src/app/admin/upload/page.tsx)
- [app/admin/issues/[id]/edit/page.tsx](../src/app/admin/issues/[id]/edit/page.tsx)

API routes:
- [api/admin/issues/route.ts](../src/app/api/admin/issues/route.ts) — list/create
- [api/admin/issues/[id]/route.ts](../src/app/api/admin/issues/[id]/route.ts) — PATCH / DELETE with R2 cleanup
- [api/admin/issues/[id]/upload-urls/route.ts](../src/app/api/admin/issues/[id]/upload-urls/route.ts) — binding-first, presign fallback
- [api/admin/r2/[...key]/route.ts](../src/app/api/admin/r2/[...key]/route.ts) — `FixedLengthStream` PUT proxy when R2 binding is present

## Added — components

Reader (replaces `src/components/issue/**`):
- [components/reader/index.tsx](../src/components/reader/index.tsx), [slider.tsx](../src/components/reader/slider.tsx), [title-bar.tsx](../src/components/reader/title-bar.tsx), [reader.css](../src/components/reader/reader.css) — single/double-page modes, preload (4 ahead/1 behind), jump input, slider drag, blob download with progress

Admin:
- [shell.tsx](../src/components/admin/shell.tsx), [sidebar.tsx](../src/components/admin/sidebar.tsx) — vertical nav, navy brand, mobile-responsive
- [upload-form.tsx](../src/components/admin/upload-form.tsx) — drag-drop, sticky submit, progress UI
- [edit-form.tsx](../src/components/admin/edit-form.tsx), [issue-delete-button.tsx](../src/components/admin/issue-delete-button.tsx), [confirm-dialog.tsx](../src/components/admin/confirm-dialog.tsx)
- [admin.css](../src/app/admin/admin.css)

shadcn/ui primitives:
- `ui/alert`, `badge`, `button`, `card`, `checkbox`, `input`, `label`, `progress`, `separator`, `table`, `textarea`

## Ported (JSX → TSX, behaviour preserved)

- `components/header`, `footer`, `mobile-menu`, `alert-bar`, `search-field`, `issue-card`, `pagination`
- `components/filters/*` — `index`, `advanced`, `categories`, `date-range`, `views` (date-range upper bound bug fixed, JSON empty-string coercion, dead code removed in `fb59123`)
- `src/data/archives.tsx`

## Moved (no content change)

- `src/assets/fonts/**` → `public/fonts/**`
- `src/assets/icons/**`, `src/assets/logos/**` → `public/icons/**`, `public/logos/**`
- `src/assets/css/fonts.css` → `src/styles/fonts.css` (weights retuned in `6be9bc5`)
- `src/assets/css/global.css` → `src/styles/globals.css`
- Per-page CSS moved alongside its new App Router route (`pages/home/index.css` → `app/home.css`, etc.)
- New [src/styles/tailwind.css](../src/styles/tailwind.css)

## Database (new)

Three tables in [src/lib/schema.ts](../src/lib/schema.ts):
- `issues` — scalar metadata + `issue_content`/`contributors` JSON blobs mirroring WP API shape; lifecycle `status` enum (`draft` → `processing` → `ready`); asset flags `has_pdf`, `has_pages`, `cover_uploaded`; `is_legacy` boolean (legacy is **not** a category)
- `categories` — seeded with 5 slugs (`press-issue`, `graduation-magazine`, `freshmanual`, `uaap-primer`, `other`)
- `issue_categories` — junction with composite PK

`id` is the R2 key source; `slug` is the URL key — renaming slugs never moves R2 objects.

## R2 storage (new)

```
pdfs/{id}.pdf
pages/{id}/{n}.webp
covers/{id}.webp
```

Cover resolution falls back: explicit cover → page 1 (non-legacy with pages) → null. Public reads bypass the Worker via `NEXT_PUBLIC_R2_PUBLIC_BASE_URL`.

## Admin upload flow (new)

Browser renders PDF via pdfjs-dist → `canvas.toBlob('image/webp', 0.85)` per page → parallel PUT to R2. Two transport modes:
- **Binding path** (production): proxy through [api/admin/r2/[...key]](../src/app/api/admin/r2/[...key]/route.ts) using `R2.put()` with `FixedLengthStream`
- **Presign path** (dev): S3 v4 query-string PUT URLs via `aws4fetch`

Worker only signs / proxies; never buffers full files.

## Notable fixes along the way

- `18623d8` — SSR no longer crashes when `NEXT_PUBLIC_R2_PUBLIC_BASE_URL` unset
- `80e7413` — R2 base URL passed from server to reader (avoid client env coupling)
- `848d193` — `FixedLengthStream` required by Workers for known-length PUT
- `a22a5ad` — runtime error fix in admin route
- `3b4ff37` — Tailwind/legacy cascade layer ordering + mobile admin shell
- `fb59123` — date-range upper bound off-by-one, empty-string → null coercion in JSON parse

## Docs added

- [docs/superpowers/specs/2026-05-21-cloudflare-migration-design.md](superpowers/specs/2026-05-21-cloudflare-migration-design.md)
- [docs/superpowers/plans/2026-05-21-cloudflare-migration-foundation.md](superpowers/plans/2026-05-21-cloudflare-migration-foundation.md)
- [docs/superpowers/specs/2026-05-22-app-port-and-admin-upload-design.md](superpowers/specs/2026-05-22-app-port-and-admin-upload-design.md)
- [docs/superpowers/plans/2026-05-22-app-port-and-admin-upload.md](superpowers/plans/2026-05-22-app-port-and-admin-upload.md)

## Still outstanding (per CLAUDE.md)

- WP → D1 data import script
- WP → R2 PDF + cover copy
- `cdn.theguidon.com` DNS → R2
- D1/R2 bindings on the Pages project (wrangler.jsonc binds for `wrangler deploy` only)
- gh-pages → Pages redirect cutover
