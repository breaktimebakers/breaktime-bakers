export function PaidBadge({ status }) {
  const isPaid = status === 'paid'
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
      isPaid ? 'bg-matcha-glaze/15 text-matcha-glaze' : 'bg-cherry-compote/15 text-cherry-compote'
    }`}>
      <span className={`h-2 w-2 rounded-full ${isPaid ? 'bg-matcha-glaze' : 'bg-cherry-compote'}`} />
      {isPaid ? 'Paid' : 'Outstanding'}
    </span>
  )
}
