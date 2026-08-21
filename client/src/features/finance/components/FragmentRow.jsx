import { Check, ChevronDown } from 'lucide-react'
import { PaidBadge } from './PaidBadge'
import { ExpandedHistory } from './ExpandedHistory'

export function FragmentRow({ row: r, isExpanded, history, onToggle, onMarkPaid }) {
  return (
    <>
      <tr className="border-b border-espresso/8 last:border-0 hover:bg-crust/20 cursor-pointer" onClick={onToggle}>
        <td className="px-4 py-3">
          <ChevronDown className={`h-4 w-4 text-espresso/40 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </td>
        <td className="px-4 py-3 font-medium text-espresso">{r.vendor}</td>
        <td className="px-4 py-3 text-espresso/70">{r.materialName}</td>
        <td className="px-4 py-3 text-right font-mono text-espresso/60">{r.quantity} {r.unit} × ₹{r.unitCost}</td>
        <td className="px-4 py-3 text-right font-mono font-semibold text-espresso">₹{r.amount.toLocaleString('en-IN')}</td>
        <td className="px-4 py-3 font-mono text-xs text-espresso/50">{new Date(r.purchaseDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</td>
        <td className="px-4 py-3"><PaidBadge status={r.status} /></td>
        <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
          {r.status === 'outstanding' ? (
            <button
              onClick={onMarkPaid}
              className="inline-flex items-center gap-1 rounded-lg bg-matcha-glaze/15 px-2.5 py-1.5 text-xs font-medium text-matcha-glaze hover:bg-matcha-glaze/25"
            >
              <Check className="h-3.5 w-3.5" /> Mark Paid
            </button>
          ) : (
            <span className="font-mono text-xs text-espresso/40">{r.paidDate ? new Date(r.paidDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : ''}</span>
          )}
        </td>
      </tr>
      {isExpanded && (
        <tr className="bg-crust/20">
          <td colSpan={8} className="px-4 py-4">
            <ExpandedHistory history={history} materialName={r.materialName} />
          </td>
        </tr>
      )}
    </>
  )
}
