import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Plus, MapPin, ArrowRight, Store, LayoutGrid, Table as TableIcon } from 'lucide-react'
import { useAreas, useCreateArea } from '@/features/sales/hooks'
import { Button, EmptyState, Field, Modal, PageHeader, inputClass } from '@/components/shared'

function AddAreaModal({ open, onClose }) {
  const createArea = useCreateArea()
  const [form, setForm] = useState({ name: '', city: 'Mumbai', pincode: '' })

  const submit = async () => {
    if (!form.name) return
    try {
      await createArea.mutateAsync(form)
      setForm({ name: '', city: 'Mumbai', pincode: '' })
      onClose()
    } catch {
      // Error already surfaced as a toast by useCreateArea.
    }
  }

  const busy = createArea.isPending

  return (
    <Modal open={open} onClose={onClose} eyebrow="Sales / Areas" title="Add area" footer={<><Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button><Button onClick={submit} disabled={busy}>{busy ? 'Adding...' : 'Add area'}</Button></>}>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2"><Field label="Area name" required><input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Bandra" /></Field></div>
        <Field label="City" required><input className={inputClass} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></Field>
        <Field label="Pincode" required><input className={inputClass} value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} /></Field>
      </div>
    </Modal>
  )
}

export default function AreasList() {
  const { data: areas = [], isLoading, isError } = useAreas()
  const [addOpen, setAddOpen] = useState(false)
  const [view, setView] = useState('cards')

  return (
    <div>
      <PageHeader eyebrow="Sales / Areas" title="Areas" description="Sales territories and the stores within them." actions={<Button onClick={() => setAddOpen(true)}><Plus className="h-4 w-4" /> Add area</Button>} />

      {isLoading ? (
        <p className="px-1 py-8 text-center text-sm text-espresso/40">Loading areas...</p>
      ) : isError ? (
        <EmptyState icon={MapPin} title="Could not load areas" description="Something went wrong fetching sales territories. Try refreshing." />
      ) : areas.length === 0 ? (
        <EmptyState icon={MapPin} title="No areas yet" description="Add a sales territory to get started." />
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-bakery border border-espresso/8 bg-proof-cream px-4 py-3 shadow-bakery">
            <p className="text-sm font-medium text-espresso/60">
              {areas.length} {areas.length === 1 ? 'area' : 'areas'}
            </p>
            <div className="inline-flex rounded-full bg-crust p-0.5">
              <button
                onClick={() => setView('cards')}
                className={`rounded-full p-1.5 ${view === 'cards' ? 'bg-espresso text-crust' : 'text-espresso/60'}`}
                aria-label="Show areas as cards"
                title="Cards"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setView('table')}
                className={`rounded-full p-1.5 ${view === 'table' ? 'bg-espresso text-crust' : 'text-espresso/60'}`}
                aria-label="Show areas as table"
                title="Table"
              >
                <TableIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          {view === 'cards' ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {areas.map((area) => (
                <Link key={area.id} to="/sales/areas/$areaId" params={{ areaId: area.id }} className="group rounded-bakery border border-espresso/8 bg-proof-cream p-5 shadow-bakery transition-all hover:-translate-y-0.5 hover:shadow-bakery-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-bakery bg-oven-amber/15 text-oven-amber">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-espresso/5 px-2.5 py-1 text-xs font-medium text-espresso/70">
                      <Store className="h-3 w-3" /> {area.storeCount} {area.storeCount === 1 ? 'store' : 'stores'}
                    </span>
                  </div>
                  <h3 className="mt-4 font-display text-lg font-semibold text-espresso">{area.name}</h3>
                  <p className="text-sm text-espresso/50">{area.city} / {area.pincode}</p>
                  <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-oven-amber">
                    View stores
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="overflow-hidden rounded-bakery border border-espresso/8 bg-proof-cream shadow-bakery">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] text-sm">
                  <thead>
                    <tr className="border-b border-espresso/10 bg-crust/30 text-left">
                      <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-espresso/50">Area</th>
                      <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-espresso/50">City</th>
                      <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-espresso/50">Pincode</th>
                      <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-espresso/50">Stores</th>
                      <th className="px-4 py-3 text-right font-mono text-[10px] uppercase tracking-wider text-espresso/50">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {areas.map((area) => (
                      <tr key={area.id} className="border-b border-espresso/8 last:border-0 hover:bg-crust/20">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-bakery bg-oven-amber/15 text-oven-amber">
                              <MapPin className="h-4 w-4" />
                            </div>
                            <p className="font-medium text-espresso">{area.name}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-espresso/70">{area.city}</td>
                        <td className="px-4 py-3 font-mono text-xs text-espresso/60">{area.pincode}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 rounded-full bg-espresso/5 px-2.5 py-1 text-xs font-medium text-espresso/70">
                            <Store className="h-3 w-3" /> {area.storeCount} {area.storeCount === 1 ? 'store' : 'stores'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end">
                            <Link
                              to="/sales/areas/$areaId"
                              params={{ areaId: area.id }}
                              className="inline-flex items-center gap-1.5 rounded-bakery px-2.5 py-1.5 text-sm font-medium text-oven-amber hover:bg-oven-amber/10"
                            >
                              View stores
                              <ArrowRight className="h-4 w-4" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      <AddAreaModal open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  )
}
