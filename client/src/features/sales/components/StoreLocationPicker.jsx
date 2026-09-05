import { useEffect, useRef, useState } from 'react'
import { AlertCircle, LocateFixed, MapPin } from 'lucide-react'
import { hasGoogleMapsApiKey, loadStoreMapLibraries } from '@/lib/googleMaps'

const MAP_ID = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID'

const toPosition = (lat, lng) => {
  if (lat === '' || lng === '' || lat === null || lng === null || lat === undefined || lng === undefined) return null

  const parsedLat = Number(lat)
  const parsedLng = Number(lng)

  if (!Number.isFinite(parsedLat) || !Number.isFinite(parsedLng)) return null
  if (parsedLat < -90 || parsedLat > 90 || parsedLng < -180 || parsedLng > 180) return null

  return { lat: parsedLat, lng: parsedLng }
}

const roundCoordinate = (value) => Number(value).toFixed(6)

const getLocationErrorMessage = (error) => {
  if (error.code === 1) return 'Location permission is required. Allow location access in your browser to load the map.'
  if (error.code === 2) return 'Your device could not determine its location. Turn on device location services and try again.'
  if (error.code === 3) return 'Getting your location timed out. Move near a window or outdoors, then try again.'
  return 'Could not access your location. Check your browser and device location settings, then try again.'
}

