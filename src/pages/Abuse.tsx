import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, RefreshCw, ShieldAlert } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { ConfirmDialog, SidePanel } from '../components/ConfirmDialog'
import { UserBlockPanel } from '../components/UserBlockPanel'
import { Button, Card, CardBody, EmptyState, SearchInput, Skeleton, StatusPill } from '../components/ui'
import { useToast } from '../components/Toast'
import {
  fetchPortalFlaggedCustomers,
  fetchPortalUserBlockStatus,
  reviewPortalFlaggedCustomer,
  searchPortalUsers,
  type FlaggedCustomerRow,
  type PortalBlockStatus,
} from '../api/services/portal'
import { paginate } from '../lib/utils'
import './Abuse.css'

const PAGE_SIZE = 8

const RULES = [
  { id: 'all', label: 'All rules' },
  { id: 'cust_cancel_3_in_24h', label: '3 cancellations in 24 hours' },
  { id: 'cust_cancel_5_in_7d', label: '5 cancellations in 7 days' },
  { id: 'cust_cancel_high_rate_50pct', label: 'Cancellation rate above 50%' },
] as const

function formatWhen(value: string | null) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
}

function severityTone(severity: string) {
  if (severity === 'high') return 'danger'
  if (severity === 'review') return 'review'
  return 'warning'
}

