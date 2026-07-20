import { useMemo, useState } from 'react'
import {
  Download,
  Filter,
  IndianRupee,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Percent,
  RotateCcw,
  CreditCard,
} from 'lucide-react'
import KpiCard from '../components/KpiCard'
import { PageHeader, Pagination } from '../components/PageHeader'
import { ConfirmDialog, SidePanel } from '../components/ConfirmDialog'
import { useToast } from '../components/Toast'
import {
  Button,
  Card,
  EmptyState,
  SearchInput,
  Skeleton,
  StatusPill,
} from '../components/ui'
import { useAsyncData } from '../hooks/useAsyncData'
import { exportCsv, formatINR, formatINRCompact, paginate } from '../lib/utils'
import {
  fetchPayments,
  paymentMethods,
  transactionStatuses,
  transactionTypes,
  type Transaction,
} from '../data/paymentsData'
import './Payments.css'

const PAGE_SIZE = 8

function PaymentsSkeleton() {
  return (
    <div className="payments cy-page" aria-busy="true">
      <Skeleton variant="title" style={{ width: 240, marginBottom: 8 }} />
      <Skeleton variant="text" style={{ width: 380, marginBottom: 20 }} />
      <div className="cy-skeleton-grid cy-skeleton-grid--kpis">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} variant="card" />
        ))}
      </div>
      <div className="cy-table-card" style={{ marginTop: 20 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="cy-skeleton--row">
            <Skeleton variant="text" style={{ width: '100%' }} />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Payments() {
  const { data, loading, error } = useAsyncData(fetchPayments, [])
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<(typeof transactionTypes)[number]>('All Types')
  const [statusFilter, setStatusFilter] = useState<(typeof transactionStatuses)[number]>('All Status')
  const [methodFilter, setMethodFilter] = useState<(typeof paymentMethods)[number]>('All Methods')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Transaction | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const filtered = useMemo(() => {
    if (!data) return []
    const q = search.trim().toLowerCase()
    return data.transactions.filter((txn) => {
      const matchesSearch =
        !q ||
        txn.id.toLowerCase().includes(q) ||
        txn.party.toLowerCase().includes(q) ||
        txn.type.toLowerCase().includes(q) ||
        (txn.reference?.toLowerCase().includes(q) ?? false)

      const matchesType = typeFilter === 'All Types' || txn.type === typeFilter
      const matchesStatus = statusFilter === 'All Status' || txn.status === statusFilter
      const matchesMethod = methodFilter === 'All Methods' || txn.method === methodFilter

      return matchesSearch && matchesType && matchesStatus && matchesMethod
    })
  }, [data, search, typeFilter, statusFilter, methodFilter])

  const paged = useMemo(
    () => paginate(filtered, page, PAGE_SIZE),
    [filtered, page],
  )

  const openTxn = (txn: Transaction) => {
    setSelected(txn)
    setPanelOpen(true)
  }

  const handleExport = () => {
    if (!data) return
    exportCsv(
      'carryoo-payments.csv',
      ['ID', 'Type', 'Party', 'Amount', 'Method', 'Status', 'Time', 'Date'],
      filtered.map((t) => [t.id, t.type, t.party, t.amount, t.method, t.status, t.time, t.date]),
    )
    toast({ title: 'Export complete', description: `${filtered.length} transactions exported`, tone: 'success' })
  }

  const clearFilters = () => {
    setSearch('')
    setTypeFilter('All Types')
    setStatusFilter('All Status')
    setMethodFilter('All Methods')
    setPage(1)
  }

  if (loading) return <PaymentsSkeleton />

  if (error || !data) {
    return (
      <Card>
        <EmptyState
          icon={<CreditCard size={24} strokeWidth={1.75} />}
          title="Unable to load payments"
          description={error ?? 'Could not fetch payment data.'}
          action={
            <Button variant="primary" onClick={() => window.location.reload()}>
              Retry
            </Button>
          }
        />
      </Card>
    )
  }

  const { summary } = data

  return (
    <div className="payments cy-page">
      <PageHeader
        title="Payments"
        subtitle="Revenue, settlements, payouts, and transaction ledger"
        crumbs={[
          { label: 'Dashboard', to: '/' },
          { label: 'Finance' },
          { label: 'Payments' },
        ]}
        actions={
          <Button variant="secondary" onClick={handleExport}>
            <Download size={16} strokeWidth={1.75} />
            Export
          </Button>
        }
      />

      <section className="payments__kpis" aria-label="Payment KPIs">
        <KpiCard
          title="Daily Revenue"
          value={formatINRCompact(summary.daily)}
          growth={8.7}
          icon={IndianRupee}
          sparkline={[62, 68, 71, 74, 78, 82, 85, 88]}
          accent="var(--cy-primary)"
        />
        <KpiCard
          title="Weekly Revenue"
          value={formatINRCompact(summary.weekly)}
          growth={6.2}
          icon={IndianRupee}
          sparkline={[520, 540, 558, 572, 590, 610, 628]}
          accent="var(--cy-info)"
        />
        <KpiCard
          title="Monthly Revenue"
          value={formatINRCompact(summary.monthly)}
          growth={11.4}
          icon={IndianRupee}
          sparkline={[720, 740, 780, 810, 840, 870, 894]}
          accent="#0ea5e9"
        />
        <KpiCard
          title="Driver Payouts"
          value={formatINRCompact(summary.driverPayouts)}
          growth={4.8}
          icon={Wallet}
          sparkline={[160, 168, 172, 176, 180, 182, 185]}
          accent="var(--cy-success)"
        />
        <KpiCard
          title="Pending Withdrawals"
          value={formatINRCompact(summary.pendingWithdrawals)}
          growth={-3.2}
          icon={ArrowUpRight}
          sparkline={[38, 36, 35, 34, 35, 34, 34]}
          accent="var(--cy-warning)"
        />
        <KpiCard
          title="Refunds"
          value={formatINRCompact(summary.refunds)}
          growth={-5.6}
          icon={RotateCcw}
          sparkline={[6.2, 5.8, 5.5, 5.2, 5.0, 4.9, 4.86]}
          accent="var(--cy-danger)"
        />
        <KpiCard
          title="Commissions"
          value={formatINRCompact(summary.commissions)}
          growth={7.1}
          icon={Percent}
          sparkline={[38, 40, 41, 42, 43, 44, 45]}
          accent="#475569"
        />
      </section>

      <div className="cy-page__toolbar">
        <div className="cy-page__toolbar-left">
          <SearchInput
            value={search}
            onChange={(v) => { setSearch(v); setPage(1) }}
            placeholder="Search transactions, parties, references…"
            className="payments-search"
            aria-label="Search transactions"
          />
          <div className="cy-page__filters">
            <span className="cy-page__filters-label">
              <Filter size={14} strokeWidth={1.75} aria-hidden /> Filters
            </span>
            <select
              className="cy-select"
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value as typeof typeFilter); setPage(1) }}
              aria-label="Filter by type"
            >
              {transactionTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <select
              className="cy-select"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as typeof statusFilter); setPage(1) }}
              aria-label="Filter by status"
            >
              {transactionStatuses.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <select
              className="cy-select"
              value={methodFilter}
              onChange={(e) => { setMethodFilter(e.target.value as typeof methodFilter); setPage(1) }}
              aria-label="Filter by method"
            >
              {paymentMethods.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="cy-page__meta">
        <span>
          Showing <strong>{filtered.length}</strong> of {data.transactions.length} transactions
        </span>
      </div>

      <div className="cy-table-card">
        {filtered.length === 0 ? (
          <EmptyState
            icon={<ArrowDownLeft size={24} strokeWidth={1.75} />}
            title="No transactions found"
            description="Adjust search or filters to find payment records."
            action={<Button variant="secondary" onClick={clearFilters}>Clear filters</Button>}
          />
        ) : (
          <>
            <div className="cy-table-wrap">
              <table className="cy-table payments-table">
                <thead>
                  <tr>
                    <th>Transaction ID</th>
                    <th>Type</th>
                    <th>Party</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Status</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.items.map((txn) => (
                    <tr
                      key={txn.id}
                      className="cy-table__row"
                      onClick={() => openTxn(txn)}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          openTxn(txn)
                        }
                      }}
                    >
                      <td className="cy-table__mono cy-table__link">{txn.id}</td>
                      <td>{txn.type}</td>
                      <td>
                        <div className="cy-table__primary">{txn.party}</div>
                        {txn.city ? <div className="cy-table__secondary">{txn.city}</div> : null}
                      </td>
                      <td className="cy-table__mono payments-amount">{formatINR(txn.amount)}</td>
                      <td>{txn.method}</td>
                      <td><StatusPill status={txn.status} /></td>
                      <td>
                        <div className="cy-table__primary">{txn.time}</div>
                        <div className="cy-table__secondary">{txn.date}</div>
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

      <SidePanel
        open={panelOpen}
        title={selected?.id ?? 'Transaction'}
        onClose={() => setPanelOpen(false)}
      >
        {selected ? (
          <div className="payments__panel">
            <dl className="payments__panel-dl">
              <div><dt>Type</dt><dd>{selected.type}</dd></div>
              <div><dt>Party</dt><dd>{selected.party}</dd></div>
              <div><dt>Amount</dt><dd className="payments-amount">{formatINR(selected.amount)}</dd></div>
              <div><dt>Method</dt><dd>{selected.method}</dd></div>
              <div><dt>Status</dt><dd><StatusPill status={selected.status} /></dd></div>
              <div><dt>Reference</dt><dd className="cy-table__mono">{selected.reference ?? '—'}</dd></div>
              <div><dt>City</dt><dd>{selected.city ?? '—'}</dd></div>
              <div><dt>Timestamp</dt><dd>{selected.date}, {selected.time}</dd></div>
            </dl>
            {selected.status === 'Pending' || selected.status === 'Processing' ? (
              <Button variant="primary" onClick={() => setConfirmOpen(true)}>
                Approve Transaction
              </Button>
            ) : null}
          </div>
        ) : null}
      </SidePanel>

      <ConfirmDialog
        open={confirmOpen}
        title="Approve transaction?"
        description={`Confirm approval of ${selected ? formatINR(selected.amount) : ''} for ${selected?.party ?? 'this party'}.`}
        confirmLabel="Approve"
        onConfirm={() =>
          toast({
            title: 'Transaction approved',
            description: `${selected?.id} marked as completed`,
            tone: 'success',
          })
        }
        onClose={() => setConfirmOpen(false)}
      />
    </div>
  )
}
