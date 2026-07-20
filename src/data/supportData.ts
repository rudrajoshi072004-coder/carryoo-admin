export type TicketCategory =
  | 'Complaint'
  | 'Refund'
  | 'Emergency'
  | 'Lost Item'
  | 'Driver Issue'
  | 'Customer Issue'

export type TicketPriority = 'Low' | 'Medium' | 'High' | 'Critical'
export type TicketStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed'
export type TicketChannel = 'Ticket' | 'Live Chat'

export interface TicketMessage {
  id: string
  sender: string
  role: 'customer' | 'agent' | 'system'
  body: string
  time: string
}

export interface SupportTicket {
  id: string
  subject: string
  category: TicketCategory
  requester: string
  requesterEmail: string
  priority: TicketPriority
  status: TicketStatus
  agent: string | null
  channel: TicketChannel
  updated: string
  created: string
  messages: TicketMessage[]
}

export interface LiveChatSession {
  id: string
  customer: string
  preview: string
  status: 'Waiting' | 'Active' | 'Ended'
  waitTime: string
  agent: string | null
  messages: TicketMessage[]
}

export const ticketCategories: (TicketCategory | 'All Categories')[] = [
  'All Categories',
  'Complaint',
  'Refund',
  'Emergency',
  'Lost Item',
  'Driver Issue',
  'Customer Issue',
]

export const ticketStatuses: (TicketStatus | 'All Status')[] = [
  'All Status',
  'Open',
  'In Progress',
  'Resolved',
  'Closed',
]

export const ticketPriorities: (TicketPriority | 'All Priority')[] = [
  'All Priority',
  'Low',
  'Medium',
  'High',
  'Critical',
]

export const supportAgents = [
  'Unassigned',
  'Priya Sharma',
  'Rohan Kapoor',
  'Meera Iyer',
  'Arjun Desai',
  'Kavita Menon',
]

export const categoryKpis = [
  { category: 'Complaint' as TicketCategory, count: 24, trend: -8 },
  { category: 'Refund' as TicketCategory, count: 18, trend: 4 },
  { category: 'Emergency' as TicketCategory, count: 6, trend: -12 },
  { category: 'Lost Item' as TicketCategory, count: 11, trend: 2 },
  { category: 'Driver Issue' as TicketCategory, count: 31, trend: 6 },
  { category: 'Customer Issue' as TicketCategory, count: 22, trend: -3 },
]

