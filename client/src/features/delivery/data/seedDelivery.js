import { daysAgo } from '@/utils'

export const seedDrivers = [
  { id: 'd1', name: 'Mahesh Kadam', phone: '9833001122', assignedAreaIds: ['a1', 'a4'] },
  { id: 'd2', name: 'Prakash Nair', phone: '9844556677', assignedAreaIds: ['a2'] },
  { id: 'd3', name: 'Suresh Patil', phone: '9877889900', assignedAreaIds: ['a3'] },
]

// Seed trips referencing SalesContext orders/stores
export const seedTrips = [
  { id: 't1', driverId: 'd1', date: daysAgo(1), areaId: 'a1', storeIds: ['s1', 's2'], orderIds: ['o9', 'o13'], status: 'in_progress', stopSequence: ['s1', 's2'], sequenceSource: 'manual' },
  { id: 't2', driverId: 'd2', date: daysAgo(2), areaId: 'a2', storeIds: ['s3', 's4'], orderIds: ['o8', 'o12'], status: 'completed', stopSequence: ['s3', 's4'], sequenceSource: 'manual' },
  { id: 't3', driverId: 'd3', date: daysAgo(0), areaId: 'a3', storeIds: ['s5', 's6'], orderIds: ['o5', 'o11'], status: 'in_progress', stopSequence: ['s5', 's6'], sequenceSource: 'manual' },
  { id: 't4', driverId: 'd1', date: daysAgo(0), areaId: 'a4', storeIds: ['s7'], orderIds: ['o7'], status: 'planned', stopSequence: ['s7'], sequenceSource: 'manual' },
]
