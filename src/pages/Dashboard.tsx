import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, IndianRupee, Package, Radio, TimerOff, Truck } from 'lucide-react'
import KpiCard from '../components/KpiCard'
import DateRangeFilter from '../components/DateRangeFilter'
import { PageHeader } from '../components/PageHeader'
import { Button, Card, CardBody, CardHeader, EmptyState, Skeleton, StatusPill } from '../components/ui'
import { PermissionBanner } from '../components/PermissionBanner'
import { useToast } from '../components/Toast'
import { useAuth } from '../context/AuthContext'
import { useAsyncData } from '../hooks/useAsyncData'
import { listBookings } from '../api/services/bookings'
import { listVehicleCategories } from '../api/services/vehicleCategories'
import { fetchDashboardSummary } from '../api/services/ops'
import { fetchDashboardPortalStats, fetchActiveNowSummary } from '../api/services/adminData'
import { isForbidden } from '../api/client'
import { useAdminLanguage } from '../i18n/LanguageContext'
import { formatInr, intlLocale } from '../i18n/formatLocale'
import { customerVehicleLabel, pickCustomerAppVehicles } from '../lib/customerVehicles'
import { downloadFullCarryooBackup } from '../lib/fullBackup'
import {
  formatRangeLabel,
  isInRange,
  percentChange,
  previousComparableRange,
  rangeForPreset,
  sparklineBuckets,
  type DateRange,
} from '../lib/dateRange'
import type { Booking } from '../api/types'
import './Dashboard.css'

const ACTIVE_STATES = new Set(['searching', 'assigned', 'in_transit', 'picked_up', 'driver_arriving'])
const MISSED_STATES = new Set(['failed', 'no_driver_found'])

function isMissedBooking(state: string) {
  const normalized = state.toLowerCase()
  return MISSED_STATES.has(normalized) || normalized.includes('no_driver')
}

async function fetchDashboardLive() {
  const [adminResult, portalOverview, liveTracking, bookings, categories] = await Promise.all([
    fetchDashboardSummary()
      .then((adminSummary) => ({ adminSummary }))
      .catch((e) => {
        if (!isForbidden(e)) throw e
        return { adminSummary: null }
      }),
    fetchDashboardPortalStats(),
    fetchActiveNowSummary().catch(() => null),
    listBookings({ page_size: 200 }),
    listVehicleCategories(),
  ])

  return {
    adminSummary: adminResult.adminSummary,
    portalOverview,
    liveTracking,
    bookings,
    categories,
  }
}

function bookingTime(booking: Booking) {
  return new Date(booking.created_at).getTime()
}

function bookingFare(booking: Booking) {
  return Number.parseFloat(booking.final_fare ?? booking.estimated_fare ?? '0') || 0
}

function summarizeBookings(bookings: Booking[]) {
  const completed = bookings.filter((b) => b.state === 'completed')
  const cancelled = bookings.filter((b) => b.state.includes('cancel'))
  const missed = bookings.filter((b) => isMissedBooking(b.state))
  const active = bookings.filter((b) => ACTIVE_STATES.has(b.state))
  const revenue = bookings.reduce((sum, booking) => sum + bookingFare(booking), 0)
  return {
    total: bookings.length,
    active: active.length,
    completed: completed.length,
    cancelled: cancelled.length,
    missed: missed.length,
    revenue,
  }
}

