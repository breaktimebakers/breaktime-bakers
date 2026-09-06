export const formatNumber = (value, options) =>
  (Number(value) || 0).toLocaleString('en-IN', options)

export const formatCurrency = (value) =>
  `₹${(Number(value) || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

// timeZone is pinned to Asia/Kolkata (not left to the viewer's machine) -
// this business is India-only, so a date like an order's orderDate must
// display as the same calendar day for every viewer regardless of what
// timezone their own browser happens to be set to. See dateCalc.js for
// why the same reasoning applies to date *math*, not just display.
export const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })

export const formatDateShort = (date) =>
  new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', timeZone: 'Asia/Kolkata' })
