# App Port + Admin Upload — Design Spec

**Date:** 2026-05-22
**Branch:** `cloudflare-migration`
**Predecessor spec:** `docs/superpowers/specs/2026-05-21-cloudflare-migration-design.md` (foundation)

## Background

The foundation phase landed a Next.js 15 + TypeScript scaffold, Cloudflare D1 + R2 bindings, a Drizzle schema, and the categories seed. The deployed site currently renders only a placeholder home page. This spec scopes the next session: port the public pages off the legacy Vite + React SPA to the App Router, drop the WordPress API entirely, and ship an admin upload UI that fills the empty D1 + R2 with new issues.

## Goals

- Replace the placeholder `src/app/page.tsx` with the full set of public pages: `/`, `/releases/[[...slug]]`, `/issue/[slug]`, `/search`, `/about`, `not-found`.
- Public pages are **server components** fetching from D1 via Drizzle. **No WordPress API calls anywhere.** No Redux.
- Stateful UI (filters, search field, mobile menu, alert bar, admin upload, reader) ships as **client islands**.
- Build a custom WebP-image reader on `/issue/[slug]` with three viewing modes (long-scroll default, single-page, double-page spread), zoom, fullscreen, share, and a direct PDF download button. No `react-pdf`.
- Build `/admin/upload` (no auth this phase): metadata form + client-side `pdfjs-dist` PDF → WebP conversion + R2 presigned PUT uploads + D1 row lifecycle.
- Enable R2 public bucket access and wire `NEXT_PUBLIC_R2_PUBLIC_BASE_URL` to the `*.r2.dev` URL until DNS lands on `cdn.theguidon.com`.
- Recover legacy CSS, fonts, and copy text from `c7b4a44` (the Vite scaffold) verbatim. Adapt routing and data layer; keep visual design 1:1.
- Empty-state UI on every list page (home, browse, search) so the site is presentable with zero rows in `issues`.

## Non-goals (explicitly deferred)

- **`react-pdf`.** Not re-added. The reader is a custom WebP-image viewer built on `<img>` tags with `loading="lazy"`. No PDF rendering at view time — admin's pdfjs-dist already converted the PDF to per-page WebPs on upload. PDF is only used by the "Download" button as a direct R2 link.
- **Importing WordPress data.** D1 starts empty and stays empty until the admin uploads issues.
- **Migrating WordPress assets.** No PDFs or covers copied from the old site.
- **Per-page WebP for legacy issues.** The schema supports `hasPages`, but no backfill is run.
- **Authentication for `/admin/upload`.** The route is reachable by anyone who knows the URL. Auth lands in a follow-up.
- **DNS for `cdn.theguidon.com`.** Public URLs use the `*.r2.dev` form set in `NEXT_PUBLIC_R2_PUBLIC_BASE_URL`. Switching domains later is a one-env-var change.
- **Search FTS5.** `?search=` queries use `LIKE` on `title` and `description` for now.
- **Replacing the gh-pages production site.** Cutover is its own session.

## Architecture

### Data layer (`src/lib/queries.ts`)

A single module exposes all read paths. Each query is async, returns rows shaped like the legacy WP API response so the recovered UI components need minimal rewriting:

```ts
listIssues({
  categorySlug?: string,         // "press-issue" | "graduation-magazine" | ... | undefined for all
  isLegacy?: boolean,
  search?: string,
  volume?: number,
  year?: number,
  from?: { year: number; month: number; day: number },
  until?: { year: number; month: number; day: number },
  page: number,
  pageSize: number,               // 20 by default
  order: "asc" | "desc",
}): Promise<{ issues: Issue[]; found: number; maxPages: number }>

getIssue(slug: string): Promise<Issue | null>
getMinMaxDates(): Promise<{ min: string; max: string }>   // ISO; legacy default if empty
getRandom(): Promise<Issue | null>
```

Filters compose with the schema's indexes (`idx_issues_date_published`, `idx_issues_volume`, `idx_issues_is_legacy`, `idx_issues_status`). The category filter joins through `issue_categories`. All public queries filter `status = 'ready'`. The admin upload writes new rows with `status = 'draft'` and finalizes to `ready`.

