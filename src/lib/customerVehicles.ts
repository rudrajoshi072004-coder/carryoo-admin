/** Vehicle types shown in the customer app (home + select vehicle). */
export const CUSTOMER_APP_VEHICLE_SLUGS = ['2-wheeler', 'scooty', '3-wheeler', '4-wheeler'] as const

export type CustomerAppVehicleSlug = (typeof CUSTOMER_APP_VEHICLE_SLUGS)[number]

const CUSTOMER_APP_LABELS: Record<CustomerAppVehicleSlug, string> = {
  '2-wheeler': '2 Wheeler',
  scooty: 'Scooty',
  '3-wheeler': '3 Wheeler',
  '4-wheeler': 'Tata ACE',
}

export function customerVehicleSlug(name: string): string {
  return name.trim().toLowerCase()
}

export function isCustomerAppVehicle(name: string): boolean {
  return CUSTOMER_APP_VEHICLE_SLUGS.includes(customerVehicleSlug(name) as CustomerAppVehicleSlug)
}

export function customerVehicleLabel(name: string): string {
  const slug = customerVehicleSlug(name)
  return CUSTOMER_APP_LABELS[slug as CustomerAppVehicleSlug] ?? name
}

export function customerVehicleSortKey(name: string): number {
  const idx = CUSTOMER_APP_VEHICLE_SLUGS.indexOf(customerVehicleSlug(name) as CustomerAppVehicleSlug)
  return idx >= 0 ? idx : 999
}

export function usesTripTypePricing(name: string): boolean {
  const slug = customerVehicleSlug(name)
  return slug === '3-wheeler' || slug === '4-wheeler'
}

export function pickCustomerAppVehicles<T extends { id: string; name: string }>(items: T[]): T[] {
  const seen = new Set<string>()
  const matched: T[] = []
  for (const item of items) {
    const slug = customerVehicleSlug(item.name)
    if (!isCustomerAppVehicle(slug) || seen.has(slug)) continue
    seen.add(slug)
    matched.push(item)
  }
  return matched.sort((a, b) => customerVehicleSortKey(a.name) - customerVehicleSortKey(b.name))
}
