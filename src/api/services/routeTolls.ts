import { api } from '../client'

export interface RouteTollRecord {
  id: string
  origin_geohash: string
  destination_geohash: string
  origin_name: string
  destination_name: string
  vehicle_category?: string | null
  vehicle_category_slug?: string
  category_name?: string
  toll_amount: string
  currency: string
  has_tolls: boolean
  toll_details: any[]
  source: 'google_routes' | 'manual_override' | 'mappls' | 'fallback'
  is_active: boolean
  expires_at: string
  created_at: string
  updated_at: string
}

export interface RouteTollEstimateResult {
  toll_amount: string
  currency: string
  has_tolls: boolean
  source: string
  cached: boolean
  origin_geohash: string
  destination_geohash: string
}

export async function listRouteTolls(): Promise<RouteTollRecord[]> {
  const res = await api.get('/route-tolls/')
  return res.data?.results ?? res.data ?? []
}

export async function estimateRouteToll(payload: {
  pickup_lat: number
  pickup_lng: number
  drop_lat: number
  drop_lng: number
  vehicle_category_id?: string
}): Promise<RouteTollEstimateResult> {
  const res = await api.post('/route-tolls/estimate/', payload)
  return res.data
}

export async function flushRouteTollCache(): Promise<{ detail: string }> {
  const res = await api.post('/route-tolls/flush-cache/')
  return res.data
}
