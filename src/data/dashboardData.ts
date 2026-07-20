export const kpiSparklines = {
  orders: [820, 910, 880, 1020, 980, 1140, 1248],
  revenue: [1.8, 2.1, 1.9, 2.4, 2.2, 2.7, 3.12],
  driversOnline: [310, 340, 365, 380, 402, 418, 428],
  tripsRunning: [95, 110, 118, 132, 128, 141, 156],
  completed: [640, 710, 690, 760, 820, 890, 978],
  cancelled: [42, 38, 45, 36, 41, 33, 29],
  pendingDocs: [68, 72, 65, 58, 54, 49, 47],
  supportTickets: [28, 31, 26, 24, 22, 19, 18],
}

export const ordersThisWeek = [
  { day: 'Mon', orders: 1124, completed: 980 },
  { day: 'Tue', orders: 1286, completed: 1140 },
  { day: 'Wed', orders: 1198, completed: 1052 },
  { day: 'Thu', orders: 1342, completed: 1208 },
  { day: 'Fri', orders: 1486, completed: 1320 },
  { day: 'Sat', orders: 1610, completed: 1456 },
  { day: 'Sun', orders: 1248, completed: 978 },
]

export const revenueSeries = [
  { day: 'Mon', revenue: 2.48 },
  { day: 'Tue', revenue: 2.86 },
  { day: 'Wed', revenue: 2.61 },
  { day: 'Thu', revenue: 3.02 },
  { day: 'Fri', revenue: 3.38 },
  { day: 'Sat', revenue: 3.72 },
  { day: 'Sun', revenue: 3.12 },
]

export const driverGrowth = [
  { month: 'Jan', drivers: 1840 },
  { month: 'Feb', drivers: 1986 },
  { month: 'Mar', drivers: 2124 },
  { month: 'Apr', drivers: 2290 },
  { month: 'May', drivers: 2486 },
  { month: 'Jun', drivers: 2710 },
  { month: 'Jul', drivers: 2948 },
]

export const customerGrowth = [
  { month: 'Jan', customers: 12420 },
  { month: 'Feb', customers: 13860 },
  { month: 'Mar', customers: 15240 },
  { month: 'Apr', customers: 16980 },
  { month: 'May', customers: 18640 },
  { month: 'Jun', customers: 20480 },
  { month: 'Jul', customers: 22360 },
]

export const tripsByVehicle = [
  { name: 'Bike', value: 4280, fill: '#2563eb' },
  { name: 'Auto', value: 2140, fill: '#3b82f6' },
  { name: 'Mini Truck', value: 1680, fill: '#60a5fa' },
  { name: 'Pickup', value: 980, fill: '#93c5fd' },
  { name: 'Tempo', value: 620, fill: '#bfdbfe' },
]

export const peakHours = [
  { hour: '6 AM', trips: 86 },
  { hour: '8 AM', trips: 210 },
  { hour: '10 AM', trips: 164 },
  { hour: '12 PM', trips: 248 },
  { hour: '2 PM', trips: 192 },
  { hour: '4 PM', trips: 176 },
  { hour: '6 PM', trips: 312 },
  { hour: '8 PM', trips: 268 },
  { hour: '10 PM', trips: 142 },
]

export const recentOrders = [
  {
    id: 'CRY-92841',
    customer: 'Riya Kapoor',
    route: 'Andheri → Bandra',
    vehicle: 'Bike',
    amount: '₹248',
    status: 'In Transit',
    time: '4 min ago',
  },
  {
    id: 'CRY-92836',
    customer: 'FreshMart Retail',
    route: 'Vashi → Thane',
    vehicle: 'Mini Truck',
    amount: '₹1,860',
    status: 'Picked Up',
    time: '12 min ago',
  },
  {
    id: 'CRY-92829',
    customer: 'Kabir Singh',
    route: 'Koramangala → Indiranagar',
    vehicle: 'Bike',
    amount: '₹164',
    status: 'Delivered',
    time: '18 min ago',
  },
  {
    id: 'CRY-92821',
    customer: 'Nova Electronics',
    route: 'Whitefield → MG Road',
    vehicle: 'Pickup',
    amount: '₹2,140',
    status: 'Assigned',
    time: '26 min ago',
  },
  {
    id: 'CRY-92814',
    customer: 'Meera Nair',
    route: 'Powai → Lower Parel',
    vehicle: 'Auto',
    amount: '₹420',
    status: 'Cancelled',
    time: '41 min ago',
  },
]

export const pendingVerifications = [
  {
    name: 'Suresh Patil',
    city: 'Pune',
    vehicle: 'Bike · MH12 AB 4491',
    docs: 'Aadhaar, DL',
    submitted: '2 hrs ago',
  },
  {
    name: 'Ananya Reddy',
    city: 'Hyderabad',
    vehicle: 'Auto · TS09 CD 2210',
    docs: 'RC, Insurance',
    submitted: '5 hrs ago',
  },
  {
    name: 'Imran Qureshi',
    city: 'Delhi',
    vehicle: 'Pickup · DL8C EF 7782',
    docs: 'PAN, Photo',
    submitted: 'Yesterday',
  },
  {
    name: 'Lakshmi Iyer',
    city: 'Chennai',
    vehicle: 'Bike · TN10 GH 3344',
    docs: 'DL, Bank Proof',
    submitted: 'Yesterday',
  },
]

