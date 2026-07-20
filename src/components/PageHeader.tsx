import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import './PageHeader.css'

interface Crumb {
  label: string
  to?: string
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav className="cy-breadcrumbs" aria-label="Breadcrumb">
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`} className="cy-breadcrumbs__item">
          {index > 0 ? <ChevronRight size={14} strokeWidth={1.75} aria-hidden /> : null}
          {item.to ? (
            <Link to={item.to}>{item.label}</Link>
          ) : (
            <span aria-current="page">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}

export function PageHeader({
  title,
  subtitle,
  crumbs,
  actions,
}: {
  title: string
  subtitle?: string
  crumbs?: Crumb[]
  actions?: React.ReactNode
}) {
  return (
    <div className="cy-page-header">
      <div className="cy-page-header__text">
        {crumbs ? <Breadcrumbs items={crumbs} /> : null}
        <h1 className="cy-page-header__title">{title}</h1>
        {subtitle ? <p className="cy-page-header__subtitle">{subtitle}</p> : null}
      </div>
      {actions ? <div className="cy-page-header__actions">{actions}</div> : null}
    </div>
  )
}

export function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
}: {
  page: number
  totalPages: number
  total: number
  pageSize: number
  onPageChange: (page: number) => void
}) {
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)

  return (
    <div className="cy-pagination">
      <span className="cy-pagination__meta">
        Showing {start}–{end} of {total}
      </span>
      <div className="cy-pagination__controls">
        <button
          type="button"
          className="cy-pagination__btn"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </button>
        <span className="cy-pagination__page">
          Page {page} / {totalPages}
        </span>
        <button
          type="button"
          className="cy-pagination__btn"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  )
}
