export const inputClass =
  'w-full rounded-lg border border-espresso/15 bg-crust/40 px-3 py-2 text-sm text-espresso placeholder:text-espresso/30 focus:border-oven-amber focus:outline-none focus:ring-2 focus:ring-oven-amber/30 transition'

export function Field({ label, children, hint, required }) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-xs font-medium text-espresso/70">
          {label}{required && <span className="text-cherry-compote"> *</span>}
        </span>
      )}
      {children}
      {hint && <span className="mt-1 block text-xs text-espresso/40">{hint}</span>}
    </label>
  )
}
