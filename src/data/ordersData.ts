export type OrderStatus =
  | 'Placed'
  | 'Assigned'
  | 'Picked Up'
  | 'In Transit'
  | 'Delivered'
  | 'Cancelled'

export type PaymentStatus = 'Paid' | 'Pending' | 'Failed' | 'Refunded'

export interface OrderTimelineEvent {
  label: string
  time: string
  done: boolean
  detail?: string
}

export interface TrackingPoint {
  label: string
  time: string
  location: string
}

export interface InvoiceLine {
  label: string
  amount: string
}

export interface PaymentEvent {
  id: string
  method: string
  amount: string
  status: PaymentStatus
  time: string
}

export interface SupportEvent {
  id: string
  subject: string
  status: 'Open' | 'Resolved' | 'Waiting'
  time: string
}

export interface Order {
  id: string
  customer: string
  customerPhone: string
  driver: string
  driverId: string
  vehicle: string
  vehicleType: string
  pickup: string
  pickupArea: string
  drop: string
  dropArea: string
  distance: string
  fare: number
  status: OrderStatus
  payment: PaymentStatus
  paymentMethod: string
  time: string
  date: string
  dateKey: string
  items: string
  weight: string
  notes: string
  map: {
    pickup: { x: number; y: number }
    drop: { x: number; y: number }
    current?: { x: number; y: number }
    eta: string
  }
  timeline: OrderTimelineEvent[]
  tracking: TrackingPoint[]
  invoice: {
    base: InvoiceLine[]
    total: string
    gst: string
    invoiceNo: string
  }
  payments: PaymentEvent[]
  support: SupportEvent[]
}

