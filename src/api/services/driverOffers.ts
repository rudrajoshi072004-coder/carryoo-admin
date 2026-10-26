import { api, unwrapList } from '../client'
import type { DriverOffer, DriverOfferInput } from '../types'

export async function listDriverOffers(): Promise<DriverOffer[]> {
  const { data } = await api.get('/driver-offers/')
  return unwrapList<DriverOffer>(data)
}

export async function getDriverOffer(id: string): Promise<DriverOffer> {
  const { data } = await api.get<DriverOffer>(`/driver-offers/${id}/`)
  return data
}

export async function createDriverOffer(
  input: DriverOfferInput,
  file?: File | null,
): Promise<DriverOffer> {
  if (file) {
    const formData = new FormData()
    formData.append('file', file)
    for (const [key, val] of Object.entries(input)) {
      if (val === undefined || val === null) continue
      if (key === 'vehicle_categories' && Array.isArray(val)) {
        val.forEach((id) => formData.append('vehicle_categories', id))
      } else {
        formData.append(key, String(val))
      }
    }
    const { data } = await api.post<DriverOffer>('/driver-offers/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return data
  }
  const { data } = await api.post<DriverOffer>('/driver-offers/', input)
  return data
}

export async function updateDriverOffer(
  id: string,
  input: Partial<DriverOfferInput>,
  file?: File | null,
): Promise<DriverOffer> {
  if (file) {
    const formData = new FormData()
    formData.append('file', file)
    for (const [key, val] of Object.entries(input)) {
      if (val === undefined || val === null) continue
      if (key === 'vehicle_categories' && Array.isArray(val)) {
        val.forEach((catId) => formData.append('vehicle_categories', catId))
      } else {
        formData.append(key, String(val))
      }
    }
    const { data } = await api.patch<DriverOffer>(`/driver-offers/${id}/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return data
  }
  const { data } = await api.patch<DriverOffer>(`/driver-offers/${id}/`, input)
  return data
}

export async function deleteDriverOffer(id: string): Promise<void> {
  await api.delete(`/driver-offers/${id}/`)
}

export async function uploadOfferBanner(id: string, file: File): Promise<DriverOffer> {
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await api.post(`/driver-offers/${id}/upload-banner/`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  // Handle envelope if returned
  if (data && typeof data === 'object' && 'data' in data && data.data) {
    return data.data as DriverOffer
  }
  return data as DriverOffer
}
