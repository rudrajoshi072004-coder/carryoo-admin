import { useMemo, useState } from 'react'
import {
  Plus,
  Download,
  RefreshCw,
  Star,
  MoreHorizontal,
  Eye,
  Filter,
  Users,
} from 'lucide-react'
import DriverDrawer from '../components/DriverDrawer'
import { PageHeader } from '../components/PageHeader'
import {
  Button,
  EmptyState,
  SearchInput,
  Skeleton,
  StatusPill,
} from '../components/ui'
import { useAsyncData } from '../hooks/useAsyncData'
import { fetchDriversAdmin } from '../api/services/adminData'
import { updatePortalDriver } from '../api/services/portal'
import { useToast } from '../components/Toast'
import {
  driverCities,
  driverStatuses,
  vehicleTypes,
  type Driver,
  type DriverStatus,
} from '../data/driversData'
import './Drivers.css'

function formatWallet(amount: number) {
  return `₹${amount.toLocaleString('en-IN')}`
}

async function fetchDrivers() {
  return fetchDriversAdmin()
}

function DriversSkeleton() {
  return (
    <div className="cy-page" aria-busy="true">
      <div className="cy-table-card">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="cy-skeleton--row">
            <Skeleton variant="avatar" />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Skeleton variant="title" style={{ width: '30%' }} />
              <Skeleton variant="text" style={{ width: '55%' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Drivers() {
  const { toast } = useToast()
  const { data: drivers, loading, error, refetch } = useAsyncData(fetchDrivers, [])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<(typeof driverStatuses)[number]>('All Status')
  const [cityFilter, setCityFilter] = useState(driverCities[0])
  const [vehicleFilter, setVehicleFilter] = useState(vehicleTypes[0])
  const [selected, setSelected] = useState<Driver | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const filtered = useMemo(() => {
    if (!drivers) return []
    const q = search.trim().toLowerCase()
    return drivers.filter((driver) => {
      const matchesSearch =
        !q ||
        driver.name.toLowerCase().includes(q) ||
        driver.id.toLowerCase().includes(q) ||
        (driver.phone ?? '').toLowerCase().includes(q) ||
        driver.city.toLowerCase().includes(q) ||
        (driver.vehicle ?? '').toLowerCase().includes(q)

      const matchesStatus =
        statusFilter === 'All Status' || driver.status === statusFilter
      const matchesCity =
        cityFilter === 'All Cities' || driver.city === cityFilter
      const matchesVehicle =
        vehicleFilter === 'All Vehicles' || driver.vehicleType === vehicleFilter

      return matchesSearch && matchesStatus && matchesCity && matchesVehicle
    })
  }, [drivers, search, statusFilter, cityFilter, vehicleFilter])

  const openDriver = (driver: Driver) => {
    setSelected(driver)
    setDrawerOpen(true)
  }

  const [approvingId, setApprovingId] = useState<string | null>(null)

  const approveDriverKyc = async (driver: Driver) => {
    setApprovingId(driver.id)
    try {
      await updatePortalDriver(driver.id, { kyc_status: 'approved' })
      toast({
        title: 'KYC approved',
        description: `${driver.name} can now receive delivery requests.`,
      })
      refetch()
    } catch (err) {
      toast({
        title: 'Could not approve KYC',
        description: err instanceof Error ? err.message : 'Deploy admin portal PATCH endpoint first.',
        tone: 'danger',
      })
    } finally {
      setApprovingId(null)
    }
  }

  const handleExport = () => {
    const headers = [
      'Driver ID', 'Name', 'Phone', 'Vehicle', 'City', 'Rating', 'Wallet', 'Status', 'Trips', 'Joined',
    ]
    const rows = filtered.map((d) => [
      d.id, d.name, d.phone, d.vehicle, d.city, d.rating, d.wallet, d.status, d.trips, d.joined,
    ])
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'carryoo-drivers.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return <DriversSkeleton />

  if (error || !drivers) {
    return (
      <div className="cy-table-card">
        <EmptyState
          icon={<Users size={24} strokeWidth={1.75} />}
          title="Unable to load drivers"
          description={error ?? 'Could not fetch the driver directory.'}
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
    <div className="drivers-page cy-page">
      <PageHeader
        title="Drivers"
        subtitle="Manage fleet partners, documents, earnings, and live availability."
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Drivers' }]}
      />
      <div className="cy-page__toolbar">
        <div className="cy-page__toolbar-left">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by name, ID, phone, city…"
            className="drivers-search"
            aria-label="Search drivers"
          />

          <div className="cy-page__filters">
            <span className="cy-page__filters-label">
              <Filter size={14} strokeWidth={1.75} aria-hidden /> Filters
            </span>
            <select
              className="cy-select"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as (typeof driverStatuses)[number])
              }
              aria-label="Filter by status"
            >
              {driverStatuses.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            <select
              className="cy-select"
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              aria-label="Filter by city"
            >
              {driverCities.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
            <select
              className="cy-select"
              value={vehicleFilter}
              onChange={(e) => setVehicleFilter(e.target.value)}
              aria-label="Filter by vehicle"
            >
              {vehicleTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="cy-page__toolbar-right">
          <Button variant="secondary" onClick={() => refetch()} disabled={loading}>
            <RefreshCw size={16} strokeWidth={1.75} />
            Refresh
          </Button>
          <Button variant="secondary" onClick={handleExport}>
            <Download size={16} strokeWidth={1.75} />
            Export
          </Button>
          <Button variant="primary">
            <Plus size={16} strokeWidth={1.75} />
            Add Driver
          </Button>
        </div>
      </div>

      <div className="cy-page__meta">
        <span>
          Showing <strong>{filtered.length}</strong> of {drivers.length} drivers
        </span>
      </div>

      <div className="cy-table-card">
        {filtered.length === 0 ? (
          <EmptyState
            icon={<Users size={24} strokeWidth={1.75} />}
            title="No drivers found"
            description="Try adjusting search or filters to find drivers in your fleet."
            action={
              <Button
                variant="secondary"
                onClick={() => {
                  setSearch('')
                  setStatusFilter('All Status')
                  setCityFilter('All Cities')
                  setVehicleFilter('All Vehicles')
                }}
              >
                Clear filters
              </Button>
            }
          />
        ) : (
          <div className="cy-table-wrap">
            <table className="cy-table drivers-table">
              <thead>
                <tr>
                  <th>Driver</th>
                  <th>Driver ID</th>
                  <th>Phone</th>
                  <th>Vehicle</th>
                  <th>City</th>
                  <th>Rating</th>
                  <th>Wallet</th>
                  <th>Today's Earnings</th>
                  <th>Status</th>
                  <th>Trips</th>
                  <th>Accept %</th>
                  <th>Cancel %</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((driver) => (
                  <tr
                    key={driver.id}
                    className="cy-table__row"
                    onClick={() => openDriver(driver)}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        openDriver(driver)
                      }
                    }}
                  >
                    <td>
                      <div className="driver-cell">
                        <div
                          className="driver-cell__photo"
                          style={{
                            background: `${driver.accent}18`,
                            color: driver.accent,
                          }}
                          aria-hidden
                        >
                          {driver.initials}
                        </div>
                        <div>
                          <div className="cy-table__primary">{driver.name}</div>
                          <div className="cy-table__secondary">{driver.gender}</div>
                        </div>
                      </div>
                    </td>
                    <td className="cy-table__mono">{driver.displayId ?? `DRV-${driver.id.replace(/-/g, '').slice(-6).toUpperCase()}`}</td>
                    <td>{driver.phone}</td>
                    <td>
                      <div className="cy-table__primary">{driver.vehicleType}</div>
                      <div className="cy-table__secondary">{driver.vehicleDetails.plate}</div>
                    </td>
                    <td>{driver.city}</td>
                    <td>
                      <span className="driver-rating">
                        <Star size={12} strokeWidth={1.75} fill="#f59e0b" color="#f59e0b" />
                        {driver.rating.toFixed(1)}
                      </span>
                    </td>
                    <td className="cy-table__mono drivers-wallet">
                      {formatWallet(driver.wallet)}
                    </td>
                    <td className="cy-table__mono">
                      {formatWallet(driver.todayEarnings)}
                    </td>
                    <td>
                      <StatusPill status={driver.status} tone={driver.status as DriverStatus} />
                    </td>
                    <td className="cy-table__mono">{driver.trips.toLocaleString('en-IN')}</td>
                    <td className="cy-table__mono">{driver.acceptanceRate}%</td>
                    <td className="cy-table__mono">{driver.cancellationRate}%</td>
                    <td>{driver.joined}</td>
                    <td>
                      <div className="cy-actions" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className="cy-action-btn"
                          title="View profile"
                          aria-label={`View ${driver.name}`}
                          onClick={() => openDriver(driver)}
                        >
                          <Eye size={15} strokeWidth={1.75} />
                        </button>
                        {driver.status === 'Pending KYC' ? (
                          <button
                            type="button"
                            className="cy-btn cy-btn--primary cy-btn--sm"
                            style={{ marginLeft: 8 }}
                            onClick={() => approveDriverKyc(driver)}
                          >
                            Approve KYC
                          </button>
                        ) : null}
                        <button
                          type="button"
                          className="cy-action-btn"
                          title="More actions"
                          aria-label={`More actions for ${driver.name}`}
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

      <DriverDrawer
        driver={selected}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onApproveKyc={approveDriverKyc}
        approvingKyc={selected ? approvingId === selected.id : false}
      />
    </div>
  )
}
