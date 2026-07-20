import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { CheckCircle2, X, AlertTriangle, Info } from 'lucide-react'
import './Toast.css'

type ToastTone = 'success' | 'error' | 'info' | 'warning'

interface ToastItem {
  id: string
  title: string
  description?: string
  tone: ToastTone
}

interface ToastContextValue {
  toast: (input: { title: string; description?: string; tone?: ToastTone }) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])

  const toast = useCallback(
    ({ title, description, tone = 'success' }: { title: string; description?: string; tone?: ToastTone }) => {
      const id = crypto.randomUUID()
      setItems((prev) => [...prev, { id, title, description, tone }])
      window.setTimeout(() => {
        setItems((prev) => prev.filter((t) => t.id !== id))
      }, 3200)
    },
    [],
  )

  const value = useMemo(() => ({ toast }), [toast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="cy-toast-stack" aria-live="polite">
        {items.map((item) => (
          <div key={item.id} className={`cy-toast cy-toast--${item.tone}`}>
            <span className="cy-toast__icon" aria-hidden>
              {item.tone === 'success' ? <CheckCircle2 size={18} strokeWidth={1.75} /> : null}
              {item.tone === 'error' ? <AlertTriangle size={18} strokeWidth={1.75} /> : null}
              {item.tone === 'warning' ? <AlertTriangle size={18} strokeWidth={1.75} /> : null}
              {item.tone === 'info' ? <Info size={18} strokeWidth={1.75} /> : null}
            </span>
            <div className="cy-toast__body">
              <strong>{item.title}</strong>
              {item.description ? <p>{item.description}</p> : null}
            </div>
            <button
              type="button"
              className="cy-toast__close"
              aria-label="Dismiss"
              onClick={() => setItems((prev) => prev.filter((t) => t.id !== item.id))}
            >
              <X size={14} strokeWidth={1.75} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