`getMinMaxDates()` falls back to the legacy hardcoded range (`1929-06-22` … now) when the table is empty so the year filter UI still works.

### Pages

| Route | Component model | Data fetch | Empty-state behavior |
| --- | --- | --- | --- |
| `/` | Server component | `listIssues` for each category preview + latest | "No issues yet. Visit /admin/upload to add one." Hero hidden. |
| `/releases/[[...slug]]` | Server component (page) + client island (filters) | `listIssues(filtered)` + `getMinMaxDates` | "No issues match." |
| `/issue/[slug]` | Server component (page) + client island (`<Reader />`) | `getIssue` | If null → `notFound()`. If found but `hasPages === false` → metadata block + "No preview available." If `hasPages === true` → metadata block + reader (see Reader section). |
| `/search` | Server component + client island (search field) | `listIssues({ search: query })` | "No results for ..." |
| `/about` | Static server component | none | n/a |
| (none matched) | `not-found.tsx` | none | Legacy 404 copy |

Slug → category mapping (URL-only translation; DB stores the API form):

```
recent      → no categ filter
press       → press-issue
gradmag     → graduation-magazine
freshmanual → freshmanual
uaap-primer → uaap-primer
legacy      → isLegacy=true
others      → other
```

`/releases` (no slug) redirects to `/releases/recent`, matching legacy.

### Client islands

| Component | Why client | Source |
| --- | --- | --- |
| `<Header />` | Mobile menu open/close state, conditional search field render | Recover from `src/components/header` at `c7b4a44`, convert to TSX |
| `<MobileMenu />` | Open/close | Recover from `src/components/mobile-menu` |
| `<AlertBar />` | Queue of timed toasts | Recover from `src/components/alert-bar`; replace Redux dispatch with a context |
| `<SearchField />` | Controlled input, submits to `/search?query=` | Recover from `src/components/search-field` |
| `<FiltersGroup />` and children (`Categories`, `Advanced`, `DateRange`, `Views`) | Popup open/close, range picking, debounced URL writes via `useSearchParams` | Recover from `src/components/filters/*` |
| `<Pagination />` | Reads `useSearchParams`, writes new page via `useRouter().push` | Recover from `src/components/pagination` |
| `<IssueCard />` | Pure presentational; uses `Link` from `next/link` instead of `react-router-dom`. Can stay a server component — no client state | Recover, convert imports |
| `<AdminUploadForm />` | File picker, pdfjs-dist, canvas, progress UI, fetch to API routes | New code |
| `<Reader />` | Mode state, current page state, zoom level, fullscreen toggle, keyboard listeners | New code (replaces legacy `IssueReader`, but image-based instead of PDF-based) |

The **alert bar context** replaces the legacy Redux slice — a `<AlertBarProvider>` in the root layout exposes `showAlert(text)`. Each alert auto-dismisses after 5s. Implementation is ~30 lines using `useState` + `useEffect`. No external state library.

The **modal close-on-click-outside** behavior (legacy `hideModals` slice) becomes a single `useClickOutside` hook used inside each popup component.

The **fullscreen** Redux slice is replaced by local `useState` inside the `<Reader />` component, paired with the browser Fullscreen API (`element.requestFullscreen()` / `document.exitFullscreen()`).

### Reader (`<Reader />`)

Custom WebP-image viewer for `/issue/[slug]`. No PDF rendering at view time. Three viewing modes, picked from an icon toolbar in the reader's title bar; URL query param `?view=scroll|single|double` makes the choice shareable and bookmark-friendly. Default when absent: `scroll`.

**Modes:**

- **`scroll` (default)** — All WebP pages stacked vertically in a single column. First 2 pages eager (`loading="eager"`), rest `loading="lazy"`. Scroll is the only navigation. On mobile this is the default and the recommended mode.
- **`single`** — One page at a time, centered. Prev/Next buttons + ArrowLeft/ArrowRight keys. Page slider on bottom. Eager-loads current ± 1, lazy for the rest via dynamic `loading` attribute toggling.
- **`double`** — Two pages side-by-side (spread layout). Same prev/next/keyboard/slider as single. **Hidden on viewports narrower than 768px** — the mode switcher omits the icon, and an existing `?view=double` URL on a narrow viewport falls back to `single` for that session.

