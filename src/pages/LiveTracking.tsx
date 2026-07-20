import { useMemo, useState } from 'react'
import {
  Filter,
  MapPin,
  Navigation,
  Radio,
  RefreshCw,
  Signal,
  Battery,
  Gauge,
  Clock,
  Truck,
} from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { SidePanel } from '../components/ConfirmDialog'
import { useToast } from '../components/Toast'
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  Skeleton,
  StatusPill,
} from '../components/ui'
import { useAsyncData } from '../hooks/useAsyncData'
import {
  fetchLiveTracking,
  liveTrackingCities,
  liveTrackingStatuses,
  liveTrackingVehicles,
  type LiveDriver,
  type LiveDriverStatus,
} from '../data/liveTrackingData'
import './LiveTracking.css'

function statusColor(status: LiveDriverStatus) {
  if (status === 'Online') return 'var(--cy-success)'
  if (status === 'Busy') return 'var(--cy-warning)'
  return 'var(--cy-text-muted)'
}

function networkTone(network: string) {
  if (network === '5G') return 'var(--cy-success)'
  if (network === '4G') return 'var(--cy-info)'
  return 'var(--cy-danger)'
}

function LiveTrackingSkeleton() {
  return (
    <div className="live-tracking cy-page" aria-busy="true">
      <Skeleton variant="title" style={{ width: 280, marginBottom: 8 }} />
      <Skeleton variant="text" style={{ width: 420, marginBottom: 20 }} />
      <div className="live-tracking__layout">
        <Skeleton variant="card" className="live-tracking__map-skeleton" />
        <Skeleton variant="card" className="live-tracking__list-skeleton" />
      </div>
    </div>
  )
}

