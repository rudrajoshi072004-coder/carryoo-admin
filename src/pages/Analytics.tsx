import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  BarChart3,
  TrendingUp,
  Users,
  Route,
  CircleX,
} from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { Card, CardHeader, CardBody, Button, EmptyState, Skeleton } from '../components/ui'
import { useAsyncData } from '../hooks/useAsyncData'
import { formatINR } from '../lib/utils'
import { fetchAnalyticsAdmin } from '../api/services/adminData'
import './Analytics.css'

const chartTooltipStyle = {
  background: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: 12,
  fontSize: 12,
  boxShadow: '0 4px 16px rgba(15, 23, 42, 0.06)',
}

const axisTick = { fill: '#94a3b8', fontSize: 11 }

async function fetchAnalytics() {
  return fetchAnalyticsAdmin()
}

function heatColor(trips: number) {
  if (trips >= 90) return '#1d4ed8'
  if (trips >= 70) return '#2563eb'
  if (trips >= 50) return '#3b82f6'
  if (trips >= 30) return '#93c5fd'
  return '#dbeafe'
}

function AnalyticsSkeleton() {
  return (
    <div className="analytics-page cy-page" aria-busy="true">
      <div className="analytics-summary">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} variant="card" style={{ height: 88 }} />
        ))}
      </div>
      <div className="analytics-charts">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="cy-card" style={{ padding: 20 }}>
            <Skeleton variant="title" style={{ marginBottom: 16 }} />
            <Skeleton variant="chart" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Analytics() {
  const { data, loading, error } = useAsyncData(fetchAnalytics, [])

  if (loading) return <AnalyticsSkeleton />

  if (error || !data) {
    return (
      <Card>
        <EmptyState
          icon={<BarChart3 size={24} strokeWidth={1.75} />}
          title="Unable to load analytics"
          description={error ?? 'Could not fetch analytics data.'}
          action={<Button variant="primary" onClick={() => window.location.reload()}>Retry</Button>}
        />
      </Card>
    )
  }

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const hours = [6, 8, 10, 12, 14, 16, 18, 20, 22, 0, 2]

  return (
    <div className="analytics-page cy-page">
      <PageHeader
        title="Analytics"
        subtitle="Deep-dive into revenue, fleet performance, and operational trends."
        crumbs={[{ label: 'Insights' }, { label: 'Analytics' }]}
      />

      <section className="analytics-summary" aria-label="Summary metrics">
        <div className="analytics-stat">
          <TrendingUp size={18} strokeWidth={1.75} />
          <div>
            <span className="analytics-stat__label">Revenue (Jul)</span>
            <strong>₹{data.summary.totalRevenue}L</strong>
            <span className="analytics-stat__delta up">+{data.summary.revenueGrowth}%</span>
          </div>
        </div>
        <div className="analytics-stat">
          <Route size={18} strokeWidth={1.75} />
          <div>
            <span className="analytics-stat__label">Total trips</span>
            <strong>{data.summary.totalTrips.toLocaleString('en-IN')}</strong>
            <span className="analytics-stat__delta up">+{data.summary.tripsGrowth}%</span>
          </div>
        </div>
        <div className="analytics-stat">
          <Users size={18} strokeWidth={1.75} />
          <div>
            <span className="analytics-stat__label">Active drivers</span>
            <strong>{data.summary.activeDrivers}</strong>
            <span className="analytics-stat__delta up">+{data.summary.driverGrowth}%</span>
          </div>
        </div>
        <div className="analytics-stat">
          <CircleX size={18} strokeWidth={1.75} />
          <div>
            <span className="analytics-stat__label">Cancellation rate</span>
            <strong>{data.summary.cancellationRate}%</strong>
            <span className="analytics-stat__delta down">{data.summary.cancellationChange}%</span>
          </div>
        </div>
      </section>

      <h2 className="analytics-section-title">Performance Overview</h2>
      <section className="analytics-charts" aria-label="Performance charts">
        <Card className="analytics-chart-card">
          <CardHeader title="Revenue Trend" subtitle="Monthly GMV (₹ lakhs) and trip volume" />
          <CardBody className="analytics-chart-body">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={data.revenueSeries}>
                <defs>
                  <linearGradient id="analyticsRevFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="month" tick={axisTick} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" tick={axisTick} axisLine={false} tickLine={false} width={40} />
                <YAxis yAxisId="right" orientation="right" tick={axisTick} axisLine={false} tickLine={false} width={48} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12, color: '#64748b' }} iconType="circle" iconSize={8} />
                <Area yAxisId="left" type="monotone" dataKey="revenue" name="Revenue (₹L)" stroke="#2563eb" strokeWidth={2} fill="url(#analyticsRevFill)" animationDuration={900} />
                <Line yAxisId="right" type="monotone" dataKey="trips" name="Trips" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 3, fill: '#0ea5e9', strokeWidth: 0 }} animationDuration={900} />
              </AreaChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        <Card className="analytics-chart-card">
          <CardHeader title="Driver Performance" subtitle="Weekly completed vs cancelled trips" />
          <CardBody className="analytics-chart-body">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.driverPerformance} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="week" tick={axisTick} axisLine={false} tickLine={false} />
                <YAxis tick={axisTick} axisLine={false} tickLine={false} width={44} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12, color: '#64748b' }} iconType="circle" iconSize={8} />
                <Bar dataKey="completed" name="Completed" fill="#2563eb" radius={[6, 6, 0, 0]} maxBarSize={28} animationDuration={900} />
                <Bar dataKey="cancelled" name="Cancelled" fill="#fca5a5" radius={[6, 6, 0, 0]} maxBarSize={28} animationDuration={900} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        <Card className="analytics-chart-card">
          <CardHeader title="Customer Growth" subtitle="New vs active customers by month" />
          <CardBody className="analytics-chart-body">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={data.customerGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="month" tick={axisTick} axisLine={false} tickLine={false} />
                <YAxis tick={axisTick} axisLine={false} tickLine={false} width={48} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12, color: '#64748b' }} iconType="circle" iconSize={8} />
                <Line type="monotone" dataKey="newCustomers" name="New" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 3, strokeWidth: 0 }} animationDuration={900} />
                <Line type="monotone" dataKey="activeCustomers" name="Active" stroke="#2563eb" strokeWidth={2} dot={{ r: 3, strokeWidth: 0 }} animationDuration={900} />
              </LineChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        <Card className="analytics-chart-card">
          <CardHeader title="Peak Hours" subtitle="Average trips by hour of day" />
          <CardBody className="analytics-chart-body">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.peakHours}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="hour" tick={axisTick} axisLine={false} tickLine={false} />
                <YAxis tick={axisTick} axisLine={false} tickLine={false} width={40} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Bar dataKey="trips" name="Trips" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={36} animationDuration={900} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </section>

      <h2 className="analytics-section-title">City & Vehicle Analytics</h2>
      <section className="analytics-charts" aria-label="City and vehicle charts">
        <Card className="analytics-chart-card">
          <CardHeader title="City Analytics" subtitle="Trips and revenue by city (₹L)" />
          <CardBody className="analytics-chart-body">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.cityAnalytics} layout="vertical" barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis type="number" tick={axisTick} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="city" tick={axisTick} axisLine={false} tickLine={false} width={80} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12, color: '#64748b' }} iconType="circle" iconSize={8} />
                <Bar dataKey="trips" name="Trips" fill="#2563eb" radius={[0, 6, 6, 0]} animationDuration={900} />
                <Bar dataKey="revenue" name="Revenue (₹L)" fill="#93c5fd" radius={[0, 6, 6, 0]} animationDuration={900} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        <Card className="analytics-chart-card">
          <CardHeader title="Vehicle Analytics" subtitle="Trip distribution by vehicle type" />
          <CardBody className="analytics-chart-body analytics-chart-body--pie">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={data.vehicleAnalytics}
                  dataKey="trips"
                  nameKey="vehicle"
                  cx="42%"
                  cy="50%"
                  innerRadius={58}
                  outerRadius={88}
                  paddingAngle={2}
                  strokeWidth={0}
                  animationDuration={900}
                >
                  {data.vehicleAnalytics.map((entry) => (
                    <Cell key={entry.vehicle} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={chartTooltipStyle} formatter={(v) => [Number(v).toLocaleString('en-IN'), 'Trips']} />
                <Legend layout="vertical" align="right" verticalAlign="middle" iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: '#64748b' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </section>

      <h2 className="analytics-section-title">Demand Heatmap</h2>
      <Card className="analytics-heatmap-card">
        <CardHeader title="Hourly Trip Grid" subtitle="Trips by day and hour — darker cells indicate higher demand" />
        <CardBody>
          <div className="analytics-heatmap" role="img" aria-label="Hourly trip heatmap grid">
            <div className="analytics-heatmap__corner" />
            {hours.map((h) => (
              <div key={h} className="analytics-heatmap__hour">{h === 0 ? '12a' : h < 12 ? `${h}a` : h === 12 ? '12p' : `${h - 12}p`}</div>
            ))}
            {days.map((day) => (
              <div key={day} className="analytics-heatmap__row">
                <div className="analytics-heatmap__day">{day}</div>
                {hours.map((hour) => {
                  const cell = data.heatmapGrid.find((c) => c.day === day && c.hour === hour)
                  const trips = cell?.trips ?? 0
                  return (
                    <div
                      key={`${day}-${hour}`}
                      className="analytics-heatmap__cell"
                      style={{ background: heatColor(trips) }}
                      title={`${day} ${hour}:00 — ${trips} trips`}
                    />
                  )
                })}
              </div>
            ))}
          </div>
          <div className="analytics-heatmap__legend">
            <span>Low</span>
            <div className="analytics-heatmap__scale">
              <span style={{ background: '#dbeafe' }} />
              <span style={{ background: '#93c5fd' }} />
              <span style={{ background: '#3b82f6' }} />
              <span style={{ background: '#2563eb' }} />
              <span style={{ background: '#1d4ed8' }} />
            </div>
            <span>High</span>
          </div>
        </CardBody>
      </Card>

      <h2 className="analytics-section-title">Routes & Cancellations</h2>
      <section className="analytics-tables" aria-label="Routes and cancellation analysis">
        <Card>
          <CardHeader title="Top Routes" subtitle="Highest volume corridors this month" />
          <div className="analytics-table-wrap">
            <table className="cy-table">
              <thead>
                <tr>
                  <th>Route</th>
                  <th>City</th>
                  <th>Trips</th>
                  <th>Avg fare</th>
                  <th>Distance</th>
                </tr>
              </thead>
              <tbody>
                {data.topRoutes.map((route) => (
                  <tr key={route.id}>
                    <td>
                      <div className="cy-table__primary">{route.from} → {route.to}</div>
                      <div className="cy-table__secondary">{route.id}</div>
                    </td>
                    <td>{route.city}</td>
                    <td className="cy-table__mono">{route.trips.toLocaleString('en-IN')}</td>
                    <td className="cy-table__mono">{formatINR(route.avgFare)}</td>
                    <td>{route.avgDistance}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <CardHeader title="Cancellation Analysis" subtitle="Breakdown by reason" />
          <CardBody className="analytics-cancel-body">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={data.cancellationAnalysis}
                  dataKey="count"
                  nameKey="reason"
                  cx="50%"
                  cy="50%"
                  outerRadius={72}
                  strokeWidth={0}
                  animationDuration={900}
                >
                  {data.cancellationAnalysis.map((entry) => (
                    <Cell key={entry.reason} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={chartTooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <ul className="analytics-cancel-list">
              {data.cancellationAnalysis.map((item) => (
                <li key={item.reason}>
                  <span className="analytics-cancel-list__dot" style={{ background: item.fill }} />
                  <span className="analytics-cancel-list__reason">{item.reason}</span>
                  <span className="analytics-cancel-list__count">{item.count}</span>
                  <span className="analytics-cancel-list__share">{item.share}%</span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </section>
    </div>
  )
}
