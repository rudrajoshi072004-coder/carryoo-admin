export function formatINR(amount: number) {
  return `₹${amount.toLocaleString('en-IN')}`
}

export function formatINRCompact(amount: number) {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`
  return formatINR(amount)
}

export function slugStatus(status: string) {
  return status.toLowerCase().replace(/\s+/g, '-')
}

/** Keep phones, IDs, and dates as text so Excel does not turn them into 9.19E+11 or ######. */
export function excelText(value: string | number | null | undefined): string {
  const s = String(value ?? '').replace(/\u00a0/g, ' ').trim()
  if (!s || s === '—') return ''
  return `="${s.replace(/"/g, '""')}"`
}

export function exportCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const csv = `\uFEFF${[headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\r\n')}\r\n`
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function paginate<T>(items: T[], page: number, pageSize: number) {
  const total = items.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const start = (safePage - 1) * pageSize
  return {
    page: safePage,
    totalPages,
    total,
    items: items.slice(start, start + pageSize),
  }
}
