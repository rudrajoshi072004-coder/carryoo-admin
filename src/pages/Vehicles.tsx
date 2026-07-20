import { useMemo, useState } from 'react'
import { Bike, Download, Pencil, Plus, Trash2, Truck } from 'lucide-react'
import { PageHeader, Pagination } from '../components/PageHeader'
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
  createVehicleCategory,
  deleteVehicleCategory,
  listVehicleCategories,
  updateVehicleCategory,
} from '../api/services/vehicleCategories'
import type { VehicleCategory, VehicleCategoryInput } from '../api/types'
import { exportCsv, formatINR, paginate } from '../lib/utils'
import './Vehicles.css'

const PAGE_SIZE = 10

const emptyForm: VehicleCategoryInput = {
  name: '',
  base_fare: '35.00',
  per_km_rate: '9.00',
  minimum_fare: '35.00',
  waiting_per_min: '2.00',
  max_weight_kg: 20,
  active: true,
  helper_supported: false,
  intra_city_available: true,
  priority_order: 0,
}

function categoryIcon(name: string) {
  const n = name.toLowerCase()
  if (n.includes('2') || n.includes('bike')) return Bike
  return Truck
}

function VehiclesSkeleton() {
  return (
    <div className="cy-page" aria-busy="true">
      <div className="vehicles-grid">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} variant="card" style={{ height: 120 }} />
        ))}
      </div>
    </div>
  )
}

