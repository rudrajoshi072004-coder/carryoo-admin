import { useEffect, useMemo, useState } from 'react'
import { IndianRupee, Pencil, RotateCcw, Save } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { Button, Card, CardBody, CardHeader, EmptyState, Skeleton } from '../components/ui'
import { PermissionBanner } from '../components/PermissionBanner'
import { useToast } from '../components/Toast'
import { useAuth } from '../context/AuthContext'
import { useAsyncData } from '../hooks/useAsyncData'
import { getApiErrorMessage } from '../api/client'
import { listVehicleCategories, updateVehicleCategory } from '../api/services/vehicleCategories'
import { listServiceZones, updateServiceZone } from '../api/services/serviceZones'
import type { VehicleCategory, VehicleCategoryInput } from '../api/types'
import { formatINR } from '../lib/utils'
import {
  customerVehicleLabel,
  pickCustomerAppVehicles,
  usesTripTypePricing,
} from '../lib/customerVehicles'
import './Pricing.css'

const CITY_FIELDS = ['base_fare', 'per_km_rate', 'minimum_fare', 'waiting_per_min'] as const
const OUTSTATION_FIELDS = ['outstation_base_fare', 'outstation_per_km_rate', 'outstation_minimum_fare'] as const

type CityField = (typeof CITY_FIELDS)[number]
type OutstationField = (typeof OUTSTATION_FIELDS)[number]
type RateField = CityField | OutstationField

const RATE_LABELS: Record<RateField, string> = {
  base_fare: 'Base fare',
  per_km_rate: 'Per km',
  minimum_fare: 'Minimum fare',
  waiting_per_min: 'Waiting / min',
  outstation_base_fare: 'Base fare',
  outstation_per_km_rate: 'Per km',
  outstation_minimum_fare: 'Minimum fare',
}

function money(value: string | null | undefined, fallback = '0.00'): string {
  return (value && value.trim() !== '' ? value : fallback) as string
}

function categoryDraft(cat: VehicleCategory): Record<RateField, string> {
  return {
    base_fare: money(cat.base_fare),
    per_km_rate: money(cat.per_km_rate),
    minimum_fare: money(cat.minimum_fare, cat.base_fare),
    waiting_per_min: money(cat.waiting_per_min, '2.00'),
    outstation_base_fare: money(cat.outstation_base_fare, '0.00'),
    outstation_per_km_rate: money(cat.outstation_per_km_rate, cat.per_km_rate),
    outstation_minimum_fare: money(cat.outstation_minimum_fare, '0.00'),
  }
}

