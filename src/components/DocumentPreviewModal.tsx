import { useState, useEffect } from 'react'
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from 'lucide-react'
import { Button, StatusPill } from './ui'
import './DocumentPreviewModal.css'

export interface DocumentPreviewModalProps {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  fileUrl?: string | null
  fileType?: 'image' | 'pdf' | 'unknown'
  status?: string
  metadata?: Array<{ label: string; value: string }>
  onApprove?: () => void
  onReject?: () => void
  approving?: boolean
  rejecting?: boolean
}

export default function DocumentPreviewModal({
  open,
  onClose,
  title,
  subtitle,
  fileUrl,
  fileType = 'image',
  status,
  metadata = [],
  onApprove,
  onReject,
  approving = false,
  rejecting = false,
}: DocumentPreviewModalProps) {
  const [zoom, setZoom] = useState(100)
  const [rotation, setRotation] = useState(0)
  const [hasError, setHasError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Reset viewport state when modal opens or URL changes
  useEffect(() => {
    if (open) {
      setZoom(100)
      setRotation(0)
      setHasError(false)
      setIsLoading(Boolean(fileUrl))
    }
  }, [open, fileUrl])

  // Handle escape key
  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  const handleZoomIn = () => setZoom((z) => Math.min(z + 25, 300))
  const handleZoomOut = () => setZoom((z) => Math.max(z - 25, 50))
  const handleResetView = () => {
    setZoom(100)
    setRotation(0)
  }
  const handleRotate = () => setRotation((r) => (r + 90) % 360)

  const isPdf =
    fileType === 'pdf' || (fileUrl ? fileUrl.toLowerCase().endsWith('.pdf') : false)

  return (
    <div className="doc-modal-portal" role="dialog" aria-modal="true" aria-label={title}>
      <div className="doc-modal-backdrop" onClick={onClose} />

      <div className="doc-modal-window">
        {/* Header */}
        <header className="doc-modal-header">
          <div className="doc-modal-header__info">
            <div className="doc-modal-header__title-row">
              <h2 className="doc-modal-title">{title}</h2>
              {status ? (
                <StatusPill status={status} tone={status.toLowerCase()} />
              ) : null}
            </div>
            {subtitle ? <p className="doc-modal-subtitle">{subtitle}</p> : null}
          </div>

          {/* Action Toolbar */}
          <div className="doc-modal-toolbar">
            {!isPdf && fileUrl && !hasError ? (
              <div className="doc-modal-controls">
                <button
                  type="button"
                  className="doc-control-btn"
                  title="Zoom Out"
                  aria-label="Zoom Out"
                  onClick={handleZoomOut}
                  disabled={zoom <= 50}
                >
                  <ZoomOut size={16} />
                </button>
                <span className="doc-zoom-label">{zoom}%</span>
                <button
                  type="button"
                  className="doc-control-btn"
                  title="Zoom In"
                  aria-label="Zoom In"
                  onClick={handleZoomIn}
                  disabled={zoom >= 300}
                >
                  <ZoomIn size={16} />
                </button>
                <button
                  type="button"
                  className="doc-control-btn"
                  title="Rotate 90° Clockwise"
                  aria-label="Rotate Clockwise"
                  onClick={handleRotate}
                >
                  <RotateCw size={16} />
                </button>
                <button
                  type="button"
                  className="doc-control-btn"
                  title="Reset Zoom & Rotation"
                  aria-label="Reset View"
                  onClick={handleResetView}
                >
                  <RefreshCw size={15} />
                </button>
              </div>
            ) : null}

            {fileUrl && !hasError ? (
              <a
                href={fileUrl}
                target="_blank"
                rel="noreferrer"
                className="doc-control-btn doc-control-btn--link"
                title="Open in new tab"
                aria-label="Open original file in new tab"
              >
                <ExternalLink size={16} />
              </a>
            ) : null}

            <button
              type="button"
              className="doc-control-btn doc-control-btn--close"
              title="Close viewer"
              aria-label="Close"
              onClick={onClose}
            >
              <X size={18} />
            </button>
          </div>
        </header>

        {/* Content Body: Media Viewer + Metadata sidebar */}
        <div className="doc-modal-content">
          <main className="doc-modal-canvas">
            {isPdf && fileUrl && !hasError ? (
              <div className="doc-pdf-container">
                <iframe
                  src={fileUrl}
                  title={title}
                  className="doc-pdf-frame"
                />
              </div>
            ) : fileUrl && !hasError ? (
              <div className="doc-image-viewport">
                {isLoading && (
                  <div className="doc-canvas-loading">
                    <RefreshCw size={24} className="doc-spin" />
                    <span>Loading high-resolution document…</span>
                  </div>
                )}
                <img
                  src={fileUrl}
                  alt={title}
                  className="doc-preview-image"
                  style={{
                    transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                    transition: 'transform 0.15s ease-out',
                    display: isLoading ? 'none' : 'block',
                  }}
                  onLoad={() => setIsLoading(false)}
                  onError={() => {
                    setIsLoading(false)
                    setHasError(true)
                  }}
                />
              </div>
            ) : (
              <div className="doc-canvas-empty">
                <div className="doc-empty-icon-box">
                  {isPdf ? (
                    <FileText size={48} strokeWidth={1.5} />
                  ) : (
                    <ImageIcon size={48} strokeWidth={1.5} />
                  )}
                </div>
                <h3>{hasError ? 'Document Failed to Load' : 'Preview Pending Upload'}</h3>
                <p>
                  {hasError
                    ? 'The media link could not be loaded or network access timed out. Check connection or verify storage permission.'
                    : 'The driver or delivery partner has not yet uploaded a high-resolution file for this slot, or Cloudflare storage sync is in progress.'}
                </p>
                {fileUrl ? (
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="doc-empty-retry-link"
                  >
                    <ExternalLink size={14} /> Try direct source link
                  </a>
                ) : null}
              </div>
            )}
          </main>

          {/* Metadata Sidebar */}
          {metadata.length > 0 || onApprove || onReject ? (
            <aside className="doc-modal-sidebar">
              {metadata.length > 0 ? (
                <div className="doc-modal-meta-section">
                  <h4 className="doc-modal-meta-title">Document Information</h4>
                  <div className="doc-modal-meta-grid">
                    {metadata.map((item, idx) => (
                      <div key={idx} className="doc-modal-meta-item">
                        <span className="doc-modal-meta-label">{item.label}</span>
                        <span className="doc-modal-meta-val">{item.value || '—'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {(onApprove || onReject) && (
                <div className="doc-modal-actions-section">
                  <h4 className="doc-modal-meta-title">Verification Review</h4>
                  <div className="doc-modal-action-buttons">
                    {onApprove && (
                      <Button
                        variant="primary"
                        className="doc-approve-btn"
                        onClick={onApprove}
                        disabled={approving}
                      >
                        <CheckCircle2 size={16} />
                        {approving ? 'Approving…' : 'Approve Document'}
                      </Button>
                    )}
                    {onReject && (
                      <Button
                        variant="secondary"
                        className="doc-reject-btn"
                        onClick={onReject}
                        disabled={rejecting}
                      >
                        <XCircle size={16} />
                        {rejecting ? 'Rejecting…' : 'Reject Document'}
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </aside>
          ) : null}
        </div>
      </div>
    </div>
  )
}
