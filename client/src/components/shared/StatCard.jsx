export function StatCard({ label, value, icon: Icon, chipColor, danger }) {
  return (
    <div className={`rounded-bakery border bg-proof-cream p-4 shadow-bakery transition-all hover:-translate-y-0.5 hover:shadow-bakery-lg sm:p-5 ${danger ? 'border-cherry-compote/30' : 'border-espresso/8'}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-espresso/50">{label}</p>
          <p className={`mt-1.5 font-mono text-2xl font-bold sm:text-3xl ${danger ? 'text-cherry-compote' : 'text-espresso'}`}>{value}</p>
        </div>
        {Icon && (
          <div className={`flex h-10 w-10 items-center justify-center rounded-bakery ${chipColor}`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  )
}
