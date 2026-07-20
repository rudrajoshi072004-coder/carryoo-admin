export type NotificationChannel = 'Push' | 'SMS' | 'Email' | 'Announcement'

export type NotificationAudience = 'All' | 'City' | 'Driver' | 'Customer'

export type NotificationStatus = 'Sent' | 'Scheduled' | 'Draft' | 'Failed'

export interface NotificationTemplate {
  id: string
  name: string
  channel: NotificationChannel
  audience: NotificationAudience
  subject: string
  body: string
  lastUsed: string
}

export interface NotificationHistory {
  id: string
  channel: NotificationChannel
  audience: NotificationAudience
  audienceDetail: string
  title: string
  message: string
  sentAt: string
  sentBy: string
  recipients: number
  status: NotificationStatus
  openRate?: string
}

export const notificationChannels: (NotificationChannel | 'All Channels')[] = [
  'All Channels',
  'Push',
  'SMS',
  'Email',
  'Announcement',
]

export const notificationAudiences: (NotificationAudience | 'All Audiences')[] = [
  'All Audiences',
  'All',
  'City',
  'Driver',
  'Customer',
]

export const notificationStatuses: (NotificationStatus | 'All Status')[] = [
  'All Status',
  'Sent',
  'Scheduled',
  'Draft',
  'Failed',
]

export const notificationTemplates: NotificationTemplate[] = [
  {
    id: 'TPL-001',
    name: 'Peak hour surge alert',
    channel: 'Push',
    audience: 'Driver',
    subject: 'Surge active in your zone',
    body: 'High demand near {{location}}. Complete trips now to earn up to {{bonus}}% extra.',
    lastUsed: '14 Jul 2026',
  },
  {
    id: 'TPL-002',
    name: 'Order delivered confirmation',
    channel: 'SMS',
    audience: 'Customer',
    subject: 'Delivery complete',
    body: 'Your Carryoo order {{orderId}} has been delivered. Rate your experience in the app.',
    lastUsed: '14 Jul 2026',
  },
  {
    id: 'TPL-003',
    name: 'Wallet low balance',
    channel: 'Push',
    audience: 'Customer',
    subject: 'Recharge your wallet',
    body: 'Your wallet balance is below ₹100. Top up now for seamless deliveries.',
    lastUsed: '13 Jul 2026',
  },
  {
    id: 'TPL-004',
    name: 'Document expiry reminder',
    channel: 'Email',
    audience: 'Driver',
    subject: 'Action required: Document expiring soon',
    body: 'Your {{documentType}} expires on {{expiryDate}}. Upload a renewed copy to stay active.',
    lastUsed: '12 Jul 2026',
  },
  {
    id: 'TPL-005',
    name: 'City-wide maintenance notice',
    channel: 'Announcement',
    audience: 'All',
    subject: 'Scheduled maintenance',
    body: 'Carryoo services in {{city}} will be unavailable from {{startTime}} to {{endTime}} for system upgrades.',
    lastUsed: '10 Jul 2026',
  },
  {
    id: 'TPL-006',
    name: 'Monsoon safety advisory',
    channel: 'Push',
    audience: 'City',
    subject: 'Drive safely this monsoon',
    body: 'Heavy rains expected in {{city}}. Enable rain mode and reduce speed on wet roads.',
    lastUsed: '08 Jul 2026',
  },
]

