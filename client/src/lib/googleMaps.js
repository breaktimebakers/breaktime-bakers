import { importLibrary, setOptions } from '@googlemaps/js-api-loader'

const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

let configured = false

// Google's own "Keyboard shortcuts" dialog (shown when the map/marker
// regains focus, e.g. after a click) is a native <dialog> that Maps'
// internals sometimes re-showModal() without cleanly closing first,
// throwing "already open as a non-modal dialog" and crashing whatever
// click/drag triggered it. keyboardShortcuts: false on the map only
// disables arrow-key panning, not this focus-triggered dialog. This app
// never renders its own <dialog> elements, so making showModal
// idempotent only ever affects Maps' internal dialog.
function patchDialogShowModal() {
  if (typeof HTMLDialogElement === 'undefined') return

  const nativeShowModal = HTMLDialogElement.prototype.showModal
  HTMLDialogElement.prototype.showModal = function showModal(...args) {
    if (this.open) this.close()
    return nativeShowModal.apply(this, args)
  }
}

function configureGoogleMaps() {
  if (!apiKey) {
    throw new Error('Google Maps is not configured. Add VITE_GOOGLE_MAPS_API_KEY to client/.env.')
  }

  if (!configured) {
    patchDialogShowModal()
    setOptions({ key: apiKey, v: 'weekly' })
    configured = true
  }
}

export async function loadStoreMapLibraries() {
  configureGoogleMaps()

  const [maps, marker] = await Promise.all([
    importLibrary('maps'),
    importLibrary('marker'),
  ])

  return { maps, marker }
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
