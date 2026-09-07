import { useQuery } from '@tanstack/react-query'
import { rawMaterialApi } from '../api/rawMaterialApi'

export const rawMaterialKeys = {
  all: ['raw-materials'],
  list: (query = {}) => ['raw-materials', 'list', query],
  lots: (id, range = {}) => ['raw-materials', id, 'lots', range],
  allLots: (range = {}) => ['raw-materials', 'lots', range],
}

export function useRawMaterials(query = {}) {
  return useQuery({
    queryKey: rawMaterialKeys.list(query),
    // apiClient resolves to the response envelope's `data`, which for
    // this endpoint is { rawMaterials: [...] } - unwrapped here so every
    // consumer of this hook gets the bare array back, not the wrapper.
    queryFn: async () => {
      const { rawMaterials } = await rawMaterialApi.list(query)
      return rawMaterials
    },
  })
}

// Server-side search/filter/pagination, plus a totalValue aggregate that
// covers the whole filtered set (not just the current page) - the "Total
// raw material amount" summary needs the latter, see RawMaterials.jsx.
export function usePaginatedRawMaterials(query = {}) {
  const params = { ...query, page: query.page ?? 1, pageSize: query.pageSize ?? 10 }

  return useQuery({
    queryKey: rawMaterialKeys.list(params),
    queryFn: () => rawMaterialApi.list(params),
  })
}

// Lazy by design - a material's lot history is only fetched once its row
// is expanded, not for every row up front on page load.
export function useRawMaterialLots(materialId, range = {}, { enabled = true } = {}) {
  return useQuery({
    queryKey: rawMaterialKeys.lots(materialId, range),
    queryFn: async () => {
      const { lots } = await rawMaterialApi.lots(materialId, range)
      return lots
    },
    enabled: enabled && !!materialId,
  })
}

// Lots across every material for a date range - the Supplier Payments
// (Finance) table's data source. range defaults to the current calendar
// month server-side (resolveMonthRange) when both from/to are omitted, so
// a bare call in September only returns September's purchases.
export function useAllLots(range = {}) {
  return useQuery({
    queryKey: rawMaterialKeys.allLots(range),
    queryFn: async () => {
      const { lots } = await rawMaterialApi.allLots(range)
      return lots
    },
  })
}
