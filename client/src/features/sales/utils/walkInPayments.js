// Single source of truth for a walk-in sale's money math - balance and
// amount actually collected. Pulled out after the same "sum full amount
// instead of amount minus amountPaid" bug showed up independently in
// WalkInSales.jsx, CustomerPayments.jsx and CustomerPaymentsLocal.jsx;
// fold any future per-sale money calc in here instead of adding a fifth
// copy, same reasoning as computeGrossSalaryForMonth for workers' salary.

// What's still owed on one sale - 0 once it's fully paid.
export const walkInBalance = (sale) => Number(sale.amount) - Number(sale.amountPaid || 0)

// What's actually been collected on one sale - the full amount once
// paid, otherwise whatever's been paid toward it so far.
export const walkInCollected = (sale) =>
  sale.paymentStatus === 'paid' ? Number(sale.amount) : Number(sale.amountPaid || 0)

// Total still owed across a list of sales.
export const sumWalkInOutstanding = (sales) =>
  sales.filter((s) => s.paymentStatus === 'partial').reduce((sum, s) => sum + walkInBalance(s), 0)

// Total actually collected across a list of sales - includes partial
// payments already made toward not-yet-fully-paid sales.
export const sumWalkInPaid = (sales) => sales.reduce((sum, s) => sum + walkInCollected(s), 0)