function normalizeRate(value: string, label: string): string {
  const parsed = Number.parseFloat(value.replace(/,/g, '').trim())
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${label} must be a valid non-negative number.`)
  }
  return parsed.toFixed(2)
}

function previewFare(base: string, perKm: string, minimum: string, km: number): number {
  return Math.round(
    Math.max(Number.parseFloat(minimum || '0'), Number.parseFloat(base || '0') + Number.parseFloat(perKm || '0') * km),
  )
}

function RateInputs({
  fields,
  draft,
  canEdit,
  onChange,
}: {
  fields: readonly RateField[]
  draft: Record<RateField, string>
  canEdit: boolean
  onChange: (field: RateField, value: string) => void
}) {
  return (
    <div className={`pricing-fare-grid ${canEdit ? 'pricing-fare-grid--editable' : ''}`}>
      {fields.map((key) => (
        <label key={key} className="pricing-fare-field">
          <span className="pricing-fare-field__label">{RATE_LABELS[key]}</span>
          <div className={`pricing-fare-field__input-wrap ${canEdit ? 'is-editable' : 'is-readonly'}`}>
            <IndianRupee size={14} strokeWidth={1.75} aria-hidden />
            <input
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={draft[key]}
              onChange={(e) => onChange(key, e.target.value)}
              disabled={!canEdit}
              readOnly={!canEdit}
              aria-label={RATE_LABELS[key]}
            />
            {canEdit ? <Pencil size={14} strokeWidth={1.75} className="pricing-fare-field__edit-icon" aria-hidden /> : null}
          </div>
        </label>
      ))}
    </div>
  )
}

export default function Pricing() {
  const { isAdmin, user } = useAuth()
  const { toast } = useToast()
  const canEdit = isAdmin

  const { data: categories, loading: catLoading, error: catError, refetch: refetchCat, setData: setCategories } =
    useAsyncData(listVehicleCategories, [])
  const { data: zones, loading: zonesLoading, error: zonesError, refetch: refetchZones, setData: setZones } =
    useAsyncData(listServiceZones, [])

  const customerCategories = useMemo(() => pickCustomerAppVehicles(categories ?? []), [categories])
  const primaryZone = zones?.[0] ?? null

  const [activeId, setActiveId] = useState<string | null>(null)
  const emptyDraft = useMemo(() => categoryDraft({
    id: '',
    name: '',
    base_fare: '',
    per_km_rate: '',
    active: true,
  }), [])
  const [draft, setDraft] = useState<Record<RateField, string>>(emptyDraft)
  const [savedSnapshot, setSavedSnapshot] = useState<Record<RateField, string>>(emptyDraft)
  const [savingCat, setSavingCat] = useState(false)
  const [radiusDraft, setRadiusDraft] = useState('')
  const [savingRadius, setSavingRadius] = useState(false)

  useEffect(() => {
    if (!customerCategories.length) return
    const stillVisible = activeId ? customerCategories.some((c) => c.id === activeId) : false
    if (!activeId || !stillVisible) {
      const cat = customerCategories[0]
      const next = categoryDraft(cat)
      setActiveId(cat.id)
      setDraft(next)
      setSavedSnapshot(next)
    }
  }, [customerCategories, activeId])

  useEffect(() => {
    setRadiusDraft(primaryZone?.service_radius_km ?? '50')
  }, [primaryZone])

  const activeCategory = useMemo(
    () => customerCategories.find((c) => c.id === activeId) ?? customerCategories[0] ?? null,
    [customerCategories, activeId],
  )
  const showOutstation = Boolean(activeCategory && usesTripTypePricing(activeCategory.name))
  const ratesDirty = useMemo(() => {
    const keys: RateField[] = showOutstation ? [...CITY_FIELDS, ...OUTSTATION_FIELDS] : [...CITY_FIELDS]
    return keys.some((key) => draft[key] !== savedSnapshot[key])
  }, [draft, savedSnapshot, showOutstation])
  const radiusDirty = Boolean(primaryZone && radiusDraft !== (primaryZone.service_radius_km ?? ''))

  const selectCategory = (cat: VehicleCategory) => {
    const next = categoryDraft(cat)
    setActiveId(cat.id)
    setDraft(next)
    setSavedSnapshot(next)
  }

  const saveRates = async () => {
    if (!activeCategory || !canEdit) return
    setSavingCat(true)
    try {
      const payload: Partial<VehicleCategoryInput> = {
        base_fare: normalizeRate(draft.base_fare, 'Base fare'),
        per_km_rate: normalizeRate(draft.per_km_rate, 'Per km'),
        minimum_fare: normalizeRate(draft.minimum_fare, 'Minimum fare'),
        waiting_per_min: normalizeRate(draft.waiting_per_min, 'Waiting / min'),
      }
      if (showOutstation) {
        payload.outstation_base_fare = normalizeRate(draft.outstation_base_fare, 'Outstation base fare')
        payload.outstation_per_km_rate = normalizeRate(draft.outstation_per_km_rate, 'Outstation per km')
        payload.outstation_minimum_fare = normalizeRate(draft.outstation_minimum_fare, 'Outstation minimum fare')
        if (Number.parseFloat(payload.outstation_per_km_rate) <= 0) {
          toast({ title: 'Outstation per km is required', description: 'Enter a rate greater than 0.', tone: 'error' })
          return
        }
      }
      const updated = await updateVehicleCategory(activeCategory.id, payload)
      setCategories((prev) => prev?.map((c) => (c.id === updated.id ? updated : c)) ?? prev)
      const next = categoryDraft(updated)
      setDraft(next)
      setSavedSnapshot(next)
      toast({
        title: 'Rates saved',
        description: `${customerVehicleLabel(updated.name)} now uses these rates in the customer app.`,
        tone: 'success',
      })
    } catch (err) {
      toast({
        title: 'Could not save rates',
        description: err instanceof Error ? err.message : getApiErrorMessage(err),
        tone: 'error',
      })
    } finally {
      setSavingCat(false)
    }
  }

  const saveRadius = async () => {
    if (!primaryZone || !canEdit) return
    setSavingRadius(true)
    try {
      const value = normalizeRate(radiusDraft, 'Outstation after')
      const updated = await updateServiceZone(primaryZone.id, {
        service_radius_km: value,
        active: primaryZone.active ?? true,
      })
      setZones((prev) => prev?.map((z) => (z.id === updated.id ? updated : z)) ?? prev)
      setRadiusDraft(updated.service_radius_km ?? value)
      toast({ title: 'Radius saved', description: `Trips longer than ${value} km are treated as outstation.`, tone: 'success' })
    } catch (err) {
      toast({ title: 'Could not save radius', description: getApiErrorMessage(err), tone: 'error' })
    } finally {
      setSavingRadius(false)
    }
  }

  if (catLoading || zonesLoading) {
    return (
      <div className="cy-page" aria-busy="true">
        <Skeleton variant="title" style={{ width: 220, marginBottom: 16 }} />
        <Skeleton variant="card" style={{ height: 200 }} />
      </div>
    )
  }

  if (catError || zonesError || !categories) {
    return (
      <EmptyState
        icon={<IndianRupee size={24} strokeWidth={1.75} />}
        title="Unable to load pricing"
        description={catError ?? zonesError ?? 'Could not fetch pricing data.'}
        action={<Button variant="primary" onClick={() => { refetchCat(); refetchZones() }}>Retry</Button>}
      />
    )
  }

  if (!activeCategory) {
    return (
      <EmptyState
        icon={<IndianRupee size={24} strokeWidth={1.75} />}
        title="No customer vehicles"
        description="Expected 2 Wheeler, Scooty, 3 Wheeler, and Tata ACE in vehicle categories."
      />
    )
  }

  const label = customerVehicleLabel(activeCategory.name)
  const cityPreview = previewFare(draft.base_fare, draft.per_km_rate, draft.minimum_fare, 10)
  const outstationPreview = previewFare(
    draft.outstation_base_fare,
    draft.outstation_per_km_rate,
    draft.outstation_minimum_fare,
    80,
  )

  return (
    <div className="pricing-page cy-page">
      <PageHeader
        title="Pricing"
        subtitle="Edit the rates customers see. Save once — the next fare quote uses them."
        crumbs={[{ label: 'Dashboard', to: '/' }, { label: 'Pricing' }]}
      />

      {!canEdit ? (
        <PermissionBanner message="View-only mode. Admin login required to change rates." />
      ) : null}

      <div className="pricing-type-tabs" role="tablist">
        {customerCategories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            role="tab"
            aria-selected={activeCategory.id === cat.id}
            className={`pricing-type-tab ${activeCategory.id === cat.id ? 'is-active' : ''}`}
            onClick={() => selectCategory(cat)}
          >
            {customerVehicleLabel(cat.name)}
          </button>
        ))}
      </div>

      {showOutstation && primaryZone ? (
        <Card className="pricing-radius-card">
          <CardBody>
            <div className="pricing-radius-row">
              <div>
                <p className="pricing-radius-label">Outstation starts after</p>
                <p className="pricing-radius-hint">Shorter trips use Within City rates. Longer trips use Outstation rates.</p>
              </div>
              <div className="pricing-radius-controls">
                <div className={`pricing-fare-field__input-wrap ${canEdit ? 'is-editable' : 'is-readonly'}`}>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={radiusDraft}
                    onChange={(e) => setRadiusDraft(e.target.value)}
                    disabled={!canEdit}
                    aria-label="Outstation starts after kilometres"
                  />
                  <span className="pricing-radius-unit">km</span>
                </div>
                {canEdit ? (
                  <Button variant="secondary" size="sm" onClick={saveRadius} disabled={!radiusDirty || savingRadius}>
                    {savingRadius ? 'Saving…' : 'Save radius'}
                  </Button>
                ) : null}
              </div>
            </div>
          </CardBody>
        </Card>
      ) : null}

      <div className={showOutstation ? 'pricing-rate-panels' : undefined}>
        <Card className="pricing-fare-section">
          <CardHeader
            title={`${label} — Within City`}
            subtitle="Fare = base fare + (per km × trip distance). Minimum fare applies if that total is lower."
          />
          <CardBody>
            <RateInputs
              fields={CITY_FIELDS}
              draft={draft}
              canEdit={canEdit}
              onChange={(field, value) => setDraft({ ...draft, [field]: value })}
            />
            <p className="pricing-preview">
              Sample 10 km: <strong>{formatINR(cityPreview)}</strong>
            </p>
          </CardBody>
        </Card>

        {showOutstation ? (
          <Card className="pricing-fare-section">
            <CardHeader
              title={`${label} — Outstation`}
              subtitle="One rate for the whole trip. Fare = base fare + (per km × full distance)."
            />
            <CardBody>
              <RateInputs
                fields={OUTSTATION_FIELDS}
                draft={draft}
                canEdit={canEdit}
                onChange={(field, value) => setDraft({ ...draft, [field]: value })}
              />
              <p className="pricing-preview">
                Sample 80 km: <strong>{formatINR(outstationPreview)}</strong>
              </p>
            </CardBody>
          </Card>
        ) : null}
      </div>

      {canEdit ? (
        <div className="pricing-fare-toolbar">
          <p className="pricing-fare-toolbar__hint">
            {ratesDirty
              ? 'Unsaved rate changes. Customer quotes update after you save.'
              : `Signed in as ${user?.role ?? 'admin'}.`}
          </p>
          <div className="pricing-fare-actions">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setDraft(savedSnapshot)}
              disabled={!ratesDirty || savingCat}
            >
              <RotateCcw size={14} strokeWidth={1.75} />
              Reset
            </Button>
            <Button variant="primary" size="sm" onClick={saveRates} disabled={!ratesDirty || savingCat}>
              <Save size={14} strokeWidth={1.75} />
              {savingCat ? 'Saving…' : 'Save rates'}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
