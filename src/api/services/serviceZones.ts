import { api, unwrapList } from '../client'
import type {
  DirectionKey,
  DirectionalSectionConfig,
  ServiceZone,
  ServiceZoneInput,
  ZoneAvailabilityResponse,
} from '../types'

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

export async function fetchZoneDriverAvailability(zoneId: string): Promise<ZoneAvailabilityResponse> {
  const { data } = await api.get<ZoneAvailabilityResponse>(`/service-zones/${zoneId}/driver-availability/`)
  return data
}

export async function fetchZoneAvailabilityOverview(
  city?: string,
): Promise<{ count: number; zones: ZoneAvailabilityResponse[] }> {
  const params = city ? { city } : {}
  const { data } = await api.get<{ count: number; zones: ZoneAvailabilityResponse[] }>(
    '/service-zones/availability-overview/',
    { params },
  )
  return data
}

export async function configureDirectionalSections(
  zoneId: string,
  sections: Record<DirectionKey, DirectionalSectionConfig>,
): Promise<{
  message: string
  directional_sections: Record<DirectionKey, DirectionalSectionConfig>
  availability: ZoneAvailabilityResponse
}> {
  const { data } = await api.post(`/service-zones/${zoneId}/configure-sections/`, {
    directional_sections: sections,
  })
  return data
}

