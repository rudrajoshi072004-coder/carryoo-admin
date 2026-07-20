import { useMemo, useState } from 'react'
import { Download, Eye, Filter, Package } from 'lucide-react'
import { PageHeader, Pagination } from '../components/PageHeader'
import { SidePanel } from '../components/ConfirmDialog'
import {
  Button,
  EmptyState,
  SearchInput,
  Skeleton,
  StatusPill,
} from '../components/ui'
import { useAsyncData } from '../hooks/useAsyncData'
import { listBookings } from '../api/services/bookings'
import { listVehicleCategories } from '../api/services/vehicleCategories'
import type { Booking } from '../api/types'
import { exportCsv, paginate } from '../lib/utils'
import './Orders.css'

const PAGE_SIZE = 12

const STATUS_FILTERS = ['All Status', 'searching', 'assigned', 'in_transit', 'completed', 'cancelled_by_customer', 'cancelled_by_driver'] as const

function formatFare(amount?: string) {
  const n = Number.parseFloat(amount ?? '0')
  if (!Number.isFinite(n) || n <= 0) return '—'
  return `₹${Math.round(n).toLocaleString('en-IN')}`
}

function formatState(state: string) {
  return state.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

async function fetchOrdersData() {
  const [bookings, categories] = await Promise.all([
    listBookings({ page_size: 100 }),
    listVehicleCategories(),
  ])
  const categoryNames = new Map(categories.map((c) => [c.id, c.name]))
  return { bookings, categoryNames }
}

function OrdersSkeleton() {
  return (
    <div className="cy-page" aria-busy="true">
      <div className="cy-table-card">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} variant="card" style={{ height: 48, marginBottom: 8 }} />
        ))}
      </div>
    </div>
  )
}

