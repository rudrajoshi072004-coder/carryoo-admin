import { useEffect, useMemo, useState } from 'react'
import { IndianRupee, Pencil, Plus, RotateCcw, Save, Trash2 } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { ConfirmDialog, SidePanel } from '../components/ConfirmDialog'
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  Skeleton,
  StatusPill,
} from '../components/ui'
import { PermissionBanner } from '../components/PermissionBanner'
import { useToast } from '../components/Toast'
import { useAuth } from '../context/AuthContext'
import { useAsyncData } from '../hooks/useAsyncData'
import { getApiErrorMessage } from '../api/client'
import { listVehicleCategories, updateVehicleCategory } from '../api/services/vehicleCategories'
import {
  createPricingRule,
  deletePricingRule,
  listPricingRules,
  updatePricingRule,
} from '../api/services/pricingRules'
import { listServiceZones, updateServiceZone } from '../api/services/serviceZones'
import type { PricingRule, PricingRuleInput, ServiceZone, VehicleCategory } from '../api/types'
import { formatINR } from '../lib/utils'
import './Pricing.css'

const RATE_FIELDS = ['base_fare', 'per_km_rate', 'minimum_fare', 'waiting_per_min'] as const
type RateField = (typeof RATE_FIELDS)[number]

const RATE_LABELS: Record<RateField, string> = {
  base_fare: 'Base fare',
  per_km_rate: 'Per km rate',
  minimum_fare: 'Minimum fare',
  waiting_per_min: 'Waiting / min',
}

const emptyRule: PricingRuleInput = {
  name: '',
  city: 'Nashik',
  trip_type: 'within_city',
  base_fare: '35.00',
  per_km_rate: '9.00',
  minimum_fare: '0.00',
  surge_multiplier: '1.00',
  active: true,
}

function categoryDraft(cat: VehicleCategory): Record<RateField, string> {
  return {
    base_fare: cat.base_fare,
    per_km_rate: cat.per_km_rate,
    minimum_fare: cat.minimum_fare ?? cat.base_fare,
    waiting_per_min: cat.waiting_per_min ?? '2.00',
  }
}

