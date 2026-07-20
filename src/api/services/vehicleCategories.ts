import { api, unwrapList } from '../client'
import type { VehicleCategory, VehicleCategoryInput } from '../types'

export async function listVehicleCategories(): Promise<VehicleCategory[]> {
  const { data } = await api.get('/vehicle-categories/')
  return unwrapList<VehicleCategory>(data)
}

export async function getVehicleCategory(id: string): Promise<VehicleCategory> {
  const { data } = await api.get<VehicleCategory>(`/vehicle-categories/${id}/`)
  return data
}

export async function createVehicleCategory(input: VehicleCategoryInput): Promise<VehicleCategory> {
  const { data } = await api.post<VehicleCategory>('/vehicle-categories/', input)
  return data
}

export async function updateVehicleCategory(
  id: string,
  input: Partial<VehicleCategoryInput>,
): Promise<VehicleCategory> {
  const { data } = await api.patch<VehicleCategory>(`/vehicle-categories/${id}/`, input)
  return data
}

export async function deleteVehicleCategory(id: string): Promise<void> {
  await api.delete(`/vehicle-categories/${id}/`)
}
