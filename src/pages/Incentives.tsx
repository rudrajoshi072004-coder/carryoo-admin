import { useMemo, useState } from 'react'
import {
  Plus,
  Filter,
  Eye,
  Gift,
  MapPin,
  Truck,
  Users,
} from 'lucide-react'
import { SidePanel } from '../components/ConfirmDialog'
import { PageHeader, Pagination } from '../components/PageHeader'
import { useToast } from '../components/Toast'
import {
  Button,
  EmptyState,
  SearchInput,
  Skeleton,
  StatusPill,
} from '../components/ui'
import { useAsyncData } from '../hooks/useAsyncData'
import { formatINR, paginate } from '../lib/utils'
import { fetchIncentivesAdmin } from '../api/services/adminData'
import {
  incentiveTypes,
  incentiveStatuses,
  incentiveCities,
  incentiveVehicles,
  type Incentive,
  type IncentiveType,
  type IncentiveStatus,
} from '../data/incentivesData'
import './Incentives.css'

const PAGE_SIZE = 8

async function fetchIncentives() {
  return fetchIncentivesAdmin()
}

const emptyForm = {
  name: '',
  type: 'Peak Hour' as IncentiveType,
  city: 'Mumbai',
  vehicle: 'Bike',
  bonusAmount: '',
  period: '',
  description: '',
}

