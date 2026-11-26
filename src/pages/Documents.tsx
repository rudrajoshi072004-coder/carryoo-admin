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
import { useAdminLanguage } from '../i18n/LanguageContext'
import {
  Button,
  EmptyState,
  SearchInput,
  Skeleton,
  StatusPill,
} from '../components/ui'
import { useAsyncData } from '../hooks/useAsyncData'
import { exportCsv, paginate } from '../lib/utils'
import { getStoredUser } from '../api/client'
import { fetchDocumentsAdmin } from '../api/services/adminData'
import { reviewPortalDocument } from '../api/services/portal'
import {
  fromPortalDocumentStatus,
  requireRejectionReason,
  toPortalReviewStatus,
} from '../api/services/documentReview'
import {
  documentStatuses,
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

function reviewerLabel() {
  const user = getStoredUser()
  const name = user?.name?.trim()
  const phone = user?.phone?.trim()
  if (name) return name
  if (phone) return phone
  return 'Admin'
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
  const { t } = useAdminLanguage()
  const { data: documents, loading, error, setData, refetch } = useAsyncData(
    fetchDocuments,
    [],
    { cacheKey: 'view:/documents:fetchDocuments' },
  )
  const { toast } = useToast()
  const [statusTab, setStatusTab] = useState<DocumentStatus>('Pending')
  const [search, setSearch] = useState('')
  const [cityFilter, setCityFilter] = useState('All Cities')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<VerificationDocument | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [previewModalOpen, setPreviewModalOpen] = useState(false)
  const [mutating, setMutating] = useState(false)

  const cityOptions = useMemo(() => {
    const cities = new Set<string>(['All Cities'])
    for (const doc of documents ?? []) {
      if (doc.city?.trim()) cities.add(doc.city.trim())
    }
    return [...cities]
  }, [documents])

  const filtered = useMemo(() => {
    if (!documents) return []
    const q = search.trim().toLowerCase()
    return documents.filter((doc) => {
      const matchesTab = doc.status === statusTab
      const matchesSearch =
        !q ||
        doc.driverName.toLowerCase().includes(q) ||
        doc.driverId.toLowerCase().includes(q) ||
        (doc.driverDisplayId ?? '').toLowerCase().includes(q) ||
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

  const applyServerResult = (
    doc: VerificationDocument,
    result: { status: string; rejection_reason?: string },
    action: 'Approved' | 'Rejected',
    reason?: string,
  ) => {
    const nextStatus = fromPortalDocumentStatus(result.status)
    const auditEntry = {
      action,
      by: reviewerLabel(),
      at: nowLabel(),
      note: reason || result.rejection_reason || undefined,
    }
    const patch: Partial<VerificationDocument> = {
      status: nextStatus,
      rejectionReason: result.rejection_reason || reason,
      audit: [...doc.audit, auditEntry],
    }
    setData((prev) => prev?.map((d) => (d.id === doc.id ? { ...d, ...patch } : d)) ?? null)
    setSelected((prev) => (prev?.id === doc.id ? { ...prev, ...patch } : prev))
  }

  const runReview = async (
    doc: VerificationDocument,
    uiAction: 'Approved' | 'Rejected',
    reason?: string,
  ) => {
    if (mutating) return
    const status = toPortalReviewStatus(uiAction)
    const reasonError = requireRejectionReason(status, reason)
    if (reasonError) {
      toast({ title: 'Rejection reason required', description: reasonError, tone: 'warning' })
      return
    }

    setMutating(true)
    try {
      const result = await reviewPortalDocument(doc.driverId, doc.id, {
        status,
        ...(status === 'rejected' ? { rejection_reason: reason!.trim() } : {}),
      })
      applyServerResult(doc, result, uiAction, reason)
      toast({
        title: uiAction === 'Approved' ? 'Document approved' : 'Document rejected',
        description:
          uiAction === 'Approved'
            ? `${doc.type} for ${doc.driverName} was verified on the server.`
            : `${doc.type} for ${doc.driverName} was rejected on the server.`,
        tone: uiAction === 'Approved' ? 'success' : 'warning',
      })
      setPanelOpen(false)
      // Refresh from portal so sibling docs / KYC side-effects stay accurate.
      refetch()
    } catch (err) {
      toast({
        title: uiAction === 'Approved' ? 'Could not approve document' : 'Could not reject document',
        description: err instanceof Error ? err.message : 'Request failed',
        tone: 'error',
      })
    } finally {
      setMutating(false)
    }
  }

  const handleApprove = (doc: VerificationDocument) => {
    void runReview(doc, 'Approved')
  }

  const handleReject = (reason?: string) => {
    if (!selected) return
    void runReview(selected, 'Rejected', reason)
  }

  const handleExport = () => {
    exportCsv(
      'carryoo-documents.csv',
      ['Document ID', 'Driver', 'Driver ID', 'Type', 'Status', 'City', 'Submitted', 'Preview'],
      filtered.map((doc) => [
        doc.id,
        doc.driverName,
        doc.driverDisplayId || doc.driverId,
        doc.type,
        doc.status,
        doc.city,
        doc.submitted,
        doc.previewLabel,
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
            <Button variant="primary" onClick={() => refetch()}>
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
        title={t('pages.documents.title')}
        subtitle={t('pages.documents.subtitle')}
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
              {cityOptions.map((city) => (
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
                        <div className="cy-table__secondary">
                          {doc.driverDisplayId || doc.driverId}
                        </div>
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
        onClose={() => {
          if (mutating) return
          setPanelOpen(false)
        }}
        width={520}
      >
        {selected ? (
          <>
            <div
              className={`documents-preview ${selected.fileUrl ? 'has-file' : ''}`}
              onClick={() => setPreviewModalOpen(true)}
              role="button"
              tabIndex={0}
              title="Open document inspector"
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  setPreviewModalOpen(true)
                }
              }}
            >
              {selected.fileUrl ? (
                <div className="documents-preview__placeholder">
                  <Maximize2 size={32} strokeWidth={1.75} />
                  <span>{selected.previewLabel}</span>
                  <small>Click to inspect document</small>
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
                <span className="cy-table__secondary">
                  {selected.driverDisplayId || selected.driverId}
                </span>
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

            {selected.rejectionReason ? (
              <p className="documents-audit__note">Rejection reason: {selected.rejectionReason}</p>
            ) : null}

            {(selected.status === 'Pending' || selected.status === 'Resubmitted') && (
              <div className="documents-panel-actions">
                <Button
                  variant="primary"
                  disabled={mutating}
                  onClick={() => handleApprove(selected)}
                >
                  <CheckCircle2 size={16} strokeWidth={1.75} />
                  {mutating ? 'Saving…' : 'Approve'}
                </Button>
                <Button
                  variant="secondary"
                  className="documents-reject-btn"
                  disabled={mutating}
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
        onClose={() => {
          if (mutating) return
          setRejectOpen(false)
        }}
      />

      <DocumentPreviewModal
        open={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        title={selected ? `${selected.type} · ${selected.driverName}` : 'Document Preview'}
        subtitle={selected ? `Driver ID: ${selected.driverId} · Submitted: ${selected.submitted}` : undefined}
        fileUrl={selected?.fileUrl}
        fileType={selected?.fileType}
        status={selected?.status}
        metadata={selected ? [
          { label: 'Document ID', value: selected.id },
          { label: 'Document Type', value: selected.type },
          { label: 'Driver Name', value: selected.driverName },
          { label: 'Driver ID', value: selected.driverId },
          { label: 'City', value: selected.city },
          { label: 'Submitted Date', value: selected.submitted },
          { label: 'Status', value: selected.status },
        ] : []}
        approving={mutating}
        rejecting={mutating}
        onApprove={selected && (selected.status === 'Pending' || selected.status === 'Resubmitted') ? () => {
          handleApprove(selected)
          setPreviewModalOpen(false)
        } : undefined}
        onReject={selected && (selected.status === 'Pending' || selected.status === 'Resubmitted') ? () => {
          setPreviewModalOpen(false)
          setRejectOpen(true)
        } : undefined}
      />
    </div>
  )
}
