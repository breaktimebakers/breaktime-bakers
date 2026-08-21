import { createContext, useState, useCallback } from 'react'
import { seedAreas, seedStores, seedOrderTakers, seedOrders } from '../data/seedSales'

export const SalesContext = createContext(null)

export function SalesProvider({ children }) {
  const [areas, setAreas] = useState(seedAreas)
  const [stores, setStores] = useState(seedStores)
  const [orderTakers, setOrderTakers] = useState(seedOrderTakers)
  const [orders, setOrders] = useState(seedOrders)

  const addArea = useCallback((data) => {
    const id = 'a' + Date.now()
    setAreas((p) => [...p, { id, name: data.name, city: data.city, pincode: data.pincode }])
  }, [])

  const addStore = useCallback((data) => {
    const id = 's' + Date.now()
    setStores((p) => [...p, { id, areaId: data.areaId, dealerName: data.dealerName, shopName: data.shopName || '', dealerPhone: data.dealerPhone, storeType: data.storeType, address: data.address, lat: data.lat, lng: data.lng }])
  }, [])

  const updateStore = useCallback((id, data) => {
    setStores((p) => p.map((s) => s.id === id ? { ...s, ...data } : s))
  }, [])

  const addOrder = useCallback((data) => {
    const id = 'o' + Date.now()
    setOrders((p) => [{ id, storeId: data.storeId, orderTakerId: data.orderTakerId, product: data.product, quantity: Number(data.quantity), status: 'in_transit', date: new Date().toISOString().slice(0, 10), fulfilledQty: 0, fulfillmentDate: null, notes: '' }, ...p])
  }, [])

  const updateOrderStatus = useCallback((id, status) => {
    setOrders((p) => p.map((o) => o.id === id ? { ...o, status } : o))
  }, [])

  const fulfillOrder = useCallback((id, data) => {
    setOrders((p) => p.map((o) => o.id === id ? { ...o, fulfilledQty: Number(data.fulfilledQty), fulfillmentDate: data.fulfillmentDate, status: data.status, notes: data.notes || o.notes } : o))
  }, [])

  const assignAreas = useCallback((personId, areaIds) => {
    setOrderTakers((p) => p.map((ot) => ot.id === personId ? { ...ot, assignedAreaIds: areaIds } : ot))
  }, [])

  return (
    <SalesContext.Provider value={{
      areas, stores, orderTakers, orders,
      addArea, addStore, updateStore, addOrder, updateOrderStatus, fulfillOrder, assignAreas,
    }}>
      {children}
    </SalesContext.Provider>
  )
}

