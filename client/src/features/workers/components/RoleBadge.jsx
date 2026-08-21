const roleConfig = {
  chef: { label: 'Chef', className: 'bg-matcha-glaze/15 text-matcha-glaze border-matcha-glaze/20' },
  labour: { label: 'Labour', className: 'bg-oven-amber/15 text-oven-amber border-oven-amber/20' },
  delivery: { label: 'Delivery', className: 'bg-berry-jam/15 text-berry-jam border-berry-jam/20' },
  marketer: { label: 'Marketer', className: 'bg-olive-herb/15 text-olive-herb border-olive-herb/20' },
}

export function RoleBadge({ role }) {
  const cfg = roleConfig[role]
  if (!cfg) return null
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.className}`}>
      {cfg.label}
    </span>
  )
}

export { roleConfig }
