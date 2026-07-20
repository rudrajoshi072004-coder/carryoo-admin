import { useEffect, useMemo, useState } from 'react'
import { IndianRupee, Pencil, Plus, Save, Trash2 } from 'lucide-react'
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
import type { PricingRule, PricingRuleInput, VehicleCategory } from '../api/types'
import { formatINR } from '../lib/utils'
import './Pricing.css'

const emptyRule: PricingRuleInput = {
  name: '',
  city: 'Nashik',
  base_fare: '35.00',
  per_km_rate: '9.00',
  surge_multiplier: '1.00',
  active: true,
}

export default function Pricing() {
  const { isAdmin } = useAuth()
  const { toast } = useToast()

  const { data: categories, loading: catLoading, error: catError, refetch: refetchCat, setData: setCategories } =
    useAsyncData(listVehicleCategories, [])
  const { data: rules, loading: rulesLoading, error: rulesError, refetch: refetchRules, setData: setRules } =
    useAsyncData(listPricingRules, [])

  const [activeId, setActiveId] = useState<string | null>(null)
  const [draft, setDraft] = useState<Record<string, string>>({})
  const [savingCat, setSavingCat] = useState(false)
  const [rulePanel, setRulePanel] = useState(false)
  const [editingRule, setEditingRule] = useState<PricingRule | null>(null)
  const [ruleForm, setRuleForm] = useState<PricingRuleInput>(emptyRule)
  const [deleteRule, setDeleteRule] = useState<PricingRule | null>(null)

  useEffect(() => {
    if (!activeId && categories?.length) {
      const cat = categories[0]
      setActiveId(cat.id)
      setDraft({
        base_fare: cat.base_fare,
        per_km_rate: cat.per_km_rate,
        minimum_fare: cat.minimum_fare ?? cat.base_fare,
        waiting_per_min: cat.waiting_per_min ?? '2.00',
      })
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

  const startEditCategory = (cat: VehicleCategory) => {
    setActiveId(cat.id)
    setDraft({
      base_fare: cat.base_fare,
      per_km_rate: cat.per_km_rate,
      minimum_fare: cat.minimum_fare ?? cat.base_fare,
      waiting_per_min: cat.waiting_per_min ?? '2.00',
    })
  }

  const saveCategoryRates = async () => {
    if (!activeCategory) return
    setSavingCat(true)
    try {
      const updated = await updateVehicleCategory(activeCategory.id, draft)
      setCategories((prev) => prev?.map((c) => (c.id === updated.id ? updated : c)) ?? prev)
      toast({
        title: 'Rates updated',
        description: `${updated.name} pricing saved. Customer app will use new rates on next fare quote.`,
        tone: 'success',
      })
    } catch (err) {
      toast({ title: 'Update failed', description: getApiErrorMessage(err), tone: 'error' })
    } finally {
      setSavingCat(false)
    }
  }

  const openCreateRule = () => {
    setEditingRule(null)
    setRuleForm({ ...emptyRule, vehicle_category: activeCategory?.id })
    setRulePanel(true)
  }

  const openEditRule = (rule: PricingRule) => {
    setEditingRule(rule)
    setRuleForm({
      name: rule.name,
      city: rule.city ?? '',
      vehicle_category: rule.vehicle_category ?? undefined,
      base_fare: rule.base_fare,
      per_km_rate: rule.per_km_rate,
      surge_multiplier: rule.surge_multiplier ?? '1.00',
      active: rule.active ?? true,
    })
    setRulePanel(true)
  }

  const saveRule = async () => {
    try {
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

  if (catLoading || rulesLoading) {
    return (
      <div className="cy-page" aria-busy="true">
        <Skeleton variant="title" style={{ width: 220, marginBottom: 16 }} />
        <Skeleton variant="card" style={{ height: 200 }} />
      </div>
    )
  }

  if (catError || rulesError || !categories) {
    return (
      <EmptyState
        icon={<IndianRupee size={24} strokeWidth={1.75} />}
        title="Unable to load pricing"
        description={catError ?? rulesError ?? 'Could not fetch pricing data.'}
        action={<Button variant="primary" onClick={() => { refetchCat(); refetchRules() }}>Retry</Button>}
      />
    )
  }

  return (
    <div className="pricing-page cy-page">
      <PageHeader
        title="Pricing & Fares"
        subtitle="Set per-vehicle rates used by the customer app fare calculator."
        crumbs={[{ label: 'Dashboard', to: '/' }, { label: 'Pricing' }]}
        actions={
          activeCategory && isAdmin ? (
            <Button variant="primary" onClick={saveCategoryRates} disabled={savingCat}>
              <Save size={16} strokeWidth={1.75} />
              {savingCat ? 'Saving…' : 'Save rates'}
            </Button>
          ) : undefined
        }
      />

      {!isAdmin ? (
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
            onClick={() => startEditCategory(cat)}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {activeCategory ? (
        <Card className="pricing-fare-section">
          <CardHeader
            title={`${activeCategory.name} — default rates`}
            subtitle="These values feed POST /bookings/fare-estimate/ for this vehicle category."
          />
          <CardBody>
            <div className="pricing-fare-grid">
              {(['base_fare', 'per_km_rate', 'minimum_fare', 'waiting_per_min'] as const).map((key) => (
                <label key={key} className="pricing-fare-field">
                  <span className="pricing-fare-field__label">
                    {key === 'base_fare' ? 'Base fare' : key === 'per_km_rate' ? 'Per km rate' : key === 'minimum_fare' ? 'Minimum fare' : 'Waiting / min'}
                  </span>
                  <div className="pricing-fare-field__input-wrap">
                    <IndianRupee size={14} strokeWidth={1.75} aria-hidden />
                    <input
                      type="text"
                      value={draft[key] ?? activeCategory[key] ?? ''}
                      onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
                      disabled={!isAdmin}
                    />
                  </div>
                </label>
              ))}
            </div>
            <p className="pricing-preview">
              Sample 10 km trip:{' '}
              <strong>
                {formatINR(
                  Math.round(
                    Number.parseFloat(draft.base_fare ?? activeCategory.base_fare) +
                      Number.parseFloat(draft.per_km_rate ?? activeCategory.per_km_rate) * 10,
                  ),
                )}
              </strong>
            </p>
          </CardBody>
        </Card>
      ) : null}

      <Card className="pricing-coupons-card">
        <CardHeader
          title="City pricing rules"
          subtitle="Optional overrides per city and vehicle (advanced)"
          action={
            isAdmin ? (
              <Button variant="ghost" size="sm" onClick={openCreateRule}>
                <Plus size={14} strokeWidth={1.75} />
                Add rule
              </Button>
            ) : undefined
          }
        />
        <CardBody className="pricing-coupons-body">
          {(rules ?? []).length === 0 ? (
            <EmptyState
              icon={<IndianRupee size={20} strokeWidth={1.75} />}
              title="No pricing rules yet"
              description="Default vehicle category rates above are used. Add city-specific rules when needed."
            />
          ) : (
            <div className="cy-table-wrap">
              <table className="cy-table pricing-coupons-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>City</th>
                    <th>Vehicle</th>
                    <th>Base / km</th>
                    <th>Surge</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {rules?.map((rule) => (
                    <tr key={rule.id}>
                      <td className="cy-table__primary">{rule.name}</td>
                      <td>{rule.city ?? '—'}</td>
                      <td>{rule.vehicle_category ? categoryMap.get(rule.vehicle_category)?.name ?? rule.vehicle_category.slice(0, 8) : 'All'}</td>
                      <td className="cy-table__mono">
                        {rule.base_fare ? formatINR(Number.parseFloat(rule.base_fare)) : '—'} / {rule.per_km_rate ? formatINR(Number.parseFloat(rule.per_km_rate)) : '—'}
                      </td>
                      <td>{rule.surge_multiplier ?? '1.00'}×</td>
                      <td><StatusPill status={rule.active ? 'Active' : 'Inactive'} tone={rule.active ? 'active' : 'inactive'} /></td>
                      <td>
                        <div className="cy-actions">
                          <button type="button" className="cy-action-btn" onClick={() => openEditRule(rule)}><Pencil size={14} /></button>
                          {isAdmin ? (
                            <button type="button" className="cy-action-btn cy-action-btn--danger" onClick={() => setDeleteRule(rule)}><Trash2 size={14} /></button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
            <span>City</span>
            <input value={ruleForm.city ?? ''} onChange={(e) => setRuleForm({ ...ruleForm, city: e.target.value })} />
          </label>
          <label className="form-field">
            <span>Vehicle category</span>
            <select value={ruleForm.vehicle_category ?? ''} onChange={(e) => setRuleForm({ ...ruleForm, vehicle_category: e.target.value || undefined })}>
              <option value="">All vehicles</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label className="form-field">
            <span>Base fare</span>
            <input value={ruleForm.base_fare ?? ''} onChange={(e) => setRuleForm({ ...ruleForm, base_fare: e.target.value })} />
          </label>
          <label className="form-field">
            <span>Per km</span>
            <input value={ruleForm.per_km_rate ?? ''} onChange={(e) => setRuleForm({ ...ruleForm, per_km_rate: e.target.value })} />
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
          <Button variant="primary" onClick={saveRule} disabled={!isAdmin}>Save rule</Button>
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
