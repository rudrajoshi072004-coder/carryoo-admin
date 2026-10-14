import { Link } from 'react-router-dom'
import { IndianRupee, Package, Radio, Truck } from 'lucide-react'
import KpiCard from '../components/KpiCard'
import { PageHeader } from '../components/PageHeader'
import { Button, Card, CardBody, CardHeader, EmptyState, Skeleton, StatusPill } from '../components/ui'
import { PermissionBanner } from '../components/PermissionBanner'
import { useAuth } from '../context/AuthContext'
import { useAsyncData } from '../hooks/useAsyncData'
import { listBookings } from '../api/services/bookings'
import { listVehicleCategories } from '../api/services/vehicleCategories'
import { fetchDashboardSummary } from '../api/services/ops'
import { fetchDashboardPortalStats } from '../api/services/adminData'
import { isForbidden } from '../api/client'
import { formatINR } from '../lib/utils'
import './Dashboard.css'

const spark = [4, 6, 5, 8, 7, 9, 8]

async function fetchDashboardLive() {
  let adminSummary = null
  try {
    adminSummary = await fetchDashboardSummary()
  } catch (e) {
    if (!isForbidden(e)) throw e
  }

  const portalOverview = await fetchDashboardPortalStats()

  const [bookings, categories] = await Promise.all([
    listBookings({ page_size: 50 }),
    listVehicleCategories(),
  ])

  const activeStates = new Set(['searching', 'assigned', 'in_transit', 'picked_up'])
  const active = portalOverview?.active_bookings ?? bookings.filter((b) => activeStates.has(b.state)).length
  const completed = portalOverview?.completed_bookings ?? bookings.filter((b) => b.state === 'completed').length
  const cancelled = portalOverview?.cancelled_bookings ?? bookings.filter((b) => b.state.includes('cancel')).length
  const revenue = portalOverview
    ? Number.parseFloat(portalOverview.estimated_revenue)
    : bookings.reduce((sum, b) => sum + Number.parseFloat(b.estimated_fare ?? '0'), 0)

  return {
    adminSummary,
    portalOverview,
    stats: {
      totalBookings: portalOverview?.total_bookings ?? bookings.length,
      active,
      completed,
      cancelled,
      revenue,
      vehicleTypes: portalOverview?.vehicle_types_active ?? categories.filter((c) => c.active).length,
      totalDrivers: portalOverview?.total_drivers,
      totalCustomers: portalOverview?.total_customers,
    },
    recentBookings: bookings.slice(0, 8),
    categories,
  }
}

function formatState(state: string) {
  return state.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export default function Dashboard() {
  const { isAdmin } = useAuth()
  const { data, loading, error, refetch } = useAsyncData(fetchDashboardLive, [])

  if (loading) {
    return (
      <div className="dash cy-page" aria-busy="true">
        <div className="cy-skeleton-grid cy-skeleton-grid--kpis">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="card" />
          ))}
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <EmptyState
        title="Dashboard unavailable"
        description={error ?? 'Could not load dashboard data.'}
        action={<Button variant="primary" onClick={refetch}>Retry</Button>}
      />
    )
  }

  const { stats, recentBookings, categories, adminSummary } = data

  return (
    <div className="dash cy-page">
      <PageHeader
        title="Operations dashboard"
        subtitle="Live overview from Carryoo production API."
        crumbs={[{ label: 'Dashboard' }]}
        actions={
          <Link to="/orders" className="cy-btn cy-btn--secondary">
            View all orders
          </Link>
        }
      />

      {!isAdmin ? (
        <PermissionBanner message="Some admin metrics require an admin account. Booking and vehicle data shown from your access level." />
      ) : null}

      {adminSummary ? (
        <p className="dash-live-note">Admin summary loaded from backend ops API.</p>
      ) : null}

      <div className="cy-kpi-grid dash-kpi-grid">
        <KpiCard title="Total bookings" value={String(stats.totalBookings)} growth={2.4} icon={Package} sparkline={spark} />
        <KpiCard title="Active now" value={String(stats.active)} growth={1.2} icon={Radio} sparkline={spark} accent="#0ea5e9" />
        <KpiCard title="Completed" value={String(stats.completed)} growth={4.1} icon={Package} sparkline={spark} accent="#22c55e" />
        <KpiCard title="Est. revenue" value={formatINR(Math.round(stats.revenue))} growth={3.5} icon={IndianRupee} sparkline={spark} accent="#8b5cf6" />
        <KpiCard title="Vehicle types" value={String(stats.vehicleTypes)} growth={0} icon={Truck} sparkline={spark} />
        <KpiCard title="Cancelled" value={String(stats.cancelled)} growth={-1.2} icon={Package} sparkline={spark} accent="#ef4444" />
      </div>

      <div className="dash-two-col">
        <Card>
          <CardHeader title="Recent bookings" subtitle="Latest from the platform" />
          <CardBody>
            {recentBookings.length === 0 ? (
              <EmptyState title="No bookings yet" description="Orders will appear here when customers book." />
            ) : (
              <div className="cy-table-wrap">
                <table className="cy-table">
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Route</th>
                      <th>Fare</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentBookings.map((b) => (
                      <tr key={b.id}>
                        <td>{b.customer_phone ?? '—'}</td>
                        <td>
                          <div className="cy-table__secondary">{b.pickup_address_text.slice(0, 36)}…</div>
                        </td>
                        <td className="cy-table__mono">{b.estimated_fare ? formatINR(Number.parseFloat(b.estimated_fare)) : '—'}</td>
                        <td><StatusPill status={formatState(b.state)} tone={b.state} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Vehicle types" subtitle="Synced with customer & driver apps" />
          <CardBody>
            <ul className="dash-vehicle-list">
              {categories.map((c) => (
                <li key={c.id}>
                  <span>{c.name}</span>
                  <span className="cy-table__mono">
                    {formatINR(Number.parseFloat(c.base_fare))}
                    {c.base_fare_km ? ` (${c.base_fare_km} km incl.)` : ''} + {formatINR(Number.parseFloat(c.per_km_rate))}/km
                  </span>
                  <StatusPill status={c.active ? 'Active' : 'Off'} tone={c.active ? 'active' : 'inactive'} />
                </li>
              ))}
            </ul>
            <div className="dash-card-actions">
              <Link to="/vehicles" className="cy-btn cy-btn--secondary">Manage types</Link>
              <Link to="/pricing" className="cy-btn cy-btn--ghost">Edit pricing</Link>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
