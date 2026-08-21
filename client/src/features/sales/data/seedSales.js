import { daysAgo } from '@/utils'

export const seedAreas = [
  { id: 'a1', name: 'Bandra', city: 'Mumbai', pincode: '400050' },
  { id: 'a2', name: 'Andheri West', city: 'Mumbai', pincode: '400058' },
  { id: 'a3', name: 'Powai', city: 'Mumbai', pincode: '400076' },
  { id: 'a4', name: 'Juhu', city: 'Mumbai', pincode: '400049' },
]

export const seedStores = [
  { id: 's1', areaId: 'a1', dealerName: 'Sunrise Bakery Store', dealerPhone: '9876543210', storeType: 'Shop', address: 'Hill Road, Bandra West', lat: 19.0596, lng: 72.8295 },
  { id: 's2', areaId: 'a1', dealerName: 'Cafe Mocha', dealerPhone: '9820011223', storeType: 'Canteen', address: 'Carter Road, Bandra West', lat: 19.0500, lng: 72.8200 },
  { id: 's3', areaId: 'a2', dealerName: 'Andheri Sweets Mart', dealerPhone: '9934567890', storeType: 'Shop', address: 'SV Road, Andheri West', lat: 19.1197, lng: 72.8468 },
  { id: 's4', areaId: 'a2', dealerName: 'Lokhandwala Canteen', dealerPhone: '9812345678', storeType: 'Canteen', address: 'Lokhandwala Complex, Andheri West', lat: 19.1500, lng: 72.8400 },
  { id: 's5', areaId: 'a3', dealerName: 'Powai Food Corner', dealerPhone: '9001234567', storeType: 'Shop', address: 'Hiranandani Gardens, Powai', lat: 19.1176, lng: 72.9060 },
  { id: 's6', areaId: 'a3', dealerName: 'IIT Campus Store', dealerPhone: '9009876543', storeType: 'Canteen', address: 'IIT Bombay, Powai', lat: 19.1300, lng: 72.9100 },
  { id: 's7', areaId: 'a4', dealerName: 'Juhu Beach Bakery', dealerPhone: '9870012345', storeType: 'Other', address: 'Juhu Tara Road, Juhu', lat: 19.0883, lng: 72.8265 },
]

export const seedOrderTakers = [
  { id: 'ot1', name: 'Ravi Deshmukh', assignedAreaIds: ['a1', 'a4'] },
  { id: 'ot2', name: 'Sneha Iyer', assignedAreaIds: ['a2'] },
  { id: 'ot3', name: 'Imran Sheikh', assignedAreaIds: ['a3'] },
]

export const products = ['Butter Croissants', 'Milk Bread', 'Cocoa Cookies', 'Dinner Buns', 'Tea Cakes']
export const statuses = ['in_transit', 'shipped', 'delivered']

export const seedOrders = [
  { id: 'o1', storeId: 's1', orderTakerId: 'ot1', product: 'Butter Croissants', quantity: 24, status: 'delivered', date: daysAgo(10), fulfilledQty: 24, fulfillmentDate: daysAgo(9), notes: 'Delivered fresh' },
  { id: 'o2', storeId: 's2', orderTakerId: 'ot1', product: 'Tea Cakes', quantity: 12, status: 'delivered', date: daysAgo(8), fulfilledQty: 12, fulfillmentDate: daysAgo(7), notes: '' },
  { id: 'o3', storeId: 's3', orderTakerId: 'ot2', product: 'Milk Bread', quantity: 20, status: 'delivered', date: daysAgo(7), fulfilledQty: 20, fulfillmentDate: daysAgo(6), notes: '' },
  { id: 'o4', storeId: 's4', orderTakerId: 'ot2', product: 'Cocoa Cookies', quantity: 50, status: 'shipped', date: daysAgo(5), fulfilledQty: 0, fulfillmentDate: null, notes: '' },
  { id: 'o5', storeId: 's5', orderTakerId: 'ot3', product: 'Dinner Buns', quantity: 30, status: 'in_transit', date: daysAgo(4), fulfilledQty: 0, fulfillmentDate: null, notes: '' },
  { id: 'o6', storeId: 's1', orderTakerId: 'ot1', product: 'Cocoa Cookies', quantity: 40, status: 'delivered', date: daysAgo(3), fulfilledQty: 40, fulfillmentDate: daysAgo(2), notes: '' },
  { id: 'o7', storeId: 's7', orderTakerId: 'ot1', product: 'Butter Croissants', quantity: 18, status: 'shipped', date: daysAgo(3), fulfilledQty: 0, fulfillmentDate: null, notes: '' },
  { id: 'o8', storeId: 's3', orderTakerId: 'ot2', product: 'Tea Cakes', quantity: 8, status: 'delivered', date: daysAgo(2), fulfilledQty: 8, fulfillmentDate: daysAgo(1), notes: '' },
  { id: 'o9', storeId: 's2', orderTakerId: 'ot1', product: 'Milk Bread', quantity: 15, status: 'in_transit', date: daysAgo(1), fulfilledQty: 0, fulfillmentDate: null, notes: '' },
  { id: 'o10', storeId: 's5', orderTakerId: 'ot3', product: 'Butter Croissants', quantity: 30, status: 'delivered', date: daysAgo(1), fulfilledQty: 30, fulfillmentDate: daysAgo(0), notes: '' },
  { id: 'o11', storeId: 's6', orderTakerId: 'ot3', product: 'Dinner Buns', quantity: 25, status: 'in_transit', date: daysAgo(0), fulfilledQty: 0, fulfillmentDate: null, notes: '' },
  { id: 'o12', storeId: 's4', orderTakerId: 'ot2', product: 'Butter Croissants', quantity: 20, status: 'shipped', date: daysAgo(0), fulfilledQty: 0, fulfillmentDate: null, notes: '' },
  { id: 'o13', storeId: 's1', orderTakerId: 'ot1', product: 'Dinner Buns', quantity: 40, status: 'in_transit', date: daysAgo(0), fulfilledQty: 0, fulfillmentDate: null, notes: '' },
  { id: 'o14', storeId: 's7', orderTakerId: 'ot1', product: 'Tea Cakes', quantity: 6, status: 'delivered', date: daysAgo(6), fulfilledQty: 6, fulfillmentDate: daysAgo(5), notes: '' },
  { id: 'o15', storeId: 's6', orderTakerId: 'ot3', product: 'Cocoa Cookies', quantity: 60, status: 'shipped', date: daysAgo(2), fulfilledQty: 0, fulfillmentDate: null, notes: '' },
]
