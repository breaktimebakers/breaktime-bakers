export function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-bakery border-2 border-dashed border-espresso/15 px-6 py-12 text-center">
      {Icon && (
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-espresso/5 text-espresso/40">
          <Icon className="h-6 w-6" />
        </div>
      )}
      <p className="font-display text-lg font-medium text-espresso/70">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-espresso/45">{description}</p>}
    </div>
  )
}
