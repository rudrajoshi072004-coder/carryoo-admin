import { useMemo, useState } from 'react'
import {
  Download,
  Eye,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  Maximize2,
} from 'lucide-react'
import DocumentPreviewModal from '../components/DocumentPreviewModal'
import { PageHeader, Pagination } from '../components/PageHeader'
import { ConfirmDialog, SidePanel } from '../components/ConfirmDialog'
import { useToast } from '../components/Toast'
import {
  Button,
  EmptyState,
  SearchInput,
  Skeleton,
  StatusPill,
} from '../components/ui'
import { useAsyncData } from '../hooks/useAsyncData'
import { exportCsv, paginate } from '../lib/utils'
import { fetchDocumentsAdmin } from '../api/services/adminData'
import {
  documentStatuses,
  documentCities,
  type VerificationDocument,
  type DocumentStatus,
} from '../data/documentsData'
import './Documents.css'

const PAGE_SIZE = 8

async function fetchDocuments() {
  return fetchDocumentsAdmin()
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

function DocumentsSkeleton() {
  return (
    <div className="cy-page" aria-busy="true">
      <Skeleton variant="title" style={{ width: '240px', marginBottom: 16 }} />
      <div className="cy-table-card">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="cy-skeleton--row">
            <Skeleton variant="avatar" />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Skeleton variant="title" style={{ width: '35%' }} />
              <Skeleton variant="text" style={{ width: '60%' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Documents() {
  const { data: documents, loading, error, setData } = useAsyncData(fetchDocuments, [])
  const { toast } = useToast()
  const [statusTab, setStatusTab] = useState<DocumentStatus>('Pending')
  const [search, setSearch] = useState('')
  const [cityFilter, setCityFilter] = useState(documentCities[0])
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<VerificationDocument | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [previewModalOpen, setPreviewModalOpen] = useState(false)

  const filtered = useMemo(() => {
    if (!documents) return []
    const q = search.trim().toLowerCase()
    return documents.filter((doc) => {
      const matchesTab = doc.status === statusTab
      const matchesSearch =
        !q ||
        doc.driverName.toLowerCase().includes(q) ||
        doc.driverId.toLowerCase().includes(q) ||
        doc.id.toLowerCase().includes(q) ||
        doc.type.toLowerCase().includes(q) ||
        doc.previewLabel.toLowerCase().includes(q)
      const matchesCity = cityFilter === 'All Cities' || doc.city === cityFilter
      return matchesTab && matchesSearch && matchesCity
    })
  }, [documents, statusTab, search, cityFilter])

  const paginated = useMemo(
    () => paginate(filtered, page, PAGE_SIZE),
    [filtered, page],
  )

  const statusCounts = useMemo(() => {
    if (!documents) return {} as Record<DocumentStatus, number>
    return documentStatuses.reduce(
      (acc, status) => {
        acc[status] = documents.filter((d) => d.status === status).length
        return acc
      },
      {} as Record<DocumentStatus, number>,
    )
  }, [documents])

  const openDocument = (doc: VerificationDocument) => {
    setSelected(doc)
    setPanelOpen(true)
  }

  const updateDocument = (id: string, patch: Partial<VerificationDocument>) => {
    setData((prev) =>
      prev?.map((d) => (d.id === id ? { ...d, ...patch } : d)) ?? null,
    )
    setSelected((prev) => (prev?.id === id ? { ...prev, ...patch } : prev))
  }

  const handleApprove = (doc: VerificationDocument) => {
    const auditEntry = {
      action: 'Approved',
      by: 'Aarav Mehta',
      at: nowLabel(),
    }
    updateDocument(doc.id, {
      status: 'Approved',
      audit: [...doc.audit, auditEntry],
    })
    toast({
      title: 'Document approved',
      description: `${doc.type} for ${doc.driverName} has been verified.`,
      tone: 'success',
    })
    setPanelOpen(false)
  }

  const handleReject = (reason?: string) => {
    if (!selected || !reason) return
    const auditEntry = {
      action: 'Rejected',
      by: 'Aarav Mehta',
      at: nowLabel(),
      note: reason,
    }
    updateDocument(selected.id, {
      status: 'Rejected',
      audit: [...selected.audit, auditEntry],
    })
    toast({
      title: 'Document rejected',
      description: `${selected.type} for ${selected.driverName} was rejected.`,
      tone: 'warning',
    })
    setPanelOpen(false)
  }

  const handleExport = () => {
    exportCsv(
      'carryoo-documents.csv',
      ['Document ID', 'Driver', 'Driver ID', 'Type', 'Status', 'City', 'Submitted', 'Preview'],
      filtered.map((d) => [
        d.id,
        d.driverName,
        d.driverId,
        d.type,
        d.status,
        d.city,
        d.submitted,
        d.previewLabel,
      ]),
    )
  }

  if (loading) return <DocumentsSkeleton />

  if (error || !documents) {
    return (
      <div className="cy-table-card">
        <EmptyState
          icon={<FileText size={24} strokeWidth={1.75} />}
          title="Unable to load documents"
          description={error ?? 'Could not fetch verification queue.'}
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
    <div className="documents-page cy-page">
      <PageHeader
        title="Document Verification"
        subtitle="Review and approve driver KYC documents across India."
        crumbs={[
          { label: 'Dashboard', to: '/' },
          { label: 'Documents' },
        ]}
        actions={
          <Button variant="secondary" onClick={handleExport}>
            <Download size={16} strokeWidth={1.75} />
            Export
          </Button>
        }
      />

      <div className="documents-tabs" role="tablist" aria-label="Document status">
        {documentStatuses.map((status) => (
          <button
            key={status}
            type="button"
            role="tab"
            aria-selected={statusTab === status}
            className={`documents-tab ${statusTab === status ? 'is-active' : ''}`}
            onClick={() => {
              setStatusTab(status)
              setPage(1)
            }}
          >
            {status}
            <span className="documents-tab__count">{statusCounts[status] ?? 0}</span>
          </button>
        ))}
      </div>

      <div className="cy-page__toolbar">
        <div className="cy-page__toolbar-left">
          <SearchInput
            value={search}
            onChange={(v) => {
              setSearch(v)
              setPage(1)
            }}
            placeholder="Search driver, ID, document type…"
            className="documents-search"
            aria-label="Search documents"
          />
          <div className="cy-page__filters">
            <span className="cy-page__filters-label">
              <Filter size={14} strokeWidth={1.75} aria-hidden /> City
            </span>
            <select
              className="cy-select"
              value={cityFilter}
              onChange={(e) => {
                setCityFilter(e.target.value)
                setPage(1)
              }}
              aria-label="Filter by city"
            >
              {documentCities.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="cy-page__meta">
        <span>
          Showing <strong>{paginated.items.length}</strong> of {filtered.length}{' '}
          {statusTab.toLowerCase()} documents
        </span>
      </div>

      <div className="cy-table-card">
        {paginated.items.length === 0 ? (
          <EmptyState
            icon={<FileText size={24} strokeWidth={1.75} />}
            title={`No ${statusTab.toLowerCase()} documents`}
            description="Try another status tab or adjust your search filters."
            action={
              <Button
                variant="secondary"
                onClick={() => {
                  setSearch('')
                  setCityFilter('All Cities')
                }}
              >
                Clear filters
              </Button>
            }
          />
        ) : (
          <>
            <div className="cy-table-wrap">
              <table className="cy-table documents-table">
                <thead>
                  <tr>
                    <th>Document ID</th>
                    <th>Driver</th>
                    <th>Type</th>
                    <th>City</th>
                    <th>Submitted</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.items.map((doc) => (
                    <tr
                      key={doc.id}
                      className="cy-table__row"
                      onClick={() => openDocument(doc)}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          openDocument(doc)
                        }
                      }}
                    >
                      <td className="cy-table__mono cy-table__link">{doc.id}</td>
                      <td>
                        <div className="cy-table__primary">{doc.driverName}</div>
                        <div className="cy-table__secondary">{doc.driverId}</div>
                      </td>
                      <td>
                        <span className="documents-type-pill">{doc.type}</span>
                      </td>
                      <td>{doc.city}</td>
                      <td>{doc.submitted}</td>
                      <td>
                        <StatusPill status={doc.status} tone={doc.status.toLowerCase()} />
                      </td>
                      <td>
                        <div className="cy-actions" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            className="cy-action-btn"
                            title="Review document"
                            aria-label={`Review ${doc.id}`}
                            onClick={() => openDocument(doc)}
                          >
                            <Eye size={15} strokeWidth={1.75} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={paginated.page}
              totalPages={paginated.totalPages}
              total={paginated.total}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
            />
          </>
        )}
      </div>

      <SidePanel
        open={panelOpen}
        title={selected ? `${selected.type} · ${selected.driverName}` : 'Document'}
        onClose={() => setPanelOpen(false)}
        width={520}
      >
        {selected ? (
          <>
            <div
              className={`documents-preview ${selected.fileUrl ? 'has-file' : ''}`}
              onClick={() => setPreviewModalOpen(true)}
              role="button"
              tabIndex={0}
              title="Click to inspect document full screen"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setPreviewModalOpen(true)
                }
              }}
            >
              {selected.fileUrl ? (
                <div className="documents-preview__image-box">
                  <img
                    src={selected.fileUrl}
                    alt={`${selected.type} preview`}
                    className="documents-preview__img"
                  />
                  <div className="documents-preview__hover-overlay">
                    <Maximize2 size={18} />
                    <span>Click to zoom & inspect</span>
                  </div>
                </div>
              ) : (
                <div className="documents-preview__placeholder">
                  <FileText size={40} strokeWidth={1.75} />
                  <span>{selected.previewLabel}</span>
                  <small>Click to open document inspector</small>
                </div>
              )}
            </div>

            <div className="documents-panel-meta">
              <div>
                <span className="documents-panel-meta__label">Driver</span>
                <strong>{selected.driverName}</strong>
                <span className="cy-table__secondary">{selected.driverId}</span>
              </div>
              <div>
                <span className="documents-panel-meta__label">City</span>
                <strong>{selected.city}</strong>
              </div>
              <div>
                <span className="documents-panel-meta__label">Submitted</span>
                <strong>{selected.submitted}</strong>
              </div>
              <div>
                <span className="documents-panel-meta__label">Status</span>
                <StatusPill status={selected.status} tone={selected.status.toLowerCase()} />
              </div>
            </div>

            {(selected.status === 'Pending' || selected.status === 'Resubmitted') && (
              <div className="documents-panel-actions">
                <Button variant="primary" onClick={() => handleApprove(selected)}>
                  <CheckCircle2 size={16} strokeWidth={1.75} />
                  Approve
                </Button>
                <Button
                  variant="secondary"
                  className="documents-reject-btn"
                  onClick={() => setRejectOpen(true)}
                >
                  <XCircle size={16} strokeWidth={1.75} />
                  Reject
                </Button>
              </div>
            )}

            <section className="documents-audit">
              <h3>
                <Clock size={16} strokeWidth={1.75} />
                Audit history
              </h3>
              <ul className="documents-audit__list">
                {selected.audit.map((entry, i) => (
                  <li key={`${entry.at}-${i}`}>
                    <div className="documents-audit__head">
                      <strong>{entry.action}</strong>
                      <span>{entry.at}</span>
                    </div>
                    <span className="documents-audit__by">{entry.by}</span>
                    {entry.note ? <p className="documents-audit__note">{entry.note}</p> : null}
                  </li>
                ))}
              </ul>
            </section>
          </>
        ) : null}
      </SidePanel>

      <ConfirmDialog
        open={rejectOpen}
        title="Reject document"
        description={`Provide a reason for rejecting ${selected?.type ?? 'this document'}. The driver will be notified to resubmit.`}
        confirmLabel="Reject document"
        cancelLabel="Cancel"
        tone="danger"
        withReason
        reasonLabel="Rejection reason"
        reasonPlaceholder="e.g. Image blurry, document expired…"
        onConfirm={handleReject}
        onClose={() => setRejectOpen(false)}
      />

      <DocumentPreviewModal
        open={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        title={selected ? `${selected.type} · ${selected.driverName}` : 'Document Preview'}
        subtitle={
          selected ? `Driver ID: ${selected.driverId} · Submitted: ${selected.submitted}` : undefined
        }
        fileUrl={selected?.fileUrl}
        fileType={selected?.fileType}
        status={selected?.status}
        metadata={
          selected
            ? [
                { label: 'Document ID', value: selected.id },
                { label: 'Document Type', value: selected.type },
                { label: 'Driver Name', value: selected.driverName },
                { label: 'Driver ID', value: selected.driverId },
                { label: 'City', value: selected.city },
                { label: 'Submitted Date', value: selected.submitted },
                { label: 'Status', value: selected.status },
              ]
            : []
        }
        onApprove={
          selected && (selected.status === 'Pending' || selected.status === 'Resubmitted')
            ? () => {
                handleApprove(selected)
                setPreviewModalOpen(false)
              }
            : undefined
        }
        onReject={
          selected && (selected.status === 'Pending' || selected.status === 'Resubmitted')
            ? () => {
                setPreviewModalOpen(false)
                setRejectOpen(true)
              }
            : undefined
        }
      />
    </div>
  )
}
