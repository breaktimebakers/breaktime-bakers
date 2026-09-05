import { useState, useEffect } from 'react'
import { Link, useParams } from '@tanstack/react-router'
import { Store, Phone, MapPin, Plus, Navigation, Pencil, LayoutGrid, Table as TableIcon, CheckSquare, X, FolderMinus } from 'lucide-react'
import { useArea, useStores, useCreateStore, useUpdateStore, useUpdateStoreStatus, useBulkUnassignStores } from '@/features/sales/hooks'
import { Button, EmptyState, Field, Modal, PageHeader, inputClass } from '@/components/shared'
import { StoreLocationPicker } from '@/features/sales/components/StoreLocationPicker'
import { AreaStoresMap } from '@/features/sales/components/AreaStoresMap'

const hasValidStoreLocation = (store) => {
  if (store?.lat === null || store?.lat === undefined || store?.lat === '') return false
  if (store?.lng === null || store?.lng === undefined || store?.lng === '') return false

  const lat = Number(store.lat)
  const lng = Number(store.lng)
  return Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
}

// Green/red status dot - whether this dealer is currently taking product
// from us. Only shown/changeable in the edit form for an existing store;
// a new store always starts active.
function StatusDot({ active }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${active ? 'text-matcha-glaze' : 'text-cherry-compote'}`}>
      <span className={`h-2 w-2 rounded-full ${active ? 'bg-matcha-glaze' : 'bg-cherry-compote'}`} />
      {active ? 'Active' : 'Inactive'}
    </span>
  )
}

function StoreFormModal({ open, onClose, areaId, store }) {
  const createStore = useCreateStore()
  const updateStore = useUpdateStore()
  const updateStoreStatus = useUpdateStoreStatus()
  const isEdit = !!store
  const hasSavedLocation = isEdit && hasValidStoreLocation(store)
  const [form, setForm] = useState({ dealerName: '', shopName: '', dealerPhone: '', storeType: 'Shop', address: '', lat: '', lng: '', isActive: true })
  const [locationAuthorized, setLocationAuthorized] = useState(false)

  // This modal instance stays mounted across different "Edit" clicks (only
  // `open`/`store` change), so reset on every open as well as when switching
  // stores. This also clears a completed/cancelled Add Store form when the
  // next Add Store modal opens with the same null `store` prop.
  useEffect(() => {
    if (!open) return

    setLocationAuthorized(hasSavedLocation)
    setForm(store
      ? { dealerName: store.dealerName || '', shopName: store.shopName || '', dealerPhone: store.dealerPhone || '', storeType: store.storeType || 'Shop', address: store.address || '', lat: store.lat ?? '', lng: store.lng ?? '', isActive: store.isActive }
      : { dealerName: '', shopName: '', dealerPhone: '', storeType: 'Shop', address: '', lat: '', lng: '', isActive: true }
    )
  }, [open, store, hasSavedLocation])

  const busy = createStore.isPending || updateStore.isPending || updateStoreStatus.isPending

  const submit = async () => {
    if (!form.dealerName || (!isEdit && !locationAuthorized)) return

    const body = {
      dealerName: form.dealerName,
      shopName: form.shopName || undefined,
      dealerPhone: form.dealerPhone || undefined,
      storeType: form.storeType,
      address: form.address || undefined,
      lat: form.lat === '' ? undefined : form.lat,
      lng: form.lng === '' ? undefined : form.lng,
    }

    try {
      if (isEdit) {
        await updateStore.mutateAsync({ id: store.id, body })
        // Status lives on a separate endpoint (see PATCH /stores/:id/status)
        // - only call it when the toggle actually changed, so editing
        // other fields never fires a redundant "marked active" toast.
        if (form.isActive !== store.isActive) {
          await updateStoreStatus.mutateAsync({ id: store.id, isActive: form.isActive })
        }
      } else {
        await createStore.mutateAsync({ areaId, body })
      }
      onClose()
    } catch {
      // Errors already surfaced as toasts by the mutation hooks - keep
      // the form open so the admin can fix and retry.
    }
  }

  return (
    <Modal open={open} onClose={onClose} eyebrow="Sales / Stores" title={isEdit ? 'Edit store' : 'Add store'} footer={<><Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button><Button onClick={submit} disabled={busy || (!isEdit && !locationAuthorized)}>{busy ? 'Saving…' : !isEdit && !locationAuthorized ? 'Allow location first' : isEdit ? 'Save changes' : 'Add store'}</Button></>}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Dealer name" required><input className={inputClass} value={form.dealerName} onChange={(e) => setForm({ ...form, dealerName: e.target.value })} /></Field>
        <Field label="Shop name"><input className={inputClass} value={form.shopName} onChange={(e) => setForm({ ...form, shopName: e.target.value })} placeholder="e.g. Sunrise Bakery" /></Field>
        <Field label="Phone"><input className={inputClass} value={form.dealerPhone} onChange={(e) => setForm({ ...form, dealerPhone: e.target.value })} /></Field>
        <Field label="Store type" required>
          <select className={inputClass} value={form.storeType} onChange={(e) => setForm({ ...form, storeType: e.target.value })}>
            <option>Shop</option><option>Canteen</option><option>Other</option>
          </select>
        </Field>
        <div className="col-span-2"><Field label="Address"><input className={inputClass} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field></div>
        <div className="col-span-2">
          <Field label="Location"><StoreLocationPicker lat={form.lat} lng={form.lng} requirePermission={!isEdit} onChange={({ lat, lng, address }) => setForm((current) => ({ ...current, lat, lng, address: address || current.address }))} onAuthorizationChange={setLocationAuthorized} /></Field>
        </div>
        <Field label="Latitude"><input type="number" inputMode="decimal" step="any" min="-90" max="90" className={inputClass} value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} /></Field>
        <Field label="Longitude"><input type="number" inputMode="decimal" step="any" min="-180" max="180" className={inputClass} value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })} /></Field>

        {isEdit && (
          <div className="col-span-2">
            <Field label="Status" hint="Is this dealer currently taking product from us?">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, isActive: true })}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition ${form.isActive ? 'border-matcha-glaze/40 bg-matcha-glaze/10 text-matcha-glaze' : 'border-espresso/10 bg-crust/30 text-espresso/50 hover:bg-crust/50'}`}
                >
                  <span className="h-2 w-2 rounded-full bg-matcha-glaze" /> Active
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, isActive: false })}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition ${!form.isActive ? 'border-cherry-compote/40 bg-cherry-compote/10 text-cherry-compote' : 'border-espresso/10 bg-crust/30 text-espresso/50 hover:bg-crust/50'}`}
                >
                  <span className="h-2 w-2 rounded-full bg-cherry-compote" /> Inactive
                </button>
              </div>
            </Field>
          </div>
        )}
      </div>
    </Modal>
  )
}

export default function AreaDetail() {
  const { areaId } = useParams({ strict: false })
  const { data: area, isLoading: areaLoading, isError: areaError } = useArea(areaId)
  const { data: stores = [], isLoading: storesLoading } = useStores(areaId)
  const [modalOpen, setModalOpen] = useState(false)
  const [editStore, setEditStore] = useState(null)
  const [view, setView] = useState('cards')
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])
  const bulkUnassign = useBulkUnassignStores()

  if (areaLoading) return <p className="px-1 py-8 text-center text-sm text-espresso/40">Loading area…</p>
  if (areaError || !area) return <EmptyState icon={MapPin} title="Area not found" description="This area does not exist." />

  const openAdd = () => { setEditStore(null); setModalOpen(true) }
  const openEdit = (store) => { setEditStore(store); setModalOpen(true) }

  const toggleSelectMode = () => {
    setSelectMode((current) => !current)
    setSelectedIds([])
  }

  const toggleSelected = (id) => {
    setSelectedIds((current) => (current.includes(id) ? current.filter((s) => s !== id) : [...current, id]))
  }

  const removeSelected = async () => {
    try {
      await bulkUnassign.mutateAsync({ storeIds: selectedIds })
      setSelectedIds([])
      setSelectMode(false)
    } catch {
      // Error already surfaced as a toast by useBulkUnassignStores.
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-1.5 text-sm text-espresso/50">
        <Link to="/sales/areas" className="hover:text-oven-amber">Areas</Link>
        <span>/</span>
        <span className="text-espresso">{area.name}</span>
      </div>

      <PageHeader
        eyebrow="Sales / Areas"
        title={area.name}
        description={`${area.city} · ${area.pincode} · ${stores.length} ${stores.length === 1 ? 'store' : 'stores'}`}
        actions={
          <>
            {stores.length > 0 && (
              <Button variant="secondary" onClick={toggleSelectMode}>
                {selectMode ? <X className="h-4 w-4" /> : <CheckSquare className="h-4 w-4" />}
                {selectMode ? 'Cancel' : 'Select stores'}
              </Button>
            )}
            <Button onClick={openAdd}><Plus className="h-4 w-4" /> Add store</Button>
          </>
        }
      />

      {selectMode && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-bakery border border-oven-amber/30 bg-oven-amber/10 px-4 py-3">
          <p className="text-sm font-medium text-espresso">
            {selectedIds.length} {selectedIds.length === 1 ? 'store' : 'stores'} selected
          </p>
          <Button
            variant="secondary"
            disabled={selectedIds.length === 0 || bulkUnassign.isPending}
            onClick={removeSelected}
          >
            <FolderMinus className="h-4 w-4" />
            {bulkUnassign.isPending ? 'Removing…' : 'Remove from area'}
          </Button>
        </div>
      )}

      {storesLoading ? (
        <p className="px-1 py-8 text-center text-sm text-espresso/40">Loading stores…</p>
      ) : stores.length === 0 ? (
        <EmptyState icon={Store} title="No stores yet" description="Add a store to this area." />
      ) : (
        <>
          <AreaStoresMap stores={stores} />

          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-bakery border border-espresso/8 bg-proof-cream px-4 py-3 shadow-bakery">
            <p className="text-sm font-medium text-espresso/60">
              {stores.length} {stores.length === 1 ? 'store' : 'stores'}
            </p>
            <div className="inline-flex rounded-full bg-crust p-0.5">
              <button
                onClick={() => setView('cards')}
                className={`rounded-full p-1.5 ${view === 'cards' ? 'bg-espresso text-crust' : 'text-espresso/60'}`}
                aria-label="Show stores as cards"
                title="Cards"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setView('table')}
                className={`rounded-full p-1.5 ${view === 'table' ? 'bg-espresso text-crust' : 'text-espresso/60'}`}
                aria-label="Show stores as table"
                title="Table"
              >
                <TableIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          {view === 'cards' ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {stores.map((s) => (
                <div
                  key={s.id}
                  onClick={selectMode ? () => toggleSelected(s.id) : undefined}
                  className={`rounded-bakery border p-5 shadow-bakery transition-colors ${selectMode ? 'cursor-pointer' : ''} ${selectMode && selectedIds.includes(s.id) ? 'border-oven-amber bg-oven-amber/5' : 'border-espresso/8 bg-proof-cream'}`}
                >
                  <div className="flex items-start justify-between">
                    {selectMode ? (
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(s.id)}
                        onChange={() => toggleSelected(s.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="h-5 w-5 rounded border-espresso/20 text-oven-amber"
                      />
                    ) : (
                      <div className="flex h-11 w-11 items-center justify-center rounded-bakery bg-sourdough/40 text-espresso">
                        <Store className="h-5 w-5" />
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-espresso/5 px-2.5 py-1 text-xs font-medium text-espresso/70">{s.storeType}</span>
                      {!selectMode && (
                        <button onClick={() => openEdit(s)} className="flex h-8 w-8 items-center justify-center rounded-lg text-espresso/50 hover:bg-espresso/5 hover:text-espresso" title="Edit store">
                          <Pencil className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <h3 className="mt-4 font-display text-lg font-semibold text-espresso">{s.dealerName}</h3>
                  {s.shopName && <p className="text-sm font-medium text-oven-amber">{s.shopName}</p>}
                  <p className="text-sm text-espresso/55">{s.address}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-sm text-espresso/60">
                      <Phone className="h-3.5 w-3.5" /> {s.dealerPhone}
                    </div>
                    <StatusDot active={s.isActive} />
                  </div>
                  {hasValidStoreLocation(s) && (
                    <a
                      href={`https://www.google.com/maps?q=${s.lat},${s.lng}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-oven-amber hover:underline"
                    >
                      <Navigation className="h-3.5 w-3.5" /> View on map
                    </a>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-hidden rounded-bakery border border-espresso/8 bg-proof-cream shadow-bakery">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] text-sm">
                  <thead>
                    <tr className="border-b border-espresso/10 bg-crust/30 text-left">
                      {selectMode && <th className="w-10 px-4 py-3" />}
                      <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-espresso/50">Dealer</th>
                      <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-espresso/50">Shop</th>
                      <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-espresso/50">Type</th>
                      <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-espresso/50">Phone</th>
                      <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-espresso/50">Status</th>
                      <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-espresso/50">Address</th>
                      <th className="px-4 py-3 text-right font-mono text-[10px] uppercase tracking-wider text-espresso/50">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stores.map((s) => (
                      <tr
                        key={s.id}
                        onClick={selectMode ? () => toggleSelected(s.id) : undefined}
                        className={`border-b border-espresso/8 last:border-0 ${selectMode ? 'cursor-pointer' : ''} ${selectMode && selectedIds.includes(s.id) ? 'bg-oven-amber/5' : 'hover:bg-crust/20'}`}
                      >
                        {selectMode && (
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(s.id)}
                              onChange={() => toggleSelected(s.id)}
                              onClick={(e) => e.stopPropagation()}
                              className="h-4 w-4 rounded border-espresso/20 text-oven-amber"
                            />
                          </td>
                        )}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-bakery bg-sourdough/40 text-espresso">
                              <Store className="h-4 w-4" />
                            </div>
                            <p className="font-medium text-espresso">{s.dealerName}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-espresso/70">{s.shopName || '-'}</td>
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-espresso/5 px-2.5 py-1 text-xs font-medium text-espresso/70">{s.storeType}</span>
                        </td>
                        <td className="px-4 py-3 text-espresso/70">{s.dealerPhone || '-'}</td>
                        <td className="px-4 py-3"><StatusDot active={s.isActive} /></td>
                        <td className="max-w-[260px] truncate px-4 py-3 text-espresso/55">{s.address || '-'}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1.5">
                            {hasValidStoreLocation(s) && (
                              <a
                                href={`https://www.google.com/maps?q=${s.lat},${s.lng}`}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-oven-amber hover:bg-oven-amber/10"
                                title="View on map"
                              >
                                <Navigation className="h-4 w-4" />
                              </a>
                            )}
                            {!selectMode && (
                              <button onClick={() => openEdit(s)} className="flex h-8 w-8 items-center justify-center rounded-lg text-espresso/50 hover:bg-espresso/5 hover:text-espresso" title="Edit store">
                                <Pencil className="h-4 w-4" />
                              </button>
                            )}
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

      <StoreFormModal open={modalOpen} onClose={() => setModalOpen(false)} areaId={areaId} store={editStore} />
    </div>
  )
}