export default function Orders() {
  const { data, loading, error, refetch } = useAsyncData(fetchOrdersData, [])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>('All Status')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Booking | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const bookings = data?.bookings ?? []
  const categoryNames = data?.categoryNames ?? new Map<string, string>()

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return bookings.filter((order) => {
      const matchesSearch =
        !q ||
        order.id.toLowerCase().includes(q) ||
        order.customer_phone?.toLowerCase().includes(q) ||
        order.pickup_address_text.toLowerCase().includes(q) ||
        order.drop_address_text.toLowerCase().includes(q)
      const matchesStatus = statusFilter === 'All Status' || order.state === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [bookings, search, statusFilter])

  const paginated = useMemo(() => paginate(filtered, page, PAGE_SIZE), [filtered, page])

  const openOrder = (order: Booking) => {
    setSelected(order)
    setDrawerOpen(true)
  }

  const handleExport = () => {
    exportCsv(
      'carryoo-bookings.csv',
      ['ID', 'Customer phone', 'Pickup', 'Drop', 'Fare', 'State', 'Created'],
      filtered.map((o) => [
        o.id,
        o.customer_phone ?? '',
        o.pickup_address_text,
        o.drop_address_text,
        o.estimated_fare ?? '',
        o.state,
        o.created_at,
      ]),
    )
  }

  if (loading) return <OrdersSkeleton />

  if (error || !data) {
    return (
      <div className="cy-table-card">
        <EmptyState
          icon={<Package size={24} strokeWidth={1.75} />}
          title="Unable to load orders"
          description={error ?? 'Could not fetch bookings from API.'}
          action={<Button variant="primary" onClick={refetch}>Retry</Button>}
        />
      </div>
    )
  }

  return (
    <div className="orders-page cy-page">
      <PageHeader
        title="Orders"
        subtitle="Live bookings from the Carryoo platform."
        crumbs={[{ label: 'Dashboard', to: '/' }, { label: 'Orders' }]}
        actions={
          <Button variant="secondary" onClick={handleExport}>
            <Download size={16} strokeWidth={1.75} />
            Export
          </Button>
        }
      />

      <div className="cy-page__toolbar">
        <div className="cy-page__toolbar-left">
          <SearchInput
            value={search}
            onChange={(v) => { setSearch(v); setPage(1) }}
            placeholder="Search ID, phone, address…"
            className="orders-search"
          />
          <div className="cy-page__filters">
            <span className="cy-page__filters-label"><Filter size={14} /> Filters</span>
            <select className="cy-select" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value as typeof statusFilter); setPage(1) }}>
              {STATUS_FILTERS.map((s) => (
                <option key={s} value={s}>{s === 'All Status' ? s : formatState(s)}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="cy-page__meta">
        <span>Showing <strong>{paginated.items.length}</strong> of {filtered.length} bookings</span>
      </div>

      <div className="cy-table-card">
        {paginated.items.length === 0 ? (
          <EmptyState icon={<Package size={24} />} title="No bookings found" description="Try adjusting filters." />
        ) : (
          <>
            <div className="cy-table-wrap">
              <table className="cy-table orders-table">
                <thead>
                  <tr>
                    <th>Booking</th>
                    <th>Customer</th>
                    <th>Route</th>
                    <th>Vehicle</th>
                    <th>Fare</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {paginated.items.map((order) => (
                    <tr key={order.id} className="cy-table__row" onClick={() => openOrder(order)}>
                      <td>
                        <div className="cy-table__mono cy-table__primary">{order.id.slice(0, 8)}…</div>
                        <div className="cy-table__secondary">{order.booking_type}</div>
                      </td>
                      <td>{order.customer_phone ?? '—'}</td>
                      <td>
                        <div className="cy-table__primary orders-route" title={order.pickup_address_text}>
                          {order.pickup_address_text.slice(0, 40)}…
                        </div>
                        <div className="cy-table__secondary orders-route" title={order.drop_address_text}>
                          → {order.drop_address_text.slice(0, 40)}…
                        </div>
                      </td>
                      <td>{order.vehicle_category ? categoryNames.get(order.vehicle_category) ?? '—' : '—'}</td>
                      <td className="cy-table__mono">{formatFare(order.estimated_fare)}</td>
                      <td><StatusPill status={formatState(order.state)} tone={order.state.includes('cancel') ? 'cancelled' : order.state} /></td>
                      <td className="cy-table__secondary">{formatDate(order.created_at)}</td>
                      <td>
                        <button type="button" className="cy-action-btn" onClick={(e) => { e.stopPropagation(); openOrder(order) }}>
                          <Eye size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={paginated.page} totalPages={paginated.totalPages} total={paginated.total} pageSize={PAGE_SIZE} onPageChange={setPage} />
          </>
        )}
      </div>

      <SidePanel open={drawerOpen} title="Booking details" onClose={() => setDrawerOpen(false)} width={520}>
        {selected ? (
          <>
            <p className="cy-table__mono">{selected.id}</p>
            <div className="orders-detail-grid">
              <div><span>Status</span><strong>{formatState(selected.state)}</strong></div>
              <div><span>Customer</span><strong>{selected.customer_phone ?? '—'}</strong></div>
              <div><span>Vehicle</span><strong>{selected.vehicle_category ? categoryNames.get(selected.vehicle_category) : '—'}</strong></div>
              <div><span>Est. fare</span><strong>{formatFare(selected.estimated_fare)}</strong></div>
              <div><span>Distance</span><strong>{selected.estimated_distance_km ?? '—'} km</strong></div>
              <div><span>Duration</span><strong>{selected.estimated_duration_min ?? '—'} min</strong></div>
            </div>
            <section className="orders-detail-section">
              <h4>Pickup</h4>
              <p>{selected.pickup_address_text}</p>
            </section>
            <section className="orders-detail-section">
              <h4>Drop</h4>
              <p>{selected.drop_address_text}</p>
            </section>
            {selected.notes ? (
              <section className="orders-detail-section">
                <h4>Notes</h4>
                <p>{selected.notes}</p>
              </section>
            ) : null}
          </>
        ) : null}
      </SidePanel>
    </div>
  )
}
