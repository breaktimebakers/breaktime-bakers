import { useQuery } from '@tanstack/react-query'
import { areaApi } from '../api/areaApi'

export const areaKeys = {
  all: ['areas'],
  list: ['areas', 'list'],
  detail: (id) => ['areas', id],
  stores: (id) => ['areas', id, 'stores'],
}

export function useAreas() {
  return useQuery({
    queryKey: areaKeys.list,
    queryFn: async () => {
      const { areas } = await areaApi.list()
      return areas
    },
  })
}

export function useArea(id) {
  return useQuery({
    queryKey: areaKeys.detail(id),
    queryFn: async () => {
      const { area } = await areaApi.detail(id)
      return area
    },
    enabled: !!id,
  })
}

// Lazy by design - fetched once an area is actually opened, not for
// every area up front on the Areas grid (that page only needs the
// server-computed storeCount, already included on each area row).
export function useStores(areaId) {
  return useQuery({
    queryKey: areaKeys.stores(areaId),
    queryFn: async () => {
      const { stores } = await areaApi.stores(areaId)
      return stores
    },
    enabled: !!areaId,
  })
}
