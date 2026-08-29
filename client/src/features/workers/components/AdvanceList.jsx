import { Trash2 } from 'lucide-react'
import { useDeleteAdvance } from '../hooks'

// One month's worth of a worker's advances (whichever month the caller's
// month navigator is browsing), newest first - add + delete only, no
// editing (matches how Expenses already work).
export function AdvanceList({ advances }) {
  const deleteAdvance = useDeleteAdvance()

  if (advances.length === 0) {
    return <p className="text-sm text-espresso/40">No advances given this month.</p>
  }

  return (
    <div className="space-y-2">
      {advances.map((a) => (
        <div key={a.id} className="flex items-center justify-between rounded-lg border border-espresso/8 bg-crust/20 px-3 py-2">
          <div>
            <p className="text-sm font-medium text-espresso">₹{Number(a.amount).toLocaleString('en-IN')}</p>
            <p className="text-xs text-espresso/40">
              {new Date(a.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              {a.note && ` · ${a.note}`}
            </p>
          </div>
          <button
            onClick={() => deleteAdvance.mutate(a.id)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-cherry-compote hover:bg-cherry-compote/10"
            title="Delete advance"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  )
}