**Controls (title bar above the page area):**

- Three mode-switcher icons (scroll / single / double) with the active one highlighted. Updates `?view=` query param via `useRouter().replace()` without scrolling.
- Zoom out / zoom in buttons. Zoom scales the page image via CSS `transform: scale(...)` on a wrapper. Range 0.5×–3.0×, step 0.25×. When zoomed > 1.0 in single/double modes, the wrapper is draggable (pointer events) for panning. In scroll mode, zoom applies to all images.
- Fullscreen toggle. Calls `document.body.requestFullscreen()` / `document.exitFullscreen()`. Tracks state via the `fullscreenchange` event.
- Download PDF button. Renders only when `hasPdf === true`. `<a href={publicUrl(r2Keys.pdf(id))} download>` — direct R2 link, no Worker proxy.
- Share buttons (Facebook + Twitter/X). Open share URLs in a new tab. Set per the legacy pattern (`http://www.facebook.com/sharer.php?u=...`, `http://x.com/share?text=...`).

**Image source:**

```tsx
<img
  src={publicUrl(r2Keys.page(issue.id, pageNum))}
  alt={`${issue.title} — page ${pageNum}`}
  loading={pageNum <= 2 ? "eager" : "lazy"}
/>
```

`publicUrl` reads `NEXT_PUBLIC_R2_PUBLIC_BASE_URL` (the `*.r2.dev` URL until DNS lands). Images bypass the Worker entirely; Cloudflare's edge cache + the browser's native image cache handle delivery.

**Keyboard:**

- `ArrowLeft` / `ArrowRight` — prev/next page in `single` and `double` modes only.
- `Escape` — exits fullscreen (browser default; no extra wiring needed).

**Page slider** (single/double modes only): horizontal range input below the page area, showing `Page N of M`. Dragging the slider updates the current page state.

**No double-page math edge cases**: in `double` mode, page 1 is always rendered alone (cover spread convention); pages 2–3, 4–5, etc. pair up. If `numPages` is odd, the last page also renders alone.

The reader is roughly 250–400 lines of TSX split across `src/components/reader/index.tsx` (main shell + state), `src/components/reader/title-bar.tsx` (controls), and `src/components/reader/slider.tsx` (paginated slider).

### Admin upload flow

Route: `/admin/upload`. Components:

1. **Metadata form** (client component): `title`, `slug` (auto-suggested from title, editable), `datePublished` (date input), `volumeNum`, `issueNum`, `description`, `isLegacy` checkbox, `categories` (multi-select from the 5 seeded), optional `issueContent` and `contributors` JSON textareas.
2. **PDF picker**: single file input, accepts `application/pdf`. Required unless `isLegacy === true`.
3. **Cover picker**: optional image input (PNG/JPEG/WebP). When omitted on a non-legacy issue, page 1 of the rendered WebPs serves as cover. Required for legacy issues. **Client converts any accepted format to WebP at 0.85 quality before upload** so all stored covers have a uniform `.webp` extension matching the R2 key convention.

Submission sequence:

```
client                                  worker / Next route handler            R2
──────                                  ────────────────────────────           ──
[submit form]
  └─→ POST /api/admin/issues             → drizzle insert row, status='draft',
                                           returns { id }
                                                                  ←──── { id }
[render PDF page-by-page with pdfjs-dist]
[for each page → canvas → canvas.toBlob('image/webp', 0.85) → Blob]

  └─→ POST /api/admin/issues/:id/upload-urls?pdf=true&pages=N&cover=true|false
                                         → for each requested asset:
                                             presignPutUrl(r2Keys.X(id))
                                         returns { pdf: url, pages: [url…], cover: url? }
                                                                  ←──── { … }

[parallel PUT each blob to its URL]      (Worker not involved)            ← objects land

  └─→ PATCH /api/admin/issues/:id        → drizzle update:
        { hasPdf, hasPages, numPages,         set status='ready',
          coverUploaded, ... }                store flags from body
                                                                  ←──── ok
[redirect to /issue/:slug]
```

