export type AdminRole = 'Super Admin' | 'Operations' | 'Finance' | 'Support' | 'Viewer'

export type AdminStatus = 'Active' | 'Inactive' | 'Suspended'

export type Permission =
  | 'dashboard.view'
  | 'drivers.manage'
  | 'orders.manage'
  | 'customers.manage'
  | 'payments.manage'
  | 'reports.generate'
  | 'notifications.send'
  | 'settings.edit'
  | 'admins.manage'
  | 'logs.view'

export interface AdminUser {
  id: string
  name: string
  email: string
  phone: string
  role: AdminRole
  status: AdminStatus
  lastLogin: string
  createdAt: string
  city: string
  permissions: Permission[]
}

export const adminRoles: AdminRole[] = [
  'Super Admin',
  'Operations',
  'Finance',
  'Support',
  'Viewer',
]

export const adminStatuses: (AdminStatus | 'All Status')[] = [
  'All Status',
  'Active',
  'Inactive',
  'Suspended',
]

export const allPermissions: Permission[] = [
  'dashboard.view',
  'drivers.manage',
  'orders.manage',
  'customers.manage',
  'payments.manage',
  'reports.generate',
  'notifications.send',
  'settings.edit',
  'admins.manage',
  'logs.view',
]

export const permissionLabels: Record<Permission, string> = {
  'dashboard.view': 'View dashboard',
  'drivers.manage': 'Manage drivers',
  'orders.manage': 'Manage orders',
  'customers.manage': 'Manage customers',
  'payments.manage': 'Manage payments',
  'reports.generate': 'Generate reports',
  'notifications.send': 'Send notifications',
  'settings.edit': 'Edit settings',
  'admins.manage': 'Manage admins',
  'logs.view': 'View system logs',
}

export const rolePermissions: Record<AdminRole, Permission[]> = {
  'Super Admin': allPermissions,
  Operations: [
    'dashboard.view',
    'drivers.manage',
    'orders.manage',
    'customers.manage',
    'notifications.send',
    'logs.view',
  ],
  Finance: [
    'dashboard.view',
    'payments.manage',
    'reports.generate',
    'logs.view',
  ],
  Support: [
    'dashboard.view',
    'orders.manage',
    'customers.manage',
    'notifications.send',
    'logs.view',
  ],
  Viewer: ['dashboard.view', 'logs.view'],
}

export const adminUsers: AdminUser[] = [
  {
    id: 'ADM-001',
    name: 'Priya Sharma',
    email: 'priya.sharma@carryoo.in',
    phone: '+91 98765 43210',
    role: 'Super Admin',
    status: 'Active',
    lastLogin: '14 Jul 2026, 07:42 AM',
    createdAt: '15 Jan 2024',
    city: 'Mumbai',
    permissions: rolePermissions['Super Admin'],
  },
  {
    id: 'ADM-002',
    name: 'Rohan Kapoor',
    email: 'rohan.kapoor@carryoo.in',
    phone: '+91 98123 45678',
    role: 'Operations',
    status: 'Active',
    lastLogin: '14 Jul 2026, 09:15 AM',
    createdAt: '3 Mar 2024',
    city: 'Delhi NCR',
    permissions: rolePermissions.Operations,
  },
  {
    id: 'ADM-003',
    name: 'Meera Iyer',
    email: 'meera.iyer@carryoo.in',
    phone: '+91 97654 32109',
    role: 'Finance',
    status: 'Active',
    lastLogin: '13 Jul 2026, 06:30 PM',
    createdAt: '10 Apr 2024',
    city: 'Bangalore',
    permissions: rolePermissions.Finance,
  },
  {
    id: 'ADM-004',
    name: 'Arjun Desai',
    email: 'arjun.desai@carryoo.in',
    phone: '+91 96543 21098',
    role: 'Support',
    status: 'Active',
    lastLogin: '14 Jul 2026, 08:55 AM',
    createdAt: '22 May 2024',
    city: 'Pune',
    permissions: rolePermissions.Support,
  },
  {
    id: 'ADM-005',
    name: 'Kavita Menon',
    email: 'kavita.menon@carryoo.in',
    phone: '+91 95432 10987',
    role: 'Operations',
    status: 'Active',
    lastLogin: '12 Jul 2026, 04:20 PM',
    createdAt: '8 Jul 2024',
    city: 'Hyderabad',
    permissions: rolePermissions.Operations,
  },
  {
    id: 'ADM-006',
    name: 'Vikram Singh',
    email: 'vikram.singh@carryoo.in',
    phone: '+91 94321 09876',
    role: 'Finance',
    status: 'Inactive',
    lastLogin: '28 Jun 2026, 11:00 AM',
    createdAt: '14 Sep 2024',
    city: 'Chennai',
    permissions: rolePermissions.Finance,
  },
  {
    id: 'ADM-007',
    name: 'Ananya Reddy',
    email: 'ananya.reddy@carryoo.in',
    phone: '+91 93210 98765',
    role: 'Support',
    status: 'Active',
    lastLogin: '13 Jul 2026, 02:45 PM',
    createdAt: '1 Nov 2024',
    city: 'Hyderabad',
    permissions: rolePermissions.Support,
  },
  {
    id: 'ADM-008',
    name: 'Rajesh Kumar',
    email: 'rajesh.kumar@carryoo.in',
    phone: '+91 92109 87654',
    role: 'Viewer',
    status: 'Active',
    lastLogin: '11 Jul 2026, 09:30 AM',
    createdAt: '5 Dec 2024',
    city: 'Kolkata',
    permissions: rolePermissions.Viewer,
  },
  {
    id: 'ADM-009',
    name: 'Sneha Patel',
    email: 'sneha.patel@carryoo.in',
    phone: '+91 91098 76543',
    role: 'Operations',
    status: 'Suspended',
    lastLogin: '5 Jul 2026, 03:00 PM',
    createdAt: '18 Feb 2025',
    city: 'Ahmedabad',
    permissions: rolePermissions.Operations,
  },
  {
    id: 'ADM-010',
    name: 'Deepak Nair',
    email: 'deepak.nair@carryoo.in',
    phone: '+91 90987 65432',
    role: 'Viewer',
    status: 'Inactive',
    lastLogin: '20 Jun 2026, 10:15 AM',
    createdAt: '30 Mar 2025',
    city: 'Kochi',
    permissions: rolePermissions.Viewer,
  },
]
