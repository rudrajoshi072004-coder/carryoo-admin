/**
 * Helpers for admin portal driver-document review.
 * Backend: PATCH /admin/portal/drivers/{driverId}/documents/{docId}/
 * Payload status values: approved | rejected | pending
 * Response status labels: Verified | Pending | Rejected
 */

import type { DocumentStatus, DocumentType } from '../../data/documentsData'

export type PortalDocumentReviewStatus = 'approved' | 'rejected' | 'pending'

export type PortalDocumentRow = {
  id?: string
  type?: string
  document_type?: string
  number?: string
  status?: string
  expiry?: string
  file_url?: string | null
  url?: string | null
  rejection_reason?: string
}

/** Map UI / API label → backend PATCH status. */
export function toPortalReviewStatus(uiStatus: 'Approved' | 'Rejected' | 'Pending'): PortalDocumentReviewStatus {
  if (uiStatus === 'Approved') return 'approved'
  if (uiStatus === 'Rejected') return 'rejected'
  return 'pending'
}

/** Map backend response/list label → Documents page status. */
export function fromPortalDocumentStatus(raw: string | undefined | null): DocumentStatus {
  const value = String(raw ?? '').trim().toLowerCase()
  if (value === 'verified' || value === 'approved') return 'Approved'
  if (value === 'rejected') return 'Rejected'
  if (value === 'resubmitted') return 'Resubmitted'
  return 'Pending'
}

export function mapDocumentType(rawType: string | undefined | null, documentType?: string | null): DocumentType {
  const key = `${documentType ?? ''} ${rawType ?? ''}`.toLowerCase()
  if (key.includes('license') || key.includes('licence') || /\bdl\b/.test(key)) return 'DL'
  if (key.includes('insurance')) return 'Insurance'
  if (key.includes('aadhaar') || key.includes('aadhar')) return 'Aadhaar'
  if (key.includes('pan')) return 'PAN'
  if (key.includes('selfie') || key.includes('photo') || key.includes('owner')) return 'Photo'
  if (key.includes('rc') || key.includes('registration')) return 'RC'
  return 'DL'
}

export function buildDocumentPreviewLabel(type: DocumentType, number: string | undefined | null): string {
  const n = (number ?? '').trim()
  if (n && n !== '—') return `${type} · ${n}`
  return type
}

export function requireRejectionReason(status: PortalDocumentReviewStatus, reason: string | undefined): string | null {
  if (status !== 'rejected') return null
  const trimmed = (reason ?? '').trim()
  if (!trimmed) return 'A rejection reason is required.'
  return null
}
