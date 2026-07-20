import { api, unwrapList } from '../client'
import type { Booking } from '../types'

export async function listBookings(params?: Record<string, string | number>): Promise<Booking[]> {
  const { data } = await api.get('/bookings/', { params })
  return unwrapList<Booking>(data)
}

export async function getBooking(id: string): Promise<Booking> {
  const { data } = await api.get<Booking>(`/bookings/${id}/`)
  return data
}
