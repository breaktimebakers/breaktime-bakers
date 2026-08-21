import { createContext, useState, useCallback } from 'react'
import { useSales } from '@/features/sales/hooks'
import { seedDrivers, seedTrips } from '../data/seedDelivery'

export const DeliveryContext = createContext(null)

export function DeliveryProvider({ children }) {
  const sales = useSales()
  const [drivers, setDrivers] = useState(seedDrivers)
  const [trips, setTrips] = useState(seedTrips)

  const addDriver = useCallback((data) => {
    const id = 'd' + Date.now()
    setDrivers((p) => [...p, { id, name: data.name, phone: data.phone, assignedAreaIds: data.assignedAreaIds || [] }])
  }, [])

  const assignAreas = useCallback((driverId, areaIds) => {
    setDrivers((p) => p.map((d) => d.id === driverId ? { ...d, assignedAreaIds: areaIds } : d))
  }, [])

  const createTrip = useCallback((data) => {
    const id = 't' + Date.now()
    const storeIds = data.orderIds.map((oid) => sales.orders.find((o) => o.id === oid)?.storeId).filter(Boolean)
    const uniqueStoreIds = [...new Set(storeIds)]
    setTrips((p) => [{
      id,
      driverId: data.driverId,
      date: data.date || new Date().toISOString().slice(0, 10),
      areaId: data.areaId,
      storeIds: uniqueStoreIds,
      orderIds: data.orderIds,
      status: 'planned',
      stopSequence: data.stopSequence?.length ? data.stopSequence : uniqueStoreIds,
      sequenceSource: 'manual',
    }, ...p])
  }, [sales.orders])

  const updateTripStatus = useCallback((id, status) => {
    setTrips((p) => p.map((t) => t.id === id ? { ...t, status } : t))
  }, [])

  const markStopDelivered = useCallback((tripId, storeId) => {
    setTrips((p) => p.map((t) => {
      if (t.id !== tripId) return t
      // Mark all orders for this store in this trip as delivered
      const orderIdsForStore = t.orderIds.filter((oid) => {
        const o = sales.orders.find((ord) => ord.id === oid)
        return o && o.storeId === storeId
      })
      // Update sales orders
      orderIdsForStore.forEach((oid) => {
        const o = sales.orders.find((ord) => ord.id === oid)
        if (o && o.status !== 'delivered') {
          sales.updateOrderStatus(oid, 'delivered')
        }
      })
      return t
    }))
  }, [sales])

  const markOrderDeliveredInTrip = useCallback((tripId, orderId) => {
    const trip = trips.find((t) => t.id === tripId)
    if (!trip) return
    const order = sales.orders.find((o) => o.id === orderId)
    if (order && order.status !== 'delivered') {
      sales.updateOrderStatus(orderId, 'delivered')
    }
    // Check if all stops delivered -> could auto-complete
    const remainingOrders = trip.orderIds.filter((oid) => {
      const o = sales.orders.find((ord) => ord.id === oid)
      return o && o.id !== orderId && o.status !== 'delivered'
    })
    if (remainingOrders.length === 0) {
      // don't auto-complete, let admin do it
    }
  }, [trips, sales])

  return (
    <DeliveryContext.Provider value={{
      drivers, trips,
      addDriver, assignAreas, createTrip, updateTripStatus, markStopDelivered, markOrderDeliveredInTrip,
    }}>
      {children}
    </DeliveryContext.Provider>
  )
}

