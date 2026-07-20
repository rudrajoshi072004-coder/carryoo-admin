export type CustomerStatus = 'Active' | 'Inactive' | 'Blocked'

export interface CustomerAddress {
  id: string
  label: string
  line1: string
  line2?: string
  city: string
  pincode: string
  isDefault: boolean
}

export interface CustomerComplaint {
  id: string
  subject: string
  status: 'Open' | 'Resolved' | 'Escalated'
  date: string
  resolution?: string
}

export interface CustomerReview {
  id: string
  rating: number
  comment: string
  date: string
  driverName: string
}

export interface CustomerOrder {
  id: string
  route: string
  fare: number
  status: string
  date: string
}

export interface CustomerActivity {
  text: string
  time: string
  type: 'order' | 'payment' | 'support' | 'wallet' | 'referral'
}

export interface CustomerReferral {
  code: string
  invites: number
  successful: number
  earnings: number
  recent: { name: string; date: string; status: string }[]
}

export interface Customer {
  id: string
  name: string
  phone: string
  email: string
  city: string
  orders: number
  lifetimeSpend: number
  wallet: number
  rating: number
  status: CustomerStatus
  joined: string
  initials: string
  accent: string
  addresses: CustomerAddress[]
  complaints: CustomerComplaint[]
  referrals: CustomerReferral
  reviews: CustomerReview[]
  recentOrders: CustomerOrder[]
  activity: CustomerActivity[]
  walletHistory: { label: string; amount: number; type: 'credit' | 'debit'; time: string }[]
  spendingByMonth: { month: string; amount: number }[]
}

export const customerStatuses = ['All Status', 'Active', 'Inactive', 'Blocked'] as const

export const customerCities = [
  'All Cities',
  'Pune',
  'Mumbai',
  'Bengaluru',
  'Delhi NCR',
  'Hyderabad',
  'Chennai',
  'Ahmedabad',
  'Kolkata',
] as const

