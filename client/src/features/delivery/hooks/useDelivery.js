import { useQueryClient } from '@tanstack/react-query'
import { useLocalQuery, setLocalData } from '@/lib/localStore'
import { useSales } from '@/features/sales/hooks'
import { seedDrivers, seedTrips } from '../data/seedDelivery'
import { todayISO } from '@/utils'

const KEYS = {
  drivers: ['local', 'delivery', 'drivers'],
  trips: ['local', 'delivery', 'trips'],
}

export function useDelivery() {
  const queryClient = useQueryClient()
  const sales = useSales()
  const { data: drivers = [] } = useLocalQuery(KEYS.drivers, seedDrivers)
  const { data: trips = [] } = useLocalQuery(KEYS.trips, seedTrips)

  const addDriver = (data) => {
    const id = 'd' + Date.now()
    setLocalData(queryClient, KEYS.drivers, (p) => [...p, { id, name: data.name, phone: data.phone, assignedAreaIds: data.assignedAreaIds || [] }])
  }

  const assignAreas = (driverId, areaIds) => {
    setLocalData(queryClient, KEYS.drivers, (p) => p.map((d) => d.id === driverId ? { ...d, assignedAreaIds: areaIds } : d))
  }

  const createTrip = (data) => {
    const id = 't' + Date.now()
    const storeIds = data.orderIds.map((oid) => sales.orders.find((o) => o.id === oid)?.storeId).filter(Boolean)
    const uniqueStoreIds = [...new Set(storeIds)]
    setLocalData(queryClient, KEYS.trips, (p) => [{
      id,
      driverId: data.driverId,
      date: data.date || todayISO(),
      areaId: data.areaId,
      storeIds: uniqueStoreIds,
      orderIds: data.orderIds,
      status: 'planned',
      stopSequence: data.stopSequence?.length ? data.stopSequence : uniqueStoreIds,
      sequenceSource: 'manual',
    }, ...p])
  }

  const updateTripStatus = (id, status) => {
    setLocalData(queryClient, KEYS.trips, (p) => p.map((t) => t.id === id ? { ...t, status } : t))
  }

  const markStopDelivered = (tripId, storeId) => {
    const trip = trips.find((t) => t.id === tripId)
    if (!trip) return

    const orderIdsForStore = trip.orderIds.filter((oid) => {
      const o = sales.orders.find((ord) => ord.id === oid)
      return o && o.storeId === storeId
    })

    orderIdsForStore.forEach((oid) => {
      const o = sales.orders.find((ord) => ord.id === oid)
      if (o && o.status !== 'delivered') {
        sales.updateOrderStatus(oid, 'delivered')
      }
    })
  }

  const markOrderDeliveredInTrip = (tripId, orderId) => {
    const trip = trips.find((t) => t.id === tripId)
    if (!trip) return

    const order = sales.orders.find((o) => o.id === orderId)
    if (order && order.status !== 'delivered') {
      sales.updateOrderStatus(orderId, 'delivered')
    }
    // Remaining-stop check intentionally not auto-completing the trip -
    // left for the admin to mark complete themselves.
  }

  return { drivers, trips, addDriver, assignAreas, createTrip, updateTripStatus, markStopDelivered, markOrderDeliveredInTrip }
}
