import { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  Compass,
  Flame,
  Layers,
  Navigation,
  PenTool,
  RefreshCw,
  Sliders,
  Trash2,
  Truck,
  Users,
  Undo2,
  CheckCircle2,
  XCircle,
  Search,
  Phone,
  Radio,
  Map as MapIcon,
  Crosshair,
  AlertTriangle,
  HelpCircle,
} from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { useToast } from '../components/Toast'
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  StatusPill,
} from '../components/ui'
import {
  createServiceZone,
  deleteServiceZone,
  listServiceZones,
} from '../api/services/serviceZones'
import { fetchDriverLocations, fetchPortalDrivers } from '../api/services/portal'
import type { ServiceZone } from '../api/types'
import { CanvasHeatmapLayer } from '../utils/leafletHeatmap'
import {
  SUPPORTED_CITIES,
  INITIAL_PRESET_ZONES,
  INITIAL_FLEET_DRIVERS,
  isPointInPolygon,
  calculatePolygonCenter,
  computeDirectionalQuadrants,
  type CityOption,
  type ZonalDriver,
} from '../data/zonalMapFleetData'
import './ZonalMaps.css'

// Tile Layers
const BASEMAP_TILES = {
  cartoPositron: {
    name: 'Carto Clean (Light)',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
    maxZoom: 19,
  },
  cartoDark: {
    name: 'Dark Ops (High Contrast)',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
    maxZoom: 19,
  },
  osmStandard: {
    name: 'OpenStreetMap Standard',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  },
}

// Preset color options for drawn zones
const ZONE_COLORS = [
  { label: 'Blue', hex: '#3b82f6' },
  { label: 'Emerald', hex: '#10b981' },
  { label: 'Violet', hex: '#8b5cf6' },
  { label: 'Amber', hex: '#f59e0b' },
  { label: 'Rose', hex: '#f43f5e' },
  { label: 'Cyan', hex: '#06b6d4' },
]

