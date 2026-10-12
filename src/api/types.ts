export type ApiEnvelope<T> = {
  success: boolean
  message: string
  data: T
  errors: unknown
}

export type Paginated<T> = {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export type AuthUser = {
  id: string
  phone: string
  role: string
  name?: string
  city?: string
}

export type LoginResponse = {
  access: string
  refresh: string
  user: AuthUser
}

export type VehicleCategory = {
  id: string
  name: string
  icon?: string | null
  payload_type?: string | null
  max_weight_kg?: number | null
  max_volume_m3?: string | null
  base_fare: string
  per_km_rate: string
  waiting_per_min?: string | null
  minimum_fare?: string | null
  outstation_base_fare?: string | null
  outstation_per_km_rate?: string | null
  outstation_minimum_fare?: string | null
  helper_supported?: boolean
  intra_city_available?: boolean
  active: boolean
  priority_order?: number
  created_at?: string
  updated_at?: string
}

export type VehicleCategoryInput = {
  name: string
  base_fare: string
  per_km_rate: string
  minimum_fare?: string
  waiting_per_min?: string
  outstation_base_fare?: string
  outstation_per_km_rate?: string
  outstation_minimum_fare?: string
  max_weight_kg?: number
  active?: boolean
  helper_supported?: boolean
  intra_city_available?: boolean
  priority_order?: number
  icon?: string
  payload_type?: string
}

export type PricingRule = {
  id: string
  name: string
  city?: string | null
  vehicle_category?: string | null
  trip_type?: 'within_city' | 'outstation' | null
  min_distance_km?: string | null
  max_distance_km?: string | null
  base_fare?: string
  per_km_rate?: string
  minimum_fare?: string | null
  surge_multiplier?: string
  active?: boolean
  created_at?: string
}

export type PricingRuleInput = {
  name: string
  city?: string
  vehicle_category?: string
  trip_type?: 'within_city' | 'outstation'
  min_distance_km?: string | null
  max_distance_km?: string | null
  base_fare?: string
  per_km_rate?: string
  minimum_fare?: string | null
  surge_multiplier?: string
  active?: boolean
}

export type Booking = {
  id: string
  state: string
  booking_type: string
  pickup_address_text: string
  drop_address_text: string
  estimated_distance_km?: string
  estimated_fare?: string
  final_fare?: string
  estimated_duration_min?: number
  customer_phone?: string
  vehicle_category?: string
  driver?: string | null
  driver_summary?: { name?: string; phone?: string } | null
  created_at: string
  notes?: string
  pricing_breakdown?: Record<string, string>
  has_pickup_parcel_photo?: boolean
  has_drop_parcel_photo?: boolean
  pickup_photo_url?: string
  drop_photo_url?: string
}

export type ServiceZone = {
  id: string
  city_name: string
  zone_name: string
  active?: boolean
  service_radius_km?: string
  dispatch_radius_km?: string
}

export type ServiceZoneInput = {
  city_name: string
  zone_name: string
  active?: boolean
  service_radius_km?: string
  dispatch_radius_km?: string
  polygon_points?: number[][]
}

export type SupportTicket = {
  id: string
  subject?: string
  status?: string
  priority?: string
  created_at?: string
}

export type Payout = {
  id: string
  amount?: string
  status?: string
  created_at?: string
}

export type DashboardSummary = {
  total_bookings?: number
  active_bookings?: number
  total_drivers?: number
  total_customers?: number
  revenue_today?: string
  [key: string]: unknown
}
