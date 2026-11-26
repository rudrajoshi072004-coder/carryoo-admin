import { useEffect, useMemo, useState } from 'react'
import {
  Plus,
  Download,
  Star,
  MoreHorizontal,
  Eye,
  Filter,
  Users,
  Phone,
  Mail,
  MapPin,
  Wallet,
  Package,
  MessageSquareWarning,
  Gift,
  ThumbsUp,
  Activity,
  IndianRupee,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  RotateCcw,
} from 'lucide-react'
import { ConfirmDialog, SidePanel } from '../components/ConfirmDialog'
import { PageHeader, Pagination } from '../components/PageHeader'
import { useToast } from '../components/Toast'
import { useAdminLanguage } from '../i18n/LanguageContext'
import {
  Button,
  Card,
  CardBody,
  EmptyState,
  SearchInput,
  Skeleton,
  StatusPill,
} from '../components/ui'
import { UserBlockPanel } from '../components/UserBlockPanel'
import { useAsyncData } from '../hooks/useAsyncData'
import { formatINR, exportCsv, paginate, slugStatus } from '../lib/utils'
import { fetchCustomersAdmin } from '../api/services/adminData'
import {
  fetchPortalFlaggedCustomers,
  reviewPortalFlaggedCustomer,
  type FlaggedCustomerRow,
} from '../api/services/portal'
import {
  customerCities,
  customerStatuses,
  type Customer,
  type CustomerStatus,
} from '../data/customersData'
import './Customers.css'

const PAGE_SIZE = 8

const statusTone: Record<CustomerStatus, string> = {
  Active: 'completed',
  Inactive: 'offline',
  Blocked: 'cancelled',
}

const severityTone: Record<'warning' | 'high' | 'review', string> = {
  warning: 'warning',
  high: 'danger',
  review: 'review',
}

async function fetchCustomers() {
  return fetchCustomersAdmin()
}

