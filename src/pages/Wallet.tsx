import { useMemo, useState } from 'react'
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Gift,
  Users,
  Banknote,
  TrendingUp,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import KpiCard from '../components/KpiCard'
import { PageHeader, Pagination } from '../components/PageHeader'
import { SidePanel } from '../components/ConfirmDialog'
import { useToast } from '../components/Toast'
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  Skeleton,
  StatusPill,
} from '../components/ui'
import { useAsyncData } from '../hooks/useAsyncData'
import { formatINR, formatINRCompact, paginate } from '../lib/utils'
import { fetchWallet, type WalletHistoryEntry } from '../data/walletData'
import './Wallet.css'

const PAGE_SIZE = 8

const chartTooltipStyle = {
  background: 'var(--cy-surface)',
  border: '1px solid var(--cy-border)',
  borderRadius: 12,
  fontSize: 12,
  boxShadow: 'var(--cy-shadow-md)',
}

const axisTick = { fill: 'var(--cy-text-muted)', fontSize: 11 }

function WalletSkeleton() {
  return (
    <div className="wallet cy-page" aria-busy="true">
      <Skeleton variant="title" style={{ width: 200, marginBottom: 8 }} />
      <Skeleton variant="text" style={{ width: 360, marginBottom: 20 }} />
      <div className="cy-skeleton-grid cy-skeleton-grid--kpis">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} variant="card" />
        ))}
      </div>
      <div className="wallet__charts-skeleton">
        <Skeleton variant="card" />
        <Skeleton variant="card" />
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