export const supportTickets: SupportTicket[] = [
  {
    id: 'TKT-8821',
    subject: 'Driver arrived 45 minutes late',
    category: 'Complaint',
    requester: 'Ananya Desai',
    requesterEmail: 'ananya.d@email.com',
    priority: 'High',
    status: 'Open',
    agent: null,
    channel: 'Ticket',
    updated: '12 min ago',
    created: 'Jul 14, 2026 · 6:42 PM',
    messages: [
      { id: 'm1', sender: 'Ananya Desai', role: 'customer', body: 'My driver was scheduled for 5:30 PM but arrived at 6:15 PM. I missed my train.', time: '6:42 PM' },
      { id: 'm2', sender: 'System', role: 'system', body: 'Ticket created and queued for assignment.', time: '6:42 PM' },
    ],
  },
  {
    id: 'TKT-8819',
    subject: 'Refund for cancelled delivery',
    category: 'Refund',
    requester: 'Rohit Malhotra',
    requesterEmail: 'rohit.m@email.com',
    priority: 'Medium',
    status: 'In Progress',
    agent: 'Priya Sharma',
    channel: 'Ticket',
    updated: '28 min ago',
    created: 'Jul 14, 2026 · 5:10 PM',
    messages: [
      { id: 'm1', sender: 'Rohit Malhotra', role: 'customer', body: 'Order ORD-92841 was cancelled after payment. Please initiate refund.', time: '5:10 PM' },
      { id: 'm2', sender: 'Priya Sharma', role: 'agent', body: 'Hi Rohit, I have verified the cancellation. Refund of ₹428 will be processed within 3–5 business days.', time: '5:45 PM' },
      { id: 'm3', sender: 'Rohit Malhotra', role: 'customer', body: 'Thank you. Please share the reference number.', time: '6:02 PM' },
    ],
  },
  {
    id: 'TKT-8815',
    subject: 'Accident reported on MG Road',
    category: 'Emergency',
    requester: 'Driver: Vikram Joshi',
    requesterEmail: 'vikram.joshi@carryoo.driver',
    priority: 'Critical',
    status: 'In Progress',
    agent: 'Arjun Desai',
    channel: 'Live Chat',
    updated: '5 min ago',
    created: 'Jul 14, 2026 · 7:05 PM',
    messages: [
      { id: 'm1', sender: 'Vikram Joshi', role: 'customer', body: 'Minor collision near MG Road junction. Customer is safe. Need assistance.', time: '7:05 PM' },
      { id: 'm2', sender: 'Arjun Desai', role: 'agent', body: 'Vikram, stay on the line. Dispatching roadside support. Are there any injuries?', time: '7:06 PM' },
      { id: 'm3', sender: 'Vikram Joshi', role: 'customer', body: 'No injuries. Vehicle has front bumper damage.', time: '7:07 PM' },
    ],
  },
  {
    id: 'TKT-8812',
    subject: 'Package left in vehicle',
    category: 'Lost Item',
    requester: 'Sneha Pillai',
    requesterEmail: 'sneha.p@email.com',
    priority: 'Medium',
    status: 'Open',
    agent: null,
    channel: 'Ticket',
    updated: '1 hr ago',
    created: 'Jul 14, 2026 · 4:20 PM',
    messages: [
      { id: 'm1', sender: 'Sneha Pillai', role: 'customer', body: 'I left a laptop bag in the auto after trip TRP-44102. Driver phone unreachable.', time: '4:20 PM' },
    ],
  },
  {
    id: 'TKT-8808',
    subject: 'Wallet payout delayed 5 days',
    category: 'Driver Issue',
    requester: 'Driver: Rajesh Verma',
    requesterEmail: 'rajesh.verma@carryoo.driver',
    priority: 'High',
    status: 'In Progress',
    agent: 'Meera Iyer',
    channel: 'Ticket',
    updated: '2 hr ago',
    created: 'Jul 14, 2026 · 2:00 PM',
    messages: [
      { id: 'm1', sender: 'Rajesh Verma', role: 'customer', body: 'Withdrawal WD-8821 of ₹4,200 is pending since Jul 9.', time: '2:00 PM' },
      { id: 'm2', sender: 'Meera Iyer', role: 'agent', body: 'Checking with finance team. Your KYC was re-verified yesterday.', time: '3:15 PM' },
    ],
  },
  {
    id: 'TKT-8804',
    subject: 'Incorrect fare charged',
    category: 'Customer Issue',
    requester: 'Karan Mehta',
    requesterEmail: 'karan.m@email.com',
    priority: 'Low',
    status: 'Resolved',
    agent: 'Rohan Kapoor',
    channel: 'Live Chat',
    updated: '3 hr ago',
    created: 'Jul 14, 2026 · 11:30 AM',
    messages: [
      { id: 'm1', sender: 'Karan Mehta', role: 'customer', body: 'Fare showed ₹180 but I was charged ₹240.', time: '11:30 AM' },
      { id: 'm2', sender: 'Rohan Kapoor', role: 'agent', body: 'Adjusted ₹60 credit to your wallet. Sorry for the inconvenience.', time: '11:45 AM' },
      { id: 'm3', sender: 'Karan Mehta', role: 'customer', body: 'Received the credit. Thanks!', time: '11:50 AM' },
    ],
  },
  {
    id: 'TKT-8799',
    subject: 'Driver behaviour complaint',
    category: 'Complaint',
    requester: 'Divya Nair',
    requesterEmail: 'divya.n@email.com',
    priority: 'High',
    status: 'Closed',
    agent: 'Kavita Menon',
    channel: 'Ticket',
    updated: 'Yesterday',
    created: 'Jul 13, 2026 · 8:15 PM',
    messages: [
      { id: 'm1', sender: 'Divya Nair', role: 'customer', body: 'Driver was rude and took an unnecessarily long route.', time: '8:15 PM' },
      { id: 'm2', sender: 'Kavita Menon', role: 'agent', body: 'We have flagged the driver and issued a warning. ₹50 goodwill credit added.', time: '9:00 PM' },
    ],
  },
  {
    id: 'TKT-8795',
    subject: 'Double charge on UPI',
    category: 'Refund',
    requester: 'Amit Shah',
    requesterEmail: 'amit.s@email.com',
    priority: 'Medium',
    status: 'Closed',
    agent: 'Priya Sharma',
    channel: 'Ticket',
    updated: 'Yesterday',
    created: 'Jul 13, 2026 · 3:40 PM',
    messages: [
      { id: 'm1', sender: 'Amit Shah', role: 'customer', body: 'UPI deducted twice for order ORD-92710.', time: '3:40 PM' },
      { id: 'm2', sender: 'Priya Sharma', role: 'agent', body: 'Duplicate charge reversed. Refund reference: REF-882910.', time: '4:30 PM' },
    ],
  },
]

export const liveChatSessions: LiveChatSession[] = [
  {
    id: 'CHAT-301',
    customer: 'Neha Kapoor',
    preview: 'Where is my driver? It has been 20 minutes…',
    status: 'Waiting',
    waitTime: '3 min',
    agent: null,
    messages: [
      { id: 'c1', sender: 'Neha Kapoor', role: 'customer', body: 'Where is my driver? It has been 20 minutes since assignment.', time: '7:18 PM' },
    ],
  },
  {
    id: 'CHAT-298',
    customer: 'Suresh Kumar',
    preview: 'Need to change drop location mid-trip',
    status: 'Active',
    waitTime: '—',
    agent: 'Rohan Kapoor',
    messages: [
      { id: 'c1', sender: 'Suresh Kumar', role: 'customer', body: 'Can I change my drop to Koramangala 5th Block?', time: '7:10 PM' },
      { id: 'c2', sender: 'Rohan Kapoor', role: 'agent', body: 'Yes, I can update it. The revised fare will be ₹312. Shall I proceed?', time: '7:11 PM' },
      { id: 'c3', sender: 'Suresh Kumar', role: 'customer', body: 'Yes please, go ahead.', time: '7:12 PM' },
    ],
  },
  {
    id: 'CHAT-295',
    customer: 'Priya Nair',
    preview: 'Thanks, issue resolved!',
    status: 'Ended',
    waitTime: '—',
    agent: 'Meera Iyer',
    messages: [
      { id: 'c1', sender: 'Priya Nair', role: 'customer', body: 'Driver cancelled twice. Need reassignment.', time: '6:30 PM' },
      { id: 'c2', sender: 'Meera Iyer', role: 'agent', body: 'New driver assigned — DRV-10482. ETA 4 minutes.', time: '6:32 PM' },
      { id: 'c3', sender: 'Priya Nair', role: 'customer', body: 'Thanks, issue resolved!', time: '6:45 PM' },
    ],
  },
]
