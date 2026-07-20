import { useMemo, useState } from 'react'
import {
  Bell,
  Send,
  Filter,
  Mail,
  MessageSquare,
  Megaphone,
  Smartphone,
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
import { fetchNotificationsAdmin } from '../api/services/adminData'
import {
  notificationChannels,
  notificationAudiences,
  notificationStatuses,
  type NotificationChannel,
  type NotificationAudience,
  type NotificationHistory,
  type NotificationTemplate,
} from '../data/notificationsData'
import './Notifications.css'

const PAGE_SIZE = 8

const channelIcons: Record<NotificationChannel, typeof Bell> = {
  Push: Smartphone,
  SMS: MessageSquare,
  Email: Mail,
  Announcement: Megaphone,
}

const indianCities = ['Mumbai', 'Delhi NCR', 'Bangalore', 'Hyderabad', 'Pune', 'Chennai', 'Kolkata']

async function fetchNotifications() {
  return fetchNotificationsAdmin()
}

function nowLabel() {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date())
}

const emptyCompose = {
  channel: 'Push' as NotificationChannel,
  audience: 'All' as NotificationAudience,
  city: 'Mumbai',
  title: '',
  message: '',
}

function NotificationsSkeleton() {
  return (
    <div className="notifications-page cy-page" aria-busy="true">
      <div className="notifications-templates">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} variant="card" style={{ height: 88 }} />
        ))}
      </div>
      <div className="cy-table-card">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="cy-skeleton--row">
            <Skeleton variant="text" style={{ flex: 1 }} />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Notifications() {
  const { toast } = useToast()
  const { data, loading, error, setData } = useAsyncData(fetchNotifications, [])

  const [history, setHistory] = useState<NotificationHistory[] | null>(null)
  const list = history ?? data?.history ?? []

  const [search, setSearch] = useState('')
  const [channelFilter, setChannelFilter] = useState(notificationChannels[0])
  const [audienceFilter, setAudienceFilter] = useState(notificationAudiences[0])
  const [statusFilter, setStatusFilter] = useState(notificationStatuses[0])
  const [page, setPage] = useState(1)

  const [composeOpen, setComposeOpen] = useState(false)
  const [compose, setCompose] = useState(emptyCompose)
  const [sendConfirm, setSendConfirm] = useState(false)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return list.filter((n) => {
      const matchesSearch =
        !q ||
        n.id.toLowerCase().includes(q) ||
        n.title.toLowerCase().includes(q) ||
        n.message.toLowerCase().includes(q)
      const matchesChannel = channelFilter === 'All Channels' || n.channel === channelFilter
      const matchesAudience = audienceFilter === 'All Audiences' || n.audience === audienceFilter
      const matchesStatus = statusFilter === 'All Status' || n.status === statusFilter
      return matchesSearch && matchesChannel && matchesAudience && matchesStatus
    })
  }, [list, search, channelFilter, audienceFilter, statusFilter])

  const paged = useMemo(() => paginate(filtered, page, PAGE_SIZE), [filtered, page])

  const applyTemplate = (tpl: NotificationTemplate) => {
    setCompose({
      channel: tpl.channel,
      audience: tpl.audience,
      city: 'Mumbai',
      title: tpl.subject,
      message: tpl.body,
    })
    setComposeOpen(true)
  }

  const handleSend = () => {
    if (!compose.title.trim() || !compose.message.trim()) {
      toast({ title: 'Missing fields', description: 'Enter a title and message.', tone: 'warning' })
      return
    }

    const audienceDetail =
      compose.audience === 'City'
        ? compose.city
        : compose.audience === 'All'
          ? 'All users – Pan India'
          : compose.audience === 'Driver'
            ? 'Active drivers'
            : 'All customers'

    const newEntry: NotificationHistory = {
      id: `NTF-${Date.now()}`,
      channel: compose.channel,
      audience: compose.audience,
      audienceDetail,
      title: compose.title.trim(),
      message: compose.message.trim(),
      sentAt: nowLabel(),
      sentBy: 'Priya Sharma',
      recipients: Math.floor(Math.random() * 5000) + 50,
      status: 'Sent',
    }

    const updated = [newEntry, ...list]
    setHistory(updated)
    setData((prev) => (prev ? { ...prev, history: updated } : prev))
    setCompose(emptyCompose)
    setComposeOpen(false)
    toast({
      title: 'Notification sent',
      description: `${compose.channel} sent to ${audienceDetail} (${newEntry.recipients.toLocaleString('en-IN')} recipients).`,
    })
  }

  if (loading) return <NotificationsSkeleton />

  if (error || !data) {
    return (
      <Card>
        <EmptyState
          icon={<Bell size={24} strokeWidth={1.75} />}
          title="Unable to load notifications"
          description={error ?? 'Could not fetch notification data.'}
          action={<Button variant="primary" onClick={() => window.location.reload()}>Retry</Button>}
        />
      </Card>
    )
  }

  return (
    <div className="notifications-page cy-page">
      <PageHeader
        title="Notifications"
        subtitle="Send push, SMS, email, and in-app announcements to drivers and customers."
        crumbs={[{ label: 'Platform' }, { label: 'Notifications' }]}
        actions={
          <Button variant="primary" onClick={() => setComposeOpen(true)}>
            <Send size={16} strokeWidth={1.75} />
            Compose
          </Button>
        }
      />

      <section className="notifications-templates" aria-label="Templates">
        <Card>
          <CardHeader title="Quick templates" subtitle="Start from a saved template" />
          <CardBody>
            <div className="notifications-template-grid">
              {data.templates.slice(0, 6).map((tpl) => {
                const Icon = channelIcons[tpl.channel]
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    className="notifications-template-btn"
                    onClick={() => applyTemplate(tpl)}
                  >
                    <Icon size={16} strokeWidth={1.75} />
                    <div>
                      <strong>{tpl.name}</strong>
                      <span>{tpl.channel} · {tpl.audience}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </CardBody>
        </Card>
      </section>

      <div className="cy-page__toolbar">
        <div className="cy-page__toolbar-left">
          <SearchInput
            value={search}
            onChange={(v) => { setSearch(v); setPage(1) }}
            placeholder="Search notifications…"
          />
        </div>
        <div className="cy-page__toolbar-right">
          <div className="cy-page__filters">
            <Filter size={14} strokeWidth={1.75} />
            <select value={channelFilter} onChange={(e) => { setChannelFilter(e.target.value as typeof channelFilter); setPage(1) }}>
              {notificationChannels.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={audienceFilter} onChange={(e) => { setAudienceFilter(e.target.value as typeof audienceFilter); setPage(1) }}>
              {notificationAudiences.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value as typeof statusFilter); setPage(1) }}>
              {notificationStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="cy-table-card">
        <div className="cy-table-wrap">
          <table className="cy-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Channel</th>
                <th>Audience</th>
                <th>Title</th>
                <th>Sent</th>
                <th>Recipients</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {paged.items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="cy-table__empty-cell">
                    <EmptyState
                      icon={<Bell size={20} strokeWidth={1.75} />}
                      title="No notifications found"
                      description="Adjust filters or compose a new notification."
                    />
                  </td>
                </tr>
              ) : (
                paged.items.map((n) => (
                  <tr key={n.id}>
                    <td><span className="cy-table__mono">{n.id}</span></td>
                    <td>
                      <span className="notifications-channel">
                        {(() => {
                          const Icon = channelIcons[n.channel]
                          return <Icon size={14} strokeWidth={1.75} />
                        })()}
                        {n.channel}
                      </span>
                    </td>
                    <td>
                      <span className="cy-table__primary">{n.audience}</span>
                      <span className="cy-table__secondary">{n.audienceDetail}</span>
                    </td>
                    <td>
                      <span className="cy-table__primary">{n.title}</span>
                      <span className="cy-table__secondary">{n.message.slice(0, 60)}…</span>
                    </td>
                    <td>
                      <span className="cy-table__primary">{n.sentAt.split(',')[0]}</span>
                      <span className="cy-table__secondary">{n.sentBy}</span>
                    </td>
                    <td>{n.recipients.toLocaleString('en-IN')}</td>
                    <td><StatusPill status={n.status} /></td>
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

      <SidePanel open={composeOpen} title="Compose notification" onClose={() => setComposeOpen(false)}>
        <div className="notifications-compose">
          <label className="notifications-field">
            <span>Channel</span>
            <select
              value={compose.channel}
              onChange={(e) => setCompose({ ...compose, channel: e.target.value as NotificationChannel })}
            >
              {(['Push', 'SMS', 'Email', 'Announcement'] as NotificationChannel[]).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="notifications-field">
            <span>Audience</span>
            <select
              value={compose.audience}
              onChange={(e) => setCompose({ ...compose, audience: e.target.value as NotificationAudience })}
            >
              {(['All', 'City', 'Driver', 'Customer'] as NotificationAudience[]).map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </label>
          {compose.audience === 'City' ? (
            <label className="notifications-field">
              <span>City</span>
              <select value={compose.city} onChange={(e) => setCompose({ ...compose, city: e.target.value })}>
                {indianCities.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
          ) : null}
          <label className="notifications-field">
            <span>Title</span>
            <input
              type="text"
              value={compose.title}
              onChange={(e) => setCompose({ ...compose, title: e.target.value })}
              placeholder="Notification title"
            />
          </label>
          <label className="notifications-field">
            <span>Message</span>
            <textarea
              value={compose.message}
              onChange={(e) => setCompose({ ...compose, message: e.target.value })}
              placeholder="Write your message…"
              rows={5}
            />
          </label>
          <div className="notifications-compose__actions">
            <Button variant="secondary" onClick={() => setComposeOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => setSendConfirm(true)}>
              <Send size={14} strokeWidth={1.75} />
              Send now
            </Button>
          </div>
        </div>
      </SidePanel>

      <ConfirmDialog
        open={sendConfirm}
        title="Send notification?"
        description={`This will send a ${compose.channel} notification to ${compose.audience === 'City' ? compose.city : compose.audience} audience immediately.`}
        confirmLabel="Send"
        onConfirm={handleSend}
        onClose={() => setSendConfirm(false)}
      />
    </div>
  )
}