export default function LiveTracking() {
  const { data, loading, error } = useAsyncData(fetchLiveTracking, [])
  const { toast } = useToast()
  const [cityFilter, setCityFilter] = useState(liveTrackingCities[0])
  const [statusFilter, setStatusFilter] = useState<(typeof liveTrackingStatuses)[number]>('All Status')
  const [vehicleFilter, setVehicleFilter] = useState(liveTrackingVehicles[0])
  const [selected, setSelected] = useState<LiveDriver | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)

  const filtered = useMemo(() => {
    if (!data) return []
    return data.drivers.filter((driver) => {
      const matchesCity = cityFilter === 'All Cities' || driver.city === cityFilter
      const matchesStatus = statusFilter === 'All Status' || driver.status === statusFilter
      const matchesVehicle =
        vehicleFilter === 'All Vehicles' || driver.vehicleType === vehicleFilter
      return matchesCity && matchesStatus && matchesVehicle
    })
  }, [data, cityFilter, statusFilter, vehicleFilter])

  const activeTrips = useMemo(
    () => filtered.filter((d) => d.currentTrip),
    [filtered],
  )

  const openDriver = (driver: LiveDriver) => {
    setSelected(driver)
    setPanelOpen(true)
  }

  const handleRefresh = () => {
    toast({
      title: 'Map refreshed',
      description: `Live positions updated · ${filtered.length} drivers visible`,
      tone: 'success',
    })
  }

  if (loading) return <LiveTrackingSkeleton />

  if (error || !data) {
    return (
      <Card>
        <EmptyState
          icon={<Radio size={24} strokeWidth={1.75} />}
          title="Unable to load live tracking"
          description={error ?? 'Could not fetch driver locations.'}
          action={
            <Button variant="primary" onClick={() => window.location.reload()}>
              Retry
            </Button>
          }
        />
      </Card>
    )
  }

  return (
    <div className="live-tracking cy-page">
      <PageHeader
        title="Live Tracking"
        subtitle={`${data.onlineCount} drivers online · ${data.activeTrips} active trips · Updated ${data.lastUpdated}`}
        crumbs={[
          { label: 'Dashboard', to: '/' },
          { label: 'Operations' },
          { label: 'Live Tracking' },
        ]}
        actions={
          <Button variant="secondary" onClick={handleRefresh}>
            <RefreshCw size={16} strokeWidth={1.75} />
            Refresh
          </Button>
        }
      />

      <div className="cy-page__toolbar">
        <div className="cy-page__toolbar-left">
          <div className="cy-page__filters">
            <span className="cy-page__filters-label">
              <Filter size={14} strokeWidth={1.75} aria-hidden /> Filters
            </span>
            <select
              className="cy-select"
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              aria-label="Filter by city"
            >
              {liveTrackingCities.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
            <select
              className="cy-select"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as (typeof liveTrackingStatuses)[number])
              }
              aria-label="Filter by status"
            >
              {liveTrackingStatuses.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            <select
              className="cy-select"
              value={vehicleFilter}
              onChange={(e) => setVehicleFilter(e.target.value)}
              aria-label="Filter by vehicle"
            >
              {liveTrackingVehicles.map((vehicle) => (
                <option key={vehicle} value={vehicle}>{vehicle}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="cy-page__meta">
          <span>
            Showing <strong>{filtered.length}</strong> drivers on map
          </span>
        </div>
      </div>

      <div className="live-tracking__layout">
        <Card className="live-tracking__map-card">
          <CardHeader
            title="Fleet Map"
            subtitle="CSS map view — no external API"
            action={
              <div className="live-tracking__legend">
                <span><i className="live-tracking__dot live-tracking__dot--online" /> Online</span>
                <span><i className="live-tracking__dot live-tracking__dot--busy" /> Busy</span>
                <span><i className="live-tracking__dot live-tracking__dot--offline" /> Offline</span>
              </div>
            }
          />
          <CardBody className="live-tracking__map-body">
            <div className="live-map" role="img" aria-label="Live driver map">
              <svg className="live-map__svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
                <defs>
                  <pattern id="liveGrid" width="10" height="10" patternUnits="userSpaceOnUse">
                    <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(148,163,184,0.18)" strokeWidth="0.3" />
                  </pattern>
                  <linearGradient id="mapWater" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#dbeafe" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#eff6ff" stopOpacity="0.15" />
                  </linearGradient>
                </defs>
                <rect width="100" height="100" fill="url(#liveGrid)" />
                <rect width="100" height="100" fill="url(#mapWater)" />
                <path
                  d="M0,35 Q25,28 50,32 T100,30 L100,42 Q70,48 45,44 T0,46 Z"
                  fill="rgba(34,197,94,0.08)"
                  stroke="rgba(34,197,94,0.15)"
                  strokeWidth="0.4"
                />
                <path
                  d="M8,55 C20,50 35,58 50,54 S80,48 95,52 L95,68 C75,72 55,66 35,70 S15,74 8,68 Z"
                  fill="rgba(37,99,235,0.06)"
                  stroke="rgba(37,99,235,0.12)"
                  strokeWidth="0.4"
                />
                <path
                  d="M15,18 L28,22 L32,12 L45,16 L52,8 L68,14 L75,22 L88,18"
                  fill="none"
                  stroke="rgba(100,116,139,0.25)"
                  strokeWidth="0.6"
                  strokeDasharray="2 1.5"
                />
                <path
                  d="M12,78 L30,74 L42,82 L58,76 L72,84 L90,78"
                  fill="none"
                  stroke="rgba(100,116,139,0.2)"
                  strokeWidth="0.5"
                />
              </svg>

              {filtered.map((driver) => (
                <button
                  key={driver.id}
                  type="button"
                  className={`live-map__marker live-map__marker--${driver.status.toLowerCase()} ${selected?.id === driver.id ? 'is-selected' : ''}`}
                  style={{ left: `${driver.lng}%`, top: `${driver.lat}%` }}
                  onClick={() => openDriver(driver)}
                  aria-label={`${driver.name}, ${driver.status}`}
                >
                  <span className="live-map__marker-pulse" aria-hidden />
                  <span className="live-map__marker-dot" aria-hidden />
                  <span className="live-map__marker-label">{driver.initials}</span>

                  {selected?.id === driver.id ? (
                    <div
                      className="live-map__popup"
                      onClick={(e) => e.stopPropagation()}
                      role="dialog"
                      aria-label={`${driver.name} details`}
                    >
                      <div className="live-map__popup-header">
                        <div>
                          <strong>{driver.name}</strong>
                          <span>{driver.vehicleType} · {driver.vehicle}</span>
                        </div>
                        <StatusPill status={driver.status} tone={driver.status} />
                      </div>
                      <div className="live-map__popup-grid">
                        <div><Battery size={13} /> {driver.battery}%</div>
                        <div style={{ color: networkTone(driver.network) }}>
                          <Signal size={13} /> {driver.network}
                        </div>
                        <div><Gauge size={13} /> {driver.speed} km/h</div>
                        <div><Clock size={13} /> ETA {driver.eta}</div>
                      </div>
                      {driver.currentTrip && driver.route ? (
                        <div className="live-map__popup-trip">
                          <Navigation size={13} />
                          <div>
                            <span className="cy-table__mono">{driver.currentTrip}</span>
                            <span>{driver.route.pickup} → {driver.route.drop}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="live-map__popup-idle">Available — no active trip</div>
                      )}
                    </div>
                  ) : null}
                </button>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card className="live-tracking__trips-card">
          <CardHeader
            title="Active Trips"
            subtitle={`${activeTrips.length} in progress`}
          />
          <CardBody className="live-tracking__trips-body">
            {activeTrips.length === 0 ? (
              <EmptyState
                icon={<Truck size={22} strokeWidth={1.75} />}
                title="No active trips"
                description="No drivers on trip match your current filters."
              />
            ) : (
              <ul className="live-tracking__trip-list">
                {activeTrips.map((driver) => (
                  <li key={driver.id}>
                    <button
                      type="button"
                      className="live-tracking__trip-item"
                      onClick={() => openDriver(driver)}
                    >
                      <div className="live-tracking__trip-avatar" style={{ color: statusColor(driver.status) }}>
                        {driver.initials}
                      </div>
                      <div className="live-tracking__trip-content">
                        <div className="live-tracking__trip-row">
                          <span className="live-tracking__trip-name">{driver.name}</span>
                          <StatusPill status={driver.status} tone={driver.status} />
                        </div>
                        <span className="cy-table__mono">{driver.currentTrip}</span>
                        {driver.route ? (
                          <span className="live-tracking__trip-route">
                            <MapPin size={12} />
                            {driver.route.pickup} → {driver.route.drop}
                          </span>
                        ) : null}
                        <div className="live-tracking__trip-meta">
                          <span>{driver.speed} km/h</span>
                          <span>ETA {driver.eta}</span>
                          <span>{driver.city}</span>
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      <SidePanel
        open={panelOpen}
        title={selected?.name ?? 'Driver'}
        onClose={() => setPanelOpen(false)}
        width={420}
      >
        {selected ? (
          <div className="live-tracking__panel">
            <div className="live-tracking__panel-header">
              <div
                className="live-tracking__panel-avatar"
                style={{ color: statusColor(selected.status) }}
              >
                {selected.initials}
              </div>
              <div>
                <h3>{selected.name}</h3>
                <p>{selected.id} · {selected.phone}</p>
                <StatusPill status={selected.status} tone={selected.status} />
              </div>
            </div>

            <dl className="live-tracking__panel-dl">
              <div><dt>Vehicle</dt><dd>{selected.vehicleType} · {selected.vehicle}</dd></div>
              <div><dt>City</dt><dd>{selected.city}</dd></div>
              <div><dt>Speed</dt><dd>{selected.speed} km/h</dd></div>
              <div><dt>ETA</dt><dd>{selected.eta}</dd></div>
              <div><dt>Battery</dt><dd>{selected.battery}%</dd></div>
              <div><dt>Network</dt><dd>{selected.network}</dd></div>
              <div><dt>Position</dt><dd>{selected.lat.toFixed(0)}% N · {selected.lng.toFixed(0)}% E</dd></div>
            </dl>

            {selected.currentTrip && selected.route ? (
              <div className="live-tracking__panel-trip">
                <h4>Current Trip</h4>
                <p className="cy-table__mono">{selected.currentTrip}</p>
                <p><strong>Pickup:</strong> {selected.route.pickup}</p>
                <p><strong>Drop:</strong> {selected.route.drop}</p>
              </div>
            ) : (
              <p className="live-tracking__panel-idle">Driver is online and available for dispatch.</p>
            )}

            <Button
              variant="primary"
              onClick={() =>
                toast({
                  title: 'Ping sent',
                  description: `Location request sent to ${selected.name}`,
                  tone: 'info',
                })
              }
            >
              Request Location Update
            </Button>
          </div>
        ) : null}
      </SidePanel>
    </div>
  )
}
