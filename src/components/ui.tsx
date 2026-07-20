import type { ReactNode, ButtonHTMLAttributes, CSSProperties } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  interactive?: boolean
}

export function Card({ children, className = '', interactive }: CardProps) {
  return (
    <div
      className={`cy-card ${interactive ? 'cy-card--interactive' : ''} ${className}`.trim()}
    >
      {children}
    </div>
  )
}

export function CardHeader({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <header className="cy-card__header">
      <div>
        <h2 className="cy-card__title">{title}</h2>
        {subtitle ? <p className="cy-card__subtitle">{subtitle}</p> : null}
      </div>
      {action}
    </header>
  )
}

export function CardBody({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={`cy-card__body ${className}`.trim()}>{children}</div>
}

type ButtonVariant = 'primary' | 'secondary' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: 'md' | 'sm'
  iconOnly?: boolean
}

export function Button({
  variant = 'secondary',
  size = 'md',
  iconOnly,
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      className={`cy-btn cy-btn--${variant} ${size === 'sm' ? 'cy-btn--sm' : ''} ${iconOnly ? 'cy-btn--icon' : ''} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  )
}

export function StatusPill({
  status,
  tone,
}: {
  status: string
  tone?: string
}) {
  const slug = (tone ?? status).toLowerCase().replace(/\s+/g, '-')
  return <span className={`cy-pill cy-pill--${slug}`}>{status}</span>
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="cy-empty">
      {icon ? <div className="cy-empty__icon">{icon}</div> : null}
      <h3 className="cy-empty__title">{title}</h3>
      <p className="cy-empty__desc">{description}</p>
      {action}
    </div>
  )
}

export function Skeleton({
  variant = 'text',
  className = '',
  style,
}: {
  variant?: 'text' | 'title' | 'avatar' | 'card' | 'chart'
  className?: string
  style?: CSSProperties
}) {
  return (
    <span
      className={`cy-skeleton cy-skeleton--${variant} ${className}`.trim()}
      style={style}
      aria-hidden
    />
  )
}

export function SearchInput({
  value,
  onChange,
  placeholder,
  className = '',
  'aria-label': ariaLabel = 'Search',
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  'aria-label'?: string
}) {
  return (
    <label className={`cy-search ${className}`.trim()}>
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
      />
    </label>
  )
}
