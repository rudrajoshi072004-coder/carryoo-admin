import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle2, IndianRupee, Milestone, Navigation, Pencil, Percent, RefreshCw, RotateCcw, Route, Save, ShieldCheck, Sparkles } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { Button, Card, CardBody, CardHeader, EmptyState, Skeleton } from '../components/ui'
import { PermissionBanner } from '../components/PermissionBanner'
import { useToast } from '../components/Toast'
import { useAuth } from '../context/AuthContext'
import { useAsyncData } from '../hooks/useAsyncData'
import { getApiErrorMessage } from '../api/client'
import { listVehicleCategories, updateVehicleCategory } from '../api/services/vehicleCategories'
import { createServiceZone, listServiceZones, updateServiceZone } from '../api/services/serviceZones'
import { estimateRouteToll, flushRouteTollCache, type RouteTollEstimateResult } from '../api/services/routeTolls'
import type { VehicleCategory, VehicleCategoryInput } from '../api/types'
import { formatINR } from '../lib/utils'
import {
  customerVehicleLabel,
  pickCustomerAppVehicles,
  usesTripTypePricing,
} from '../lib/customerVehicles'
import './Pricing.css'


const CITY_FIELDS = ['base_fare', 'base_fare_km', 'per_km_rate', 'minimum_fare', 'waiting_per_min', 'commission_percent'] as const
const OUTSTATION_BASE_FIELDS = [
  'outstation_base_fare',
  'outstation_base_fare_km',
  'outstation_per_km_rate',
  'outstation_minimum_fare',
] as const
const OUTSTATION_LAYER_FIELDS = [
  'outstation_step_km',
  'outstation_step_discount_percent',
  'outstation_deadhead_multiplier',
  'outstation_min_per_km_rate',
] as const
const OUTSTATION_FIELDS = [...OUTSTATION_BASE_FIELDS, ...OUTSTATION_LAYER_FIELDS] as const

type CityField = (typeof CITY_FIELDS)[number]
type OutstationField = (typeof OUTSTATION_FIELDS)[number]
type RateField = CityField | OutstationField

const RATE_LABELS: Record<RateField, string> = {
  base_fare: 'Base fare',
  base_fare_km: 'Base radius',
  per_km_rate: 'Per km',
  minimum_fare: 'Minimum fare',
  waiting_per_min: 'Waiting / min',
  commission_percent: 'Platform Commission',
  outstation_base_fare: 'Base fare',
  outstation_base_fare_km: 'Base radius',
  outstation_per_km_rate: 'Per km',
  outstation_minimum_fare: 'Minimum fare',
  outstation_step_km: 'Layer interval',
  outstation_step_discount_percent: 'Layer discount',
  outstation_deadhead_multiplier: 'Deadhead return',
  outstation_min_per_km_rate: 'Rate floor',
}

const RATE_HINTS: Partial<Record<RateField, string>> = {
  base_fare: 'Fixed start fare',
  base_fare_km: 'Distance covered in base fare',
  per_km_rate: 'Per km after base radius',
  minimum_fare: 'Lowest trip total',
  waiting_per_min: 'Wait time per minute',
  commission_percent: 'Platform fee % deducted from driver earnings',
  outstation_base_fare: 'Fixed outstation start',
  outstation_base_fare_km: 'Distance covered in outstation base',
  outstation_per_km_rate: 'Base rate per extra km',
  outstation_minimum_fare: 'Lowest outstation fare',
  outstation_step_km: 'Discount applied after every X km',
  outstation_step_discount_percent: '% decrease per distance block',
  outstation_deadhead_multiplier: 'Compensate return trip (1.3x to 1.4x)',
  outstation_min_per_km_rate: 'Hard price floor per km',
}

function getFieldUnit(key: RateField): string | null {
  if (key === 'base_fare_km' || key === 'outstation_base_fare_km' || key === 'outstation_step_km') return 'km'
  if (key === 'commission_percent' || key === 'outstation_step_discount_percent') return '%'
  if (key === 'outstation_deadhead_multiplier') return 'x'
  if (key === 'outstation_min_per_km_rate') return '₹/km'
  return null
}