export default function WalletPage() {
  const { data, loading, error } = useAsyncData(fetchWallet, [])
  const { toast } = useToast()
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<WalletHistoryEntry | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)

  const paged = useMemo(() => {
    if (!data) return { page: 1, totalPages: 1, total: 0, items: [] as WalletHistoryEntry[] }
    return paginate(data.history, page, PAGE_SIZE)
  }, [data, page])

  const openEntry = (entry: WalletHistoryEntry) => {
    setSelected(entry)
    setPanelOpen(true)
  }

  if (loading) return <WalletSkeleton />

  if (error || !data) {
    return (
      <Card>
        <EmptyState
          icon={<Wallet size={24} strokeWidth={1.75} />}
          title="Unable to load wallet"
          description={error ?? 'Could not fetch wallet data.'}
          action={
            <Button variant="primary" onClick={() => window.location.reload()}>
              Retry
            </Button>
          }
        />
      </Card>
    )
  }

  const { summary, flowSeries, balanceSeries } = data

  return (
    <div className="wallet cy-page">
      <PageHeader
        title="Wallet"
        subtitle={`Platform wallet balance ${formatINRCompact(summary.balance)} · Credits, debits & payouts`}
        crumbs={[
          { label: 'Dashboard', to: '/' },
          { label: 'Finance' },
          { label: 'Wallet' },
        ]}
      />

      <section className="wallet__kpis" aria-label="Wallet summary">
        <KpiCard
          title="Total Credits"
          value={formatINRCompact(summary.credits)}
          growth={9.4}
          icon={ArrowDownLeft}
          sparkline={[380, 395, 410, 420, 430, 440, 448]}
          accent="var(--cy-success)"
        />
        <KpiCard
          title="Total Debits"
          value={formatINRCompact(summary.debits)}
          growth={5.1}
          icon={ArrowUpRight}
          sparkline={[220, 228, 235, 240, 248, 255, 262]}
          accent="var(--cy-danger)"
        />
        <KpiCard
          title="Bonuses"
          value={formatINRCompact(summary.bonus)}
          growth={12.8}
          icon={Gift}
          sparkline={[14, 15, 16, 17, 17.5, 18, 18.6]}
          accent="var(--cy-warning)"
        />
        <KpiCard
          title="Referral Earnings"
          value={formatINRCompact(summary.referral)}
          growth={6.6}
          icon={Users}
          sparkline={[8.2, 8.6, 8.9, 9.1, 9.3, 9.4, 9.42]}
          accent="var(--cy-info)"
        />
        <KpiCard
          title="Withdrawals"
          value={formatINRCompact(summary.withdrawals)}
          growth={-2.4}
          icon={Banknote}
          sparkline={[150, 148, 146, 145, 144, 144, 144]}
          accent="#475569"
        />
      </section>

      <section className="wallet__charts" aria-label="Wallet charts">
        <Card className="wallet-chart-card">
          <CardHeader title="Wallet Flow" subtitle="Daily credits vs debits (₹ thousands)" />
          <CardBody className="wallet-chart-body">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={flowSeries} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--cy-border)" vertical={false} />
                <XAxis dataKey="day" tick={axisTick} axisLine={false} tickLine={false} />
                <YAxis tick={axisTick} axisLine={false} tickLine={false} width={40} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12, color: 'var(--cy-text-secondary)' }} iconType="circle" iconSize={8} />
                <Bar dataKey="credits" name="Credits" fill="var(--cy-primary)" radius={[6, 6, 0, 0]} maxBarSize={28} />
                <Bar dataKey="debits" name="Debits" fill="#93c5fd" radius={[6, 6, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        <Card className="wallet-chart-card">
          <CardHeader title="Balance Trend" subtitle="Platform wallet balance (₹ lakhs)" />
          <CardBody className="wallet-chart-body">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={balanceSeries}>
                <defs>
                  <linearGradient id="walletBalFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--cy-primary)" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="var(--cy-primary)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--cy-border)" vertical={false} />
                <XAxis dataKey="day" tick={axisTick} axisLine={false} tickLine={false} />
                <YAxis tick={axisTick} axisLine={false} tickLine={false} width={36} domain={['dataMin - 0.2', 'dataMax + 0.2']} />
                <Tooltip
                  contentStyle={chartTooltipStyle}
                  formatter={(value) => [`₹${Number(value).toFixed(2)}L`, 'Balance']}
                />
                <Area
                  type="monotone"
                  dataKey="balance"
                  stroke="var(--cy-primary)"
                  strokeWidth={2}
                  fill="url(#walletBalFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </section>

      <Card>
        <CardHeader
          title="Wallet History"
          subtitle="Recent credits, debits, and payouts"
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                toast({ title: 'Statement requested', description: 'PDF will be emailed shortly', tone: 'info' })
              }
            >
              <TrendingUp size={14} strokeWidth={1.75} />
              Get Statement
            </Button>
          }
        />
        {data.history.length === 0 ? (
          <EmptyState
            icon={<Wallet size={24} strokeWidth={1.75} />}
            title="No wallet activity"
            description="Wallet transactions will appear here."
          />
        ) : (
          <>
            <div className="cy-table-wrap">
              <table className="cy-table wallet-table">
                <thead>
                  <tr>
                    <th>Entry ID</th>
                    <th>Type</th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Balance</th>
                    <th>Status</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.items.map((entry) => (
                    <tr
                      key={entry.id}
                      className="cy-table__row"
                      onClick={() => openEntry(entry)}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          openEntry(entry)
                        }
                      }}
                    >
                      <td className="cy-table__mono cy-table__link">{entry.id}</td>
                      <td>{entry.type}</td>
                      <td>
                        <div className="cy-table__primary">{entry.description}</div>
                        {entry.party ? <div className="cy-table__secondary">{entry.party}</div> : null}
                      </td>
                      <td className={`cy-table__mono wallet-amount ${entry.amount >= 0 ? 'wallet-amount--credit' : 'wallet-amount--debit'}`}>
                        {entry.amount >= 0 ? '+' : ''}{formatINR(Math.abs(entry.amount))}
                      </td>
                      <td className="cy-table__mono">{formatINR(entry.balance)}</td>
                      <td><StatusPill status={entry.status} /></td>
                      <td>
                        <div className="cy-table__primary">{entry.time}</div>
                        <div className="cy-table__secondary">{entry.date}</div>
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
      </Card>

      <SidePanel
        open={panelOpen}
        title={selected?.id ?? 'Wallet Entry'}
        onClose={() => setPanelOpen(false)}
      >
        {selected ? (
          <div className="wallet__panel">
            <dl className="wallet__panel-dl">
              <div><dt>Type</dt><dd>{selected.type}</dd></div>
              <div><dt>Status</dt><dd><StatusPill status={selected.status} /></dd></div>
              <div><dt>Amount</dt>
                <dd className={selected.amount >= 0 ? 'wallet-amount--credit' : 'wallet-amount--debit'}>
                  {selected.amount >= 0 ? '+' : ''}{formatINR(Math.abs(selected.amount))}
                </dd>
              </div>
              <div><dt>Balance After</dt><dd>{formatINR(selected.balance)}</dd></div>
              <div><dt>Party</dt><dd>{selected.party ?? '—'}</dd></div>
              <div><dt>Timestamp</dt><dd>{selected.date}, {selected.time}</dd></div>
            </dl>
            <p className="wallet__panel-desc">{selected.description}</p>
          </div>
        ) : null}
      </SidePanel>
    </div>
  )
}
