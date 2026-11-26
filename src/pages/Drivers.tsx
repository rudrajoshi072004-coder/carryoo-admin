import { useEffect, useMemo, useState } from 'react'
import {
  Plus,
  Download,
  RefreshCw,
  Star,
  MoreHorizontal,
  Eye,
  Filter,
  Users,
  X,
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
import { matchesCustomerVehicleFilter, type CustomerAppVehicleFilter } from '../lib/customerVehicles'
import { useAsyncData } from '../hooks/useAsyncData'
import { fetchDriversAdmin } from '../api/services/adminData'
import { createPortalDriver, updatePortalDriver } from '../api/services/portal'
import { getApiErrorMessage } from '../api/client'
import { useToast } from '../components/Toast'
import { useAdminLanguage } from '../i18n/LanguageContext'
import { excelText, exportCsv } from '../lib/utils'
import { invalidateCache } from '../lib/queryCache'
import {
  driverCities,
  driverStatuses,
  vehicleTypes,
  type Driver,
  type DriverStatus,
} from '../data/driversData'
import './Drivers.css'
import '../components/ConfirmDialog.css'

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
  const { t } = useAdminLanguage()
  const { toast } = useToast()
  const { data: drivers, loading, error, refetch } = useAsyncData(fetchDrivers, [])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<(typeof driverStatuses)[number]>('All Status')
  const [cityFilter, setCityFilter] = useState(driverCities[0])
  const [vehicleFilter, setVehicleFilter] = useState<CustomerAppVehicleFilter>(vehicleTypes[0])
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
      const matchesVehicle = matchesCustomerVehicleFilter(driver.vehicleType, vehicleFilter)

      return matchesSearch && matchesStatus && matchesCity && matchesVehicle
    })
  }, [drivers, search, statusFilter, cityFilter, vehicleFilter])

  const openDriver = (driver: Driver) => {
    setSelected(driver)
    setDrawerOpen(true)
  }

  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const [favoritingId, setFavoritingId] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [addPhone, setAddPhone] = useState('')
  const [addPassword, setAddPassword] = useState('')
  const [addConfirmPassword, setAddConfirmPassword] = useState('')
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    if (!menuOpenId) return
    const onDocClick = () => setMenuOpenId(null)
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [menuOpenId])

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
        tone: 'error',
      })
    } finally {
      setApprovingId(null)
    }
  }

  const toggleFavorite = async (driver: Driver) => {
    const next = !driver.isFavorite
    setFavoritingId(driver.id)
    setMenuOpenId(null)
    try {
      await updatePortalDriver(driver.id, { is_favorite: next })
      invalidateCache('GET:/admin/portal/drivers')
      toast({
        title: next ? 'Added as favorite driver' : 'Removed from favorites',
        description: next
          ? `${driver.name} gets the first 10 seconds when they are near a customer pickup.`
          : `${driver.name} will be offered trips with everyone else.`,
      })
      refetch()
    } catch (err) {
      toast({
        title: 'Could not update favorite',
        description: err instanceof Error ? err.message : 'Deploy the favorite-driver backend change first.',
        tone: 'error',
      })
    } finally {
      setFavoritingId(null)
    }
  }

  const openAddDriver = () => {
    setAddPhone('')
    setAddPassword('')
    setAddConfirmPassword('')
    setAddOpen(true)
  }

  const handleAddDriver = async () => {
    const phone = addPhone.trim()
    const password = addPassword
    if (!phone) {
      toast({ title: 'Phone required', description: 'Enter the driver phone number.', tone: 'error' })
      return
    }
    if (password.length < 6) {
      toast({ title: 'Password too short', description: 'Use at least 6 characters.', tone: 'error' })
      return
    }
    if (password !== addConfirmPassword) {
      toast({ title: 'Passwords do not match', description: 'Enter the same password in both fields.', tone: 'error' })
      return
    }
    setAdding(true)
    try {
      const created = await createPortalDriver({ phone, password })
      invalidateCache('GET:/admin/portal/drivers')
      setAddOpen(false)
      toast({
        title: 'Driver added',
        description: `${created.phone || phone} can now log in on the driver app with this password.`,
      })
      refetch()
    } catch (err) {
      toast({
        title: 'Could not add driver',
        description: getApiErrorMessage(err),
        tone: 'error',
      })
    } finally {
      setAdding(false)
    }
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      invalidateCache('GET:/admin/portal/drivers')
      const latest = await fetchDriversAdmin()
      const rows = latest.map((d) => [
        excelText(d.displayId ?? d.id),
        d.name,
        excelText(d.phone),
        d.email || '',
        d.vehicleType,
        excelText(d.vehicleDetails.plate !== '—' ? d.vehicleDetails.plate : d.vehicle),
        d.city,
        d.rating,
        d.wallet,
        d.todayEarnings,
        d.status,
        d.trips,
        d.acceptanceRate,
        d.cancellationRate,
        excelText(d.joined),
      ])
      exportCsv(
        'carryoo-drivers.csv',
        [
          'Driver ID',
          'Name',
          'Phone',
          'Email',
          'Vehicle type',
          'Vehicle number',
          'City',
          'Rating',
          'Wallet',
          "Today's earnings",
          'Status',
          'Trips',
          'Acceptance %',
          'Cancellation %',
          'Joined',
        ],
        rows,
      )
      toast({
        title: 'Drivers exported',
        description: `${latest.length} drivers downloaded from backend, including joining date.`,
      })
    } catch (err) {
      toast({
        title: 'Export failed',
        description: err instanceof Error ? err.message : 'Could not fetch drivers from backend.',
        tone: 'error',
      })
    } finally {
      setExporting(false)
    }
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
        title={t('pages.drivers.title')}
        subtitle={t('pages.drivers.subtitle')}
        crumbs={[{ label: t('ui.home'), to: '/' }, { label: t('drivers') }]}
      />
      <div className="cy-page__toolbar">
        <div className="cy-page__toolbar-left">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder={t('pages.drivers.search')}
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
              onChange={(e) => setVehicleFilter(e.target.value as CustomerAppVehicleFilter)}
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
          <Button variant="secondary" onClick={handleExport} disabled={exporting}>
            <Download size={16} strokeWidth={1.75} />
            {exporting ? 'Exporting…' : 'Export'}
          </Button>
          <Button variant="primary" onClick={openAddDriver}>
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
                          <div className="cy-table__primary driver-cell__name">
                            {driver.name}
                            {driver.isFavorite ? (
                              <span className="driver-favorite-badge" title="Favorite driver">
                                <Star size={11} strokeWidth={1.75} fill="#f59e0b" color="#f59e0b" />
                                Favorite
                              </span>
                            ) : null}
                          </div>
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
                      {driver.isBlocked ? <StatusPill status="Blocked" tone="cancelled" /> : null}
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
                        <div className="drivers-more">
                          <button
                            type="button"
                            className="cy-action-btn"
                            title="More actions"
                            aria-label={`More actions for ${driver.name}`}
                            aria-expanded={menuOpenId === driver.id}
                            onClick={(e) => {
                              e.stopPropagation()
                              setMenuOpenId((current) => (current === driver.id ? null : driver.id))
                            }}
                          >
                            <MoreHorizontal size={15} strokeWidth={1.75} />
                          </button>
                          {menuOpenId === driver.id ? (
                            <div className="drivers-more__menu" role="menu">
                              <button
                                type="button"
                                role="menuitem"
                                disabled={favoritingId === driver.id}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleFavorite(driver)
                                }}
                              >
                                <Star
                                  size={14}
                                  strokeWidth={1.75}
                                  fill={driver.isFavorite ? '#f59e0b' : 'none'}
                                  color="#f59e0b"
                                />
                                {favoritingId === driver.id
                                  ? 'Saving…'
                                  : driver.isFavorite
                                    ? 'Remove from favorites'
                                    : 'Add as favorite driver'}
                              </button>
                            </div>
                          ) : null}
                        </div>
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

      {addOpen ? (
        <div className="cy-modal-overlay" onClick={() => !adding && setAddOpen(false)}>
          <form
            className="cy-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-driver-title"
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault()
              handleAddDriver()
            }}
          >
            <div className="cy-modal__header">
              <h2 id="add-driver-title">Add driver</h2>
              <button
                type="button"
                className="cy-modal__close"
                onClick={() => setAddOpen(false)}
                disabled={adding}
                aria-label="Close"
              >
                <X size={16} strokeWidth={1.75} />
              </button>
            </div>
            <p className="cy-modal__desc">
              Create a driver account. They can log in on the driver app with this phone number and password.
            </p>
            <label className="cy-modal__field">
              <span>Phone number</span>
              <input
                type="tel"
                value={addPhone}
                onChange={(e) => setAddPhone(e.target.value)}
                placeholder="9175504990"
                autoComplete="tel"
                autoFocus
                required
                disabled={adding}
              />
            </label>
            <label className="cy-modal__field">
              <span>Password</span>
              <input
                type="password"
                value={addPassword}
                onChange={(e) => setAddPassword(e.target.value)}
                placeholder="At least 6 characters"
                autoComplete="new-password"
                required
                minLength={6}
                disabled={adding}
              />
            </label>
            <label className="cy-modal__field">
              <span>Confirm password</span>
              <input
                type="password"
                value={addConfirmPassword}
                onChange={(e) => setAddConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                autoComplete="new-password"
                required
                minLength={6}
                disabled={adding}
              />
            </label>
            <div className="cy-modal__actions">
              <Button type="button" variant="secondary" onClick={() => setAddOpen(false)} disabled={adding}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={adding}>
                {adding ? 'Adding…' : 'Add driver'}
              </Button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  )
}
