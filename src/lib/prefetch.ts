import { listBookings } from '../api/services/bookings'
import { listVehicleCategories } from '../api/services/vehicleCategories'
import { fetchDashboardSummary } from '../api/services/ops'
import {
  fetchActiveNowSummary,
  fetchCustomersAdmin,
  fetchDashboardPortalStats,
  fetchDriversAdmin,
  fetchLiveTrackingAdmin,
} from '../api/services/adminData'
import { fetchPortalDrivers } from '../api/services/portal'

const warmed = new Set<string>()

export function prefetchRoute(path: string) {
  if (warmed.has(path)) return
  warmed.add(path)

  const run = (fn: () => Promise<unknown>) => {
    void fn().catch(() => {
      warmed.delete(path)
    })
  }

  if (path === '/') {
    run(() => fetchDashboardSummary())
    run(() => fetchDashboardPortalStats())
    run(() => fetchActiveNowSummary())
    run(() => listBookings({ page_size: 200 }))
    run(() => listVehicleCategories())
    return
  }
  if (path === '/drivers') {
    run(() => fetchDriversAdmin())
    return
  }
  if (path === '/customers') {
    run(() => fetchCustomersAdmin())
    return
  }
  if (path === '/orders' || path === '/trips') {
    run(() => listBookings({ page_size: 200 }))
    return
  }
  if (path === '/live-tracking') {
    run(() => fetchLiveTrackingAdmin())
    return
  }
  if (path === '/vehicles' || path === '/pricing') {
    run(() => listVehicleCategories())
    return
  }
  if (path === '/documents') {
    run(() => fetchPortalDrivers())
  }
}
