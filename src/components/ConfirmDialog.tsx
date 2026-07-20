import { useEffect, useState, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { Button } from './ui'
import './ConfirmDialog.css'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'danger' | 'primary'
  withReason?: boolean
  reasonLabel?: string
  reasonPlaceholder?: string
  onConfirm: (reason?: string) => void
  onClose: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'primary',
  withReason = false,
  reasonLabel = 'Reason',
  reasonPlaceholder = 'Enter a reason…',
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const [reason, setReason] = useState('')

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (!open) setReason('')
  }, [open])

  if (!open) return null

  const canConfirm = !withReason || reason.trim().length > 0

  return (
    <div className="cy-modal-overlay" onClick={onClose}>
      <div
        className="cy-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cy-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="cy-modal__header">
          <h2 id="cy-modal-title">{title}</h2>
          <button type="button" className="cy-modal__close" onClick={onClose} aria-label="Close">
            <X size={16} strokeWidth={1.75} />
          </button>
        </div>
        <p className="cy-modal__desc">{description}</p>
        {withReason ? (
          <label className="cy-modal__field">
            <span>{reasonLabel}</span>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={reasonPlaceholder}
              rows={3}
              aria-required
            />
          </label>
        ) : null}
        <div className="cy-modal__actions">
          <Button variant="secondary" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button
            variant="primary"
            className={tone === 'danger' ? 'cy-btn--danger' : ''}
            disabled={!canConfirm}
            onClick={() => {
              onConfirm(withReason ? reason.trim() : undefined)
              onClose()
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}

export function SidePanel({
  open,
  title,
  onClose,
  children,
  width = 480,
}: {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  width?: number
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  return (
    <>
      <div
        className={`cy-drawer-overlay ${open ? 'is-open' : ''}`}
        onClick={onClose}
        aria-hidden={!open}
      />
      <aside
        className={`cy-drawer ${open ? 'is-open' : ''}`}
        style={{ width: `min(${width}px, 100vw)` }}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header className="cy-drawer__header">
          <h2>{title}</h2>
          <button type="button" className="cy-modal__close" onClick={onClose} aria-label="Close">
            <X size={16} strokeWidth={1.75} />
          </button>
        </header>
        <div className="cy-drawer__body">{children}</div>
      </aside>
    </>
  )
}
