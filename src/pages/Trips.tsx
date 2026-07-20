import { useMemo, useState } from 'react'
import {
  Download,
  Eye,
  MoreHorizontal,
  Filter,
  Route,
  MapPin,
  Clock,
  Car,
  UserRound,
} from 'lucide-react'
import { SidePanel } from '../components/ConfirmDialog'
import { PageHeader, Pagination } from '../components/PageHeader'
import { useToast } from '../components/Toast'
import {
  Button,
  Card,
  CardBody,
  EmptyState,
  SearchInput,
  Skeleton,
  StatusPill,
} from '../components/ui'
import { useAsyncData } from '../hooks/useAsyncData'
import { formatINR, exportCsv, paginate } from '../lib/utils'
import { fetchTripsAdmin } from '../api/services/adminData'
import {
  tripStatuses,
  tripCities,
  tripVehicleTypes,
  type Trip,
  type TripStatus,
} from '../data/tripsData'
import './Trips.css'

const PAGE_SIZE = 8

const statusTone: Record<TripStatus, string> = {
  Scheduled: 'pending',
  Running: 'in-progress',
  Completed: 'completed',
  Cancelled: 'cancelled',
}

async function fetchTrips() {
  return fetchTripsAdmin()
}

function TripsSkeleton() {
  return (
    <div className="trips-page cy-page" aria-busy="true">
      <Skeleton variant="title" style={{ width: 180, height: 28, marginBottom: 8 }} />
      <Skeleton variant="text" style={{ width: 300, marginBottom: 20 }} />
      <div className="cy-table-card">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="cy-skeleton--row">
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Skeleton variant="title" style={{ width: '22%' }} />
              <Skeleton variant="text" style={{ width: '70%' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function TripPanel({ trip }: { trip: Trip }) {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 4 }}>
        <div>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--cy-text)' }}>{trip.id}</p>
          <p style={{ margin: '2px 0 0', fontSize: 12.5, color: 'var(--cy-text-muted)' }}>{trip.orderId}</p>
        </div>
        <StatusPill status={trip.status} tone={statusTone[trip.status]} />
      </div>

      <Card>
        <CardBody>
          <section className="panel-section">
            <h3 className="panel-section__title">
              <Route size={15} strokeWidth={1.75} /> Trip Details
            </h3>
            <div className="trip-detail-grid">
              <div className="trip-detail-field">
                <span className="trip-detail-field__label">Route</span>
                <span className="trip-detail-field__value">{trip.route}</span>
              </div>
              <div className="trip-detail-field">
                <span className="trip-detail-field__label">City</span>
                <span className="trip-detail-field__value">
                  <MapPin size={13} strokeWidth={1.75} /> {trip.city}
                </span>
              </div>
              <div className="trip-detail-field trip-detail-field--full">
                <span className="trip-detail-field__label">Pickup</span>
                <span className="trip-detail-field__value">{trip.pickup}</span>
              </div>
              <div className="trip-detail-field trip-detail-field--full">
                <span className="trip-detail-field__label">Drop</span>
                <span className="trip-detail-field__value">{trip.drop}</span>
              </div>
              <div className="trip-detail-field">
                <span className="trip-detail-field__label">Distance</span>
                <span className="trip-detail-field__value">{trip.distance}</span>
              </div>
              <div className="trip-detail-field">
                <span className="trip-detail-field__label">Fare</span>
                <span className="trip-detail-field__value">{formatINR(trip.fare)}</span>
              </div>
              <div className="trip-detail-field">
                <span className="trip-detail-field__label">Duration</span>
                <span className="trip-detail-field__value">
                  <Clock size={13} strokeWidth={1.75} /> {trip.duration}
                </span>
              </div>
              <div className="trip-detail-field">
                <span className="trip-detail-field__label">Started</span>
                <span className="trip-detail-field__value">{trip.started}</span>
              </div>
            </div>
            {trip.notes ? <p className="trip-notes" style={{ marginTop: 12 }}>{trip.notes}</p> : null}
          </section>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <section className="panel-section">
            <h3 className="panel-section__title">
              <UserRound size={15} strokeWidth={1.75} /> Driver & Customer
            </h3>
            <div className="trip-detail-grid">
              <div className="trip-detail-field">
                <span className="trip-detail-field__label">Driver</span>
                <span className="trip-detail-field__value">{trip.driver}</span>
              </div>
              <div className="trip-detail-field">
                <span className="trip-detail-field__label">Driver ID</span>
                <span className="trip-detail-field__value">{trip.driverId}</span>
              </div>
              <div className="trip-detail-field">
                <span className="trip-detail-field__label">Customer</span>
                <span className="trip-detail-field__value">{trip.customer}</span>
              </div>
              <div className="trip-detail-field">
                <span className="trip-detail-field__label">Customer Phone</span>
                <span className="trip-detail-field__value">{trip.customerPhone}</span>
              </div>
            </div>
          </section>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <section className="panel-section">
            <h3 className="panel-section__title">
              <Car size={15} strokeWidth={1.75} /> Vehicle
            </h3>
            <div className="trip-detail-grid">
              <div className="trip-detail-field">
                <span className="trip-detail-field__label">Type</span>
                <span className="trip-detail-field__value">{trip.vehicleType}</span>
              </div>
              <div className="trip-detail-field">
                <span className="trip-detail-field__label">Plate</span>
                <span className="trip-detail-field__value">{trip.vehicle}</span>
              </div>
            </div>
          </section>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <section className="panel-section">
            <h3 className="panel-section__title">
              <Clock size={15} strokeWidth={1.75} /> Trip Timeline
            </h3>
            <ul className="trip-timeline">
              {trip.timeline.map((event, i) => (
                <li
                  key={i}
                  className={`trip-timeline__item ${event.done ? 'is-done' : ''}`}
                >
                  <span className="trip-timeline__dot" aria-hidden />
                  <div className="trip-timeline__content">
                    <p className="trip-timeline__label">{event.label}</p>
                    <p className="trip-timeline__time">{event.time}</p>
                    {event.detail ? (
                      <p className="trip-timeline__detail">{event.detail}</p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </CardBody>
      </Card>
    </>
  )
}

export default function Trips() {
  const { toast } = useToast()
  const { data: trips, loading, error } = useAsyncData(fetchTrips, [])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<(typeof tripStatuses)[number]>('All Status')
  const [cityFilter, setCityFilter] = useState<(typeof tripCities)[number]>(tripCities[0])
  const [vehicleFilter, setVehicleFilter] = useState<(typeof tripVehicleTypes)[number]>(tripVehicleTypes[0])
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Trip | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)

  const filtered = useMemo(() => {
    if (!trips) return []
    const q = search.trim().toLowerCase()
    return trips.filter((trip) => {
      const matchesSearch =
        !q ||
        trip.id.toLowerCase().includes(q) ||
        trip.orderId.toLowerCase().includes(q) ||
        trip.driver.toLowerCase().includes(q) ||
        trip.customer.toLowerCase().includes(q) ||
        trip.route.toLowerCase().includes(q) ||
        trip.vehicle.toLowerCase().includes(q)

      const matchesStatus =
        statusFilter === 'All Status' || trip.status === statusFilter
      const matchesCity = cityFilter === 'All Cities' || trip.city === cityFilter
      const matchesVehicle =
        vehicleFilter === 'All Vehicles' || trip.vehicleType === vehicleFilter

      return matchesSearch && matchesStatus && matchesCity && matchesVehicle
    })
  }, [trips, search, statusFilter, cityFilter, vehicleFilter])

  const paged = useMemo(
    () => paginate(filtered, page, PAGE_SIZE),
    [filtered, page],
  )

  const openTrip = (trip: Trip) => {
    setSelected(trip)
    setPanelOpen(true)
  }

  const handleExport = () => {
    exportCsv(
      'carryoo-trips.csv',
      [
        'Trip ID', 'Order ID', 'Driver', 'Customer', 'Route', 'Vehicle',
        'Distance', 'Fare', 'Status', 'Duration', 'Started', 'City',
      ],
      filtered.map((t) => [
        t.id, t.orderId, t.driver, t.customer, t.route,
        `${t.vehicleType} · ${t.vehicle}`, t.distance, t.fare,
        t.status, t.duration, t.started, t.city,
      ]),
    )
    toast({ title: 'Export complete', description: `${filtered.length} trips exported.`, tone: 'success' })
  }

  const clearFilters = () => {
    setSearch('')
    setStatusFilter('All Status')
    setCityFilter('All Cities')
    setVehicleFilter('All Vehicles')
    setPage(1)
  }

  if (loading) return <TripsSkeleton />

  if (error || !trips) {
    return (
      <div className="cy-table-card">
        <EmptyState
          icon={<Route size={24} strokeWidth={1.75} />}
          title="Unable to load trips"
          description={error ?? 'Could not fetch trip history.'}
          action={
            <Button variant="primary" onClick={() => window.location.reload()}>
              Retry
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div className="trips-page cy-page">
      <PageHeader
        title="Trips"
        subtitle="Monitor trip history, active routes, and delivery timelines."
        crumbs={[
          { label: 'Home', to: '/' },
          { label: 'Trips' },
        ]}
      />

      <div className="cy-page__toolbar">
        <div className="cy-page__toolbar-left">
          <SearchInput
            value={search}
            onChange={(v) => {
              setSearch(v)
              setPage(1)
            }}
            placeholder="Search trips, orders, drivers, routes…"
            className="trips-search"
            aria-label="Search trips"
          />

          <div className="cy-page__filters">
            <span className="cy-page__filters-label">
              <Filter size={14} strokeWidth={1.75} aria-hidden /> Filters
            </span>
            <select
              className="cy-select"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as (typeof tripStatuses)[number])
                setPage(1)
              }}
              aria-label="Filter by status"
            >
              {tripStatuses.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            <select
              className="cy-select"
              value={cityFilter}
              onChange={(e) => {
                setCityFilter(e.target.value as (typeof tripCities)[number])
                setPage(1)
              }}
              aria-label="Filter by city"
            >
              {tripCities.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
            <select
              className="cy-select"
              value={vehicleFilter}
              onChange={(e) => {
                setVehicleFilter(e.target.value as (typeof tripVehicleTypes)[number])
                setPage(1)
              }}
              aria-label="Filter by vehicle"
            >
              {tripVehicleTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="cy-page__toolbar-right">
          <Button variant="secondary" onClick={handleExport}>
            <Download size={16} strokeWidth={1.75} />
            Export
          </Button>
        </div>
      </div>

      <div className="cy-page__meta">
        <span>
          Showing <strong>{paged.items.length}</strong> of {filtered.length} trips
          {filtered.length !== trips.length ? ` (${trips.length} total)` : ''}
        </span>
      </div>

      <div className="cy-table-card">
        {filtered.length === 0 ? (
          <EmptyState
            icon={<Route size={24} strokeWidth={1.75} />}
            title="No trips found"
            description="No trips match your search or filters. Clear filters to see all trips."
            action={
              <Button variant="secondary" onClick={clearFilters}>
                Clear filters
              </Button>
            }
          />
        ) : (
          <div className="cy-table-wrap">
            <table className="cy-table trips-table">
              <thead>
                <tr>
                  <th>Trip ID</th>
                  <th>Order ID</th>
                  <th>Driver</th>
                  <th>Customer</th>
                  <th>Route</th>
                  <th>Vehicle</th>
                  <th>Distance</th>
                  <th>Fare</th>
                  <th>Status</th>
                  <th>Duration</th>
                  <th>Started</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paged.items.map((trip) => (
                  <tr
                    key={trip.id}
                    className="cy-table__row"
                    onClick={() => openTrip(trip)}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        openTrip(trip)
                      }
                    }}
                  >
                    <td className="cy-table__mono cy-table__link">{trip.id}</td>
                    <td className="cy-table__mono">{trip.orderId}</td>
                    <td>
                      <div className="cy-table__primary">{trip.driver}</div>
                      <div className="cy-table__secondary">{trip.driverId}</div>
                    </td>
                    <td>
                      <div className="cy-table__primary">{trip.customer}</div>
                      <div className="cy-table__secondary">{trip.city}</div>
                    </td>
                    <td>
                      <div className="cy-table__primary trips-route">{trip.route}</div>
                    </td>
                    <td>
                      <div className="cy-table__primary">{trip.vehicleType}</div>
                      <div className="cy-table__secondary">{trip.vehicle}</div>
                    </td>
                    <td className="cy-table__mono">{trip.distance}</td>
                    <td className="cy-table__mono trips-fare">{formatINR(trip.fare)}</td>
                    <td>
                      <StatusPill status={trip.status} tone={statusTone[trip.status]} />
                    </td>
                    <td className="trips-duration">{trip.duration}</td>
                    <td>{trip.started}</td>
                    <td>
                      <div className="cy-actions" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className="cy-action-btn"
                          title="View trip"
                          aria-label={`View ${trip.id}`}
                          onClick={() => openTrip(trip)}
                        >
                          <Eye size={15} strokeWidth={1.75} />
                        </button>
                        <button
                          type="button"
                          className="cy-action-btn"
                          title="More actions"
                          aria-label={`More actions for ${trip.id}`}
                        >
                          <MoreHorizontal size={15} strokeWidth={1.75} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {filtered.length > 0 ? (
        <Pagination
          page={paged.page}
          totalPages={paged.totalPages}
          total={paged.total}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      ) : null}

      <SidePanel
        open={panelOpen}
        title={selected ? selected.id : 'Trip'}
        onClose={() => setPanelOpen(false)}
        width={520}
      >
        {selected ? <TripPanel trip={selected} /> : null}
      </SidePanel>
    </div>
  )
}
