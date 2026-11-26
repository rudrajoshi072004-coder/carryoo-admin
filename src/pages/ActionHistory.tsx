import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, History, RefreshCw } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { Button, EmptyState, SearchInput, Skeleton } from '../components/ui'
import { fetchAbuseAdminActions, type AbuseAdminActionRow } from '../api/services/portal'

const ACTIONS = [
  { id: 'all', label: 'All actions' },
  { id: 'FLAG_REVIEWED', label: 'Flag reviewed' },
  { id: 'FLAG_RESOLVED', label: 'Flag resolved' },
  { id: 'FLAG_DISMISSED', label: 'Flag dismissed' },
  { id: 'USER_BLOCKED', label: 'User blocked' },
  { id: 'USER_UNBLOCKED', label: 'User unblocked' },
]

function formatWhen(value: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
}

function actionLabel(action: string) {
  return ACTIONS.find((item) => item.id === action)?.label || action
}

export default function ActionHistory() {
  const navigate = useNavigate()
  const [rows, setRows] = useState<AbuseAdminActionRow[]>([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [action, setAction] = useState('all')
  const [customer, setCustomer] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')

  async function load(nextPage = page) {
    setLoading(true)
    setError('')
    try {
      const data = await fetchAbuseAdminActions({ action, customer, start, end, page: nextPage })
      setRows(data.results)
      setCount(data.count)
      setPage(data.page)
      setPageSize(data.page_size)
    } catch {
      setRows([])
      setCount(0)
      setError('Could not load action history.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load(1)
    }, customer ? 250 : 0)
    return () => window.clearTimeout(timer)
  }, [action, customer, start, end])

  const totalPages = Math.max(1, Math.ceil(count / pageSize))

  return (
    <div className="cy-page">
      <PageHeader
        title="Action history"
        subtitle="Who reviewed, resolved, dismissed, blocked, or unblocked a customer, and why."
        crumbs={[{ label: 'Dashboard', to: '/' }, { label: 'Action history' }]}
        actions={<Button size="sm" variant="ghost" onClick={() => navigate('/abuse')}>Abuse flags</Button>}
      />

      <div className="cy-page__toolbar">
        <SearchInput
          value={customer}
          onChange={setCustomer}
          placeholder="Customer name, phone, or id"
          aria-label="Filter by customer"
        />
        <select className="cy-select" value={action} onChange={(event) => setAction(event.target.value)} aria-label="Filter by action">
          {ACTIONS.map((item) => (
            <option key={item.id} value={item.id}>{item.label}</option>
          ))}
        </select>
        <input className="cy-select" type="date" value={start} onChange={(event) => setStart(event.target.value)} aria-label="Start date" />
        <input className="cy-select" type="date" value={end} onChange={(event) => setEnd(event.target.value)} aria-label="End date" />
        <Button size="sm" variant="ghost" onClick={() => void load(page)}>
          <RefreshCw size={14} /> Refresh
        </Button>
      </div>

      {loading ? (
        <div aria-busy="true"><Skeleton variant="card" /> Loading action history…</div>
      ) : error ? (
        <EmptyState
          icon={<AlertTriangle size={22} />}
          title="Action history unavailable"
          description={error}
          action={<Button onClick={() => void load(page)}>Try again</Button>}
        />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<History size={22} />}
          title="No admin actions"
          description="No abuse actions match these filters."
        />
      ) : (
        <div className="cy-table-wrap">
          <table className="cy-table">
            <thead>
              <tr>
                <th>Action</th>
                <th>Admin</th>
                <th>Customer</th>
                <th>Flag</th>
                <th>Reason</th>
                <th>When</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{actionLabel(row.action)}</td>
                  <td>{row.actor_name || row.actor_phone || '—'}</td>
                  <td>{row.customer_name || row.customer_phone || '—'}</td>
                  <td>{row.flag_id || '—'}</td>
                  <td>{row.reason || '—'}</td>
                  <td>{formatWhen(row.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {count > pageSize ? (
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <Button size="sm" variant="ghost" disabled={page <= 1} onClick={() => void load(page - 1)}>Previous</Button>
          <span style={{ alignSelf: 'center', fontSize: 13 }}>Page {page} of {totalPages}</span>
          <Button size="sm" variant="ghost" disabled={page >= totalPages} onClick={() => void load(page + 1)}>Next</Button>
        </div>
      ) : null}
    </div>
  )
}
