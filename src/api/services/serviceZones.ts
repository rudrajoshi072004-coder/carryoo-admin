import { api, unwrapList } from '../client'
import type { ServiceZone, ServiceZoneInput } from '../types'

export async function listServiceZones(): Promise<ServiceZone[]> {
  const { data } = await api.get('/service-zones/')
  return unwrapList<ServiceZone>(data)
}

export async function createServiceZone(input: ServiceZoneInput): Promise<ServiceZone> {
  const { data } = await api.post<ServiceZone>('/service-zones/', input)
  return data
}

export async function updateServiceZone(id: string, input: Partial<ServiceZoneInput>): Promise<ServiceZone> {
  const { data } = await api.patch<ServiceZone>(`/service-zones/${id}/`, input)
  return data
}

export async function deleteServiceZone(id: string): Promise<void> {
  await api.delete(`/service-zones/${id}/`)
}