export function StoreLocationPicker({ lat, lng, requirePermission = true, onChange, onAuthorizationChange }) {
  const savedPosition = toPosition(lat, lng)
  const canUseSavedPosition = !requirePermission && Boolean(savedPosition)
  const mapElementRef = useRef(null)
  const mapRef = useRef(null)
  const markerRef = useRef(null)
  const markerClassRef = useRef(null)
  const placeMarkerRef = useRef(null)
  const onChangeRef = useRef(onChange)
  const onAuthorizationChangeRef = useRef(onAuthorizationChange)
  const initialPositionRef = useRef(savedPosition)
  const [status, setStatus] = useState(hasGoogleMapsApiKey() ? (canUseSavedPosition ? 'loading' : 'permission-required') : 'missing-key')
  const [authorizationPosition, setAuthorizationPosition] = useState(canUseSavedPosition ? savedPosition : null)
  const [locationAccuracy, setLocationAccuracy] = useState(null)
  const [locationError, setLocationError] = useState('')

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    onAuthorizationChangeRef.current = onAuthorizationChange
  }, [onAuthorizationChange])

  useEffect(() => {
    if (requirePermission || authorizationPosition) return

    const position = toPosition(lat, lng)
    if (!position) return

    initialPositionRef.current = position
    setStatus('loading')
    setAuthorizationPosition(position)
    onAuthorizationChangeRef.current?.(true)
  }, [authorizationPosition, lat, lng, requirePermission])

  useEffect(() => {
    if (!requirePermission) return undefined
    if (!navigator.permissions?.query) return undefined

    let permissionStatus
    let cancelled = false

    const watchPermission = async () => {
      try {
        permissionStatus = await navigator.permissions.query({ name: 'geolocation' })
        if (cancelled) return

        permissionStatus.onchange = () => {
          if (permissionStatus.state !== 'denied') return
          setAuthorizationPosition(null)
          onAuthorizationChangeRef.current?.(false)
          setStatus('permission-required')
          setLocationError('Location permission was removed. Allow it again to load the map.')
        }
      } catch {
        // Some browsers support geolocation but not querying its permission.
      }
    }

    watchPermission()

    return () => {
      cancelled = true
      if (permissionStatus) permissionStatus.onchange = null
    }
  }, [requirePermission])

  useEffect(() => {
    if (!hasGoogleMapsApiKey() || !authorizationPosition) return undefined

    let cancelled = false
    let mapClickListener
    let markerDragListener

    const emitPosition = (position) => {
      onChangeRef.current({
        lat: roundCoordinate(position.lat),
        lng: roundCoordinate(position.lng),
      })
    }

    const placeMarker = (position, panTo = false) => {
      if (!mapRef.current || !markerClassRef.current) return

      if (!markerRef.current) {
        markerRef.current = new markerClassRef.current({
          map: mapRef.current,
          position,
          gmpDraggable: true,
          title: 'Store location',
        })
        markerDragListener = markerRef.current.addListener('dragend', (event) => {
          if (!event.latLng) return
          emitPosition({ lat: event.latLng.lat(), lng: event.latLng.lng() })
        })
      } else {
        markerRef.current.position = position
      }

      if (panTo) {
        mapRef.current.panTo(position)
        mapRef.current.setZoom(17)
      }
    }
    placeMarkerRef.current = placeMarker

    const initialize = async () => {
      try {
        const { maps, marker } = await loadStoreMapLibraries()
        if (cancelled || !mapElementRef.current) return

        const initialPosition = initialPositionRef.current || authorizationPosition
        markerClassRef.current = marker.AdvancedMarkerElement
        mapRef.current = new maps.Map(mapElementRef.current, {
          center: initialPosition,
          zoom: 17,
          mapId: MAP_ID,
          disableDefaultUI: true,
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          keyboardShortcuts: false,
        })

        if (initialPosition) placeMarker(initialPosition)

        mapClickListener = mapRef.current.addListener('click', (event) => {
          if (!event.latLng) return
          const position = { lat: event.latLng.lat(), lng: event.latLng.lng() }
          placeMarker(position)
          emitPosition(position)
        })

        setStatus('ready')
      } catch (error) {
        if (!cancelled) {
          setStatus('error')
          setLocationError(error.message || 'Google Maps could not be loaded.')
        }
      }
    }

    initialize()

    return () => {
      cancelled = true
      mapClickListener?.remove()
      markerDragListener?.remove()
      if (markerRef.current) markerRef.current.map = null
      markerRef.current = null
      mapRef.current = null
      placeMarkerRef.current = null
    }
  }, [authorizationPosition])

  useEffect(() => {
    const position = toPosition(lat, lng)
    if (!position) {
      if (lat === '' && lng === '') {
        initialPositionRef.current = null
        if (markerRef.current) {
          markerRef.current.map = null
          markerRef.current = null
        }
      }
      return
    }
    initialPositionRef.current = position
    if (!placeMarkerRef.current) return
    placeMarkerRef.current(position, true)
  }, [lat, lng])

  const useCurrentLocation = () => {
    setLocationError('')

    if (!navigator.geolocation) {
      setLocationError('Location is not supported by this browser.')
      return
    }

    setStatus('locating')
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const position = { lat: coords.latitude, lng: coords.longitude }
        setLocationAccuracy(Math.round(coords.accuracy))
        onAuthorizationChangeRef.current?.(true)

        if (mapRef.current) {
          placeMarkerRef.current?.(position, true)
          onChangeRef.current({ lat: roundCoordinate(position.lat), lng: roundCoordinate(position.lng) })
          setStatus('ready')
          return
        }

        if (!initialPositionRef.current) {
          onChangeRef.current({ lat: roundCoordinate(position.lat), lng: roundCoordinate(position.lng) })
        }
        setStatus('loading')
        setAuthorizationPosition(position)
      },
      (error) => {
        setLocationError(error.code === 1 && !requirePermission
          ? 'Location permission was denied. The saved store location is still shown.'
          : getLocationErrorMessage(error))

        if (error.code === 1 && requirePermission) {
          setAuthorizationPosition(null)
          onAuthorizationChangeRef.current?.(false)
          setStatus('permission-required')
        } else {
          setStatus(authorizationPosition ? 'ready' : 'permission-required')
        }
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
    )
  }

  if (status === 'missing-key') {
    return (
      <div className="rounded-lg border border-oven-amber/30 bg-oven-amber/5 p-4 text-sm text-espresso/70">
        <div className="flex items-start gap-2">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-oven-amber" />
          <p>Add <code className="rounded bg-espresso/5 px-1 py-0.5 text-xs">VITE_GOOGLE_MAPS_API_KEY</code> to <code className="rounded bg-espresso/5 px-1 py-0.5 text-xs">client/.env</code>, then restart the client.</p>
        </div>
      </div>
    )
  }

  if (!authorizationPosition && !requirePermission) {
    return (
      <div className="rounded-lg border border-espresso/10 bg-crust/35 p-5 text-center">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-oven-amber/10 text-oven-amber">
          <MapPin className="h-5 w-5" />
        </div>
        <h3 className="mt-3 font-display text-base font-semibold text-espresso">No saved location</h3>
        <p className="mx-auto mt-1 max-w-sm text-sm text-espresso/55">Enter valid latitude and longitude below to load the map.</p>
      </div>
    )
  }

  if (!authorizationPosition) {
    return (
      <div className="rounded-lg border border-espresso/10 bg-crust/35 p-5 text-center">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-oven-amber/10 text-oven-amber">
          <LocateFixed className="h-5 w-5" />
        </div>
        <h3 className="mt-3 font-display text-base font-semibold text-espresso">Location permission required</h3>
        <p className="mx-auto mt-1 max-w-sm text-sm text-espresso/55">The map will load only after your browser provides the current device location. No fallback location will be used.</p>
        <button
          type="button"
          onClick={useCurrentLocation}
          disabled={status === 'locating'}
          className="mt-4 inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-espresso px-4 text-sm font-medium text-crust transition hover:bg-espresso/90 disabled:cursor-wait disabled:opacity-60"
        >
          <LocateFixed className="h-4 w-4" /> {status === 'locating' ? 'Getting location…' : 'Allow location and load map'}
        </button>
        {locationError && <p className="mt-3 text-xs text-cherry-compote">{locationError}</p>}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="relative overflow-hidden rounded-lg border border-espresso/15 bg-crust/40">
        <div ref={mapElementRef} className="h-56 w-full" />
        {status === 'loading' && (
          <div className="absolute inset-0 flex items-center justify-center bg-crust/80 text-sm text-espresso/50">Loading Google Maps…</div>
        )}
        {status === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-crust px-5 text-center text-sm text-espresso/60">
            <MapPin className="h-6 w-6 text-cherry-compote" />
            <span>Google Maps could not be loaded.</span>
          </div>
        )}
      </div>

      <div className="flex justify-start">
        <button
          type="button"
          onClick={useCurrentLocation}
          disabled={status !== 'ready'}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-espresso/10 bg-crust/40 px-3 text-sm font-medium text-espresso/70 transition hover:bg-crust/70 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <LocateFixed className="h-4 w-4" /> {status === 'locating' ? 'Getting location…' : 'Update current location'}
        </button>
      </div>

      <p className="text-[11px] text-espresso/45">Click the map, drag the pin, or enter coordinates to set the exact store location.</p>
      {locationAccuracy !== null && <p className="text-[11px] text-matcha-glaze">Device location received · accurate within approximately {locationAccuracy} m</p>}
      {locationError && <p className="text-xs text-cherry-compote">{locationError}</p>}
    </div>
  )
}
