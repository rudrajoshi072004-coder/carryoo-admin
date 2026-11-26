import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  X,
  Star,
  Phone,
  Mail,
  MapPin,
  Wallet,
  Car,
  FileText,
  UserRound,
  Building2,
  Activity,
  Route,
  Radio,
  Download,
} from 'lucide-react'
import type { Driver, DriverTrip } from '../data/driversData'
import { fetchDriverBookingsAdmin } from '../api/services/adminData'
import { bookingToDrawerTrip, downloadDriverDetailCsv } from '../lib/driverExport'
import { useToast } from './Toast'
import { invalidateCache } from '../lib/queryCache'
import { UserBlockPanel } from './UserBlockPanel'
import './DriverDrawer.css'

interface DriverDrawerProps {
  driver: Driver | null
  open: boolean
  onClose: () => void
  onApproveKyc?: (driver: Driver) => void | Promise<void>
  approvingKyc?: boolean
}

function formatWallet(amount: number) {
  return `₹${amount.toLocaleString('en-IN')}`
}

function statusClass(status: string) {
  return `driver-status driver-status--${status.toLowerCase().replace(/\s+/g, '-')}`
}

function docStatusClass(status: string) {
  return `doc-status doc-status--${status.toLowerCase().replace(/\s+/g, '-')}`
}

