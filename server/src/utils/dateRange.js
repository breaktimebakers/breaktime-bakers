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
