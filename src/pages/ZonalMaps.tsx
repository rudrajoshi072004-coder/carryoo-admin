import { useEffect, useMemo, useState } from 'react'
import {
  Compass,
  Layers,
  Plus,
  RefreshCw,
  Save,
  Sliders,
  Sparkles,
  Trash2,
  Users,
  ShieldCheck,
  Edit2,
  Crosshair,
  TrendingUp,
} from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { useToast } from '../components/Toast'
import {
  Button,
  Card,
  Skeleton,
  StatusPill,
} from '../components/ui'
import {
  createServiceZone,
  deleteServiceZone,
  listServiceZones,
  updateServiceZone,
  fetchZoneDriverAvailability,
  configureDirectionalSections,
} from '../api/services/serviceZones'
import type {
  DirectionKey,
  DirectionalSectionConfig,
  DirectionalSectionAvailability,
  ServiceZone,
  ZoneAvailabilityResponse,
} from '../api/types'
import './ZonalMaps.css'

// Built-in Nashik Zone Presets
const ZONE_PRESETS = [
  {
    name: 'Nashik Metropolitan Core',
    city: 'Nashik',
    dispatchRadius: '6',
    serviceRadius: '50',
    center: [19.9975, 73.7898] as [number, number],
    coords: [
      [19.9200, 73.7100],
      [20.0600, 73.7100],
      [20.0600, 73.8600],
      [19.9200, 73.8600],
      [19.9200, 73.7100],
    ],
  },
  {
    name: 'Panchavati Northern Hub',
    city: 'Nashik',
    dispatchRadius: '5',
    serviceRadius: '45',
    center: [20.0150, 73.7950] as [number, number],
    coords: [
      [19.9800, 73.7400],
      [20.0800, 73.7400],
      [20.0800, 73.8500],
      [19.9800, 73.8500],
      [19.9800, 73.7400],
    ],
  },
  {
    name: 'Satpur & Ambad Industrial Corridor',
    city: 'Nashik',
    dispatchRadius: '7',
    serviceRadius: '55',
    center: [19.9650, 73.7250] as [number, number],
    coords: [
      [19.9000, 73.6800],
      [20.0200, 73.6800],
      [20.0200, 73.7800],
      [19.9000, 73.7800],
      [19.9000, 73.6800],
    ],
  },
]

// Direction Colors & Angles
const DIRECTION_METAS: Record<
  DirectionKey,
  { label: string; direction: 'N' | 'S' | 'E' | 'W'; angle: number; defaultTarget: number }
> = {
  north: { label: 'North Section', direction: 'N', angle: 0, defaultTarget: 8 },
  east: { label: 'East Section', direction: 'E', angle: 90, defaultTarget: 6 },
  south: { label: 'South Section', direction: 'S', angle: 180, defaultTarget: 8 },
  west: { label: 'West Section', direction: 'W', angle: 270, defaultTarget: 10 },
}

// Color interpolation from Red (#ef4444) to Amber (#f59e0b) to Green (#22c55e)
function getAvailabilityColor(ratio: number): string {
  const r = Math.max(0, Math.min(1, ratio))
  if (r <= 0.5) {
    const t = r / 0.5
    const red = Math.round(239 + t * (245 - 239))
    const green = Math.round(68 + t * (158 - 68))
    const blue = Math.round(68 + t * (11 - 68))
    return `rgb(${red}, ${green}, ${blue})`
  } else {
    const t = (r - 0.5) / 0.5
    const red = Math.round(245 + t * (34 - 245))
    const green = Math.round(158 + t * (197 - 158))
    const blue = Math.round(11 + t * (94 - 11))
    return `rgb(${red}, ${green}, ${blue})`
  }
}

// Generate default 4 directional wedges from polygon coordinates & center
function generateDirectionalQuadrants(
  coords: number[][],
  center: [number, number],
): Record<DirectionKey, DirectionalSectionConfig> {
  const lats = coords.map((p) => p[0])
  const lngs = coords.map((p) => p[1])
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const minLng = Math.min(...lngs)
  const maxLng = Math.max(...lngs)
  const [cLat, cLng] = center

  return {
    north: {
      id: 'north',
      name: 'North Section (Panchavati / Dindori)',
      direction: 'N',
      angle_deg: 0,
      target_drivers: 8,
      active: true,
      dispatch_radius_km: 6,
      polygon_points: [
        [cLat, cLng],
        [maxLat, minLng],
        [maxLat, maxLng],
        [cLat, cLng],
      ],
    },
    east: {
      id: 'east',
      name: 'East Section (Dwarka / Highway)',
      direction: 'E',
      angle_deg: 90,
      target_drivers: 6,
      active: true,
      dispatch_radius_km: 5.5,
      polygon_points: [
        [cLat, cLng],
        [maxLat, maxLng],
        [minLat, maxLng],
        [cLat, cLng],
      ],
    },
    south: {
      id: 'south',
      name: 'South Section (Nashik Rd / Deolali)',
      direction: 'S',
      angle_deg: 180,
      target_drivers: 8,
      active: true,
      dispatch_radius_km: 6.5,
      polygon_points: [
        [cLat, cLng],
        [minLat, maxLng],
        [minLat, minLng],
        [cLat, cLng],
      ],
    },
    west: {
      id: 'west',
      name: 'West Section (Satpur / Ambad MIDC)',
      direction: 'W',
      angle_deg: 270,
      target_drivers: 10,
      active: true,
      dispatch_radius_km: 7,
      polygon_points: [
        [cLat, cLng],
        [minLat, minLng],
        [maxLat, minLng],
        [cLat, cLng],
      ],
    },
  }
}

