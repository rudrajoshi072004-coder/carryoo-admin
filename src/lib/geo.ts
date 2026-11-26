/** Nashik city centre — used when a driver has no GPS yet. */
export const NASHIK_CENTER = { lat: 19.9975, lng: 73.7898 } as const

export type LatLng = { lat: number; lng: number }

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number.parseFloat(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

function isValidLatLng(lat: number, lng: number): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180 && !(lat === 0 && lng === 0)
}

export function parseLatLng(row: Record<string, unknown> | null | undefined): LatLng | null {
  if (!row) return null

  const latDirect = asNumber(row.latitude ?? row.lat)
  const lngDirect = asNumber(row.longitude ?? row.lng)
  if (latDirect != null && lngDirect != null && isValidLatLng(latDirect, lngDirect)) {
    return { lat: latDirect, lng: lngDirect }
  }

  const location = row.location
  if (location && typeof location === 'object') {
    const coords = (location as { coordinates?: unknown }).coordinates
    if (Array.isArray(coords) && coords.length >= 2) {
      const lng = asNumber(coords[0])
      const lat = asNumber(coords[1])
      if (lat != null && lng != null && isValidLatLng(lat, lng)) {
        return { lat, lng }
      }
    }
  }

  if (typeof location === 'string') {
    const match = location.match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i)
    if (match) {
      const lng = asNumber(match[1])
      const lat = asNumber(match[2])
      if (lat != null && lng != null && isValidLatLng(lat, lng)) {
        return { lat, lng }
      }
    }
  }

  return null
}

export function formatCoords(lat: number, lng: number): string {
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`
}

export function googleMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat},${lng}`
}
