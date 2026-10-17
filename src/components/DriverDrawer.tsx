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
  Camera,
  CreditCard,
  Smartphone,
  ShieldCheck,
} from 'lucide-react'
import DocumentPreviewModal from './DocumentPreviewModal'
import type { Driver, DriverDocument } from '../data/driversData'
import './DriverDrawer.css'

function getDocIcon(type: string) {
  const t = (type || '').toLowerCase()
  if (t.includes('selfie') || t.includes('photo')) return <Camera size={13} />
  if (t.includes('rc') || t.includes('registration') || t.includes('vehicle')) return <Car size={13} />
  if (t.includes('pan') || t.includes('aadhaar') || t.includes('license') || t.includes('dl')) return <CreditCard size={13} />
  return <FileText size={13} />
}

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
                <span className="drawer-field__label">Outstation Trips</span>
                <span className="drawer-field__value">
                  {driver.acceptsOutstation !== false ? (
                    <span style={{ color: "#16a34a", fontWeight: 700 }}>Opted In</span>
                  ) : (
                    <span style={{ color: "#64748b", fontWeight: 600 }}>Opted Out</span>
                  )}
                </span>
              </div>
              <div className="drawer-field">
                <span className="drawer-field__label">Mandatory Training</span>
                <span className="drawer-field__value">
                  {driver.trainingCompleted ? (
                    <span style={{ color: "#16a34a", fontWeight: 700 }}>✓ Completed</span>
                  ) : (
                    <span style={{ color: "#d97706", fontWeight: 700 }}>Pending Induction</span>
                  )}
                </span>
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
              <FileText size={15} /> KYC Verification Documents
            </h3>

            {driver.documents.length > 0 ? (
              <>
                <div className="drawer-docs-summary">
                  <span className="drawer-docs-summary__text">
                    <ShieldCheck size={14} color="#059669" />
                    {driver.documents.length} Documents Submitted
                  </span>
                  <span
                    className={`drawer-docs-summary__pill ${
                      driver.documents.filter((d) => d.status === 'Verified').length === driver.documents.length
                        ? ''
                        : 'drawer-docs-summary__pill--pending'
                    }`}
                  >
                    {driver.documents.filter((d) => d.status === 'Verified').length === driver.documents.length
                      ? 'All Verified'
                      : `${driver.documents.filter((d) => d.status === 'Verified').length}/${driver.documents.length} Verified`}
                  </span>
                </div>

                <div className="drawer-docs-grid">
                  {driver.documents.map((doc) => (
                    <div key={doc.type} className="drawer-doc-card">
                      <div className="drawer-doc-card__head">
                        <span className="drawer-doc-card__title" title={doc.type}>
                          {getDocIcon(doc.type)}
                          <span>{doc.type}</span>
                        </span>
                        <span className={docStatusClass(doc.status)}>{doc.status}</span>
                      </div>

                      <div
                        className="drawer-doc-card__preview"
                        onClick={() => setSelectedDoc(doc)}
                        title="Click to inspect document full screen"
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            setSelectedDoc(doc)
                          }
                        }}
                      >
                        {doc.url ? (
                          <>
                            <img src={doc.url} alt={doc.type} className="drawer-doc-card__img" />
                            <div className="drawer-doc-card__overlay">
                              <Eye size={13} />
                              <span>Inspect</span>
                            </div>
                          </>
                        ) : (
                          <div className="drawer-doc-card__placeholder">
                            {doc.isDeviceCache ? (
                              <>
                                <Smartphone size={22} color="#2563eb" />
                                <span className="drawer-doc-card__placeholder-label">Mobile Capture</span>
                                <span className="drawer-doc-card__device-badge">App Upload</span>
                              </>
                            ) : (
                              <>
                                {getDocIcon(doc.type)}
                                <span className="drawer-doc-card__placeholder-label">Document Photo</span>
                                <span className="drawer-doc-card__placeholder-sub">Click to review details</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="drawer-doc-card__footer">
                        <span className="drawer-doc-card__num" title={doc.number}>
                          {doc.number && doc.number !== '—'
                            ? doc.number
                            : doc.isDeviceCache
                              ? 'Device Photo'
                              : 'Submitted'}
                        </span>
                        <button
                          type="button"
                          className="drawer-doc-card__btn"
                          title={`Inspect ${doc.type}`}
                          onClick={() => setSelectedDoc(doc)}
                        >
                          <Eye size={11} />
                          <span>View</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="drawer-section__meta">No documents uploaded yet.</p>
            )}
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
                {
                  label: 'Document Number',
                  value:
                    selectedDoc.number && selectedDoc.number !== '—'
                      ? selectedDoc.number
                      : selectedDoc.isDeviceCache
                        ? 'Mobile Upload'
                        : '—',
                },
                { label: 'Status', value: selectedDoc.status },
                { label: 'Expiry Date', value: selectedDoc.expiry },
                ...(selectedDoc.isDeviceCache
                  ? [{ label: 'Upload Source', value: 'Mobile Camera Capture' }]
                  : []),
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
