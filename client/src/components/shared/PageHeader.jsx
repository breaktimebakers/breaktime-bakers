export function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <p className="font-mono text-[11px] uppercase tracking-wider text-oven-amber">{eyebrow}</p>
        )}
        <h1 className="mt-1 font-display text-3xl font-semibold leading-tight text-espresso sm:text-4xl lg:text-5xl">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-2xl text-sm text-espresso/60 sm:text-base">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 sm:shrink-0">{actions}</div>}
    </div>
  )
}
