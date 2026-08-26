import { useQuery } from '@tanstack/react-query'
import { areaApi, storeApi } from '../api/areaApi'

export const areaKeys = {
  all: ['areas'],
  list: ['areas', 'list'],
  detail: (id) => ['areas', id],
  stores: (id) => ['areas', id, 'stores'],
}

export const storeKeys = {
  all: ['stores'],
  list: ['stores', 'list'],
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

// Every store across every area - unlike useStores above, this isn't
// scoped to one area. The Add Order store picker needs it regardless of
// whether the modal was opened from a specific area's Orders page or the
// all-areas one.
export function useAllStores() {
  return useQuery({
    queryKey: storeKeys.list,
    queryFn: async () => {
      const { stores } = await storeApi.list()
      return stores
    },
  })
}
