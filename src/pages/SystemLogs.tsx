import { useMemo, useState } from 'react'
import {
  ScrollText,
  Download,
  Filter,
  Eye,
} from 'lucide-react'
import { SidePanel } from '../components/ConfirmDialog'
import { PageHeader, Pagination } from '../components/PageHeader'
import { useToast } from '../components/Toast'
import {
  Button,
  Card,
  EmptyState,
  SearchInput,
  Skeleton,
  StatusPill,
} from '../components/ui'
import { useAsyncData } from '../hooks/useAsyncData'
import { exportCsv, paginate } from '../lib/utils'
import { fetchSystemLogsAdmin } from '../api/services/adminData'
import {
  logCategories,
  logSeverities,
  type LogCategory,
  type SystemLog,
} from '../data/systemLogsData'
import './SystemLogs.css'

const PAGE_SIZE = 10

async function fetchLogs() {
  return fetchSystemLogsAdmin()
}

function SystemLogsSkeleton() {
  return (
    <div className="system-logs-page cy-page" aria-busy="true">
      <div className="system-logs-tabs">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} variant="text" style={{ width: 100, height: 36 }} />
        ))}
      </div>
      <div className="cy-table-card">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="cy-skeleton--row">
            <Skeleton variant="text" style={{ flex: 1 }} />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function SystemLogs() {
  const { toast } = useToast()
  const { data: logs, loading, error } = useAsyncData(fetchLogs, [])

  const [activeTab, setActiveTab] = useState<LogCategory>('login')
  const [search, setSearch] = useState('')
  const [severityFilter, setSeverityFilter] = useState(logSeverities[0])
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<SystemLog | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)

  const tabCounts = useMemo(() => {
    if (!logs) return {} as Record<LogCategory, number>
    return logCategories.reduce(
      (acc, cat) => {
        acc[cat.id] = logs.filter((l) => l.category === cat.id).length
        return acc
      },
      {} as Record<LogCategory, number>,
    )
  }, [logs])

  const filtered = useMemo(() => {
    if (!logs) return []
    const q = search.trim().toLowerCase()
    return logs.filter((log) => {
      const matchesTab = log.category === activeTab
      const matchesSearch =
        !q ||
        log.id.toLowerCase().includes(q) ||
        log.user.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q) ||
        log.ip.includes(q)
      const matchesSeverity = severityFilter === 'All Severity' || log.severity === severityFilter
      return matchesTab && matchesSearch && matchesSeverity
    })
  }, [logs, activeTab, search, severityFilter])

  const paged = useMemo(() => paginate(filtered, page, PAGE_SIZE), [filtered, page])

  const openDetail = (log: SystemLog) => {
    setSelected(log)
    setPanelOpen(true)
  }

  const handleExport = () => {
    if (!filtered.length) {
      toast({ title: 'Nothing to export', description: 'No logs match current filters.', tone: 'warning' })
      return
    }
    exportCsv(
      `carryoo-logs-${activeTab}-${Date.now()}.csv`,
      ['ID', 'Timestamp', 'Severity', 'User', 'Action', 'Resource', 'IP', 'City', 'Details'],
      filtered.map((l) => [l.id, l.timestamp, l.severity, l.user, l.action, l.resource, l.ip, l.city, l.details]),
    )
    toast({ title: 'Export complete', description: `${filtered.length} log entries exported as CSV.` })
  }

  if (loading) return <SystemLogsSkeleton />

  if (error || !logs) {
    return (
      <Card>
        <EmptyState
          icon={<ScrollText size={24} strokeWidth={1.75} />}
          title="Unable to load system logs"
          description={error ?? 'Could not fetch log data.'}
          action={<Button variant="primary" onClick={() => window.location.reload()}>Retry</Button>}
        />
      </Card>
    )
  }

  return (
    <div className="system-logs-page cy-page">
      <PageHeader
        title="System Logs"
        subtitle="Audit trails, login history, API events, and server diagnostics."
        crumbs={[{ label: 'Platform' }, { label: 'System Logs' }]}
        actions={
          <Button variant="secondary" onClick={handleExport}>
            <Download size={16} strokeWidth={1.75} />
            Export CSV
          </Button>
        }
      />

      <div className="system-logs-tabs" role="tablist" aria-label="Log categories">
        {logCategories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            role="tab"
            aria-selected={activeTab === cat.id}
            className={`system-logs-tab ${activeTab === cat.id ? 'is-active' : ''}`}
            onClick={() => { setActiveTab(cat.id); setPage(1) }}
          >
            {cat.label}
            <span className="system-logs-tab__count">{tabCounts[cat.id] ?? 0}</span>
          </button>
        ))}
      </div>

      <div className="cy-page__toolbar">
        <div className="cy-page__toolbar-left">
          <SearchInput
            value={search}
            onChange={(v) => { setSearch(v); setPage(1) }}
            placeholder="Search logs by user, action, IP…"
          />
        </div>
        <div className="cy-page__toolbar-right">
          <div className="cy-page__filters">
            <Filter size={14} strokeWidth={1.75} />
            <select
              value={severityFilter}
              onChange={(e) => { setSeverityFilter(e.target.value as typeof severityFilter); setPage(1) }}
            >
              {logSeverities.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="cy-table-card">
        <div className="cy-table-wrap">
          <table className="cy-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Severity</th>
                <th>User</th>
                <th>Action</th>
                <th>Resource</th>
                <th>IP / City</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="cy-table__empty-cell">
                    <EmptyState
                      icon={<ScrollText size={20} strokeWidth={1.75} />}
                      title="No logs found"
                      description="Try a different category or adjust filters."
                    />
                  </td>
                </tr>
              ) : (
                paged.items.map((log) => (
                  <tr key={log.id} className="cy-table__row" tabIndex={0} onClick={() => openDetail(log)}>
                    <td>
                      <span className="cy-table__mono">{log.timestamp}</span>
                    </td>
                    <td><StatusPill status={log.severity} /></td>
                    <td><span className="cy-table__primary">{log.user}</span></td>
                    <td>{log.action}</td>
                    <td>{log.resource}</td>
                    <td>
                      <span className="cy-table__primary">{log.ip}</span>
                      <span className="cy-table__secondary">{log.city}</span>
                    </td>
                    <td>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); openDetail(log) }}
                      >
                        <Eye size={14} strokeWidth={1.75} />
                        View
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {paged.total > 0 ? (
          <Pagination
            page={paged.page}
            totalPages={paged.totalPages}
            total={paged.total}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        ) : null}
      </div>

      <SidePanel
        open={panelOpen}
        title="Log detail"
        onClose={() => setPanelOpen(false)}
        width={520}
      >
        {selected ? (
          <div className="system-log-detail">
            <div className="system-log-detail__header">
              <StatusPill status={selected.severity} />
              <span className="cy-table__mono">{selected.id}</span>
            </div>
            <dl className="system-log-detail__grid">
              <div><dt>Timestamp</dt><dd>{selected.timestamp}</dd></div>
              <div><dt>User</dt><dd>{selected.user}</dd></div>
              <div><dt>Action</dt><dd>{selected.action}</dd></div>
              <div><dt>Resource</dt><dd>{selected.resource}</dd></div>
              <div><dt>IP address</dt><dd>{selected.ip}</dd></div>
              <div><dt>City</dt><dd>{selected.city}</dd></div>
            </dl>
            <div className="system-log-detail__body">
              <h4>Details</h4>
              <p>{selected.details}</p>
            </div>
            {selected.metadata ? (
              <div className="system-log-detail__meta">
                <h4>Metadata</h4>
                <dl>
                  {Object.entries(selected.metadata).map(([key, val]) => (
                    <div key={key}>
                      <dt>{key}</dt>
                      <dd>{val}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : null}
          </div>
        ) : null}
      </SidePanel>
    </div>
  )
}