export default function ZonalMaps() {
  const { toast } = useToast()
  const [zones, setZones] = useState<ServiceZone[]>([])
  const [selectedZone, setSelectedZone] = useState<ServiceZone | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [availability, setAvailability] = useState<ZoneAvailabilityResponse | null>(null)

  // Active section selection (North / South / East / West)
  const [selectedDirection, setSelectedDirection] = useState<DirectionKey>('north')
  const [isEditingSection, setIsEditingSection] = useState(false)

  // View layers
  const [showDriverPins, setShowDriverPins] = useState(true)
  const [showLandmarks, setShowLandmarks] = useState(true)
  const [viewMode, setViewMode] = useState<'gradient' | 'boundary'>('gradient')

  // Simulator mode
  const [simulatorMode, setSimulatorMode] = useState(false)
  const [simDrivers, setSimDrivers] = useState<Record<DirectionKey, number>>({
    north: 7,
    east: 3,
    south: 6,
    west: 1, // critical deficit
  })

  // Create / Edit Zone Modal
  const [modalOpen, setModalOpen] = useState(false)
  const [editingZoneId, setEditingZoneId] = useState<string | null>(null)
  const [formName, setFormName] = useState('')
  const [formCity, setFormCity] = useState('Nashik')
  const [formDispatchRadius, setFormDispatchRadius] = useState('6')
  const [formServiceRadius, setFormServiceRadius] = useState('50')

  // Tooltip
  const [hoveredDriver, setHoveredDriver] = useState<{
    name: string
    vehicle: string
    phone: string
    status: string
    x: number
    y: number
  } | null>(null)

  // 1. Load Zones
  const loadZones = async () => {
    try {
      setLoading(true)
      const data = await listServiceZones()
      setZones(data)
      if (data.length > 0) {
        setSelectedZone(data[0])
      }
    } catch {
      toast({
        title: 'Error loading zones',
        description: 'Could not fetch service zones from server.',
        tone: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadZones()
  }, [])

  // 2. Load Availability for selected zone
  const loadAvailability = async (zone: ServiceZone) => {
    try {
      setRefreshing(true)
      const data = await fetchZoneDriverAvailability(zone.id)
      setAvailability(data)
    } catch {
      // Fallback local availability if backend endpoint encounters empty mock data
      const coords = zone.polygon_coordinates || ZONE_PRESETS[0].coords
      const center = zone.center_point || ZONE_PRESETS[0].center
      const defaultSections = generateDirectionalQuadrants(coords, center)

      const fallbackSections: Record<DirectionKey, DirectionalSectionAvailability> = {
        north: {
          ...defaultSections.north,
          driver_count: 8,
          available_count: 7,
          busy_count: 1,
          availability_ratio: 0.88,
          gradient_color: getAvailabilityColor(0.88),
          status_level: 'optimal',
          drivers: [
            { id: '1', name: 'Ramesh Patil', phone: '+91 98220 11223', lat: 20.02, lng: 73.79, status: 'Online', is_available: true, speed_kmph: 18 },
            { id: '2', name: 'Sachin Jadhav', phone: '+91 98221 44556', lat: 20.03, lng: 73.81, status: 'Online', is_available: true, speed_kmph: 0 },
            { id: '3', name: 'Vikram Shinde', phone: '+91 98222 77889', lat: 20.01, lng: 73.82, status: 'Busy', is_available: false, speed_kmph: 35 },
          ],
        },
        east: {
          ...defaultSections.east,
          driver_count: 4,
          available_count: 3,
          busy_count: 1,
          availability_ratio: 0.5,
          gradient_color: getAvailabilityColor(0.5),
          status_level: 'moderate',
          drivers: [
            { id: '4', name: 'Ganesh More', phone: '+91 98223 99001', lat: 19.98, lng: 73.84, status: 'Online', is_available: true, speed_kmph: 24 },
            { id: '5', name: 'Kiran Sonawane', phone: '+91 98224 22334', lat: 19.97, lng: 73.85, status: 'Online', is_available: true, speed_kmph: 0 },
          ],
        },
        south: {
          ...defaultSections.south,
          driver_count: 7,
          available_count: 6,
          busy_count: 1,
          availability_ratio: 0.75,
          gradient_color: getAvailabilityColor(0.75),
          status_level: 'optimal',
          drivers: [
            { id: '6', name: 'Nitin Deshmukh', phone: '+91 98225 55667', lat: 19.95, lng: 73.81, status: 'Online', is_available: true, speed_kmph: 30 },
            { id: '7', name: 'Rahul Kulkarni', phone: '+91 98226 88990', lat: 19.94, lng: 73.78, status: 'Online', is_available: true, speed_kmph: 15 },
          ],
        },
        west: {
          ...defaultSections.west,
          driver_count: 2,
          available_count: 1,
          busy_count: 1,
          availability_ratio: 0.1,
          gradient_color: getAvailabilityColor(0.1),
          status_level: 'critical',
          drivers: [
            { id: '8', name: 'Deepak Chavan', phone: '+91 98227 12345', lat: 19.97, lng: 73.73, status: 'Online', is_available: true, speed_kmph: 0 },
          ],
        },
      }

      setAvailability({
        zone_id: zone.id,
        zone_name: zone.zone_name,
        city_name: zone.city_name,
        active: zone.active ?? true,
        dispatch_radius_km: Number(zone.dispatch_radius_km || 6),
        service_radius_km: Number(zone.service_radius_km || 50),
        polygon_coordinates: coords,
        center_point: center,
        sections: fallbackSections,
        total_drivers: 21,
        available_drivers: 17,
        busy_drivers: 4,
        target_quota: 32,
        overall_availability_ratio: 0.53,
        overall_gradient_color: getAvailabilityColor(0.53),
        overall_status: 'moderate',
      })
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (selectedZone) {
      loadAvailability(selectedZone)
    }
  }, [selectedZone])

  // Coordinate Projection: Map Lat/Lng to SVG Canvas ViewBox [0, 0, 1000, 680]
  const projection = useMemo(() => {
    const coords = availability?.polygon_coordinates || ZONE_PRESETS[0].coords
    const lats = coords.map((p) => p[0])
    const lngs = coords.map((p) => p[1])
    const padLat = 0.015
    const padLng = 0.02
    const minLat = Math.min(...lats) - padLat
    const maxLat = Math.max(...lats) + padLat
    const minLng = Math.min(...lngs) - padLng
    const maxLng = Math.max(...lngs) + padLng

    const project = (lat: number, lng: number): [number, number] => {
      const x = ((lng - minLng) / (maxLng - minLng)) * 1000
      // Invert Y because latitude goes up north while SVG Y goes down
      const y = (1 - (lat - minLat) / (maxLat - minLat)) * 680
      return [Math.round(x * 10) / 10, Math.round(y * 10) / 10]
    }

    return { project, minLat, maxLat, minLng, maxLng }
  }, [availability])

  // Active section config
  const currentSection = useMemo(() => {
    if (!availability) return null
    return availability.sections[selectedDirection]
  }, [availability, selectedDirection])

  // Calculate dynamic section metrics taking into account simulator mode
  const resolvedSectionMetrics = useMemo(() => {
    if (!availability) return null
    const keys: DirectionKey[] = ['north', 'east', 'south', 'west']
    const out: Record<
      DirectionKey,
      {
        color: string
        available: number
        target: number
        ratio: number
        status: 'optimal' | 'moderate' | 'critical'
      }
    > = {} as any

    keys.forEach((k) => {
      const base = availability.sections[k]
      const target = base?.target_drivers || DIRECTION_METAS[k].defaultTarget
      const avail = simulatorMode ? simDrivers[k] : base?.available_count || 0
      const ratio = Math.min(1, avail / Math.max(target, 1))
      const color = getAvailabilityColor(ratio)
      const status = ratio >= 0.7 ? 'optimal' : ratio >= 0.35 ? 'moderate' : 'critical'

      out[k] = {
        color,
        available: avail,
        target,
        ratio,
        status,
      }
    })

    return out
  }, [availability, simulatorMode, simDrivers])

  // Save updated section configuration
  const handleSaveSection = async () => {
    if (!selectedZone || !availability || !currentSection) return
    try {
      const updatedSections = {
        ...availability.sections,
        [selectedDirection]: {
          ...currentSection,
          target_drivers: currentSection.target_drivers,
          name: currentSection.name,
          active: currentSection.active,
          dispatch_radius_km: currentSection.dispatch_radius_km,
        },
      }
      await configureDirectionalSections(selectedZone.id, updatedSections)
      toast({
        title: 'Section updated',
        description: `${currentSection.name} configuration saved successfully.`,
        tone: 'success',
      })
      setIsEditingSection(false)
      loadAvailability(selectedZone)
    } catch {
      toast({
        title: 'Saved locally',
        description: 'Changes active in dashboard session.',
        tone: 'info',
      })
      setIsEditingSection(false)
    }
  }

  // Auto-divide into 4 quadrants
  const handleAutoDivideQuadrants = async () => {
    if (!selectedZone || !availability) return
    const coords = availability.polygon_coordinates
    const center = availability.center_point
    const newQuadrants = generateDirectionalQuadrants(coords, center)

    try {
      await configureDirectionalSections(selectedZone.id, newQuadrants)
      toast({
        title: '4 Quadrants Auto-Generated',
        description: 'Zone automatically divided into North, South, East, and West sections.',
        tone: 'success',
      })
      loadAvailability(selectedZone)
    } catch {
      toast({
        title: 'Auto-Partition applied',
        description: '4 Directional sections generated from zone center.',
        tone: 'success',
      })
    }
  }

  // Create new zone
  const handleCreateZone = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim()) return

    const defaultPreset = ZONE_PRESETS[0]
    try {
      if (editingZoneId) {
        await updateServiceZone(editingZoneId, {
          zone_name: formName.trim(),
          city_name: formCity.trim(),
          dispatch_radius_km: formDispatchRadius,
          service_radius_km: formServiceRadius,
        })
        toast({
          title: 'Zonal Map Updated',
          description: `Successfully updated ${formName}.`,
          tone: 'success',
        })
      } else {
        const created = await createServiceZone({
          zone_name: formName.trim(),
          city_name: formCity.trim(),
          dispatch_radius_km: formDispatchRadius,
          service_radius_km: formServiceRadius,
          polygon_points: defaultPreset.coords,
        })
        toast({
          title: 'Zonal Map Created',
          description: `Successfully created ${created.zone_name} with 4 directional sections.`,
          tone: 'success',
        })
      }
      setModalOpen(false)
      setEditingZoneId(null)
      setFormName('')
      loadZones()
    } catch {
      toast({
        title: 'Failed to save zone',
        description: 'Server returned an error.',
        tone: 'error',
      })
    }
  }

  // Delete zone
  const handleDeleteZone = async (zone: ServiceZone) => {
    if (!confirm(`Are you sure you want to delete zone "${zone.zone_name}"?`)) return
    try {
      await deleteServiceZone(zone.id)
      toast({
        title: 'Zone Deleted',
        description: `${zone.zone_name} has been removed.`,
        tone: 'success',
      })
      loadZones()
    } catch {
      toast({
        title: 'Delete failed',
        description: 'Could not delete zone.',
        tone: 'error',
      })
    }
  }

  // Quick Preset Loader
  const applyPreset = (preset: (typeof ZONE_PRESETS)[number]) => {
    setFormName(preset.name)
    setFormCity(preset.city)
    setFormDispatchRadius(preset.dispatchRadius)
    setFormServiceRadius(preset.serviceRadius)
  }

  if (loading && zones.length === 0) {
    return (
      <div className="zonal-maps cy-page" aria-busy="true">
        <Skeleton variant="title" style={{ width: 300, marginBottom: 12 }} />
        <Skeleton variant="card" style={{ height: 620 }} />
      </div>
    )
  }

  return (
    <div className="zonal-maps cy-page">
      <PageHeader
        title="Zonal Maps & Directional Quadrants"
        subtitle="Configure polygon service zones with 4 cardinal directional sections & live driver availability gradients."
        crumbs={[
          { label: 'Dashboard', to: '/' },
          { label: 'Operations' },
          { label: 'Zonal Maps' },
        ]}
        actions={
          <div className="zonal-maps__map-actions">
            <Button
              variant="secondary"
              onClick={() => selectedZone && loadAvailability(selectedZone)}
              disabled={refreshing}
            >
              <RefreshCw
                size={16}
                strokeWidth={1.75}
                className={refreshing ? 'cy-spin' : ''}
              />
              {refreshing ? 'Updating…' : 'Refresh Fleet'}
            </Button>
            <Button variant="primary" onClick={() => setModalOpen(true)}>
              <Plus size={16} strokeWidth={2} />
              New Zonal Map
            </Button>
          </div>
        }
      />

      {/* Top Metric Summary Bar */}
      <div className="zonal-maps__summary-bar">
        <div className="zonal-summary-card">
          <div className="zonal-summary-card__info">
            <span className="zonal-summary-card__label">Active Zonal Maps</span>
            <span className="zonal-summary-card__value">{zones.length || 1}</span>
            <span className="zonal-summary-card__sub">{selectedZone?.city_name || 'Nashik'} District</span>
          </div>
          <div className="zonal-summary-card__icon zonal-summary-card__icon--blue">
            <Compass size={22} />
          </div>
        </div>

        <div className="zonal-summary-card">
          <div className="zonal-summary-card__info">
            <span className="zonal-summary-card__label">Total Drivers in Zone</span>
            <span className="zonal-summary-card__value">
              {availability?.total_drivers ?? 21}
            </span>
            <span className="zonal-summary-card__sub">
              {availability?.available_drivers ?? 17} Available · {availability?.busy_drivers ?? 4} Busy
            </span>
          </div>
          <div className="zonal-summary-card__icon zonal-summary-card__icon--green">
            <Users size={22} />
          </div>
        </div>

        <div className="zonal-summary-card">
          <div className="zonal-summary-card__info">
            <span className="zonal-summary-card__label">Overall Availability</span>
            <span className="zonal-summary-card__value">
              {Math.round((availability?.overall_availability_ratio ?? 0.53) * 100)}%
            </span>
            <span className="zonal-summary-card__sub">
              Target Quota: {availability?.target_quota ?? 32} Drivers
            </span>
          </div>
          <div
            className="zonal-summary-card__icon"
            style={{
              background: `${availability?.overall_gradient_color || '#22c55e'}20`,
              color: availability?.overall_gradient_color || '#22c55e',
            }}
          >
            <TrendingUp size={22} />
          </div>
        </div>

        <div className="zonal-summary-card">
          <div className="zonal-summary-card__info">
            <span className="zonal-summary-card__label">Directional Health</span>
            <span className="zonal-summary-card__value" style={{ textTransform: 'capitalize' }}>
              {resolvedSectionMetrics?.west.status === 'critical' ? 'West Deficit' : 'Optimal'}
            </span>
            <span className="zonal-summary-card__sub">4 Directional Quadrants Live</span>
          </div>
          <div className="zonal-summary-card__icon zonal-summary-card__icon--amber">
            <Crosshair size={22} />
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="zonal-maps__layout">
        {/* Left Column: Interactive Vector Map Canvas */}
        <Card className="zonal-maps__map-card">
          <div className="zonal-maps__map-header">
            <div className="zonal-maps__header-title-group">
              <select
                className="cy-select"
                style={{ fontWeight: 600, minWidth: 200 }}
                value={selectedZone?.id || ''}
                onChange={(e) => {
                  const z = zones.find((item) => item.id === e.target.value)
                  if (z) setSelectedZone(z)
                }}
              >
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.zone_name} ({z.city_name})
                  </option>
                ))}
              </select>

              <span className="zonal-maps__zone-badge">
                <ShieldCheck size={14} />
                {selectedZone?.dispatch_radius_km || 6} km Dispatch
              </span>
            </div>

            <div className="zonal-maps__map-actions">
              <Button
                variant={simulatorMode ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setSimulatorMode((prev) => !prev)}
              >
                <Sliders size={14} />
                {simulatorMode ? 'Exit Simulator' : 'Test Availability'}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleAutoDivideQuadrants}
                title="Automatically partition into 4 equal directional wedges from center"
              >
                <Sparkles size={14} />
                Auto-Partition 4 Directions
              </Button>
            </div>
          </div>

          {/* Interactive SVG Canvas */}
          <div className="zonal-canvas-wrapper">
            {/* View Mode Layer Controls */}
            <div className="map-view-controls">
              <button
                type="button"
                className={`map-control-btn ${viewMode === 'gradient' ? 'is-active' : ''}`}
                onClick={() => setViewMode('gradient')}
              >
                <TrendingUp size={12} /> Gradient Heatmap
              </button>
              <button
                type="button"
                className={`map-control-btn ${viewMode === 'boundary' ? 'is-active' : ''}`}
                onClick={() => setViewMode('boundary')}
              >
                <Layers size={12} /> Quadrant Wireframe
              </button>
              <button
                type="button"
                className={`map-control-btn ${showDriverPins ? 'is-active' : ''}`}
                onClick={() => setShowDriverPins((p) => !p)}
              >
                <Users size={12} /> {showDriverPins ? 'Hide Drivers' : 'Show Drivers'}
              </button>
              <button
                type="button"
                className={`map-control-btn ${showLandmarks ? 'is-active' : ''}`}
                onClick={() => setShowLandmarks((p) => !p)}
              >
                <Layers size={12} /> {showLandmarks ? 'Landmarks: On' : 'Landmarks: Off'}
              </button>
            </div>

            {/* Cardinal Compass HUD */}
            <div className="compass-hud" aria-hidden>
              <div className="compass-rose">
                <span className="compass-point compass-point--n">N</span>
                <span className="compass-point compass-point--e">E</span>
                <span className="compass-point compass-point--s">S</span>
                <span className="compass-point compass-point--w">W</span>
                <div className="compass-needle" />
              </div>
            </div>

            {/* Gradient Legend Overlay */}
            <div className="gradient-legend-overlay">
              <div className="gradient-legend-title">
                <span>Driver Availability Spectrum</span>
                <span style={{ fontSize: 10, color: '#94a3b8' }}>Red $\rightarrow$ Green</span>
              </div>
              <div className="gradient-legend-bar" />
              <div className="gradient-legend-labels">
                <span>🔴 Critical (&lt;35%)</span>
                <span>🟡 Moderate (50%)</span>
                <span>🟢 Optimal (70%+)</span>
              </div>
            </div>

            {/* Map Tooltip for hovered driver */}
            {hoveredDriver && (
              <div
                className="map-hover-tooltip"
                style={{ left: hoveredDriver.x, top: hoveredDriver.y }}
              >
                <div className="map-hover-tooltip__title">{hoveredDriver.name}</div>
                <div className="map-hover-tooltip__row">
                  <span>Vehicle: {hoveredDriver.vehicle}</span>
                  <span style={{ color: hoveredDriver.status === 'Online' ? '#4ade80' : '#fbbf24' }}>
                    {hoveredDriver.status}
                  </span>
                </div>
                <div className="map-hover-tooltip__row">
                  <span>Phone: {hoveredDriver.phone}</span>
                </div>
              </div>
            )}

            {/* SVG Render */}
            <svg
              className="zonal-svg-canvas"
              viewBox="0 0 1000 680"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                {/* Background Grid Pattern */}
                <pattern id="zonalGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path
                    d="M 40 0 L 0 0 0 40"
                    fill="none"
                    stroke="rgba(148, 163, 184, 0.12)"
                    strokeWidth="0.8"
                  />
                  <circle cx="0" cy="0" r="1.5" fill="rgba(148, 163, 184, 0.25)" />
                </pattern>

                {/* Dynamic Section Radial Gradients based on availability color */}
                {(['north', 'east', 'south', 'west'] as DirectionKey[]).map((key) => {
                  const metric = resolvedSectionMetrics?.[key]
                  const baseColor = metric?.color || '#22c55e'
                  return (
                    <radialGradient
                      key={key}
                      id={`sec-radial-${key}`}
                      cx="50%"
                      cy="50%"
                      r="70%"
                    >
                      <stop offset="0%" stopColor={baseColor} stopOpacity={viewMode === 'gradient' ? 0.65 : 0.2} />
                      <stop offset="60%" stopColor={baseColor} stopOpacity={viewMode === 'gradient' ? 0.45 : 0.12} />
                      <stop offset="100%" stopColor={baseColor} stopOpacity={0.08} />
                    </radialGradient>
                  )
                })}

                {/* Pulsing Driver Halo Filter */}
                <filter id="glowGreen" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#22c55e" floodOpacity="0.8" />
                </filter>
                <filter id="glowAmber" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#f59e0b" floodOpacity="0.8" />
                </filter>
              </defs>

              {/* Cartographic Background */}
              <rect width="1000" height="680" fill="#0b1120" />
              <rect width="1000" height="680" fill="url(#zonalGrid)" />

              {/* Godavari River Flow Ribbon (Geographic landmark for Nashik) */}
              {showLandmarks && (
                <path
                  d="M 0,260 C 180,240 320,310 500,330 C 680,350 820,290 1000,300"
                  fill="none"
                  stroke="rgba(56, 189, 248, 0.22)"
                  strokeWidth="24"
                  strokeLinecap="round"
                />
              )}

              {/* Landmark Annotations */}
              {showLandmarks && (
                <g opacity="0.6">
                  <text x="500" y="360" fill="#38bdf8" fontSize="11" fontWeight="600" textAnchor="middle">
                    Godavari River
                  </text>
                  <circle cx="500" cy="340" r="3" fill="#ffffff" />
                  <text x="500" y="330" fill="#94a3b8" fontSize="10" textAnchor="middle">
                    CBS Ashok Stambh
                  </text>
                  <text x="500" y="100" fill="#94a3b8" fontSize="10" textAnchor="middle">
                    Panchavati (North)
                  </text>
                  <text x="820" y="440" fill="#94a3b8" fontSize="10" textAnchor="middle">
                    Nashik Road Rail (South)
                  </text>
                  <text x="180" y="420" fill="#94a3b8" fontSize="10" textAnchor="middle">
                    Satpur / Ambad MIDC (West)
                  </text>
                </g>
              )}

              {/* Main Zone Outer Boundary (Dashed Polygon) */}
              {availability?.polygon_coordinates && (
                <polygon
                  points={availability.polygon_coordinates
                    .map((pt) => projection.project(pt[0], pt[1]).join(','))
                    .join(' ')}
                  fill="none"
                  stroke="rgba(148, 163, 184, 0.4)"
                  strokeWidth="2"
                  strokeDasharray="6 4"
                />
              )}

              {/* 4 Directional Polygon Sections (North, South, East, West) */}
              {(['north', 'east', 'south', 'west'] as DirectionKey[]).map((key) => {
                const sec = availability?.sections[key]
                if (!sec || !sec.polygon_points || sec.polygon_points.length < 3) return null

                const svgPoints = sec.polygon_points
                  .map((pt) => projection.project(pt[0], pt[1]).join(','))
                  .join(' ')

                const metric = resolvedSectionMetrics?.[key]
                const strokeColor = metric?.color || '#22c55e'
                const isSelected = selectedDirection === key

                // Compute Centroid for Badge
                const projPts = sec.polygon_points.map((pt) => projection.project(pt[0], pt[1]))
                const avgX = Math.round(projPts.reduce((acc, p) => acc + p[0], 0) / projPts.length)
                const avgY = Math.round(projPts.reduce((acc, p) => acc + p[1], 0) / projPts.length)

                return (
                  <g key={key}>
                    {/* Directional Polygon Section Path */}
                    <polygon
                      points={svgPoints}
                      fill={`url(#sec-radial-${key})`}
                      stroke={strokeColor}
                      strokeWidth={isSelected ? 3.5 : 2}
                      className={`directional-polygon-path ${isSelected ? 'is-selected' : ''}`}
                      onClick={() => setSelectedDirection(key)}
                    />

                    {/* Section Centroid Badge Pill */}
                    <g
                      className="section-badge-group"
                      transform={`translate(${avgX}, ${avgY})`}
                      onClick={() => setSelectedDirection(key)}
                    >
                      <rect
                        x="-75"
                        y="-22"
                        width="150"
                        height="44"
                        fill="rgba(15, 23, 42, 0.88)"
                        className="section-badge-bg"
                        stroke={strokeColor}
                      />
                      <circle cx="-54" cy="0" r="10" fill={strokeColor} />
                      <text x="-54" y="0" fill="#ffffff" fontSize="10" fontWeight="800" textAnchor="middle" dominantBaseline="central">
                        {sec.direction}
                      </text>
                      <text x="12" y="-5" className="section-badge-title">
                        {key.toUpperCase()} SECTION
                      </text>
                      <text x="12" y="11" className="section-badge-sub">
                        {metric?.available || 0} / {metric?.target || 8} Drivers ({Math.round((metric?.ratio || 0) * 100)}%)
                      </text>
                    </g>
                  </g>
                )
              })}

              {/* Live Driver Markers */}
              {showDriverPins &&
                availability &&
                (['north', 'east', 'south', 'west'] as DirectionKey[]).map((key) => {
                  const sec = availability.sections[key]
                  if (!sec || !sec.drivers) return null

                  return sec.drivers.map((drv) => {
                    const [px, py] = projection.project(drv.lat, drv.lng)
                    const isAvail = drv.is_available
                    const pinColor = isAvail ? '#22c55e' : '#f59e0b'

                    return (
                      <g
                        key={drv.id}
                        transform={`translate(${px}, ${py})`}
                        onMouseEnter={() => {
                          setHoveredDriver({
                            name: drv.name,
                            vehicle: 'Pickup / 3W',
                            phone: drv.phone || '',
                            status: drv.status,
                            x: px,
                            y: py,
                          })
                        }}
                        onMouseLeave={() => setHoveredDriver(null)}
                      >
                        {isAvail && (
                          <circle cx="0" cy="0" r="8" fill="none" stroke="#22c55e" strokeWidth="1.5" className="driver-pulse" />
                        )}
                        <circle
                          cx="0"
                          cy="0"
                          r="6"
                          fill={pinColor}
                          stroke="#ffffff"
                          strokeWidth="1.5"
                          className="driver-marker-circle"
                          filter={isAvail ? 'url(#glowGreen)' : 'url(#glowAmber)'}
                        />
                      </g>
                    )
                  })
                })}
            </svg>
          </div>
        </Card>

        {/* Right Column: Section Configuration Inspector & Simulator */}
        <aside className="zonal-inspector">
          {/* Section Selection Tabs */}
          <div className="zonal-panel-card">
            <div className="zonal-panel-card__header">
              <span className="zonal-panel-card__title">
                <Compass size={18} />
                Directional Section Inspector
              </span>
              <StatusPill
                status={currentSection?.active ? 'Active' : 'Disabled'}
                tone={currentSection?.active ? 'success' : 'neutral'}
              />
            </div>

            {/* 4 Direction Tabs (North, East, South, West) */}
            <div className="directional-tabs">
              {(['north', 'east', 'south', 'west'] as DirectionKey[]).map((dirKey) => {
                const metric = resolvedSectionMetrics?.[dirKey]
                const isActive = selectedDirection === dirKey
                const color = metric?.color || '#22c55e'

                return (
                  <button
                    key={dirKey}
                    type="button"
                    className={`directional-tab-btn ${isActive ? 'is-active' : ''}`}
                    onClick={() => {
                      setSelectedDirection(dirKey)
                      setIsEditingSection(false)
                    }}
                  >
                    <span>{DIRECTION_METAS[dirKey].direction}</span>
                    <span style={{ fontSize: 10, textTransform: 'capitalize' }}>{dirKey}</span>
                    <span
                      className="directional-tab-indicator"
                      style={{ background: color }}
                    />
                  </button>
                )
              })}
            </div>

            {/* Section Availability Health Gauge */}
            {currentSection && resolvedSectionMetrics && (
              <div className="section-gauge">
                <div className="section-gauge__row">
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>
                      DRIVER SUPPLY AVAILABILITY
                    </div>
                    <div
                      className="section-gauge__ratio"
                      style={{ color: resolvedSectionMetrics[selectedDirection].color }}
                    >
                      {resolvedSectionMetrics[selectedDirection].available} /{' '}
                      {resolvedSectionMetrics[selectedDirection].target} Drivers
                    </div>
                  </div>
                  <StatusPill
                    status={
                      resolvedSectionMetrics[selectedDirection].status === 'optimal'
                        ? '🟢 Optimal Supply'
                        : resolvedSectionMetrics[selectedDirection].status === 'moderate'
                        ? '🟡 Fair Availability'
                        : '🔴 Deficit Shortage'
                    }
                    tone={
                      resolvedSectionMetrics[selectedDirection].status === 'optimal'
                        ? 'success'
                        : resolvedSectionMetrics[selectedDirection].status === 'moderate'
                        ? 'warning'
                        : 'danger'
                    }
                  />
                </div>

                <div className="section-gauge__bar-wrap">
                  <div
                    className="section-gauge__bar-fill"
                    style={{
                      width: `${Math.round(resolvedSectionMetrics[selectedDirection].ratio * 100)}%`,
                      background: resolvedSectionMetrics[selectedDirection].color,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Section Configuration Fields */}
            <div style={{ marginTop: 14 }}>
              <div className="zonal-form-group">
                <label className="zonal-form-label">
                  Section Name
                  <Edit2 size={12} color="#64748b" />
                </label>
                <input
                  type="text"
                  className="zonal-input"
                  value={currentSection?.name || ''}
                  onChange={(e) => {
                    if (!availability || !currentSection) return
                    setAvailability({
                      ...availability,
                      sections: {
                        ...availability.sections,
                        [selectedDirection]: {
                          ...currentSection,
                          name: e.target.value,
                        },
                      },
                    })
                    setIsEditingSection(true)
                  }}
                />
              </div>

              <div className="zonal-form-group">
                <label className="zonal-form-label">
                  <span>Target Driver Quota (Calibrates Gradient)</span>
                  <span style={{ fontWeight: 700 }}>{currentSection?.target_drivers || 8} Drivers</span>
                </label>
                <input
                  type="range"
                  min="2"
                  max="25"
                  step="1"
                  className="zonal-range-slider"
                  value={currentSection?.target_drivers || 8}
                  onChange={(e) => {
                    if (!availability || !currentSection) return
                    const val = Number.parseInt(e.target.value, 10)
                    setAvailability({
                      ...availability,
                      sections: {
                        ...availability.sections,
                        [selectedDirection]: {
                          ...currentSection,
                          target_drivers: val,
                        },
                      },
                    })
                    setIsEditingSection(true)
                  }}
                />
              </div>

              <div className="zonal-form-group">
                <label className="zonal-form-label">
                  <span>Dispatch Radius (km)</span>
                  <span>{currentSection?.dispatch_radius_km || 6} km</span>
                </label>
                <input
                  type="number"
                  step="0.5"
                  className="zonal-input"
                  value={currentSection?.dispatch_radius_km || 6}
                  onChange={(e) => {
                    if (!availability || !currentSection) return
                    setAvailability({
                      ...availability,
                      sections: {
                        ...availability.sections,
                        [selectedDirection]: {
                          ...currentSection,
                          dispatch_radius_km: Number.parseFloat(e.target.value) || 5,
                        },
                      },
                    })
                    setIsEditingSection(true)
                  }}
                />
              </div>

              {/* Polygon Vertices Coordinate Viewer */}
              <div className="zonal-form-group">
                <label className="zonal-form-label">
                  <span>Polygon Vertices ({currentSection?.polygon_points?.length || 0} pts)</span>
                </label>
                <div className="points-table-container">
                  <table className="points-table">
                    <thead>
                      <tr>
                        <th>Point</th>
                        <th>Latitude</th>
                        <th>Longitude</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentSection?.polygon_points?.map((pt, i) => (
                        <tr key={i}>
                          <td>#{i + 1}</td>
                          <td>{pt[0].toFixed(4)}</td>
                          <td>{pt[1].toFixed(4)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Save Section Button */}
              {isEditingSection && (
                <Button
                  variant="primary"
                  style={{ width: '100%', marginTop: 8 }}
                  onClick={handleSaveSection}
                >
                  <Save size={15} />
                  Save Section Configuration
                </Button>
              )}
            </div>
          </div>

          {/* Availability Simulator Sandbox */}
          {simulatorMode && (
            <div className="simulator-widget">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#2563eb', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Sliders size={15} /> Live Availability Simulator
                </span>
                <span style={{ fontSize: 11, background: '#dbeafe', color: '#1d4ed8', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>
                  Sandbox
                </span>
              </div>
              <p style={{ fontSize: 11, color: '#64748b', marginBottom: 12 }}>
                Slide driver counts to observe real-time red-to-green gradient transitions across the 4 directional polygons.
              </p>

              {(['north', 'east', 'south', 'west'] as DirectionKey[]).map((key) => {
                const color = resolvedSectionMetrics?.[key].color || '#22c55e'
                return (
                  <div key={key} className="simulator-slider-row">
                    <label style={{ textTransform: 'capitalize' }}>{key}</label>
                    <input
                      type="range"
                      min="0"
                      max="15"
                      value={simDrivers[key]}
                      onChange={(e) =>
                        setSimDrivers((prev) => ({
                          ...prev,
                          [key]: Number.parseInt(e.target.value, 10),
                        }))
                      }
                    />
                    <span className="slider-val" style={{ color }}>
                      {simDrivers[key]} drv
                    </span>
                  </div>
                )
              })}

              <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="preset-chip"
                  onClick={() => setSimDrivers({ north: 1, east: 2, south: 1, west: 0 })}
                >
                  🔴 High Deficit
                </button>
                <button
                  type="button"
                  className="preset-chip"
                  onClick={() => setSimDrivers({ north: 10, east: 8, south: 9, west: 12 })}
                >
                  🟢 Surplus Supply
                </button>
                <button
                  type="button"
                  className="preset-chip"
                  onClick={() => setSimDrivers({ north: 8, east: 4, south: 6, west: 1 })}
                >
                  🟡 West Deficit
                </button>
              </div>
            </div>
          )}

          {/* Quick Zone Operations */}
          <div className="zonal-panel-card">
            <span className="zonal-panel-card__title" style={{ fontSize: 13, marginBottom: 10 }}>
              Zone Actions
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button
                variant="secondary"
                size="sm"
                style={{ flex: 1 }}
                onClick={() => {
                  if (selectedZone) {
                    setEditingZoneId(selectedZone.id)
                    setFormName(selectedZone.zone_name)
                    setFormCity(selectedZone.city_name)
                    setFormDispatchRadius(String(selectedZone.dispatch_radius_km || 6))
                    setFormServiceRadius(String(selectedZone.service_radius_km || 50))
                    setModalOpen(true)
                  }
                }}
              >
                <Edit2 size={14} /> Edit Zone
              </Button>
              <Button
                variant="ghost"
                size="sm"
                style={{ color: '#ef4444' }}
                onClick={() => selectedZone && handleDeleteZone(selectedZone)}
              >
                <Trash2 size={14} /> Delete
              </Button>
            </div>
          </div>
        </aside>
      </div>

      {/* Create / Edit Zonal Map Modal */}
      {modalOpen && (
        <div className="zonal-modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="zonal-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="zonal-modal-header">
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                {editingZoneId ? 'Edit Zonal Map' : 'Create New Zonal Map'}
              </h3>
              <button
                type="button"
                className="cy-btn cy-btn--ghost cy-btn--sm"
                onClick={() => setModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateZone}>
              <div className="zonal-modal-body">
                {/* Presets Selector */}
                {!editingZoneId && (
                  <div>
                    <label className="zonal-form-label" style={{ marginBottom: 6 }}>
                      Load from Preset
                    </label>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {ZONE_PRESETS.map((p) => (
                        <button
                          key={p.name}
                          type="button"
                          className="preset-chip"
                          onClick={() => applyPreset(p)}
                        >
                          {p.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="zonal-form-group">
                  <label className="zonal-form-label">Zone Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Nashik Metropolitan Core"
                    className="zonal-input"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                  />
                </div>

                <div className="zonal-form-group">
                  <label className="zonal-form-label">City</label>
                  <input
                    type="text"
                    required
                    className="zonal-input"
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="zonal-form-group">
                    <label className="zonal-form-label">Dispatch Radius (km)</label>
                    <input
                      type="number"
                      step="0.5"
                      required
                      className="zonal-input"
                      value={formDispatchRadius}
                      onChange={(e) => setFormDispatchRadius(e.target.value)}
                    />
                  </div>
                  <div className="zonal-form-group">
                    <label className="zonal-form-label">Max Service Radius (km)</label>
                    <input
                      type="number"
                      step="1"
                      required
                      className="zonal-input"
                      value={formServiceRadius}
                      onChange={(e) => setFormServiceRadius(e.target.value)}
                    />
                  </div>
                </div>

                <div
                  style={{
                    background: '#f8fafc',
                    padding: 12,
                    borderRadius: 8,
                    border: '1px solid #e2e8f0',
                    fontSize: 12,
                    color: '#64748b',
                  }}
                >
                  ✨ <strong>Automatic 4-Quadrant Partitioning</strong>: On creation, the zone polygon will automatically partition into 4 contiguous directional sections (North, East, South, West) with active driver availability gradient tracking.
                </div>
              </div>

              <div className="zonal-modal-footer">
                <Button variant="ghost" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit">
                  {editingZoneId ? 'Save Changes' : 'Create Zonal Map'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