export const supportTickets = [
  {
    id: 'TKT-4412',
    subject: 'Fare dispute on delayed trip',
    requester: 'Customer · Priya Shah',
    priority: 'High',
    status: 'Open',
    updated: '9 min ago',
  },
  {
    id: 'TKT-4408',
    subject: 'Wallet payout not credited',
    requester: 'Driver · Ramesh K.',
    priority: 'High',
    status: 'In Progress',
    updated: '32 min ago',
  },
  {
    id: 'TKT-4401',
    subject: 'Unable to upload RC document',
    requester: 'Driver · Farhan A.',
    priority: 'Medium',
    status: 'Open',
    updated: '1 hr ago',
  },
  {
    id: 'TKT-4394',
    subject: 'Wrong drop location charged',
    requester: 'Customer · GreenLeaf Cafe',
    priority: 'Low',
    status: 'Waiting',
    updated: '3 hrs ago',
  },
]

export const latestWithdrawals = [
  {
    id: 'WD-7721',
    driver: 'Vikram Joshi',
    amount: '₹8,450',
    method: 'UPI · @vikramj',
    status: 'Processing',
    requested: '15 min ago',
  },
  {
    id: 'WD-7718',
    driver: 'Neha Deshmukh',
    amount: '₹12,200',
    method: 'Bank · HDFC ****4821',
    status: 'Completed',
    requested: '1 hr ago',
  },
  {
    id: 'WD-7712',
    driver: 'Arjun Menon',
    amount: '₹5,780',
    method: 'UPI · arjun@oksbi',
    status: 'Completed',
    requested: '2 hrs ago',
  },
  {
    id: 'WD-7705',
    driver: 'Pooja Verma',
    amount: '₹9,960',
    method: 'Bank · ICICI ****9103',
    status: 'Failed',
    requested: '4 hrs ago',
  },
]

export const kpiSparklinesExtra = {
  pendingApprovals: [52, 48, 44, 41, 38, 35, 32],
  pendingWithdrawals: [28, 26, 24, 22, 21, 19, 17],
  customerRegs: [180, 210, 195, 240, 260, 280, 312],
}

export const tripsPerHour = [
  { hour: '8 AM', trips: 210 },
  { hour: '10 AM', trips: 164 },
  { hour: '12 PM', trips: 248 },
  { hour: '2 PM', trips: 192 },
  { hour: '4 PM', trips: 176 },
  { hour: '6 PM', trips: 312 },
  { hour: '8 PM', trips: 268 },
]

export const cityWiseRevenue = [
  { city: 'Mumbai', revenue: 8.4 },
  { city: 'Bengaluru', revenue: 6.2 },
  { city: 'Delhi', revenue: 5.8 },
  { city: 'Hyderabad', revenue: 4.1 },
  { city: 'Pune', revenue: 3.6 },
  { city: 'Chennai', revenue: 3.2 },
]

export const topDrivers = [
  { name: 'Neha Deshmukh', trips: 48, earnings: '₹8,420', rating: 4.9 },
  { name: 'Lakshmi Iyer', trips: 44, earnings: '₹7,180', rating: 4.9 },
  { name: 'Vikram Joshi', trips: 41, earnings: '₹6,940', rating: 4.8 },
  { name: 'Farhan Ali', trips: 36, earnings: '₹9,210', rating: 4.6 },
  { name: 'Ananya Reddy', trips: 34, earnings: '₹5,860', rating: 4.6 },
]

export const topCustomers = [
  { name: 'FreshMart Retail', orders: 128, spend: '₹2.48L' },
  { name: 'Nova Electronics', orders: 86, spend: '₹1.92L' },
  { name: 'TechNest Stores', orders: 74, spend: '₹1.64L' },
  { name: 'GreenLeaf Cafe', orders: 62, spend: '₹48.2K' },
  { name: 'UrbanMoves Logistics', orders: 51, spend: '₹96.4K' },
]

export const recentDriverRegs = [
  { name: 'Suresh Patil', city: 'Pune', vehicle: 'Bike', time: '2 hrs ago' },
  { name: 'Ananya Reddy', city: 'Hyderabad', vehicle: 'Auto', time: '5 hrs ago' },
  { name: 'Imran Qureshi', city: 'Delhi', vehicle: 'Pickup', time: 'Yesterday' },
]

export const recentPayments = [
  { id: 'PAY-44102', party: 'Riya Kapoor', amount: '₹248', method: 'UPI', time: '5:42 PM' },
  { id: 'PAY-44091', party: 'Kabir Singh', amount: '₹164', method: 'Card', time: '5:10 PM' },
  { id: 'PAY-44084', party: 'Nova Electronics', amount: '₹2,140', method: 'Net Banking', time: '5:00 PM' },
]
