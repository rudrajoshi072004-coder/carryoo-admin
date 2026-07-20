import { api, unwrapList } from '../client'
import type { DashboardSummary, Payout, ServiceZone, SupportTicket } from '../types'

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const { data } = await api.get<DashboardSummary>('/admin/ops/dashboard-summary/')
  return data
}

export async function listServiceZones(): Promise<ServiceZone[]> {
  const { data } = await api.get('/service-zones/')
  return unwrapList<ServiceZone>(data)
}

export async function listSupportTickets(): Promise<SupportTicket[]> {
  const { data } = await api.get('/support-tickets/')
  return unwrapList<SupportTicket>(data)
}

export async function listPayouts(): Promise<Payout[]> {
  const { data } = await api.get('/payouts/')
  return unwrapList<Payout>(data)
}

export async function updatePayoutStatus(id: string, status: string) {
  const { data } = await api.post(`/payouts/${id}/update-status/`, { status })
  return data
}
