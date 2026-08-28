// Central map of backend API route paths, grouped by feature.
// Query/mutation hooks import from here instead of hardcoding strings,
// so a path only ever needs to change in one place.
export const ENDPOINTS = {
  auth: {
    register: '/auth/register',
    login: '/auth/login',
    logout: '/auth/logout',
    refreshToken: '/auth/refresh-token',
    me: '/auth/me',
  },
  rawMaterials: {
    list: '/raw-materials',
    create: '/raw-materials',
    detail: (id) => `/raw-materials/${id}`,
    update: (id) => `/raw-materials/${id}`,
    remove: (id) => `/raw-materials/${id}`,
    lots: (id) => `/raw-materials/${id}/lots`,
    createLot: (id) => `/raw-materials/${id}/lots`,
  },
  batches: {
    list: '/batches',
    create: '/batches',
  },
  readyStock: {
    list: '/ready-stock',
    history: (id) => `/ready-stock/${id}/history`,
  },
  areas: {
    list: '/areas',
    detail: (id) => `/areas/${id}`,
    create: '/areas',
    update: (id) => `/areas/${id}`,
    stores: (id) => `/areas/${id}/stores`,
    createStore: (id) => `/areas/${id}/stores`,
  },
  stores: {
    list: '/stores',
    update: (id) => `/stores/${id}`,
    updateStatus: (id) => `/stores/${id}/status`,
  },
  orders: {
    list: '/orders',
    create: '/orders',
    updateStatus: (id) => `/orders/${id}/status`,
    fulfill: (id) => `/orders/${id}/fulfill`,
  },
  workers: {
    list: '/workers',
    detail: (id) => `/workers/${id}`,
    create: '/workers',
    update: (id) => `/workers/${id}`,
    remove: (id) => `/workers/${id}`,
    leave: (id) => `/workers/${id}/leave`,
    reactivate: (id) => `/workers/${id}/reactivate`,
    updateAreas: (id) => `/workers/${id}/areas`,
  },
  attendance: {
    list: '/attendance',
    mark: '/attendance',
    clear: (workerId, date) => `/attendance/${workerId}/${date}`,
  },
  expenses: {
    list: '/expenses',
    create: '/expenses',
    remove: (id) => `/expenses/${id}`,
  },
  taxEntries: {
    list: '/tax-entries',
    create: '/tax-entries',
    remove: (id) => `/tax-entries/${id}`,
  },
  uploads: {
    receiptUrl: '/uploads/receipt-url',
  },
}