export const notificationHistory: NotificationHistory[] = [
  {
    id: 'NTF-20260714-001',
    channel: 'Push',
    audience: 'Driver',
    audienceDetail: 'Active drivers – Mumbai',
    title: 'Evening surge – Bandra & Andheri',
    message: 'Earn 1.5× fare in Bandra West and Andheri East until 10 PM.',
    sentAt: '14 Jul 2026, 05:30 PM',
    sentBy: 'Priya Sharma',
    recipients: 842,
    status: 'Sent',
    openRate: '68%',
  },
  {
    id: 'NTF-20260714-002',
    channel: 'SMS',
    audience: 'Customer',
    audienceDetail: 'Customers with pending orders',
    title: 'Order delay update',
    message: 'Your delivery is delayed by 15 mins due to rain. Track live in the Carryoo app.',
    sentAt: '14 Jul 2026, 04:15 PM',
    sentBy: 'System',
    recipients: 127,
    status: 'Sent',
  },
  {
    id: 'NTF-20260714-003',
    channel: 'Email',
    audience: 'Driver',
    audienceDetail: 'Drivers – document expiring in 7 days',
    title: 'Insurance renewal reminder',
    message: 'Your vehicle insurance expires on 21 Jul 2026. Upload renewed policy to avoid suspension.',
    sentAt: '14 Jul 2026, 10:00 AM',
    sentBy: 'Meera Iyer',
    recipients: 34,
    status: 'Sent',
    openRate: '52%',
  },
  {
    id: 'NTF-20260713-004',
    channel: 'Announcement',
    audience: 'All',
    audienceDetail: 'All users – Pan India',
    title: 'New feature: Scheduled deliveries',
    message: 'You can now schedule deliveries up to 7 days in advance. Try it in the Carryoo app today!',
    sentAt: '13 Jul 2026, 09:00 AM',
    sentBy: 'Rohan Kapoor',
    recipients: 45200,
    status: 'Sent',
    openRate: '41%',
  },
  {
    id: 'NTF-20260713-005',
    channel: 'Push',
    audience: 'City',
    audienceDetail: 'Bangalore',
    title: 'Metro strike – expect delays',
    message: 'Metro services suspended today. Allow extra time for intra-city deliveries.',
    sentAt: '13 Jul 2026, 07:45 AM',
    sentBy: 'Arjun Desai',
    recipients: 12800,
    status: 'Sent',
    openRate: '73%',
  },
  {
    id: 'NTF-20260712-006',
    channel: 'SMS',
    audience: 'Customer',
    audienceDetail: 'Inactive customers – 30 days',
    title: 'We miss you!',
    message: 'Get ₹50 off your next Carryoo order. Use code WELCOME50. Valid till 20 Jul.',
    sentAt: '12 Jul 2026, 06:00 PM',
    sentBy: 'Kavita Menon',
    recipients: 3420,
    status: 'Sent',
  },
  {
    id: 'NTF-20260712-007',
    channel: 'Push',
    audience: 'Driver',
    audienceDetail: 'New drivers – onboarding incomplete',
    title: 'Complete your profile',
    message: 'Upload your RC and driving licence to start accepting trips in Delhi NCR.',
    sentAt: '12 Jul 2026, 11:30 AM',
    sentBy: 'System',
    recipients: 89,
    status: 'Sent',
    openRate: '45%',
  },
  {
    id: 'NTF-20260711-008',
    channel: 'Email',
    audience: 'Customer',
    audienceDetail: 'Enterprise accounts',
    title: 'Monthly invoice – June 2026',
    message: 'Your Carryoo business invoice for June is ready. Total: ₹2,45,600. View in dashboard.',
    sentAt: '11 Jul 2026, 08:00 AM',
    sentBy: 'System',
    recipients: 156,
    status: 'Sent',
    openRate: '88%',
  },
  {
    id: 'NTF-20260710-009',
    channel: 'Announcement',
    audience: 'City',
    audienceDetail: 'Hyderabad',
    title: 'Festival offer – Bonalu week',
    message: 'Zero platform fee on all deliveries in Hyderabad from 12–16 Jul. Happy Bonalu!',
    sentAt: '10 Jul 2026, 05:00 PM',
    sentBy: 'Priya Sharma',
    recipients: 8900,
    status: 'Scheduled',
  },
  {
    id: 'NTF-20260709-010',
    channel: 'SMS',
    audience: 'Driver',
    audienceDetail: 'Drivers – low wallet balance',
    title: 'Wallet recharge needed',
    message: 'Your driver wallet balance is below ₹200. Recharge to continue accepting cash orders.',
    sentAt: '09 Jul 2026, 03:20 PM',
    sentBy: 'System',
    recipients: 218,
    status: 'Failed',
  },
  {
    id: 'NTF-20260708-011',
    channel: 'Push',
    audience: 'Customer',
    audienceDetail: 'Chennai – rain alert',
    title: 'Rain surcharge waived',
    message: 'No rain surcharge today in Chennai. Order now with standard rates.',
    sentAt: '08 Jul 2026, 02:00 PM',
    sentBy: 'Rohan Kapoor',
    recipients: 5600,
    status: 'Sent',
    openRate: '62%',
  },
  {
    id: 'NTF-20260707-012',
    channel: 'Email',
    audience: 'All',
    audienceDetail: 'All admins',
    title: 'Q2 performance summary',
    message: 'Carryoo Q2 2026 report is available. Revenue up 23% YoY across 12 cities.',
    sentAt: '07 Jul 2026, 10:00 AM',
    sentBy: 'Meera Iyer',
    recipients: 12,
    status: 'Draft',
  },
]