export const customers: Customer[] = [
  {
    id: 'CUS-20841',
    name: 'Riya Kapoor',
    phone: '+91 98234 11820',
    email: 'riya.kapoor@gmail.com',
    city: 'Mumbai',
    orders: 186,
    lifetimeSpend: 42850,
    wallet: 1240,
    rating: 4.7,
    status: 'Active',
    joined: '08 Jan 2024',
    initials: 'RK',
    accent: '#2563eb',
    addresses: [
      {
        id: 'addr-1',
        label: 'Home',
        line1: 'Flat 402, Ocean View CHS',
        line2: 'Linking Road, Bandra West',
        city: 'Mumbai',
        pincode: '400050',
        isDefault: true,
      },
      {
        id: 'addr-2',
        label: 'Office',
        line1: 'WeWork, BKC G Block',
        city: 'Mumbai',
        pincode: '400051',
        isDefault: false,
      },
    ],
    complaints: [
      {
        id: 'CMP-8821',
        subject: 'Late delivery on ORD-88214',
        status: 'Resolved',
        date: '02 Jul 2026',
        resolution: '₹150 wallet credit issued',
      },
    ],
    referrals: {
      code: 'RIYA50',
      invites: 14,
      successful: 9,
      earnings: 1800,
      recent: [
        { name: 'Ananya Desai', date: '10 Jul 2026', status: 'Joined' },
        { name: 'Rohan Mehta', date: '28 Jun 2026', status: 'Joined' },
      ],
    },
    reviews: [
      {
        id: 'REV-441',
        rating: 5,
        comment: 'Driver was polite and handled fragile items carefully.',
        date: '11 Jul 2026',
        driverName: 'Vikram Joshi',
      },
      {
        id: 'REV-392',
        rating: 4,
        comment: 'Smooth pickup from Bandra, slight delay in traffic.',
        date: '04 Jul 2026',
        driverName: 'Suresh Patil',
      },
    ],
    recentOrders: [
      { id: 'ORD-88214', route: 'Bandra → Andheri East', fare: 285, status: 'Delivered', date: '11 Jul 2026' },
      { id: 'ORD-87902', route: 'BKC → Powai', fare: 420, status: 'Delivered', date: '08 Jul 2026' },
      { id: 'ORD-87511', route: 'Colaba → Dadar', fare: 310, status: 'Delivered', date: '05 Jul 2026' },
    ],
    activity: [
      { text: 'Placed order ORD-88214', time: '11 Jul, 10:42 AM', type: 'order' },
      { text: 'Wallet topped up via UPI', time: '09 Jul, 6:15 PM', type: 'wallet' },
      { text: 'Rated trip with Vikram Joshi', time: '11 Jul, 11:20 AM', type: 'order' },
    ],
    walletHistory: [
      { label: 'Trip refund — ORD-87102', amount: 150, type: 'credit', time: '02 Jul 2026' },
      { label: 'UPI top-up', amount: 500, type: 'credit', time: '09 Jul 2026' },
      { label: 'Paid ORD-88214', amount: 285, type: 'debit', time: '11 Jul 2026' },
    ],
    spendingByMonth: [
      { month: 'Apr', amount: 6200 },
      { month: 'May', amount: 7100 },
      { month: 'Jun', amount: 8400 },
      { month: 'Jul', amount: 4850 },
    ],
  },
  {
    id: 'CUS-20842',
    name: 'FreshMart Retail',
    phone: '+91 98765 22001',
    email: 'ops@freshmart.in',
    city: 'Pune',
    orders: 1240,
    lifetimeSpend: 892400,
    wallet: 18500,
    rating: 4.9,
    status: 'Active',
    joined: '15 Nov 2023',
    initials: 'FM',
    accent: '#059669',
    addresses: [
      {
        id: 'addr-3',
        label: 'Warehouse',
        line1: 'Plot 18, Hinjewadi Phase 2',
        line2: 'Near Rajiv Gandhi Infotech Park',
        city: 'Pune',
        pincode: '411057',
        isDefault: true,
      },
      {
        id: 'addr-4',
        label: 'Store — Kothrud',
        line1: 'Shop 12, Mayur Colony',
        city: 'Pune',
        pincode: '411038',
        isDefault: false,
      },
    ],
    complaints: [],
    referrals: {
      code: 'FRESHMART',
      invites: 3,
      successful: 2,
      earnings: 4000,
      recent: [{ name: 'DailyNeeds Mart', date: '15 Jun 2026', status: 'Joined' }],
    },
    reviews: [
      {
        id: 'REV-512',
        rating: 5,
        comment: 'Bulk orders always on schedule. Excellent B2B partner.',
        date: '09 Jul 2026',
        driverName: 'Amit Deshmukh',
      },
    ],
    recentOrders: [
      { id: 'ORD-88190', route: 'Hinjewadi → Kothrud', fare: 680, status: 'Delivered', date: '12 Jul 2026' },
      { id: 'ORD-88102', route: 'Hinjewadi → Wakad', fare: 420, status: 'Delivered', date: '11 Jul 2026' },
      { id: 'ORD-88011', route: 'Hinjewadi → Baner', fare: 550, status: 'In Transit', date: '12 Jul 2026' },
    ],
    activity: [
      { text: 'Scheduled bulk pickup ORD-88011', time: '12 Jul, 7:00 AM', type: 'order' },
      { text: 'Wallet credited — monthly settlement', time: '01 Jul, 9:00 AM', type: 'wallet' },
      { text: 'Referred DailyNeeds Mart', time: '15 Jun, 2:30 PM', type: 'referral' },
    ],
    walletHistory: [
      { label: 'B2B settlement credit', amount: 12000, type: 'credit', time: '01 Jul 2026' },
      { label: 'Paid ORD-88102', amount: 420, type: 'debit', time: '11 Jul 2026' },
      { label: 'Paid ORD-88190', amount: 680, type: 'debit', time: '12 Jul 2026' },
    ],
    spendingByMonth: [
      { month: 'Apr', amount: 198000 },
      { month: 'May', amount: 224000 },
      { month: 'Jun', amount: 241000 },
      { month: 'Jul', amount: 89000 },
    ],
  },
  {
    id: 'CUS-20843',
    name: 'Kabir Singh',
    phone: '+91 98112 33445',
    email: 'kabir.singh@outlook.com',
    city: 'Delhi NCR',
    orders: 94,
    lifetimeSpend: 28400,
    wallet: 320,
    rating: 4.3,
    status: 'Active',
    joined: '22 Apr 2024',
    initials: 'KS',
    accent: '#7c3aed',
    addresses: [
      {
        id: 'addr-5',
        label: 'Home',
        line1: 'B-204, Green Park Extension',
        city: 'New Delhi',
        pincode: '110016',
        isDefault: true,
      },
    ],
    complaints: [
      {
        id: 'CMP-9012',
        subject: 'Driver took longer route',
        status: 'Open',
        date: '10 Jul 2026',
      },
    ],
    referrals: {
      code: 'KABIR25',
      invites: 6,
      successful: 3,
      earnings: 600,
      recent: [{ name: 'Neha Gupta', date: '01 Jul 2026', status: 'Pending' }],
    },
    reviews: [
      {
        id: 'REV-301',
        rating: 3,
        comment: 'Package left at wrong gate once.',
        date: '28 Jun 2026',
        driverName: 'Rahul Verma',
      },
    ],
    recentOrders: [
      { id: 'ORD-87880', route: 'Green Park → Saket', fare: 195, status: 'Delivered', date: '10 Jul 2026' },
      { id: 'ORD-87650', route: 'Connaught Place → Dwarka', fare: 480, status: 'Delivered', date: '07 Jul 2026' },
    ],
    activity: [
      { text: 'Raised complaint CMP-9012', time: '10 Jul, 4:10 PM', type: 'support' },
      { text: 'Completed order ORD-87880', time: '10 Jul, 3:45 PM', type: 'order' },
    ],
    walletHistory: [
      { label: 'Referral bonus', amount: 200, type: 'credit', time: '01 Jul 2026' },
      { label: 'Paid ORD-87880', amount: 195, type: 'debit', time: '10 Jul 2026' },
    ],
    spendingByMonth: [
      { month: 'Apr', amount: 5200 },
      { month: 'May', amount: 6800 },
      { month: 'Jun', amount: 7400 },
      { month: 'Jul', amount: 4200 },
    ],
  },
  {
    id: 'CUS-20844',
    name: 'Nova Electronics',
    phone: '+91 99887 66554',
    email: 'dispatch@novaelectronics.in',
    city: 'Bengaluru',
    orders: 562,
    lifetimeSpend: 412800,
    wallet: 9200,
    rating: 4.8,
    status: 'Active',
    joined: '03 Sep 2023',
    initials: 'NE',
    accent: '#0ea5e9',
    addresses: [
      {
        id: 'addr-6',
        label: 'HQ',
        line1: '3rd Floor, Sigma Tech Park',
        line2: 'Whitefield Main Road',
        city: 'Bengaluru',
        pincode: '560066',
        isDefault: true,
      },
      {
        id: 'addr-7',
        label: 'Service Centre',
        line1: '12, 4th Block, Koramangala',
        city: 'Bengaluru',
        pincode: '560034',
        isDefault: false,
      },
    ],
    complaints: [
      {
        id: 'CMP-7744',
        subject: 'Damaged packaging on ORD-86220',
        status: 'Escalated',
        date: '18 Jun 2026',
        resolution: 'Insurance claim in progress',
      },
    ],
    referrals: {
      code: 'NOVA100',
      invites: 8,
      successful: 5,
      earnings: 5000,
      recent: [{ name: 'ByteHub Stores', date: '20 Jun 2026', status: 'Joined' }],
    },
    reviews: [
      {
        id: 'REV-620',
        rating: 5,
        comment: 'Fragile electronics handled with care every time.',
        date: '12 Jul 2026',
        driverName: 'Karthik Reddy',
      },
    ],
    recentOrders: [
      { id: 'ORD-88220', route: 'Whitefield → Indiranagar', fare: 340, status: 'Delivered', date: '12 Jul 2026' },
      { id: 'ORD-88150', route: 'Koramangala → Electronic City', fare: 520, status: 'Delivered', date: '11 Jul 2026' },
    ],
    activity: [
      { text: 'Delivered ORD-88220', time: '12 Jul, 2:20 PM', type: 'order' },
      { text: 'Support ticket escalated', time: '18 Jun, 11:00 AM', type: 'support' },
    ],
    walletHistory: [
      { label: 'Damage claim credit', amount: 2500, type: 'credit', time: '20 Jun 2026' },
      { label: 'Paid ORD-88220', amount: 340, type: 'debit', time: '12 Jul 2026' },
    ],
    spendingByMonth: [
      { month: 'Apr', amount: 92000 },
      { month: 'May', amount: 108000 },
      { month: 'Jun', amount: 112000 },
      { month: 'Jul', amount: 48000 },
    ],
  },
  {
    id: 'CUS-20845',
    name: 'Meera Nair',
    phone: '+91 98470 22118',
    email: 'meera.nair@yahoo.com',
    city: 'Chennai',
    orders: 72,
    lifetimeSpend: 18650,
    wallet: 0,
    rating: 4.5,
    status: 'Inactive',
    joined: '30 Jun 2024',
    initials: 'MN',
    accent: '#f59e0b',
    addresses: [
      {
        id: 'addr-8',
        label: 'Home',
        line1: '14, Besant Nagar 2nd Avenue',
        city: 'Chennai',
        pincode: '600090',
        isDefault: true,
      },
    ],
    complaints: [],
    referrals: {
      code: 'MEERA20',
      invites: 2,
      successful: 0,
      earnings: 0,
      recent: [],
    },
    reviews: [
      {
        id: 'REV-210',
        rating: 4,
        comment: 'Good service along OMR corridor.',
        date: '15 May 2026',
        driverName: 'Arun Kumar',
      },
    ],
    recentOrders: [
      { id: 'ORD-85400', route: 'Besant Nagar → T Nagar', fare: 260, status: 'Delivered', date: '15 May 2026' },
      { id: 'ORD-84820', route: 'Adyar → Velachery', fare: 180, status: 'Delivered', date: '02 May 2026' },
    ],
    activity: [
      { text: 'Last login via mobile app', time: '20 May, 8:30 PM', type: 'order' },
      { text: 'Completed order ORD-85400', time: '15 May, 6:10 PM', type: 'order' },
    ],
    walletHistory: [
      { label: 'Paid ORD-85400', amount: 260, type: 'debit', time: '15 May 2026' },
    ],
    spendingByMonth: [
      { month: 'Apr', amount: 4200 },
      { month: 'May', amount: 3800 },
      { month: 'Jun', amount: 0 },
      { month: 'Jul', amount: 0 },
    ],
  },
  {
    id: 'CUS-20846',
    name: 'GreenLeaf Cafe',
    phone: '+91 98250 77881',
    email: 'hello@greenleafcafe.in',
    city: 'Ahmedabad',
    orders: 318,
    lifetimeSpend: 156200,
    wallet: 3400,
    rating: 4.6,
    status: 'Active',
    joined: '11 Feb 2024',
    initials: 'GL',
    accent: '#10b981',
    addresses: [
      {
        id: 'addr-9',
        label: 'Cafe',
        line1: 'Shop 7, Law Garden Road',
        city: 'Ahmedabad',
        pincode: '380006',
        isDefault: true,
      },
      {
        id: 'addr-10',
        label: 'Kitchen',
        line1: 'Gala No. 4, Naroda Industrial Estate',
        city: 'Ahmedabad',
        pincode: '382330',
        isDefault: false,
      },
    ],
    complaints: [
      {
        id: 'CMP-6610',
        subject: 'Cold chain delay',
        status: 'Resolved',
        date: '05 Jun 2026',
        resolution: 'Priority routing enabled for account',
      },
    ],
    referrals: {
      code: 'GREEN40',
      invites: 5,
      successful: 4,
      earnings: 1600,
      recent: [{ name: 'Spice Route Kitchen', date: '08 Jun 2026', status: 'Joined' }],
    },
    reviews: [
      {
        id: 'REV-480',
        rating: 5,
        comment: 'Perishables delivered fresh, every morning run.',
        date: '12 Jul 2026',
        driverName: 'Harsh Shah',
      },
    ],
    recentOrders: [
      { id: 'ORD-88180', route: 'Naroda → Law Garden', fare: 290, status: 'Delivered', date: '12 Jul 2026' },
      { id: 'ORD-88110', route: 'Naroda → Satellite', fare: 350, status: 'Delivered', date: '11 Jul 2026' },
    ],
    activity: [
      { text: 'Morning supply run ORD-88180', time: '12 Jul, 6:45 AM', type: 'order' },
      { text: 'Wallet top-up via NEFT', time: '10 Jul, 10:00 AM', type: 'wallet' },
    ],
    walletHistory: [
      { label: 'NEFT top-up', amount: 2000, type: 'credit', time: '10 Jul 2026' },
      { label: 'Paid ORD-88180', amount: 290, type: 'debit', time: '12 Jul 2026' },
    ],
    spendingByMonth: [
      { month: 'Apr', amount: 34000 },
      { month: 'May', amount: 38000 },
      { month: 'Jun', amount: 42000 },
      { month: 'Jul', amount: 18200 },
    ],
  },
  {
    id: 'CUS-20847',
    name: 'Aarav Shah',
    phone: '+91 98980 11223',
    email: 'aarav.shah@gmail.com',
    city: 'Pune',
    orders: 45,
    lifetimeSpend: 11200,
    wallet: 150,
    rating: 3.9,
    status: 'Blocked',
    joined: '18 Aug 2024',
    initials: 'AS',
    accent: '#dc2626',
    addresses: [
      {
        id: 'addr-11',
        label: 'Home',
        line1: 'B-12, Koregaon Park',
        city: 'Pune',
        pincode: '411001',
        isDefault: true,
      },
    ],
    complaints: [
      {
        id: 'CMP-9901',
        subject: 'Repeated COD payment disputes',
        status: 'Escalated',
        date: '08 Jul 2026',
      },
      {
        id: 'CMP-9850',
        subject: 'Abusive behaviour toward driver',
        status: 'Resolved',
        date: '01 Jul 2026',
        resolution: 'Account temporarily suspended',
      },
    ],
    referrals: {
      code: 'AARAV10',
      invites: 1,
      successful: 0,
      earnings: 0,
      recent: [],
    },
    reviews: [],
    recentOrders: [
      { id: 'ORD-87700', route: 'Koregaon Park → Hinjewadi', fare: 380, status: 'Cancelled', date: '08 Jul 2026' },
    ],
    activity: [
      { text: 'Account blocked by admin', time: '09 Jul, 9:00 AM', type: 'support' },
      { text: 'Order ORD-87700 cancelled', time: '08 Jul, 11:30 AM', type: 'order' },
    ],
    walletHistory: [
      { label: 'COD dispute hold', amount: 150, type: 'debit', time: '08 Jul 2026' },
    ],
    spendingByMonth: [
      { month: 'Apr', amount: 2800 },
      { month: 'May', amount: 3200 },
      { month: 'Jun', amount: 4100 },
      { month: 'Jul', amount: 1100 },
    ],
  },
  {
    id: 'CUS-20848',
    name: 'TechNest Stores',
    phone: '+91 99000 44556',
    email: 'logistics@technest.co.in',
    city: 'Hyderabad',
    orders: 428,
    lifetimeSpend: 298600,
    wallet: 7600,
    rating: 4.7,
    status: 'Active',
    joined: '07 Dec 2023',
    initials: 'TN',
    accent: '#6366f1',
    addresses: [
      {
        id: 'addr-12',
        label: 'Warehouse',
        line1: 'Unit 8, Madhapur Warehouse Cluster',
        city: 'Hyderabad',
        pincode: '500081',
        isDefault: true,
      },
    ],
    complaints: [],
    referrals: {
      code: 'TECHNEST',
      invites: 4,
      successful: 3,
      earnings: 3000,
      recent: [{ name: 'GadgetZone', date: '22 Jun 2026', status: 'Joined' }],
    },
    reviews: [
      {
        id: 'REV-550',
        rating: 5,
        comment: 'Same-day intra-city runs are reliable.',
        date: '11 Jul 2026',
        driverName: 'Srinivas Rao',
      },
    ],
    recentOrders: [
      { id: 'ORD-88205', route: 'Madhapur → Gachibowli', fare: 220, status: 'Delivered', date: '12 Jul 2026' },
      { id: 'ORD-88140', route: 'Madhapur → Secunderabad', fare: 410, status: 'Delivered', date: '11 Jul 2026' },
    ],
    activity: [
      { text: 'Delivered ORD-88205', time: '12 Jul, 1:15 PM', type: 'order' },
      { text: 'Monthly invoice generated', time: '01 Jul, 8:00 AM', type: 'payment' },
    ],
    walletHistory: [
      { label: 'Invoice settlement', amount: 8000, type: 'credit', time: '01 Jul 2026' },
      { label: 'Paid ORD-88205', amount: 220, type: 'debit', time: '12 Jul 2026' },
    ],
    spendingByMonth: [
      { month: 'Apr', amount: 68000 },
      { month: 'May', amount: 72000 },
      { month: 'Jun', amount: 78000 },
      { month: 'Jul', amount: 34000 },
    ],
  },
  {
    id: 'CUS-20849',
    name: 'Priya Shah',
    phone: '+91 97654 88990',
    email: 'priya.shah@icloud.com',
    city: 'Mumbai',
    orders: 128,
    lifetimeSpend: 34200,
    wallet: 890,
    rating: 4.4,
    status: 'Active',
    joined: '05 Mar 2024',
    initials: 'PS',
    accent: '#ec4899',
    addresses: [
      {
        id: 'addr-13',
        label: 'Home',
        line1: '1203, Lodha Palava',
        line2: 'Dombivli East',
        city: 'Mumbai',
        pincode: '421204',
        isDefault: true,
      },
    ],
    complaints: [
      {
        id: 'CMP-8100',
        subject: 'Missing item in parcel',
        status: 'Resolved',
        date: '20 Jun 2026',
        resolution: 'Partial refund processed',
      },
    ],
    referrals: {
      code: 'PRIYA30',
      invites: 11,
      successful: 7,
      earnings: 1400,
      recent: [
        { name: 'Divya Kulkarni', date: '05 Jul 2026', status: 'Joined' },
        { name: 'Jay Patel', date: '18 Jun 2026', status: 'Joined' },
      ],
    },
    reviews: [
      {
        id: 'REV-410',
        rating: 4,
        comment: 'Affordable rates for Thane–Mumbai corridor.',
        date: '09 Jul 2026',
        driverName: 'Nitin More',
      },
    ],
    recentOrders: [
      { id: 'ORD-88170', route: 'Dombivli → Lower Parel', fare: 520, status: 'Delivered', date: '11 Jul 2026' },
      { id: 'ORD-88050', route: 'Dombivli → Thane', fare: 180, status: 'Delivered', date: '09 Jul 2026' },
    ],
    activity: [
      { text: 'Referred Divya Kulkarni', time: '05 Jul, 7:20 PM', type: 'referral' },
      { text: 'Completed order ORD-88170', time: '11 Jul, 5:40 PM', type: 'order' },
    ],
    walletHistory: [
      { label: 'Referral bonus', amount: 200, type: 'credit', time: '05 Jul 2026' },
      { label: 'Paid ORD-88170', amount: 520, type: 'debit', time: '11 Jul 2026' },
    ],
    spendingByMonth: [
      { month: 'Apr', amount: 7800 },
      { month: 'May', amount: 8200 },
      { month: 'Jun', amount: 9100 },
      { month: 'Jul', amount: 5200 },
    ],
  },
  {
    id: 'CUS-20850',
    name: 'UrbanMoves Logistics',
    phone: '+91 98300 55667',
    email: 'accounts@urbanmoves.in',
    city: 'Kolkata',
    orders: 890,
    lifetimeSpend: 624000,
    wallet: 22000,
    rating: 4.8,
    status: 'Active',
    joined: '20 Oct 2023',
    initials: 'UM',
    accent: '#2563eb',
    addresses: [
      {
        id: 'addr-14',
        label: 'Hub',
        line1: 'Dock 3, Kasba Industrial Park',
        city: 'Kolkata',
        pincode: '700042',
        isDefault: true,
      },
      {
        id: 'addr-15',
        label: 'Salt Lake Office',
        line1: 'Sector V, Block EP',
        city: 'Kolkata',
        pincode: '700091',
        isDefault: false,
      },
    ],
    complaints: [
      {
        id: 'CMP-7200',
        subject: 'Invoice mismatch Q1',
        status: 'Resolved',
        date: '10 Apr 2026',
        resolution: 'Corrected invoice reissued',
      },
    ],
    referrals: {
      code: 'URBAN200',
      invites: 6,
      successful: 4,
      earnings: 8000,
      recent: [{ name: 'EastCargo LLP', date: '12 May 2026', status: 'Joined' }],
    },
    reviews: [
      {
        id: 'REV-700',
        rating: 5,
        comment: 'Enterprise SLA consistently met across Kolkata zone.',
        date: '10 Jul 2026',
        driverName: 'Subhash Banerjee',
      },
    ],
    recentOrders: [
      { id: 'ORD-88230', route: 'Kasba → Salt Lake', fare: 380, status: 'In Transit', date: '12 Jul 2026' },
      { id: 'ORD-88195', route: 'Kasba → Howrah', fare: 450, status: 'Delivered', date: '12 Jul 2026' },
    ],
    activity: [
      { text: 'Active trip ORD-88230', time: '12 Jul, 3:00 PM', type: 'order' },
      { text: 'Wallet settlement credited', time: '01 Jul, 9:30 AM', type: 'wallet' },
    ],
    walletHistory: [
      { label: 'Enterprise settlement', amount: 15000, type: 'credit', time: '01 Jul 2026' },
      { label: 'Paid ORD-88195', amount: 450, type: 'debit', time: '12 Jul 2026' },
    ],
    spendingByMonth: [
      { month: 'Apr', amount: 148000 },
      { month: 'May', amount: 156000 },
      { month: 'Jun', amount: 162000 },
      { month: 'Jul', amount: 72000 },
    ],
  },
]
