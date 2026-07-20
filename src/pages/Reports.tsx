import { useMemo, useState } from 'react'
import {
  FileText,
  Download,
  Users,
  Route,
  Wallet,
  Receipt,
  Percent,
  IndianRupee,
  Truck,
  FileSpreadsheet,
} from 'lucide-react'
import { PageHeader, Pagination } from '../components/PageHeader'
import { useToast } from '../components/Toast'
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  SearchInput,
  Skeleton,
  StatusPill,
} from '../components/ui'
import { useAsyncData } from '../hooks/useAsyncData'
import { paginate } from '../lib/utils'
import { fetchReportsAdmin } from '../api/services/adminData'
import {
  dateRangePresets,
  reportFormats,
  type ReportType,
  type ReportFormat,
  type GeneratedReport,
} from '../data/reportsData'
import './Reports.css'

const PAGE_SIZE = 6

const typeIcons: Record<ReportType, typeof FileText> = {
  Revenue: IndianRupee,
  Drivers: Truck,
  Customers: Users,
  Trips: Route,
  Wallet: Wallet,
  Taxes: Receipt,
  Commission: Percent,
}

async function fetchReports() {
  return fetchReportsAdmin()
}

function nowLabel() {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date())
}

function ReportsSkeleton() {
  return (
    <div className="reports-page cy-page" aria-busy="true">
      <div className="reports-type-grid">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} variant="card" style={{ height: 120 }} />
        ))}
      </div>
      <Skeleton variant="card" style={{ height: 200, marginTop: 16 }} />
      <div className="cy-table-card" style={{ marginTop: 16 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="cy-skeleton--row">
            <Skeleton variant="text" style={{ flex: 1 }} />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Reports() {
  const { toast } = useToast()
  const { data, loading, error, setData } = useAsyncData(fetchReports, [])

  const [reports, setReports] = useState<GeneratedReport[] | null>(null)
  const list = reports ?? data?.reports ?? []

  const [selectedType, setSelectedType] = useState<ReportType>('Revenue')
  const [dateRange, setDateRange] = useState(dateRangePresets[3])
  const [format, setFormat] = useState<ReportFormat>('Excel')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [generating, setGenerating] = useState(false)

  const selectedMeta = useMemo(
    () => data?.types.find((t) => t.type === selectedType),
    [data, selectedType],
  )

  const availableFormats = selectedMeta?.formats ?? reportFormats

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return list.filter(
      (r) =>
        !q ||
        r.id.toLowerCase().includes(q) ||
        r.type.toLowerCase().includes(q) ||
        r.generatedBy.toLowerCase().includes(q),
    )
  }, [list, search])

  const paged = useMemo(() => paginate(filtered, page, PAGE_SIZE), [filtered, page])

  const handleGenerate = () => {
    setGenerating(true)
    setTimeout(() => {
      const newReport: GeneratedReport = {
        id: `RPT-${Date.now()}`,
        type: selectedType,
        format,
        dateRange: dateRange === 'Custom range' ? '1 Jul – 14 Jul 2026' : dateRange,
        generatedAt: nowLabel(),
        generatedBy: 'Priya Sharma',
        size: format === 'CSV' ? '1.2 MB' : format === 'Excel' ? '2.1 MB' : '890 KB',
        status: 'Ready',
        records: Math.floor(Math.random() * 5000) + 100,
      }
      const updated = [newReport, ...list]
      setReports(updated)
      setData((prev) => (prev ? { ...prev, reports: updated } : prev))
      setGenerating(false)
      toast({
        title: 'Report generated',
        description: `${selectedType} report (${format}) is ready for download.`,
      })
    }, 1200)
  }

  const handleDownload = (report: GeneratedReport) => {
    if (report.status !== 'Ready') {
      toast({
        title: 'Download unavailable',
        description: `Report is ${report.status.toLowerCase()}.`,
        tone: 'warning',
      })
      return
    }
    toast({
      title: 'Download started',
      description: `${report.id}.${report.format.toLowerCase()} (${report.size})`,
    })
  }

  if (loading) return <ReportsSkeleton />

  if (error || !data) {
    return (
      <Card>
        <EmptyState
          icon={<FileText size={24} strokeWidth={1.75} />}
          title="Unable to load reports"
          description={error ?? 'Could not fetch report data.'}
          action={<Button variant="primary" onClick={() => window.location.reload()}>Retry</Button>}
        />
      </Card>
    )
  }

  return (
    <div className="reports-page cy-page">
      <PageHeader
        title="Reports"
        subtitle="Generate and download operational reports across revenue, fleet, and finance."
        crumbs={[{ label: 'Platform' }, { label: 'Reports' }]}
        actions={
          <Button variant="primary" disabled={generating} onClick={handleGenerate}>
            <FileSpreadsheet size={16} strokeWidth={1.75} />
            {generating ? 'Generating…' : 'Generate report'}
          </Button>
        }
      />

      <section className="reports-type-grid" aria-label="Report types">
        {data.types.map((meta) => {
          const Icon = typeIcons[meta.type]
          const active = selectedType === meta.type
          return (
            <button
              key={meta.type}
              type="button"
              className={`reports-type-card ${active ? 'is-active' : ''}`}
              onClick={() => {
                setSelectedType(meta.type)
                setFormat(meta.formats[0])
              }}
            >
              <span className="reports-type-card__icon">
                <Icon size={20} strokeWidth={1.75} />
              </span>
              <div>
                <strong>{meta.type}</strong>
                <span>Last: {meta.lastGenerated.split(',')[0]}</span>
              </div>
            </button>
          )
        })}
      </section>

      <Card className="reports-form-card">
        <CardHeader title="Generate report" subtitle={selectedMeta?.description} />
        <CardBody>
          <div className="reports-form-grid">
            <label className="reports-field">
              <span>Report type</span>
              <select value={selectedType} onChange={(e) => setSelectedType(e.target.value as ReportType)}>
                {data.types.map((t) => (
                  <option key={t.type} value={t.type}>{t.type}</option>
                ))}
              </select>
            </label>
            <label className="reports-field">
              <span>Date range</span>
              <select value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
                {dateRangePresets.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </label>
            <label className="reports-field">
              <span>Format</span>
              <div className="reports-format-row">
                {availableFormats.map((f) => (
                  <button
                    key={f}
                    type="button"
                    className={`reports-format-btn ${format === f ? 'is-active' : ''}`}
                    onClick={() => setFormat(f)}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </label>
          </div>
          <div className="reports-form-actions">
            <Button variant="primary" disabled={generating} onClick={handleGenerate}>
              {generating ? 'Generating…' : `Generate ${format}`}
            </Button>
          </div>
        </CardBody>
      </Card>

      <section className="reports-recent">
        <div className="cy-page__toolbar">
          <div className="cy-page__toolbar-left">
            <h2 className="reports-section-title">Recent reports</h2>
            <span className="cy-page__meta"><strong>{filtered.length}</strong> reports</span>
          </div>
          <div className="cy-page__toolbar-right">
            <SearchInput
              value={search}
              onChange={(v) => { setSearch(v); setPage(1) }}
              placeholder="Search by ID, type, or author…"
              className="reports-search"
            />
          </div>
        </div>

        <div className="cy-table-card">
          <div className="cy-table-wrap">
            <table className="cy-table">
              <thead>
                <tr>
                  <th>Report ID</th>
                  <th>Type</th>
                  <th>Date range</th>
                  <th>Format</th>
                  <th>Generated</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paged.items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="cy-table__empty-cell">
                      <EmptyState
                        icon={<FileText size={20} strokeWidth={1.75} />}
                        title="No reports found"
                        description="Generate a report or adjust your search."
                      />
                    </td>
                  </tr>
                ) : (
                  paged.items.map((report) => (
                    <tr key={report.id}>
                      <td><span className="cy-table__mono">{report.id}</span></td>
                      <td><span className="cy-table__primary">{report.type}</span></td>
                      <td>{report.dateRange}</td>
                      <td>{report.format}</td>
                      <td>
                        <span className="cy-table__primary">{report.generatedAt.split(',')[0]}</span>
                        <span className="cy-table__secondary">{report.generatedBy}</span>
                      </td>
                      <td><StatusPill status={report.status} /></td>
                      <td>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={report.status !== 'Ready'}
                          onClick={() => handleDownload(report)}
                        >
                          <Download size={14} strokeWidth={1.75} />
                          Download
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
      </section>
    </div>
  )
}
