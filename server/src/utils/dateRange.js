const pad = (n) => String(n).padStart(2, "0");

// This is an India-only business (stores, order takers, workers - all
// India-based), so "today"/"this week"/"this month" must mean the
// calendar day in Asia/Kolkata (IST, UTC+5:30, no DST) - never whatever
// timezone the server process or a viewer's browser happens to be
// running in. Getting this from Intl rather than `new Date().getDate()`
// etc. is what keeps the server's idea of "today" correct regardless of
// the host machine's own configured timezone; the client mirrors this
// exact same approach (see client/src/utils/date.js) so an order's
// orderDate and a browser's "today" filter can never disagree about
// which business day it is, including right around midnight IST.
const BUSINESS_TZ = "Asia/Kolkata";

const istPartsFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: BUSINESS_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

// {year, month (1-12), day} for `date` as seen in Asia/Kolkata.
const istParts = (date) => {
  const parts = istPartsFormatter.formatToParts(date);
  const get = (type) => Number(parts.find((p) => p.type === type).value);
  return { year: get("year"), month: get("month"), day: get("day") };
};

const toIsoDate = ({ year, month, day }) => `${year}-${pad(month)}-${pad(day)}`;

// Calendar-only arithmetic on an already-known Y/M/D triple - anchoring to
// UTC internally is just a normalization trick (Date.UTC correctly rolls
// month/year boundaries for us), not a timezone conversion. This never
// touches "now", so it's safe to reuse for pure date-string manipulation.
const shiftDays = ({ year, month, day }, delta) => {
  const d = new Date(Date.UTC(year, month - 1, day + delta));
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
};

const dayOfWeek = ({ year, month, day }) => new Date(Date.UTC(year, month - 1, day)).getUTCDay();

// n days before today (Asia/Kolkata) as YYYY-MM-DD - exported for callers
// that need to build a specific day-by-day range themselves (e.g.
// zero-filling a per-day chart), not just resolveDateRange's fixed set.
export const daysAgoIso = (n) => toIsoDate(shiftDays(istParts(new Date()), -n));

// today: just today. week: the last 7 days including today. custom:
// exactly what was passed. all/anything else: unbounded ({}).
// Shared by any module offering a Today/Week/Custom Range filter
// (batches, ready stock, ...) so the windows stay identical everywhere.
export const resolveDateRange = ({ filter, from, to } = {}) => {
  if (filter === "today") {
    const today = todayIso();
    return { from: today, to: today };
  }

  if (filter === "week") {
    return { from: daysAgoIso(6), to: todayIso() };
  }

  if (filter === "custom") {
    return { from, to };
  }

  return {};
};

const currentMonthRange = () => {
  const { year, month } = istParts(new Date());

  const from = `${year}-${pad(month)}-01`;
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const to = `${year}-${pad(month)}-${pad(lastDay)}`;

  return { from, to };
};

// Only defaults when BOTH bounds are omitted - a caller who passes just
// `from` or just `to` gets an open-ended range on the other side, not a
// silently-clamped month. Shared by any module offering a lazily-loaded,
// month-scoped history list (raw material lots, ready stock's incoming
// stock history, ...).
export const resolveMonthRange = ({ from, to } = {}) => {
  if (!from && !to) return currentMonthRange();
  return { from, to };
};

// The business's own "today" as YYYY-MM-DD (Asia/Kolkata) - shared by
// anything that stamps or reads today's date server-side (an order's
// orderDate, the order taker schedule's gating check) so they can't
// disagree with each other, or with the client's own IST-based "today".
export const todayIso = () => toIsoDate(istParts(new Date()));

// Sunday-start week (inclusive) that Asia/Kolkata's "today" falls in -
// used to cap order-taker schedule overrides to the current week only.
// This is a fixed calendar block (can include future dates), distinct
// from resolveDateRange's "week" filter above (a rolling last-7-days
// window) - the two answer different questions and are not
// interchangeable, see dateRange usage notes in CLAUDE.md.
export const currentWeekRange = () => {
  const today = istParts(new Date());
  const dow = dayOfWeek(today);

  return {
    from: toIsoDate(shiftDays(today, -dow)),
    to: toIsoDate(shiftDays(today, 6 - dow)),
  };
};
