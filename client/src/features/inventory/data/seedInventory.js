import { daysAgo } from '@/utils'

export const seedRawMaterials = [
  { id: 'rm1', name: 'Maida / Refined Flour', unit: 'kg', stockQty: 80, lowStockAt: 25, lots: [{ id: 'l1', quantity: 80, unitCost: 45, vendor: 'Annapurna Mills', purchaseDate: daysAgo(12), receiptName: 'flour-invoice-aug.pdf' }] },
  { id: 'rm2', name: 'Sugar', unit: 'kg', stockQty: 12, lowStockAt: 15, lots: [{ id: 'l2', quantity: 12, unitCost: 48, vendor: 'Madhur Sugar', purchaseDate: daysAgo(20), receiptName: 'sugar-receipt.pdf' }] },
  { id: 'rm3', name: 'Ghee', unit: 'litre', stockQty: 35, lowStockAt: 10, lots: [{ id: 'l3', quantity: 35, unitCost: 520, vendor: 'Amul Dairy', purchaseDate: daysAgo(8), receiptName: 'ghee-po.pdf' }] },
  { id: 'rm4', name: 'Milk', unit: 'litre', stockQty: 60, lowStockAt: 20, lots: [{ id: 'l4', quantity: 60, unitCost: 62, vendor: 'Mother Dairy', purchaseDate: daysAgo(2), receiptName: 'milk-rti.pdf' }] },
  { id: 'rm5', name: 'Butter', unit: 'kg', stockQty: 8, lowStockAt: 12, lots: [{ id: 'l5', quantity: 8, unitCost: 480, vendor: 'Amul Dairy', purchaseDate: daysAgo(5), receiptName: 'butter-invoice.pdf' }] },
  { id: 'rm6', name: 'Yeast', unit: 'kg', stockQty: 5, lowStockAt: 3, lots: [{ id: 'l6', quantity: 5, unitCost: 320, vendor: 'Weikfield', purchaseDate: daysAgo(15), receiptName: 'yeast-po.pdf' }] },
  { id: 'rm7', name: 'Baking Powder', unit: 'kg', stockQty: 4, lowStockAt: 2, lots: [{ id: 'l7', quantity: 4, unitCost: 180, vendor: 'Weikfield', purchaseDate: daysAgo(18), receiptName: 'bp-receipt.pdf' }] },
  { id: 'rm8', name: 'Salt', unit: 'kg', stockQty: 10, lowStockAt: 5, lots: [{ id: 'l8', quantity: 10, unitCost: 28, vendor: 'Tata Salt', purchaseDate: daysAgo(25), receiptName: 'salt-rti.pdf' }] },
  { id: 'rm9', name: 'Eggs', unit: 'kg', stockQty: 24, lowStockAt: 30, lots: [{ id: 'l9', quantity: 24, unitCost: 90, vendor: 'Sai Poultry', purchaseDate: daysAgo(3), receiptName: 'eggs-invoice.pdf' }] },
  { id: 'rm10', name: 'Cocoa Powder', unit: 'kg', stockQty: 6, lowStockAt: 4, lots: [{ id: 'l10', quantity: 6, unitCost: 650, vendor: 'Callebaut India', purchaseDate: daysAgo(10), receiptName: 'cocoa-po.pdf' }] },
]

export const seedBatches = [
  { id: 'b1', date: daysAgo(0), productName: 'Butter Croissants', quantityProduced: 120, unit: 'pcs', ingredientsUsed: [{ rawMaterialId: 'rm1', qty: 10 }, { rawMaterialId: 'rm5', qty: 4 }, { rawMaterialId: 'rm6', qty: 0.5 }] },
  { id: 'b2', date: daysAgo(1), productName: 'Milk Bread', quantityProduced: 40, unit: 'loaves', ingredientsUsed: [{ rawMaterialId: 'rm1', qty: 15 }, { rawMaterialId: 'rm4', qty: 8 }, { rawMaterialId: 'rm2', qty: 2 }, { rawMaterialId: 'rm6', qty: 0.3 }] },
  { id: 'b3', date: daysAgo(2), productName: 'Cocoa Cookies', quantityProduced: 200, unit: 'pcs', ingredientsUsed: [{ rawMaterialId: 'rm1', qty: 8 }, { rawMaterialId: 'rm2', qty: 5 }, { rawMaterialId: 'rm10', qty: 2 }, { rawMaterialId: 'rm5', qty: 2 }] },
  { id: 'b4', date: daysAgo(3), productName: 'Dinner Buns', quantityProduced: 80, unit: 'pcs', ingredientsUsed: [{ rawMaterialId: 'rm1', qty: 6 }, { rawMaterialId: 'rm2', qty: 1 }, { rawMaterialId: 'rm6', qty: 0.2 }] },
  { id: 'b5', date: daysAgo(5), productName: 'Tea Cakes', quantityProduced: 30, unit: 'pcs', ingredientsUsed: [{ rawMaterialId: 'rm1', qty: 5 }, { rawMaterialId: 'rm2', qty: 3 }, { rawMaterialId: 'rm9', qty: 3 }, { rawMaterialId: 'rm4', qty: 2 }] },
  { id: 'b6', date: daysAgo(6), productName: 'Butter Croissants', quantityProduced: 100, unit: 'pcs', ingredientsUsed: [{ rawMaterialId: 'rm1', qty: 8 }, { rawMaterialId: 'rm5', qty: 3 }, { rawMaterialId: 'rm6', qty: 0.4 }] },
]

export const seedReadyStock = [
  { productName: 'Butter Croissants', availableQty: 220, unit: 'pcs', pricePerUnit: 65 },
  { productName: 'Milk Bread', availableQty: 40, unit: 'loaves', pricePerUnit: 55 },
  { productName: 'Cocoa Cookies', availableQty: 200, unit: 'pcs', pricePerUnit: 35 },
  { productName: 'Dinner Buns', availableQty: 80, unit: 'pcs', pricePerUnit: 25 },
  { productName: 'Tea Cakes', availableQty: 30, unit: 'pcs', pricePerUnit: 120 },
]
