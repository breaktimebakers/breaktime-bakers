const pad = (n) => String(n).padStart(2, "0");

const toIsoDate = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const daysAgoIso = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toIsoDate(d);
};

// today: just today. week: the last 7 days including today. custom:
// exactly what was passed. all/anything else: unbounded ({}).
// Shared by any module offering a Today/Week/Custom Range filter
// (batches, ready stock, ...) so the windows stay identical everywhere.
export const resolveDateRange = ({ filter, from, to } = {}) => {
  if (filter === "today") {
    const today = toIsoDate(new Date());
    return { from: today, to: today };
  }

  if (filter === "week") {
    return { from: daysAgoIso(6), to: toIsoDate(new Date()) };
  }

  if (filter === "custom") {
    return { from, to };
  }

  return {};
};

const currentMonthRange = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed

  const from = `${year}-${pad(month + 1)}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const to = `${year}-${pad(month + 1)}-${pad(lastDay)}`;

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

// The server's own "today" as YYYY-MM-DD - shared by anything that stamps
// or reads today's date server-side (an order's orderDate, the order
// taker schedule's gating check) so they can't disagree with each other.
export const todayIso = () => toIsoDate(new Date());

// Sunday-start week (inclusive) the server's "today" falls in - used to
// cap order-taker schedule overrides to the current week only.
export const currentWeekRange = () => {
  const now = new Date();
  const sunday = new Date(now);
  sunday.setDate(now.getDate() - now.getDay());
  const saturday = new Date(sunday);
  saturday.setDate(sunday.getDate() + 6);
  return { from: toIsoDate(sunday), to: toIsoDate(saturday) };
};
