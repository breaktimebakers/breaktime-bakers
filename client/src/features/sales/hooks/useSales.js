import { useQueryClient } from '@tanstack/react-query'
import { useLocalQuery, setLocalData } from '@/lib/localStore'
import { seedAreas, seedStores, seedOrderTakers, seedOrders } from '../data/seedSales'

const KEYS = {
  areas: ['local', 'sales', 'areas'],
  stores: ['local', 'sales', 'stores'],
  orderTakers: ['local', 'sales', 'orderTakers'],
  orders: ['local', 'sales', 'orders'],
}

export function useSales() {
  const queryClient = useQueryClient()
  const { data: areas = [] } = useLocalQuery(KEYS.areas, seedAreas)
  const { data: stores = [] } = useLocalQuery(KEYS.stores, seedStores)
  const { data: orderTakers = [] } = useLocalQuery(KEYS.orderTakers, seedOrderTakers)
  const { data: orders = [] } = useLocalQuery(KEYS.orders, seedOrders)

  const addArea = (data) => {
    const id = 'a' + Date.now()
    setLocalData(queryClient, KEYS.areas, (p) => [...p, { id, name: data.name, city: data.city, pincode: data.pincode }])
  }

  const addStore = (data) => {
    const id = 's' + Date.now()
    setLocalData(queryClient, KEYS.stores, (p) => [...p, { id, areaId: data.areaId, dealerName: data.dealerName, shopName: data.shopName || '', dealerPhone: data.dealerPhone, storeType: data.storeType, address: data.address, lat: data.lat, lng: data.lng }])
  }

  const updateStore = (id, data) => {
    setLocalData(queryClient, KEYS.stores, (p) => p.map((s) => s.id === id ? { ...s, ...data } : s))
  }

  const addOrder = (data) => {
    const id = 'o' + Date.now()
    setLocalData(queryClient, KEYS.orders, (p) => [{ id, storeId: data.storeId, orderTakerId: data.orderTakerId, product: data.product, quantity: Number(data.quantity), status: 'in_transit', date: new Date().toISOString().slice(0, 10), fulfilledQty: 0, fulfillmentDate: null, notes: '' }, ...p])
  }

  const updateOrderStatus = (id, status) => {
    setLocalData(queryClient, KEYS.orders, (p) => p.map((o) => o.id === id ? { ...o, status } : o))
  }

  const fulfillOrder = (id, data) => {
    setLocalData(queryClient, KEYS.orders, (p) => p.map((o) => o.id === id ? { ...o, fulfilledQty: Number(data.fulfilledQty), fulfillmentDate: data.fulfillmentDate, status: data.status, notes: data.notes || o.notes } : o))
  }

  const assignAreas = (personId, areaIds) => {
    setLocalData(queryClient, KEYS.orderTakers, (p) => p.map((ot) => ot.id === personId ? { ...ot, assignedAreaIds: areaIds } : ot))
  }

  return { areas, stores, orderTakers, orders, addArea, addStore, updateStore, addOrder, updateOrderStatus, fulfillOrder, assignAreas }
}