function isRadiusField(key: RateField): boolean {
  return key === 'base_fare_km' || key === 'outstation_base_fare_km' || key === 'outstation_step_km'
}

function money(value: string | null | undefined, fallback = '0.00'): string {
  return (value && value.trim() !== '' ? value : fallback) as string
}

function categoryDraft(cat: VehicleCategory): Record<RateField, string> {
  return {
    base_fare: money(cat.base_fare),
    base_fare_km: money(cat.base_fare_km, '2.00'),
    per_km_rate: money(cat.per_km_rate),
    minimum_fare: money(cat.minimum_fare, cat.base_fare),
    waiting_per_min: money(cat.waiting_per_min, '2.00'),
    commission_percent: money(cat.commission_percent, '15.00'),
    outstation_base_fare: money(cat.outstation_base_fare, '0.00'),
    outstation_base_fare_km: money(cat.outstation_base_fare_km, '0.00'),
    outstation_per_km_rate: money(cat.outstation_per_km_rate, cat.per_km_rate),
    outstation_minimum_fare: money(cat.outstation_minimum_fare, '0.00'),
    outstation_step_km: money(cat.outstation_step_km, '10.00'),
    outstation_step_discount_percent: money(cat.outstation_step_discount_percent, '3.00'),
    outstation_deadhead_multiplier: money(cat.outstation_deadhead_multiplier, '1.35'),
    outstation_min_per_km_rate: money(cat.outstation_min_per_km_rate, '16.00'),
  }
}

