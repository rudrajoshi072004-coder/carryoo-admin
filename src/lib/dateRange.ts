export type DatePreset = 'today' | 'weekly' | 'monthly' | 'yearly' | 'custom'

export type DateRange = {
  preset: DatePreset
  from: Date
  to: Date
}

export const DATE_PRESETS: Array<{ id: Exclude<DatePreset, 'custom'>; label: string }> = [
  { id: 'today', label: 'Today' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'yearly', label: 'Yearly' },
]

export function startOfDay(date: Date): Date {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

export function endOfDay(date: Date): Date {
  const next = new Date(date)
  next.setHours(23, 59, 59, 999)
  return next
}

export function toInputDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function fromInputDate(value: string, end = false): Date {
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, (month || 1) - 1, day || 1)
  return end ? endOfDay(date) : startOfDay(date)
}

export function rangeForPreset(preset: Exclude<DatePreset, 'custom'>, now = new Date()): DateRange {
  const today = startOfDay(now)
  if (preset === 'today') {
    return { preset, from: today, to: endOfDay(now) }
  }
  if (preset === 'weekly') {
    const from = startOfDay(now)
    const weekday = from.getDay()
    from.setDate(from.getDate() - (weekday === 0 ? 6 : weekday - 1))
    return { preset, from, to: endOfDay(now) }
  }
  if (preset === 'monthly') {
    return { preset, from: startOfDay(new Date(now.getFullYear(), now.getMonth(), 1)), to: endOfDay(now) }
  }
  return { preset, from: startOfDay(new Date(now.getFullYear(), 0, 1)), to: endOfDay(now) }
}

export function customRange(fromValue: string, toValue: string): DateRange {
  let from = fromInputDate(fromValue)
  let to = fromInputDate(toValue, true)
  if (from.getTime() > to.getTime()) {
    const swappedFrom = startOfDay(to)
    const swappedTo = endOfDay(from)
    from = swappedFrom
    to = swappedTo
  }
  return { preset: 'custom', from, to }
}

export function isInRange(iso: string | undefined, range: DateRange): boolean {
  if (!iso) return false
  const time = new Date(iso).getTime()
  if (!Number.isFinite(time)) return false
  return time >= range.from.getTime() && time <= range.to.getTime()
}

export function previousComparableRange(range: DateRange): { from: Date; to: Date } {
  const now = new Date()
  if (range.preset === 'today') {
    const yesterday = new Date(startOfDay(now))
    yesterday.setDate(yesterday.getDate() - 1)
    return { from: startOfDay(yesterday), to: endOfDay(yesterday) }
  }
  if (range.preset === 'weekly') {
    const from = new Date(range.from)
    from.setDate(from.getDate() - 7)
    const to = new Date(range.from)
    to.setMilliseconds(-1)
    return { from: startOfDay(from), to }
  }
  if (range.preset === 'monthly') {
    const from = new Date(range.from.getFullYear(), range.from.getMonth() - 1, 1)
    const to = new Date(range.to)
    to.setMonth(to.getMonth() - 1)
    return { from: startOfDay(from), to: endOfDay(to) }
  }
  if (range.preset === 'yearly') {
    const from = new Date(range.from.getFullYear() - 1, 0, 1)
    const to = new Date(range.to)
    to.setFullYear(to.getFullYear() - 1)
    return { from: startOfDay(from), to: endOfDay(to) }
  }
  const duration = range.to.getTime() - range.from.getTime()
  const to = new Date(range.from.getTime() - 1)
  const from = new Date(to.getTime() - duration)
  return { from, to }
}

export function percentChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

export function formatRangeLabel(range: DateRange, locale = 'en-IN'): string {
  const sameDay =
    range.from.getFullYear() === range.to.getFullYear() &&
    range.from.getMonth() === range.to.getMonth() &&
    range.from.getDate() === range.to.getDate()

  if (range.preset === 'today' || sameDay) {
    return new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(range.from)
  }

  if (range.preset === 'monthly') {
    return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(range.from)
  }

  if (range.preset === 'yearly') {
    return String(range.from.getFullYear())
  }

  const fromLabel = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: range.from.getFullYear() === range.to.getFullYear() ? undefined : 'numeric',
  }).format(range.from)
  const toLabel = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(range.to)
  return `${fromLabel} – ${toLabel}`
}

export function sparklineBuckets<T>(
  items: T[],
  range: DateRange,
  getTime: (item: T) => number,
  getValue: (item: T) => number = () => 1,
  bucketCount = 7,
): number[] {
  const buckets = Array.from({ length: bucketCount }, () => 0)
  const start = range.from.getTime()
  const span = Math.max(1, range.to.getTime() - start)
  for (const item of items) {
    const time = getTime(item)
    if (!Number.isFinite(time)) continue
    let index = Math.floor(((time - start) / span) * bucketCount)
    if (index < 0) index = 0
    if (index >= bucketCount) index = bucketCount - 1
    buckets[index] += getValue(item)
  }
  return buckets
}