export default function DriverDrawer({
  driver,
  open,
  onClose,
  onApproveKyc,
  approvingKyc = false,
}: DriverDrawerProps) {
  const { toast } = useToast()
  const [trips, setTrips] = useState<DriverTrip[]>([])
  const [tripsLoading, setTripsLoading] = useState(false)
  const [downloading, setDownloading] = useState(false)

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

  useEffect(() => {
    if (!open || !driver) {
      setTrips([])
      return
    }
    let cancelled = false
    setTripsLoading(true)
    fetchDriverBookingsAdmin(driver)
      .then((bookings) => {
        if (!cancelled) setTrips(bookings.map(bookingToDrawerTrip))
      })
      .catch(() => {
        if (!cancelled) setTrips(driver.recentTrips)
      })
      .finally(() => {
        if (!cancelled) setTripsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, driver])

  const handleDownload = async () => {
    if (!driver || downloading) return
    setDownloading(true)
    try {
      invalidateCache('GET:/bookings')
      const result = await downloadDriverDetailCsv(driver)
      toast({
        title: 'Driver data downloaded',
        description: result.trips
          ? `${result.trips} trip${result.trips === 1 ? '' : 's'} plus profile details saved as CSV.`
          : 'Profile details saved. No trips found for this driver yet.',
      })
    } catch (err) {
      toast({
        title: 'Download failed',
        description: err instanceof Error ? err.message : 'Could not fetch this driver’s trips.',
        tone: 'error',
      })
    } finally {
      setDownloading(false)
    }
  }

  if (!driver) return null

  const visibleTrips = trips.length ? trips : driver.recentTrips

  return (
    <>
      <div
        className={`driver-drawer-overlay ${open ? 'driver-drawer-overlay--open' : ''}`}
        onClick={onClose}
        aria-hidden={!open}
      />
      <aside
        className={`driver-drawer ${open ? 'driver-drawer--open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={`${driver.name} profile`}
      >
        <header className="driver-drawer__header">
          <div className="driver-drawer__identity">
            <div
              className="driver-drawer__avatar"
              style={{ background: `${driver.accent}18`, color: driver.accent }}
              aria-hidden
            >
              {driver.initials}
            </div>
            <div>
              <h2 className="driver-drawer__name">
                {driver.name}
                {driver.isFavorite ? (
                  <span className="driver-favorite-badge">Favorite</span>
                ) : null}
              </h2>
              <p className="driver-drawer__id">{driver.displayId ?? `DRV-${driver.id.replace(/-/g, '').slice(-6).toUpperCase()}`}</p>
            </div>
          </div>
          <div className="driver-drawer__header-actions">
            <span className={statusClass(driver.status)}>{driver.status}</span>
            <button
              type="button"
              className="driver-drawer__download-icon"
              onClick={handleDownload}
              disabled={downloading}
              title="Download all driver data as CSV"
              aria-label="Download all driver data as CSV"
            >
              <Download size={16} />
            </button>
            <button
              type="button"
              className="driver-drawer__close"
              onClick={onClose}
              aria-label="Close drawer"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        <div className="driver-drawer__body">
          {driver.userId ? <UserBlockPanel userId={driver.userId} /> : null}
          <section className="drawer-section">
            <h3 className="drawer-section__title">
              <UserRound size={15} /> Driver Profile
            </h3>
            {(driver.status === 'New' || driver.status === 'Pending KYC') && (
              <p className="drawer-section__meta">
                {driver.status === 'New'
                  ? 'New registration — onboarding not completed yet.'
                  : 'Onboarding submitted — KYC review pending.'}
              </p>
            )}
            {driver.status === 'Pending KYC' && onApproveKyc ? (
              <button
                type="button"
                className="driver-drawer__approve-kyc"
                disabled={approvingKyc}
                onClick={() => onApproveKyc(driver)}
              >
                {approvingKyc ? 'Approving…' : 'Approve KYC'}
              </button>
            ) : null}
            <button
              type="button"
              className="driver-drawer__download"
              onClick={handleDownload}
              disabled={downloading}
            >
              <Download size={15} strokeWidth={1.75} />
              {downloading ? 'Downloading…' : 'Download all data (CSV)'}
            </button>
            {(driver.status === 'Online' || driver.status === 'Busy') ? (
              <Link
                to={`/live-tracking?filter=active&driver=${encodeURIComponent(driver.id)}`}
                className="driver-drawer__live-link"
              >
                <Radio size={15} strokeWidth={1.75} />
                View live location
              </Link>
            ) : (
              <Link
                to={`/live-tracking?driver=${encodeURIComponent(driver.id)}`}
                className="driver-drawer__live-link driver-drawer__live-link--ghost"
              >
                <Radio size={15} strokeWidth={1.75} />
                Open live map
              </Link>
            )}
            <div className="drawer-grid">
              <div className="drawer-field">
                <span className="drawer-field__label">Phone</span>
                <span className="drawer-field__value">
                  <Phone size={13} /> {driver.driverPhone || driver.phone}
                </span>
              </div>
              {driver.accountPhone && driver.accountPhone !== (driver.driverPhone || driver.phone) ? (
                <div className="drawer-field">
                  <span className="drawer-field__label">Login phone</span>
                  <span className="drawer-field__value">
                    <Phone size={13} /> {driver.accountPhone}
                  </span>
                </div>
              ) : null}
              <div className="drawer-field">
                <span className="drawer-field__label">Email</span>
                <span className="drawer-field__value">
                  <Mail size={13} /> {driver.email}
                </span>
              </div>
              <div className="drawer-field">
                <span className="drawer-field__label">City</span>
                <span className="drawer-field__value">
                  <MapPin size={13} /> {driver.city}
                </span>
              </div>
              <div className="drawer-field">
                <span className="drawer-field__label">Joined</span>
                <span className="drawer-field__value">{driver.joined}</span>
              </div>
              <div className="drawer-field">
                <span className="drawer-field__label">Experience</span>
                <span className="drawer-field__value">{driver.experience}</span>
              </div>
              <div className="drawer-field">
                <span className="drawer-field__label">Rating</span>
                <span className="drawer-field__value drawer-field__value--rating">
                  <Star size={13} fill="#f59e0b" color="#f59e0b" /> {driver.rating.toFixed(1)}
                </span>
              </div>
            </div>
          </section>

          <section className="drawer-section">
            <h3 className="drawer-section__title">
              <FileText size={15} /> Documents
            </h3>
            <div className="drawer-table-wrap">
              <table className="drawer-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Number</th>
                    <th>Expiry</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {driver.documents.map((doc) => (
                    <tr key={doc.type}>
                      <td>{doc.type}</td>
                      <td className="drawer-mono">{doc.number}</td>
                      <td>{doc.expiry}</td>
                      <td>
                        <span className={docStatusClass(doc.status)}>{doc.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="drawer-section">
            <h3 className="drawer-section__title">
              <Wallet size={15} /> Wallet
            </h3>
            <div className="drawer-wallet-balance">
              <span>Available balance</span>
              <strong>{formatWallet(driver.wallet)}</strong>
            </div>
            <ul className="drawer-timeline">
              {driver.walletHistory.map((item) => (
                <li key={`${item.label}-${item.time}`} className="drawer-timeline__item">
                  <div>
                    <p className="drawer-timeline__text">{item.label}</p>
                    <span className="drawer-timeline__time">{item.time}</span>
                  </div>
                  <span
                    className={`drawer-timeline__amount ${item.type === 'credit' ? 'is-credit' : 'is-debit'}`}
                  >
                    {item.amount}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="drawer-section">
            <h3 className="drawer-section__title">
              <Route size={15} /> Trips
            </h3>
            <p className="drawer-section__meta">
              {tripsLoading
                ? 'Loading trips from backend…'
                : `${(trips.length || driver.trips).toLocaleString('en-IN')} trips`}
            </p>
            <div className="drawer-table-wrap">
              <table className="drawer-table">
                <thead>
                  <tr>
                    <th>Trip</th>
                    <th>From → To</th>
                    <th>Fare</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleTrips.map((trip) => (
                    <tr key={trip.id}>
                      <td>
                        <div className="drawer-table__primary">{trip.id}</div>
                        <div className="drawer-table__secondary">{trip.date}</div>
                      </td>
                      <td>
                        <div>{trip.route}</div>
                        <div className="drawer-table__secondary">{trip.distance}</div>
                      </td>
                      <td className="drawer-mono">{trip.fare}</td>
                      <td>
                        <span className={docStatusClass(trip.status)}>{trip.status}</span>
                      </td>
                    </tr>
                  ))}
                  {!tripsLoading && visibleTrips.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="drawer-table__secondary">No trips found for this driver yet.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>

          <section className="drawer-section">
            <h3 className="drawer-section__title">
              <Activity size={15} /> Performance
            </h3>
            <div className="drawer-metrics">
              <div className="drawer-metric">
                <span className="drawer-metric__label">Completion</span>
                <strong>{driver.completionRate}%</strong>
              </div>
              <div className="drawer-metric">
                <span className="drawer-metric__label">Acceptance</span>
                <strong>{driver.acceptanceRate}%</strong>
              </div>
              <div className="drawer-metric">
                <span className="drawer-metric__label">Cancellation</span>
                <strong>{driver.cancellationRate}%</strong>
              </div>
              <div className="drawer-metric">
                <span className="drawer-metric__label">Avg trip</span>
                <strong>{driver.avgTripValue}</strong>
              </div>
              <div className="drawer-metric">
                <span className="drawer-metric__label">Total earnings</span>
                <strong>{driver.totalEarnings}</strong>
              </div>
              <div className="drawer-metric">
                <span className="drawer-metric__label">Rating</span>
                <strong>{driver.rating.toFixed(1)} ★</strong>
              </div>
            </div>
          </section>

          <section className="drawer-section">
            <h3 className="drawer-section__title">
              <Car size={15} /> Vehicle Details
            </h3>
            <div className="drawer-grid">
              <div className="drawer-field">
                <span className="drawer-field__label">Make / Model</span>
                <span className="drawer-field__value">
                  {driver.vehicleDetails.make} {driver.vehicleDetails.model}
                </span>
              </div>
              <div className="drawer-field">
                <span className="drawer-field__label">Year</span>
                <span className="drawer-field__value">{driver.vehicleDetails.year}</span>
              </div>
              <div className="drawer-field">
                <span className="drawer-field__label">Color</span>
                <span className="drawer-field__value">{driver.vehicleDetails.color}</span>
              </div>
              <div className="drawer-field">
                <span className="drawer-field__label">Plate</span>
                <span className="drawer-field__value drawer-mono">{driver.vehicleDetails.plate}</span>
              </div>
              {driver.vehicleDetails.fuelType ? (
                <div className="drawer-field">
                  <span className="drawer-field__label">Fuel</span>
                  <span className="drawer-field__value">{driver.vehicleDetails.fuelType}</span>
                </div>
              ) : null}
              <div className="drawer-field">
                <span className="drawer-field__label">Insurance</span>
                <span className="drawer-field__value">{driver.vehicleDetails.insurance}</span>
              </div>
              <div className="drawer-field">
                <span className="drawer-field__label">Fitness</span>
                <span className="drawer-field__value">{driver.vehicleDetails.fitness}</span>
              </div>
            </div>
          </section>

          <section className="drawer-section">
            <h3 className="drawer-section__title">
              <Phone size={15} /> Emergency Contact
            </h3>
            <div className="drawer-grid">
              <div className="drawer-field">
                <span className="drawer-field__label">Name</span>
                <span className="drawer-field__value">{driver.emergencyContact.name}</span>
              </div>
              <div className="drawer-field">
                <span className="drawer-field__label">Relation</span>
                <span className="drawer-field__value">{driver.emergencyContact.relation}</span>
              </div>
              <div className="drawer-field">
                <span className="drawer-field__label">Phone</span>
                <span className="drawer-field__value">{driver.emergencyContact.phone}</span>
              </div>
            </div>
          </section>

          <section className="drawer-section">
            <h3 className="drawer-section__title">
              <Building2 size={15} /> Bank Details
            </h3>
            <div className="drawer-grid">
              <div className="drawer-field">
                <span className="drawer-field__label">Account name</span>
                <span className="drawer-field__value">{driver.bankDetails.accountName}</span>
              </div>
              <div className="drawer-field">
                <span className="drawer-field__label">Bank</span>
                <span className="drawer-field__value">{driver.bankDetails.bank}</span>
              </div>
              <div className="drawer-field">
                <span className="drawer-field__label">Account</span>
                <span className="drawer-field__value drawer-mono">{driver.bankDetails.accountNumber}</span>
              </div>
              <div className="drawer-field">
                <span className="drawer-field__label">IFSC</span>
                <span className="drawer-field__value drawer-mono">{driver.bankDetails.ifsc}</span>
              </div>
              <div className="drawer-field">
                <span className="drawer-field__label">UPI</span>
                <span className="drawer-field__value drawer-mono">{driver.bankDetails.upi}</span>
              </div>
            </div>
          </section>

          <section className="drawer-section">
            <h3 className="drawer-section__title">
              <Activity size={15} /> Recent Activity
            </h3>
            <ul className="drawer-activity">
              {driver.recentActivity.map((item) => (
                <li key={`${item.text}-${item.time}`}>
                  <span className="drawer-activity__dot" aria-hidden />
                  <div>
                    <p>{item.text}</p>
                    <span>{item.time}</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </aside>
    </>
  )
}
