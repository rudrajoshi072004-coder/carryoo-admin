import { useEffect, useMemo } from 'react'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import { NASHIK_CENTER, formatCoords } from '../lib/geo'
import { customerVehicleLabel } from '../lib/customerVehicles'
import type { LiveDriver } from '../data/liveTrackingData'
import 'leaflet/dist/leaflet.css'
import './LiveMap.css'

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl

function markerIcon(driver: LiveDriver, selected: boolean) {
  const status = driver.status.toLowerCase()
  return L.divIcon({
    className: `osm-marker osm-marker--${status} ${selected ? 'is-selected' : ''} ${driver.hasLocation ? '' : 'is-unlocated'}`,
    html: `<span class="osm-marker__pulse"></span><span class="osm-marker__dot">${driver.initials}</span>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  })
}

function MapController({
  drivers,
  selectedId,
}: {
  drivers: LiveDriver[]
  selectedId: string | null
}) {
  const map = useMap()
  const located = useMemo(
    () => drivers.filter((d) => d.hasLocation),
    [drivers],
  )
  const selected = located.find((d) => d.id === selectedId) ?? null

  useEffect(() => {
    if (selected) {
      map.flyTo([selected.lat, selected.lng], 16, { duration: 0.75 })
      return
    }
    if (located.length === 1) {
      map.setView([located[0].lat, located[0].lng], 14)
      return
    }
    if (located.length > 1) {
      const bounds = L.latLngBounds(located.map((d) => [d.lat, d.lng] as [number, number]))
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 })
    }
  }, [map, selected?.id, located.length])

  return null
}

export default function LiveMap({
  drivers,
  selectedId,
  onSelect,
}: {
  drivers: LiveDriver[]
  selectedId: string | null
  onSelect: (driver: LiveDriver) => void
}) {
  const located = drivers.filter((d) => d.hasLocation)
  const selected = located.find((d) => d.id === selectedId)
  const center: [number, number] = selected
    ? [selected.lat, selected.lng]
    : located[0]
      ? [located[0].lat, located[0].lng]
      : [NASHIK_CENTER.lat, NASHIK_CENTER.lng]

  return (
    <div className="osm-map">
      <MapContainer
        center={center}
        zoom={located.length ? 13 : 12}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapController drivers={drivers} selectedId={selectedId} />
        {located.map((driver) => (
          <Marker
            key={driver.id}
            position={[driver.lat, driver.lng]}
            icon={markerIcon(driver, selectedId === driver.id)}
            eventHandlers={{ click: () => onSelect(driver) }}
          >
            <Popup>
              <strong>{driver.name}</strong>
              <div>{customerVehicleLabel(driver.vehicleType)} · {driver.vehicle}</div>
              <div>{driver.status}</div>
              <div>{formatCoords(driver.lat, driver.lng)}</div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      {located.length === 0 ? (
        <div className="osm-map__empty">
          No live GPS yet. Online drivers appear in the list; the map updates when they share location.
        </div>
      ) : null}
    </div>
  )
}
