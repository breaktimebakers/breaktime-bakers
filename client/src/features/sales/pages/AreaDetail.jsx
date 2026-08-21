import { useState, useRef } from 'react'
import { Link, useParams } from '@tanstack/react-router'
import { Store, Phone, MapPin, Plus, Navigation, Pencil } from 'lucide-react'
import { useSales } from '@/features/sales/hooks'
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

function StoreFormModal({ open, onClose, areaId, store, onSave }) {
  const { addStore, updateStore } = useSales()
  const isEdit = !!store
  const [form, setForm] = useState(() => store
    ? { dealerName: store.dealerName || '', shopName: store.shopName || '', dealerPhone: store.dealerPhone || '', storeType: store.storeType || 'Shop', address: store.address || '', lat: store.lat || '', lng: store.lng || '' }
    : { dealerName: '', shopName: '', dealerPhone: '', storeType: 'Shop', address: '', lat: '', lng: '' }
  )

  const submit = () => {
    if (!form.dealerName) return
    if (isEdit) {
      updateStore(store.id, form)
    } else {
      addStore({ ...form, areaId })
    }
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} eyebrow="Sales / Stores" title={isEdit ? 'Edit store' : 'Add store'} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={submit}>{isEdit ? 'Save changes' : 'Add store'}</Button></>}>
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
      </div>
    </Modal>
  )
}

export default function AreaDetail() {
  const { areaId } = useParams({ strict: false })
  const { areas, stores } = useSales()
  const [modalOpen, setModalOpen] = useState(false)
  const [editStore, setEditStore] = useState(null)
  const area = areas.find((a) => a.id === areaId)
  const areaStores = stores.filter((s) => s.areaId === areaId)

  if (!area) return <EmptyState icon={MapPin} title="Area not found" description="This area does not exist." />

  const openAdd = () => { setEditStore(null); setModalOpen(true) }
  const openEdit = (store) => { setEditStore(store); setModalOpen(true) }

  return (
    <div>
      <div className="mb-4 flex items-center gap-1.5 text-sm text-espresso/50">
        <Link to="/sales/areas" className="hover:text-oven-amber">Areas</Link>
        <span>/</span>
        <span className="text-espresso">{area.name}</span>
      </div>

      <PageHeader eyebrow="Sales / Areas" title={area.name} description={`${area.city} · ${area.pincode} · ${areaStores.length} ${areaStores.length === 1 ? 'store' : 'stores'}`} actions={<Button onClick={openAdd}><Plus className="h-4 w-4" /> Add store</Button>} />

      {areaStores.length === 0 ? (
        <EmptyState icon={Store} title="No stores yet" description="Add a store to this area." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {areaStores.map((s) => (
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
              <div className="mt-3 flex items-center gap-1.5 text-sm text-espresso/60">
                <Phone className="h-3.5 w-3.5" /> {s.dealerPhone}
              </div>
              <a
                href={`https://www.google.com/maps?q=${s.lat},${s.lng}`}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-oven-amber hover:underline"
              >
                <Navigation className="h-3.5 w-3.5" /> View on map
              </a>
            </div>
          ))}
        </div>
      )}

      <StoreFormModal open={modalOpen} onClose={() => setModalOpen(false)} areaId={areaId} store={editStore} />
    </div>
  )
}
