import { useMemo, useState } from 'react'
import {
  Headphones,
  Filter,
  MessageSquare,
  Ticket,
  UserPlus,
  XCircle,
  Send,
} from 'lucide-react'
import { ConfirmDialog, SidePanel } from '../components/ConfirmDialog'
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
import { paginate } from '../lib/utils'
import { fetchSupportAdmin } from '../api/services/adminData'
import {
  ticketCategories,
  ticketStatuses,
  ticketPriorities,
  supportAgents,
  type SupportTicket,
  type TicketCategory,
  type TicketPriority,
  type TicketStatus,
  type LiveChatSession,
} from '../data/supportData'
import './Support.css'

const PAGE_SIZE = 6

async function fetchSupport() {
  return fetchSupportAdmin()
}

function SupportSkeleton() {
  return (
    <div className="cy-page" aria-busy="true">
      <div className="support-kpi-row">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} variant="card" style={{ height: 72 }} />
        ))}
      </div>
      <div className="cy-table-card">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="cy-skeleton--row">
            <Skeleton variant="text" style={{ flex: 1 }} />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Support() {
  const { toast } = useToast()
  const { data, loading, error } = useAsyncData(fetchSupport, [])

  const [tab, setTab] = useState<'tickets' | 'chat'>('tickets')
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [chats] = useState<LiveChatSession[]>([])

  const ticketList = tickets.length ? tickets : (data?.tickets ?? [])

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState(ticketCategories[0])
  const [statusFilter, setStatusFilter] = useState(ticketStatuses[0])
  const [priorityFilter, setPriorityFilter] = useState(ticketPriorities[0])
  const [kpiFilter, setKpiFilter] = useState<TicketCategory | null>(null)
  const [page, setPage] = useState(1)

  const [selected, setSelected] = useState<SupportTicket | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [closeConfirm, setCloseConfirm] = useState(false)
  const [assignAgent, setAssignAgent] = useState('Unassigned')
  const [reply, setReply] = useState('')

  const [activeChat, setActiveChat] = useState<LiveChatSession | null>(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return ticketList.filter((t) => {
      const matchesSearch =
        !q ||
        t.id.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        t.requester.toLowerCase().includes(q)

      const matchesCategory =
        (categoryFilter === 'All Categories' && !kpiFilter) ||
        (kpiFilter ? t.category === kpiFilter : categoryFilter === 'All Categories' || t.category === categoryFilter)
      const matchesStatus = statusFilter === 'All Status' || t.status === statusFilter
      const matchesPriority = priorityFilter === 'All Priority' || t.priority === priorityFilter

      return matchesSearch && matchesCategory && matchesStatus && matchesPriority
    })
  }, [ticketList, search, categoryFilter, statusFilter, priorityFilter, kpiFilter])

  const paged = useMemo(() => paginate(filtered, page, PAGE_SIZE), [filtered, page])

  const openTicket = (ticket: SupportTicket) => {
    setSelected(ticket)
    setAssignAgent(ticket.agent ?? 'Unassigned')
    setReply('')
    setPanelOpen(true)
  }

  const handleAssign = () => {
    if (!selected || assignAgent === 'Unassigned') {
      toast({ title: 'Select an agent', description: 'Choose a support agent to assign.', tone: 'warning' })
      return
    }
    const updated = ticketList.map((t) =>
      t.id === selected.id
        ? { ...t, agent: assignAgent, status: t.status === 'Open' ? 'In Progress' as TicketStatus : t.status }
        : t,
    )
    setTickets(updated)
    setSelected({ ...selected, agent: assignAgent, status: selected.status === 'Open' ? 'In Progress' : selected.status })
    toast({ title: 'Agent assigned', description: `${assignAgent} is now handling ${selected.id}.` })
  }

  const handleClose = () => {
    if (!selected) return
    const updated = ticketList.map((t) =>
      t.id === selected.id ? { ...t, status: 'Closed' as TicketStatus } : t,
    )
    setTickets(updated)
    setSelected({ ...selected, status: 'Closed' })
    toast({ title: 'Ticket closed', description: `${selected.id} has been marked as closed.` })
  }

  const handleReply = () => {
    if (!selected || !reply.trim()) return
    const msg = {
      id: `m-${Date.now()}`,
      sender: assignAgent !== 'Unassigned' ? assignAgent : 'Support Agent',
      role: 'agent' as const,
      body: reply.trim(),
      time: 'Just now',
    }
    const updatedTicket = { ...selected, messages: [...selected.messages, msg], updated: 'Just now' }
    const updated = ticketList.map((t) => (t.id === selected.id ? updatedTicket : t))
    setTickets(updated)
    setSelected(updatedTicket)
    setReply('')
    toast({ title: 'Reply sent', description: 'Message added to the conversation.' })
  }

  if (loading) return <SupportSkeleton />

  if (error || !data) {
    return (
      <div className="cy-table-card">
        <EmptyState
          icon={<Headphones size={24} strokeWidth={1.75} />}
          title="Unable to load support"
          description={error ?? 'Could not fetch support queue.'}
          action={<Button variant="primary" onClick={() => window.location.reload()}>Retry</Button>}
        />
      </div>
    )
  }

  const chatList = chats.length ? chats : data.chats

  return (
    <div className="support-page cy-page">
      <PageHeader
        title="Support"
        subtitle="Manage tickets, live chats, and customer issues across all channels."
        crumbs={[{ label: 'Operations' }, { label: 'Support' }]}
      />

      <div className="support-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'tickets'}
          className={`support-tab ${tab === 'tickets' ? 'is-active' : ''}`}
          onClick={() => setTab('tickets')}
        >
          <Ticket size={16} strokeWidth={1.75} />
          Tickets
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'chat'}
          className={`support-tab ${tab === 'chat' ? 'is-active' : ''}`}
          onClick={() => setTab('chat')}
        >
          <MessageSquare size={16} strokeWidth={1.75} />
          Live Chat
          <span className="support-tab__badge">{chatList.filter((c) => c.status === 'Waiting').length}</span>
        </button>
      </div>

      {tab === 'tickets' ? (
        <>
          <div className="support-kpi-row" aria-label="Category overview">
            {data.kpis.map((kpi) => (
              <button
                key={kpi.category}
                type="button"
                className={`support-kpi ${kpiFilter === kpi.category ? 'is-active' : ''}`}
                onClick={() => {
                  setKpiFilter(kpiFilter === kpi.category ? null : kpi.category)
                  setPage(1)
                }}
              >
                <span className="support-kpi__label">{kpi.category}</span>
                <span className="support-kpi__count">{kpi.count}</span>
                <span className={`support-kpi__trend ${kpi.trend >= 0 ? 'up' : 'down'}`}>
                  {kpi.trend >= 0 ? '+' : ''}{kpi.trend}%
                </span>
              </button>
            ))}
          </div>

          <div className="cy-page__toolbar">
            <div className="cy-page__toolbar-left">
              <SearchInput
                value={search}
                onChange={(v) => { setSearch(v); setPage(1) }}
                placeholder="Search tickets, subjects, requesters…"
                className="support-search"
                aria-label="Search tickets"
              />
              <div className="cy-page__filters">
                <span className="cy-page__filters-label">
                  <Filter size={14} strokeWidth={1.75} aria-hidden /> Filters
                </span>
                <select className="cy-select" value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value as typeof categoryFilter); setKpiFilter(null); setPage(1) }} aria-label="Filter by category">
                  {ticketCategories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <select className="cy-select" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value as typeof statusFilter); setPage(1) }} aria-label="Filter by status">
                  {ticketStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <select className="cy-select" value={priorityFilter} onChange={(e) => { setPriorityFilter(e.target.value as typeof priorityFilter); setPage(1) }} aria-label="Filter by priority">
                  {ticketPriorities.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="cy-page__meta">
            <span>Showing <strong>{filtered.length}</strong> of {ticketList.length} tickets</span>
          </div>

          <div className="cy-table-card">
            {filtered.length === 0 ? (
              <EmptyState
                icon={<Headphones size={24} strokeWidth={1.75} />}
                title="No tickets found"
                description="Try adjusting filters or category chips."
                action={
                  <Button variant="secondary" onClick={() => { setSearch(''); setCategoryFilter('All Categories'); setStatusFilter('All Status'); setPriorityFilter('All Priority'); setKpiFilter(null); setPage(1) }}>
                    Clear filters
                  </Button>
                }
              />
            ) : (
              <>
                <div className="cy-table-wrap">
                  <table className="cy-table support-table">
                    <thead>
                      <tr>
                        <th>Ticket</th>
                        <th>Category</th>
                        <th>Requester</th>
                        <th>Priority</th>
                        <th>Status</th>
                        <th>Agent</th>
                        <th>Channel</th>
                        <th>Updated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paged.items.map((ticket) => (
                        <tr
                          key={ticket.id}
                          className="cy-table__row"
                          onClick={() => openTicket(ticket)}
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              openTicket(ticket)
                            }
                          }}
                        >
                          <td>
                            <div className="cy-table__primary">{ticket.subject}</div>
                            <div className="cy-table__secondary">{ticket.id}</div>
                          </td>
                          <td><span className={`support-cat support-cat--${ticket.category.toLowerCase().replace(/\s+/g, '-')}`}>{ticket.category}</span></td>
                          <td>
                            <div className="cy-table__primary">{ticket.requester}</div>
                            <div className="cy-table__secondary">{ticket.requesterEmail}</div>
                          </td>
                          <td><StatusPill status={ticket.priority} tone={ticket.priority as TicketPriority} /></td>
                          <td><StatusPill status={ticket.status} tone={ticket.status as TicketStatus} /></td>
                          <td>{ticket.agent ?? <span className="support-unassigned">Unassigned</span>}</td>
                          <td>
                            <span className={`support-channel support-channel--${ticket.channel.toLowerCase().replace(/\s+/g, '-')}`}>
                              {ticket.channel === 'Live Chat' ? <MessageSquare size={12} strokeWidth={1.75} /> : <Ticket size={12} strokeWidth={1.75} />}
                              {ticket.channel}
                            </span>
                          </td>
                          <td className="cy-table__secondary">{ticket.updated}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination page={paged.page} totalPages={paged.totalPages} total={paged.total} pageSize={PAGE_SIZE} onPageChange={setPage} />
              </>
            )}
          </div>
        </>
      ) : (
        <div className="support-chat-layout">
          <div className="support-chat-list">
            {chatList.map((chat) => (
              <button
                key={chat.id}
                type="button"
                className={`support-chat-item ${activeChat?.id === chat.id ? 'is-active' : ''}`}
                onClick={() => setActiveChat(chat)}
              >
                <div className="support-chat-item__top">
                  <strong>{chat.customer}</strong>
                  <StatusPill status={chat.status} tone={chat.status} />
                </div>
                <p className="support-chat-item__preview">{chat.preview}</p>
                <span className="support-chat-item__meta">
                  {chat.status === 'Waiting' ? `Wait: ${chat.waitTime}` : chat.agent ?? '—'}
                </span>
              </button>
            ))}
          </div>
          <div className="support-chat-panel">
            {activeChat ? (
              <>
                <header className="support-chat-panel__header">
                  <div>
                    <h3>{activeChat.customer}</h3>
                    <span>{activeChat.id}</span>
                  </div>
                  {activeChat.status === 'Waiting' ? (
                    <Button variant="primary" size="sm" onClick={() => toast({ title: 'Chat accepted', description: `You joined ${activeChat.customer}'s chat.` })}>
                      Accept Chat
                    </Button>
                  ) : null}
                </header>
                <div className="support-thread">
                  {activeChat.messages.map((msg) => (
                    <div key={msg.id} className={`support-msg support-msg--${msg.role}`}>
                      <div className="support-msg__bubble">
                        <span className="support-msg__sender">{msg.sender}</span>
                        <p>{msg.body}</p>
                        <time>{msg.time}</time>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <EmptyState
                icon={<MessageSquare size={24} strokeWidth={1.75} />}
                title="Select a chat"
                description="Choose a live chat session from the list to view the conversation."
              />
            )}
          </div>
        </div>
      )}

      <SidePanel open={panelOpen} title={selected?.subject ?? 'Ticket'} onClose={() => setPanelOpen(false)} width={560}>
        {selected ? (
          <div className="support-detail">
            <div className="support-detail__meta">
              <StatusPill status={selected.status} tone={selected.status} />
              <StatusPill status={selected.priority} tone={selected.priority} />
              <span className="support-detail__id">{selected.id}</span>
            </div>

            <div className="support-detail__info">
              <div><strong>Requester:</strong> {selected.requester}</div>
              <div><strong>Category:</strong> {selected.category}</div>
              <div><strong>Channel:</strong> {selected.channel}</div>
              <div><strong>Created:</strong> {selected.created}</div>
            </div>

            <div className="support-detail__assign">
              <label>
                <UserPlus size={14} strokeWidth={1.75} aria-hidden />
                Assign agent
              </label>
              <div className="support-detail__assign-row">
                <select className="cy-select" value={assignAgent} onChange={(e) => setAssignAgent(e.target.value)} aria-label="Assign agent">
                  {supportAgents.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
                <Button variant="secondary" size="sm" onClick={handleAssign}>Assign</Button>
              </div>
            </div>

            <div className="support-thread support-thread--panel">
              {selected.messages.map((msg) => (
                <div key={msg.id} className={`support-msg support-msg--${msg.role}`}>
                  <div className="support-msg__bubble">
                    <span className="support-msg__sender">{msg.sender}</span>
                    <p>{msg.body}</p>
                    <time>{msg.time}</time>
                  </div>
                </div>
              ))}
            </div>

            {selected.status !== 'Closed' ? (
              <div className="support-reply">
                <textarea
                  rows={2}
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Type a reply…"
                  aria-label="Reply message"
                />
                <div className="support-reply__actions">
                  <Button variant="primary" size="sm" onClick={handleReply}>
                    <Send size={14} strokeWidth={1.75} />
                    Send
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => setCloseConfirm(true)}>
                    <XCircle size={14} strokeWidth={1.75} />
                    Close Ticket
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </SidePanel>

      <ConfirmDialog
        open={closeConfirm}
        title="Close ticket?"
        description={selected ? `This will mark ${selected.id} as closed. The customer will be notified.` : ''}
        confirmLabel="Close Ticket"
        tone="danger"
        onConfirm={handleClose}
        onClose={() => setCloseConfirm(false)}
      />
    </div>
  )
}
