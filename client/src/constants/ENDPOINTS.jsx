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
  },
  uploads: {
    receiptUrl: '/uploads/receipt-url',
  },
}
