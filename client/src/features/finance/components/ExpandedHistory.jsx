
import { PaidBadge } from './PaidBadge'

export function ExpandedHistory({ history, materialName, mobile }) {
  if (history.length === 0) {
    return <p className="text-xs text-espresso/40">No previous purchases for this material.</p>
  }
  return (
    <div>
      <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-espresso/50">Previous bills — {materialName}</p>
      <div className={mobile ? 'mt-2' : 'rounded-lg border border-espresso/8 bg-crust/20'}>
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-espresso/40">
              <th className="px-3 py-2 font-mono text-[10px] uppercase">Vendor</th>
              <th className="px-3 py-2 text-right font-mono text-[10px] uppercase">Qty × Rate</th>
              <th className="px-3 py-2 text-right font-mono text-[10px] uppercase">Amount</th>
              <th className="px-3 py-2 font-mono text-[10px] uppercase">Date</th>
              <th className="px-3 py-2 font-mono text-[10px] uppercase">Status</th>
            </tr>
          </thead>
          <tbody>
            {history.map((h) => (
              <tr key={h.lotId} className="border-t border-espresso/5">
                <td className="px-3 py-2 text-espresso/70">{h.vendor}</td>
                <td className="px-3 py-2 text-right font-mono text-espresso/50">{h.quantity} {h.unit} × ₹{h.unitCost}</td>
                <td className="px-3 py-2 text-right font-mono font-medium text-espresso">₹{h.amount.toLocaleString('en-IN')}</td>
                <td className="px-3 py-2 font-mono text-espresso/40">{new Date(h.purchaseDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</td>
                <td className="px-3 py-2"><PaidBadge status={h.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
