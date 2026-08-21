import { useState } from 'react'
import { useDelivery } from '../hooks'
import { useSales } from '@/features/sales/hooks'
import { Button, Field, Modal, inputClass } from '@/components/shared'

export function CreateTripModal({ open, onClose }) {
  const { drivers, createTrip } = useDelivery()
  const { areas, stores, orders } = useSales()
  const [driverId, setDriverId] = useState('')
  const [areaId, setAreaId] = useState('')
  const [selectedOrders, setSelectedOrders] = useState([])
  const [stopSequence, setStopSequence] = useState([])

  const driver = drivers.find((d) => d.id === driverId)
  const availableAreas = driver ? areas.filter((a) => driver.assignedAreaIds.includes(a.id)) : areas
  const undeliveredOrders = areaId
    ? orders.filter((o) => o.status !== 'delivered' && stores.find((s) => s.id === o.storeId)?.areaId === areaId)
    : []

  const reset = () => { setDriverId(''); setAreaId(''); setSelectedOrders([]); setStopSequence([]) }

  const toggleOrder = (oid) => {
    setSelectedOrders((p) => {
      const next = p.includes(oid) ? p.filter((x) => x !== oid) : [...p, oid]
      const storeIds = next.map((id) => orders.find((o) => o.id === id)?.storeId).filter(Boolean)
      setStopSequence([...new Set(storeIds)])
      return next
    })
  }

  const selectAll = () => {
    const all = undeliveredOrders.map((o) => o.id)
    setSelectedOrders(all)
    const storeIds = all.map((id) => orders.find((o) => o.id === id)?.storeId).filter(Boolean)
    setStopSequence([...new Set(storeIds)])
  }

  const moveStop = (i, dir) => {
    setStopSequence((p) => {
      const next = [...p]
      const j = i + dir
      if (j < 0 || j >= next.length) return p
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })
  }

  const submit = () => {
    if (!driverId || selectedOrders.length === 0) return
    createTrip({ driverId, areaId, orderIds: selectedOrders, stopSequence })
    reset()
    onClose()
  }

  const groupedOrders = undeliveredOrders.reduce((acc, o) => {
    const store = stores.find((s) => s.id === o.storeId)
    const key = store?.dealerName || 'Unknown'
    if (!acc[key]) acc[key] = []
    acc[key].push(o)
    return acc
  }, {})

  return (
    <Modal open={open} onClose={() => { reset(); onClose() }} eyebrow="Delivery / Trips" title="Create trip" footer={<><Button variant="secondary" onClick={() => { reset(); onClose() }}>Cancel</Button><Button onClick={submit}>Create trip</Button></>}>
      <div className="grid gap-3">
        <Field label="Driver" required>
          <select className={inputClass} value={driverId} onChange={(e) => { setDriverId(e.target.value); setAreaId(''); setSelectedOrders([]); setStopSequence([]) }}>
            <option value="">Select driver...</option>
            {drivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </Field>
        <Field label="Area" required>
          <select className={inputClass} value={areaId} onChange={(e) => { setAreaId(e.target.value); setSelectedOrders([]); setStopSequence([]) }} disabled={!driverId}>
            <option value="">Select area...</option>
            {availableAreas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </Field>

        {areaId && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-espresso/70">Undelivered orders</span>
              <button onClick={selectAll} className="text-xs font-medium text-oven-amber hover:underline">Select all</button>
            </div>
            <div className="max-h-44 space-y-2 overflow-y-auto rounded-lg border border-espresso/10 bg-crust/20 p-2">
              {Object.entries(groupedOrders).length === 0 ? (
                <p className="py-4 text-center text-xs text-espresso/40">No undelivered orders in this area</p>
              ) : Object.entries(groupedOrders).map(([storeName, storeOrders]) => (
                <div key={storeName}>
                  <p className="px-1 py-1 font-mono text-[10px] uppercase tracking-wider text-espresso/40">{storeName}</p>
                  {storeOrders.map((o) => (
                    <label key={o.id} className="flex cursor-pointer items-center gap-2 rounded px-1 py-1.5 hover:bg-crust/40">
                      <input type="checkbox" checked={selectedOrders.includes(o.id)} onChange={() => toggleOrder(o.id)} className="accent-oven-amber" />
                      <span className="text-xs text-espresso/70">{o.product}</span>
                      <span className="ml-auto font-mono text-xs text-espresso/50">{o.quantity}</span>
                    </label>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {stopSequence.length > 0 && (
          <div>
            <span className="mb-2 block text-xs font-medium text-espresso/70">Stop order</span>
            <div className="space-y-1.5">
              {stopSequence.map((sid, i) => {
                const store = stores.find((s) => s.id === sid)
                return (
                  <div key={sid + i} className="flex items-center gap-2 rounded-lg bg-crust/30 px-3 py-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-espresso text-xs font-mono font-bold text-crust">{i + 1}</span>
                    <span className="flex-1 text-sm text-espresso/70">{store?.dealerName}</span>
                    <button onClick={() => moveStop(i, -1)} disabled={i === 0} className="flex h-6 w-6 items-center justify-center rounded text-espresso/50 hover:bg-espresso/10 disabled:opacity-30">↑</button>
                    <button onClick={() => moveStop(i, 1)} disabled={i === stopSequence.length - 1} className="flex h-6 w-6 items-center justify-center rounded text-espresso/50 hover:bg-espresso/10 disabled:opacity-30">↓</button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="rounded-lg bg-oven-amber/8 px-3 py-2.5 text-xs text-espresso/60">
          Shortest-route suggestion isn't available yet — this requires a paid routing API and a backend service. Stops are delivered in the order shown above; reorder manually as needed.
        </div>
      </div>
    </Modal>
  )
}