PDF→WebP conversion runs entirely in the browser (no Worker CPU, no Node). For a 32-page issue at ~1500px width, expected total upload size is ~5 MB. Concurrency cap on parallel uploads: 5.

WebP quality: 0.85. Width: 1500px (downscale only — never upscale). Renderer: `pdfjs-dist` with `getDocument(buffer).getPage(n).render({ canvasContext, viewport })`.

### Route handlers (`src/app/api/admin/issues/*`)

Three handlers, all in `src/app/api/admin/issues/route.ts` and `src/app/api/admin/issues/[id]/{upload-urls,route}.ts`:

```
POST   /api/admin/issues                  insert draft row, return { id }
POST   /api/admin/issues/:id/upload-urls  mint presigned PUT URLs
PATCH  /api/admin/issues/:id              set status='ready' + asset flags
```

Each handler reads/writes through `@/lib/db` and `@/lib/storage`. No auth check this session.

Presigned URLs require an R2 access key and secret. These are added as Workers secrets (via `wrangler secret put`) and as fields in `.env.local` for dev:

```
R2_ACCESS_KEY_ID=<from CF dashboard → R2 → Manage R2 API Tokens>
R2_SECRET_ACCESS_KEY=<...>
```

`.env.local.example` is updated to document these.

### R2 public access

Enable the R2 bucket's public access flag in the Cloudflare dashboard (one toggle). Note the assigned `*.r2.dev` URL, e.g. `pub-xxxxx.r2.dev`. Set `NEXT_PUBLIC_R2_PUBLIC_BASE_URL=https://pub-xxxxx.r2.dev` in `.env.local`. Cloudflare Pages dashboard environment variables must mirror this for production builds.

This is the only piece in the implementation plan that requires a manual click in the Cloudflare dashboard — wrangler does not enable public access from the CLI. The plan calls it out explicitly with the steps.

## Dependency changes

Add:

