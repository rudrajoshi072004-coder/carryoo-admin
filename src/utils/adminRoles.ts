export const ADMIN_ROLES = new Set([
  'super_admin',
  'city_manager',
  'support_agent',
  'finance_admin',
  'admin',
  'ops_admin',
])

export function isAdminRole(role?: string | null): boolean {
  return Boolean(role && ADMIN_ROLES.has(role))
}