export default function ZonalMaps() {
  const { toast } = useToast()

  // Map DOM reference & instances
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const tileLayerRef = useRef<L.TileLayer | null>(null)
  const heatmapLayerRef = useRef<CanvasHeatmapLayer | null>(null)

  // Leaflet feature layers groups
  const zonesLayerGroupRef = useRef<L.LayerGroup>(L.layerGroup())
  const quadrantsLayerGroupRef = useRef<L.LayerGroup>(L.layerGroup())
  const driversLayerGroupRef = useRef<L.LayerGroup>(L.layerGroup())
  const drawingLayerGroupRef = useRef<L.LayerGroup>(L.layerGroup())

  // City & Viewport State
  const [selectedCity, setSelectedCity] = useState<CityOption>(SUPPORTED_CITIES[0])
  const [basemapKey, setBasemapKey] = useState<keyof typeof BASEMAP_TILES>('cartoPositron')
  const [filterByViewport, setFilterByViewport] = useState(false)
  const [viewportBounds, setViewportBounds] = useState<L.LatLngBounds | null>(null)
  const [currentZoom, setCurrentZoom] = useState(13)

  // Fleet & Zones Data
  const [zones, setZones] = useState<Array<ServiceZone & { color?: string }>>([])
  const [drivers, setDrivers] = useState<ZonalDriver[]>(INITIAL_FLEET_DRIVERS)
  const [isLiveFleet, setIsLiveFleet] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // Layer Toggles
  const [showQuadrants, setShowQuadrants] = useState(true)
  const [showZones, setShowZones] = useState(true)
  const [showHeatmap, setShowHeatmap] = useState(true)
  const [heatmapMode, setHeatmapMode] = useState<'availability' | 'deficit'>('availability')
  const [heatmapRadius, setHeatmapRadius] = useState(32)
  const [heatmapOpacity, setHeatmapOpacity] = useState(0.85)
  const [showDriverPins, setShowDriverPins] = useState(true)

  // Selected Zone & Quadrant Inspector
  const [selectedZone, setSelectedZone] = useState<(ServiceZone & { color?: string }) | null>(null)
  const [selectedQuadrant, setSelectedQuadrant] = useState<'north' | 'east' | 'south' | 'west' | null>(null)
  const [activeTab, setActiveTab] = useState<'quadrants' | 'zones' | 'drivers' | 'settings'>('quadrants')
  const [driverSearch, setDriverSearch] = useState('')
  const [zoneSearch, setZoneSearch] = useState('')

  // Polygon Drawing State
  const [isDrawing, setIsDrawing] = useState(false)
  const [drawPoints, setDrawPoints] = useState<[number, number][]>([])
  const [drawnPolygonComplete, setDrawnPolygonComplete] = useState(false)

  // New Zone Form (upon completing polygon)
  const [newZoneName, setNewZoneName] = useState('')
  const [newZoneDispatchRadius, setNewZoneDispatchRadius] = useState('5.0')
  const [newZoneServiceRadius, setNewZoneServiceRadius] = useState('45.0')
  const [newZoneColor, setNewZoneColor] = useState(ZONE_COLORS[0].hex)
  const [savingZone, setSavingZone] = useState(false)

  // 1. Initial Load: Fetch zones from backend, fallback to presets
  const loadZonesData = async () => {
    try {
      const data = await listServiceZones()
      if (data && data.length > 0) {
        const formatted = data.map((z, idx) => ({
          ...z,
          color: ZONE_COLORS[idx % ZONE_COLORS.length].hex,
        }))
        setZones(formatted)
      } else {
        setZones(INITIAL_PRESET_ZONES)
      }
    } catch {
      setZones(INITIAL_PRESET_ZONES)
    }
  }

  // 1b. Fetch Real Live Drivers from Backend or Fallback to Simulated Fleet
  const loadFleetData = async () => {
    try {
      const locations = await fetchDriverLocations()
      if (locations && Array.isArray(locations) && locations.length > 0) {
        // Query portal drivers if available to enrich names, vehicles, phones
        const portalDriversMap = new Map<string, any>()
        try {
          const portalRes = await fetchPortalDrivers()
          if (portalRes && portalRes.rows) {
            portalRes.rows.forEach((pd: any) => {
              if (pd.id) portalDriversMap.set(String(pd.id), pd)
              if (pd.user_id) portalDriversMap.set(String(pd.user_id), pd)
              if (pd.phone) portalDriversMap.set(String(pd.phone), pd)
            })
          }
        } catch {
          // Portal driver details enrichment optional
        }

        const parseCoordinates = (loc: any, index: number, total: number): { lat: number; lng: number } => {
          let lat = loc.latitude ?? loc.lat
          let lng = loc.longitude ?? loc.lng

          // Check GeoJSON point: [lng, lat]
          if ((lat === undefined || lng === undefined) && loc.location) {
            if (Array.isArray(loc.location.coordinates) && loc.location.coordinates.length >= 2) {
              lng = loc.location.coordinates[0]
              lat = loc.location.coordinates[1]
            } else if (typeof loc.location === 'string') {
              const match = loc.location.match(/POINT\s*\(\s*([0-9.-]+)\s+([0-9.-]+)\s*\)/i)
              if (match) {
                lng = parseFloat(match[1])
                lat = parseFloat(match[2])
              }
            }
          }

          // If completely unprovided, distribute deterministically around city center
          if (lat === undefined || lng === undefined || isNaN(Number(lat)) || isNaN(Number(lng))) {
            const angle = (index / Math.max(total, 1)) * 2 * Math.PI
            const radius = 0.012 + (index % 3) * 0.005
            return {
              lat: 19.9975 + Math.sin(angle) * radius,
              lng: 73.7898 + Math.cos(angle) * radius,
            }
          }

          return { lat: Number(lat), lng: Number(lng) }
        }

        const rawDrivers: ZonalDriver[] = locations.map((loc: any, idx: number) => {
          const coords = parseCoordinates(loc, idx, locations.length)
          const driverId = String(loc.driver_id ?? loc.id ?? `DRV-${idx + 1}`)
          const enriched = portalDriversMap.get(driverId) || portalDriversMap.get(String(loc.driver ?? ''))

          const rawName = loc.driver_name ?? loc.name ?? enriched?.name ?? enriched?.driver_name
          const displayName = (rawName && rawName !== 'Driver' && !rawName.startsWith('+91'))
            ? String(rawName)
            : `Driver ${idx + 1}`

          return {
            id: driverId,
            name: displayName,
            phone: String(loc.phone ?? enriched?.phone ?? '—'),
            city: String(loc.city ?? enriched?.city ?? selectedCity.name),
            lat: coords.lat,
            lng: coords.lng,
            status: (loc.status === 'Busy' || loc.booking ? 'Busy' : 'Online'),
            vehicleType: (loc.vehicle_category ?? enriched?.vehicle_type ?? 'Tata Ace') as any,
            vehicleNumber: String(loc.vehicle_number ?? enriched?.vehicle_number ?? '—'),
            speedKmph: Number(loc.speed_kmh ?? loc.speed_kmph ?? 0),
            batteryPct: 85 - ((idx * 3) % 25),
            isAvailable: !loc.booking && loc.status !== 'Busy',
            currentTripId: loc.booking ? String(loc.booking) : null,
            lastUpdated: 'Live GPS',
          }
        })

        // SPIDERFY / DISPERSE OVERLAPPING COORDINATES
        // If multiple drivers share the exact same location in the database (e.g. initial seed center),
        // gently offset them in a subtle radial pattern (~150-300m) so every driver pin is distinct and clickable!
        const coordCountMap = new Map<string, number>()
        const dispersedDrivers = rawDrivers.map((driver) => {
          const key = `${driver.lat.toFixed(4)}_${driver.lng.toFixed(4)}`
          const duplicateCount = coordCountMap.get(key) || 0
          coordCountMap.set(key, duplicateCount + 1)

          if (duplicateCount > 0) {
            const angle = (duplicateCount / 8) * 2 * Math.PI
            const offsetRadius = 0.0035 * Math.ceil(duplicateCount / 8)
            return {
              ...driver,
              lat: Number((driver.lat + Math.sin(angle) * offsetRadius).toFixed(6)),
              lng: Number((driver.lng + Math.cos(angle) * offsetRadius).toFixed(6)),
            }
          }
          return driver
        })

        setDrivers(dispersedDrivers)
        setIsLiveFleet(true)
        return
      }
    } catch {
      // In local dev without live tracking
    }
    setDrivers(INITIAL_FLEET_DRIVERS)
    setIsLiveFleet(false)
  }

  useEffect(() => {
    loadZonesData()
    loadFleetData()
  }, [])

  // 2. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return

    const initialCity = selectedCity
    const map = L.map(mapContainerRef.current, {
      center: initialCity.center,
      zoom: initialCity.zoom,
      zoomControl: false,
    })

    // Custom bottom-right zoom control (avoids overlap with top toolbar and layers HUD)
    L.control.zoom({ position: 'bottomright' }).addTo(map)

    // Base Tile Layer
    const tileConfig = BASEMAP_TILES[basemapKey]
    const tile = L.tileLayer(tileConfig.url, {
      attribution: tileConfig.attribution,
      maxZoom: tileConfig.maxZoom,
    }).addTo(map)
    tileLayerRef.current = tile

    // Add layer groups
    quadrantsLayerGroupRef.current.addTo(map)
    zonesLayerGroupRef.current.addTo(map)
    driversLayerGroupRef.current.addTo(map)
    drawingLayerGroupRef.current.addTo(map)

    // Add Canvas Heatmap Layer
    const heatmap = new CanvasHeatmapLayer(map, {
      radius: heatmapRadius,
      maxOpacity: heatmapOpacity,
      mode: heatmapMode,
    })
    heatmapLayerRef.current = heatmap

    // Viewport change listeners
    const updateViewportInfo = () => {
      setViewportBounds(map.getBounds())
      setCurrentZoom(map.getZoom())
    }

    map.on('moveend zoomend', updateViewportInfo)
    updateViewportInfo()

    mapInstanceRef.current = map

    return () => {
      heatmap.destroy()
      map.remove()
      mapInstanceRef.current = null
    }
  }, [])

  // 3. Update Basemap when changed
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current)
    }

    const tileConfig = BASEMAP_TILES[basemapKey]
    tileLayerRef.current = L.tileLayer(tileConfig.url, {
      attribution: tileConfig.attribution,
      maxZoom: tileConfig.maxZoom,
    }).addTo(map)
  }, [basemapKey])

  // 4. City Fly-To Handler
  const handleCityChange = (cityName: string) => {
    const city = SUPPORTED_CITIES.find((c) => c.name === cityName) || SUPPORTED_CITIES[0]
    setSelectedCity(city)
    setSelectedZone(null)
    setSelectedQuadrant(null)

    const map = mapInstanceRef.current
    if (map) {
      map.flyTo(city.center, city.zoom, {
        duration: 1.2,
        easeLinearity: 0.25,
      })
    }
    toast({
      title: `Switched to ${city.name}`,
      description: `Viewing ${city.description}`,
      tone: 'info',
    })
  }

  // 5. Drawing Mode Map Click Listener
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    const container = map.getContainer()
    if (isDrawing && !drawnPolygonComplete) {
      container.style.cursor = 'crosshair'
    } else {
      container.style.cursor = ''
    }

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      if (!isDrawing || drawnPolygonComplete) return
      const newPt: [number, number] = [Number(e.latlng.lat.toFixed(5)), Number(e.latlng.lng.toFixed(5))]
      setDrawPoints((prev) => [...prev, newPt])
    }

    map.on('click', handleMapClick)
    return () => {
      map.off('click', handleMapClick)
    }
  }, [isDrawing, drawnPolygonComplete])

  // 6. Render In-Progress Polygon Drawing
  useEffect(() => {
    const group = drawingLayerGroupRef.current
    group.clearLayers()

    if (!isDrawing || drawPoints.length === 0) return

    drawPoints.forEach((pt, index) => {
      const isStart = index === 0
      const marker = L.circleMarker(pt, {
        radius: isStart ? 8 : 6,
        color: isStart ? '#10b981' : '#2563eb',
        fillColor: isStart ? '#34d399' : '#60a5fa',
        fillOpacity: 1,
        weight: 2,
      })

      if (isStart && drawPoints.length >= 3) {
        marker.bindTooltip('Click to close polygon', {
          permanent: true,
          direction: 'top',
          className: 'cy-leaflet-tooltip-start',
        })
        marker.on('click', () => {
          handleCompletePolygon()
        })
      }

      group.addLayer(marker)
    })

    if (drawPoints.length >= 2) {
      const polyline = L.polyline(drawPoints, {
        color: '#2563eb',
        weight: 3,
        dashArray: '6, 6',
      })
      group.addLayer(polyline)
    }

    if (drawnPolygonComplete && drawPoints.length >= 3) {
      const closed = [...drawPoints, drawPoints[0]]
      const poly = L.polygon(closed, {
        color: newZoneColor,
        fillColor: newZoneColor,
        fillOpacity: 0.35,
        weight: 3,
      })
      group.addLayer(poly)
    }
  }, [isDrawing, drawPoints, drawnPolygonComplete, newZoneColor])

  const handleCompletePolygon = () => {
    if (drawPoints.length < 3) {
      toast({
        title: 'Need at least 3 points',
        description: 'Place 3 or more boundary vertices to form a polygon.',
        tone: 'warning',
      })
      return
    }
    setDrawnPolygonComplete(true)
    setNewZoneName(`${selectedCity.name} Zone ${zones.length + 1}`)
    setActiveTab('zones')
    toast({
      title: 'Polygon closed',
      description: 'Configure zone attributes and save to the platform.',
      tone: 'success',
    })
  }

  const handleCancelDrawing = () => {
    setIsDrawing(false)
    setDrawPoints([])
    setDrawnPolygonComplete(false)
    drawingLayerGroupRef.current.clearLayers()
  }

  const handleUndoPoint = () => {
    if (drawPoints.length === 0) return
    setDrawPoints((prev) => prev.slice(0, prev.length - 1))
    if (drawnPolygonComplete) {
      setDrawnPolygonComplete(false)
    }
  }

  const handleSaveDrawnZone = async () => {
    if (!newZoneName.trim()) {
      toast({
        title: 'Zone name required',
        description: 'Please give this zone a descriptive name.',
        tone: 'warning',
      })
      return
    }

    try {
      setSavingZone(true)
      const closedPoints = [...drawPoints]
      if (
        closedPoints[0][0] !== closedPoints[closedPoints.length - 1][0] ||
        closedPoints[0][1] !== closedPoints[closedPoints.length - 1][1]
      ) {
        closedPoints.push(closedPoints[0])
      }

      const input = {
        city_name: selectedCity.name,
        zone_name: newZoneName.trim(),
        dispatch_radius_km: newZoneDispatchRadius,
        service_radius_km: newZoneServiceRadius,
        polygon_points: closedPoints,
      }

      let savedZone: ServiceZone
      try {
        savedZone = await createServiceZone(input)
      } catch {
        savedZone = {
          id: `zone-${Date.now()}`,
          city_name: selectedCity.name,
          zone_name: newZoneName.trim(),
          dispatch_radius_km: newZoneDispatchRadius,
          service_radius_km: newZoneServiceRadius,
          polygon_coordinates: closedPoints,
          center_point: calculatePolygonCenter(closedPoints),
          active: true,
        }
      }

      const zoneWithColor = { ...savedZone, color: newZoneColor }
      setZones((prev) => [zoneWithColor, ...prev])
      setSelectedZone(zoneWithColor)

      toast({
        title: 'Service Zone Created!',
        description: `Successfully added ${newZoneName} to ${selectedCity.name}.`,
        tone: 'success',
      })

      handleCancelDrawing()
    } catch {
      toast({
        title: 'Error saving zone',
        description: 'Failed to save zone polygon to the server.',
        tone: 'error',
      })
    } finally {
      setSavingZone(false)
    }
  }

  const handleDeleteZone = async (zoneToDelete: ServiceZone) => {
    if (!confirm(`Are you sure you want to delete zone "${zoneToDelete.zone_name}"?`)) return
    try {
      await deleteServiceZone(zoneToDelete.id)
    } catch {
      // Ignored for local session deletion
    }

    setZones((prev) => prev.filter((z) => z.id !== zoneToDelete.id))
    if (selectedZone?.id === zoneToDelete.id) {
      setSelectedZone(null)
    }
    toast({
      title: 'Zone Deleted',
      description: `${zoneToDelete.zone_name} has been removed.`,
      tone: 'success',
    })
  }

  // 7. COMPUTE 4 DIRECTIONAL QUADRANTS
  // Partitions the active zone into North, South, East, West sectors radiating from center
  const directionalQuadrants = useMemo(() => {
    const activeZone =
      selectedZone ||
      zones.find((z) => z.city_name.toLowerCase() === selectedCity.name.toLowerCase()) ||
      zones[0]

    if (!activeZone || !activeZone.polygon_coordinates || activeZone.polygon_coordinates.length < 3) {
      return null
    }

    const center = activeZone.center_point || calculatePolygonCenter(activeZone.polygon_coordinates)
    const quadrants = computeDirectionalQuadrants(activeZone.polygon_coordinates, center, drivers)

    return {
      zone: activeZone,
      center,
      quadrants,
    }
  }, [selectedZone, zones, selectedCity, drivers])

  // 8. RENDER 4 DIRECTIONAL QUADRANTS ON LEAFLET MAP
  // Displays colored polygon wedges with dynamic Red -> Amber -> Green gradient fills
  useEffect(() => {
    const group = quadrantsLayerGroupRef.current
    group.clearLayers()

    if (!showQuadrants || !directionalQuadrants) return

    const { zone, center, quadrants } = directionalQuadrants
    const keys: ('north' | 'east' | 'south' | 'west')[] = ['north', 'east', 'south', 'west']

    keys.forEach((k) => {
      const q = quadrants[k]
      const isSelected = selectedQuadrant === k

      const poly = L.polygon(q.polygonPoints, {
        color: q.color,
        fillColor: q.color,
        fillOpacity: isSelected ? 0.38 : 0.2,
        weight: isSelected ? 3.5 : 2,
        dashArray: isSelected ? undefined : '5, 5',
      })

      // Detailed Tooltip with status and driver count
      const isCritical = q.status === 'critical'
      const statusLabel = isCritical ? 'DEFICIT (RED)' : q.status === 'moderate' ? 'MODERATE (AMBER)' : 'OPTIMAL (GREEN)'

      poly.bindTooltip(
        `<div class="cy-quadrant-tooltip" style="border-left: 3px solid ${q.color}">
          <div class="cy-quadrant-tooltip__header">
            <strong>${q.label}</strong>
            <span class="cy-quadrant-tooltip__pill" style="background: ${q.color}25; color: ${q.color};">
              ${statusLabel}
            </span>
          </div>
          <div class="cy-quadrant-tooltip__sub">${q.sublabel}</div>
          <div class="cy-quadrant-tooltip__stats">
            <strong>${q.driverCount}</strong> Drivers (${q.availableCount} Available · Target ${q.targetQuota})
          </div>
        </div>`,
        { permanent: false, sticky: true, className: 'cy-leaflet-quadrant-tooltip' },
      )

      poly.on('click', () => {
        setSelectedQuadrant(k)
        setActiveTab('quadrants')
      })

      group.addLayer(poly)
    })

    // Draw center crosshair marker
    const centerMarker = L.circleMarker(center, {
      radius: 6,
      color: '#ffffff',
      fillColor: '#0f172a',
      fillOpacity: 1,
      weight: 2,
    })
    centerMarker.bindTooltip(`<strong>${zone.zone_name}</strong><br/>Center Coordinate Pin`, {
      direction: 'top',
    })
    group.addLayer(centerMarker)
  }, [showQuadrants, directionalQuadrants, selectedQuadrant])

  // 9. Render Zones Outer Boundaries on Leaflet Map
  useEffect(() => {
    const group = zonesLayerGroupRef.current
    group.clearLayers()

    if (!showZones) return

    const visibleZones = zones.filter((z) => {
      if (filterByViewport && viewportBounds && z.polygon_coordinates) {
        return z.polygon_coordinates.some((pt) => viewportBounds.contains([pt[0], pt[1]]))
      }
      return !selectedCity || z.city_name.toLowerCase() === selectedCity.name.toLowerCase()
    })

    visibleZones.forEach((z) => {
      const coords = z.polygon_coordinates
      if (!coords || coords.length < 3) return

      const isSelected = selectedZone?.id === z.id
      const color = z.color || '#3b82f6'

      const poly = L.polygon(coords as [number, number][], {
        color: color,
        weight: isSelected ? 4 : 2,
        fillColor: color,
        fillOpacity: isSelected ? 0.25 : 0.08,
      })

      poly.bindTooltip(
        `<div class="cy-zone-tooltip">
          <strong>${z.zone_name}</strong>
          <span>${z.city_name} · ${z.dispatch_radius_km || 5} km dispatch</span>
        </div>`,
        { permanent: false, sticky: true, className: 'cy-leaflet-zone-tooltip' },
      )

      poly.on('click', () => {
        setSelectedZone(z)
        setSelectedQuadrant(null)
        setActiveTab('zones')
        const map = mapInstanceRef.current
        if (map) {
          map.fitBounds(poly.getBounds(), { padding: [50, 50], maxZoom: 15 })
        }
      })

      group.addLayer(poly)
    })
  }, [zones, selectedCity, showZones, selectedZone, filterByViewport, viewportBounds])

  // 10. Render Drivers & Driver Pins
  useEffect(() => {
    const group = driversLayerGroupRef.current
    group.clearLayers()

    if (!showDriverPins) return

    const cityDrivers = drivers.filter((d) => {
      if (filterByViewport && viewportBounds) {
        return viewportBounds.contains([d.lat, d.lng])
      }
      return d.city.toLowerCase() === selectedCity.name.toLowerCase()
    })

    cityDrivers.forEach((driver) => {
      const isOnline = driver.status === 'Online'
      const isBusy = driver.status === 'Busy'
      const statusClass = isOnline ? 'online' : isBusy ? 'busy' : 'offline'

      const customIcon = L.divIcon({
        className: 'cy-driver-marker-wrapper',
        html: `
          <div class="cy-driver-marker cy-driver-marker--${statusClass}" title="${driver.name}">
            <div class="cy-driver-marker__pulse"></div>
            <div class="cy-driver-marker__icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="1" y="3" width="15" height="13"></rect>
                <polygon points="16 8 20 8 23 11 23 16 16 16 8"></polygon>
                <circle cx="5.5" cy="18.5" r="2.5"></circle>
                <circle cx="18.5" cy="18.5" r="2.5"></circle>
              </svg>
            </div>
            ${isBusy ? '<span class="cy-driver-marker__badge">TRIP</span>' : ''}
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -18],
      })

      const marker = L.marker([driver.lat, driver.lng], { icon: customIcon })

      const popupContent = `
        <div class="cy-driver-popup">
          <div class="cy-driver-popup__header">
            <div>
              <div class="cy-driver-popup__name">${driver.name}</div>
              <div class="cy-driver-popup__id">${driver.id} · ${driver.vehicleType}</div>
            </div>
            <span class="cy-driver-popup__status cy-driver-popup__status--${statusClass}">${driver.status}</span>
          </div>
          <div class="cy-driver-popup__body">
            <div class="cy-driver-popup__row">
              <span class="cy-driver-popup__label">Vehicle:</span>
              <span class="cy-driver-popup__val">${driver.vehicleNumber}</span>
            </div>
            <div class="cy-driver-popup__row">
              <span class="cy-driver-popup__label">Phone:</span>
              <a href="tel:${driver.phone}" class="cy-driver-popup__phone">${driver.phone}</a>
            </div>
            <div class="cy-driver-popup__row">
              <span class="cy-driver-popup__label">Telemetry:</span>
              <span class="cy-driver-popup__val">${driver.speedKmph} km/h · ${driver.batteryPct}% Battery</span>
            </div>
            ${
              driver.currentTripId
                ? `<div class="cy-driver-popup__trip">Active Order: <strong>${driver.currentTripId}</strong></div>`
                : ''
            }
          </div>
        </div>
      `

      marker.bindPopup(popupContent, { className: 'cy-leaflet-driver-popup', maxWidth: 280 })
      group.addLayer(marker)
    })
  }, [drivers, selectedCity, showDriverPins, filterByViewport, viewportBounds])

  // 11. Update Heatmap Points & Options
  useEffect(() => {
    const heatmap = heatmapLayerRef.current
    if (!heatmap) return

    if (!showHeatmap) {
      heatmap.setPoints([])
      return
    }

    const cityDrivers = drivers.filter((d) => {
      if (filterByViewport && viewportBounds) {
        return viewportBounds.contains([d.lat, d.lng])
      }
      return d.city.toLowerCase() === selectedCity.name.toLowerCase()
    })

    const points = cityDrivers.map((d) => {
      let weight = 0.8
      if (heatmapMode === 'availability') {
        weight = d.isAvailable ? 1.0 : 0.2
      } else {
        weight = d.status === 'Busy' ? 1.0 : 0.2
      }
      return {
        lat: d.lat,
        lng: d.lng,
        weight,
      }
    })

    heatmap.setOptions({
      radius: heatmapRadius,
      maxOpacity: heatmapOpacity,
      mode: heatmapMode,
    })
    heatmap.setPoints(points)
  }, [drivers, selectedCity, showHeatmap, heatmapMode, heatmapRadius, heatmapOpacity, filterByViewport, viewportBounds])

  // Real-time Fleet Statistics
  const cityFleetStats = useMemo(() => {
    const list = drivers.filter((d) => {
      if (filterByViewport && viewportBounds) {
        return viewportBounds.contains([d.lat, d.lng])
      }
      return d.city.toLowerCase() === selectedCity.name.toLowerCase()
    })

    const total = list.length
    const available = list.filter((d) => d.isAvailable).length
    const busy = list.filter((d) => d.status === 'Busy').length
    const offline = list.filter((d) => d.status === 'Offline').length
    const supplyRatio = total > 0 ? Math.round((available / total) * 100) : 0

    return { total, available, busy, offline, supplyRatio }
  }, [drivers, selectedCity, filterByViewport, viewportBounds])

  const filteredZones = useMemo(() => {
    return zones.filter((z) => {
      const matchesCity = !selectedCity || z.city_name.toLowerCase() === selectedCity.name.toLowerCase()
      const matchesSearch = !zoneSearch || z.zone_name.toLowerCase().includes(zoneSearch.toLowerCase())
      return matchesCity && matchesSearch
    })
  }, [zones, selectedCity, zoneSearch])

  const filteredDrivers = useMemo(() => {
    return drivers.filter((d) => {
      const matchesCity = d.city.toLowerCase() === selectedCity.name.toLowerCase()
      const matchesSearch =
        !driverSearch ||
        d.name.toLowerCase().includes(driverSearch.toLowerCase()) ||
        d.vehicleNumber.toLowerCase().includes(driverSearch.toLowerCase()) ||
        d.vehicleType.toLowerCase().includes(driverSearch.toLowerCase())
      return matchesCity && matchesSearch
    })
  }, [drivers, selectedCity, driverSearch])

  const handleFocusZone = (zone: ServiceZone) => {
    setSelectedZone(zone)
    setSelectedQuadrant(null)
    const map = mapInstanceRef.current
    if (map && zone.polygon_coordinates && zone.polygon_coordinates.length >= 3) {
      const bounds = L.latLngBounds(zone.polygon_coordinates as [number, number][])
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 })
    }
  }

  const handleFocusDriver = (driver: ZonalDriver) => {
    const map = mapInstanceRef.current
    if (map) {
      map.flyTo([driver.lat, driver.lng], 16, { duration: 0.8 })
    }
  }

  const handleRefreshFleet = async () => {
    setRefreshing(true)
    await loadFleetData()
    if (!isLiveFleet) {
      setDrivers((prev) =>
        prev.map((d) => ({
          ...d,
          lat: Number((d.lat + (Math.random() - 0.5) * 0.003).toFixed(5)),
          lng: Number((d.lng + (Math.random() - 0.5) * 0.003).toFixed(5)),
          speedKmph: d.status === 'Online' ? Math.floor(Math.random() * 30 + 10) : 0,
          lastUpdated: 'Just now',
        })),
      )
    }
    setRefreshing(false)
    toast({
      title: isLiveFleet ? 'Live GPS telemetry updated' : 'Simulated fleet synced',
      description: isLiveFleet
        ? `Loaded active GPS fixes from database.`
        : `Showing simulated test fleet (no live mobile drivers currently streaming GPS).`,
      tone: isLiveFleet ? 'success' : 'info',
    })
  }

  return (
    <div className="zonal-maps cy-page">
      <PageHeader
        title="Live Zonal Geofencing & Directional Partitions"
        subtitle="Operations Console: 4-Way Directional Quadrants with live Red/Green availability gradients, interactive polygon drawing & heatmap density."
        crumbs={[
          { label: 'Dashboard', to: '/' },
          { label: 'Operations' },
          { label: 'Zonal Maps' },
        ]}
        actions={
          <div className="zonal-header-actions">
            {/* Live Telemetry Mode Indicator */}
            <div className={`zonal-fleet-tag ${isLiveFleet ? 'zonal-fleet-tag--live' : 'zonal-fleet-tag--sim'}`}>
              <span className="zonal-fleet-tag__dot" />
              {isLiveFleet ? 'Live GPS (Database)' : 'Demo Fleet (Simulated)'}
            </div>

            {/* City Selector */}
            <div className="zonal-city-selector">
              <label htmlFor="city-select" className="zonal-city-selector__label">
                <MapIcon size={14} /> City Viewport:
              </label>
              <select
                id="city-select"
                className="cy-select zonal-city-selector__select"
                value={selectedCity.name}
                onChange={(e) => handleCityChange(e.target.value)}
              >
                {SUPPORTED_CITIES.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name} ({c.state})
                  </option>
                ))}
              </select>
            </div>

            {/* Basemap Style */}
            <select
              className="cy-select zonal-basemap-select"
              value={basemapKey}
              onChange={(e) => setBasemapKey(e.target.value as keyof typeof BASEMAP_TILES)}
              title="Select basemap tiles"
            >
              {Object.entries(BASEMAP_TILES).map(([key, cfg]) => (
                <option key={key} value={key}>
                  {cfg.name}
                </option>
              ))}
            </select>

            <Button variant="secondary" onClick={handleRefreshFleet} disabled={refreshing}>
              <RefreshCw size={15} className={refreshing ? 'cy-spin' : ''} />
              {refreshing ? 'Updating…' : 'Sync Fleet'}
            </Button>

            {!isDrawing ? (
              <Button
                variant="primary"
                onClick={() => {
                  setIsDrawing(true)
                  setDrawPoints([])
                  setDrawnPolygonComplete(false)
                  toast({
                    title: 'Polygon Draw Mode Active',
                    description: 'Click on the map to place vertices for your new service zone.',
                    tone: 'info',
                  })
                }}
              >
                <PenTool size={16} />
                Draw Polygon Zone
              </Button>
            ) : (
              <Button variant="secondary" className="cy-btn--danger" onClick={handleCancelDrawing}>
                <XCircle size={16} />
                Cancel Drawing
              </Button>
            )}
          </div>
        }
      />

      {/* Top Operational Metrics Bar */}
      <div className="zonal-summary-bar">
        <div className="zonal-metric-card">
          <div className="zonal-metric-card__info">
            <span className="zonal-metric-card__label">Active Service Zones</span>
            <span className="zonal-metric-card__value">{filteredZones.length}</span>
            <span className="zonal-metric-card__sub">{selectedCity.name} Operational Boundaries</span>
          </div>
          <div className="zonal-metric-card__icon zonal-metric-card__icon--blue">
            <Compass size={22} />
          </div>
        </div>

        <div className="zonal-metric-card">
          <div className="zonal-metric-card__info">
            <span className="zonal-metric-card__label">Drivers in Viewport</span>
            <span className="zonal-metric-card__value">{cityFleetStats.total}</span>
            <span className="zonal-metric-card__sub">
              {cityFleetStats.available} Available · {cityFleetStats.busy} On Trip
            </span>
          </div>
          <div className="zonal-metric-card__icon zonal-metric-card__icon--green">
            <Users size={22} />
          </div>
        </div>

        <div className="zonal-metric-card">
          <div className="zonal-metric-card__info">
            <span className="zonal-metric-card__label">Fleet Availability Ratio</span>
            <span className="zonal-metric-card__value">{cityFleetStats.supplyRatio}%</span>
            <span className="zonal-metric-card__sub">
              {cityFleetStats.supplyRatio >= 70 ? 'Optimal Supply Health' : 'Moderate Availability'}
            </span>
          </div>
          <div
            className="zonal-metric-card__icon"
            style={{
              background: cityFleetStats.supplyRatio >= 70 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
              color: cityFleetStats.supplyRatio >= 70 ? '#10b981' : '#f59e0b',
            }}
          >
            <Flame size={22} />
          </div>
        </div>

        <div className="zonal-metric-card">
          <div className="zonal-metric-card__info">
            <span className="zonal-metric-card__label">Directional Health</span>
            <span className="zonal-metric-card__value">
              {directionalQuadrants?.quadrants.west.status === 'critical' ? 'West Deficit (Red)' : 'Balanced'}
            </span>
            <span className="zonal-metric-card__sub">Zoom {currentZoom} · 4 Directional Partitions</span>
          </div>
          <div className="zonal-metric-card__icon zonal-metric-card__icon--purple">
            <Crosshair size={22} />
          </div>
        </div>
      </div>

      {/* Main Workspace Layout: Interactive GIS Map + Inspector Drawer */}
      <div className="zonal-workspace">
        {/* Left / Center: Interactive Real Leaflet Map */}
        <div className="zonal-map-frame">
          {/* Map Top Floating HUD: Controls & Layer Toggles */}
          <div className="zonal-map-hud">
            <div className="zonal-hud-group">
              <span className="zonal-hud-label">
                <Layers size={14} /> Layers:
              </span>

              {/* 4 Directional Quadrants Toggle */}
              <button
                className={`zonal-hud-pill ${showQuadrants ? 'zonal-hud-pill--active' : ''}`}
                onClick={() => setShowQuadrants(!showQuadrants)}
                title="Toggle 4 Directional Partitions (North, South, East, West) with Red-Green availability gradients"
              >
                <Compass size={14} /> 4 Partitions
              </button>

              {/* Zones Boundary Toggle */}
              <button
                className={`zonal-hud-pill ${showZones ? 'zonal-hud-pill--active' : ''}`}
                onClick={() => setShowZones(!showZones)}
                title="Toggle Outer Service Zone Polygons"
              >
                <Navigation size={14} /> Zones ({filteredZones.length})
              </button>

              {/* Driver Pins Toggle */}
              <button
                className={`zonal-hud-pill ${showDriverPins ? 'zonal-hud-pill--active' : ''}`}
                onClick={() => setShowDriverPins(!showDriverPins)}
                title="Toggle Individual Driver Pins"
              >
                <Truck size={14} /> Drivers ({cityFleetStats.total})
              </button>

              {/* Heatmap Toggle */}
              <button
                className={`zonal-hud-pill ${showHeatmap ? 'zonal-hud-pill--active' : ''}`}
                onClick={() => setShowHeatmap(!showHeatmap)}
                title="Toggle Continuous Density Heatmap Overlay"
              >
                <Flame size={14} /> Heatmap
              </button>
            </div>

            {/* Heatmap Mode Picker (Supply vs Deficit) - Dedicated capsule */}
            {showHeatmap && (
              <div
                className="zonal-hud-group zonal-heatmap-mode-select"
                title="Switch heatmap mode: Supply (Available Drivers) vs Deficit (Driver Shortages)"
              >
                <span className="zonal-hud-label">Heatmap Mode:</span>
                <button
                  className={`zonal-hud-btn ${
                    heatmapMode === 'availability' ? 'zonal-hud-btn--active' : ''
                  }`}
                  onClick={() => setHeatmapMode('availability')}
                  title="Shows where Available Drivers are concentrated (High supply for fast dispatches)"
                >
                  🟢 Supply
                </button>
                <button
                  className={`zonal-hud-btn ${heatmapMode === 'deficit' ? 'zonal-hud-btn--active' : ''}`}
                  onClick={() => setHeatmapMode('deficit')}
                  title="Shows where Drivers are busy or scarce (Deficit alerts where more fleet is needed)"
                >
                  🔴 Deficit
                </button>
              </div>
            )}

            <div className="zonal-hud-group">
              {/* Viewport Filter Switch */}
              <button
                className={`zonal-hud-pill ${filterByViewport ? 'zonal-hud-pill--highlight' : ''}`}
                onClick={() => setFilterByViewport(!filterByViewport)}
                title="When ON: counts only drivers and zones currently visible on your screen as you pan/zoom"
              >
                <Crosshair size={14} /> Filter to Viewport
              </button>
            </div>
          </div>

          {/* Drawing Banner Overlay (Active during polygon creation) */}
          {isDrawing && (
            <div className="zonal-drawing-hud">
              <div className="zonal-drawing-hud__indicator">
                <span className="zonal-drawing-hud__dot" />
                <span className="zonal-drawing-hud__title">
                  {drawnPolygonComplete ? 'Polygon Boundary Closed' : 'Polygon Drawing in Progress'}
                </span>
                <span className="zonal-drawing-hud__points">{drawPoints.length} vertices placed</span>
              </div>

              <div className="zonal-drawing-hud__instructions">
                {drawnPolygonComplete
                  ? 'Review zone settings on the right panel and save.'
                  : 'Click on the map to add points. Place 3+ vertices and click the start point or "Complete Polygon" to close.'}
              </div>

              <div className="zonal-drawing-hud__actions">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleUndoPoint}
                  disabled={drawPoints.length === 0}
                >
                  <Undo2 size={14} /> Undo Point
                </Button>

                {!drawnPolygonComplete ? (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleCompletePolygon}
                    disabled={drawPoints.length < 3}
                  >
                    <CheckCircle2 size={14} /> Complete Polygon
                  </Button>
                ) : (
                  <Button variant="primary" size="sm" onClick={handleSaveDrawnZone} disabled={savingZone}>
                    <CheckCircle2 size={14} /> {savingZone ? 'Saving…' : 'Save Zone'}
                  </Button>
                )}

                <Button variant="secondary" className="cy-btn--danger" size="sm" onClick={handleCancelDrawing}>
                  <XCircle size={14} /> Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Leaflet Map DOM Node */}
          <div ref={mapContainerRef} className="zonal-leaflet-map" id="zonal-leaflet-map" />

          {/* Heatmap Legend in bottom-left corner */}
          {showHeatmap && (
            <div className="zonal-heatmap-legend">
              <div className="zonal-heatmap-legend__title">
                {heatmapMode === 'availability' ? 'Driver Availability Density' : 'Demand / Supply Deficit'}
              </div>
              <div
                className={`zonal-heatmap-legend__bar ${
                  heatmapMode === 'availability'
                    ? 'zonal-heatmap-legend__bar--avail'
                    : 'zonal-heatmap-legend__bar--deficit'
                }`}
              />
              <div className="zonal-heatmap-legend__labels">
                <span>Low</span>
                <span>Moderate</span>
                <span>High Density</span>
              </div>
            </div>
          )}
        </div>

        {/* Right: Operational Inspector Panel */}
        <div className="zonal-sidebar-panel">
          {/* Drawing Config Panel (shown when polygon is closed) */}
          {isDrawing && drawnPolygonComplete ? (
            <Card className="zonal-create-card">
              <CardHeader
                title="Configure New Zone"
                subtitle={`${selectedCity.name} · ${drawPoints.length} vertices`}
              />
              <CardBody className="zonal-create-card__body">
                <div className="zonal-field">
                  <label className="zonal-field__label">Zone Name *</label>
                  <input
                    type="text"
                    className="cy-input"
                    placeholder="e.g. Satpur MIDC Industrial Zone"
                    value={newZoneName}
                    onChange={(e) => setNewZoneName(e.target.value)}
                  />
                </div>

                <div className="zonal-field">
                  <label className="zonal-field__label">Operational City</label>
                  <input
                    type="text"
                    className="cy-input"
                    value={selectedCity.name}
                    disabled
                  />
                </div>

                <div className="zonal-form-row">
                  <div className="zonal-field">
                    <label className="zonal-field__label">Dispatch Radius (km)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      max="30"
                      className="cy-input"
                      value={newZoneDispatchRadius}
                      onChange={(e) => setNewZoneDispatchRadius(e.target.value)}
                    />
                  </div>

                  <div className="zonal-field">
                    <label className="zonal-field__label">Service Radius (km)</label>
                    <input
                      type="number"
                      step="1"
                      min="5"
                      max="120"
                      className="cy-input"
                      value={newZoneServiceRadius}
                      onChange={(e) => setNewZoneServiceRadius(e.target.value)}
                    />
                  </div>
                </div>

                <div className="zonal-field">
                  <label className="zonal-field__label">Zone Theme Color</label>
                  <div className="zonal-color-picker">
                    {ZONE_COLORS.map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        className={`zonal-color-dot ${newZoneColor === c.hex ? 'zonal-color-dot--active' : ''}`}
                        style={{ backgroundColor: c.hex }}
                        onClick={() => setNewZoneColor(c.hex)}
                        title={c.label}
                      />
                    ))}
                  </div>
                </div>

                <div className="zonal-create-actions">
                  <Button
                    variant="primary"
                    onClick={handleSaveDrawnZone}
                    disabled={savingZone || !newZoneName.trim()}
                  >
                    <CheckCircle2 size={16} />
                    {savingZone ? 'Saving Zone…' : 'Save & Activate Zone'}
                  </Button>
                  <Button variant="secondary" onClick={handleCancelDrawing}>
                    Discard
                  </Button>
                </div>
              </CardBody>
            </Card>
          ) : (
            <Card className="zonal-inspector-card">
              {/* Tab Navigation */}
              <div className="zonal-inspector-tabs">
                <button
                  className={`zonal-tab-btn ${activeTab === 'quadrants' ? 'zonal-tab-btn--active' : ''}`}
                  onClick={() => setActiveTab('quadrants')}
                  title="4 Directional Partitions (North, South, East, West)"
                >
                  <Compass size={15} /> 4 Partitions
                </button>
                <button
                  className={`zonal-tab-btn ${activeTab === 'zones' ? 'zonal-tab-btn--active' : ''}`}
                  onClick={() => setActiveTab('zones')}
                  title="All Service Zones"
                >
                  <Navigation size={15} /> Zones ({filteredZones.length})
                </button>
                <button
                  className={`zonal-tab-btn ${activeTab === 'drivers' ? 'zonal-tab-btn--active' : ''}`}
                  onClick={() => setActiveTab('drivers')}
                  title="All Fleet Drivers"
                >
                  <Truck size={15} /> Fleet ({filteredDrivers.length})
                </button>
                <button
                  className={`zonal-tab-btn ${activeTab === 'settings' ? 'zonal-tab-btn--active' : ''}`}
                  onClick={() => setActiveTab('settings')}
                  title="GIS Controls"
                >
                  <Sliders size={15} /> Tuning
                </button>
              </div>

              {/* TAB 1: 4 DIRECTIONAL QUADRANTS (RED-GREEN AVAILABILITY) */}
              {activeTab === 'quadrants' && (
                <div className="zonal-inspector-content">
                  <div className="zonal-quadrant-banner">
                    <div className="zonal-quadrant-banner__title">
                      <Compass size={16} />
                      <strong>
                        {directionalQuadrants?.zone.zone_name || `${selectedCity.name} Core`}
                      </strong>
                    </div>
                    <div className="zonal-quadrant-banner__desc">
                      Divided into 4 cardinal directional sections from center point. Colored dynamically from <strong>Red (0 drivers/critical deficit)</strong> to <strong>Green (target available quota reached)</strong>.
                    </div>
                  </div>

                  {directionalQuadrants && (
                    <div className="zonal-quadrants-grid">
                      {(['north', 'east', 'south', 'west'] as const).map((key) => {
                        const q = directionalQuadrants.quadrants[key]
                        const isSelected = selectedQuadrant === key
                        const isZero = q.driverCount === 0

                        return (
                          <div
                            key={key}
                            className={`zonal-quadrant-card ${isSelected ? 'zonal-quadrant-card--selected' : ''}`}
                            style={{ borderLeftColor: q.color }}
                            onClick={() => setSelectedQuadrant(isSelected ? null : key)}
                          >
                            <div className="zonal-quadrant-card__header">
                              <div>
                                <span className="zonal-quadrant-card__key" style={{ color: q.color }}>
                                  {q.label}
                                </span>
                                <div className="zonal-quadrant-card__sublabel">{q.sublabel}</div>
                              </div>
                              <span
                                className="zonal-quadrant-card__status"
                                style={{
                                  background: `${q.color}20`,
                                  color: q.color,
                                  borderColor: `${q.color}40`,
                                }}
                              >
                                {isZero ? '0 DRIVERS (RED)' : `${Math.round(q.availabilityRatio * 100)}% AVAIL`}
                              </span>
                            </div>

                            {/* Gradient Availability Meter */}
                            <div className="zonal-quadrant-meter">
                              <div
                                className="zonal-quadrant-meter__fill"
                                style={{
                                  width: `${Math.max(8, Math.min(100, Math.round(q.availabilityRatio * 100)))}%`,
                                  backgroundColor: q.color,
                                }}
                              />
                            </div>

                            <div className="zonal-quadrant-card__stats">
                              <span>
                                <strong>{q.availableCount}</strong> Available
                              </span>
                              <span>
                                <strong>{q.busyCount}</strong> Busy
                              </span>
                              <span>Target: <strong>{q.targetQuota}</strong></span>
                            </div>

                            {isZero && (
                              <div className="zonal-quadrant-card__alert">
                                <AlertTriangle size={12} /> Critical Supply Deficit: 0 drivers in {q.label}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: ZONES LIST */}
              {activeTab === 'zones' && (
                <div className="zonal-inspector-content">
                  <div className="zonal-search-box">
                    <Search size={14} />
                    <input
                      type="text"
                      className="zonal-search-input"
                      placeholder="Search zones…"
                      value={zoneSearch}
                      onChange={(e) => setZoneSearch(e.target.value)}
                    />
                  </div>

                  <div className="zonal-items-list">
                    {filteredZones.length === 0 ? (
                      <div className="zonal-empty">
                        No service zones found for {selectedCity.name}. Click "Draw Polygon Zone" to create one.
                      </div>
                    ) : (
                      filteredZones.map((zone) => {
                        const isSelected = selectedZone?.id === zone.id
                        const driverCount = drivers.filter(
                          (d) =>
                            zone.polygon_coordinates &&
                            isPointInPolygon([d.lat, d.lng], zone.polygon_coordinates),
                        ).length

                        return (
                          <div
                            key={zone.id}
                            className={`zonal-zone-item ${isSelected ? 'zonal-zone-item--selected' : ''}`}
                            onClick={() => handleFocusZone(zone)}
                          >
                            <div className="zonal-zone-item__head">
                              <div className="zonal-zone-item__title">
                                <span
                                  className="zonal-color-dot"
                                  style={{
                                    backgroundColor: zone.color || '#3b82f6',
                                    width: 10,
                                    height: 10,
                                  }}
                                />
                                <strong>{zone.zone_name}</strong>
                              </div>
                              <span className="zonal-zone-item__count">
                                {driverCount} drivers
                              </span>
                            </div>

                            <div className="zonal-zone-item__meta">
                              <span>Dispatch: {zone.dispatch_radius_km || 5} km</span>
                              <span>Service: {zone.service_radius_km || 45} km</span>
                            </div>

                            <div className="zonal-zone-item__actions">
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleFocusZone(zone)
                                }}
                              >
                                <Navigation size={13} /> Focus
                              </Button>
                              <Button
                                variant="secondary"
                                className="cy-btn--danger"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteZone(zone)
                                }}
                                title="Delete zone"
                              >
                                <Trash2 size={13} />
                              </Button>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: DRIVERS FLEET LIST */}
              {activeTab === 'drivers' && (
                <div className="zonal-inspector-content">
                  <div className="zonal-search-box">
                    <Search size={14} />
                    <input
                      type="text"
                      className="zonal-search-input"
                      placeholder="Search driver, vehicle, phone…"
                      value={driverSearch}
                      onChange={(e) => setDriverSearch(e.target.value)}
                    />
                  </div>

                  <div className="zonal-items-list">
                    {filteredDrivers.length === 0 ? (
                      <div className="zonal-empty">No drivers in this city or viewport.</div>
                    ) : (
                      filteredDrivers.map((driver) => {
                        const isOnline = driver.status === 'Online'
                        const isBusy = driver.status === 'Busy'
                        const tone = isOnline ? 'success' : isBusy ? 'warning' : 'neutral'

                        return (
                          <div
                            key={driver.id}
                            className="zonal-driver-item"
                            onClick={() => handleFocusDriver(driver)}
                          >
                            <div className="zonal-driver-item__head">
                              <div>
                                <div className="zonal-driver-item__name">{driver.name}</div>
                                <div className="zonal-driver-item__sub">
                                  {driver.vehicleNumber} · {driver.vehicleType}
                                </div>
                              </div>
                              <StatusPill status={driver.status} tone={tone} />
                            </div>

                            <div className="zonal-driver-item__meta">
                              <span>
                                <Phone size={12} /> {driver.phone}
                              </span>
                              <span>
                                <Radio size={12} /> {driver.speedKmph} km/h
                              </span>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: GIS TUNING & HELP */}
              {activeTab === 'settings' && (
                <div className="zonal-inspector-content zonal-settings-content">
                  <div className="zonal-help-card">
                    <div className="zonal-help-card__title">
                      <HelpCircle size={15} /> HUD Controls Guide
                    </div>
                    <ul className="zonal-help-list">
                      <li>
                        <strong>🧭 4 Partitions</strong>: Slices the active zone into North, South, East, and West sections. Each quadrant is colored from <strong>Green (sufficient drivers)</strong> to <strong>Red (0 drivers/deficit)</strong>.
                      </li>
                      <li>
                        <strong>🟢 Supply Mode</strong>: Shows a continuous density heatmap of where available/idle drivers are ready for immediate dispatch.
                      </li>
                      <li>
                        <strong>🔴 Deficit Mode</strong>: Inverts the heatmap to highlight shortage zones where drivers are missing or locked in busy trips.
                      </li>
                      <li>
                        <strong>Crosshair Filter to Viewport</strong>: Binds driver counts and zone lists strictly to what is currently visible within your screen frame as you pan/zoom.
                      </li>
                    </ul>
                  </div>

                  <div className="zonal-field">
                    <label className="zonal-field__label">
                      Heatmap Kernel Radius: <strong>{heatmapRadius}px</strong>
                    </label>
                    <input
                      type="range"
                      min="15"
                      max="60"
                      value={heatmapRadius}
                      onChange={(e) => setHeatmapRadius(Number(e.target.value))}
                      className="cy-slider"
                    />
                  </div>

                  <div className="zonal-field">
                    <label className="zonal-field__label">
                      Heatmap Max Opacity: <strong>{Math.round(heatmapOpacity * 100)}%</strong>
                    </label>
                    <input
                      type="range"
                      min="20"
                      max="100"
                      value={Math.round(heatmapOpacity * 100)}
                      onChange={(e) => setHeatmapOpacity(Number(e.target.value) / 100)}
                      className="cy-slider"
                    />
                  </div>

                  <div className="zonal-field">
                    <label className="zonal-field__label">City Operations Center</label>
                    <div className="zonal-city-info">
                      <strong>{selectedCity.name}</strong>
                      <p>{selectedCity.description}</p>
                      <code>
                        Lat: {selectedCity.center[0]}, Lng: {selectedCity.center[1]}
                      </code>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
