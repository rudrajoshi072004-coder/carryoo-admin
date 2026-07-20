import { useMemo, useState } from 'react'
import {
  UserPlus,
  Pencil,
  UserX,
  Shield,
  Filter,
  Check,
  X,
} from 'lucide-react'
import { ConfirmDialog, SidePanel } from '../components/ConfirmDialog'
import { PageHeader, Pagination } from '../components/PageHeader'
import { useToast } from '../components/Toast'
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  SearchInput,
  Skeleton,
  StatusPill,
} from '../components/ui'
import { useAsyncData } from '../hooks/useAsyncData'
import { paginate } from '../lib/utils'
import { fetchAdminUsersAdmin } from '../api/services/adminData'
import {
  adminRoles,
  adminStatuses,
  rolePermissions,
  permissionLabels,
  allPermissions,
  type AdminUser,
  type AdminRole,
  type AdminStatus,
} from '../data/adminUsersData'
import './AdminUsers.css'

const PAGE_SIZE = 8

async function fetchAdminUsers() {
  return fetchAdminUsersAdmin()
}

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  role: 'Operations' as AdminRole,
  city: 'Mumbai',
}

function AdminUsersSkeleton() {
  return (
    <div className="admin-users-page cy-page" aria-busy="true">
      <Skeleton variant="card" style={{ height: 160, marginBottom: 16 }} />
      <div className="cy-table-card">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="cy-skeleton--row">
            <Skeleton variant="avatar" />
            <Skeleton variant="text" style={{ flex: 1 }} />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AdminUsers() {
  const { toast } = useToast()
  const { data: source, loading, error, setData } = useAsyncData(fetchAdminUsers, [])
  const [users, setUsers] = useState<AdminUser[] | null>(null)
  const list = users ?? source ?? []

  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('All Roles')
  const [statusFilter, setStatusFilter] = useState(adminStatuses[0])
  const [page, setPage] = useState(1)

  const [panelOpen, setPanelOpen] = useState(false)
  const [editing, setEditing] = useState<AdminUser | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [deactivateTarget, setDeactivateTarget] = useState<AdminUser | null>(null)

  const roleOptions = ['All Roles', ...adminRoles]

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return list.filter((u) => {
      const matchesSearch =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q)
      const matchesRole = roleFilter === 'All Roles' || u.role === roleFilter
      const matchesStatus = statusFilter === 'All Status' || u.status === statusFilter
      return matchesSearch && matchesRole && matchesStatus
    })
  }, [list, search, roleFilter, statusFilter])

  const paged = useMemo(() => paginate(filtered, page, PAGE_SIZE), [filtered, page])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setPanelOpen(true)
  }

  const openEdit = (user: AdminUser) => {
    setEditing(user)
    setForm({
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      city: user.city,
    })
    setPanelOpen(true)
  }

  const handleSave = () => {
    if (!form.name.trim() || !form.email.trim()) {
      toast({ title: 'Missing fields', description: 'Name and email are required.', tone: 'warning' })
      return
    }

    if (editing) {
      const updated = list.map((u) =>
        u.id === editing.id
          ? {
              ...u,
              ...form,
              permissions: rolePermissions[form.role],
            }
          : u,
      )
      setUsers(updated)
      setData(updated)
      toast({ title: 'Admin updated', description: `${form.name} has been updated.` })
    } else {
      const newUser: AdminUser = {
        id: `ADM-${String(list.length + 1).padStart(3, '0')}`,
        ...form,
        status: 'Active',
        lastLogin: 'Never',
        createdAt: new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date()),
        permissions: rolePermissions[form.role],
      }
      const updated = [newUser, ...list]
      setUsers(updated)
      setData(updated)
      toast({ title: 'Admin created', description: `${form.name} added as ${form.role}.` })
    }
    setPanelOpen(false)
  }

  const handleDeactivate = () => {
    if (!deactivateTarget) return
    const updated = list.map((u) =>
      u.id === deactivateTarget.id ? { ...u, status: 'Inactive' as AdminStatus } : u,
    )
    setUsers(updated)
    setData(updated)
    toast({
      title: 'Admin deactivated',
      description: `${deactivateTarget.name} can no longer access the admin panel.`,
      tone: 'warning',
    })
    setDeactivateTarget(null)
  }

  if (loading) return <AdminUsersSkeleton />

  if (error) {
    return (
      <Card>
        <EmptyState
          icon={<Shield size={24} strokeWidth={1.75} />}
          title="Unable to load admin users"
          description={error}
          action={<Button variant="primary" onClick={() => window.location.reload()}>Retry</Button>}
        />
      </Card>
    )
  }

  return (
    <div className="admin-users-page cy-page">
      <PageHeader
        title="Admin Users"
        subtitle="Manage admin accounts, roles, and access permissions."
        crumbs={[{ label: 'Platform' }, { label: 'Admin Users' }]}
        actions={
          <Button variant="primary" onClick={openCreate}>
            <UserPlus size={16} strokeWidth={1.75} />
            Add admin
          </Button>
        }
      />

      <Card className="admin-permissions-card">
        <CardHeader title="Role permissions matrix" subtitle="Default permissions per role" />
        <CardBody>
          <div className="admin-permissions-wrap">
            <table className="admin-permissions-table">
              <thead>
                <tr>
                  <th>Permission</th>
                  {adminRoles.map((role) => (
                    <th key={role}>{role}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allPermissions.map((perm) => (
                  <tr key={perm}>
                    <td>{permissionLabels[perm]}</td>
                    {adminRoles.map((role) => (
                      <td key={role} className="admin-permissions-cell">
                        {rolePermissions[role].includes(perm) ? (
                          <Check size={16} strokeWidth={1.75} className="admin-perm-yes" />
                        ) : (
                          <X size={16} strokeWidth={1.75} className="admin-perm-no" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      <div className="cy-page__toolbar">
        <div className="cy-page__toolbar-left">
          <SearchInput
            value={search}
            onChange={(v) => { setSearch(v); setPage(1) }}
            placeholder="Search by name or email…"
          />
        </div>
        <div className="cy-page__toolbar-right">
          <div className="cy-page__filters">
            <Filter size={14} strokeWidth={1.75} />
            <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1) }}>
              {roleOptions.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value as typeof statusFilter); setPage(1) }}>
              {adminStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="cy-table-card">
        <div className="cy-table-wrap">
          <table className="cy-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Last login</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="cy-table__empty-cell">
                    <EmptyState
                      icon={<Shield size={20} strokeWidth={1.75} />}
                      title="No admin users found"
                      description="Adjust filters or add a new admin."
                    />
                  </td>
                </tr>
              ) : (
                paged.items.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <span className="cy-table__primary">{user.name}</span>
                      <span className="cy-table__secondary">{user.city}</span>
                    </td>
                    <td>{user.email}</td>
                    <td><StatusPill status={user.role} tone="info" /></td>
                    <td><StatusPill status={user.status} /></td>
                    <td>{user.lastLogin}</td>
                    <td>
                      <div className="admin-actions">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(user)}>
                          <Pencil size={14} strokeWidth={1.75} />
                          Edit
                        </Button>
                        {user.status === 'Active' ? (
                          <Button variant="ghost" size="sm" onClick={() => setDeactivateTarget(user)}>
                            <UserX size={14} strokeWidth={1.75} />
                            Deactivate
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {paged.total > 0 ? (
          <Pagination
            page={paged.page}
            totalPages={paged.totalPages}
            total={paged.total}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        ) : null}
      </div>

      <SidePanel
        open={panelOpen}
        title={editing ? 'Edit admin' : 'Create admin'}
        onClose={() => setPanelOpen(false)}
      >
        <div className="admin-form">
          <label className="admin-field">
            <span>Full name</span>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Priya Sharma"
            />
          </label>
          <label className="admin-field">
            <span>Email</span>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="name@carryoo.in"
            />
          </label>
          <label className="admin-field">
            <span>Phone</span>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+91 98765 43210"
            />
          </label>
          <label className="admin-field">
            <span>Role</span>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as AdminRole })}>
              {adminRoles.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </label>
          <label className="admin-field">
            <span>City</span>
            <input
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
            />
          </label>
          <div className="admin-form__actions">
            <Button variant="secondary" onClick={() => setPanelOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSave}>
              {editing ? 'Save changes' : 'Create admin'}
            </Button>
          </div>
        </div>
      </SidePanel>

      <ConfirmDialog
        open={!!deactivateTarget}
        title="Deactivate admin?"
        description={`${deactivateTarget?.name} will lose access to the admin panel. This can be reversed later.`}
        confirmLabel="Deactivate"
        tone="danger"
        onConfirm={handleDeactivate}
        onClose={() => setDeactivateTarget(null)}
      />
    </div>
  )
}
