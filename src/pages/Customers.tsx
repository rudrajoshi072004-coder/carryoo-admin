import { useMemo, useState } from 'react'
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
import { formatINR, exportCsv, paginate, slugStatus } from '../lib/utils'
import { fetchCustomersAdmin } from '../api/services/adminData'
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

function CustomerPanel({ customer }: { customer: Customer }) {
  const maxSpend = Math.max(...customer.spendingByMonth.map((m) => m.amount), 1)

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
        <StatusPill status={customer.status} tone={statusTone[customer.status]} />
      </div>

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
                  <Mail size={13} strokeWidth={1.75} /> {customer.email}
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
                <strong>{customer.referrals.code}</strong>
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
            {customer.referrals.recent.length > 0 ? (
              <div className="panel-table-wrap" style={{ marginTop: 12 }}>
                <table className="panel-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customer.referrals.recent.map((ref, i) => (
                      <tr key={i}>
                        <td className="panel-table__primary">{ref.name}</td>
                        <td>{ref.date}</td>
                        <td>
                          <StatusPill status={ref.status} tone={slugStatus(ref.status)} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
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

export default function Customers() {
  const { toast } = useToast()
  const { data: customers, loading, error } = useAsyncData(fetchCustomers, [])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<(typeof customerStatuses)[number]>('All Status')
  const [cityFilter, setCityFilter] = useState<(typeof customerCities)[number]>(customerCities[0])
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Customer | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)

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

  const openCustomer = (customer: Customer) => {
    setSelected(customer)
    setPanelOpen(true)
  }

  const handleExport = () => {
    exportCsv(
      'carryoo-customers.csv',
      [
        'Customer ID', 'Name', 'Phone', 'Email', 'City', 'Orders',
        'Lifetime Spend', 'Wallet', 'Rating', 'Status', 'Joined',
      ],
      filtered.map((c) => [
        c.id, c.name, c.phone, c.email, c.city, c.orders,
        c.lifetimeSpend, c.wallet, c.rating, c.status, c.joined,
      ]),
    )
    toast({ title: 'Export complete', description: `${filtered.length} customers exported.`, tone: 'success' })
  }

  const clearFilters = () => {
    setSearch('')
    setStatusFilter('All Status')
    setCityFilter('All Cities')
    setPage(1)
  }

  if (loading) return <CustomersSkeleton />

  if (error || !customers) {
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
        title="Customers"
        subtitle="View and manage customer profiles, wallets, and activity."
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

      <div className="cy-page__toolbar">
        <div className="cy-page__toolbar-left">
          <SearchInput
            value={search}
            onChange={(v) => {
              setSearch(v)
              setPage(1)
            }}
            placeholder="Search by name, ID, phone, email…"
            className="customers-search"
            aria-label="Search customers"
          />

          <div className="cy-page__filters">
            <span className="cy-page__filters-label">
              <Filter size={14} strokeWidth={1.75} aria-hidden /> Filters
            </span>
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
        <span>
          Showing <strong>{paged.items.length}</strong> of {filtered.length} customers
          {filtered.length !== customers.length ? ` (${customers.length} total)` : ''}
        </span>
      </div>

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
                          <div className="cy-table__primary">{customer.name}</div>
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
                      <StatusPill status={customer.status} tone={statusTone[customer.status]} />
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
        title={selected ? selected.name : 'Customer'}
        onClose={() => setPanelOpen(false)}
        width={520}
      >
        {selected ? <CustomerPanel customer={selected} /> : null}
      </SidePanel>
    </div>
  )
}
