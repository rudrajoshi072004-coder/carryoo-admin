import { useEffect } from 'react'
import {
  X,
  MapPin,
  Navigation,
  FileText,
  CreditCard,
  Headphones,
  Clock,
  User,
  Truck,
  Package,
} from 'lucide-react'
import type { Order } from '../data/ordersData'
import './OrderDrawer.css'

interface OrderDrawerProps {
  order: Order | null
  open: boolean
  onClose: () => void
}

function formatFare(amount: number) {
  return `₹${amount.toLocaleString('en-IN')}`
}

function slug(value: string) {
  return value.toLowerCase().replace(/\s+/g, '-')
}

export default function OrderDrawer({ order, open, onClose }: OrderDrawerProps) {
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

  if (!order) return null

  return (
    <>
      <div
        className={`order-drawer-overlay ${open ? 'order-drawer-overlay--open' : ''}`}
        onClick={onClose}
        aria-hidden={!open}
      />
      <aside
        className={`order-drawer ${open ? 'order-drawer--open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={`Order ${order.id}`}
      >
        <header className="order-drawer__header">
          <div>
            <p className="order-drawer__eyebrow">Order details</p>
            <h2 className="order-drawer__title">{order.id}</h2>
            <div className="order-drawer__badges">
              <span className={`order-pill order-pill--${slug(order.status)}`}>
                {order.status}
              </span>
              <span className={`order-pill order-pill--${slug(order.payment)}`}>
                {order.payment}
              </span>
            </div>
          </div>
          <button
            type="button"
            className="order-drawer__close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </header>

        <div className="order-drawer__body">
          <section className="order-card">
            <h3 className="order-card__title">
              <Package size={15} /> Summary
            </h3>
            <div className="order-summary-grid">
              <div>
                <span className="order-label">Customer</span>
                <strong>
                  <User size={13} /> {order.customer}
                </strong>
                <span className="order-muted">{order.customerPhone}</span>
              </div>
              <div>
                <span className="order-label">Driver</span>
                <strong>
                  <Truck size={13} /> {order.driver}
                </strong>
                <span className="order-muted">
                  {order.driverId} · {order.vehicleType} · {order.vehicle}
                </span>
              </div>
              <div>
                <span className="order-label">Pickup</span>
                <strong>
                  <MapPin size={13} /> {order.pickup}
                </strong>
              </div>
              <div>
                <span className="order-label">Drop</span>
                <strong>
                  <Navigation size={13} /> {order.drop}
                </strong>
              </div>
              <div>
                <span className="order-label">Distance</span>
                <strong>{order.distance}</strong>
              </div>
              <div>
                <span className="order-label">Fare</span>
                <strong className="order-fare">{formatFare(order.fare)}</strong>
              </div>
              <div>
                <span className="order-label">Items</span>
                <strong>{order.items}</strong>
                <span className="order-muted">{order.weight}</span>
              </div>
              <div>
                <span className="order-label">Placed</span>
                <strong>{order.date}</strong>
                <span className="order-muted">{order.time}</span>
              </div>
            </div>
            {order.notes ? (
              <p className="order-notes">{order.notes}</p>
            ) : null}
          </section>

          <section className="order-card">
            <h3 className="order-card__title">
              <Clock size={15} /> Timeline
            </h3>
            <ol className="order-timeline">
              {order.timeline.map((event) => (
                <li
                  key={`${event.label}-${event.time}`}
                  className={`order-timeline__item ${event.done ? 'is-done' : ''}`}
                >
                  <span className="order-timeline__dot" aria-hidden />
                  <div>
                    <div className="order-timeline__row">
                      <strong>{event.label}</strong>
                      <span>{event.time}</span>
                    </div>
                    {event.detail ? <p>{event.detail}</p> : null}
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="order-card">
            <h3 className="order-card__title">
              <Navigation size={15} /> Tracking
            </h3>
            <ul className="order-tracking">
              {order.tracking.map((point) => (
                <li key={`${point.label}-${point.time}`}>
                  <div className="order-tracking__row">
                    <strong>{point.label}</strong>
                    <span>{point.time}</span>
                  </div>
                  <p>{point.location}</p>
                </li>
              ))}
            </ul>
          </section>

          <section className="order-card">
            <div className="order-card__title-row">
              <h3 className="order-card__title">
                <MapPin size={15} /> Map
              </h3>
              <span className="order-eta">ETA {order.map.eta}</span>
            </div>
            <div className="order-map" role="img" aria-label="Route map preview">
              <div className="order-map__grid" aria-hidden />
              <svg className="order-map__svg" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path
                  className="order-map__route"
                  d={`M ${order.map.pickup.x} ${order.map.pickup.y} Q ${(order.map.pickup.x + order.map.drop.x) / 2} ${Math.min(order.map.pickup.y, order.map.drop.y) - 12}, ${order.map.drop.x} ${order.map.drop.y}`}
                  fill="none"
                />
              </svg>
              <div
                className="order-map__pin order-map__pin--pickup"
                style={{ left: `${order.map.pickup.x}%`, top: `${order.map.pickup.y}%` }}
              >
                <span>P</span>
                <em>{order.pickupArea}</em>
              </div>
              <div
                className="order-map__pin order-map__pin--drop"
                style={{ left: `${order.map.drop.x}%`, top: `${order.map.drop.y}%` }}
              >
                <span>D</span>
                <em>{order.dropArea}</em>
              </div>
              {order.map.current ? (
                <div
                  className="order-map__pin order-map__pin--current"
                  style={{
                    left: `${order.map.current.x}%`,
                    top: `${order.map.current.y}%`,
                  }}
                >
                  <span />
                </div>
              ) : null}
            </div>
            <div className="order-map__legend">
              <span>
                <i className="is-pickup" /> Pickup
              </span>
              <span>
                <i className="is-drop" /> Drop
              </span>
              {order.map.current ? (
                <span>
                  <i className="is-current" /> Live
                </span>
              ) : null}
            </div>
          </section>

          <section className="order-card">
            <h3 className="order-card__title">
              <FileText size={15} /> Invoice
            </h3>
            <div className="order-invoice-meta">
              <span>{order.invoice.invoiceNo}</span>
              <span>{order.paymentMethod}</span>
            </div>
            <ul className="order-invoice">
              {order.invoice.base.map((line) => (
                <li key={line.label}>
                  <span>{line.label}</span>
                  <strong>{line.amount}</strong>
                </li>
              ))}
            </ul>
            <div className="order-invoice__total">
              <span>Total</span>
              <strong>{order.invoice.total}</strong>
            </div>
          </section>

          <section className="order-card">
            <h3 className="order-card__title">
              <CreditCard size={15} /> Payment History
            </h3>
            {order.payments.length === 0 ? (
              <p className="order-empty">No payment events yet.</p>
            ) : (
              <ul className="order-history-list">
                {order.payments.map((pay) => (
                  <li key={pay.id}>
                    <div>
                      <strong>{pay.id}</strong>
                      <p>{pay.method}</p>
                      <span className="order-muted">{pay.time}</span>
                    </div>
                    <div className="order-history-list__right">
                      <strong>{pay.amount}</strong>
                      <span className={`order-pill order-pill--${slug(pay.status)}`}>
                        {pay.status}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="order-card">
            <h3 className="order-card__title">
              <Headphones size={15} /> Support History
            </h3>
            {order.support.length === 0 ? (
              <p className="order-empty">No support tickets linked to this order.</p>
            ) : (
              <ul className="order-history-list">
                {order.support.map((ticket) => (
                  <li key={ticket.id}>
                    <div>
                      <strong>{ticket.subject}</strong>
                      <p>{ticket.id}</p>
                      <span className="order-muted">{ticket.time}</span>
                    </div>
                    <span className={`order-pill order-pill--${slug(ticket.status)}`}>
                      {ticket.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </aside>
    </>
  )
}
