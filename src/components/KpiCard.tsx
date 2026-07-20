import {
  Area,
  AreaChart,
  ResponsiveContainer,
} from 'recharts'
import type { LucideIcon } from 'lucide-react'

interface KpiCardProps {
  title: string
  value: string
  growth: number
  icon: LucideIcon
  sparkline: number[]
  accent?: string
}

export default function KpiCard({
  title,
  value,
  growth,
  icon: Icon,
  sparkline,
  accent = '#2563eb',
}: KpiCardProps) {
  const isPositive = growth >= 0
  const chartData = sparkline.map((v, i) => ({ i, v }))
  const gradientId = `kpi-${title.replace(/[^a-zA-Z0-9]/g, '')}`

  return (
    <article className="kpi-card cy-card cy-card--interactive">
      <div className="kpi-card__top">
        <div
          className="kpi-card__icon"
          style={{ background: `${accent}14`, color: accent }}
        >
          <Icon size={18} strokeWidth={1.75} />
        </div>
        <span
          className={`kpi-card__growth ${isPositive ? 'kpi-card__growth--up' : 'kpi-card__growth--down'}`}
        >
          {isPositive ? '+' : ''}
          {growth.toFixed(1)}%
        </span>
      </div>

      <div className="kpi-card__body">
        <p className="kpi-card__title">{title}</p>
        <p className="kpi-card__value">{value}</p>
      </div>

      <div className="kpi-card__chart" aria-hidden>
        <ResponsiveContainer width="100%" height={40}>
          <AreaChart data={chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={accent} stopOpacity={0.22} />
                <stop offset="100%" stopColor={accent} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="v"
              stroke={accent}
              strokeWidth={1.75}
              fill={`url(#${gradientId})`}
              animationDuration={900}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </article>
  )
}
