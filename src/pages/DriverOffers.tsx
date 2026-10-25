import React, { useMemo, useState } from 'react'
import {
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  Gift,
  ImageIcon,
  Pencil,
  Plus,
  Sparkles,
  Tag,
  Trash2,
  TrendingUp,
  Truck,
  Upload,
  Users,
  X,
} from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { ConfirmDialog, SidePanel } from '../components/ConfirmDialog'
import {
  Button,
  Card,
  CardBody,
  EmptyState,
  SearchInput,
  Skeleton,
  StatusPill,
} from '../components/ui'
import { PermissionBanner } from '../components/PermissionBanner'
import { useToast } from '../components/Toast'
import { useAuth } from '../context/AuthContext'
import { useAsyncData } from '../hooks/useAsyncData'
import { getApiErrorMessage } from '../api/client'
import {
  createDriverOffer,
  deleteDriverOffer,
  listDriverOffers,
  updateDriverOffer,
  uploadOfferBanner,
} from '../api/services/driverOffers'
import { listVehicleCategories } from '../api/services/vehicleCategories'
import type { DriverOffer, DriverOfferInput } from '../api/types'
import { formatINR } from '../lib/utils'
import './DriverOffers.css'

const BANNER_TEMPLATES = [
  {
    title: '3 Rides 0% Commission (Official Banner)',
    url: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1200&q=80',
    description: 'First 3 Rides 100% Commission-Free. Keep all your earnings!',
  },
  {
    title: 'Welcome Driver Partner (City Transport)',
    url: 'https://images.unsplash.com/photo-1616422285623-13ff0162193c?auto=format&fit=crop&w=1200&q=80',
    description: 'Welcome to Carryoo! Drive with zero platform commission on your first 3 trips.',
  },
  {
    title: 'Weekend Turbo Earnings',
    url: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=1200&q=80',
    description: 'High demand weekend! 0% commission on your first trips today.',
  },
]

function getOfferStatus(offer: DriverOffer): { label: 'Active' | 'Scheduled' | 'Ended'; tone: 'active' | 'warning' | 'inactive' } {
  if (!offer.active) {
    return { label: 'Ended', tone: 'inactive' }
  }
  const today = new Date().toISOString().split('T')[0]
  if (offer.start_date > today) {
    return { label: 'Scheduled', tone: 'warning' }
  }
  if (offer.end_date < today) {
    return { label: 'Ended', tone: 'inactive' }
  }
  return { label: 'Active', tone: 'active' }
}

const emptyForm: DriverOfferInput = {
  title: '',
  description: '',
  rides_count: 3,
  commission_rate: '0.00',
  valid_days: 7,
  start_date: new Date().toISOString().split('T')[0],
  end_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
  banner_url: BANNER_TEMPLATES[0].url,
  vehicle_categories: [],
  active: true,
  priority: 10,
}