function CustomersSkeleton() {
  return (
    <div className="customers-page cy-page" aria-busy="true">
      <Skeleton variant="title" style={{ width: 220, height: 28, marginBottom: 8 }} />
      <Skeleton variant="text" style={{ width: 320, marginBottom: 20 }} />
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

function CustomerPanel({
  customer,
  onFlagAction,
  onBlockChanged,
}: {
  customer: Customer
  onFlagAction?: (flagId: string, action: 'review' | 'dismiss') => void
  onBlockChanged?: (blocked: boolean, reason: string) => void
}) {
  const maxSpend = Math.max(...customer.spendingByMonth.map((m) => m.amount), 1)
  const abuse = customer.abuseInfo

  return (
    <>
      <div className="panel-identity">
        <div
          className="panel-identity__avatar"
          style={{ background: `${customer.accent}18`, color: customer.accent }}
          aria-hidden
        >
          {customer.initials}
        </div>
        <div>
          <p className="panel-identity__name">{customer.name}</p>
          <p className="panel-identity__id">{customer.id}</p>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <StatusPill status={customer.status} tone={statusTone[customer.status]} />
          {abuse?.isFlagged ? (
            <StatusPill
              status={
                abuse.highestSeverity === 'high'
                  ? 'High Risk'
                  : abuse.highestSeverity === 'review'
                    ? 'Review'
                    : 'Flagged'
              }
              tone={
                abuse.highestSeverity === 'high'
                  ? 'danger'
                  : abuse.highestSeverity === 'review'
                    ? 'review'
                    : 'warning'
              }
            />
          ) : null}
        </div>
      </div>

      <UserBlockPanel userId={customer.id} onChanged={onBlockChanged} />

      {abuse && (abuse.isFlagged || abuse.flagId) ? (
        <Card className={`abuse-card abuse-card--${abuse.highestSeverity || 'warning'}`}>
          <CardBody>
            <div className="abuse-card__header">
              <h3 className="abuse-card__title">
                <AlertTriangle size={16} strokeWidth={2} />
                Cancellation Abuse Flag
              </h3>
              <StatusPill
                status={(abuse.highestSeverity || 'warning').toUpperCase()}
                tone={severityTone[abuse.highestSeverity || 'warning']}
              />
            </div>
            {abuse.ruleLabel ? (
              <p style={{ margin: '0 0 10px', fontSize: 12.5, fontWeight: 600, color: 'var(--cy-text)' }}>
                {abuse.ruleLabel}
              </p>
            ) : null}

            <div className="abuse-stat-grid">
              <div className="abuse-stat">
                <span className="abuse-stat__label">24h Cancels</span>
                <span className="abuse-stat__val abuse-stat__val--warning">
                  {abuse.cancellations24h ?? '—'}
                </span>
              </div>
              <div className="abuse-stat">
                <span className="abuse-stat__label">7d Cancels</span>
                <span className="abuse-stat__val abuse-stat__val--danger">
                  {abuse.cancellations7d ?? '—'}
                </span>
              </div>
              <div className="abuse-stat">
                <span className="abuse-stat__label">30d Rate</span>
                <span className="abuse-stat__val">
                  {abuse.cancellationRate ? `${abuse.cancellationRate}%` : '—'}
                </span>
              </div>
              <div className="abuse-stat">
                <span className="abuse-stat__label">Cust Cancels</span>
                <span className="abuse-stat__val">{abuse.customerCancellations ?? '—'}</span>
              </div>
              <div className="abuse-stat">
                <span className="abuse-stat__label">Driver Cancels</span>
                <span className="abuse-stat__val">{abuse.driverCancellations ?? '—'}</span>
              </div>
              <div className="abuse-stat">
                <span className="abuse-stat__label">Completed</span>
                <span className="abuse-stat__val">{abuse.completedBookings ?? '—'}</span>
              </div>
            </div>

            {abuse.adminNotes || abuse.flagStatus ? (
              <div className="abuse-notes-box">
                <strong>Flag Status & Review Info</strong>
                <div>Status: <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{abuse.flagStatus || 'Active'}</span></div>
                {abuse.adminNotes ? <div style={{ marginTop: 4 }}>Note: {abuse.adminNotes}</div> : null}
              </div>
            ) : null}

            {abuse.recentHistory && abuse.recentHistory.length > 0 ? (
              <div style={{ marginTop: 12 }}>
                <strong style={{ display: 'block', fontSize: 11, color: 'var(--cy-text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Recent Cancellation Events
                </strong>
                <div className="panel-table-wrap">
                  <table className="panel-table">
                    <thead>
                      <tr>
                        <th>Booking ID</th>
                        <th>Time</th>
                        <th>From State</th>
                        <th>Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {abuse.recentHistory.map((ev, i) => (
                        <tr key={i}>
                          <td className="panel-table__primary">{ev.booking_id ? ev.booking_id.slice(0, 8) : '—'}</td>
                          <td>
                            {ev.cancelled_at
                              ? new Date(ev.cancelled_at).toLocaleDateString('en-IN', {
                                  day: '2-digit',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : '—'}
                          </td>
                          <td style={{ fontSize: 11 }}>{ev.from_state}</td>
                          <td>{ev.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            {abuse.flagId && (abuse.flagStatus === 'active' || !abuse.flagStatus) && onFlagAction ? (
              <div className="abuse-panel-actions">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => onFlagAction(abuse.flagId!, 'review')}
                >
                  <CheckCircle2 size={14} /> Mark Reviewed
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => onFlagAction(abuse.flagId!, 'dismiss')}
                >
                  <XCircle size={14} /> Dismiss Flag
                </Button>
              </div>
            ) : null}
          </CardBody>
        </Card>
      ) : null}

      <Card>
        <CardBody>
          <section className="panel-section">
            <h3 className="panel-section__title">
              <Users size={15} strokeWidth={1.75} /> Profile
            </h3>
            <div className="panel-grid">
              <div className="panel-field">
                <span className="panel-field__label">Phone</span>
                <span className="panel-field__value">
                  <Phone size={13} strokeWidth={1.75} /> {customer.phone}
                </span>
              </div>
              <div className="panel-field">
                <span className="panel-field__label">Email</span>
                <span className="panel-field__value">
                  <Mail size={13} strokeWidth={1.75} /> {customer.email || '—'}
                </span>
              </div>
              <div className="panel-field">
                <span className="panel-field__label">City</span>
                <span className="panel-field__value">
                  <MapPin size={13} strokeWidth={1.75} /> {customer.city}
                </span>
              </div>
              <div className="panel-field">
                <span className="panel-field__label">Joined</span>
                <span className="panel-field__value">{customer.joined}</span>
              </div>
              <div className="panel-field">
                <span className="panel-field__label">Orders</span>
                <span className="panel-field__value">{customer.orders.toLocaleString('en-IN')}</span>
              </div>
              <div className="panel-field">
                <span className="panel-field__label">Rating</span>
                <span className="panel-field__value">
                  <Star size={13} strokeWidth={1.75} fill="#f59e0b" color="#f59e0b" />
                  {customer.rating.toFixed(1)}
                </span>
              </div>
            </div>
          </section>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <section className="panel-section">
            <h3 className="panel-section__title">
              <MapPin size={15} strokeWidth={1.75} /> Addresses
            </h3>
            <div className="panel-table-wrap">
              <table className="panel-table">
                <thead>
                  <tr>
                    <th>Label</th>
                    <th>Address</th>
                    <th>Pincode</th>
                  </tr>
                </thead>
                <tbody>
                  {customer.addresses.map((addr) => (
                    <tr key={addr.id}>
                      <td>
                        <div className="panel-table__primary">{addr.label}</div>
                        {addr.isDefault ? (
                          <div className="panel-table__secondary">Default</div>
                        ) : null}
                      </td>
                      <td>
                        {addr.line1}
                        {addr.line2 ? `, ${addr.line2}` : ''}, {addr.city}
                      </td>
                      <td>{addr.pincode}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <section className="panel-section">
            <h3 className="panel-section__title">
              <Wallet size={15} strokeWidth={1.75} /> Wallet
            </h3>
            <div className="panel-wallet-balance">
              <span>Current balance</span>
              <strong>{formatINR(customer.wallet)}</strong>
            </div>
            <ul className="panel-timeline">
              {customer.walletHistory.map((entry, i) => (
                <li key={i} className="panel-timeline__item">
                  <div>
                    <p className="panel-timeline__text">{entry.label}</p>
                    <span className="panel-timeline__time">{entry.time}</span>
                  </div>
                  <span
                    className={`panel-timeline__amount ${entry.type === 'credit' ? 'is-credit' : 'is-debit'}`}
                  >
                    {entry.type === 'credit' ? '+' : '−'}
                    {formatINR(entry.amount)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <section className="panel-section">
            <h3 className="panel-section__title">
              <Package size={15} strokeWidth={1.75} /> Orders
            </h3>
            <p className="panel-section__meta">
              {customer.orders.toLocaleString('en-IN')} lifetime orders
            </p>
            <div className="panel-table-wrap">
              <table className="panel-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Route</th>
                    <th>Fare</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {customer.recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="panel-table__primary">{order.id}</td>
                      <td>
                        <div className="panel-table__primary">{order.route}</div>
                        <div className="panel-table__secondary">{order.date}</div>
                      </td>
                      <td>{formatINR(order.fare)}</td>
                      <td>
                        <StatusPill status={order.status} tone={slugStatus(order.status)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <section className="panel-section">
            <h3 className="panel-section__title">
              <MessageSquareWarning size={15} strokeWidth={1.75} /> Complaint History
            </h3>
            {customer.complaints.length === 0 ? (
              <p className="panel-section__meta">No complaints on record.</p>
            ) : (
              <div className="panel-table-wrap">
                <table className="panel-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Subject</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customer.complaints.map((c) => (
                      <tr key={c.id}>
                        <td className="panel-table__primary">{c.id}</td>
                        <td>
                          <div className="panel-table__primary">{c.subject}</div>
                          {c.resolution ? (
                            <div className="panel-table__secondary">{c.resolution}</div>
                          ) : null}
                        </td>
                        <td>
                          <StatusPill status={c.status} tone={slugStatus(c.status)} />
                        </td>
                        <td>{c.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <section className="panel-section">
            <h3 className="panel-section__title">
              <Gift size={15} strokeWidth={1.75} /> Referral
            </h3>
            <div className="panel-metrics">
              <div className="panel-metric">
                <span className="panel-metric__label">Code</span>
                <strong>{customer.referrals.code || '—'}</strong>
              </div>
              <div className="panel-metric">
                <span className="panel-metric__label">Invites</span>
                <strong>{customer.referrals.invites}</strong>
              </div>
              <div className="panel-metric">
                <span className="panel-metric__label">Earnings</span>
                <strong>{formatINR(customer.referrals.earnings)}</strong>
              </div>
            </div>
          </section>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <section className="panel-section">
            <h3 className="panel-section__title">
              <ThumbsUp size={15} strokeWidth={1.75} /> Reviews
            </h3>
            {customer.reviews.length === 0 ? (
              <p className="panel-section__meta">No reviews yet.</p>
            ) : (
              <ul className="panel-timeline">
                {customer.reviews.map((review) => (
                  <li key={review.id} className="panel-timeline__item">
                    <div>
                      <p className="panel-timeline__text">
                        <Star size={12} strokeWidth={1.75} fill="#f59e0b" color="#f59e0b" />
                        {' '}
                        {review.rating}/5 — {review.comment}
                      </p>
                      <span className="panel-timeline__time">
                        {review.driverName} · {review.date}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <section className="panel-section">
            <h3 className="panel-section__title">
              <IndianRupee size={15} strokeWidth={1.75} /> Lifetime Spending
            </h3>
            <div className="panel-wallet-balance">
              <span>Total spend</span>
              <strong>{formatINR(customer.lifetimeSpend)}</strong>
            </div>
            <div className="panel-spending-bars">
              {customer.spendingByMonth.map((month) => (
                <div key={month.month} className="panel-spending-bar">
                  <span className="panel-spending-bar__label">{month.month}</span>
                  <div className="panel-spending-bar__track">
                    <div
                      className="panel-spending-bar__fill"
                      style={{ width: `${(month.amount / maxSpend) * 100}%` }}
                    />
                  </div>
                  <span className="panel-spending-bar__value">{formatINR(month.amount)}</span>
                </div>
              ))}
            </div>
          </section>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <section className="panel-section">
            <h3 className="panel-section__title">
              <Activity size={15} strokeWidth={1.75} /> Recent Activity
            </h3>
            <ul className="panel-activity">
              {customer.activity.map((item, i) => (
                <li key={i}>
                  <span className="panel-activity__dot" aria-hidden />
                  <div>
                    <p>{item.text}</p>
                    <span>{item.time}</span>
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

function flaggedRowToCustomer(row: FlaggedCustomerRow): Customer {
  return {
    id: row.customer_id,
    name: row.customer_name || row.customer_phone,
    phone: row.customer_phone,
    email: '',
    city: row.customer_city || 'Nashik',
    orders: row.total_bookings,
    lifetimeSpend: 0,
    wallet: 0,
    rating: 4.5,
    status: (row.customer_status === 'Active' ? 'Active' : 'Inactive') as CustomerStatus,
    joined: row.created_at ? new Date(row.created_at).toLocaleDateString('en-IN') : '—',
    initials: (row.customer_name || 'CU').slice(0, 2).toUpperCase(),
    accent: '#dc2626',
    addresses: [],
    complaints: [],
    referrals: { code: '', invites: 0, successful: 0, earnings: 0, recent: [] },
    reviews: [],
    recentOrders: [],
    activity: [],
    walletHistory: [],
    spendingByMonth: [],
    abuseInfo: {
      isFlagged: row.status === 'active',
      activeFlagsCount: row.status === 'active' ? 1 : 0,
      highestSeverity: row.severity,
      flagId: row.flag_id,
      cancellations24h: row.cancellations_24h,
      cancellations7d: row.cancellations_7d,
      totalBookings: row.total_bookings,
      customerCancellations: row.customer_cancellations,
      driverCancellations: row.driver_cancellations,
      completedBookings: row.completed_bookings,
      cancellationRate: row.cancellation_rate,
      lastCancelledAt: row.last_cancelled_at,
      ruleLabel: row.rule_label,
      adminNotes: row.admin_notes,
      flagStatus: row.status,
      recentHistory: row.recent_history,
    },
  }
}

export default function Customers() {
  const { t } = useAdminLanguage()
  const { toast } = useToast()

  // View state: 'all' = all customers, 'flagged' = abuse flags
  const [activeView, setActiveView] = useState<'all' | 'flagged'>('all')

  // All customers query
  const { data: customers, loading, error, refetch: refetchCustomers } = useAsyncData(fetchCustomers, [])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<(typeof customerStatuses)[number]>('All Status')
  const [cityFilter, setCityFilter] = useState<(typeof customerCities)[number]>(customerCities[0])
  const [page, setPage] = useState(1)

  // Flagged customers state
  const [flaggedRows, setFlaggedRows] = useState<FlaggedCustomerRow[]>([])
  const [flaggedLoading, setFlaggedLoading] = useState(false)
  const [flagStatusFilter, setFlagStatusFilter] = useState<'active' | 'reviewed' | 'resolved' | 'dismissed' | 'all'>('active')
  const [flagSeverityFilter, setFlagSeverityFilter] = useState<'all' | 'warning' | 'high' | 'review'>('all')
  const [flagPage, setFlagPage] = useState(1)
  const [activeFlagCount, setActiveFlagCount] = useState<number>(0)

  // Selected customer & side panel
  const [selected, setSelected] = useState<Customer | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)

  // Confirmation dialog for review/dismiss
  const [actionConfirm, setActionConfirm] = useState<{
    open: boolean
    flagId: string
    action: 'review' | 'dismiss'
    customerName: string
  } | null>(null)

  const loadFlagged = async (statusParam = flagStatusFilter) => {
    setFlaggedLoading(true)
    try {
      const data = await fetchPortalFlaggedCustomers(statusParam)
      setFlaggedRows(data)
      if (statusParam === 'active') {
        setActiveFlagCount(data.length)
      }
    } catch {
      toast({ title: 'Fetch Error', description: 'Could not load flagged customers.', tone: 'error' })
    } finally {
      setFlaggedLoading(false)
    }
  }

  // Load flagged customers count on mount
  useEffect(() => {
    fetchPortalFlaggedCustomers('active')
      .then((data) => setActiveFlagCount(data.length))
      .catch(() => {})
  }, [])

  // When switching to flagged view or changing flag status filter
  useEffect(() => {
    if (activeView === 'flagged') {
      loadFlagged(flagStatusFilter)
    }
  }, [activeView, flagStatusFilter])

  // Filtered all customers
  const filtered = useMemo(() => {
    if (!customers) return []
    const q = search.trim().toLowerCase()
    return customers.filter((customer) => {
      const matchesSearch =
        !q ||
        customer.name.toLowerCase().includes(q) ||
        customer.id.toLowerCase().includes(q) ||
        customer.phone.toLowerCase().includes(q) ||
        customer.email.toLowerCase().includes(q) ||
        customer.city.toLowerCase().includes(q)

      const matchesStatus =
        statusFilter === 'All Status' || customer.status === statusFilter
      const matchesCity = cityFilter === 'All Cities' || customer.city === cityFilter

      return matchesSearch && matchesStatus && matchesCity
    })
  }, [customers, search, statusFilter, cityFilter])

  const paged = useMemo(
    () => paginate(filtered, page, PAGE_SIZE),
    [filtered, page],
  )

  // Filtered flagged rows
  const filteredFlagged = useMemo(() => {
    const q = search.trim().toLowerCase()
    return flaggedRows.filter((row) => {
      const matchesSearch =
        !q ||
        row.customer_name.toLowerCase().includes(q) ||
        row.customer_phone.toLowerCase().includes(q) ||
        row.customer_id.toLowerCase().includes(q) ||
        row.customer_city.toLowerCase().includes(q) ||
        row.rule_label.toLowerCase().includes(q)

      const matchesSeverity =
        flagSeverityFilter === 'all' || row.severity === flagSeverityFilter

      return matchesSearch && matchesSeverity
    })
  }, [flaggedRows, search, flagSeverityFilter])

  const pagedFlagged = useMemo(
    () => paginate(filteredFlagged, flagPage, PAGE_SIZE),
    [filteredFlagged, flagPage],
  )

  const openCustomer = (customer: Customer) => {
    setSelected(customer)
    setPanelOpen(true)
  }

  const openFlaggedCustomer = (row: FlaggedCustomerRow) => {
    setSelected(flaggedRowToCustomer(row))
    setPanelOpen(true)
  }

  const handleFlagActionClick = (flagId: string, action: 'review' | 'dismiss', customerName = 'this customer') => {
    setActionConfirm({
      open: true,
      flagId,
      action,
      customerName,
    })
  }

  const handleConfirmAction = async (notes?: string) => {
    if (!actionConfirm) return
    const { flagId, action, customerName } = actionConfirm

    try {
      const res = await reviewPortalFlaggedCustomer(flagId, action, notes || '')
      if (res.success) {
        toast({
          title: action === 'review' ? 'Flag Marked as Reviewed' : 'Flag Dismissed',
          description: `Successfully updated cancellation abuse flag for ${customerName}.`,
          tone: 'success',
        })
        loadFlagged(flagStatusFilter)
        refetchCustomers()
        if (selected && selected.abuseInfo?.flagId === flagId) {
          setSelected((prev) =>
            prev
              ? {
                  ...prev,
                  abuseInfo: {
                    ...prev.abuseInfo!,
                    flagStatus: action === 'review' ? 'reviewed' : 'dismissed',
                    adminNotes: notes || prev.abuseInfo?.adminNotes || '',
                  },
                }
              : null,
          )
        }
      } else {
        toast({
          title: 'Action Failed',
          description: 'Could not update abuse flag. Please try again.',
          tone: 'error',
        })
      }
    } catch {
      toast({
        title: 'Action Error',
        description: 'An unexpected error occurred while updating the abuse flag.',
          tone: 'error',
      })
    } finally {
      setActionConfirm(null)
    }
  }

  const handleExport = () => {
    if (activeView === 'flagged') {
      exportCsv(
        'carryoo-flagged-customers.csv',
        [
          'Flag ID', 'Customer ID', 'Name', 'Phone', 'City', 'Rule',
          'Severity', 'Status', '24h Cancels', '7d Cancels', '30d Rate', 'Created At',
        ],
        filteredFlagged.map((r) => [
          r.flag_id, r.customer_id, r.customer_name, r.customer_phone, r.customer_city,
          r.rule_label, r.severity, r.status, r.cancellations_24h, r.cancellations_7d,
          `${r.cancellation_rate}%`, r.created_at || '—',
        ]),
      )
      toast({ title: 'Export complete', description: `${filteredFlagged.length} flagged records exported.`, tone: 'success' })
      return
    }

    exportCsv(
      'carryoo-customers.csv',
      [
        'Customer ID', 'Name', 'Phone', 'Email', 'City', 'Orders',
        'Lifetime Spend', 'Wallet', 'Rating', 'Status', 'Joined', 'Flagged',
      ],
      filtered.map((c) => [
        c.id, c.name, c.phone, c.email, c.city, c.orders,
        c.lifetimeSpend, c.wallet, c.rating, c.status, c.joined,
        c.abuseInfo?.isFlagged ? 'Yes' : 'No',
      ]),
    )
    toast({ title: 'Export complete', description: `${filtered.length} customers exported.`, tone: 'success' })
  }

  const clearFilters = () => {
    setSearch('')
    if (activeView === 'flagged') {
      setFlagStatusFilter('active')
      setFlagSeverityFilter('all')
      setFlagPage(1)
    } else {
      setStatusFilter('All Status')
      setCityFilter('All Cities')
      setPage(1)
    }
  }

  if (loading && !customers) return <CustomersSkeleton />

  if (error && !customers) {
    return (
      <div className="cy-table-card">
        <EmptyState
          icon={<Users size={24} strokeWidth={1.75} />}
          title="Unable to load customers"
          description={error ?? 'Could not fetch the customer directory.'}
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
    <div className="customers-page cy-page">
      <PageHeader
        title={t('pages.customers.title')}
        subtitle={t('pages.customers.subtitle')}
        crumbs={[
          { label: 'Home', to: '/' },
          { label: 'Customers' },
        ]}
        actions={
          <Button variant="primary" onClick={() => toast({ title: 'Add Customer', description: 'Customer onboarding form coming soon.', tone: 'info' })}>
            <Plus size={16} strokeWidth={1.75} />
            Add Customer
          </Button>
        }
      />

      {/* View Switcher: All Customers vs Flagged Customers */}
      <div className="customers-view-tabs" role="tablist" aria-label="Customer directory view">
        <button
          type="button"
          role="tab"
          aria-selected={activeView === 'all'}
          className={`customers-view-tab ${activeView === 'all' ? 'is-active' : ''}`}
          onClick={() => {
            setActiveView('all')
            setSearch('')
          }}
        >
          <Users size={15} strokeWidth={1.75} />
          All Customers
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeView === 'flagged'}
          className={`customers-view-tab ${activeView === 'flagged' ? 'is-active' : ''}`}
          onClick={() => {
            setActiveView('flagged')
            setSearch('')
          }}
        >
          <ShieldAlert size={15} strokeWidth={1.75} />
          Flagged for Cancellations
          {activeFlagCount > 0 ? (
            <span className="customers-view-tab__badge" title={`${activeFlagCount} active flags`}>
              {activeFlagCount}
            </span>
          ) : null}
        </button>
      </div>

      <div className="cy-page__toolbar">
        <div className="cy-page__toolbar-left">
          <SearchInput
            value={search}
            onChange={(v) => {
              setSearch(v)
              if (activeView === 'flagged') setFlagPage(1)
              else setPage(1)
            }}
            placeholder={
              activeView === 'flagged'
                ? 'Search flagged customers by name, phone, city, rule…'
                : 'Search by name, ID, phone, email…'
            }
            className="customers-search"
            aria-label="Search customers"
          />

          <div className="cy-page__filters">
            <span className="cy-page__filters-label">
              <Filter size={14} strokeWidth={1.75} aria-hidden /> Filters
            </span>

            {activeView === 'flagged' ? (
              <>
                <select
                  className="cy-select"
                  value={flagStatusFilter}
                  onChange={(e) => {
                    setFlagStatusFilter(e.target.value as typeof flagStatusFilter)
                    setFlagPage(1)
                  }}
                  aria-label="Filter by flag status"
                >
                  <option value="active">Active Flags</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="dismissed">Dismissed</option>
                  <option value="resolved">Resolved</option>
                  <option value="all">All Statuses</option>
                </select>

                <select
                  className="cy-select"
                  value={flagSeverityFilter}
                  onChange={(e) => {
                    setFlagSeverityFilter(e.target.value as typeof flagSeverityFilter)
                    setFlagPage(1)
                  }}
                  aria-label="Filter by severity"
                >
                  <option value="all">All Severities</option>
                  <option value="warning">Warning</option>
                  <option value="high">High</option>
                  <option value="review">Review</option>
                </select>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => loadFlagged(flagStatusFilter)}
                  title="Refresh flagged customers"
                >
                  <RotateCcw size={14} /> Refresh
                </Button>
              </>
            ) : (
              <>
                <select
                  className="cy-select"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as (typeof customerStatuses)[number])
                    setPage(1)
                  }}
                  aria-label="Filter by status"
                >
                  {customerStatuses.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
                <select
                  className="cy-select"
                  value={cityFilter}
                  onChange={(e) => {
                    setCityFilter(e.target.value as (typeof customerCities)[number])
                    setPage(1)
                  }}
                  aria-label="Filter by city"
                >
                  {customerCities.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </>
            )}
          </div>
        </div>

        <div className="cy-page__toolbar-right">
          <Button variant="secondary" onClick={handleExport}>
            <Download size={16} strokeWidth={1.75} />
            Export
          </Button>
          <Button
            variant="primary"
            onClick={() => toast({ title: 'Add Customer', description: 'Customer onboarding form coming soon.', tone: 'info' })}
          >
            <Plus size={16} strokeWidth={1.75} />
            Add Customer
          </Button>
        </div>
      </div>

      <div className="cy-page__meta">
        {activeView === 'flagged' ? (
          <span>
            Showing <strong>{pagedFlagged.items.length}</strong> of {filteredFlagged.length} flagged records
            {filteredFlagged.length !== flaggedRows.length ? ` (${flaggedRows.length} total)` : ''}
          </span>
        ) : (
          <span>
            Showing <strong>{paged.items.length}</strong> of {filtered.length} customers
            {customers && filtered.length !== customers.length ? ` (${customers.length} total)` : ''}
          </span>
        )}
      </div>

      {/* TABLE VIEW */}
      {activeView === 'flagged' ? (
        <div className="cy-table-card">
          {flaggedLoading ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--cy-text-muted)' }}>
              Loading flagged customers…
            </div>
          ) : filteredFlagged.length === 0 ? (
            <EmptyState
              icon={<ShieldAlert size={24} strokeWidth={1.75} />}
              title="No flagged customers found"
              description="There are currently no customers exceeding cancellation thresholds under selected filters."
              action={
                <Button variant="secondary" onClick={clearFilters}>
                  Clear filters
                </Button>
              }
            />
          ) : (
            <div className="cy-table-wrap">
              <table className="cy-table flagged-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Phone</th>
                    <th>Rule Triggered</th>
                    <th>Severity</th>
                    <th>24h Cancels</th>
                    <th>7d Cancels</th>
                    <th>30d Rate</th>
                    <th>Last Cancelled</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedFlagged.items.map((row) => (
                    <tr
                      key={row.flag_id}
                      className="cy-table__row"
                      onClick={() => openFlaggedCustomer(row)}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          openFlaggedCustomer(row)
                        }
                      }}
                    >
                      <td>
                        <div className="customer-cell">
                          <div
                            className="customer-cell__avatar"
                            style={{
                              background: row.severity === 'high' ? '#fee2e2' : '#fef3c7',
                              color: row.severity === 'high' ? '#dc2626' : '#b45309',
                            }}
                            aria-hidden
                          >
                            {(row.customer_name || 'CU').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="cy-table__primary">{row.customer_name}</div>
                            <div className="cy-table__secondary">{row.customer_city || 'Nashik'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="cy-table__mono">{row.customer_phone}</td>
                      <td>
                        <div style={{ maxWidth: 220, fontSize: 12.5, fontWeight: 500 }}>
                          {row.rule_label}
                        </div>
                      </td>
                      <td>
                        <StatusPill
                          status={row.severity.toUpperCase()}
                          tone={severityTone[row.severity]}
                        />
                      </td>
                      <td className="cy-table__mono">
                        <span style={{ fontWeight: 700, color: row.cancellations_24h >= 3 ? '#d97706' : 'inherit' }}>
                          {row.cancellations_24h}
                        </span>
                      </td>
                      <td className="cy-table__mono">
                        <span style={{ fontWeight: 700, color: row.cancellations_7d >= 5 ? '#dc2626' : 'inherit' }}>
                          {row.cancellations_7d}
                        </span>
                      </td>
                      <td className="cy-table__mono">
                        <span>{row.cancellation_rate}%</span>
                        <span style={{ fontSize: 11, color: 'var(--cy-text-muted)', marginLeft: 4 }}>
                          ({row.customer_cancellations}/{row.total_bookings})
                        </span>
                      </td>
                      <td>
                        {row.last_cancelled_at
                          ? new Date(row.last_cancelled_at).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '—'}
                      </td>
                      <td>
                        <StatusPill
                          status={row.status.charAt(0).toUpperCase() + row.status.slice(1)}
                          tone={
                            row.status === 'active'
                              ? 'active'
                              : row.status === 'reviewed'
                                ? 'reviewed'
                                : row.status === 'dismissed'
                                  ? 'dismissed'
                                  : 'resolved'
                          }
                        />
                      </td>
                      <td>
                        <div className="cy-actions" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            className="cy-action-btn"
                            title="View details"
                            aria-label={`View ${row.customer_name}`}
                            onClick={() => openFlaggedCustomer(row)}
                          >
                            <Eye size={15} strokeWidth={1.75} />
                          </button>
                          {row.status === 'active' ? (
                            <>
                              <button
                                type="button"
                                className="cy-action-btn"
                                title="Mark as Reviewed"
                                aria-label={`Mark ${row.customer_name} reviewed`}
                                onClick={() => handleFlagActionClick(row.flag_id, 'review', row.customer_name)}
                              >
                                <CheckCircle2 size={15} strokeWidth={1.75} color="#059669" />
                              </button>
                              <button
                                type="button"
                                className="cy-action-btn"
                                title="Dismiss Flag"
                                aria-label={`Dismiss flag for ${row.customer_name}`}
                                onClick={() => handleFlagActionClick(row.flag_id, 'dismiss', row.customer_name)}
                              >
                                <XCircle size={15} strokeWidth={1.75} color="#dc2626" />
                              </button>
                            </>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="cy-table-card">
          {filtered.length === 0 ? (
            <EmptyState
              icon={<Users size={24} strokeWidth={1.75} />}
              title="No customers found"
              description="Try adjusting search or filters to find customers in your network."
              action={
                <Button variant="secondary" onClick={clearFilters}>
                  Clear filters
                </Button>
              }
            />
          ) : (
            <div className="cy-table-wrap">
              <table className="cy-table customers-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Phone</th>
                    <th>City</th>
                    <th>Orders</th>
                    <th>Lifetime Spend</th>
                    <th>Wallet</th>
                    <th>Rating</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.items.map((customer) => (
                    <tr
                      key={customer.id}
                      className="cy-table__row"
                      onClick={() => openCustomer(customer)}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          openCustomer(customer)
                        }
                      }}
                    >
                      <td>
                        <div className="customer-cell">
                          <div
                            className="customer-cell__avatar"
                            style={{
                              background: `${customer.accent}18`,
                              color: customer.accent,
                            }}
                            aria-hidden
                          >
                            {customer.initials}
                          </div>
                          <div>
                            <div className="cy-table__primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              {customer.name}
                              {customer.abuseInfo?.isFlagged ? (
                                <span title="Excessive cancellation flag active">
                                  <AlertTriangle size={13} color="#d97706" />
                                </span>
                              ) : null}
                            </div>
                            <div className="cy-table__secondary">{customer.id}</div>
                          </div>
                        </div>
                      </td>
                      <td>{customer.phone}</td>
                      <td>{customer.city}</td>
                      <td className="cy-table__mono">{customer.orders.toLocaleString('en-IN')}</td>
                      <td className="cy-table__mono customers-spend">
                        {formatINR(customer.lifetimeSpend)}
                      </td>
                      <td className="cy-table__mono customers-wallet">
                        {formatINR(customer.wallet)}
                      </td>
                      <td>
                        <span className="customer-rating">
                          <Star size={12} strokeWidth={1.75} fill="#f59e0b" color="#f59e0b" />
                          {customer.rating.toFixed(1)}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <StatusPill status={customer.status} tone={statusTone[customer.status]} />
                          {customer.abuseInfo?.isFlagged ? (
                            <StatusPill
                              status={
                                customer.abuseInfo.highestSeverity === 'high'
                                  ? 'High Flag'
                                  : customer.abuseInfo.highestSeverity === 'review'
                                    ? 'Review'
                                    : 'Flagged'
                              }
                              tone={
                                customer.abuseInfo.highestSeverity === 'high'
                                  ? 'danger'
                                  : customer.abuseInfo.highestSeverity === 'review'
                                    ? 'review'
                                    : 'warning'
                              }
                            />
                          ) : null}
                        </div>
                      </td>
                      <td>{customer.joined}</td>
                      <td>
                        <div className="cy-actions" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            className="cy-action-btn"
                            title="View profile"
                            aria-label={`View ${customer.name}`}
                            onClick={() => openCustomer(customer)}
                          >
                            <Eye size={15} strokeWidth={1.75} />
                          </button>
                          <button
                            type="button"
                            className="cy-action-btn"
                            title="More actions"
                            aria-label={`More actions for ${customer.name}`}
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
      )}

      {/* PAGINATION */}
      {activeView === 'flagged' ? (
        filteredFlagged.length > 0 ? (
          <Pagination
            page={pagedFlagged.page}
            totalPages={pagedFlagged.totalPages}
            total={pagedFlagged.total}
            pageSize={PAGE_SIZE}
            onPageChange={setFlagPage}
          />
        ) : null
      ) : (
        filtered.length > 0 ? (
          <Pagination
            page={paged.page}
            totalPages={paged.totalPages}
            total={paged.total}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        ) : null
      )}

      {/* SIDE PANEL */}
      <SidePanel
        open={panelOpen}
        title={selected ? selected.name : 'Customer'}
        onClose={() => setPanelOpen(false)}
        width={540}
      >
        {selected ? (
          <CustomerPanel
            customer={selected}
            onFlagAction={(flagId, action) => handleFlagActionClick(flagId, action, selected.name)}
            onBlockChanged={(blocked, reason) => {
              setSelected((current) =>
                current ? { ...current, status: blocked ? 'Blocked' : 'Active', blockReason: reason } : current,
              )
              void refetchCustomers()
            }}
          />
        ) : null}
      </SidePanel>

      {/* CONFIRMATION DIALOG */}
      {actionConfirm ? (
        <ConfirmDialog
          open={actionConfirm.open}
          title={actionConfirm.action === 'review' ? 'Mark Abuse Flag as Reviewed' : 'Dismiss Abuse Flag'}
          description={
            actionConfirm.action === 'review'
              ? `You are marking the cancellation abuse flag for ${actionConfirm.customerName} as reviewed. You can optionally add notes for your team.`
              : `You are dismissing the cancellation abuse flag for ${actionConfirm.customerName}. It will no longer appear as active.`
          }
          confirmLabel={actionConfirm.action === 'review' ? 'Mark as Reviewed' : 'Dismiss Flag'}
          tone={actionConfirm.action === 'review' ? 'primary' : 'danger'}
          withReason={true}
          reasonLabel="Admin Notes"
          reasonPlaceholder="Enter resolution notes, customer contact outcome, or reason for dismissal…"
          onConfirm={handleConfirmAction}
          onClose={() => setActionConfirm(null)}
        />
      ) : null}
    </div>
  )
}
