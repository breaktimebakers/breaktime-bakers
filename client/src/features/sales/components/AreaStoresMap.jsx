import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertCircle, MapPin, Store } from 'lucide-react'
import { hasGoogleMapsApiKey, loadStoreOverviewMapLibraries } from '@/lib/googleMaps'

const MAP_ID = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID'
const MAX_OVERVIEW_ZOOM = 17

const getStorePosition = (store) => {
  if (store?.lat === null || store?.lat === undefined || store?.lat === '') return null
  if (store?.lng === null || store?.lng === undefined || store?.lng === '') return null

  const lat = Number(store.lat)
  const lng = Number(store.lng)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null

  return { lat, lng }
}

const createInfoWindowContent = (store) => {
  const content = document.createElement('div')
  content.className = 'min-w-48 max-w-64 py-1 pr-1 font-body text-espresso'

  const name = document.createElement('p')
  name.className = 'font-display text-base font-semibold'
  name.textContent = store.dealerName
  content.appendChild(name)

  if (store.shopName) {
    const shopName = document.createElement('p')
    shopName.className = 'mt-0.5 text-xs font-medium text-oven-amber'
    shopName.textContent = store.shopName
    content.appendChild(shopName)
  }

  const details = document.createElement('p')
  details.className = 'mt-1 text-xs text-espresso/60'
  details.textContent = [store.storeType, store.address].filter(Boolean).join(' · ')
  content.appendChild(details)

  const status = document.createElement('p')
  status.className = `mt-2 text-xs font-medium ${store.isActive ? 'text-matcha-glaze' : 'text-cherry-compote'}`
  status.textContent = store.isActive ? '● Active' : '● Inactive'
  content.appendChild(status)

  return content
}