- `pdfjs-dist` (**admin client only** — imported only by `src/app/admin/upload/page.tsx` and its child components. Next code-splits per route, so the public bundle and the reader bundle don't ship it.)

The public reader is `<img>` + CSS only. No PDF library needed at view time. The reason this works: admin already converted the PDF to per-page WebPs on upload; the viewer just renders images.

Remove (foundation kept them; if still present in `package.json`, drop them now since Redux is gone):

- The foundation phase did **not** add `@reduxjs/toolkit` or `react-redux` back, so no removal is needed. Just don't re-add them during the port.

No `react-pdf`. No `react-router-dom`.

## Empty-state UI

Each list page renders a friendly empty block when `listIssues` returns `{ issues: [], found: 0 }`:

- Home `/`: hero hidden, single-card placeholder reads "No issues uploaded yet. Visit [/admin/upload](/admin/upload) to add one."
- Browse `/releases/<slug>`: grid replaced with "No issues match these filters."
- Search `/search?query=foo`: legacy "We couldn't find any matches for X" UI (already in the recovered SearchPage code).
- `/issue/:slug` for non-existent slug: Next's `notFound()` → renders `src/app/not-found.tsx`.

No 500-class error spinners — D1 errors render a generic "Something went wrong" block, log to console, surface a non-throwing message.

## Conventions

- **Server components by default.** A component is only client (`"use client"`) when it owns interactive state.
- **TypeScript everywhere.** Recovered JSX components are renamed to TSX during recovery and lightly typed (props interface, no `any`).
- **Drizzle queries live in `src/lib/queries.ts` only.** Pages and route handlers import from there. No inline Drizzle calls in JSX.
- **R2 reads bypass the Worker.** `<img src={publicUrl(coverKey(...))} />` resolves directly against `NEXT_PUBLIC_R2_PUBLIC_BASE_URL`.
- **R2 writes go through presigned URLs.** Worker only signs. No streaming uploads through the Worker.
- **Commit attribution.** No "Claude", "Anthropic", "Generated by", "Co-Authored-By Claude" — same rule as foundation phase.
- **Every commit buildable.** Pushes auto-deploy via Pages.

## Open items the plan must resolve

The implementation plan must handle (with concrete steps and code) each of:

1. **Recovering legacy components from `c7b4a44`.** Tactic: `git show c7b4a44:src/components/header/index.jsx > src/components/header.tsx` per component, then rewrite imports + types. Plan lists every file path.
2. **`react-router-dom` → `next` substitutions.** Plan provides the substitution map:
   - `import { Link } from "react-router-dom"` → `import Link from "next/link"`; `to=` → `href=`
   - `useNavigate()` → `useRouter()` from `next/navigation`
   - `useParams()` → `useParams()` from `next/navigation` (same name, different module)
   - `useSearchParams()` → `useSearchParams()` from `next/navigation`
   - `useLocation()` → derived from `usePathname()` + `useSearchParams()`
3. **`<Outlet />` layout** → Next `layout.tsx` with `{children}`.
4. **Replacing legacy Redux usage in components.** Inventory: `useDispatch`, `useSelector` calls in recovered components. Each removed individually (most resolve to local `useState` after rewriting; alert-bar resolves to the new context).
5. **Image loading.** Use Next's `<Image>` for covers, or plain `<img>`? Plan picks **plain `<img>`** to start — Next/Image with a remote loader for `*.r2.dev` is configurable but adds runtime work; cover images are already sized by the admin upload (1500px) so we don't need automatic resizing.
6. **R2 access key creation.** Plan includes the dashboard steps + the exact `wrangler secret put` commands.
7. **PDF.js worker hosting.** `pdfjs-dist` needs the worker JS available at runtime. Plan uses Next's static-import pattern for the worker: `import "pdfjs-dist/build/pdf.worker.min.mjs"` is wrong; instead bundle via `?url` import and assign to `pdfjs.GlobalWorkerOptions.workerSrc`. Concrete code in the plan.

## Success criteria for this session

A reviewer of the branch should:

1. Open the deployed site and see the home page with "No issues yet" empty state. Header + footer present. Navigation works to `/releases/recent`, `/search`, `/about` — each renders without error.
2. Navigate to `/admin/upload`, fill the form, attach a sample PDF, watch progress, end on the new `/issue/<slug>` page with metadata rendered. Refresh → row still there.
3. After upload, the home page hero shows the new issue. `/releases/recent` includes it. The cover image loads from `*.r2.dev`.
4. The new `/issue/<slug>` page shows the reader. Default mode is long-scroll. First two pages load instantly; scrolling down reveals lazy-loaded later pages. Switching to single-page mode (?view=single) works; ArrowRight advances. Switching to double-page works on a desktop viewport; the double-page icon is absent on a phone-sized viewport. Zoom in/out scales the page image. Fullscreen toggle works. Download PDF button serves the original PDF directly from R2. Share buttons open Facebook and X share dialogs.
5. `pnpm build` succeeds. `pnpm dev` against local D1 + R2 works (with `.env.local` filled).
6. No `fetch("https://api.theguidon.com/...")` anywhere in the codebase. `grep -r "theguidon.com/wp-json" src` returns nothing.

## Risks and open issues

- **`pdfjs-dist` worker bundling on Cloudflare Workers** can be fiddly. The admin route is client-side, so the worker runs in the browser — this should not be a Workers runtime concern, but Next's bundler still has to emit the worker JS. Plan validates this against a sample PDF before committing the upload flow.
- **R2 public bucket** exposes every uploaded asset URL to the internet. For an archive, this is the intended behavior, but the user should know.
- **Cloudflare Pages bindings.** D1 + R2 bindings must be added in the Pages dashboard (separately from `wrangler.jsonc`) for production deploys. The plan documents the click-path; it can't be automated.
- **Empty D1 dev.** `pnpm dev` against the remote D1 needs the D1 token. Pure local (`pnpm db:migrate:local`) uses local sqlite and the lazy DB client's HTTP fallback won't fire — see `src/lib/db.ts` for the dev/prod split. Both paths should work.
- **First admin upload after deploy** may surface env-var gaps. Plan includes a smoke test step.
