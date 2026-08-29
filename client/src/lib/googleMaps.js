import { importLibrary, setOptions } from '@googlemaps/js-api-loader'

const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

let configured = false

function configureGoogleMaps() {
  if (!apiKey) {
    throw new Error('Google Maps is not configured. Add VITE_GOOGLE_MAPS_API_KEY to client/.env.')
  }

  if (!configured) {
    setOptions({ key: apiKey, v: 'weekly' })
    configured = true
  }
}

export async function loadStoreMapLibraries() {
  configureGoogleMaps()

  const [maps, marker, places] = await Promise.all([
    importLibrary('maps'),
    importLibrary('marker'),
    importLibrary('places'),
  ])

  return { maps, marker, places }
}

export async function loadStoreOverviewMapLibraries() {
  configureGoogleMaps()

  const [maps, marker, core] = await Promise.all([
    importLibrary('maps'),
    importLibrary('marker'),
    importLibrary('core'),
  ])

  return { maps, marker, core }
}

export function hasGoogleMapsApiKey() {
  return Boolean(apiKey)
}
