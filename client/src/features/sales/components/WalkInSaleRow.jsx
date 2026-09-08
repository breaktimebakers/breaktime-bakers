import { Check } from 'lucide-react'

// Shared between Sales' own Walk-in Sales page and Finance's read-only
// Local/Walk-in view (CustomerPaymentsLocal.jsx) - one row shape, same
// reasoning as CustomerPayments.jsx's PaymentEntryRow. onSettle is
// omitted entirely on the Finance side, which is view-only.
export function WalkInSaleRow({ sale, onSettle }) {
  const isPaid = sale.paymentStatus === 'paid'
  const balance = Number(sale.amount) - Number(sale.amountPaid || 0)
  return (
    <div className="rounded-bakery border border-espresso/8 bg-proof-cream p-4 shadow-bakery transition hover:shadow-bakery-lg">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-espresso">{sale.productName}</p>
          <p className="mt-0.5 font-mono text-xs text-espresso/40">
            {new Date(sale.saleDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            {' · '}{sale.quantity} {sale.unit}
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono font-semibold text-espresso">₹{Number(sale.amount).toLocaleString('en-IN')}</p>
          {!isPaid && <p className="font-mono text-xs text-matcha-glaze">Paid ₹{Number(sale.amountPaid || 0).toLocaleString('en-IN')}</p>}
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
          isPaid ? 'bg-matcha-glaze/15 text-matcha-glaze' : 'bg-cherry-compote/15 text-cherry-compote'
        }`}>
          <span className={`h-2 w-2 rounded-full ${isPaid ? 'bg-matcha-glaze' : 'bg-cherry-compote'}`} />
          {isPaid ? 'Paid' : 'Partial'}
        </span>
      </div>
      {!isPaid && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-espresso/50">Remaining: <span className="font-mono font-medium text-cherry-compote">₹{balance.toLocaleString('en-IN')}</span></span>
            <span className="font-mono text-espresso/40">{Math.round((Number(sale.amountPaid || 0) / Number(sale.amount)) * 100)}% paid</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-crust/40">
            <div className="h-full rounded-full bg-matcha-glaze/60" style={{ width: `${(Number(sale.amountPaid || 0) / Number(sale.amount)) * 100}%` }} />
          </div>
          {onSettle && (
            <button onClick={() => onSettle(sale.id)} className="mt-2 inline-flex items-center gap-1 rounded-lg bg-matcha-glaze/15 px-2.5 py-1.5 text-xs font-medium text-matcha-glaze hover:bg-matcha-glaze/25">
              <Check className="h-3.5 w-3.5" /> Mark Fully Paid
            </button>
          )}
        </div>
      )}
    </div>
  )
}
