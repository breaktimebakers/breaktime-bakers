import { useState, useRef } from 'react'
import { Link, useParams } from '@tanstack/react-router'
import { Store, Phone, MapPin, Plus, Navigation, Pencil } from 'lucide-react'
import { useArea, useStores, useCreateStore, useUpdateStore, useUpdateStoreStatus } from '@/features/sales/hooks'
import { Button, EmptyState, Field, Modal, PageHeader, inputClass } from '@/components/shared'

function MapPicker({ lat, lng, onChange }) {
  const ref = useRef(null)
  const [pin, setPin] = useState(lat && lng ? { x: 50, y: 50 } : null)

  const handleClick = (e) => {
    const rect = ref.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setPin({ x, y })
    const newLat = 19.0 + (y / 100) * 0.2
    const newLng = 72.8 + (x / 100) * 0.2
    onChange({ lat: newLat.toFixed(4), lng: newLng.toFixed(4) })
  }

  return (
    <div>
      <div
        ref={ref}
        onClick={handleClick}
        className="relative h-44 cursor-crosshair overflow-hidden rounded-lg border-2 border-dashed border-espresso/20"
        style={{
          backgroundColor: '#F7EFE2',
          backgroundImage: 'linear-gradient(rgba(59,42,33,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(59,42,33,0.06) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      >
        {pin && (
          <div className="absolute -translate-x-1/2 -translate-y-full" style={{ left: `${pin.x}%`, top: `${pin.y}%` }}>
            <MapPin className="h-7 w-7 text-cherry-compote" fill="currentColor" />
          </div>
        )}
        {!pin && <p className="absolute inset-0 flex items-center justify-center text-xs text-espresso/40">Click to drop pin</p>}
      </div>
      <p className="mt-1 text-[11px] text-espresso/40">Connect Google Maps API key to enable live pin drop.</p>
    </div>
  )
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
  const [form, setForm] = useState(() => store
    ? { dealerName: store.dealerName || '', shopName: store.shopName || '', dealerPhone: store.dealerPhone || '', storeType: store.storeType || 'Shop', address: store.address || '', lat: store.lat ?? '', lng: store.lng ?? '', isActive: store.isActive }
    : { dealerName: '', shopName: '', dealerPhone: '', storeType: 'Shop', address: '', lat: '', lng: '', isActive: true }
  )

  const busy = createStore.isPending || updateStore.isPending || updateStoreStatus.isPending

  const submit = async () => {
    if (!form.dealerName) return

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
    <Modal open={open} onClose={onClose} eyebrow="Sales / Stores" title={isEdit ? 'Edit store' : 'Add store'} footer={<><Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button><Button onClick={submit} disabled={busy}>{busy ? 'Saving…' : isEdit ? 'Save changes' : 'Add store'}</Button></>}>
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
          <Field label="Location"><MapPicker lat={form.lat} lng={form.lng} onChange={({ lat, lng }) => setForm({ ...form, lat, lng })} /></Field>
        </div>
        <Field label="Latitude"><input className={inputClass} value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} /></Field>
        <Field label="Longitude"><input className={inputClass} value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })} /></Field>

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

  if (areaLoading) return <p className="px-1 py-8 text-center text-sm text-espresso/40">Loading area…</p>
  if (areaError || !area) return <EmptyState icon={MapPin} title="Area not found" description="This area does not exist." />

  const openAdd = () => { setEditStore(null); setModalOpen(true) }
  const openEdit = (store) => { setEditStore(store); setModalOpen(true) }

  return (
    <div>
      <div className="mb-4 flex items-center gap-1.5 text-sm text-espresso/50">
        <Link to="/sales/areas" className="hover:text-oven-amber">Areas</Link>
        <span>/</span>
        <span className="text-espresso">{area.name}</span>
      </div>

      <PageHeader eyebrow="Sales / Areas" title={area.name} description={`${area.city} · ${area.pincode} · ${stores.length} ${stores.length === 1 ? 'store' : 'stores'}`} actions={<Button onClick={openAdd}><Plus className="h-4 w-4" /> Add store</Button>} />

      {storesLoading ? (
        <p className="px-1 py-8 text-center text-sm text-espresso/40">Loading stores…</p>
      ) : stores.length === 0 ? (
        <EmptyState icon={Store} title="No stores yet" description="Add a store to this area." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {stores.map((s) => (
            <div key={s.id} className="rounded-bakery border border-espresso/8 bg-proof-cream p-5 shadow-bakery">
              <div className="flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-bakery bg-sourdough/40 text-espresso">
                  <Store className="h-5 w-5" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-espresso/5 px-2.5 py-1 text-xs font-medium text-espresso/70">{s.storeType}</span>
                  <button onClick={() => openEdit(s)} className="flex h-8 w-8 items-center justify-center rounded-lg text-espresso/50 hover:bg-espresso/5 hover:text-espresso" title="Edit store">
                    <Pencil className="h-4 w-4" />
                  </button>
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
              {s.lat && s.lng && (
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
      )}

      <StoreFormModal open={modalOpen} onClose={() => setModalOpen(false)} areaId={areaId} store={editStore} />
    </div>
  )
}