function StoreMarkersMap({ stores }) {
  const initialCenterRef = useRef(stores[0].position)
  const mapElementRef = useRef(null)
  const mapRef = useRef(null)
  const markerLibraryRef = useRef(null)
  const coreLibraryRef = useRef(null)
  const infoWindowRef = useRef(null)
  const markerRecordsRef = useRef([])
  const [status, setStatus] = useState(hasGoogleMapsApiKey() ? 'loading' : 'missing-key')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!hasGoogleMapsApiKey()) return undefined

    let cancelled = false

    const initialize = async () => {
      try {
        const { maps, marker, core } = await loadStoreOverviewMapLibraries()
        if (cancelled || !mapElementRef.current) return

        markerLibraryRef.current = marker
        coreLibraryRef.current = core
        mapRef.current = new maps.Map(mapElementRef.current, {
          center: initialCenterRef.current,
          zoom: 16,
          mapId: MAP_ID,
          gestureHandling: 'cooperative',
          disableDefaultUI: true,
          cameraControl: true,
          zoomControl: true,
          fullscreenControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          keyboardShortcuts: false,
        })
        infoWindowRef.current = new maps.InfoWindow({ maxWidth: 280 })
        setStatus('ready')
      } catch (error) {
        if (!cancelled) {
          setStatus('error')
          setErrorMessage(error.message || 'Google Maps could not be loaded.')
        }
      }
    }

    initialize()

    return () => {
      cancelled = true
      markerRecordsRef.current.forEach(({ marker, handleClick }) => {
        marker.removeEventListener('gmp-click', handleClick)
        marker.map = null
      })
      markerRecordsRef.current = []
      infoWindowRef.current?.close()
      infoWindowRef.current = null
      mapRef.current = null
      markerLibraryRef.current = null
      coreLibraryRef.current = null
    }
  }, [])

  useEffect(() => {
    if (status !== 'ready' || !mapRef.current || !coreLibraryRef.current || !markerLibraryRef.current) return undefined

    markerRecordsRef.current.forEach(({ marker, handleClick }) => {
      marker.removeEventListener('gmp-click', handleClick)
      marker.map = null
    })
    markerRecordsRef.current = []
    infoWindowRef.current?.close()

    const { LatLngBounds } = coreLibraryRef.current
    const { AdvancedMarkerElement, PinElement } = markerLibraryRef.current
    const bounds = new LatLngBounds()

    markerRecordsRef.current = stores.map((store) => {
      const pin = new PinElement({
        background: store.isActive ? '#6B8A5C' : '#A83A3A',
        borderColor: '#3B2A21',
        glyphColor: '#FFFBF3',
        scale: 1.05,
      })
      const marker = new AdvancedMarkerElement({
        map: mapRef.current,
        position: store.position,
        title: store.dealerName,
        content: pin,
        gmpClickable: true,
      })
      const handleClick = () => {
        infoWindowRef.current?.setContent(createInfoWindowContent(store))
        infoWindowRef.current?.open({ map: mapRef.current, anchor: marker })
      }

      marker.addEventListener('gmp-click', handleClick)
      bounds.extend(store.position)
      return { marker, handleClick }
    })

    if (stores.length === 1) {
      mapRef.current.setCenter(stores[0].position)
      mapRef.current.setZoom(16)
      return undefined
    }

    mapRef.current.fitBounds(bounds, 56)
    const idleListener = mapRef.current.addListener('idle', () => {
      if (mapRef.current?.getZoom() > MAX_OVERVIEW_ZOOM) {
        mapRef.current.setZoom(MAX_OVERVIEW_ZOOM)
      }
      idleListener.remove()
    })

    return () => idleListener.remove()
  }, [status, stores])

  return (
    <div className="relative h-72 overflow-hidden bg-crust/40 sm:h-96">
      <div ref={mapElementRef} className="h-full w-full" aria-label="Map showing stores in this area" />
      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-crust/85 text-sm text-espresso/50">Loading store locations…</div>
      )}
      {status === 'missing-key' && (
        <div className="absolute inset-0 flex items-center justify-center bg-crust px-5 text-center text-sm text-espresso/60">
          <AlertCircle className="mr-2 h-5 w-5 shrink-0 text-oven-amber" /> Google Maps API key is not configured.
        </div>
      )}
      {status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-crust px-5 text-center text-sm text-espresso/60">
          <AlertCircle className="h-6 w-6 text-cherry-compote" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  )
}

export function AreaStoresMap({ stores }) {
  const locatedStores = useMemo(() => stores.flatMap((store) => {
    const position = getStorePosition(store)
    return position ? [{ ...store, position }] : []
  }), [stores])
  const missingLocationCount = stores.length - locatedStores.length

  return (
    <section className="mb-5 overflow-hidden rounded-bakery border border-espresso/8 bg-proof-cream shadow-bakery" aria-labelledby="store-locations-title">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-espresso/10 px-4 py-3.5 sm:px-5">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-oven-amber">Area coverage</p>
          <h2 id="store-locations-title" className="mt-0.5 font-display text-lg font-semibold text-espresso">Store locations</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-matcha-glaze/10 px-2.5 py-1 font-medium text-matcha-glaze">
            <MapPin className="h-3.5 w-3.5" /> {locatedStores.length} mapped
          </span>
          {missingLocationCount > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-espresso/5 px-2.5 py-1 font-medium text-espresso/55">
              <Store className="h-3.5 w-3.5" /> {missingLocationCount} missing location
            </span>
          )}
        </div>
      </div>

      {locatedStores.length > 0 ? (
        <StoreMarkersMap stores={locatedStores} />
      ) : (
        <div className="flex min-h-52 flex-col items-center justify-center px-5 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-sourdough/40 text-espresso/55">
            <MapPin className="h-5 w-5" />
          </div>
          <p className="mt-3 text-sm font-medium text-espresso">No store locations to map</p>
          <p className="mt-1 max-w-sm text-xs text-espresso/50">Edit a store and save its latitude and longitude to show it here.</p>
        </div>
      )}
    </section>
  )
}
