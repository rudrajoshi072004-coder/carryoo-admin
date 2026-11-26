import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Filter,
  MapPin,
  Radio,
  RefreshCw,
  Truck,
  ExternalLink,
} from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { useAdminLanguage } from '../i18n/LanguageContext'
import { SidePanel } from '../components/ConfirmDialog'
import LiveMap from '../components/LiveMap'
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
import { customerVehicleLabel, matchesCustomerVehicleFilter, type CustomerAppVehicleFilter } from '../lib/customerVehicles'
import { formatCoords, googleMapsUrl } from '../lib/geo'
import {
  fetchLiveTracking,
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
  const { t } = useAdminLanguage()
  const [params, setParams] = useSearchParams()
  const { data, loading, error, refetch } = useAsyncData(fetchLiveTracking, [])
  const [statusFilter, setStatusFilter] = useState<'Active now' | 'Online' | 'Busy' | 'All Status'>(
    params.get('filter') === 'active' ? 'Active now' : 'Active now',
  )
  const [vehicleFilter, setVehicleFilter] = useState<CustomerAppVehicleFilter>(liveTrackingVehicles[0])
  const [selected, setSelected] = useState<LiveDriver | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)

  useEffect(() => {
    const timer = window.setInterval(() => {
      refetch()
    }, 12000)
    return () => window.clearInterval(timer)
  }, [refetch])

  useEffect(() => {
    if (!data) return
    const focusId = params.get('driver')
    if (focusId) {
      const match = data.drivers.find((driver) => driver.id === focusId)
      if (match) {
        setSelected(match)
        setPanelOpen(true)
        return
      }
    }
    if (selected) {
      const next = data.drivers.find((driver) => driver.id === selected.id)
      if (next) setSelected(next)
    }
  }, [data, params])

  const filtered = useMemo(() => {
    if (!data) return []
    return data.drivers.filter((driver) => {
      const matchesStatus =
        statusFilter === 'All Status' ||
        (statusFilter === 'Active now' && (driver.status === 'Online' || driver.status === 'Busy')) ||
        driver.status === statusFilter
      const matchesVehicle = matchesCustomerVehicleFilter(driver.vehicleType, vehicleFilter)
      return matchesStatus && matchesVehicle
    })
  }, [data, statusFilter, vehicleFilter])

  const openDriver = (driver: LiveDriver) => {
    setSelected(driver)
    setPanelOpen(true)
    const next = new URLSearchParams(params)
    next.set('driver', driver.id)
    next.set('filter', 'active')
    setParams(next, { replace: true })
  }

  if (loading && !data) return <LiveTrackingSkeleton />

  if ((error || !data) && !loading) {
    return (
      <Card>
        <EmptyState
          icon={<Radio size={24} strokeWidth={1.75} />}
          title="Unable to load live tracking"
          description={error ?? 'Could not fetch driver locations.'}
          action={
            <Button variant="primary" onClick={refetch}>
              Retry
            </Button>
          }
        />
      </Card>
    )
  }

  const live = data!

  return (
    <div className="live-tracking cy-page">
      <PageHeader
        title={t('pages.live.title')}
        subtitle={`${live.onlineCount} drivers active now · ${live.drivers.filter((d) => d.hasLocation).length} with GPS · Updated ${live.lastUpdated}`}
        crumbs={[
          { label: 'Dashboard', to: '/' },
          { label: 'Operations' },
          { label: 'Live Tracking' },
        ]}
        actions={
          <Button variant="secondary" onClick={refetch}>
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
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as typeof statusFilter)
              }
              aria-label="Filter by status"
            >
              {['Active now', 'Online', 'Busy', 'All Status'].map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            <select
              className="cy-select"
              value={vehicleFilter}
              onChange={(e) => setVehicleFilter(e.target.value as CustomerAppVehicleFilter)}
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
            Showing <strong>{filtered.length}</strong> active drivers
          </span>
        </div>
      </div>

      <div className="live-tracking__layout">
        <Card className="live-tracking__map-card">
          <CardHeader
            title="Live map"
            subtitle={selected ? `${selected.name} · ${selected.hasLocation ? 'GPS lock' : 'Waiting for GPS'}` : 'OpenStreetMap · live GPS'}
            action={
              <div className="live-tracking__legend">
                <span><i className="live-tracking__dot live-tracking__dot--online" /> Online</span>
                <span><i className="live-tracking__dot live-tracking__dot--busy" /> Busy</span>
              </div>
            }
          />
          <CardBody className="live-tracking__map-body">
            <LiveMap
              drivers={filtered}
              selectedId={selected?.id ?? null}
              onSelect={openDriver}
            />
          </CardBody>
        </Card>

        <Card className="live-tracking__trips-card">
          <CardHeader
            title="Active now"
            subtitle={`${filtered.length} drivers`}
          />
          <CardBody className="live-tracking__trips-body">
            {filtered.length === 0 ? (
              <EmptyState
                icon={<Truck size={22} strokeWidth={1.75} />}
                title="No active drivers"
                description="Drivers appear here when they go online or start a trip."
              />
            ) : (
              <ul className="live-tracking__trip-list">
                {filtered.map((driver) => (
                  <li key={driver.id}>
                    <button
                      type="button"
                      className={`live-tracking__trip-item ${selected?.id === driver.id ? 'is-selected' : ''}`}
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
                        <span className="cy-table__mono">{driver.vehicle} · {customerVehicleLabel(driver.vehicleType)}</span>
                        {driver.route ? (
                          <span className="live-tracking__trip-route">
                            <MapPin size={12} />
                            {driver.route.pickup} → {driver.route.drop}
                          </span>
                        ) : null}
                        <div className="live-tracking__trip-meta">
                          <span>{driver.hasLocation ? 'GPS live' : 'No GPS yet'}</span>
                          <span>{driver.speed} km/h</span>
                          {driver.eta !== '—' ? <span>ETA {driver.eta}</span> : null}
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
                <p>{selected.phone || '—'} · {selected.city}</p>
                <StatusPill status={selected.status} tone={selected.status} />
              </div>
            </div>

            <dl className="live-tracking__panel-dl">
              <div><dt>Vehicle</dt><dd>{customerVehicleLabel(selected.vehicleType)} · {selected.vehicle}</dd></div>
              <div><dt>Speed</dt><dd>{selected.speed} km/h</dd></div>
              <div><dt>ETA</dt><dd>{selected.eta}</dd></div>
              <div>
                <dt>GPS</dt>
                <dd>
                  {selected.hasLocation
                    ? formatCoords(selected.lat, selected.lng)
                    : 'Not sharing location yet'}
                </dd>
              </div>
            </dl>

            {selected.currentTrip && selected.route ? (
              <div className="live-tracking__panel-trip">
                <h4>Current trip</h4>
                <p className="cy-table__mono">{selected.currentTrip}</p>
                <p><strong>Pickup:</strong> {selected.route.pickup}</p>
                <p><strong>Drop:</strong> {selected.route.drop}</p>
              </div>
            ) : (
              <p className="live-tracking__panel-idle">Driver is online and available for dispatch.</p>
            )}

            {selected.hasLocation ? (
              <a
                className="cy-btn cy-btn--primary"
                href={googleMapsUrl(selected.lat, selected.lng)}
                target="_blank"
                rel="noreferrer"
              >
                <ExternalLink size={16} strokeWidth={1.75} />
                Open in Google Maps
              </a>
            ) : (
              <p className="live-tracking__panel-idle">
                Live map pin appears as soon as this driver sends GPS.
              </p>
            )}
          </div>
        ) : null}
      </SidePanel>
    </div>
  )
}
