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
cd server && npm run dev          # nodemon src/server.js, port from .env
cd server && npm run db:push      # drizzle-kit push (no migration files, direct push)
cd server && npm run db:studio    # drizzle-kit studio
cd server && npm run db:seed-raw-materials  # idempotent, run before db:seed-demo (batches need real stock)
cd server && npm run db:seed-demo # idempotent - areas, stores, workers, batches, orders, expenses, tax entries

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

**Attendance & week-off swaps**: each worker has one default `weekOffDay`
(e.g. "Sunday") on their profile - the calendar/payroll assume every
occurrence of that weekday is unpaid, unless told otherwise. To give a
worker a different day off for one specific week (e.g. Thursday instead of
Sunday), mark *that date's* attendance with status `"week_off"` - no
separate table for this. `AttendanceCalendar.jsx` groups a worker's
attendance by Sunday-start week (`weekStartOf`); a `week_off` entry
anywhere in a week suppresses the default day for the rest of that same
week, turning it into an ordinary day that needs its own present/absent
mark. Payroll (`dailySalaryFromMonthly` in `salary.js`, and the mirrored
calc in `useFinance.js`) never needed to change for this - it already only
pays for entries explicitly marked `present`/`half_day`, so it's naturally
agnostic to which specific day was off.

**Auth**: JWT access token (15m) + refresh token (7d), both httpOnly cookies.
Refresh tokens are rotated on use and hashed in the `sessions` table; reusing
an already-rotated refresh token is treated as theft and revokes *all*
sessions for that user (`auth.service.js: rotateRefreshToken`). Client-side,
`apiClient.js` catches a 401 with `code: ACCESS_TOKEN_EXPIRED` **or**
`ACCESS_TOKEN_MISSING`, calls `/auth/refresh-token` once (de-duped across
concurrent requests via a shared promise), and retries. Both codes matter:
the accessToken cookie's maxAge (15m) matches the JWT's own `expiresIn`, so
once that elapses the browser deletes the cookie itself before the next
request even goes out - the server then sees no cookie at all
(`ACCESS_TOKEN_MISSING` from `requireAuth.js`), not an expired one. Treat
that as a routine expiry needing a refresh, not an auth failure to raise -
this was a real bug (silent logout every ~15 minutes) until both codes were
handled the same way. A `REFRESH_TOKEN_REUSED` or failed refresh dispatches
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

Ready Stock also has a per-product drill-down: `GET /ready-stock/:id/history`
(`readyStock.service.js: getStockHistory`) lists every production batch
that added to that product's stock, defaulting to the current calendar
month when no range is given (`resolveMonthRange` in `utils/dateRange.js`
— shared with Raw Materials' lot history, same UX: click a row to lazily
expand its history). Scoped to `reason = "production"` so a future
sale/adjustment/wastage movement type doesn't show up as stock being
*added*.

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
