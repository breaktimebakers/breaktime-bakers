import { daysAgo } from '@/utils'

export const daysAgoDate = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d }

export const monthStr = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`

// Seed customer payments — storeId/areaId linked to SalesContext stores; individuals have null
export const seedCustomerPayments = [
  { id: 'cp1', buyerName: 'Sunrise Bakery Store', buyerType: 'store', storeId: 's1', areaId: 'a1', amount: 15600, amountPaid: 15600, paymentHistory: [{ amount: 15600, date: daysAgo(1) }], date: daysAgo(2), status: 'paid', paidDate: daysAgo(1) },
  { id: 'cp2', buyerName: 'Cafe Mocha', buyerType: 'store', storeId: 's2', areaId: 'a1', amount: 14400, amountPaid: 14400, paymentHistory: [{ amount: 14400, date: daysAgo(2) }], date: daysAgo(3), status: 'paid', paidDate: daysAgo(2) },
  { id: 'cp3', buyerName: 'Andheri Sweets Mart', buyerType: 'store', storeId: 's3', areaId: 'a2', amount: 11000, amountPaid: 11000, paymentHistory: [{ amount: 11000, date: daysAgo(3) }], date: daysAgo(4), status: 'paid', paidDate: daysAgo(3) },
  { id: 'cp4', buyerName: 'Lokhandwala Canteen', buyerType: 'store', storeId: 's4', areaId: 'a2', amount: 8750, amountPaid: 4000, paymentHistory: [{ amount: 4000, date: daysAgo(4) }], date: daysAgo(5), status: 'outstanding', paidDate: null },
  { id: 'cp5', buyerName: 'Powai Food Corner', buyerType: 'store', storeId: 's5', areaId: 'a3', amount: 7500, amountPaid: 7500, paymentHistory: [{ amount: 7500, date: daysAgo(4) }], date: daysAgo(6), status: 'paid', paidDate: daysAgo(4) },
  { id: 'cp6', buyerName: 'IIT Campus Store', buyerType: 'store', storeId: 's6', areaId: 'a3', amount: 6250, amountPaid: 0, paymentHistory: [], date: daysAgo(7), status: 'outstanding', paidDate: null },
  { id: 'cp7', buyerName: 'Juhu Beach Bakery', buyerType: 'store', storeId: 's7', areaId: 'a4', amount: 7200, amountPaid: 7200, paymentHistory: [{ amount: 7200, date: daysAgo(6) }], date: daysAgo(8), status: 'paid', paidDate: daysAgo(6) },
  { id: 'cp8', buyerName: 'Rajesh Kirana', buyerType: 'individual', storeId: null, areaId: null, amount: 1800, amountPaid: 1800, paymentHistory: [{ amount: 1800, date: daysAgo(2) }], date: daysAgo(3), status: 'paid', paidDate: daysAgo(2) },
  { id: 'cp9', buyerName: 'Sunrise Bakery Store', buyerType: 'store', storeId: 's1', areaId: 'a1', amount: 13000, amountPaid: 13000, paymentHistory: [{ amount: 13000, date: daysAgo(31) }], date: daysAgo(33), status: 'paid', paidDate: daysAgo(31) },
  { id: 'cp10', buyerName: 'Cafe Mocha', buyerType: 'store', storeId: 's2', areaId: 'a1', amount: 9600, amountPaid: 9600, paymentHistory: [{ amount: 9600, date: daysAgo(33) }], date: daysAgo(35), status: 'paid', paidDate: daysAgo(33) },
  { id: 'cp11', buyerName: 'Sunita Aunty Gully Shop', buyerType: 'individual', storeId: null, areaId: null, amount: 2200, amountPaid: 1000, paymentHistory: [{ amount: 1000, date: daysAgo(8) }], date: daysAgo(10), status: 'outstanding', paidDate: null },
  { id: 'cp12', buyerName: 'Andheri Sweets Mart', buyerType: 'store', storeId: 's3', areaId: 'a2', amount: 9500, amountPaid: 9500, paymentHistory: [{ amount: 9500, date: daysAgo(36) }], date: daysAgo(38), status: 'paid', paidDate: daysAgo(36) },
]

export const expenseCategories = [
  { label: 'Electricity', icon: 'Zap' },
  { label: 'Water', icon: 'Droplet' },
  { label: 'Gas / Fuel', icon: 'Flame' },
  { label: 'Rent / Maintenance', icon: 'Building2' },
  { label: 'Internet & Phone', icon: 'Wifi' },
  { label: 'Cleaning & Hygiene', icon: 'Sparkles' },
  { label: 'Repairs & Maintenance', icon: 'Wrench' },
  { label: 'Transport / Fuel', icon: 'Fuel' },
  { label: 'Packaging', icon: 'Package' },
  { label: 'Printing & Stationery', icon: 'Printer' },
  { label: 'Software / Subscriptions', icon: 'Laptop' },
  { label: 'Marketing', icon: 'Megaphone' },
  { label: 'Government / Licences', icon: 'Landmark' },
  { label: 'Banking Charges', icon: 'Building' },
  { label: 'Professional Fees', icon: 'Briefcase' },
  { label: 'Insurance', icon: 'Shield' },
  { label: 'Staff Welfare', icon: 'HeartHandshake' },
  { label: 'Worker Tips / Bonus', icon: 'Gift' },
  { label: 'Travel', icon: 'Plane' },
  { label: 'Equipment / Small Purchases', icon: 'Wrench' },
  { label: 'Wastage / Loss', icon: 'TriangleAlert' },
  { label: 'Miscellaneous', icon: 'MoreHorizontal' },
]