function formatState(state: string) {
  if (isMissedBooking(state)) return 'Missed'
  return state.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export default function Dashboard() {
  const { isAdmin } = useAuth()
  const { toast } = useToast()
  const { t, locale } = useAdminLanguage()
  const { data, loading, error, refetch } = useAsyncData(fetchDashboardLive, [])
  const [range, setRange] = useState<DateRange>(() => rangeForPreset('today'))
  const [downloading, setDownloading] = useState(false)
  const rangeLabel = formatRangeLabel(range, intlLocale(locale))
  const money = (n: number) => formatInr(n, locale)

  const handleDownloadAll = async () => {
    setDownloading(true)
    try {
      const counts = await downloadFullCarryooBackup()
      toast({
        title: 'Backup downloaded',
        description: `${counts.drivers} drivers, ${counts.customers} customers, ${counts.bookings} bookings, ${counts.complaints} complaints.`,
      })
    } catch (err) {
      toast({
        title: 'Download failed',
        description: err instanceof Error ? err.message : 'Could not prepare the full CSV backup.',
        tone: 'error',
      })
    } finally {
      setDownloading(false)
    }
  }

  const periodStats = useMemo(() => {
    if (!data) return null
    const inPeriod = data.bookings.filter((booking) => isInRange(booking.created_at, range))
    const previous = previousComparableRange(range)
    const inPrevious = data.bookings.filter((booking) =>
      isInRange(booking.created_at, { ...range, from: previous.from, to: previous.to }),
    )
    const current = summarizeBookings(inPeriod)
    const prior = summarizeBookings(inPrevious)
    const recentBookings = [...inPeriod]
      .sort((a, b) => bookingTime(b) - bookingTime(a))
      .slice(0, 8)

    return {
      current,
      growth: {
        total: percentChange(current.total, prior.total),
        active: percentChange(current.active, prior.active),
        completed: percentChange(current.completed, prior.completed),
        cancelled: percentChange(current.cancelled, prior.cancelled),
        missed: percentChange(current.missed, prior.missed),
        revenue: percentChange(current.revenue, prior.revenue),
      },
      sparks: {
        total: sparklineBuckets(inPeriod, range, bookingTime),
        active: sparklineBuckets(
          inPeriod.filter((b) => ACTIVE_STATES.has(b.state)),
          range,
          bookingTime,
        ),
        completed: sparklineBuckets(
          inPeriod.filter((b) => b.state === 'completed'),
          range,
          bookingTime,
        ),
        cancelled: sparklineBuckets(
          inPeriod.filter((b) => b.state.includes('cancel')),
          range,
          bookingTime,
        ),
        missed: sparklineBuckets(
          inPeriod.filter((b) => isMissedBooking(b.state)),
          range,
          bookingTime,
        ),
        revenue: sparklineBuckets(inPeriod, range, bookingTime, bookingFare),
      },
      recentBookings,
    }
  }, [data, range])

  if (loading && !data) {
    return (
      <div className="dash cy-page" aria-busy="true">
        <PageHeader
          title={t('pages.dashboard.title')}
          subtitle={t('pages.dashboard.loadingSubtitle')}
          crumbs={[{ label: t('dashboard') }]}
        />
        <DateRangeFilter value={range} onChange={setRange} />
        <div className="cy-skeleton-grid cy-skeleton-grid--kpis">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="card" />
          ))}
        </div>
      </div>
    )
  }

  if (error || !data || !periodStats) {
    return (
      <EmptyState
        title={t('pages.dashboard.unavailable')}
        description={error ?? t('pages.dashboard.loadFailed')}
        action={<Button variant="primary" onClick={refetch}>{t('ui.retry')}</Button>}
      />
    )
  }

  const { current, growth, sparks, recentBookings } = periodStats
  const customerVehicles = pickCustomerAppVehicles(data.categories)
  const vehicleTypes = customerVehicles.length

  return (
    <div className="dash cy-page">
      <PageHeader
        title={t('pages.dashboard.title')}
        subtitle={t('pages.dashboard.subtitle', { range: rangeLabel })}
        crumbs={[{ label: t('dashboard') }]}
        actions={
          <>
            <Button variant="primary" onClick={handleDownloadAll} disabled={downloading}>
              <Download size={16} strokeWidth={1.75} />
              {downloading ? t('pages.dashboard.preparing') : t('pages.dashboard.downloadAll')}
            </Button>
            <Link to="/orders" className="cy-btn cy-btn--secondary">
              {t('pages.dashboard.viewOrders')}
            </Link>
          </>
        }
      />

      <DateRangeFilter value={range} onChange={setRange} />

      {!isAdmin ? (
        <PermissionBanner message={t('pages.dashboard.permission')} />
      ) : null}

      {data.adminSummary ? (
        <p className="dash-live-note">{t('pages.dashboard.liveNote')}</p>
      ) : null}

      <div className="cy-kpi-grid dash-kpi-grid">
        <KpiCard title={t('pages.dashboard.totalBookings')} value={String(current.total)} growth={growth.total} icon={Package} sparkline={sparks.total} />
        <KpiCard
          title={t('pages.dashboard.activeNow')}
          value={String(data.liveTracking?.onlineCount ?? current.active)}
          growth={growth.active}
          icon={Radio}
          sparkline={sparks.active}
          accent="#0ea5e9"
          href="/live-tracking?filter=active"
          live
        />
        <KpiCard title={t('pages.dashboard.orderCompleted')} value={String(current.completed)} growth={growth.completed} icon={Package} sparkline={sparks.completed} accent="#22c55e" />
        <KpiCard title={t('pages.dashboard.estRevenue')} value={money(Math.round(current.revenue))} growth={growth.revenue} icon={IndianRupee} sparkline={sparks.revenue} accent="#8b5cf6" />
        <KpiCard title={t('pages.dashboard.vehicleTypes')} value={String(vehicleTypes)} growth={0} icon={Truck} sparkline={sparks.total} />
        <KpiCard title={t('pages.dashboard.orderCancelled')} value={String(current.cancelled)} growth={growth.cancelled} icon={Package} sparkline={sparks.cancelled} accent="#ef4444" />
        <KpiCard
          title={t('pages.dashboard.orderMissed')}
          value={String(current.missed)}
          growth={growth.missed}
          icon={TimerOff}
          sparkline={sparks.missed}
          accent="#f97316"
          href="/orders?status=failed"
        />
      </div>

      <div className="dash-two-col">
        <Card>
          <CardHeader title={t('pages.dashboard.recentBookings')} subtitle={t('pages.dashboard.recentSubtitle', { range: rangeLabel })} />
          <CardBody>
            {recentBookings.length === 0 ? (
              <EmptyState title={t('pages.dashboard.noBookings')} description={t('pages.dashboard.noBookingsBody')} />
            ) : (
              <div className="cy-table-wrap">
                <table className="cy-table">
                  <thead>
                    <tr>
                      <th>{t('pages.dashboard.customer')}</th>
                      <th>{t('pages.dashboard.route')}</th>
                      <th>{t('pages.dashboard.fare')}</th>
                      <th>{t('pages.dashboard.status')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentBookings.map((b) => (
                      <tr key={b.id}>
                        <td>{b.customer_phone ?? '—'}</td>
                        <td>
                          <div className="cy-table__secondary">{b.pickup_address_text.slice(0, 36)}…</div>
                        </td>
                        <td className="cy-table__mono">{b.estimated_fare ? money(Number.parseFloat(b.estimated_fare)) : '—'}</td>
                        <td><StatusPill status={formatState(b.state)} tone={isMissedBooking(b.state) ? 'failed' : b.state} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title={t('pages.dashboard.vehicleTypesCard')} subtitle={t('pages.dashboard.vehicleTypesSub')} />
          <CardBody>
            <ul className="dash-vehicle-list">
              {customerVehicles.map((c) => (
                <li key={c.id}>
                  <span>{customerVehicleLabel(c.name)}</span>
                  <span className="cy-table__mono">
                    {money(Number.parseFloat(c.base_fare))}
                    {c.base_fare_km && Number.parseFloat(c.base_fare_km) > 0
                      ? ` / ${Number.parseFloat(c.base_fare_km)} km`
                      : ''}
                    {' + '}
                    {money(Number.parseFloat(c.per_km_rate))}/km
                  </span>
                  <StatusPill status={c.active ? 'Active' : 'Off'} tone={c.active ? 'active' : 'inactive'} />
                </li>
              ))}
            </ul>
            <div className="dash-card-actions">
              <Link to="/vehicles" className="cy-btn cy-btn--secondary">{t('pages.dashboard.manageTypes')}</Link>
              <Link to="/pricing" className="cy-btn cy-btn--ghost">{t('pages.dashboard.editPricing')}</Link>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
