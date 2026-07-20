export type ReportType =
  | 'Revenue'
  | 'Drivers'
  | 'Customers'
  | 'Trips'
  | 'Wallet'
  | 'Taxes'
  | 'Commission'

export type ReportFormat = 'PDF' | 'Excel' | 'CSV'

export type ReportStatus = 'Ready' | 'Processing' | 'Failed'

export interface ReportTypeMeta {
  type: ReportType
  description: string
  lastGenerated: string
  formats: ReportFormat[]
  icon: string
}

export interface GeneratedReport {
  id: string
  type: ReportType
  format: ReportFormat
  dateRange: string
  generatedAt: string
  generatedBy: string
  size: string
  status: ReportStatus
  records: number
}

export const reportTypes: ReportTypeMeta[] = [
  {
    type: 'Revenue',
    description: 'Daily and monthly revenue breakdown by city, vehicle type, and payment mode.',
    lastGenerated: '14 Jul 2026, 09:15 AM',
    formats: ['PDF', 'Excel', 'CSV'],
    icon: 'revenue',
  },
  {
    type: 'Drivers',
    description: 'Driver onboarding, active hours, ratings, and incentive earnings.',
    lastGenerated: '13 Jul 2026, 06:30 PM',
    formats: ['PDF', 'Excel', 'CSV'],
    icon: 'drivers',
  },
  {
    type: 'Customers',
    description: 'Customer acquisition, retention, wallet usage, and order frequency.',
    lastGenerated: '12 Jul 2026, 11:00 AM',
    formats: ['PDF', 'Excel', 'CSV'],
    icon: 'customers',
  },
  {
    type: 'Trips',
    description: 'Completed, cancelled, and in-progress trips with route and fare details.',
    lastGenerated: '14 Jul 2026, 08:00 AM',
    formats: ['PDF', 'Excel', 'CSV'],
    icon: 'trips',
  },
  {
    type: 'Wallet',
    description: 'Wallet top-ups, withdrawals, refunds, and pending settlements.',
    lastGenerated: '11 Jul 2026, 04:45 PM',
    formats: ['PDF', 'Excel', 'CSV'],
    icon: 'wallet',
  },
  {
    type: 'Taxes',
    description: 'GST collections, TDS deductions, and tax liability by state.',
    lastGenerated: '10 Jul 2026, 02:00 PM',
    formats: ['PDF', 'Excel'],
    icon: 'taxes',
  },
  {
    type: 'Commission',
    description: 'Platform commission, driver payouts, and partner revenue share.',
    lastGenerated: '09 Jul 2026, 10:30 AM',
    formats: ['PDF', 'Excel', 'CSV'],
    icon: 'commission',
  },
]

export const reportFormats: ReportFormat[] = ['PDF', 'Excel', 'CSV']

export const dateRangePresets = [
  'Today',
  'Yesterday',
  'Last 7 days',
  'Last 30 days',
  'This month',
  'Last month',
  'Custom range',
]

export const recentReports: GeneratedReport[] = [
  {
    id: 'RPT-20260714-001',
    type: 'Revenue',
    format: 'Excel',
    dateRange: '1 Jul – 14 Jul 2026',
    generatedAt: '14 Jul 2026, 09:15 AM',
    generatedBy: 'Priya Sharma',
    size: '2.4 MB',
    status: 'Ready',
    records: 1842,
  },
  {
    id: 'RPT-20260714-002',
    type: 'Trips',
    format: 'CSV',
    dateRange: '8 Jul – 14 Jul 2026',
    generatedAt: '14 Jul 2026, 08:00 AM',
    generatedBy: 'Rohan Kapoor',
    size: '5.1 MB',
    status: 'Ready',
    records: 9234,
  },
  {
    id: 'RPT-20260713-003',
    type: 'Drivers',
    format: 'PDF',
    dateRange: '1 Jul – 13 Jul 2026',
    generatedAt: '13 Jul 2026, 06:30 PM',
    generatedBy: 'Meera Iyer',
    size: '890 KB',
    status: 'Ready',
    records: 412,
  },
  {
    id: 'RPT-20260713-004',
    type: 'Wallet',
    format: 'Excel',
    dateRange: '1 Jul – 13 Jul 2026',
    generatedAt: '13 Jul 2026, 03:20 PM',
    generatedBy: 'Arjun Desai',
    size: '1.8 MB',
    status: 'Ready',
    records: 3567,
  },
  {
    id: 'RPT-20260712-005',
    type: 'Customers',
    format: 'CSV',
    dateRange: 'Jun 2026',
    generatedAt: '12 Jul 2026, 11:00 AM',
    generatedBy: 'Kavita Menon',
    size: '3.2 MB',
    status: 'Ready',
    records: 6789,
  },
  {
    id: 'RPT-20260711-006',
    type: 'Taxes',
    format: 'PDF',
    dateRange: 'Q2 2026',
    generatedAt: '11 Jul 2026, 02:00 PM',
    generatedBy: 'Priya Sharma',
    size: '1.1 MB',
    status: 'Ready',
    records: 156,
  },
  {
    id: 'RPT-20260710-007',
    type: 'Commission',
    format: 'Excel',
    dateRange: 'Jul 2026 (partial)',
    generatedAt: '10 Jul 2026, 10:30 AM',
    generatedBy: 'Rohan Kapoor',
    size: '760 KB',
    status: 'Ready',
    records: 892,
  },
  {
    id: 'RPT-20260709-008',
    type: 'Revenue',
    format: 'PDF',
    dateRange: 'Jun 2026',
    generatedAt: '09 Jul 2026, 05:45 PM',
    generatedBy: 'Meera Iyer',
    size: '—',
    status: 'Failed',
    records: 0,
  },
  {
    id: 'RPT-20260709-009',
    type: 'Trips',
    format: 'Excel',
    dateRange: '1 Jul – 9 Jul 2026',
    generatedAt: '09 Jul 2026, 04:10 PM',
    generatedBy: 'Arjun Desai',
    size: '—',
    status: 'Processing',
    records: 0,
  },
  {
    id: 'RPT-20260708-010',
    type: 'Drivers',
    format: 'CSV',
    dateRange: 'Mumbai – Jun 2026',
    generatedAt: '08 Jul 2026, 09:00 AM',
    generatedBy: 'Kavita Menon',
    size: '420 KB',
    status: 'Ready',
    records: 187,
  },
]