function IncentivesSkeleton() {
  return (
    <div className="cy-page" aria-busy="true">
      <Skeleton variant="title" style={{ width: 280, height: 36 }} />
      <div className="cy-table-card">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="cy-skeleton--row">
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Skeleton variant="title" style={{ width: '28%' }} />
              <Skeleton variant="text" style={{ width: '60%' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Incentives() {
  const { toast } = useToast()
  const { data: source, loading, error, setData } = useAsyncData(fetchIncentives, [])
  const [items, setItems] = useState<Incentive[] | null>(null)

  const incentives = items ?? source

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState(incentiveTypes[0])
  const [statusFilter, setStatusFilter] = useState(incentiveStatuses[0])
  const [cityFilter, setCityFilter] = useState(incentiveCities[0])
  const [vehicleFilter, setVehicleFilter] = useState(incentiveVehicles[0])
  const [page, setPage] = useState(1)

  const [createOpen, setCreateOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selected, setSelected] = useState<Incentive | null>(null)
  const [form, setForm] = useState(emptyForm)

  const filtered = useMemo(() => {
    if (!incentives) return []
    const q = search.trim().toLowerCase()
    return incentives.filter((inc) => {
      const matchesSearch =
        !q ||
        inc.id.toLowerCase().includes(q) ||
        inc.name.toLowerCase().includes(q) ||
        inc.city.toLowerCase().includes(q)

      const matchesType = typeFilter === 'All Types' || inc.type === typeFilter
      const matchesStatus = statusFilter === 'All Status' || inc.status === statusFilter
      const matchesCity = cityFilter === 'All Cities' || inc.city === cityFilter
      const matchesVehicle = vehicleFilter === 'All Vehicles' || inc.vehicle === vehicleFilter

      return matchesSearch && matchesType && matchesStatus && matchesCity && matchesVehicle
    })
  }, [incentives, search, typeFilter, statusFilter, cityFilter, vehicleFilter])

  const paged = useMemo(
    () => paginate(filtered, page, PAGE_SIZE),
    [filtered, page],
  )

  const openDetail = (inc: Incentive) => {
    setSelected(inc)
    setDetailOpen(true)
  }

  const handleCreate = () => {
    if (!form.name.trim() || !form.bonusAmount || !form.period.trim()) {
      toast({ title: 'Missing fields', description: 'Fill name, bonus, and period.', tone: 'warning' })
      return
    }

    const newItem: Incentive = {
      id: `INC-${2400 + (incentives?.length ?? 0) + 1}`,
      name: form.name.trim(),
      type: form.type,
      city: form.city,
      vehicle: form.vehicle,
      driversAssigned: 0,
      bonusAmount: Number(form.bonusAmount),
      status: 'Scheduled',
      period: form.period.trim(),
      description: form.description.trim() || 'New incentive program.',
      assignedDrivers: [],
    }

    const next = [newItem, ...(incentives ?? [])]
    setItems(next)
    setData(next)
    setCreateOpen(false)
    setForm(emptyForm)
    setPage(1)
    toast({
      title: 'Incentive created',
      description: `${newItem.name} is scheduled for ${newItem.city}.`,
    })
  }

  const clearFilters = () => {
    setSearch('')
    setTypeFilter('All Types')
    setStatusFilter('All Status')
    setCityFilter('All Cities')
    setVehicleFilter('All Vehicles')
    setPage(1)
  }

  if (loading) return <IncentivesSkeleton />

  if (error || !incentives) {
    return (
      <div className="cy-table-card">
        <EmptyState
          icon={<Gift size={24} strokeWidth={1.75} />}
          title="Unable to load incentives"
          description={error ?? 'Could not fetch incentive programs.'}
          action={
            <Button variant="primary" onClick={() => window.location.reload()}>
              Retry
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div className="incentives-page cy-page">
      <PageHeader
        title="Incentives"
        subtitle="Create and manage driver bonus programs by city, vehicle, and trip targets."
        crumbs={[{ label: 'Operations' }, { label: 'Incentives' }]}
        actions={
          <Button variant="primary" onClick={() => setCreateOpen(true)}>
            <Plus size={16} strokeWidth={1.75} />
            Create Incentive
          </Button>
        }
      />

      <div className="cy-page__toolbar">
        <div className="cy-page__toolbar-left">
          <SearchInput
            value={search}
            onChange={(v) => { setSearch(v); setPage(1) }}
            placeholder="Search incentives by name, ID, city…"
            className="incentives-search"
            aria-label="Search incentives"
          />
          <div className="cy-page__filters">
            <span className="cy-page__filters-label">
              <Filter size={14} strokeWidth={1.75} aria-hidden /> Filters
            </span>
            <select className="cy-select" value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value as typeof typeFilter); setPage(1) }} aria-label="Filter by type">
              {incentiveTypes.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <select className="cy-select" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value as typeof statusFilter); setPage(1) }} aria-label="Filter by status">
              {incentiveStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select className="cy-select" value={cityFilter} onChange={(e) => { setCityFilter(e.target.value); setPage(1) }} aria-label="Filter by city">
              {incentiveCities.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="cy-select" value={vehicleFilter} onChange={(e) => { setVehicleFilter(e.target.value); setPage(1) }} aria-label="Filter by vehicle">
              {incentiveVehicles.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="cy-page__meta">
        <span>Showing <strong>{filtered.length}</strong> of {incentives.length} programs</span>
      </div>

      <div className="cy-table-card">
        {filtered.length === 0 ? (
          <EmptyState
            icon={<Gift size={24} strokeWidth={1.75} />}
            title="No incentives found"
            description="Adjust filters or create a new incentive program."
            action={<Button variant="secondary" onClick={clearFilters}>Clear filters</Button>}
          />
        ) : (
          <>
            <div className="cy-table-wrap">
              <table className="cy-table incentives-table">
                <thead>
                  <tr>
                    <th>Program</th>
                    <th>Type</th>
                    <th>City</th>
                    <th>Vehicle</th>
                    <th>Drivers</th>
                    <th>Bonus</th>
                    <th>Status</th>
                    <th>Period</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.items.map((inc) => (
                    <tr
                      key={inc.id}
                      className="cy-table__row"
                      onClick={() => openDetail(inc)}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          openDetail(inc)
                        }
                      }}
                    >
                      <td>
                        <div className="cy-table__primary">{inc.name}</div>
                        <div className="cy-table__secondary">{inc.id}</div>
                      </td>
                      <td><span className={`inc-type inc-type--${inc.type.toLowerCase().replace(/\s+/g, '-')}`}>{inc.type}</span></td>
                      <td>{inc.city}</td>
                      <td>{inc.vehicle}</td>
                      <td className="cy-table__mono">{inc.driversAssigned.toLocaleString('en-IN')}</td>
                      <td className="cy-table__mono incentives-bonus">{formatINR(inc.bonusAmount)}</td>
                      <td><StatusPill status={inc.status} tone={inc.status as IncentiveStatus} /></td>
                      <td><span className="incentives-period">{inc.period}</span></td>
                      <td>
                        <div className="cy-actions" onClick={(e) => e.stopPropagation()}>
                          <button type="button" className="cy-action-btn" title="View details" aria-label={`View ${inc.name}`} onClick={() => openDetail(inc)}>
                            <Eye size={15} strokeWidth={1.75} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={paged.page}
              totalPages={paged.totalPages}
              total={paged.total}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
            />
          </>
        )}
      </div>

      <SidePanel open={createOpen} title="Create Incentive" onClose={() => setCreateOpen(false)} width={520}>
        <form className="inc-form" onSubmit={(e) => { e.preventDefault(); handleCreate() }}>
          <label className="inc-form__field">
            <span>Program name</span>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Mumbai Evening Rush" />
          </label>
          <div className="inc-form__row">
            <label className="inc-form__field">
              <span>Type</span>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as IncentiveType })}>
                {incentiveTypes.filter((t) => t !== 'All Types').map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            <label className="inc-form__field">
              <span>Bonus amount (₹)</span>
              <input type="number" min={0} value={form.bonusAmount} onChange={(e) => setForm({ ...form, bonusAmount: e.target.value })} placeholder="150" />
            </label>
          </div>
          <div className="inc-form__row">
            <label className="inc-form__field">
              <span>City</span>
              <select value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}>
                {incentiveCities.filter((c) => c !== 'All Cities').map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label className="inc-form__field">
              <span>Vehicle</span>
              <select value={form.vehicle} onChange={(e) => setForm({ ...form, vehicle: e.target.value })}>
                {incentiveVehicles.filter((v) => v !== 'All Vehicles').map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </label>
          </div>
          <label className="inc-form__field">
            <span>Period</span>
            <input type="text" value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} placeholder="Mon–Fri · 5:00 PM – 9:00 PM" />
          </label>
          <label className="inc-form__field">
            <span>Description</span>
            <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe eligibility and bonus rules…" />
          </label>
          <div className="inc-form__actions">
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Create Incentive</Button>
          </div>
        </form>
      </SidePanel>

      <SidePanel open={detailOpen} title={selected?.name ?? 'Incentive Details'} onClose={() => setDetailOpen(false)} width={520}>
        {selected ? (
          <div className="inc-detail">
            <div className="inc-detail__meta">
              <StatusPill status={selected.status} tone={selected.status} />
              <span className="inc-detail__id">{selected.id}</span>
            </div>
            <p className="inc-detail__desc">{selected.description}</p>

            <div className="inc-detail__grid">
              <div className="inc-detail__card">
                <MapPin size={16} strokeWidth={1.75} />
                <div>
                  <span className="inc-detail__label">City</span>
                  <strong>{selected.city}</strong>
                </div>
              </div>
              <div className="inc-detail__card">
                <Truck size={16} strokeWidth={1.75} />
                <div>
                  <span className="inc-detail__label">Vehicle</span>
                  <strong>{selected.vehicle}</strong>
                </div>
              </div>
              <div className="inc-detail__card">
                <Users size={16} strokeWidth={1.75} />
                <div>
                  <span className="inc-detail__label">Drivers assigned</span>
                  <strong>{selected.driversAssigned.toLocaleString('en-IN')}</strong>
                </div>
              </div>
              <div className="inc-detail__card">
                <Gift size={16} strokeWidth={1.75} />
                <div>
                  <span className="inc-detail__label">Bonus</span>
                  <strong>{formatINR(selected.bonusAmount)}</strong>
                </div>
              </div>
            </div>

            <div className="inc-detail__section">
              <h3>Assignment</h3>
              <p className="inc-detail__period">{selected.period}</p>
              {selected.targetTrips ? (
                <p className="inc-detail__target">Trip target: {selected.targetTrips} trips</p>
              ) : null}
            </div>

            <div className="inc-detail__section">
              <h3>Assigned drivers</h3>
              <ul className="inc-detail__drivers">
                {selected.assignedDrivers.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
      </SidePanel>
    </div>
  )
}