function normalizeRate(value: string, label: string): string {
  const parsed = Number.parseFloat(value.replace(/,/g, '').trim())
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${label} must be a valid non-negative number.`)
  }
  return parsed.toFixed(2)
}

function previewFare(
  base: string,
  perKm: string,
  minimum: string,
  baseKm: string,
  km: number,
): { total: number; explanation: string } {
  const b = Number.parseFloat(base || '0')
  const p = Number.parseFloat(perKm || '0')
  const m = Number.parseFloat(minimum || '0')
  const bKm = Math.max(0, Number.parseFloat(baseKm || '0'))
  const extraKm = Math.max(0, km - bKm)
  const calc = b + p * extraKm
  const total = Math.round(Math.max(m, calc))
  const explanation =
    bKm > 0
      ? `(₹${b.toFixed(0)} covers 0–${bKm} km + ₹${p.toFixed(0)}/km × ${extraKm.toFixed(1)} km extra)`
      : `(₹${b.toFixed(0)} base + ₹${p.toFixed(0)}/km × ${km} km)`
  return { total, explanation }
}

function simulateOutstationFare({
  base,
  baseKm,
  perKm,
  minimum,
  stepKm,
  discountPct,
  deadheadMult,
  minRate,
  distanceKm,
}: {
  base: string
  baseKm: string
  perKm: string
  minimum: string
  stepKm: string
  discountPct: string
  deadheadMult: string
  minRate: string
  distanceKm: number
}): { total: number; effectivePerKm: number; explanation: string } {
  const b = Math.max(0, Number.parseFloat(base || '0'))
  const bKm = Math.max(0, Number.parseFloat(baseKm || '0'))
  const p = Math.max(0, Number.parseFloat(perKm || '0'))
  const minF = Math.max(0, Number.parseFloat(minimum || '0'))
  const sKm = Math.max(1, Number.parseFloat(stepKm || '10'))
  const dPct = Math.max(0, Number.parseFloat(discountPct || '0'))
  const mult = Math.max(1, Number.parseFloat(deadheadMult || '1'))
  const floorRate = Math.max(0, Number.parseFloat(minRate || '0'))

  if (distanceKm <= bKm) {
    const total = Math.round(Math.max(minF, b))
    return {
      total,
      effectivePerKm: +(total / distanceKm).toFixed(1),
      explanation: `₹${b.toFixed(0)} base covers 0–${bKm} km`,
    }
  }

  const extraDistance = distanceKm - bKm
  let distCharge = 0
  let covered = 0

  while (covered < extraDistance) {
    const stepIndex = Math.floor(covered / sKm) + 1
    const nextBoundary = Math.min(extraDistance, stepIndex * sKm)
    const sliceKm = nextBoundary - covered

    const discountFraction = (dPct / 100) * stepIndex
    let rate = p * Math.max(0, 1 - discountFraction)
    if (floorRate > 0) {
      rate = Math.max(floorRate, rate)
    }

    distCharge += sliceKm * rate
    covered = nextBoundary
  }

  const scaledDist = distCharge * mult
  const calc = b + scaledDist
  const total = Math.round(Math.max(minF, calc))
  const effectivePerKm = +(total / distanceKm).toFixed(1)
  const explanation = `Base ₹${b.toFixed(0)} + ₹${scaledDist.toFixed(0)} extra dist (${mult}x deadhead applied)`

  return { total, effectivePerKm, explanation }
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
      {fields.map((key) => {
        const unit = getFieldUnit(key)
        const isRadius = isRadiusField(key)
        const stepVal =
          key === 'outstation_deadhead_multiplier'
            ? '0.05'
            : key === 'outstation_step_discount_percent' || key === 'commission_percent'
            ? '0.5'
            : isRadius
            ? '1'
            : '0.01'

        return (
          <label key={key} className="pricing-fare-field">
            <div className="pricing-fare-field__header">
              <span className="pricing-fare-field__label">{RATE_LABELS[key]}</span>
              {RATE_HINTS[key] ? (
                <span className="pricing-fare-field__subhint">{RATE_HINTS[key]}</span>
              ) : null}
            </div>
            <div
              className={`pricing-fare-field__input-wrap ${
                canEdit ? 'is-editable' : 'is-readonly'
              } ${unit ? 'is-radius' : ''}`}
            >
              {key === 'outstation_step_discount_percent' || key === 'commission_percent' ? (
                <Percent size={14} strokeWidth={1.75} className="pricing-field-icon" aria-hidden />
              ) : key === 'outstation_deadhead_multiplier' ? (
                <RotateCcw size={14} strokeWidth={1.75} className="pricing-field-icon" aria-hidden />
              ) : isRadius ? (
                <Route size={14} strokeWidth={1.75} className="pricing-field-icon" aria-hidden />
              ) : (
                <IndianRupee size={14} strokeWidth={1.75} className="pricing-field-icon" aria-hidden />
              )}
              <input
                type="number"
                min="0"
                step={stepVal}
                inputMode="decimal"
                value={draft[key]}
                onChange={(e) => onChange(key, e.target.value)}
                disabled={!canEdit}
                readOnly={!canEdit}
                aria-label={`${RATE_LABELS[key]}${unit ? ` in ${unit}` : ''}`}
              />
              {unit ? <span className="pricing-radius-unit">{unit}</span> : null}
              {canEdit ? (
                <Pencil size={14} strokeWidth={1.75} className="pricing-fare-field__edit-icon" aria-hidden />
              ) : null}
            </div>
          </label>
        )
      })}
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
    base_fare_km: '2.00',
    per_km_rate: '',
    active: true,
  }), [])
  const [draft, setDraft] = useState<Record<RateField, string>>(emptyDraft)
  const [savedSnapshot, setSavedSnapshot] = useState<Record<RateField, string>>(emptyDraft)
  const [savingCat, setSavingCat] = useState(false)
  const [radiusDraft, setRadiusDraft] = useState('50')
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

  const activeCategory = useMemo(
    () => customerCategories.find((c) => c.id === activeId) ?? customerCategories[0] ?? null,
    [customerCategories, activeId],
  )

  useEffect(() => {
    const val = activeCategory?.outstation_threshold_km || primaryZone?.service_radius_km || '50'
    setRadiusDraft(val)
  }, [primaryZone, activeCategory])

  const [tollPreset, setTollPreset] = useState<'pune' | 'mumbai' | 'shirdi'>('pune')
  const [testingToll, setTestingToll] = useState(false)
  const [flushingToll, setFlushingToll] = useState(false)
  const [tollResult, setTollResult] = useState<RouteTollEstimateResult | null>(null)

  const PRESET_COORDS = {
    pune: { name: 'Nashik ⇄ Pune', pickup: [19.9975, 73.7898], drop: [18.5204, 73.8567] },
    mumbai: { name: 'Nashik ⇄ Mumbai', pickup: [19.9975, 73.7898], drop: [19.0760, 72.8777] },
    shirdi: { name: 'Nashik ⇄ Shirdi', pickup: [19.9975, 73.7898], drop: [19.7645, 74.4762] },
  } as const

  const handleTestToll = async () => {
    setTestingToll(true)
    try {
      const selected = PRESET_COORDS[tollPreset]
      const res = await estimateRouteToll({
        pickup_lat: selected.pickup[0],
        pickup_lng: selected.pickup[1],
        drop_lat: selected.drop[0],
        drop_lng: selected.drop[1],
        vehicle_category_id: activeCategory?.id,
      })
      setTollResult(res)
      toast({
        title: 'Toll estimated',
        description: `₹${res.toll_amount} (${res.cached ? 'from 30-day cache' : 'fresh Google Routes query'})`,
        tone: 'success',
      })
    } catch (err) {
      toast({
        title: 'Failed to estimate toll',
        description: err instanceof Error ? err.message : getApiErrorMessage(err),
        tone: 'error',
      })
    } finally {
      setTestingToll(false)
    }
  }

  const handleFlushToll = async () => {
    if (!window.confirm('Flush active toll cache? Next outstation orders will query fresh rates from Google Routes API.')) return
    setFlushingToll(true)
    try {
      const res = await flushRouteTollCache()
      toast({
        title: 'Cache flushed',
        description: res.detail || 'Toll cache flushed successfully',
        tone: 'success',
      })
      setTollResult(null)
    } catch (err) {
      toast({
        title: 'Failed to flush toll cache',
        description: err instanceof Error ? err.message : getApiErrorMessage(err),
        tone: 'error',
      })
    } finally {
      setFlushingToll(false)
    }
  }


  const showOutstation = Boolean(activeCategory && usesTripTypePricing(activeCategory.name))
  const ratesDirty = useMemo(() => {

    const keys: RateField[] = showOutstation ? [...CITY_FIELDS, ...OUTSTATION_FIELDS] : [...CITY_FIELDS]
    return keys.some((key) => draft[key] !== savedSnapshot[key])
  }, [draft, savedSnapshot, showOutstation])

  const currentSavedRadius = activeCategory?.outstation_threshold_km || primaryZone?.service_radius_km || '50'
  const radiusDirty = radiusDraft !== currentSavedRadius

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
        base_fare_km: normalizeRate(draft.base_fare_km, 'Base fare radius'),
        per_km_rate: normalizeRate(draft.per_km_rate, 'Per km'),
        minimum_fare: normalizeRate(draft.minimum_fare, 'Minimum fare'),
        waiting_per_min: normalizeRate(draft.waiting_per_min, 'Waiting / min'),
        commission_percent: normalizeRate(draft.commission_percent || '15.00', 'Platform Commission %'),
      }
      if (showOutstation) {
        payload.outstation_base_fare = normalizeRate(draft.outstation_base_fare, 'Outstation base fare')
        payload.outstation_base_fare_km = normalizeRate(draft.outstation_base_fare_km, 'Outstation base radius')
        payload.outstation_per_km_rate = normalizeRate(draft.outstation_per_km_rate, 'Outstation per km')
        payload.outstation_minimum_fare = normalizeRate(draft.outstation_minimum_fare, 'Outstation minimum fare')
        payload.outstation_step_km = normalizeRate(draft.outstation_step_km || '10', 'Layer step interval')
        payload.outstation_step_discount_percent = normalizeRate(
          draft.outstation_step_discount_percent || '0',
          'Layer discount %',
        )
        payload.outstation_deadhead_multiplier = normalizeRate(
          draft.outstation_deadhead_multiplier || '1.00',
          'Deadhead return multiplier',
        )
        payload.outstation_min_per_km_rate = normalizeRate(
          draft.outstation_min_per_km_rate || '0',
          'Rate floor',
        )
        if (radiusDraft) {
          payload.outstation_threshold_km = normalizeRate(radiusDraft, 'Outstation distance threshold')
        }
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
    if (!canEdit) return
    setSavingRadius(true)
    try {
      const value = normalizeRate(radiusDraft, 'Outstation threshold')
      if (primaryZone) {
        const updated = await updateServiceZone(primaryZone.id, {
          service_radius_km: value,
          active: primaryZone.active ?? true,
        })
        setZones((prev) => prev?.map((z) => (z.id === updated.id ? updated : z)) ?? prev)
      } else {
        const created = await createServiceZone({
          city_name: 'Nashik',
          zone_name: 'Nashik Flow Zone',
          service_radius_km: value,
          dispatch_radius_km: '10',
          active: true,
        })
        setZones([created])
      }
      if (activeCategory) {
        const catUpdated = await updateVehicleCategory(activeCategory.id, {
          outstation_threshold_km: value,
        })
        setCategories((prev) => prev?.map((c) => (c.id === catUpdated.id ? catUpdated : c)) ?? prev)
      }
      setRadiusDraft(value)
      toast({
        title: 'Outstation threshold saved',
        description: `Trips longer than ${value} km will use Outstation rates for ${customerVehicleLabel(
          activeCategory?.name ?? '',
        )}.`,
        tone: 'success',
      })
    } catch (err) {
      toast({
        title: 'Could not save outstation threshold',
        description: err instanceof Error ? err.message : getApiErrorMessage(err),
        tone: 'error',
      })
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
  const cityPreview = previewFare(draft.base_fare, draft.per_km_rate, draft.minimum_fare, draft.base_fare_km, 10)

  return (
    <div className="pricing-page cy-page">
      <PageHeader
        title="Pricing"
        subtitle="Configure base fare radius, per-km rates, and outstation distance thresholds for customer fare quotes."
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

      {showOutstation ? (
        <Card className="pricing-radius-card pricing-outstation-threshold-card">
          <CardBody>
            <div className="pricing-radius-row">
              <div className="pricing-outstation-info">
                <div className="pricing-outstation-badge-row">
                  <span className="pricing-outstation-badge">Outstation Rule</span>
                  <span className="pricing-outstation-scope">{label} Only</span>
                </div>
                <p className="pricing-radius-label">Outstation Distance Threshold</p>
                <p className="pricing-radius-hint">
                  Trips up to this distance are billed at <strong>Within City</strong> rates.
                  Trips exceeding this distance automatically switch to <strong>Outstation</strong> rates.
                </p>
              </div>
              <div className="pricing-radius-controls">
                <div className={`pricing-fare-field__input-wrap ${canEdit ? 'is-editable' : 'is-readonly'} is-radius`}>
                  <Milestone size={16} strokeWidth={1.75} className="pricing-field-icon" aria-hidden />
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={radiusDraft}
                    onChange={(e) => setRadiusDraft(e.target.value)}
                    disabled={!canEdit}
                    aria-label="Outstation threshold in kilometres"
                  />
                  <span className="pricing-radius-unit">km</span>
                  {canEdit ? (
                    <Pencil size={14} strokeWidth={1.75} className="pricing-fare-field__edit-icon" aria-hidden />
                  ) : null}
                </div>
                {canEdit ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={saveRadius}
                    disabled={!radiusDirty || savingRadius}
                  >
                    <Save size={14} strokeWidth={1.75} />
                    {savingRadius ? 'Saving…' : 'Save threshold'}
                  </Button>
                ) : null}
              </div>
            </div>
            <div className="pricing-threshold-callout">
              <div className="pricing-threshold-pill">
                Within City: <strong>0 – {radiusDraft || '50'} km</strong>
              </div>
              <div className="pricing-threshold-pill pricing-threshold-pill--outstation">
                Outstation: <strong>&gt; {radiusDraft || '50'} km</strong>
              </div>
            </div>
          </CardBody>
        </Card>
      ) : null}

      <Card className="pricing-offers-promo-card">
        <CardBody>
          <div className="pricing-offers-promo-row">
            <div className="pricing-offers-promo-icon-wrap">
              <Sparkles size={22} className="pricing-offers-promo-icon" />
            </div>
            <div className="pricing-offers-promo-text">
              <div className="pricing-offers-promo-badge">COMMISSION-FREE CAMPAIGNS</div>
              <h4 className="pricing-offers-promo-title">Driver Onboarding Offers (e.g. 1st 3 Rides 0% Commission)</h4>
              <p className="pricing-offers-promo-sub">
                Run special promotions where drivers keep 100% of their earnings for their first rides. Set custom validity dates, number of free rides, and mandatory image banners shown directly in the driver mobile app.
              </p>
            </div>
            <Link to="/driver-offers" className="pricing-offers-promo-btn">
              <span>Configure Driver Offers</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </CardBody>
      </Card>

      <Card className="pricing-tolls-card">
        <CardBody>
          <div className="pricing-tolls-row">
            <div className="pricing-tolls-header-bar">
              <div className="pricing-tolls-title-group">
                <div className="pricing-tolls-icon-box">
                  <Navigation size={20} />
                </div>
                <div>
                  <h4 className="pricing-tolls-title">Highway Toll Gates &amp; FASTag Auto-Pricing</h4>
                  <p className="pricing-tolls-subtitle">
                    Automated toll pricing along outstation highway routes with Google Maps Routes API &amp; 30-day corridor caching.
                  </p>
                </div>
              </div>
              <div className="pricing-tolls-badges">
                <span className="pricing-toll-badge pricing-toll-badge--fastag">
                  <CheckCircle2 size={12} /> IN_FASTAG Enabled
                </span>
                <span className="pricing-toll-badge pricing-toll-badge--cache">
                  <ShieldCheck size={12} /> 30-Day Auto Cache
                </span>
                <span className="pricing-toll-badge pricing-toll-badge--nocommission">
                  0% Commission on Tolls
                </span>
              </div>
            </div>

            <div className="pricing-tolls-content">
              <div>
                <p className="pricing-tolls-desc">
                  Outstation trips automatically bundle expected toll charges into customer quotes. Drivers do not need to front cash or submit paper receipts, and <strong>100% of the toll fee is passed through to the driver with 0% platform commission cut</strong>.
                </p>
                <ul className="pricing-tolls-features">
                  <li>
                    <CheckCircle2 size={13} />
                    <span>Clustered by 5-char Geohash (~4.9 km corridor zones) to eliminate redundant Google API costs.</span>
                  </li>
                  <li>
                    <CheckCircle2 size={13} />
                    <span>Strictly complies with Google Maps Platform 30-day caching policy.</span>
                  </li>
                </ul>
              </div>

              <div className="pricing-tolls-tester">
                <div className="pricing-tolls-tester-title">
                  <span>Corridor Toll Simulator</span>
                  <button
                    type="button"
                    className="pricing-tolls-flush-btn"
                    onClick={handleFlushToll}
                    disabled={flushingToll}
                  >
                    <RefreshCw size={12} className={flushingToll ? 'animate-spin' : ''} />
                    <span>Flush Cache</span>
                  </button>
                </div>

                <div className="pricing-tolls-preset-btns">
                  {(['pune', 'mumbai', 'shirdi'] as const).map((key) => (
                    <button
                      key={key}
                      type="button"
                      className={`pricing-tolls-preset-btn ${tollPreset === key ? 'is-selected' : ''}`}
                      onClick={() => setTollPreset(key)}
                    >
                      {PRESET_COORDS[key].name}
                    </button>
                  ))}
                </div>

                <div className="pricing-tolls-action-row">
                  <button
                    type="button"
                    className="pricing-tolls-test-btn"
                    onClick={handleTestToll}
                    disabled={testingToll}
                  >
                    <Navigation size={14} />
                    <span>{testingToll ? 'Estimating...' : `Check ${PRESET_COORDS[tollPreset].name} Toll`}</span>
                  </button>
                </div>

                {tollResult ? (
                  <div className="pricing-tolls-result-box">
                    <div>
                      <div className="pricing-tolls-result-amount">₹{tollResult.toll_amount}</div>
                      <div className="pricing-tolls-result-meta">
                        <span>{tollResult.origin_geohash} &rarr; {tollResult.destination_geohash}</span>
                        <span>•</span>
                        <span>{tollResult.source}</span>
                      </div>
                    </div>
                    <span
                      className={`pricing-tolls-cached-pill ${
                        tollResult.cached
                          ? 'pricing-tolls-cached-pill--hit'
                          : 'pricing-tolls-cached-pill--live'
                      }`}
                    >
                      {tollResult.cached ? '30d Cached (₹0 API)' : 'Fresh Live Query'}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      <div className={showOutstation ? 'pricing-rate-panels' : undefined}>
        <Card className="pricing-fare-section">
          <CardHeader
            title={`${label} — Within City`}
            subtitle="Fare = base fare (covers base radius) + per km for extra distance. Minimum fare applies if total is lower."
          />
          <CardBody>
            <RateInputs
              fields={CITY_FIELDS}
              draft={draft}
              canEdit={canEdit}
              onChange={(field, value) => setDraft({ ...draft, [field]: value })}
            />
            <p className="pricing-preview">
              Sample 10 km trip: <strong>{formatINR(cityPreview.total)}</strong>{' '}
              <span className="pricing-preview-detail">{cityPreview.explanation}</span>
            </p>
          </CardBody>
        </Card>

        {showOutstation ? (
          <Card className="pricing-fare-section pricing-outstation-card">
            <CardHeader
              title={`${label} — Outstation & Return Deadhead`}
              subtitle="Base outstation fare, stepped layer % discounts, and return deadhead cushion for empty return trips."
            />
            <CardBody>
              <div className="pricing-section-block">
                <div className="pricing-block-title">
                  <span>Base Outstation Slabs</span>
                </div>
                <RateInputs
                  fields={OUTSTATION_BASE_FIELDS}
                  draft={draft}
                  canEdit={canEdit}
                  onChange={(field, value) => setDraft({ ...draft, [field]: value })}
                />
              </div>

              <div className="pricing-section-block pricing-section-block--layers">
                <div className="pricing-block-title">
                  <div className="pricing-block-title__text">
                    <Sparkles size={15} className="pricing-icon-sparkle" />
                    <span>Progressive Layers & Deadhead Cushion</span>
                  </div>
                  <span className="pricing-pill-badge">B2B / Long-Haul Safeguard</span>
                </div>
                <p className="pricing-block-subtext">
                  After base radius, rates discount every layer block down to the rate floor.
                  The deadhead multiplier cushions the return trip without cluttering the customer invoice.
                </p>
                <RateInputs
                  fields={OUTSTATION_LAYER_FIELDS}
                  draft={draft}
                  canEdit={canEdit}
                  onChange={(field, value) => setDraft({ ...draft, [field]: value })}
                />
              </div>

              <div className="pricing-sim-box">
                <div className="pricing-sim-header">
                  <ShieldCheck size={16} className="pricing-sim-icon" />
                  <span className="pricing-sim-title">
                    Live Rate Simulation (Includes {draft.outstation_deadhead_multiplier || '1.35'}x Return Cushion)
                  </span>
                </div>
                <div className="pricing-sim-grid">
                  {[60, 80, 120].map((dist) => {
                    const sim = simulateOutstationFare({
                      base: draft.outstation_base_fare,
                      baseKm: draft.outstation_base_fare_km,
                      perKm: draft.outstation_per_km_rate,
                      minimum: draft.outstation_minimum_fare,
                      stepKm: draft.outstation_step_km,
                      discountPct: draft.outstation_step_discount_percent,
                      deadheadMult: draft.outstation_deadhead_multiplier,
                      minRate: draft.outstation_min_per_km_rate,
                      distanceKm: dist,
                    })
                    return (
                      <div key={dist} className="pricing-sim-card">
                        <div className="pricing-sim-card__dist">{dist} km Trip</div>
                        <div className="pricing-sim-card__fare">{formatINR(sim.total)}</div>
                        <div className="pricing-sim-card__rate">Effective ₹{sim.effectivePerKm}/km</div>
                        <div className="pricing-sim-card__sub">{sim.explanation}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
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