export default function DriverOffers() {
  const { isAdmin } = useAuth()
  const { toast } = useToast()

  const { data: offers, loading, error, refetch, setData } = useAsyncData(listDriverOffers, [])
  const { data: vehicleCategories } = useAsyncData(listVehicleCategories, [])

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Scheduled' | 'Ended'>('All')
  const [panelOpen, setPanelOpen] = useState(false)
  const [editing, setEditing] = useState<DriverOffer | null>(null)
  const [form, setForm] = useState<DriverOfferInput>(emptyForm)
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<DriverOffer | null>(null)
  const [inspectBanner, setInspectBanner] = useState<DriverOffer | null>(null)

  const activeOffersCount = useMemo(
    () => (offers ?? []).filter((o) => getOfferStatus(o).label === 'Active').length,
    [offers],
  )

  const totalCommissionSaved = useMemo(() => {
    return (offers ?? []).reduce((acc, o) => acc + Number(o.total_commission_saved || 0), 0)
  }, [offers])

  const totalDriversBenefited = useMemo(() => {
    return (offers ?? []).reduce((acc, o) => acc + Number(o.drivers_benefited_count || 0), 0)
  }, [offers])

  const filtered = useMemo(() => {
    if (!offers) return []
    const q = search.trim().toLowerCase()
    return offers.filter((offer) => {
      const statusInfo = getOfferStatus(offer)
      const matchesStatus = statusFilter === 'All' || statusInfo.label === statusFilter
      const matchesSearch =
        !q ||
        offer.title.toLowerCase().includes(q) ||
        (offer.description || '').toLowerCase().includes(q)
      return matchesStatus && matchesSearch
    })
  }, [offers, search, statusFilter])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setBannerFile(null)
    setBannerPreview(emptyForm.banner_url)
    setPanelOpen(true)
  }

  const openEdit = (offer: DriverOffer) => {
    setEditing(offer)
    setForm({
      title: offer.title,
      description: offer.description || '',
      rides_count: offer.rides_count,
      commission_rate: offer.commission_rate,
      valid_days: offer.valid_days,
      start_date: offer.start_date,
      end_date: offer.end_date,
      banner_url: offer.banner_url,
      vehicle_categories: offer.vehicle_categories || [],
      active: offer.active,
      priority: offer.priority ?? 10,
    })
    setBannerFile(null)
    setBannerPreview(offer.banner_url)
    setPanelOpen(true)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file', description: 'Please choose an image file (PNG, JPG, WebP).', tone: 'error' })
      return
    }
    setBannerFile(file)
    const previewUrl = URL.createObjectURL(file)
    setBannerPreview(previewUrl)
  }

  const handleSelectTemplate = (tpl: typeof BANNER_TEMPLATES[0]) => {
    setBannerFile(null)
    setBannerPreview(tpl.url)
    setForm((prev) => ({
      ...prev,
      banner_url: tpl.url,
      title: prev.title || tpl.title,
      description: prev.description || tpl.description,
    }))
  }

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast({ title: 'Title required', description: 'Enter an offer title.', tone: 'error' })
      return
    }

    if (!bannerFile && !form.banner_url.trim()) {
      toast({
        title: 'Banner image is mandatory',
        description: 'Upload an image banner or provide an image URL.',
        tone: 'error',
      })
      return
    }

    if (form.rides_count < 1) {
      toast({ title: 'Invalid rides count', description: 'Rides count must be at least 1.', tone: 'error' })
      return
    }

    if (form.valid_days < 1) {
      toast({ title: 'Invalid validity days', description: 'Validity must be at least 1 day.', tone: 'error' })
      return
    }

    if (form.end_date < form.start_date) {
      toast({ title: 'Invalid date range', description: 'End date must be on or after start date.', tone: 'error' })
      return
    }

    setSaving(true)
    try {
      let savedOffer: DriverOffer
      if (editing) {
        savedOffer = await updateDriverOffer(editing.id, form)
        if (bannerFile) {
          savedOffer = await uploadOfferBanner(editing.id, bannerFile)
        }
        setData((prev) => prev?.map((o) => (o.id === savedOffer.id ? savedOffer : o)) ?? prev)
        toast({
          title: 'Offer updated',
          description: `"${savedOffer.title}" has been saved.`,
          tone: 'success',
        })
      } else {
        savedOffer = await createDriverOffer(form)
        if (bannerFile) {
          savedOffer = await uploadOfferBanner(savedOffer.id, bannerFile)
        }
        setData((prev) => [savedOffer, ...(prev ?? [])])
        toast({
          title: 'Offer created',
          description: `"${savedOffer.title}" is now configured for drivers.`,
          tone: 'success',
        })
      }
      setPanelOpen(false)
    } catch (err) {
      toast({
        title: 'Could not save offer',
        description: getApiErrorMessage(err),
        tone: 'error',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (offer: DriverOffer) => {
    if (!isAdmin) return
    const nextState = !offer.active
    try {
      const updated = await updateDriverOffer(offer.id, { active: nextState })
      setData((prev) => prev?.map((o) => (o.id === updated.id ? updated : o)) ?? prev)
      toast({
        title: nextState ? 'Offer activated' : 'Offer paused',
        description: `"${offer.title}" is now ${nextState ? 'active' : 'inactive'}.`,
        tone: 'success',
      })
    } catch (err) {
      toast({ title: 'Status change failed', description: getApiErrorMessage(err), tone: 'error' })
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget || !isAdmin) return
    try {
      await deleteDriverOffer(deleteTarget.id)
      setData((prev) => prev?.filter((o) => o.id !== deleteTarget.id) ?? prev)
      toast({ title: 'Offer deleted', description: `Deleted "${deleteTarget.title}".`, tone: 'success' })
      setDeleteTarget(null)
    } catch (err) {
      toast({ title: 'Delete failed', description: getApiErrorMessage(err), tone: 'error' })
    }
  }

  const toggleCategorySelection = (catId: string) => {
    setForm((prev) => {
      const current = prev.vehicle_categories || []
      const exists = current.includes(catId)
      return {
        ...prev,
        vehicle_categories: exists ? current.filter((id) => id !== catId) : [...current, catId],
      }
    })
  }

  if (loading) {
    return (
      <div className="cy-page" aria-busy="true">
        <Skeleton variant="title" style={{ width: 280, height: 36, marginBottom: 16 }} />
        <div className="driver-offers-stats-grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="card" style={{ height: 96 }} />
          ))}
        </div>
      </div>
    )
  }

  if (error && !offers) {
    return (
      <div className="cy-page">
        <EmptyState
          icon={<Gift size={28} strokeWidth={1.75} />}
          title="Unable to load driver offers"
          description={error}
          action={<Button variant="primary" onClick={refetch}>Retry</Button>}
        />
      </div>
    )
  }

  return (
    <div className="driver-offers-page cy-page">
      <PageHeader
        title="Driver Offers & Promotions"
        subtitle="Configure 0% commission onboarding promotions, free rides campaigns, and image banners displayed in the driver mobile app."
        crumbs={[{ label: 'Operations' }, { label: 'Driver Offers' }]}
        actions={
          <Button variant="primary" onClick={openCreate} disabled={!isAdmin}>
            <Plus size={16} strokeWidth={1.75} />
            Create Offer
          </Button>
        }
      />

      {!isAdmin ? (
        <PermissionBanner message="View-only mode. Admin privileges required to create or modify driver promotions." />
      ) : null}

      {/* High Level KPI Metrics */}
      <div className="driver-offers-stats-grid">
        <Card className="driver-offers-stat-card">
          <CardBody>
            <div className="driver-offers-stat-header">
              <span className="driver-offers-stat-label">Active Campaigns</span>
              <span className="driver-offers-stat-icon is-emerald"><Sparkles size={16} /></span>
            </div>
            <strong className="driver-offers-stat-value">{activeOffersCount}</strong>
            <span className="driver-offers-stat-sub">Live in driver mobile app</span>
          </CardBody>
        </Card>

        <Card className="driver-offers-stat-card">
          <CardBody>
            <div className="driver-offers-stat-header">
              <span className="driver-offers-stat-label">Drivers Benefited</span>
              <span className="driver-offers-stat-icon is-blue"><Users size={16} /></span>
            </div>
            <strong className="driver-offers-stat-value">{totalDriversBenefited}</strong>
            <span className="driver-offers-stat-sub">Partners claimed free rides</span>
          </CardBody>
        </Card>

        <Card className="driver-offers-stat-card">
          <CardBody>
            <div className="driver-offers-stat-header">
              <span className="driver-offers-stat-label">Commission Waived</span>
              <span className="driver-offers-stat-icon is-purple"><TrendingUp size={16} /></span>
            </div>
            <strong className="driver-offers-stat-value">{formatINR(totalCommissionSaved)}</strong>
            <span className="driver-offers-stat-sub">Kept by drivers (0% commission)</span>
          </CardBody>
        </Card>

        <Card className="driver-offers-stat-card">
          <CardBody>
            <div className="driver-offers-stat-header">
              <span className="driver-offers-stat-label">Total Offers</span>
              <span className="driver-offers-stat-icon is-amber"><Tag size={16} /></span>
            </div>
            <strong className="driver-offers-stat-value">{offers?.length ?? 0}</strong>
            <span className="driver-offers-stat-sub">Configured in system</span>
          </CardBody>
        </Card>
      </div>

      {/* Toolbar & Filters */}
      <div className="cy-page__toolbar">
        <div className="cy-page__toolbar-left">
          <SearchInput
            value={search}
            onChange={(v) => setSearch(v)}
            placeholder="Search offers by title or rules…"
            className="driver-offers-search"
          />
          <div className="cy-page__filters">
            {(['All', 'Active', 'Scheduled', 'Ended'] as const).map((st) => (
              <button
                key={st}
                type="button"
                className={`driver-offers-filter-tab ${statusFilter === st ? 'is-active' : ''}`}
                onClick={() => setStatusFilter(st)}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid of Offers */}
      {filtered.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              icon={<Gift size={28} strokeWidth={1.75} />}
              title="No driver offers found"
              description={search ? 'No offers match your search criteria.' : 'Create your first 0% commission offer to attract drivers.'}
              action={
                isAdmin ? (
                  <Button variant="primary" onClick={openCreate}>
                    <Plus size={16} strokeWidth={1.75} />
                    Create First Offer
                  </Button>
                ) : undefined
              }
            />
          </CardBody>
        </Card>
      ) : (
        <div className="driver-offers-cards-grid">
          {filtered.map((offer) => {
            const statusInfo = getOfferStatus(offer)
            return (
              <Card key={offer.id} className="driver-offer-card">
                {/* Banner Thumbnail */}
                <div
                  className="driver-offer-card__banner"
                  onClick={() => setInspectBanner(offer)}
                  title="Click to view full banner"
                >
                  <img
                    src={offer.banner_url || BANNER_TEMPLATES[0].url}
                    alt={offer.title}
                    onError={(e) => {
                      // Fallback image if broken
                      (e.target as HTMLImageElement).src = BANNER_TEMPLATES[0].url
                    }}
                  />
                  <div className="driver-offer-card__banner-overlay">
                    <span className="driver-offer-card__inspect-pill">
                      <Eye size={12} /> Inspect Banner
                    </span>
                  </div>
                  <div className="driver-offer-card__status-float">
                    <StatusPill status={statusInfo.label} tone={statusInfo.tone} />
                  </div>
                </div>

                <CardBody className="driver-offer-card__body">
                  <div className="driver-offer-card__title-row">
                    <h3 className="driver-offer-card__title">{offer.title}</h3>
                  </div>

                  {offer.description ? (
                    <p className="driver-offer-card__desc">{offer.description}</p>
                  ) : null}

                  {/* Highlights Pill Strip */}
                  <div className="driver-offer-card__pills">
                    <div className="driver-offer-pill driver-offer-pill--accent">
                      <Gift size={13} />
                      <strong>{offer.rides_count} Rides @ {offer.commission_rate}% Commission</strong>
                    </div>
                    <div className="driver-offer-pill">
                      <Clock size={13} />
                      <span>Valid for {offer.valid_days} Days</span>
                    </div>
                  </div>

                  {/* Dates & Target Details */}
                  <div className="driver-offer-card__meta-list">
                    <div className="driver-offer-meta-item">
                      <Calendar size={14} className="driver-offer-meta-icon" />
                      <span>{offer.start_date} to {offer.end_date}</span>
                    </div>
                    <div className="driver-offer-meta-item">
                      <Truck size={14} className="driver-offer-meta-icon" />
                      <span>
                        {offer.vehicle_category_names && offer.vehicle_category_names.length > 0
                          ? offer.vehicle_category_names.join(', ')
                          : 'All Vehicle Types'}
                      </span>
                    </div>
                    <div className="driver-offer-meta-item">
                      <CheckCircle2 size={14} className="driver-offer-meta-icon is-success" />
                      <span>
                        <strong>{offer.usages_count ?? 0}</strong> rides redeemed ·{' '}
                        <strong>{formatINR(Number(offer.total_commission_saved || 0))}</strong> saved
                      </span>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="driver-offer-card__footer">
                    <label className="driver-offer-toggle-label">
                      <input
                        type="checkbox"
                        checked={offer.active}
                        disabled={!isAdmin}
                        onChange={() => handleToggleActive(offer)}
                      />
                      <span>{offer.active ? 'Active' : 'Disabled'}</span>
                    </label>

                    <div className="cy-actions">
                      <button
                        type="button"
                        className="cy-action-btn"
                        title="Edit offer"
                        onClick={() => openEdit(offer)}
                        disabled={!isAdmin}
                      >
                        <Pencil size={15} strokeWidth={1.75} />
                      </button>
                      <button
                        type="button"
                        className="cy-action-btn cy-action-btn--danger"
                        title="Delete offer"
                        onClick={() => setDeleteTarget(offer)}
                        disabled={!isAdmin}
                      >
                        <Trash2 size={15} strokeWidth={1.75} />
                      </button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            )
          })}
        </div>
      )}

      {/* SidePanel for Create / Edit */}
      <SidePanel
        open={panelOpen}
        title={editing ? `Edit Offer: ${editing.title}` : 'Create Driver Offer'}
        onClose={() => setPanelOpen(false)}
        width={560}
      >
        <div className="driver-offer-form">
          <label className="driver-offer-field">
            <span className="driver-offer-field__label">
              Offer Title <span className="cy-required">*</span>
            </span>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. 1st 3 Rides 0% Commission!"
              className="driver-offer-input"
            />
            <span className="driver-offer-field__hint">Shown as the main headline on the driver app banner card.</span>
          </label>

          <label className="driver-offer-field">
            <span className="driver-offer-field__label">Description & Rules</span>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="e.g. Keep 100% of your earnings on your first 3 completed rides."
              className="driver-offer-textarea"
            />
          </label>

          {/* Numerical Config: Rides Count & Commission % */}
          <div className="driver-offer-form__grid-2">
            <label className="driver-offer-field">
              <span className="driver-offer-field__label">
                Free Rides Count <span className="cy-required">*</span>
              </span>
              <div className="driver-offer-input-prefix">
                <input
                  type="number"
                  min="1"
                  max="100"
                  step="1"
                  value={form.rides_count}
                  onChange={(e) => setForm({ ...form, rides_count: Math.max(1, parseInt(e.target.value) || 1) })}
                  className="driver-offer-input"
                />
                <span className="driver-offer-unit">rides</span>
              </div>
              <span className="driver-offer-field__hint">e.g. 3 = first 3 rides commission-free.</span>
            </label>

            <label className="driver-offer-field">
              <span className="driver-offer-field__label">
                Offer Commission Rate (%) <span className="cy-required">*</span>
              </span>
              <div className="driver-offer-input-prefix">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={form.commission_rate}
                  onChange={(e) => setForm({ ...form, commission_rate: e.target.value })}
                  className="driver-offer-input"
                />
                <span className="driver-offer-unit">%</span>
              </div>
              <span className="driver-offer-field__hint">0.00% means driver keeps 100% earnings.</span>
            </label>
          </div>

          {/* Validity Days & Dates */}
          <div className="driver-offer-form__grid-3">
            <label className="driver-offer-field">
              <span className="driver-offer-field__label">
                Validity Days <span className="cy-required">*</span>
              </span>
              <div className="driver-offer-input-prefix">
                <input
                  type="number"
                  min="1"
                  max="365"
                  step="1"
                  value={form.valid_days}
                  onChange={(e) => setForm({ ...form, valid_days: Math.max(1, parseInt(e.target.value) || 1) })}
                  className="driver-offer-input"
                />
                <span className="driver-offer-unit">days</span>
              </div>
            </label>

            <label className="driver-offer-field">
              <span className="driver-offer-field__label">
                Start Date <span className="cy-required">*</span>
              </span>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                className="driver-offer-input"
              />
            </label>

            <label className="driver-offer-field">
              <span className="driver-offer-field__label">
                End Date <span className="cy-required">*</span>
              </span>
              <input
                type="date"
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                className="driver-offer-input"
              />
            </label>
          </div>

          {/* Mandatory Banner Image Section */}
          <div className="driver-offer-banner-section">
            <div className="driver-offer-field__label">
              <span>Mandatory Banner Image</span> <span className="cy-required">*</span>
            </div>
            <p className="driver-offer-banner-sub">
              Upload a banner or pick a preset. This banner will be displayed to drivers on the mobile app home screen.
            </p>

            {/* Banner Preview Frame */}
            <div className="driver-offer-banner-preview-box">
              {bannerPreview ? (
                <img src={bannerPreview} alt="Banner Preview" className="driver-offer-banner-preview-img" />
              ) : (
                <div className="driver-offer-banner-placeholder">
                  <ImageIcon size={32} />
                  <span>No banner selected</span>
                </div>
              )}
            </div>

            {/* File Upload / Browse */}
            <div className="driver-offer-upload-row">
              <label className="driver-offer-file-button">
                <Upload size={14} />
                <span>Choose Image File…</span>
                <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
              </label>
              {bannerFile ? (
                <span className="driver-offer-filename">{bannerFile.name} ({(bannerFile.size / 1024).toFixed(0)} KB)</span>
              ) : (
                <span className="driver-offer-filename-sub">Max 8 MB (JPG, PNG, WebP)</span>
              )}
            </div>

            {/* Or URL input */}
            <label className="driver-offer-field" style={{ marginTop: 12 }}>
              <span className="driver-offer-field__label">Or Image URL</span>
              <input
                type="url"
                value={form.banner_url}
                onChange={(e) => {
                  setForm({ ...form, banner_url: e.target.value })
                  setBannerFile(null)
                  setBannerPreview(e.target.value)
                }}
                placeholder="https://images.example.com/driver-banner.jpg"
                className="driver-offer-input"
              />
            </label>

            {/* Template Presets */}
            <div className="driver-offer-templates">
              <span className="driver-offer-templates-title">Or click a template banner:</span>
              <div className="driver-offer-templates-grid">
                {BANNER_TEMPLATES.map((tpl, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`driver-offer-template-btn ${form.banner_url === tpl.url && !bannerFile ? 'is-selected' : ''}`}
                    onClick={() => handleSelectTemplate(tpl)}
                  >
                    <img src={tpl.url} alt={tpl.title} />
                    <span>{tpl.title}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Vehicle Category Target Checkboxes */}
          <div className="driver-offer-field">
            <span className="driver-offer-field__label">Vehicle Category Applicability</span>
            <p className="driver-offer-field__hint">Leave all unchecked to apply to ALL vehicle categories.</p>
            <div className="driver-offer-vehicle-checkboxes">
              {(vehicleCategories ?? []).map((cat) => {
                const checked = (form.vehicle_categories || []).includes(cat.id)
                return (
                  <label key={cat.id} className={`driver-offer-vehicle-chip ${checked ? 'is-checked' : ''}`}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleCategorySelection(cat.id)}
                    />
                    <span>{cat.name}</span>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Active status checkbox */}
          <label className="driver-offer-checkbox-row">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
            />
            <div>
              <strong>Active immediately</strong>
              <p>When checked, drivers will see the banner in the app during the validity dates.</p>
            </div>
          </label>

          <div className="driver-offer-form-actions">
            <Button variant="secondary" onClick={() => setPanelOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave} disabled={saving || !isAdmin}>
              {saving ? 'Saving…' : editing ? 'Save Changes' : 'Publish Offer'}
            </Button>
          </div>
        </div>
      </SidePanel>

      {/* Inspect Banner Modal */}
      {inspectBanner ? (
        <div className="cy-modal-overlay" onClick={() => setInspectBanner(null)}>
          <div className="cy-modal driver-offer-inspect-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cy-modal-header">
              <h3 className="cy-modal-title">Banner Preview: {inspectBanner.title}</h3>
              <button
                type="button"
                className="cy-modal-close"
                onClick={() => setInspectBanner(null)}
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
            <div className="driver-offer-inspect-wrap">
              <img src={inspectBanner.banner_url || BANNER_TEMPLATES[0].url} alt={inspectBanner.title} />
            </div>
            <div className="cy-modal-footer">
              <Button variant="secondary" onClick={() => setInspectBanner(null)}>Close</Button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Delete Confirmation Dialog */}
      {deleteTarget ? (
        <ConfirmDialog
          open={Boolean(deleteTarget)}
          title="Delete Driver Offer"
          description={`Are you sure you want to permanently delete "${deleteTarget.title}"? Active drivers will no longer receive commission-free rides under this offer.`}
          confirmLabel="Delete Offer"
          tone="danger"
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      ) : null}
    </div>
  )
}