export default function Abuse() {
  const { toast } = useToast()
  const navigate = useNavigate()
  const [rows, setRows] = useState<FlaggedCustomerRow[]>([])
  const [overview, setOverview] = useState({ active: 0, high: 0, review: 0, blocked: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('active')
  const [severity, setSeverity] = useState('all')
  const [rule, setRule] = useState('all')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<FlaggedCustomerRow | null>(null)
  const [blockStatus, setBlockStatus] = useState<PortalBlockStatus | null>(null)
  const [blockState, setBlockState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [action, setAction] = useState<'review' | 'resolve' | 'dismiss' | null>(null)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const [list, active, high, review, blocked] = await Promise.all([
        fetchPortalFlaggedCustomers(status, { severity, search }),
        fetchPortalFlaggedCustomers('active'),
        fetchPortalFlaggedCustomers('active', { severity: 'high' }),
        fetchPortalFlaggedCustomers('active', { severity: 'review' }),
        searchPortalUsers('', true),
      ])
      setRows(list)
      setOverview({
        active: active.length,
        high: high.length,
        review: review.length,
        blocked: blocked.length,
      })
    } catch {
      setError('Could not load abuse flags.')
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load()
    }, search ? 250 : 0)
    return () => window.clearTimeout(timer)
  }, [status, severity, search])

  useEffect(() => {
    if (!selected) {
      setBlockStatus(null)
      setBlockState('idle')
      return
    }
    let cancelled = false
    setBlockState('loading')
    fetchPortalUserBlockStatus(selected.customer_id)
      .then((status) => {
        if (!cancelled) {
          setBlockStatus(status)
          setBlockState('ready')
        }
      })
      .catch(() => {
        if (!cancelled) {
          setBlockStatus(null)
          setBlockState('error')
        }
      })
    return () => {
      cancelled = true
    }
  }, [selected])

  const filtered = useMemo(
    () => rows.filter((row) => rule === 'all' || row.rule_identifier === rule),
    [rows, rule],
  )
  const paged = paginate(filtered, page, PAGE_SIZE)

  useEffect(() => {
    setPage(1)
  }, [status, severity, search, rule])

  async function confirmAction(notes?: string) {
    if (!selected || !action) return
    const result = await reviewPortalFlaggedCustomer(selected.flag_id, action, notes || '')
    setAction(null)
    if (!result.success) {
      toast({ title: 'Update failed', description: 'The flag could not be updated.', tone: 'error' })
      return
    }
    toast({ title: 'Flag updated', description: `${selected.customer_name} marked ${action}.`, tone: 'success' })
    setSelected(null)
    void load()
  }

  return (
    <div className="cy-page">
      <PageHeader
        title="Abuse dashboard"
        subtitle="Review cancellation flags, customer warnings context, and account blocks."
        crumbs={[{ label: 'Dashboard', to: '/' }, { label: 'Abuse' }]}
        actions={<Button size="sm" variant="ghost" onClick={() => navigate('/action-history')}>Action history</Button>}
      />

      <div className="abuse-kpis">
        {[
          ['Active flags', overview.active],
          ['High severity', overview.high],
          ['Needs review', overview.review],
          ['Blocked users', overview.blocked],
        ].map(([label, value]) => (
          <Card key={String(label)}>
            <CardBody>
              <span className="abuse-kpi__label">{label}</span>
              <span className="abuse-kpi__value">{loading ? '-' : value}</span>
            </CardBody>
          </Card>
        ))}
      </div>

      <div className="cy-page__toolbar">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by name or phone"
          aria-label="Search flagged customers"
        />
        <select className="cy-select" value={severity} onChange={(event) => setSeverity(event.target.value)} aria-label="Filter by severity">
          <option value="all">All severities</option>
          <option value="warning">Warning</option>
          <option value="high">High</option>
          <option value="review">Review</option>
        </select>
        <select className="cy-select" value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter by status">
          <option value="active">Active</option>
          <option value="reviewed">Reviewed</option>
          <option value="resolved">Resolved</option>
          <option value="dismissed">Dismissed</option>
          <option value="all">All statuses</option>
        </select>
        <select className="cy-select" value={rule} onChange={(event) => setRule(event.target.value)} aria-label="Filter by rule">
          {RULES.map((item) => (
            <option key={item.id} value={item.id}>{item.label}</option>
          ))}
        </select>
        <Button size="sm" variant="ghost" onClick={() => void load()}>
          <RefreshCw size={14} /> Refresh
        </Button>
      </div>

      {loading ? (
        <Card><CardBody><Skeleton variant="card" /> Loading abuse flags...</CardBody></Card>
      ) : error ? (
        <EmptyState
          icon={<AlertTriangle size={22} />}
          title="Abuse flags unavailable"
          description={error}
          action={<Button onClick={() => void load()}>Try again</Button>}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<ShieldAlert size={22} />}
          title="No flagged customers"
          description="No abuse flags match these filters."
        />
      ) : (
        <div className="cy-table-wrap">
          <table className="cy-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Phone</th>
                <th>Rule</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Cancellations</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {paged.items.map((row) => (
                <tr key={row.flag_id} onClick={() => setSelected(row)} style={{ cursor: 'pointer' }}>
                  <td>{row.customer_name}</td>
                  <td>{row.customer_phone}</td>
                  <td>{row.rule_label || row.rule_identifier}</td>
                  <td><StatusPill status={row.severity} tone={severityTone(row.severity)} /></td>
                  <td><StatusPill status={row.status} /></td>
                  <td>
                    {row.cancellations_24h} in 24h · {row.cancellations_7d} in 7d · {row.cancellation_rate}%
                  </td>
                  <td>{formatWhen(row.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filtered.length > PAGE_SIZE ? (
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <Button size="sm" variant="ghost" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Previous</Button>
          <span style={{ alignSelf: 'center', fontSize: 13 }}>Page {paged.page} of {paged.totalPages}</span>
          <Button size="sm" variant="ghost" disabled={page >= paged.totalPages} onClick={() => setPage((current) => current + 1)}>Next</Button>
        </div>
      ) : null}

      <SidePanel open={Boolean(selected)} title={selected?.customer_name || 'Flag'} onClose={() => setSelected(null)} width={560}>
        {selected ? (
          <div className="abuse-detail">
            <div>
              <StatusPill status={selected.severity} tone={severityTone(selected.severity)} />{' '}
              <StatusPill status={selected.status} />
            </div>
            <p>{selected.customer_phone} · {selected.customer_city}</p>
            <p><strong>Rule:</strong> {selected.rule_label || selected.rule_identifier}</p>
            <p><strong>Review:</strong> {selected.status}{selected.reviewed_at ? ` · ${formatWhen(selected.reviewed_at)}` : ''}{selected.reviewed_by_phone ? ` · ${selected.reviewed_by_phone}` : ''}</p>
            <div className="abuse-detail__stats">
              <div className="abuse-detail__stat"><span>24h cancellations</span><strong>{selected.cancellations_24h}</strong></div>
              <div className="abuse-detail__stat"><span>7d cancellations</span><strong>{selected.cancellations_7d}</strong></div>
              <div className="abuse-detail__stat"><span>30d rate</span><strong>{selected.cancellation_rate}%</strong></div>
              <div className="abuse-detail__stat"><span>Customer cancels</span><strong>{selected.customer_cancellations}</strong></div>
              <div className="abuse-detail__stat"><span>Bookings</span><strong>{selected.total_bookings}</strong></div>
              <div className="abuse-detail__stat"><span>Completed</span><strong>{selected.completed_bookings}</strong></div>
            </div>
            {selected.admin_notes ? <p><strong>Notes:</strong> {selected.admin_notes}</p> : null}
            <p className="abuse-note">
              A customer warning is stored when this flag is first created. The warning message is shown in the customer app. This admin API does not return the warning text.
            </p>
            <p>
              <strong>Block status:</strong>{' '}
              {blockState === 'ready' && blockStatus
                ? (blockStatus.is_blocked ? `Blocked - ${blockStatus.block_reason || 'No reason'}` : 'Not blocked')
                : blockState === 'error'
                  ? 'Unavailable'
                  : 'Loading...'}
            </p>
            {selected.status === 'active' ? (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Button size="sm" onClick={() => setAction('review')}>Mark reviewed</Button>
                <Button size="sm" onClick={() => setAction('resolve')}>Resolve</Button>
                <Button size="sm" variant="ghost" onClick={() => setAction('dismiss')}>Dismiss</Button>
              </div>
            ) : null}
            <UserBlockPanel
              userId={selected.customer_id}
              onChanged={() => {
                void fetchPortalUserBlockStatus(selected.customer_id)
                  .then((status) => {
                    setBlockStatus(status)
                    setBlockState('ready')
                  })
                  .catch(() => {
                    setBlockStatus(null)
                    setBlockState('error')
                  })
                void load()
              }}
            />
          </div>
        ) : null}
      </SidePanel>

      <ConfirmDialog
        open={Boolean(action && selected)}
        title={action === 'dismiss' ? 'Dismiss flag' : action === 'resolve' ? 'Resolve flag' : 'Mark flag reviewed'}
        description={`This updates the abuse flag for ${selected?.customer_name || 'this customer'}.`}
        confirmLabel={action === 'dismiss' ? 'Dismiss' : action === 'resolve' ? 'Resolve' : 'Mark reviewed'}
        tone={action === 'dismiss' ? 'danger' : 'primary'}
        onConfirm={(notes) => void confirmAction(notes)}
        onClose={() => setAction(null)}
      />
    </div>
  )
}
