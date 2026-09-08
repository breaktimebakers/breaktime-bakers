import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Plus, MapPin, ArrowRight, Store, LayoutGrid, Table as TableIcon, FolderInput, Search } from 'lucide-react'
import { useAreas, useCreateArea, useUnassignedStores, useBulkAssignStores } from '@/features/sales/hooks'
import { Button, EmptyState, ErrorState, Field, Modal, PageHeader, inputClass } from '@/components/shared'

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

// Stores just removed from an area, waiting to be moved into a new one -
// e.g. after splitting a 100-store area into two. Only rendered once
// there's actually something to assign, so it stays invisible for the
// vast majority of admins who never split an area.
function UnassignedStoresBanner() {
  const { data: unassigned = [] } = useUnassignedStores()
  const [modalOpen, setModalOpen] = useState(false)

  if (unassigned.length === 0) return null

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        className="mb-4 flex w-full items-center justify-between gap-3 rounded-bakery border border-oven-amber/30 bg-oven-amber/10 px-4 py-3 text-left transition hover:bg-oven-amber/15"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-espresso">
          <FolderInput className="h-4 w-4 text-oven-amber" />
          {unassigned.length} {unassigned.length === 1 ? 'store has' : 'stores have'} no area
        </span>
        <span className="text-sm font-medium text-oven-amber">Assign now</span>
      </button>
      <AssignUnassignedStoresModal open={modalOpen} onClose={() => setModalOpen(false)} stores={unassigned} />
    </>
  )
}

function AssignUnassignedStoresModal({ open, onClose, stores }) {
  const { data: areas = [] } = useAreas()
  const bulkAssign = useBulkAssignStores()
  const [selectedIds, setSelectedIds] = useState([])
  const [targetAreaId, setTargetAreaId] = useState('')

  const toggleSelected = (id) => {
    setSelectedIds((current) => (current.includes(id) ? current.filter((s) => s !== id) : [...current, id]))
  }

  const selectAll = () => setSelectedIds(selectedIds.length === stores.length ? [] : stores.map((s) => s.id))

  const submit = async () => {
    if (!targetAreaId || selectedIds.length === 0) return
    try {
      await bulkAssign.mutateAsync({ storeIds: selectedIds, areaId: targetAreaId })
      setSelectedIds([])
      setTargetAreaId('')
      onClose()
    } catch {
      // Error already surfaced as a toast by useBulkAssignStores.
    }
  }

  const busy = bulkAssign.isPending

  return (
    <Modal
      open={open}
      onClose={onClose}
      eyebrow="Sales / Areas"
      title="Assign unassigned stores"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button onClick={submit} disabled={busy || !targetAreaId || selectedIds.length === 0}>
            {busy ? 'Assigning…' : `Assign ${selectedIds.length || ''} to area`}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Field label="Move selected stores to" required>
          <select className={inputClass} value={targetAreaId} onChange={(e) => setTargetAreaId(e.target.value)}>
            <option value="">Select an area…</option>
            {areas.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </Field>

        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-espresso/50">{selectedIds.length} of {stores.length} selected</p>
          <button onClick={selectAll} className="text-xs font-medium text-oven-amber hover:underline">
            {selectedIds.length === stores.length ? 'Deselect all' : 'Select all'}
          </button>
        </div>

        <div className="max-h-72 space-y-1.5 overflow-y-auto rounded-bakery border border-espresso/8">
          {stores.map((s) => (
            <label
              key={s.id}
              className="flex cursor-pointer items-center gap-3 border-b border-espresso/6 px-3 py-2.5 last:border-0 hover:bg-crust/30"
            >
              <input
                type="checkbox"
                checked={selectedIds.includes(s.id)}
                onChange={() => toggleSelected(s.id)}
                className="h-4 w-4 rounded border-espresso/20 text-oven-amber"
              />
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-bakery bg-sourdough/40 text-espresso">
                <Store className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <p className="truncate text-sm font-medium text-espresso">{s.dealerName}</p>
                {s.address && <p className="truncate text-xs text-espresso/50">{s.address}</p>}
              </span>
            </label>
          ))}
        </div>
      </div>
    </Modal>
  )
}

export default function AreasList() {
  const { data: areas = [], isLoading, isError, isFetching, refetch } = useAreas()
  const [addOpen, setAddOpen] = useState(false)
  const [view, setView] = useState('cards')
  const [search, setSearch] = useState('')

  const filteredAreas = areas.filter((area) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return `${area.name} ${area.city} ${area.pincode}`.toLowerCase().includes(q)
  })

  return (
    <div>
      <PageHeader eyebrow="Sales / Areas" title="Areas" description="Sales territories and the stores within them." actions={<Button onClick={() => setAddOpen(true)}><Plus className="h-4 w-4" /> Add area</Button>} />

      <UnassignedStoresBanner />

      {isError ? (
        <ErrorState description="Could not load areas." onRetry={refetch} retrying={isFetching} />
      ) : isLoading ? (
        <p className="px-1 py-8 text-center text-sm text-espresso/40">Loading areas...</p>
      ) : areas.length === 0 ? (
        <EmptyState icon={MapPin} title="No areas yet" description="Add a sales territory to get started." />
      ) : (
        <>
          <div className="mb-4 rounded-bakery border border-espresso/8 bg-proof-cream p-4 shadow-bakery">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative flex-1 lg:min-w-[200px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-espresso/30" />
                <input className={`${inputClass} pl-9`} placeholder="Search area, city, or pincode..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <div className="ml-auto inline-flex rounded-full bg-crust p-0.5">
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
            <p className="mt-3 text-xs text-espresso/50">{filteredAreas.length} {filteredAreas.length === 1 ? 'area' : 'areas'}</p>
          </div>

          {filteredAreas.length === 0 ? (
            <EmptyState icon={MapPin} title="No areas match" description="Try a different search." />
          ) : view === 'cards' ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredAreas.map((area) => (
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
                    {filteredAreas.map((area) => (
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
