const META = {
  paid: { label: 'Paid', className: 'bg-matcha-glaze/15 text-matcha-glaze', dot: 'bg-matcha-glaze' },
  partial: { label: 'Partial', className: 'bg-oven-amber/15 text-oven-amber', dot: 'bg-oven-amber' },
  unpaid: { label: 'Outstanding', className: 'bg-cherry-compote/15 text-cherry-compote', dot: 'bg-cherry-compote' },
  outstanding: { label: 'Outstanding', className: 'bg-cherry-compote/15 text-cherry-compote', dot: 'bg-cherry-compote' },
}

export function PaidBadge({ status }) {
  const meta = META[status] || META.outstanding
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${meta.className}`}>
      <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  )
}
