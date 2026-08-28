# Break Time Bakers — Admin App

Internal admin system for a bakery business: inventory (raw materials, batches,
ready stock), sales (orders, areas, stores), delivery (trips, drivers),
workers (attendance, salary), and finance (expenses, tax, P&L).

Monorepo with two independent apps, no shared package:
- `client/` — Vite + React 18 admin dashboard
- `server/` — Express 5 API

## Stack

**Client**: React 18, TanStack Router (file-free, routes defined in code) +
TanStack Query, Tailwind CSS, Recharts (charts), jspdf/xlsx (exports),
lucide-react (icons). Path alias `@` → `client/src`.

**Server**: Express 5, Drizzle ORM (postgres dialect, `pg` driver), Zod
validation, JWT auth via httpOnly cookies, bcrypt, Cloudflare R2 (S3-compatible)
for file storage via `@aws-sdk/client-s3`.

## Running it

```
# server
cd server && npm run dev          # node --watch src/server.js, port from .env
cd server && npm run db:push      # drizzle-kit push (no migration files, direct push)
cd server && npm run db:studio    # drizzle-kit studio

# client
cd client && npm run dev          # vite, http://localhost:5173
```

Both `client/.env` and `server/.env` are gitignored; `server/.env.example`
lists required vars (`DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`,
`FRONTEND_URL`, plus R2 creds — see `server/src/config/env.js` for the full
required list, which throws at boot if anything's missing).

## Server architecture

Route mounting lives in `server/src/app.js` — one `app.use("/api/x", xRoutes)`
per domain. Each domain is a **module** under `server/src/modules/<domain>/`,
consistently split into:

- `*.routes.js` — Router, wires `requireAuth`/`requireRole("admin")` +
  `validate`/`validateQuery` middleware + controller fn per route
- `*.controller.js` — thin, calls service, formats response via
  `utils/apiResponse.js`, wrapped in `asyncHandler` (no try/catch needed)
- `*.service.js` — business logic, orchestrates repositories, throws
  `httpError(status, message, code?)` for domain errors
- `*.repository.js` — all Drizzle queries for the module live here, nothing
  above this layer touches `db` directly
- `*.schema.js` — Drizzle table definitions (one file per table, e.g.
  `materialLot.schema.js`, `vendor.schema.js` sit inside the `inventory`
  module alongside `rawMaterial.schema.js`)
- `*.validation.js` — Zod schemas for request body/query/params

Almost every route requires `requireAuth` + `requireRole("admin")` — this is
currently an admin-only tool, not multi-role.

**Auth**: JWT access token (15m) + refresh token (7d), both httpOnly cookies.
Refresh tokens are rotated on use and hashed in the `sessions` table; reusing
an already-rotated refresh token is treated as theft and revokes *all*
sessions for that user (`auth.service.js: rotateRefreshToken`). Client-side,
`apiClient.js` catches a 401 with `code: ACCESS_TOKEN_EXPIRED`, calls
`/auth/refresh-token` once (de-duped across concurrent requests via a shared
promise), and retries. A `REFRESH_TOKEN_REUSED` or failed refresh dispatches
`window` event `auth:session-expired` for the app shell to react to.

**File uploads**: never stored/served directly — `utils/objectStorage.js`
issues short-lived presigned R2 URLs (5 min to upload, 15 min to view). The
bucket is private; a stored object key is useless without a fresh signed URL
minted per request.

**Inventory costing**: raw materials use FIFO lot costing. `stockQty` is
never a stored column — it's `SUM(remaining_qty)` across a material's lots,
computed at read time in `rawMaterial.repository.js`, so concurrent restocks
can't desync a counter. "Next lot rate" (what the next batch will actually
cost) is the unit_cost of the oldest lot that still has stock.

**Selling price history**: there is no dedicated price-history table.
`batches.pricePerUnit` is required (Zod, `batch.validation.js`) — every
production batch permanently records the price at that moment, tied to
`producedAt`. That's the price history; the In Process module's date
filter/export reads it directly. `products.pricePerUnit` is a separate,
deliberately mutable "current price" column, refreshed as a side effect
whenever a batch supplies one (`upsertProductByName` in
`product.repository.js`) — never treat it as historical.

Ready Stock (`readyStock.repository.js`) mirrors this split: `availableQty`
is always live/unscoped by design (true current stock even when the date
filter narrows which products show), but `pricePerUnit` **is** scoped to
the filter's `to` date — it resolves to the price of the most recent
production batch on/before `to` (via `ready_stock_movements.batchId`), not
the live `products.pricePerUnit`. This is what makes a past custom-range
Ready Stock export show the price that was actually in effect back then
instead of silently substituting today's price. If you touch either query,
keep that asymmetry (qty unscoped, price scoped) intentional and don't
"fix" one to match the other.

## Client architecture

Feature-sliced under `client/src/features/<domain>/`:
- `routes.jsx` — TanStack Router route definitions for the feature, imported
  into `client/src/router/index.jsx` and attached to either
  `appLayoutRoute` (authenticated shell) or `fullPageLayoutRoute` (auth pages)
- `api/*Api.js` — thin wrappers around `apiClient` calling paths from
  `client/src/constants/ENDPOINTS.jsx` (the single source of truth for API
  paths — add new backend routes there, don't hardcode strings in hooks)
- `hooks/` — TanStack Query hooks (`use<Thing>s.js` for queries,
  `use<Thing>Mutations.js` for mutations)
- `pages/`, `components/` — feature UI
- `data/seed*.js` — some features still carry local seed/demo data left over
  from before the backend was wired up; check whether a page actually calls
  the real API (via hooks) or still reads local seed data before assuming
  it's live (finance in particular has `CustomerPaymentsLocal.jsx` /
  `CustomerPaymentsStore.jsx` alongside the real `CustomerPayments.jsx` —
  confirm which is routed before editing)

`client/src/lib/apiClient.js` is the one fetch wrapper everything goes
through — cookie-based (`credentials: 'include'`), handles the refresh-retry
dance described above, unwraps `{ data }` envelopes, throws `ApiError`.
Shared cross-feature UI lives in `client/src/components/shared/`.

## Recent direction

Per recent commit history, the app is mid-migration from local/seed data to
the real backend, module by module (inventory → sales → finance → workers,
most recently). When touching a feature, check git log / the page component
for whether it's already wired to hooks or still using `data/seed*.js` —
don't assume the whole app is uniformly on the backend yet.