export const orders: Order[] = [
  {
    id: 'CRY-92841',
    customer: 'Riya Kapoor',
    customerPhone: '+91 98100 22441',
    driver: 'Neha Deshmukh',
    driverId: 'DRV-10534',
    vehicle: 'MH02 LM 8812',
    vehicleType: 'Bike',
    pickup: 'Andheri West, Mumbai',
    pickupArea: 'Andheri',
    drop: 'Bandra West, Mumbai',
    dropArea: 'Bandra',
    distance: '8.8 km',
    fare: 248,
    status: 'In Transit',
    payment: 'Paid',
    paymentMethod: 'UPI',
    time: '4 min ago',
    date: '14 Jul 2026',
    dateKey: '2026-07-14',
    items: 'Documents & small parcel',
    weight: '2.4 kg',
    notes: 'Call on arrival. Gate code 4821.',
    map: {
      pickup: { x: 22, y: 58 },
      drop: { x: 72, y: 28 },
      current: { x: 48, y: 42 },
      eta: '12 min',
    },
    timeline: [
      { label: 'Order placed', time: 'Today, 5:42 PM', done: true, detail: 'Customer booked via Carryoo app' },
      { label: 'Driver assigned', time: 'Today, 5:44 PM', done: true, detail: 'Neha Deshmukh · Bike' },
      { label: 'Picked up', time: 'Today, 5:51 PM', done: true, detail: 'Parcel collected from Andheri West' },
      { label: 'In transit', time: 'Today, 5:53 PM', done: true, detail: 'En route to Bandra West' },
      { label: 'Delivered', time: 'ETA 6:05 PM', done: false },
    ],
    tracking: [
      { label: 'Left pickup', time: '5:51 PM', location: 'Andheri West Main Rd' },
      { label: 'Crossed JVLR', time: '5:56 PM', location: 'Near Infinity Mall' },
      { label: 'Current location', time: '5:59 PM', location: 'Linking Road approach' },
    ],
    invoice: {
      invoiceNo: 'INV-92841',
      gst: '₹37.69',
      total: '₹248.00',
      base: [
        { label: 'Base fare', amount: '₹60.00' },
        { label: 'Distance (8.8 km)', amount: '₹132.00' },
        { label: 'Peak surcharge', amount: '₹18.00' },
        { label: 'GST (18%)', amount: '₹37.69' },
        { label: 'Promo discount', amount: '-₹0.00' },
      ],
    },
    payments: [
      { id: 'PAY-44102', method: 'UPI · riya@oksbi', amount: '₹248.00', status: 'Paid', time: 'Today, 5:42 PM' },
    ],
    support: [],
  },
  {
    id: 'CRY-92836',
    customer: 'FreshMart Retail',
    customerPhone: '+91 22 4001 8821',
    driver: 'Imran Qureshi',
    driverId: 'DRV-10503',
    vehicle: 'DL8C EF 7782',
    vehicleType: 'Pickup',
    pickup: 'Vashi APMC, Navi Mumbai',
    pickupArea: 'Vashi',
    drop: 'Thane West Hub',
    dropArea: 'Thane',
    distance: '18.4 km',
    fare: 1860,
    status: 'Picked Up',
    payment: 'Pending',
    paymentMethod: 'Business Credit',
    time: '12 min ago',
    date: '14 Jul 2026',
    dateKey: '2026-07-14',
    items: 'Grocery crates × 12',
    weight: '186 kg',
    notes: 'Loading dock B. Delivery window 6–7 PM.',
    map: {
      pickup: { x: 30, y: 70 },
      drop: { x: 68, y: 22 },
      current: { x: 36, y: 62 },
      eta: '34 min',
    },
    timeline: [
      { label: 'Order placed', time: 'Today, 5:20 PM', done: true },
      { label: 'Driver assigned', time: 'Today, 5:28 PM', done: true, detail: 'Imran Qureshi · Pickup' },
      { label: 'Picked up', time: 'Today, 5:48 PM', done: true, detail: '12 crates loaded' },
      { label: 'In transit', time: 'Pending', done: false },
      { label: 'Delivered', time: 'ETA 6:22 PM', done: false },
    ],
    tracking: [
      { label: 'Arrived at APMC', time: '5:40 PM', location: 'Vashi Market Yard' },
      { label: 'Loading complete', time: '5:48 PM', location: 'Dock B' },
    ],
    invoice: {
      invoiceNo: 'INV-92836',
      gst: '₹283.73',
      total: '₹1,860.00',
      base: [
        { label: 'Base fare', amount: '₹350.00' },
        { label: 'Distance (18.4 km)', amount: '₹920.00' },
        { label: 'Weight surcharge', amount: '₹280.00' },
        { label: 'Waiting fee', amount: '₹26.00' },
        { label: 'GST (18%)', amount: '₹283.73' },
      ],
    },
    payments: [
      { id: 'PAY-44098', method: 'Business Credit · Net-7', amount: '₹1,860.00', status: 'Pending', time: 'Due in 7 days' },
    ],
    support: [
      { id: 'TKT-4418', subject: 'Confirm loading dock access', status: 'Resolved', time: 'Today, 5:35 PM' },
    ],
  },
  {
    id: 'CRY-92829',
    customer: 'Kabir Singh',
    customerPhone: '+91 99001 33442',
    driver: 'Lakshmi Iyer',
    driverId: 'DRV-10518',
    vehicle: 'TN10 GH 3344',
    vehicleType: 'Bike',
    pickup: 'Koramangala 5th Block',
    pickupArea: 'Koramangala',
    drop: 'Indiranagar 100 Feet Rd',
    dropArea: 'Indiranagar',
    distance: '5.6 km',
    fare: 164,
    status: 'Delivered',
    payment: 'Paid',
    paymentMethod: 'Card',
    time: '18 min ago',
    date: '14 Jul 2026',
    dateKey: '2026-07-14',
    items: 'Electronics accessory',
    weight: '0.8 kg',
    notes: 'Leave with security if unavailable.',
    map: {
      pickup: { x: 28, y: 62 },
      drop: { x: 74, y: 30 },
      eta: 'Delivered',
    },
    timeline: [
      { label: 'Order placed', time: 'Today, 5:10 PM', done: true },
      { label: 'Driver assigned', time: 'Today, 5:12 PM', done: true },
      { label: 'Picked up', time: 'Today, 5:21 PM', done: true },
      { label: 'In transit', time: 'Today, 5:22 PM', done: true },
      { label: 'Delivered', time: 'Today, 5:41 PM', done: true, detail: 'Handed to customer · OTP verified' },
    ],
    tracking: [
      { label: 'Delivered', time: '5:41 PM', location: 'Indiranagar 100 Feet Rd' },
      { label: 'Arrived at drop', time: '5:39 PM', location: 'Near 100 Feet Rd junction' },
      { label: 'Left pickup', time: '5:21 PM', location: 'Koramangala 5th Block' },
    ],
    invoice: {
      invoiceNo: 'INV-92829',
      gst: '₹25.02',
      total: '₹164.00',
      base: [
        { label: 'Base fare', amount: '₹45.00' },
        { label: 'Distance (5.6 km)', amount: '₹84.00' },
        { label: 'Platform fee', amount: '₹9.98' },
        { label: 'GST (18%)', amount: '₹25.02' },
      ],
    },
    payments: [
      { id: 'PAY-44091', method: 'Visa · ****4821', amount: '₹164.00', status: 'Paid', time: 'Today, 5:10 PM' },
    ],
    support: [],
  },
  {
    id: 'CRY-92821',
    customer: 'Nova Electronics',
    customerPhone: '+91 80 4122 7788',
    driver: 'Farhan Ali',
    driverId: 'DRV-10570',
    vehicle: 'WB06 UV 4455',
    vehicleType: 'Pickup',
    pickup: 'Whitefield ITPL',
    pickupArea: 'Whitefield',
    drop: 'MG Road Metro',
    dropArea: 'MG Road',
    distance: '22.1 km',
    fare: 2140,
    status: 'Assigned',
    payment: 'Paid',
    paymentMethod: 'Net Banking',
    time: '26 min ago',
    date: '14 Jul 2026',
    dateKey: '2026-07-14',
    items: 'Laptop cartons × 6',
    weight: '48 kg',
    notes: 'Fragile. Keep upright.',
    map: {
      pickup: { x: 78, y: 48 },
      drop: { x: 24, y: 40 },
      current: { x: 70, y: 46 },
      eta: '48 min',
    },
    timeline: [
      { label: 'Order placed', time: 'Today, 5:00 PM', done: true },
      { label: 'Driver assigned', time: 'Today, 5:08 PM', done: true, detail: 'Farhan Ali heading to pickup' },
      { label: 'Picked up', time: 'Pending', done: false },
      { label: 'In transit', time: 'Pending', done: false },
      { label: 'Delivered', time: 'ETA 6:20 PM', done: false },
    ],
    tracking: [
      { label: 'Driver en route to pickup', time: '5:10 PM', location: 'Near ITPL Main Gate' },
    ],
    invoice: {
      invoiceNo: 'INV-92821',
      gst: '₹326.44',
      total: '₹2,140.00',
      base: [
        { label: 'Base fare', amount: '₹400.00' },
        { label: 'Distance (22.1 km)', amount: '₹1,105.00' },
        { label: 'Handling fee', amount: '₹180.00' },
        { label: 'Insurance add-on', amount: '₹128.56' },
        { label: 'GST (18%)', amount: '₹326.44' },
      ],
    },
    payments: [
      { id: 'PAY-44084', method: 'HDFC Net Banking', amount: '₹2,140.00', status: 'Paid', time: 'Today, 5:00 PM' },
    ],
    support: [],
  },
  {
    id: 'CRY-92814',
    customer: 'Meera Nair',
    customerPhone: '+91 98765 00112',
    driver: 'Vikram Joshi',
    driverId: 'DRV-10482',
    vehicle: 'MH12 AB 4491',
    vehicleType: 'Auto',
    pickup: 'Powai Lake Homes',
    pickupArea: 'Powai',
    drop: 'Lower Parel Phoenix',
    dropArea: 'Lower Parel',
    distance: '13.4 km',
    fare: 420,
    status: 'Cancelled',
    payment: 'Refunded',
    paymentMethod: 'UPI',
    time: '41 min ago',
    date: '14 Jul 2026',
    dateKey: '2026-07-14',
    items: 'Gift package',
    weight: '4.2 kg',
    notes: 'Customer cancelled after assignment.',
    map: {
      pickup: { x: 40, y: 35 },
      drop: { x: 62, y: 68 },
      eta: 'Cancelled',
    },
    timeline: [
      { label: 'Order placed', time: 'Today, 4:48 PM', done: true },
      { label: 'Driver assigned', time: 'Today, 4:51 PM', done: true },
      { label: 'Cancelled', time: 'Today, 4:58 PM', done: true, detail: 'Customer requested cancel · free cancel window' },
      { label: 'Refund issued', time: 'Today, 5:02 PM', done: true, detail: '₹420 refunded to UPI' },
    ],
    tracking: [
      { label: 'Trip cancelled', time: '4:58 PM', location: 'Driver was 1.2 km from pickup' },
    ],
    invoice: {
      invoiceNo: 'INV-92814',
      gst: '₹0.00',
      total: '₹0.00',
      base: [
        { label: 'Original fare', amount: '₹420.00' },
        { label: 'Cancellation fee', amount: '₹0.00' },
        { label: 'Refund', amount: '-₹420.00' },
      ],
    },
    payments: [
      { id: 'PAY-44070', method: 'UPI · meera@upi', amount: '₹420.00', status: 'Paid', time: 'Today, 4:48 PM' },
      { id: 'REF-1182', method: 'UPI refund', amount: '₹420.00', status: 'Refunded', time: 'Today, 5:02 PM' },
    ],
    support: [
      { id: 'TKT-4412', subject: 'Confirm free cancellation eligibility', status: 'Resolved', time: 'Today, 5:00 PM' },
    ],
  },
  {
    id: 'CRY-92788',
    customer: 'GreenLeaf Cafe',
    customerPhone: '+91 40 2781 3344',
    driver: 'Ananya Reddy',
    driverId: 'DRV-10491',
    vehicle: 'TS09 CD 2210',
    vehicleType: 'Auto',
    pickup: 'Gachibowli Food Court',
    pickupArea: 'Gachibowli',
    drop: 'Madhapur Inorbit',
    dropArea: 'Madhapur',
    distance: '6.8 km',
    fare: 310,
    status: 'Delivered',
    payment: 'Paid',
    paymentMethod: 'UPI',
    time: '2 hrs ago',
    date: '14 Jul 2026',
    dateKey: '2026-07-14',
    items: 'Catering boxes × 4',
    weight: '18 kg',
    notes: 'Ring cafe delivery bell.',
    map: {
      pickup: { x: 25, y: 55 },
      drop: { x: 70, y: 38 },
      eta: 'Delivered',
    },
    timeline: [
      { label: 'Order placed', time: 'Today, 3:40 PM', done: true },
      { label: 'Driver assigned', time: 'Today, 3:42 PM', done: true },
      { label: 'Picked up', time: 'Today, 3:55 PM', done: true },
      { label: 'In transit', time: 'Today, 3:56 PM', done: true },
      { label: 'Delivered', time: 'Today, 4:18 PM', done: true },
    ],
    tracking: [
      { label: 'Delivered', time: '4:18 PM', location: 'Madhapur Inorbit Gate 2' },
    ],
    invoice: {
      invoiceNo: 'INV-92788',
      gst: '₹47.29',
      total: '₹310.00',
      base: [
        { label: 'Base fare', amount: '₹80.00' },
        { label: 'Distance (6.8 km)', amount: '₹136.00' },
        { label: 'Handling', amount: '₹46.71' },
        { label: 'GST (18%)', amount: '₹47.29' },
      ],
    },
    payments: [
      { id: 'PAY-44022', method: 'UPI · greenleaf@ybl', amount: '₹310.00', status: 'Paid', time: 'Today, 3:40 PM' },
    ],
    support: [
      { id: 'TKT-4394', subject: 'Wrong drop location charged', status: 'Waiting', time: '3 hrs ago' },
    ],
  },
  {
    id: 'CRY-92750',
    customer: 'Aarav Shah',
    customerPhone: '+91 98200 55667',
    driver: 'Arjun Menon',
    driverId: 'DRV-10541',
    vehicle: 'KL07 NP 1122',
    vehicleType: 'Tempo',
    pickup: 'Edappally Metro',
    pickupArea: 'Edappally',
    drop: 'Infopark Phase 1',
    dropArea: 'Kakkanad',
    distance: '16.5 km',
    fare: 980,
    status: 'Placed',
    payment: 'Failed',
    paymentMethod: 'Card',
    time: 'Yesterday',
    date: '13 Jul 2026',
    dateKey: '2026-07-13',
    items: 'Office furniture parts',
    weight: '92 kg',
    notes: 'Awaiting successful payment before assign.',
    map: {
      pickup: { x: 32, y: 48 },
      drop: { x: 78, y: 36 },
      eta: 'On hold',
    },
    timeline: [
      { label: 'Order placed', time: 'Yesterday, 7:12 PM', done: true },
      { label: 'Payment failed', time: 'Yesterday, 7:12 PM', done: true, detail: 'Card declined · retry pending' },
      { label: 'Driver assigned', time: 'Pending payment', done: false },
      { label: 'Delivered', time: '—', done: false },
    ],
    tracking: [
      { label: 'Order on hold', time: 'Yesterday', location: 'Waiting for payment confirmation' },
    ],
    invoice: {
      invoiceNo: 'INV-92750',
      gst: '₹149.49',
      total: '₹980.00',
      base: [
        { label: 'Base fare', amount: '₹280.00' },
        { label: 'Distance (16.5 km)', amount: '₹495.00' },
        { label: 'Loading assist', amount: '₹55.51' },
        { label: 'GST (18%)', amount: '₹149.49' },
      ],
    },
    payments: [
      { id: 'PAY-43980', method: 'Mastercard · ****8812', amount: '₹980.00', status: 'Failed', time: 'Yesterday, 7:12 PM' },
    ],
    support: [
      { id: 'TKT-4388', subject: 'Payment retry assistance', status: 'Open', time: 'Yesterday' },
    ],
  },
  {
    id: 'CRY-92690',
    customer: 'TechNest Stores',
    customerPhone: '+91 33 4008 2211',
    driver: 'Farhan Ali',
    driverId: 'DRV-10570',
    vehicle: 'WB06 UV 4455',
    vehicleType: 'Mini Truck',
    pickup: 'Salt Lake Sector V',
    pickupArea: 'Salt Lake',
    drop: 'Howrah Station Godown',
    dropArea: 'Howrah',
    distance: '14.0 km',
    fare: 1520,
    status: 'Delivered',
    payment: 'Paid',
    paymentMethod: 'Business Credit',
    time: 'Yesterday',
    date: '13 Jul 2026',
    dateKey: '2026-07-13',
    items: 'Retail inventory pallets × 2',
    weight: '210 kg',
    notes: 'Unload at bay 3.',
    map: {
      pickup: { x: 70, y: 30 },
      drop: { x: 28, y: 62 },
      eta: 'Delivered',
    },
    timeline: [
      { label: 'Order placed', time: 'Yesterday, 11:05 AM', done: true },
      { label: 'Driver assigned', time: 'Yesterday, 11:20 AM', done: true },
      { label: 'Picked up', time: 'Yesterday, 12:02 PM', done: true },
      { label: 'In transit', time: 'Yesterday, 12:05 PM', done: true },
      { label: 'Delivered', time: 'Yesterday, 1:10 PM', done: true },
    ],
    tracking: [
      { label: 'Delivered', time: '1:10 PM', location: 'Howrah Station Godown Bay 3' },
    ],
    invoice: {
      invoiceNo: 'INV-92690',
      gst: '₹231.86',
      total: '₹1,520.00',
      base: [
        { label: 'Base fare', amount: '₹420.00' },
        { label: 'Distance (14.0 km)', amount: '₹700.00' },
        { label: 'Weight surcharge', amount: '₹168.14' },
        { label: 'GST (18%)', amount: '₹231.86' },
      ],
    },
    payments: [
      { id: 'PAY-43810', method: 'Business Credit · Net-15', amount: '₹1,520.00', status: 'Paid', time: 'Yesterday, 2:00 PM' },
    ],
    support: [],
  },
  {
    id: 'CRY-92640',
    customer: 'Priya Shah',
    customerPhone: '+91 98112 77880',
    driver: 'Suresh Patil',
    driverId: 'DRV-10555',
    vehicle: 'MH14 QR 6677',
    vehicleType: 'Bike',
    pickup: 'Hadapsar Industrial',
    pickupArea: 'Hadapsar',
    drop: 'Magarpatta City',
    dropArea: 'Magarpatta',
    distance: '3.2 km',
    fare: 98,
    status: 'In Transit',
    payment: 'Paid',
    paymentMethod: 'Wallet',
    time: 'Yesterday',
    date: '13 Jul 2026',
    dateKey: '2026-07-13',
    items: 'Medicine packet',
    weight: '0.4 kg',
    notes: 'Priority delivery.',
    map: {
      pickup: { x: 35, y: 60 },
      drop: { x: 62, y: 34 },
      current: { x: 50, y: 46 },
      eta: '8 min',
    },
    timeline: [
      { label: 'Order placed', time: 'Yesterday, 6:30 PM', done: true },
      { label: 'Driver assigned', time: 'Yesterday, 6:31 PM', done: true },
      { label: 'Picked up', time: 'Yesterday, 6:40 PM', done: true },
      { label: 'In transit', time: 'Yesterday, 6:41 PM', done: true },
      { label: 'Delivered', time: 'ETA 6:49 PM', done: false },
    ],
    tracking: [
      { label: 'Current location', time: '6:44 PM', location: 'Magarpatta Ring Road' },
      { label: 'Left pickup', time: '6:40 PM', location: 'Hadapsar Industrial Estate' },
    ],
    invoice: {
      invoiceNo: 'INV-92640',
      gst: '₹14.95',
      total: '₹98.00',
      base: [
        { label: 'Base fare', amount: '₹35.00' },
        { label: 'Distance (3.2 km)', amount: '₹40.00' },
        { label: 'Priority fee', amount: '₹8.05' },
        { label: 'GST (18%)', amount: '₹14.95' },
      ],
    },
    payments: [
      { id: 'PAY-43770', method: 'Carryoo Wallet', amount: '₹98.00', status: 'Paid', time: 'Yesterday, 6:30 PM' },
    ],
    support: [
      { id: 'TKT-4412', subject: 'Fare dispute on delayed trip', status: 'Open', time: '9 min ago' },
    ],
  },
  {
    id: 'CRY-92580',
    customer: 'UrbanMoves Logistics',
    customerPhone: '+91 44 2811 9000',
    driver: 'Lakshmi Iyer',
    driverId: 'DRV-10518',
    vehicle: 'TN10 GH 3344',
    vehicleType: 'Bike',
    pickup: 'T Nagar Pondy Bazaar',
    pickupArea: 'T Nagar',
    drop: 'Adyar Lattice Bridge',
    dropArea: 'Adyar',
    distance: '7.2 km',
    fare: 186,
    status: 'Delivered',
    payment: 'Paid',
    paymentMethod: 'UPI',
    time: '2 days ago',
    date: '12 Jul 2026',
    dateKey: '2026-07-12',
    items: 'Sample kit',
    weight: '1.1 kg',
    notes: '',
    map: {
      pickup: { x: 40, y: 40 },
      drop: { x: 68, y: 62 },
      eta: 'Delivered',
    },
    timeline: [
      { label: 'Order placed', time: '12 Jul, 2:15 PM', done: true },
      { label: 'Driver assigned', time: '12 Jul, 2:16 PM', done: true },
      { label: 'Picked up', time: '12 Jul, 2:28 PM', done: true },
      { label: 'In transit', time: '12 Jul, 2:29 PM', done: true },
      { label: 'Delivered', time: '12 Jul, 2:52 PM', done: true },
    ],
    tracking: [
      { label: 'Delivered', time: '2:52 PM', location: 'Adyar Lattice Bridge Rd' },
    ],
    invoice: {
      invoiceNo: 'INV-92580',
      gst: '₹28.37',
      total: '₹186.00',
      base: [
        { label: 'Base fare', amount: '₹50.00' },
        { label: 'Distance (7.2 km)', amount: '₹100.00' },
        { label: 'Platform fee', amount: '₹7.63' },
        { label: 'GST (18%)', amount: '₹28.37' },
      ],
    },
    payments: [
      { id: 'PAY-43620', method: 'UPI · urbanmoves@axis', amount: '₹186.00', status: 'Paid', time: '12 Jul, 2:15 PM' },
    ],
    support: [],
  },
]

export const orderStatuses: Array<'All Status' | OrderStatus> = [
  'All Status',
  'Placed',
  'Assigned',
  'Picked Up',
  'In Transit',
  'Delivered',
  'Cancelled',
]

export const orderVehicleTypes = [
  'All Vehicles',
  'Bike',
  'Auto',
  'Pickup',
  'Mini Truck',
  'Tempo',
]

export const orderDateFilters = [
  { value: 'all', label: 'All Dates' },
  { value: '2026-07-14', label: 'Today' },
  { value: '2026-07-13', label: 'Yesterday' },
  { value: '2026-07-12', label: '12 Jul 2026' },
]
