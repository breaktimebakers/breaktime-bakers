import { useQueryClient } from '@tanstack/react-query'
import { useLocalQuery, setLocalData } from '@/lib/localStore'
import { seedBatches, seedReadyStock } from '../data/seedInventory'

// Raw materials are wired to the real backend now - see useRawMaterials /
// useRawMaterialMutations. Batches and ready stock have no backend
// endpoints yet, so they stay as local-only React Query state (see
// lib/localStore) rather than a Context, matching the rest of the app.
const KEYS = {
  batches: ['local', 'inventory', 'batches'],
  readyStock: ['local', 'inventory', 'readyStock'],
  lastChanged: ['local', 'inventory', 'lastChanged'],
}

export function useInventory() {
  const queryClient = useQueryClient()
  const { data: batches = [] } = useLocalQuery(KEYS.batches, seedBatches)
  const { data: readyStock = [] } = useLocalQuery(KEYS.readyStock, seedReadyStock)
  // Kept in the shared cache too (not component-local useState) - flash
  // is triggered from AddBatchModal but read from ReadyStock, two
  // separate useInventory() call sites that need to see the same value.
  const { data: lastChanged = {} } = useLocalQuery(KEYS.lastChanged, {})

  const flash = (id, type = 'amber') => {
    setLocalData(queryClient, KEYS.lastChanged, (p) => ({ ...p, [id]: type }))
    setTimeout(() => setLocalData(queryClient, KEYS.lastChanged, (p) => ({ ...p, [id]: null })), 1400)
  }

  const addBatch = (data) => {
    const id = 'b' + Date.now()
    const newBatch = {
      id,
      date: data.date || new Date().toISOString().slice(0, 10),
      productName: data.productName,
      quantityProduced: Number(data.quantityProduced),
      unit: data.unit,
      ingredientsUsed: data.ingredientsUsed,
    }
    setLocalData(queryClient, KEYS.batches, (p) => [newBatch, ...p])

    setLocalData(queryClient, KEYS.readyStock, (prev) => {
      const existing = prev.find((r) => r.productName === data.productName)
      if (existing) {
        return prev.map((r) => r.productName === data.productName
          ? { ...r, availableQty: r.availableQty + Number(data.quantityProduced), pricePerUnit: data.pricePerUnit ? Number(data.pricePerUnit) : r.pricePerUnit }
          : r)
      }
      return [...prev, { productName: data.productName, availableQty: Number(data.quantityProduced), unit: data.unit, pricePerUnit: data.pricePerUnit ? Number(data.pricePerUnit) : 0 }]
    })

    setTimeout(() => flash('rs-' + data.productName, 'amber'), 100)
  }

  return { batches, readyStock, lastChanged, addBatch }
}