function normalizeRate(value: string, label: string): string {
  const parsed = Number.parseFloat(value.replace(/,/g, '').trim())
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${label} must be a valid non-negative number.`)
  }
  return parsed.toFixed(2)
}

function buildRatePayload(draft: Record<RateField, string>): Record<RateField, string> {
  return {
    base_fare: normalizeRate(draft.base_fare, 'Base fare'),
    per_km_rate: normalizeRate(draft.per_km_rate, 'Per km rate'),
    minimum_fare: normalizeRate(draft.minimum_fare, 'Minimum fare'),
    waiting_per_min: normalizeRate(draft.waiting_per_min, 'Waiting / min'),
  }
}

const TRIP_TYPED_SLUGS = new Set(['mini tempo', 'pickup truck', '3-wheeler', '4-wheeler'])

function categoryUsesTripType(name: string): boolean {
  return TRIP_TYPED_SLUGS.has(name.trim().toLowerCase())
}

function sortOutstationRules(rows: PricingRule[]): PricingRule[] {
  return [...rows].sort((a, b) => {
    const aMin = Number.parseFloat(a.min_distance_km ?? '0')
    const bMin = Number.parseFloat(b.min_distance_km ?? '0')
    return aMin - bMin
  })
}

function rulesForVehicle(rules: PricingRule[], vehicleId: string | undefined): PricingRule[] {
  if (!vehicleId) return rules
  return rules.filter((r) => r.vehicle_category === vehicleId)
}

export default function Pricing() {
  const { isAdmin, user } = useAuth()
  const { toast } = useToast()
  const canEdit = isAdmin

  const { data: categories, loading: catLoading, error: catError, refetch: refetchCat, setData: setCategories } =
    useAsyncData(listVehicleCategories, [])
  const { data: rules, loading: rulesLoading, error: rulesError, refetch: refetchRules, setData: setRules } =
    useAsyncData(listPricingRules, [])
  const { data: zones, loading: zonesLoading, error: zonesError, refetch: refetchZones, setData: setZones } =
    useAsyncData(listServiceZones, [])

  const [zoneDrafts, setZoneDrafts] = useState<Record<string, string>>({})
  const [savingZoneId, setSavingZoneId] = useState<string | null>(null)

  const [activeId, setActiveId] = useState<string | null>(null)
  const [draft, setDraft] = useState<Record<RateField, string>>({
    base_fare: '',
    per_km_rate: '',
    minimum_fare: '',
    waiting_per_min: '',
  })
  const [savedSnapshot, setSavedSnapshot] = useState<Record<RateField, string>>({
    base_fare: '',
    per_km_rate: '',
    minimum_fare: '',
    waiting_per_min: '',
  })
  const [savingCat, setSavingCat] = useState(false)
  const [rulePanel, setRulePanel] = useState(false)
  const [editingRule, setEditingRule] = useState<PricingRule | null>(null)
  const [ruleForm, setRuleForm] = useState<PricingRuleInput>(emptyRule)
  const [deleteRule, setDeleteRule] = useState<PricingRule | null>(null)

  useEffect(() => {
    if (!activeId && categories?.length) {
      const cat = categories[0]
      const next = categoryDraft(cat)
      setActiveId(cat.id)
      setDraft(next)
      setSavedSnapshot(next)
    }
  }, [categories, activeId])

  const activeCategory = useMemo(
    () => categories?.find((c) => c.id === activeId) ?? categories?.[0] ?? null,
    [categories, activeId],
  )

  const categoryMap = useMemo(() => {
    const map = new Map<string, VehicleCategory>()
    categories?.forEach((c) => map.set(c.id, c))
    return map
  }, [categories])

  const outstationRulesAll = useMemo(
    () => (rules ?? []).filter((r) => (r.trip_type ?? 'within_city') === 'outstation'),
    [rules],
  )

  const withinCityRulesAll = useMemo(
    () => (rules ?? []).filter((r) => (r.trip_type ?? 'within_city') !== 'outstation'),
    [rules],
  )

  const outstationRules = useMemo(
    () => sortOutstationRules(rulesForVehicle(outstationRulesAll, activeCategory?.id)),
    [outstationRulesAll, activeCategory?.id],
  )

  const withinCityRules = useMemo(
    () => rulesForVehicle(withinCityRulesAll, activeCategory?.id),
    [withinCityRulesAll, activeCategory?.id],
  )

  const outstationSlabCountByCategory = useMemo(() => {
    const counts = new Map<string, number>()
    outstationRulesAll.forEach((rule) => {
      if (!rule.vehicle_category) return
      counts.set(rule.vehicle_category, (counts.get(rule.vehicle_category) ?? 0) + 1)
    })
    return counts
  }, [outstationRulesAll])

  useEffect(() => {
    if (!zones?.length) return
    const next: Record<string, string> = {}
    zones.forEach((z) => {
      if (z.service_radius_km != null && z.service_radius_km !== "") {
        next[z.id] = z.service_radius_km
      }
    })
    setZoneDrafts(next)
  }, [zones])

  const ratesDirty = useMemo(
    () => RATE_FIELDS.some((key) => draft[key] !== savedSnapshot[key]),
    [draft, savedSnapshot],
  )

  const selectCategory = (cat: VehicleCategory) => {
    const next = categoryDraft(cat)
    setActiveId(cat.id)
    setDraft(next)
    setSavedSnapshot(next)
  }

  const resetDraft = () => {
    if (!activeCategory) return
    const next = categoryDraft(activeCategory)
    setDraft(next)
    setSavedSnapshot(next)
  }

  const saveCategoryRates = async () => {
    if (!activeCategory || !canEdit) return
    setSavingCat(true)
    try {
      const payload = buildRatePayload(draft)
      const updated = await updateVehicleCategory(activeCategory.id, payload)
      setCategories((prev) => prev?.map((c) => (c.id === updated.id ? updated : c)) ?? prev)
      const next = categoryDraft(updated)
      setDraft(next)
      setSavedSnapshot(next)
      toast({
        title: 'Rates saved to backend',
        description: `${updated.name} updated. Customer app fare quotes will use these rates on the next trip.`,
        tone: 'success',
      })
    } catch (err) {
      toast({
        title: 'Update failed',
        description: err instanceof Error ? err.message : getApiErrorMessage(err),
        tone: 'error',
      })
    } finally {
      setSavingCat(false)
    }
  }

  const openCreateRule = (tripType: 'within_city' | 'outstation' = 'within_city') => {
    setEditingRule(null)
    setRuleForm({
      ...emptyRule,
      trip_type: tripType,
      vehicle_category: activeCategory?.id,
      base_fare: tripType === 'outstation' ? '0.00' : emptyRule.base_fare,
      minimum_fare: '0.00',
    })
    setRulePanel(true)
  }

  const openEditRule = (rule: PricingRule) => {
    setEditingRule(rule)
    setRuleForm({
      name: rule.name,
      city: rule.city ?? '',
      vehicle_category: rule.vehicle_category ?? undefined,
      trip_type: rule.trip_type ?? 'within_city',
      min_distance_km: rule.min_distance_km ?? '',
      max_distance_km: rule.max_distance_km ?? '',
      base_fare: rule.base_fare,
      per_km_rate: rule.per_km_rate,
      minimum_fare: rule.minimum_fare ?? '0.00',
      surge_multiplier: rule.surge_multiplier ?? '1.00',
      active: rule.active ?? true,
    })
    setRulePanel(true)
  }

  const saveZoneRadius = async (zone: ServiceZone) => {
    if (!canEdit) return
    setSavingZoneId(zone.id)
    try {
      const value = normalizeRate(zoneDrafts[zone.id] ?? zone.service_radius_km ?? '', 'Service radius')
      const updated = await updateServiceZone(zone.id, { service_radius_km: value, active: zone.active ?? true })
      setZones((prev) => prev?.map((z) => (z.id === updated.id ? updated : z)) ?? prev)
      toast({ title: 'Service radius updated', tone: 'success' })
    } catch (err) {
      toast({ title: 'Update failed', description: getApiErrorMessage(err), tone: 'error' })
    } finally {
      setSavingZoneId(null)
    }
  }

  const saveRule = async () => {
    try {
      if (!ruleForm.name.trim()) {
        toast({ title: 'Rule name required', tone: 'error' })
        return
      }
      if (!ruleForm.vehicle_category) {
        toast({ title: 'Select a vehicle category', tone: 'error' })
        return
      }
      if (ruleForm.trip_type === 'outstation') {
        if (!ruleForm.min_distance_km?.trim()) {
          toast({ title: 'Min distance required for outstation slabs', tone: 'error' })
          return
        }
        normalizeRate(ruleForm.per_km_rate ?? '', 'Per km rate')
        normalizeRate(ruleForm.min_distance_km, 'Min distance')
        if (ruleForm.max_distance_km?.trim()) {
          normalizeRate(ruleForm.max_distance_km, 'Max distance')
        }
      }
      if (editingRule) {
        const updated = await updatePricingRule(editingRule.id, ruleForm)
        setRules((prev) => prev?.map((r) => (r.id === updated.id ? updated : r)) ?? prev)
        toast({ title: 'Rule updated', tone: 'success' })
      } else {
        const created = await createPricingRule(ruleForm)
        setRules((prev) => [...(prev ?? []), created])
        toast({ title: 'Pricing rule created', tone: 'success' })
      }
      setRulePanel(false)
    } catch (err) {
      toast({ title: 'Save failed', description: getApiErrorMessage(err), tone: 'error' })
    }
  }

  const handleDeleteRule = async () => {
    if (!deleteRule) return
    try {
      await deletePricingRule(deleteRule.id)
      setRules((prev) => prev?.filter((r) => r.id !== deleteRule.id) ?? prev)
      toast({ title: 'Rule deleted', tone: 'success' })
    } catch (err) {
      toast({ title: 'Delete failed', description: getApiErrorMessage(err), tone: 'error' })
    } finally {
      setDeleteRule(null)
    }
  }

  if (catLoading || rulesLoading || zonesLoading) {
    return (
      <div className="cy-page" aria-busy="true">
        <Skeleton variant="title" style={{ width: 220, marginBottom: 16 }} />
        <Skeleton variant="card" style={{ height: 200 }} />
      </div>
    )
  }

  if (catError || rulesError || zonesError || !categories) {
    return (
      <EmptyState
        icon={<IndianRupee size={24} strokeWidth={1.75} />}
        title="Unable to load pricing"
        description={catError ?? rulesError ?? zonesError ?? 'Could not fetch pricing data.'}
        action={<Button variant="primary" onClick={() => { refetchCat(); refetchRules(); refetchZones() }}>Retry</Button>}
      />
    )
  }

  const renderRulesTable = (rows: PricingRule[], emptyTitle: string, emptyDescription: string) => {
    if (rows.length === 0) {
      return (
        <EmptyState
          icon={<IndianRupee size={20} strokeWidth={1.75} />}
          title={emptyTitle}
          description={emptyDescription}
        />
      )
    }
    return (
      <div className="cy-table-wrap">
        <table className="cy-table pricing-coupons-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>City</th>
              <th>Vehicle</th>
              <th>Trip</th>
              <th>Distance km</th>
              <th>Per km</th>
              <th>Surge</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((rule) => (
              <tr key={rule.id}>
                <td className="cy-table__primary">{rule.name}</td>
                <td>{rule.city ?? '—'}</td>
                <td>{rule.vehicle_category ? categoryMap.get(rule.vehicle_category)?.name ?? rule.vehicle_category.slice(0, 8) : '—'}</td>
                <td>{rule.trip_type === 'outstation' ? 'Outstation' : 'Within city'}</td>
                <td className="cy-table__mono">
                  {rule.trip_type === 'outstation'
                    ? `${rule.min_distance_km ?? '—'} – ${rule.max_distance_km ?? '500+'}`
                    : '—'}
                </td>
                <td className="cy-table__mono">{rule.per_km_rate ? formatINR(Number.parseFloat(rule.per_km_rate)) : '—'}</td>
                <td>{rule.surge_multiplier ?? '1.00'}×</td>
                <td><StatusPill status={rule.active ? 'Active' : 'Inactive'} tone={rule.active ? 'active' : 'inactive'} /></td>
                <td>
                  <div className="cy-actions">
                    <button type="button" className="cy-action-btn" onClick={() => openEditRule(rule)}><Pencil size={14} /></button>
                    {canEdit ? (
                      <button type="button" className="cy-action-btn cy-action-btn--danger" onClick={() => setDeleteRule(rule)}><Trash2 size={14} /></button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="pricing-page cy-page">
      <PageHeader
        title="Pricing & Fares"
        subtitle="Edit within-city default rates, outstation distance slabs, and service radius for 3W, 4W, and truck categories."
        crumbs={[{ label: 'Dashboard', to: '/' }, { label: 'Pricing' }]}
      />

      {!canEdit ? (
        <PermissionBanner message="View-only mode. Admin login required to change rates or pricing rules." />
      ) : null}

      <div className="pricing-type-tabs" role="tablist">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            role="tab"
            aria-selected={activeCategory?.id === cat.id}
            className={`pricing-type-tab ${activeCategory?.id === cat.id ? 'is-active' : ''}`}
            onClick={() => selectCategory(cat)}
          >
            {cat.name}
            {(outstationSlabCountByCategory.get(cat.id) ?? 0) > 0 ? (
              <span className="pricing-type-tab__badge">{outstationSlabCountByCategory.get(cat.id)}</span>
            ) : null}
          </button>
        ))}
      </div>

      {activeCategory ? (
        <Card className="pricing-fare-section">
          <CardHeader
            title={`${activeCategory.name} — within city rates`}
            subtitle={
              canEdit
                ? 'Used when the customer picks Within City. Optional city rules below can override these defaults.'
                : 'Default within-city fare for this vehicle (base + per km × distance, minimum fare applies).'
            }
          />
          <CardBody>
            <div className={`pricing-fare-grid ${canEdit ? 'pricing-fare-grid--editable' : ''}`}>
              {RATE_FIELDS.map((key) => (
                <label key={key} className="pricing-fare-field">
                  <span className="pricing-fare-field__label">{RATE_LABELS[key]}</span>
                  <div className={`pricing-fare-field__input-wrap ${canEdit ? 'is-editable' : 'is-readonly'}`}>
                    <IndianRupee size={14} strokeWidth={1.75} aria-hidden />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      value={draft[key] || activeCategory[key] || ''}
                      onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
                      disabled={!canEdit}
                      readOnly={!canEdit}
                      aria-label={RATE_LABELS[key]}
                    />
                    {canEdit ? (
                      <Pencil size={14} strokeWidth={1.75} className="pricing-fare-field__edit-icon" aria-hidden />
                    ) : null}
                  </div>
                </label>
              ))}
            </div>

            {categoryUsesTripType(activeCategory.name) ? (
              <p className="pricing-sync-note">
                This vehicle uses Within City / Outstation in the customer app. Edit outstation slabs in the section below.
              </p>
            ) : null}

            <p className="pricing-preview">
              Sample 10 km within-city trip:{' '}
              <strong>
                {formatINR(
                  Math.round(
                    Math.max(
                      Number.parseFloat(draft.minimum_fare || activeCategory.minimum_fare || activeCategory.base_fare),
                      Number.parseFloat(draft.base_fare || activeCategory.base_fare) +
                        Number.parseFloat(draft.per_km_rate || activeCategory.per_km_rate) * 10,
                    ),
                  ),
                )}
              </strong>
            </p>

            {canEdit && activeCategory.updated_at ? (
              <p className="pricing-sync-note">
                Last saved to backend:{' '}
                {new Date(activeCategory.updated_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
              </p>
            ) : null}

            {canEdit ? (
              <div className="pricing-fare-toolbar">
                <p className="pricing-fare-toolbar__hint">
                  {ratesDirty ? 'You have unsaved changes.' : `Signed in as ${user?.role ?? 'admin'}. Rates are editable.`}
                </p>
                <div className="pricing-fare-actions">
                  <Button variant="secondary" size="sm" onClick={resetDraft} disabled={!ratesDirty || savingCat}>
                    <RotateCcw size={14} strokeWidth={1.75} />
                    Reset
                  </Button>
                  <Button variant="primary" size="sm" onClick={saveCategoryRates} disabled={!ratesDirty || savingCat}>
                    <Save size={14} strokeWidth={1.75} />
                    {savingCat ? 'Saving…' : 'Save rates'}
                  </Button>
                </div>
              </div>
            ) : null}
          </CardBody>
        </Card>
      ) : null}

      <Card className="pricing-coupons-card">
        <CardHeader
          title="Service zones & radius"
          subtitle="Within-city vs outstation is determined by trip distance vs service radius (not hard-coded in apps)."
        />
        <CardBody className="pricing-coupons-body">
          {(zones ?? []).length === 0 ? (
            <EmptyState
              title="No service zones"
              description="Run seed_nashik on the backend, then refresh."
            />
          ) : (
            <div className="cy-table-wrap">
              <table className="cy-table pricing-coupons-table">
                <thead>
                  <tr>
                    <th>City</th>
                    <th>Zone</th>
                    <th>Service radius (km)</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {zones?.map((zone) => (
                    <tr key={zone.id}>
                      <td>{zone.city_name}</td>
                      <td>{zone.zone_name}</td>
                      <td>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={zoneDrafts[zone.id] ?? zone.service_radius_km ?? ''}
                          onChange={(e) => setZoneDrafts({ ...zoneDrafts, [zone.id]: e.target.value })}
                          disabled={!canEdit}
                        />
                      </td>
                      <td><StatusPill status={zone.active ? 'Active' : 'Inactive'} tone={zone.active ? 'active' : 'inactive'} /></td>
                      <td>
                        {canEdit ? (
                          <Button variant="secondary" size="sm" onClick={() => saveZoneRadius(zone)} disabled={savingZoneId === zone.id}>
                            {savingZoneId === zone.id ? 'Saving…' : 'Save'}
                          </Button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      <Card className="pricing-coupons-card">
        <CardHeader
          title={activeCategory ? `${activeCategory.name} — outstation slabs` : 'Outstation distance slabs'}
          subtitle="One per-km rate applies to the full trip distance. Used when the customer selects Outstation (3W, 4W, mini tempo, pickup)."
          action={
            canEdit ? (
              <Button variant="ghost" size="sm" onClick={() => openCreateRule('outstation')}>
                <Plus size={14} strokeWidth={1.75} />
                Add outstation slab
              </Button>
            ) : undefined
          }
        />
        <CardBody className="pricing-coupons-body">
          {renderRulesTable(
            outstationRules,
            activeCategory ? `No outstation slabs for ${activeCategory.name}` : 'No outstation slabs',
            activeCategory
              ? `Add distance slabs for ${activeCategory.name}, or run seed_outstation_pricing on the backend.`
              : 'Select a vehicle tab above, then add slabs or run seed_outstation_pricing on the backend.',
          )}
        </CardBody>
      </Card>

      <Card className="pricing-coupons-card">
        <CardHeader
          title={activeCategory ? `${activeCategory.name} — within city overrides` : 'Within city pricing rules'}
          subtitle="Optional per-city overrides. If none exist, the within-city rates card above is used."
          action={
            canEdit ? (
              <Button variant="ghost" size="sm" onClick={() => openCreateRule('within_city')}>
                <Plus size={14} strokeWidth={1.75} />
                Add rule
              </Button>
            ) : undefined
          }
        />
        <CardBody className="pricing-coupons-body">
          {renderRulesTable(
            withinCityRules,
            activeCategory ? `No within-city overrides for ${activeCategory.name}` : 'No within-city pricing rules',
            'Default within-city rates from the card above are used unless you add an override here.',
          )}
        </CardBody>
      </Card>

      <SidePanel open={rulePanel} title={editingRule ? 'Edit pricing rule' : 'New pricing rule'} onClose={() => setRulePanel(false)} width={480}>
        <div className="form-grid">
          <label className="form-field full-width">
            <span>Rule name</span>
            <input value={ruleForm.name} onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })} />
          </label>
          <label className="form-field">
            <span>Trip type</span>
            <select value={ruleForm.trip_type ?? 'within_city'} onChange={(e) => setRuleForm({ ...ruleForm, trip_type: e.target.value as 'within_city' | 'outstation' })}>
              <option value="within_city">Within city</option>
              <option value="outstation">Outstation</option>
            </select>
          </label>
          <label className="form-field">
            <span>City</span>
            <input value={ruleForm.city ?? ''} onChange={(e) => setRuleForm({ ...ruleForm, city: e.target.value })} />
          </label>
          <label className="form-field">
            <span>Vehicle category</span>
            <select value={ruleForm.vehicle_category ?? ''} onChange={(e) => setRuleForm({ ...ruleForm, vehicle_category: e.target.value || undefined })}>
              <option value="">Select vehicle</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          {ruleForm.trip_type === 'outstation' ? (
            <>
              <label className="form-field">
                <span>Min distance (km)</span>
                <input value={ruleForm.min_distance_km ?? ''} onChange={(e) => setRuleForm({ ...ruleForm, min_distance_km: e.target.value })} />
              </label>
              <label className="form-field">
                <span>Max distance (km)</span>
                <input placeholder="Leave blank for 500+" value={ruleForm.max_distance_km ?? ''} onChange={(e) => setRuleForm({ ...ruleForm, max_distance_km: e.target.value || null })} />
              </label>
            </>
          ) : null}
          <label className="form-field">
            <span>Base fare</span>
            <input value={ruleForm.base_fare ?? ''} onChange={(e) => setRuleForm({ ...ruleForm, base_fare: e.target.value })} />
          </label>
          <label className="form-field">
            <span>Per km</span>
            <input value={ruleForm.per_km_rate ?? ''} onChange={(e) => setRuleForm({ ...ruleForm, per_km_rate: e.target.value })} />
          </label>
          <label className="form-field">
            <span>Minimum fare</span>
            <input value={ruleForm.minimum_fare ?? ''} onChange={(e) => setRuleForm({ ...ruleForm, minimum_fare: e.target.value })} />
          </label>
          <label className="form-field">
            <span>Surge multiplier</span>
            <input value={ruleForm.surge_multiplier ?? '1.00'} onChange={(e) => setRuleForm({ ...ruleForm, surge_multiplier: e.target.value })} />
          </label>
          <label className="form-check full-width">
            <input type="checkbox" checked={ruleForm.active ?? true} onChange={(e) => setRuleForm({ ...ruleForm, active: e.target.checked })} />
            Active
          </label>
        </div>
        <div className="form-actions">
          <Button variant="secondary" onClick={() => setRulePanel(false)}>Cancel</Button>
          <Button variant="primary" onClick={saveRule} disabled={!canEdit}>Save rule</Button>
        </div>
      </SidePanel>

      <ConfirmDialog
        open={Boolean(deleteRule)}
        title="Delete pricing rule?"
        description={`Remove "${deleteRule?.name}"?`}
        confirmLabel="Delete"
        tone="danger"
        onConfirm={handleDeleteRule}
        onClose={() => setDeleteRule(null)}
      />
    </div>
  )
}
