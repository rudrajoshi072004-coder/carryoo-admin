import { useEffect, useState } from 'react'
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
  Eye,
} from 'lucide-react'
import DocumentPreviewModal from './DocumentPreviewModal'
import type { Driver, DriverDocument } from '../data/driversData'
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
  const [selectedDoc, setSelectedDoc] = useState<DriverDocument | null>(null)

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

  if (!driver) return null

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
              <h2 className="driver-drawer__name">{driver.name}</h2>
              <p className="driver-drawer__id">{driver.displayId ?? `DRV-${driver.id.replace(/-/g, '').slice(-6).toUpperCase()}`}</p>
            </div>
          </div>
          <div className="driver-drawer__header-actions">
            <span className={statusClass(driver.status)}>{driver.status}</span>
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
          {/* Profile */}
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

          {/* Documents */}
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
                    <th>Preview</th>
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
                      <td>
                        <button
                          type="button"
                          className="drawer-doc-view-btn"
                          title={`Inspect ${doc.type}`}
                          onClick={() => setSelectedDoc(doc)}
                        >
                          <Eye size={13} />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Wallet */}
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

          {/* Trips */}
          <section className="drawer-section">
            <h3 className="drawer-section__title">
              <Route size={15} /> Trips
            </h3>
            <p className="drawer-section__meta">{driver.trips.toLocaleString('en-IN')} lifetime trips</p>
            <div className="drawer-table-wrap">
              <table className="drawer-table">
                <thead>
                  <tr>
                    <th>Trip</th>
                    <th>Route</th>
                    <th>Fare</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {driver.recentTrips.map((trip) => (
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
                </tbody>
              </table>
            </div>
          </section>

          {/* Performance */}
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

          {/* Vehicle */}
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

          {/* Emergency */}
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

          {/* Bank */}
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

          {/* Recent Activity */}
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

      <DocumentPreviewModal
        open={Boolean(selectedDoc)}
        onClose={() => setSelectedDoc(null)}
        title={selectedDoc ? `${selectedDoc.type} · ${driver.name}` : 'Document Preview'}
        subtitle={`Driver: ${driver.name} (${driver.displayId ?? driver.id})`}
        fileUrl={selectedDoc?.url}
        status={selectedDoc?.status}
        metadata={
          selectedDoc
            ? [
                { label: 'Document Type', value: selectedDoc.type },
                { label: 'Document Number', value: selectedDoc.number },
                { label: 'Status', value: selectedDoc.status },
                { label: 'Expiry Date', value: selectedDoc.expiry },
                { label: 'Driver Name', value: driver.name },
                { label: 'Driver Phone', value: driver.phone },
                { label: 'Vehicle', value: driver.vehicle },
              ]
            : []
        }
      />
    </>
  )
}
