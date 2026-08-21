export const formatNumber = (value, options) =>
  (Number(value) || 0).toLocaleString('en-IN', options)

export const formatCurrency = (value) =>
  `₹${(Number(value) || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

export const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

export const formatDateShort = (date) =>
  new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })

export const todayISO = () => new Date().toISOString().slice(0, 10)

export const daysAgo = (n) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}
