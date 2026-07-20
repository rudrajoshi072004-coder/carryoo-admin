export interface RevenuePoint {
  month: string
  revenue: number
  trips: number
}

export interface DriverPerformancePoint {
  week: string
  completed: number
  cancelled: number
  avgRating: number
}

export interface CustomerGrowthPoint {
  month: string
  newCustomers: number
  activeCustomers: number
}

export interface PeakHourPoint {
  hour: string
  trips: number
}

export interface CityAnalytic {
  city: string
  trips: number
  revenue: number
  drivers: number
  fill: string
}

export interface VehicleAnalytic {
  vehicle: string
  trips: number
  share: number
  fill: string
}

export interface TopRoute {
  id: string
  from: string
  to: string
  trips: number
  avgFare: number
  avgDistance: string
  city: string
}

export interface CancellationReason {
  reason: string
  count: number
  share: number
  fill: string
}

export interface HeatmapCell {
  day: string
  hour: number
  trips: number
}

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export const revenueSeries: RevenuePoint[] = [
  { month: 'Jan', revenue: 42.5, trips: 18200 },
  { month: 'Feb', revenue: 45.1, trips: 19400 },
  { month: 'Mar', revenue: 48.8, trips: 21100 },
  { month: 'Apr', revenue: 46.2, trips: 19800 },
  { month: 'May', revenue: 52.4, trips: 22400 },
  { month: 'Jun', revenue: 55.9, trips: 24100 },
  { month: 'Jul', revenue: 58.3, trips: 25200 },
]

export const driverPerformance: DriverPerformancePoint[] = [
  { week: 'W1', completed: 8420, cancelled: 210, avgRating: 4.6 },
  { week: 'W2', completed: 8910, cancelled: 198, avgRating: 4.62 },
  { week: 'W3', completed: 9180, cancelled: 185, avgRating: 4.65 },
  { week: 'W4', completed: 9340, cancelled: 172, avgRating: 4.68 },
  { week: 'W5', completed: 9620, cancelled: 160, avgRating: 4.7 },
  { week: 'W6', completed: 9880, cancelled: 148, avgRating: 4.72 },
]

export const customerGrowth: CustomerGrowthPoint[] = [
  { month: 'Jan', newCustomers: 4200, activeCustomers: 28400 },
  { month: 'Feb', newCustomers: 4580, activeCustomers: 30100 },
  { month: 'Mar', newCustomers: 5120, activeCustomers: 32800 },
  { month: 'Apr', newCustomers: 4890, activeCustomers: 34200 },
  { month: 'May', newCustomers: 5340, activeCustomers: 36800 },
  { month: 'Jun', newCustomers: 5680, activeCustomers: 39400 },
  { month: 'Jul', newCustomers: 5920, activeCustomers: 42100 },
]

export const peakHours: PeakHourPoint[] = [
  { hour: '6a', trips: 420 },
  { hour: '8a', trips: 1280 },
  { hour: '10a', trips: 980 },
  { hour: '12p', trips: 1120 },
  { hour: '2p', trips: 890 },
  { hour: '4p', trips: 1040 },
  { hour: '6p', trips: 1680 },
  { hour: '8p', trips: 1420 },
  { hour: '10p', trips: 620 },
]

export const cityAnalytics: CityAnalytic[] = [
  { city: 'Mumbai', trips: 28400, revenue: 18.2, drivers: 1240, fill: '#2563eb' },
  { city: 'Delhi', trips: 24100, revenue: 15.8, drivers: 1080, fill: '#0ea5e9' },
  { city: 'Bengaluru', trips: 21800, revenue: 14.1, drivers: 960, fill: '#3b82f6' },
  { city: 'Hyderabad', trips: 16200, revenue: 10.4, drivers: 720, fill: '#60a5fa' },
  { city: 'Pune', trips: 12800, revenue: 8.2, drivers: 580, fill: '#93c5fd' },
  { city: 'Chennai', trips: 11400, revenue: 7.6, drivers: 510, fill: '#bfdbfe' },
]

export const vehicleAnalytics: VehicleAnalytic[] = [
  { vehicle: 'Bike', trips: 48200, share: 42, fill: '#2563eb' },
  { vehicle: 'Auto', trips: 28400, share: 25, fill: '#0ea5e9' },
  { vehicle: 'Pickup', trips: 16800, share: 15, fill: '#3b82f6' },
  { vehicle: 'Mini Truck', trips: 12400, share: 11, fill: '#60a5fa' },
  { vehicle: 'Tempo', trips: 8200, share: 7, fill: '#93c5fd' },
]

export const topRoutes: TopRoute[] = [
  { id: 'R-101', from: 'Andheri West', to: 'BKC', trips: 1842, avgFare: 285, avgDistance: '8.4 km', city: 'Mumbai' },
  { id: 'R-102', from: 'Connaught Place', to: 'Cyber Hub', trips: 1568, avgFare: 420, avgDistance: '28 km', city: 'Delhi' },
  { id: 'R-103', from: 'Koramangala', to: 'Whitefield', trips: 1420, avgFare: 310, avgDistance: '14.2 km', city: 'Bengaluru' },
  { id: 'R-104', from: 'Hitech City', to: 'Gachibowli', trips: 1298, avgFare: 195, avgDistance: '6.8 km', city: 'Hyderabad' },
  { id: 'R-105', from: 'Hinjewadi', to: 'Pune Station', trips: 1184, avgFare: 340, avgDistance: '18 km', city: 'Pune' },
  { id: 'R-106', from: 'T Nagar', to: 'OMR', trips: 1092, avgFare: 265, avgDistance: '12 km', city: 'Chennai' },
]

export const cancellationAnalysis: CancellationReason[] = [
  { reason: 'Driver unavailable', count: 842, share: 32, fill: '#ef4444' },
  { reason: 'Customer no-show', count: 518, share: 20, fill: '#f59e0b' },
  { reason: 'Long wait time', count: 412, share: 16, fill: '#3b82f6' },
  { reason: 'Wrong address', count: 328, share: 12, fill: '#8b5cf6' },
  { reason: 'Price dispute', count: 284, share: 11, fill: '#06b6d4' },
  { reason: 'Other', count: 236, share: 9, fill: '#94a3b8' },
]

function buildHeatmap(): HeatmapCell[] {
  const cells: HeatmapCell[] = []
  const basePattern = [
    [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22],
    [30, 55, 70, 85, 90, 95, 100, 88, 75, 50, 25],
    [25, 45, 60, 75, 80, 85, 92, 80, 68, 42, 20],
    [28, 48, 65, 78, 82, 88, 94, 82, 70, 45, 22],
    [32, 52, 68, 82, 88, 92, 98, 86, 72, 48, 26],
    [20, 38, 55, 68, 72, 78, 85, 72, 58, 35, 18],
    [15, 30, 42, 55, 58, 62, 68, 58, 45, 28, 12],
  ]
  days.forEach((day, di) => {
    basePattern[di].forEach((intensity, hi) => {
      const hour = [6, 8, 10, 12, 14, 16, 18, 20, 22, 0, 2][hi]
      cells.push({ day, hour, trips: Math.round(intensity * (di === 4 ? 1.1 : di >= 5 ? 0.85 : 1)) })
    })
  })
  return cells
}

export const heatmapGrid = buildHeatmap()

export const analyticsSummary = {
  totalRevenue: 58.3,
  revenueGrowth: 12.4,
  totalTrips: 25200,
  tripsGrowth: 8.6,
  activeDrivers: 428,
  driverGrowth: 5.2,
  cancellationRate: 2.1,
  cancellationChange: -0.4,
}
