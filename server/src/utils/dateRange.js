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
