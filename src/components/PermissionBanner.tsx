import { AlertTriangle } from 'lucide-react'

type Props = {
  title?: string
  message: string
}

export function PermissionBanner({ title = 'Limited access', message }: Props) {
  return (
    <div className="permission-banner" role="status">
      <AlertTriangle size={18} strokeWidth={1.75} aria-hidden />
      <div>
        <strong>{title}</strong>
        {message}
      </div>
    </div>
  )
}
