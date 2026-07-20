import { useState } from 'react'
import {
  Building2,
  Palette,
  Receipt,
  Plug,
  Scale,
  Smartphone,
  Save,
  AlertTriangle,
} from 'lucide-react'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { PageHeader } from '../components/PageHeader'
import { useToast } from '../components/Toast'
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  Skeleton,
  StatusPill,
} from '../components/ui'
import { useAsyncData } from '../hooks/useAsyncData'
import { getApiErrorMessage } from '../api/client'
import { fetchSettingsAdmin, persistSettingsAdmin } from '../api/services/adminData'
import { type PlatformSettings } from '../data/settingsData'
import './Settings.css'

async function fetchSettings() {
  return fetchSettingsAdmin()
}

function SettingsSkeleton() {
  return (
    <div className="settings-page cy-page" aria-busy="true">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} variant="card" style={{ height: 200, marginBottom: 16 }} />
      ))}
    </div>
  )
}

export default function Settings() {
  const { toast } = useToast()
  const { data, loading, error, setData } = useAsyncData(fetchSettings, [])

  const [settings, setSettings] = useState<PlatformSettings | null>(null)
  const current = settings ?? data

  const [maintenanceConfirm, setMaintenanceConfirm] = useState(false)
  const [pendingMaintenance, setPendingMaintenance] = useState<boolean | null>(null)

  const update = (patch: Partial<PlatformSettings>) => {
    if (!current) return
    const next = { ...current, ...patch }
    setSettings(next)
    setData(next)
  }

  const saveSection = async (section: string) => {
    if (!current) return
    try {
      const saved = await persistSettingsAdmin(current)
      setSettings(saved)
      setData(saved)
      toast({ title: 'Settings saved', description: `${section} settings synced to backend when admin API is available.` })
    } catch (err) {
      toast({
        title: 'Saved locally',
        description: getApiErrorMessage(err),
        tone: 'warning',
      })
    }
  }

  const toggleMaintenance = (enable: boolean) => {
    if (!current) return
    update({
      app: { ...current.app, maintenanceMode: enable },
    })
    toast({
      title: enable ? 'Maintenance mode enabled' : 'Maintenance mode disabled',
      description: enable
        ? 'Users will see the maintenance message on next app launch.'
        : 'Platform is live for all users.',
      tone: enable ? 'warning' : 'success',
    })
    setPendingMaintenance(null)
  }

  if (loading) return <SettingsSkeleton />

  if (error || !current) {
    return (
      <Card>
        <EmptyState
          icon={<Building2 size={24} strokeWidth={1.75} />}
          title="Unable to load settings"
          description={error ?? 'Could not fetch platform settings.'}
          action={<Button variant="primary" onClick={() => window.location.reload()}>Retry</Button>}
        />
      </Card>
    )
  }

  return (
    <div className="settings-page cy-page">
      <PageHeader
        title="Settings"
        subtitle="Configure company profile, integrations, taxes, and platform preferences."
        crumbs={[{ label: 'Platform' }, { label: 'Settings' }]}
        actions={
          current.app.maintenanceMode ? (
            <StatusPill status="Maintenance" tone="warning" />
          ) : (
            <StatusPill status="Live" tone="active" />
          )
        }
      />

      <Card className="settings-section">
        <CardHeader
          title="Company profile"
          subtitle="Legal entity and contact information"
          action={
            <Button variant="primary" size="sm" onClick={() => saveSection('Company')}>
              <Save size={14} strokeWidth={1.75} /> Save
            </Button>
          }
        />
        <CardBody>
          <div className="settings-grid">
            <label className="settings-field">
              <span>Company name</span>
              <input
                value={current.company.name}
                onChange={(e) => update({ company: { ...current.company, name: e.target.value } })}
              />
            </label>
            <label className="settings-field">
              <span>Legal name</span>
              <input
                value={current.company.legalName}
                onChange={(e) => update({ company: { ...current.company, legalName: e.target.value } })}
              />
            </label>
            <label className="settings-field">
              <span>GSTIN</span>
              <input
                value={current.company.gstin}
                onChange={(e) => update({ company: { ...current.company, gstin: e.target.value } })}
              />
            </label>
            <label className="settings-field">
              <span>PAN</span>
              <input
                value={current.company.pan}
                onChange={(e) => update({ company: { ...current.company, pan: e.target.value } })}
              />
            </label>
            <label className="settings-field settings-field--wide">
              <span>Address</span>
              <input
                value={current.company.address}
                onChange={(e) => update({ company: { ...current.company, address: e.target.value } })}
              />
            </label>
            <label className="settings-field">
              <span>Support email</span>
              <input
                value={current.company.supportEmail}
                onChange={(e) => update({ company: { ...current.company, supportEmail: e.target.value } })}
              />
            </label>
            <label className="settings-field">
              <span>Support phone</span>
              <input
                value={current.company.supportPhone}
                onChange={(e) => update({ company: { ...current.company, supportPhone: e.target.value } })}
              />
            </label>
          </div>
        </CardBody>
      </Card>

      <Card className="settings-section">
        <CardHeader
          title="Branding"
          subtitle="Brand colors and visual identity"
          action={
            <Button variant="primary" size="sm" onClick={() => saveSection('Branding')}>
              <Palette size={14} strokeWidth={1.75} /> Save
            </Button>
          }
        />
        <CardBody>
          <div className="settings-grid settings-grid--colors">
            {(['primary', 'accent', 'success', 'warning', 'danger'] as const).map((key) => (
              <label key={key} className="settings-field settings-field--color">
                <span>{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                <div className="settings-color-input">
                  <input
                    type="color"
                    value={current.branding[key]}
                    onChange={(e) =>
                      update({ branding: { ...current.branding, [key]: e.target.value } })
                    }
                  />
                  <input
                    type="text"
                    value={current.branding[key]}
                    onChange={(e) =>
                      update({ branding: { ...current.branding, [key]: e.target.value } })
                    }
                  />
                </div>
              </label>
            ))}
          </div>
        </CardBody>
      </Card>

      <Card className="settings-section">
        <CardHeader
          title="Taxes"
          subtitle="GST, TDS, and invoicing configuration"
          action={
            <Button variant="primary" size="sm" onClick={() => saveSection('Taxes')}>
              <Receipt size={14} strokeWidth={1.75} /> Save
            </Button>
          }
        />
        <CardBody>
          <div className="settings-grid">
            <label className="settings-toggle">
              <input
                type="checkbox"
                checked={current.taxes.gstEnabled}
                onChange={(e) => update({ taxes: { ...current.taxes, gstEnabled: e.target.checked } })}
              />
              <span>GST enabled</span>
            </label>
            <label className="settings-field">
              <span>GST rate (%)</span>
              <input
                type="number"
                value={current.taxes.gstRate}
                onChange={(e) => update({ taxes: { ...current.taxes, gstRate: Number(e.target.value) } })}
              />
            </label>
            <label className="settings-field">
              <span>CGST (%)</span>
              <input
                type="number"
                value={current.taxes.cgstRate}
                onChange={(e) => update({ taxes: { ...current.taxes, cgstRate: Number(e.target.value) } })}
              />
            </label>
            <label className="settings-field">
              <span>SGST (%)</span>
              <input
                type="number"
                value={current.taxes.sgstRate}
                onChange={(e) => update({ taxes: { ...current.taxes, sgstRate: Number(e.target.value) } })}
              />
            </label>
            <label className="settings-toggle">
              <input
                type="checkbox"
                checked={current.taxes.tdsEnabled}
                onChange={(e) => update({ taxes: { ...current.taxes, tdsEnabled: e.target.checked } })}
              />
              <span>TDS enabled</span>
            </label>
            <label className="settings-field">
              <span>Invoice prefix</span>
              <input
                value={current.taxes.invoicePrefix}
                onChange={(e) => update({ taxes: { ...current.taxes, invoicePrefix: e.target.value } })}
              />
            </label>
          </div>
        </CardBody>
      </Card>

      <Card className="settings-section">
        <CardHeader title="Integrations" subtitle="Payment, maps, Firebase, email, and SMS" />
        <CardBody>
          <div className="settings-integration-grid">
            <div className="settings-integration">
              <h3><Plug size={16} strokeWidth={1.75} /> Payment gateway</h3>
              <label className="settings-field">
                <span>Provider</span>
                <input value={current.paymentGateway.provider} readOnly />
              </label>
              <label className="settings-field">
                <span>Merchant ID</span>
                <input value={current.paymentGateway.merchantId} readOnly />
              </label>
              <label className="settings-toggle">
                <input
                  type="checkbox"
                  checked={current.paymentGateway.testMode}
                  onChange={(e) =>
                    update({ paymentGateway: { ...current.paymentGateway, testMode: e.target.checked } })
                  }
                />
                <span>Test mode</span>
              </label>
              <Button variant="secondary" size="sm" onClick={() => saveSection('Payment gateway')}>Save</Button>
            </div>
            <div className="settings-integration">
              <h3>Firebase</h3>
              <label className="settings-field">
                <span>Project ID</span>
                <input value={current.firebase.projectId} readOnly />
              </label>
              <label className="settings-field">
                <span>Auth domain</span>
                <input value={current.firebase.authDomain} readOnly />
              </label>
              <Button variant="secondary" size="sm" onClick={() => saveSection('Firebase')}>Save</Button>
            </div>
            <div className="settings-integration">
              <h3>Google Maps</h3>
              <label className="settings-field">
                <span>API key</span>
                <input value={current.googleMaps.apiKey} readOnly />
              </label>
              <label className="settings-toggle">
                <input
                  type="checkbox"
                  checked={current.googleMaps.geocodingEnabled}
                  onChange={(e) =>
                    update({ googleMaps: { ...current.googleMaps, geocodingEnabled: e.target.checked } })
                  }
                />
                <span>Geocoding enabled</span>
              </label>
              <Button variant="secondary" size="sm" onClick={() => saveSection('Google Maps')}>Save</Button>
            </div>
            <div className="settings-integration">
              <h3>Email (SendGrid)</h3>
              <label className="settings-field">
                <span>From email</span>
                <input
                  value={current.email.fromEmail}
                  onChange={(e) => update({ email: { ...current.email, fromEmail: e.target.value } })}
                />
              </label>
              <label className="settings-field">
                <span>SMTP host</span>
                <input value={current.email.smtpHost} readOnly />
              </label>
              <Button variant="secondary" size="sm" onClick={() => saveSection('Email')}>Save</Button>
            </div>
            <div className="settings-integration">
              <h3>SMS (MSG91)</h3>
              <label className="settings-field">
                <span>Sender ID</span>
                <input
                  value={current.sms.senderId}
                  onChange={(e) => update({ sms: { ...current.sms, senderId: e.target.value } })}
                />
              </label>
              <label className="settings-toggle">
                <input
                  type="checkbox"
                  checked={current.sms.otpEnabled}
                  onChange={(e) => update({ sms: { ...current.sms, otpEnabled: e.target.checked } })}
                />
                <span>OTP enabled</span>
              </label>
              <Button variant="secondary" size="sm" onClick={() => saveSection('SMS')}>Save</Button>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card className="settings-section">
        <CardHeader
          title="Legal"
          subtitle="Privacy policy, terms, and refund policy"
          action={
            <Button variant="primary" size="sm" onClick={() => saveSection('Legal')}>
              <Scale size={14} strokeWidth={1.75} /> Save
            </Button>
          }
        />
        <CardBody>
          <div className="settings-grid">
            <label className="settings-field settings-field--wide">
              <span>Privacy policy URL</span>
              <input
                value={current.legal.privacyPolicyUrl}
                onChange={(e) => update({ legal: { ...current.legal, privacyPolicyUrl: e.target.value } })}
              />
            </label>
            <label className="settings-field settings-field--wide">
              <span>Terms of service URL</span>
              <input
                value={current.legal.termsUrl}
                onChange={(e) => update({ legal: { ...current.legal, termsUrl: e.target.value } })}
              />
            </label>
            <label className="settings-field settings-field--wide">
              <span>Refund policy URL</span>
              <input
                value={current.legal.refundPolicyUrl}
                onChange={(e) => update({ legal: { ...current.legal, refundPolicyUrl: e.target.value } })}
              />
            </label>
          </div>
        </CardBody>
      </Card>

      <Card className="settings-section settings-section--app">
        <CardHeader
          title="App"
          subtitle="Version control and maintenance mode"
          action={
            <Button variant="primary" size="sm" onClick={() => saveSection('App')}>
              <Smartphone size={14} strokeWidth={1.75} /> Save
            </Button>
          }
        />
        <CardBody>
          <div className="settings-grid">
            <label className="settings-field">
              <span>App version</span>
              <input value={current.app.version} readOnly />
            </label>
            <label className="settings-field">
              <span>Min driver version</span>
              <input
                value={current.app.minDriverVersion}
                onChange={(e) => update({ app: { ...current.app, minDriverVersion: e.target.value } })}
              />
            </label>
            <label className="settings-field">
              <span>Min customer version</span>
              <input
                value={current.app.minCustomerVersion}
                onChange={(e) => update({ app: { ...current.app, minCustomerVersion: e.target.value } })}
              />
            </label>
            <label className="settings-field settings-field--wide">
              <span>Maintenance message</span>
              <textarea
                value={current.app.maintenanceMessage}
                onChange={(e) => update({ app: { ...current.app, maintenanceMessage: e.target.value } })}
                rows={2}
              />
            </label>
          </div>
          <div className="settings-maintenance">
            <div className="settings-maintenance__info">
              <AlertTriangle size={18} strokeWidth={1.75} />
              <div>
                <strong>Maintenance mode</strong>
                <p>When enabled, users cannot place orders or accept trips.</p>
              </div>
            </div>
            <label className="settings-toggle settings-toggle--large">
              <input
                type="checkbox"
                checked={current.app.maintenanceMode}
                onChange={(e) => {
                  setPendingMaintenance(e.target.checked)
                  setMaintenanceConfirm(true)
                }}
              />
              <span>{current.app.maintenanceMode ? 'Enabled' : 'Disabled'}</span>
            </label>
          </div>
          <div className="settings-flags">
            <h4>Feature flags</h4>
            <div className="settings-flags-grid">
              {Object.entries(current.app.featureFlags).map(([key, enabled]) => (
                <label key={key} className="settings-toggle">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) =>
                      update({
                        app: {
                          ...current.app,
                          featureFlags: { ...current.app.featureFlags, [key]: e.target.checked },
                        },
                      })
                    }
                  />
                  <span>{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                </label>
              ))}
            </div>
          </div>
        </CardBody>
      </Card>

      <ConfirmDialog
        open={maintenanceConfirm}
        title={pendingMaintenance ? 'Enable maintenance mode?' : 'Disable maintenance mode?'}
        description={
          pendingMaintenance
            ? 'All users will be blocked from using the platform until maintenance mode is turned off.'
            : 'The platform will become live again for all users immediately.'
        }
        confirmLabel={pendingMaintenance ? 'Enable' : 'Disable'}
        tone={pendingMaintenance ? 'danger' : 'primary'}
        onConfirm={() => {
          if (pendingMaintenance !== null) toggleMaintenance(pendingMaintenance)
        }}
        onClose={() => {
          setMaintenanceConfirm(false)
          setPendingMaintenance(null)
        }}
      />
    </div>
  )
}
