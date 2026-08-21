import { createContext, useState, useCallback } from 'react'
import { seedRawMaterials, seedBatches, seedReadyStock } from '../data/seedInventory'

export const InventoryContext = createContext(null)

export function InventoryProvider({ children }) {
  const [rawMaterials, setRawMaterials] = useState(seedRawMaterials)
  const [batches, setBatches] = useState(seedBatches)
  const [readyStock, setReadyStock] = useState(seedReadyStock)
  const [lastChanged, setLastChanged] = useState({})

  const flash = (id, type = 'green') => {
    setLastChanged((p) => ({ ...p, [id]: type }))
    setTimeout(() => setLastChanged((p) => ({ ...p, [id]: null })), 1400)
  }

  const addRawMaterial = useCallback((data) => {
    const id = 'rm' + Date.now()
    const newMat = {
      id,
      name: data.name,
      unit: data.unit,
      stockQty: Number(data.openingQty) || 0,
      lowStockAt: Number(data.lowStockAt) || 0,
      lots: [{
        id: 'l' + Date.now(),
        quantity: Number(data.openingQty) || 0,
        unitCost: Number(data.openingRate) || 0,
        vendor: data.vendor || '',
        purchaseDate: data.purchaseDate || new Date().toISOString().slice(0, 10),
        receiptName: data.receiptName || '',
      }],
    }
    setRawMaterials((p) => [...p, newMat])
    flash(id)
  }, [])

  const updateRawMaterial = useCallback((id, data) => {
    setRawMaterials((p) => p.map((m) => m.id === id ? { ...m, name: data.name, unit: data.unit, lowStockAt: Number(data.lowStockAt) } : m))
    flash(id)
  }, [])

  const deleteRawMaterial = useCallback((id) => {
    setRawMaterials((p) => p.filter((m) => m.id !== id))
  }, [])

  const restockRawMaterial = useCallback((id, data) => {
    setRawMaterials((p) => p.map((m) => {
      if (m.id !== id) return m
      const newLot = {
        id: 'l' + Date.now(),
        quantity: Number(data.qty),
        unitCost: Number(data.rate),
        vendor: data.vendor || '',
        purchaseDate: data.purchaseDate || new Date().toISOString().slice(0, 10),
        receiptName: data.receiptName || '',
      }
      return { ...m, stockQty: m.stockQty + Number(data.qty), lots: [...m.lots, newLot] }
    }))
    flash(id)
  }, [])

  const addBatch = useCallback((data) => {
    const id = 'b' + Date.now()
    const newBatch = {
      id,
      date: data.date || new Date().toISOString().slice(0, 10),
      productName: data.productName,
      quantityProduced: Number(data.quantityProduced),
      unit: data.unit,
      ingredientsUsed: data.ingredientsUsed,
    }
    setBatches((p) => [newBatch, ...p])

    // Consume raw materials FIFO (oldest lot first)
    setRawMaterials((prev) => prev.map((m) => {
      const used = data.ingredientsUsed.find((i) => i.rawMaterialId === m.id)
      if (!used) return m
      let remaining = used.qty
      const sortedLots = [...m.lots].sort((a, b) => new Date(a.purchaseDate) - new Date(b.purchaseDate))
      const updatedLots = []
      for (const lot of sortedLots) {
        if (remaining <= 0) { updatedLots.push(lot); continue }
        if (lot.quantity <= remaining) {
          remaining -= lot.quantity
          updatedLots.push({ ...lot, quantity: 0 })
        } else {
          updatedLots.push({ ...lot, quantity: lot.quantity - remaining })
          remaining = 0
        }
      }
      const newStockQty = updatedLots.reduce((s, l) => s + l.quantity, 0)
      flash(m.id)
      return { ...m, stockQty: newStockQty, lots: updatedLots }
    }))

    // Add to ready stock
    setReadyStock((prev) => {
      const existing = prev.find((r) => r.productName === data.productName)
      if (existing) {
        return prev.map((r) => r.productName === data.productName
          ? { ...r, availableQty: r.availableQty + Number(data.quantityProduced), pricePerUnit: data.pricePerUnit ? Number(data.pricePerUnit) : r.pricePerUnit }
          : r)
      }
      return [...prev, { productName: data.productName, availableQty: Number(data.quantityProduced), unit: data.unit, pricePerUnit: data.pricePerUnit ? Number(data.pricePerUnit) : 0 }]
    })

    // Flash ready stock
    setTimeout(() => flash('rs-' + data.productName, 'amber'), 100)
  }, [flash])

  return (
    <InventoryContext.Provider value={{
      rawMaterials, batches, readyStock, lastChanged,
      addRawMaterial, updateRawMaterial, deleteRawMaterial, restockRawMaterial, addBatch,
    }}>
      {children}
    </InventoryContext.Provider>
  )
}

