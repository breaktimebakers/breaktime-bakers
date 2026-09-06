import { Button } from './Button'

// A failed query is NOT the same as an empty successful one (see EmptyState)
// - this is the distinct, `role="alert"` treatment with a Retry action.
// Used two ways: fully replacing a list/table/form that has nothing
// sensible to show without the data, or as a banner above a stats section
// that can still render its other fields with a '-' fallback (see
// OrderTakerSchedule.jsx and SalesOverview.jsx for the two originals this
// mirrors).
export function ErrorState({ description, onRetry, retrying }) {
  return (
    <div role="alert" className="rounded-bakery border border-cherry-compote/30 bg-proof-cream p-4">
      <p className="mb-3 text-sm text-cherry-compote">{description}</p>
      {onRetry && <Button variant="secondary" onClick={onRetry} disabled={retrying}>{retrying ? 'Retrying…' : 'Retry'}</Button>}
    </div>
  )
}