export default function Vehicles() {
  const { isAdmin } = useAuth()
  const { toast } = useToast()
  const { data: categories, loading, error, refetch, setData } = useAsyncData(
    listVehicleCategories,
    [],
  )

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [panelOpen, setPanelOpen] = useState(false)
  const [editing, setEditing] = useState<VehicleCategory | null>(null)
  const [form, setForm] = useState<VehicleCategoryInput>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<VehicleCategory | null>(null)

  const filtered = useMemo(() => {
    if (!categories) return []
    const q = search.trim().toLowerCase()
    return categories.filter(
      (c) => !q || c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q),
    )
  }, [categories, search])

  const paginated = useMemo(() => paginate(filtered, page, PAGE_SIZE), [filtered, page])

  const activeCount = categories?.filter((c) => c.active).length ?? 0

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setPanelOpen(true)
  }

  const openEdit = (item: VehicleCategory) => {
    setEditing(item)
    setForm({
      name: item.name,
      base_fare: item.base_fare,
      per_km_rate: item.per_km_rate,
      minimum_fare: item.minimum_fare ?? item.base_fare,
      waiting_per_min: item.waiting_per_min ?? '2.00',
      max_weight_kg: item.max_weight_kg ?? undefined,
      active: item.active,
      helper_supported: item.helper_supported ?? false,
      intra_city_available: item.intra_city_available ?? true,
      priority_order: item.priority_order ?? 0,
      icon: item.icon ?? undefined,
      payload_type: item.payload_type ?? undefined,
    })
    setPanelOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({ title: 'Name required', description: 'Enter a vehicle type name.', tone: 'error' })
      return
    }
    setSaving(true)
    try {
      if (editing) {
        const updated = await updateVehicleCategory(editing.id, form)
        setData((prev) => prev?.map((c) => (c.id === updated.id ? updated : c)) ?? prev)
        toast({ title: 'Vehicle updated', description: `${updated.name} saved to backend.`, tone: 'success' })
      } else {
        const created = await createVehicleCategory(form)
        setData((prev) => [...(prev ?? []), created])
        toast({ title: 'Vehicle added', description: `${created.name} is now available in apps.`, tone: 'success' })
      }
      setPanelOpen(false)
    } catch (err) {
      toast({ title: 'Save failed', description: getApiErrorMessage(err), tone: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteVehicleCategory(deleteTarget.id)
      setData((prev) => prev?.filter((c) => c.id !== deleteTarget.id) ?? prev)
      toast({ title: 'Deleted', description: `${deleteTarget.name} removed.`, tone: 'success' })
    } catch (err) {
      toast({ title: 'Delete failed', description: getApiErrorMessage(err), tone: 'error' })
    } finally {
      setDeleteTarget(null)
    }
  }

  const handleExport = () => {
    exportCsv(
      'carryoo-vehicle-categories.csv',
      ['ID', 'Name', 'Base fare', 'Per km', 'Min fare', 'Max kg', 'Active'],
      filtered.map((c) => [
        c.id,
        c.name,
        c.base_fare,
        c.per_km_rate,
        c.minimum_fare ?? '',
        c.max_weight_kg ?? '',
        c.active ? 'Yes' : 'No',
      ]),
    )
  }

  if (loading) return <VehiclesSkeleton />

  if (error || !categories) {
    return (
      <div className="cy-table-card">
        <EmptyState
          icon={<Truck size={24} strokeWidth={1.75} />}
          title="Unable to load vehicle types"
          description={error ?? 'Could not fetch vehicle categories.'}
          action={
            <Button variant="primary" onClick={refetch}>
              Retry
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div className="vehicles-page cy-page">
      <PageHeader
        title="Vehicle Types"
        subtitle="Manage categories shown in customer and driver apps. Changes apply on next app refresh."
        crumbs={[{ label: 'Dashboard', to: '/' }, { label: 'Vehicle Types' }]}
        actions={
          <>
            <Button variant="secondary" onClick={handleExport}>
              <Download size={16} strokeWidth={1.75} />
              Export
            </Button>
            <Button variant="primary" onClick={openCreate} disabled={!isAdmin}>
              <Plus size={16} strokeWidth={1.75} />
              Add vehicle type
            </Button>
          </>
        }
      />

      {!isAdmin ? (
        <PermissionBanner message="You can view vehicle types. Sign in with an admin account to add, edit, or delete." />
      ) : null}

      <div className="vehicles-grid">
        <Card className="vehicles-type-card">
          <CardBody>
            <div className="vehicles-type-card__head">
              <span className="vehicles-type-card__icon"><Truck size={20} /></span>
              <div><h3>Total types</h3><span>On platform</span></div>
            </div>
            <strong className="vehicles-stat-big">{categories.length}</strong>
          </CardBody>
        </Card>
        <Card className="vehicles-type-card">
          <CardBody>
            <div className="vehicles-type-card__head">
              <span className="vehicles-type-card__icon"><Bike size={20} /></span>
              <div><h3>Active</h3><span>Visible in apps</span></div>
            </div>
            <strong className="vehicles-stat-big">{activeCount}</strong>
          </CardBody>
        </Card>
      </div>

      <div className="cy-page__toolbar">
        <SearchInput
          value={search}
          onChange={(v) => { setSearch(v); setPage(1) }}
          placeholder="Search vehicle type…"
          className="vehicles-search"
        />
      </div>

      <div className="cy-table-card">
        {paginated.items.length === 0 ? (
          <EmptyState
            icon={<Truck size={24} strokeWidth={1.75} />}
            title="No vehicle types"
            description="Add your first vehicle category for customer and driver apps."
            action={isAdmin ? <Button variant="primary" onClick={openCreate}>Add vehicle type</Button> : undefined}
          />
        ) : (
          <>
            <div className="cy-table-wrap">
              <table className="cy-table vehicles-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Base fare</th>
                    <th>Per km</th>
                    <th>Min fare</th>
                    <th>Max weight</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.items.map((item) => {
                    const Icon = categoryIcon(item.name)
                    return (
                      <tr key={item.id} className="cy-table__row">
                        <td>
                          <div className="vehicles-name-cell">
                            <span className="vehicles-type-card__icon"><Icon size={16} /></span>
                            <div>
                              <div className="cy-table__primary">{item.name}</div>
                              <div className="cy-table__secondary cy-table__mono">{item.id.slice(0, 8)}…</div>
                            </div>
                          </div>
                        </td>
                        <td className="cy-table__mono">{formatINR(Number.parseFloat(item.base_fare))}</td>
                        <td className="cy-table__mono">{formatINR(Number.parseFloat(item.per_km_rate))}</td>
                        <td className="cy-table__mono">
                          {item.minimum_fare ? formatINR(Number.parseFloat(item.minimum_fare)) : '—'}
                        </td>
                        <td>{item.max_weight_kg != null ? `${item.max_weight_kg} kg` : '—'}</td>
                        <td>
                          <StatusPill status={item.active ? 'Active' : 'Inactive'} tone={item.active ? 'active' : 'inactive'} />
                        </td>
                        <td>
                          <div className="cy-actions">
                            <button type="button" className="cy-action-btn" title="Edit" onClick={() => openEdit(item)}>
                              <Pencil size={15} strokeWidth={1.75} />
                            </button>
                            {isAdmin ? (
                              <button type="button" className="cy-action-btn cy-action-btn--danger" title="Delete" onClick={() => setDeleteTarget(item)}>
                                <Trash2 size={15} strokeWidth={1.75} />
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <Pagination page={paginated.page} totalPages={paginated.totalPages} total={paginated.total} pageSize={PAGE_SIZE} onPageChange={setPage} />
          </>
        )}
      </div>

      <SidePanel open={panelOpen} title={editing ? `Edit ${editing.name}` : 'Add vehicle type'} onClose={() => setPanelOpen(false)} width={520}>
        <div className="form-grid">
          <label className="form-field full-width">
            <span>Name (slug-style, e.g. 2-wheeler)</span>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="3-wheeler" />
          </label>
          <label className="form-field">
            <span>Base fare (₹)</span>
            <input value={form.base_fare} onChange={(e) => setForm({ ...form, base_fare: e.target.value })} />
          </label>
          <label className="form-field">
            <span>Per km rate (₹)</span>
            <input value={form.per_km_rate} onChange={(e) => setForm({ ...form, per_km_rate: e.target.value })} />
          </label>
          <label className="form-field">
            <span>Minimum fare (₹)</span>
            <input value={form.minimum_fare ?? ''} onChange={(e) => setForm({ ...form, minimum_fare: e.target.value })} />
          </label>
          <label className="form-field">
            <span>Waiting / min (₹)</span>
            <input value={form.waiting_per_min ?? ''} onChange={(e) => setForm({ ...form, waiting_per_min: e.target.value })} />
          </label>
          <label className="form-field">
            <span>Max weight (kg)</span>
            <input type="number" value={form.max_weight_kg ?? ''} onChange={(e) => setForm({ ...form, max_weight_kg: Number(e.target.value) })} />
          </label>
          <label className="form-field">
            <span>Priority order</span>
            <input type="number" value={form.priority_order ?? 0} onChange={(e) => setForm({ ...form, priority_order: Number(e.target.value) })} />
          </label>
          <label className="form-check full-width">
            <input type="checkbox" checked={form.active ?? true} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
            Active (visible in customer & driver apps)
          </label>
          <label className="form-check">
            <input type="checkbox" checked={form.helper_supported ?? false} onChange={(e) => setForm({ ...form, helper_supported: e.target.checked })} />
            Helper supported
          </label>
          <label className="form-check">
            <input type="checkbox" checked={form.intra_city_available ?? true} onChange={(e) => setForm({ ...form, intra_city_available: e.target.checked })} />
            Intra-city available
          </label>
        </div>
        <div className="form-actions">
          <Button variant="secondary" onClick={() => setPanelOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} disabled={saving || !isAdmin}>
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Create vehicle type'}
          </Button>
        </div>
      </SidePanel>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete vehicle type?"
        description={`Remove "${deleteTarget?.name}"? Customer and driver apps will stop showing this type.`}
        confirmLabel="Delete"
        tone="danger"
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  )
}
