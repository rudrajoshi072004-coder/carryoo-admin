export type DriverStatus = 'Online' | 'Busy' | 'Offline' | 'Suspended' | 'New' | 'Pending KYC'

export type DocStatus = 'Verified' | 'Pending' | 'Rejected' | 'Expired'

export interface DriverDocument {
  type: string
  number: string
  status: DocStatus
  expiry: string
}

export interface DriverTrip {
  id: string
  route: string
  fare: string
  distance: string
  status: 'Completed' | 'Cancelled' | 'In Progress'
  date: string
}

export interface DriverActivity {
  text: string
  time: string
}

export interface Driver {
  id: string
  displayId?: string
  name: string
  phone: string
  accountPhone?: string
  driverPhone?: string
  email: string
  vehicle: string
  vehicleType: string
  city: string
  rating: number
  wallet: number
  status: DriverStatus
  trips: number
  joined: string
  initials: string
  accent: string
  gender: 'Male' | 'Female'
  experience: string
  completionRate: number
  acceptanceRate: number
  cancellationRate: number
  todayEarnings: number
  avgTripValue: string
  totalEarnings: string
  documents: DriverDocument[]
  vehicleDetails: {
    make: string
    model: string
    year: string
    color: string
    plate: string
    insurance: string
    fitness: string
    fuelType?: string
  }
  emergencyContact: {
    name: string
    relation: string
    phone: string
  }
  bankDetails: {
    accountName: string
    bank: string
    accountNumber: string
    ifsc: string
    upi: string
  }
  recentTrips: DriverTrip[]
  walletHistory: { label: string; amount: string; type: 'credit' | 'debit'; time: string }[]
  recentActivity: DriverActivity[]
}

export const drivers: Driver[] = [
  {
    id: 'DRV-10482',
    name: 'Vikram Joshi',
    phone: '+91 98765 41230',
    email: 'vikram.joshi@carryoo.driver',
    vehicle: 'Bike · MH12 AB 4491',
    vehicleType: 'Bike',
    city: 'Pune',
    rating: 4.8,
    wallet: 8450,
    status: 'Online',
    trips: 1246,
    todayEarnings: 2840,
    joined: '12 Mar 2024',
    initials: 'VJ',
    accent: '#2563eb',
    gender: 'Male',
    experience: '2 yrs 4 mo',
    completionRate: 96.4,
    acceptanceRate: 91.2,
    cancellationRate: 2.1,
    avgTripValue: '₹186',
    totalEarnings: '₹4.28L',
    documents: [
      { type: 'Aadhaar', number: 'XXXX-XXXX-4821', status: 'Verified', expiry: '—' },
      { type: 'Driving License', number: 'MH12 20210048219', status: 'Verified', expiry: '18 Aug 2028' },
      { type: 'RC', number: 'MH12AB4491', status: 'Verified', expiry: '—' },
      { type: 'Insurance', number: 'POL-882194', status: 'Verified', expiry: '02 Jan 2027' },
    ],
    vehicleDetails: {
      make: 'Honda',
      model: 'Activa 6G',
      year: '2022',
      color: 'Pearl White',
      plate: 'MH12 AB 4491',
      insurance: 'Valid till Jan 2027',
      fitness: 'Valid till Mar 2027',
    },
    emergencyContact: {
      name: 'Sneha Joshi',
      relation: 'Spouse',
      phone: '+91 98765 41231',
    },
    bankDetails: {
      accountName: 'Vikram Joshi',
      bank: 'HDFC Bank',
      accountNumber: '****4821',
      ifsc: 'HDFC0001823',
      upi: 'vikramj@oksbi',
    },
    recentTrips: [
      { id: 'TRP-88214', route: 'Koregaon Park → Hinjewadi', fare: '₹240', distance: '14.2 km', status: 'Completed', date: 'Today, 2:14 PM' },
      { id: 'TRP-88198', route: 'Baner → Aundh', fare: '₹92', distance: '4.1 km', status: 'Completed', date: 'Today, 12:40 PM' },
      { id: 'TRP-88170', route: 'Shivaji Nagar → Kothrud', fare: '₹165', distance: '8.6 km', status: 'Cancelled', date: 'Yesterday' },
    ],
    walletHistory: [
      { label: 'Trip payout · TRP-88214', amount: '+₹216', type: 'credit', time: '2:20 PM' },
      { label: 'Withdrawal request', amount: '-₹5,000', type: 'debit', time: '11:05 AM' },
      { label: 'Incentive · Peak hour', amount: '+₹150', type: 'credit', time: 'Yesterday' },
    ],
    recentActivity: [
      { text: 'Completed trip TRP-88214', time: '25 min ago' },
      { text: 'Went online in Hinjewadi zone', time: '3 hrs ago' },
      { text: 'Withdrawal of ₹5,000 initiated', time: 'Today, 11:05 AM' },
      { text: 'Insurance document re-verified', time: '2 days ago' },
    ],
  },
  {
    id: 'DRV-10491',
    name: 'Ananya Reddy',
    phone: '+91 91234 77821',
    email: 'ananya.reddy@carryoo.driver',
    vehicle: 'Auto · TS09 CD 2210',
    vehicleType: 'Auto',
    city: 'Hyderabad',
    rating: 4.6,
    wallet: 12200,
    status: 'Busy',
    trips: 892,
    todayEarnings: 3120,
    joined: '28 May 2024',
    initials: 'AR',
    accent: '#0ea5e9',
    gender: 'Female',
    experience: '1 yr 10 mo',
    completionRate: 94.1,
    acceptanceRate: 88.5,
    cancellationRate: 3.4,
    avgTripValue: '₹312',
    totalEarnings: '₹3.61L',
    documents: [
      { type: 'Aadhaar', number: 'XXXX-XXXX-2210', status: 'Verified', expiry: '—' },
      { type: 'Driving License', number: 'TS09 20220022108', status: 'Verified', expiry: '11 Nov 2027' },
      { type: 'RC', number: 'TS09CD2210', status: 'Pending', expiry: '—' },
      { type: 'Insurance', number: 'POL-441208', status: 'Verified', expiry: '15 Sep 2026' },
    ],
    vehicleDetails: {
      make: 'Bajaj',
      model: 'RE Compact',
      year: '2021',
      color: 'Yellow-Green',
      plate: 'TS09 CD 2210',
      insurance: 'Valid till Sep 2026',
      fitness: 'Valid till Dec 2026',
    },
    emergencyContact: {
      name: 'Ravi Reddy',
      relation: 'Brother',
      phone: '+91 91234 77822',
    },
    bankDetails: {
      accountName: 'Ananya Reddy',
      bank: 'ICICI Bank',
      accountNumber: '****9103',
      ifsc: 'ICIC0000456',
      upi: 'ananya@icici',
    },
    recentTrips: [
      { id: 'TRP-88301', route: 'Gachibowli → Madhapur', fare: '₹180', distance: '6.8 km', status: 'In Progress', date: 'Now' },
      { id: 'TRP-88277', route: 'Hitech City → Jubilee Hills', fare: '₹265', distance: '9.4 km', status: 'Completed', date: 'Today, 1:05 PM' },
      { id: 'TRP-88240', route: 'Secunderabad → Banjara Hills', fare: '₹340', distance: '12.1 km', status: 'Completed', date: 'Today, 10:22 AM' },
    ],
    walletHistory: [
      { label: 'Trip payout · TRP-88277', amount: '+₹238', type: 'credit', time: '1:12 PM' },
      { label: 'Trip payout · TRP-88240', amount: '+₹306', type: 'credit', time: '10:30 AM' },
      { label: 'Platform fee', amount: '-₹42', type: 'debit', time: 'Yesterday' },
    ],
    recentActivity: [
      { text: 'Accepted trip TRP-88301', time: '4 min ago' },
      { text: 'Status changed to Busy', time: '5 min ago' },
      { text: 'RC document pending re-upload', time: '1 day ago' },
    ],
  },
  {
    id: 'DRV-10503',
    name: 'Imran Qureshi',
    phone: '+91 99887 66554',
    email: 'imran.q@carryoo.driver',
    vehicle: 'Pickup · DL8C EF 7782',
    vehicleType: 'Pickup',
    city: 'Delhi',
    rating: 4.4,
    wallet: 5780,
    status: 'Offline',
    trips: 654,
    todayEarnings: 1560,
    joined: '03 Jan 2025',
    initials: 'IQ',
    accent: '#0284c7',
    gender: 'Male',
    experience: '1 yr 6 mo',
    completionRate: 92.8,
    acceptanceRate: 85.0,
    cancellationRate: 4.2,
    avgTripValue: '₹680',
    totalEarnings: '₹2.94L',
    documents: [
      { type: 'Aadhaar', number: 'XXXX-XXXX-7782', status: 'Verified', expiry: '—' },
      { type: 'Driving License', number: 'DL8C 20190077821', status: 'Verified', expiry: '22 Apr 2026' },
      { type: 'RC', number: 'DL8CEF7782', status: 'Verified', expiry: '—' },
      { type: 'PAN', number: 'XXXXX7782F', status: 'Pending', expiry: '—' },
    ],
    vehicleDetails: {
      make: 'Tata',
      model: 'Ace Gold',
      year: '2020',
      color: 'White',
      plate: 'DL8C EF 7782',
      insurance: 'Valid till Aug 2026',
      fitness: 'Valid till Oct 2026',
    },
    emergencyContact: {
      name: 'Farah Qureshi',
      relation: 'Sister',
      phone: '+91 99887 66555',
    },
    bankDetails: {
      accountName: 'Imran Qureshi',
      bank: 'SBI',
      accountNumber: '****3341',
      ifsc: 'SBIN0002781',
      upi: 'imranq@sbi',
    },
    recentTrips: [
      { id: 'TRP-87990', route: 'Okhla → Gurgaon', fare: '₹920', distance: '28.4 km', status: 'Completed', date: 'Yesterday' },
      { id: 'TRP-87912', route: 'Noida → Dwarka', fare: '₹780', distance: '22.0 km', status: 'Completed', date: '2 days ago' },
      { id: 'TRP-87880', route: 'Karol Bagh → Mayur Vihar', fare: '₹410', distance: '11.5 km', status: 'Cancelled', date: '3 days ago' },
    ],
    walletHistory: [
      { label: 'Trip payout · TRP-87990', amount: '+₹828', type: 'credit', time: 'Yesterday' },
      { label: 'Fuel incentive', amount: '+₹200', type: 'credit', time: '2 days ago' },
    ],
    recentActivity: [
      { text: 'Went offline after shift end', time: '6 hrs ago' },
      { text: 'Completed long-haul trip to Gurgaon', time: 'Yesterday' },
      { text: 'PAN verification still pending', time: '3 days ago' },
    ],
  },
  {
    id: 'DRV-10518',
    name: 'Lakshmi Iyer',
    phone: '+91 90012 33445',
    email: 'lakshmi.iyer@carryoo.driver',
    vehicle: 'Bike · TN10 GH 3344',
    vehicleType: 'Bike',
    city: 'Chennai',
    rating: 4.9,
    wallet: 9960,
    status: 'Online',
    trips: 1580,
    todayEarnings: 2680,
    joined: '19 Aug 2023',
    initials: 'LI',
    accent: '#059669',
    gender: 'Female',
    experience: '2 yrs 11 mo',
    completionRate: 98.2,
    acceptanceRate: 94.6,
    cancellationRate: 1.1,
    avgTripValue: '₹142',
    totalEarnings: '₹5.12L',
    documents: [
      { type: 'Aadhaar', number: 'XXXX-XXXX-3344', status: 'Verified', expiry: '—' },
      { type: 'Driving License', number: 'TN10 20200033441', status: 'Verified', expiry: '09 Jun 2029' },
      { type: 'RC', number: 'TN10GH3344', status: 'Verified', expiry: '—' },
      { type: 'Bank Proof', number: 'Passbook', status: 'Verified', expiry: '—' },
    ],
    vehicleDetails: {
      make: 'TVS',
      model: 'Jupiter',
      year: '2023',
      color: 'Matte Blue',
      plate: 'TN10 GH 3344',
      insurance: 'Valid till May 2027',
      fitness: 'Valid till Jul 2027',
    },
    emergencyContact: {
      name: 'Karthik Iyer',
      relation: 'Spouse',
      phone: '+91 90012 33446',
    },
    bankDetails: {
      accountName: 'Lakshmi Iyer',
      bank: 'Axis Bank',
      accountNumber: '****7720',
      ifsc: 'UTIB0001892',
      upi: 'lakshmi@axisbank',
    },
    recentTrips: [
      { id: 'TRP-88340', route: 'T Nagar → Adyar', fare: '₹128', distance: '7.2 km', status: 'Completed', date: 'Today, 3:02 PM' },
      { id: 'TRP-88322', route: 'Velachery → OMR', fare: '₹156', distance: '9.0 km', status: 'Completed', date: 'Today, 1:40 PM' },
      { id: 'TRP-88295', route: 'Anna Nagar → Egmore', fare: '₹98', distance: '5.4 km', status: 'Completed', date: 'Today, 11:15 AM' },
    ],
    walletHistory: [
      { label: 'Trip payout · TRP-88340', amount: '+₹115', type: 'credit', time: '3:08 PM' },
      { label: 'Weekly bonus', amount: '+₹500', type: 'credit', time: 'Mon' },
      { label: 'Withdrawal completed', amount: '-₹8,000', type: 'debit', time: 'Sun' },
    ],
    recentActivity: [
      { text: 'Earned 4.9★ from customer Meera N.', time: '20 min ago' },
      { text: 'Completed 3 trips today', time: '1 hr ago' },
      { text: 'Qualified for weekend incentive tier', time: '2 days ago' },
    ],
  },
  {
    id: 'DRV-10527',
    name: 'Ramesh Kumar',
    phone: '+91 98111 22334',
    email: 'ramesh.k@carryoo.driver',
    vehicle: 'Mini Truck · KA03 JK 5566',
    vehicleType: 'Mini Truck',
    city: 'Bengaluru',
    rating: 4.2,
    wallet: 3120,
    status: 'Suspended',
    trips: 421,
    todayEarnings: 0,
    joined: '07 Nov 2024',
    initials: 'RK',
    accent: '#dc2626',
    gender: 'Male',
    experience: '8 mo',
    completionRate: 86.5,
    acceptanceRate: 72.0,
    cancellationRate: 9.8,
    avgTripValue: '₹890',
    totalEarnings: '₹1.48L',
    documents: [
      { type: 'Aadhaar', number: 'XXXX-XXXX-5566', status: 'Verified', expiry: '—' },
      { type: 'Driving License', number: 'KA03 20180055661', status: 'Expired', expiry: '14 Feb 2026' },
      { type: 'RC', number: 'KA03JK5566', status: 'Verified', expiry: '—' },
      { type: 'Insurance', number: 'POL-229011', status: 'Rejected', expiry: '—' },
    ],
    vehicleDetails: {
      make: 'Mahindra',
      model: 'Bolero Pickup',
      year: '2019',
      color: 'Silver',
      plate: 'KA03 JK 5566',
      insurance: 'Rejected — renewal required',
      fitness: 'Valid till Apr 2026',
    },
    emergencyContact: {
      name: 'Sunita Kumar',
      relation: 'Spouse',
      phone: '+91 98111 22335',
    },
    bankDetails: {
      accountName: 'Ramesh Kumar',
      bank: 'Canara Bank',
      accountNumber: '****1098',
      ifsc: 'CNRB0002214',
      upi: 'rameshk@canara',
    },
    recentTrips: [
      { id: 'TRP-87110', route: 'Whitefield → Electronic City', fare: '₹1,240', distance: '31.2 km', status: 'Cancelled', date: '5 days ago' },
      { id: 'TRP-87088', route: 'Peenya → Yeshwanthpur', fare: '₹420', distance: '8.5 km', status: 'Completed', date: '6 days ago' },
    ],
    walletHistory: [
      { label: 'Penalty · Multiple cancellations', amount: '-₹500', type: 'debit', time: '4 days ago' },
      { label: 'Trip payout · TRP-87088', amount: '+₹378', type: 'credit', time: '6 days ago' },
    ],
    recentActivity: [
      { text: 'Account suspended — expired DL & insurance', time: '3 days ago' },
      { text: 'Support ticket TKT-4408 opened', time: '3 days ago' },
      { text: 'Insurance document rejected', time: '4 days ago' },
    ],
  },
  {
    id: 'DRV-10534',
    name: 'Neha Deshmukh',
    phone: '+91 97654 88990',
    email: 'neha.d@carryoo.driver',
    vehicle: 'Bike · MH02 LM 8812',
    vehicleType: 'Bike',
    city: 'Mumbai',
    rating: 4.7,
    wallet: 15480,
    status: 'Busy',
    trips: 2104,
    todayEarnings: 4210,
    joined: '14 Feb 2023',
    initials: 'ND',
    accent: '#2563eb',
    gender: 'Female',
    experience: '3 yrs 5 mo',
    completionRate: 97.0,
    acceptanceRate: 93.1,
    cancellationRate: 1.6,
    avgTripValue: '₹168',
    totalEarnings: '₹7.84L',
    documents: [
      { type: 'Aadhaar', number: 'XXXX-XXXX-8812', status: 'Verified', expiry: '—' },
      { type: 'Driving License', number: 'MH02 20210088129', status: 'Verified', expiry: '30 Dec 2028' },
      { type: 'RC', number: 'MH02LM8812', status: 'Verified', expiry: '—' },
      { type: 'Insurance', number: 'POL-661204', status: 'Verified', expiry: '08 Mar 2027' },
    ],
    vehicleDetails: {
      make: 'Hero',
      model: 'Pleasure+',
      year: '2022',
      color: 'Candy Red',
      plate: 'MH02 LM 8812',
      insurance: 'Valid till Mar 2027',
      fitness: 'Valid till May 2027',
    },
    emergencyContact: {
      name: 'Amit Deshmukh',
      relation: 'Spouse',
      phone: '+91 97654 88991',
    },
    bankDetails: {
      accountName: 'Neha Deshmukh',
      bank: 'HDFC Bank',
      accountNumber: '****4821',
      ifsc: 'HDFC0000912',
      upi: 'neha@oksbi',
    },
    recentTrips: [
      { id: 'TRP-88355', route: 'Andheri → Bandra', fare: '₹210', distance: '8.8 km', status: 'In Progress', date: 'Now' },
      { id: 'TRP-88331', route: 'Powai → Lower Parel', fare: '₹290', distance: '13.4 km', status: 'Completed', date: 'Today, 12:50 PM' },
      { id: 'TRP-88300', route: 'Dadar → Worli', fare: '₹145', distance: '5.9 km', status: 'Completed', date: 'Today, 10:05 AM' },
    ],
    walletHistory: [
      { label: 'Trip payout · TRP-88331', amount: '+₹261', type: 'credit', time: '1:00 PM' },
      { label: 'Withdrawal completed', amount: '-₹12,200', type: 'debit', time: '1 hr ago' },
    ],
    recentActivity: [
      { text: 'On trip CRY-92841 (Andheri → Bandra)', time: 'Just now' },
      { text: 'Withdrawal WD-7718 completed', time: '1 hr ago' },
      { text: 'Hit 2,100 career trips milestone', time: 'Yesterday' },
    ],
  },
  {
    id: 'DRV-10541',
    name: 'Arjun Menon',
    phone: '+91 98989 44556',
    email: 'arjun.menon@carryoo.driver',
    vehicle: 'Tempo · KL07 NP 1122',
    vehicleType: 'Tempo',
    city: 'Kochi',
    rating: 4.5,
    wallet: 6780,
    status: 'Online',
    trips: 538,
    todayEarnings: 1980,
    joined: '22 Jun 2024',
    initials: 'AM',
    accent: '#0284c7',
    gender: 'Male',
    experience: '1 yr 1 mo',
    completionRate: 93.6,
    acceptanceRate: 87.4,
    cancellationRate: 3.0,
    avgTripValue: '₹740',
    totalEarnings: '₹2.21L',
    documents: [
      { type: 'Aadhaar', number: 'XXXX-XXXX-1122', status: 'Verified', expiry: '—' },
      { type: 'Driving License', number: 'KL07 20170011228', status: 'Verified', expiry: '19 Oct 2027' },
      { type: 'RC', number: 'KL07NP1122', status: 'Verified', expiry: '—' },
      { type: 'Insurance', number: 'POL-118822', status: 'Pending', expiry: '—' },
    ],
    vehicleDetails: {
      make: 'Force',
      model: 'Traveller',
      year: '2021',
      color: 'White',
      plate: 'KL07 NP 1122',
      insurance: 'Pending renewal upload',
      fitness: 'Valid till Sep 2026',
    },
    emergencyContact: {
      name: 'Divya Menon',
      relation: 'Spouse',
      phone: '+91 98989 44557',
    },
    bankDetails: {
      accountName: 'Arjun Menon',
      bank: 'Federal Bank',
      accountNumber: '****5502',
      ifsc: 'FDRL0001456',
      upi: 'arjun@oksbi',
    },
    recentTrips: [
      { id: 'TRP-88260', route: 'Edappally → Infopark', fare: '₹680', distance: '16.5 km', status: 'Completed', date: 'Today, 9:40 AM' },
      { id: 'TRP-88201', route: 'Fort Kochi → Kakkanad', fare: '₹820', distance: '19.8 km', status: 'Completed', date: 'Yesterday' },
    ],
    walletHistory: [
      { label: 'Trip payout · TRP-88260', amount: '+₹612', type: 'credit', time: '9:50 AM' },
      { label: 'Withdrawal completed', amount: '-₹5,780', type: 'debit', time: '2 hrs ago' },
    ],
    recentActivity: [
      { text: 'Went online near Infopark', time: '45 min ago' },
      { text: 'Insurance renewal reminder sent', time: 'Yesterday' },
    ],
  },
  {
    id: 'DRV-10555',
    name: 'Suresh Patil',
    phone: '+91 97000 11223',
    email: 'suresh.patil@carryoo.driver',
    vehicle: 'Bike · MH14 QR 6677',
    vehicleType: 'Bike',
    city: 'Pune',
    rating: 4.3,
    wallet: 1890,
    status: 'Offline',
    trips: 214,
    todayEarnings: 420,
    joined: '05 Jul 2025',
    initials: 'SP',
    accent: '#64748b',
    gender: 'Male',
    experience: '1 mo',
    completionRate: 90.2,
    acceptanceRate: 82.0,
    cancellationRate: 5.5,
    avgTripValue: '₹155',
    totalEarnings: '₹28.4K',
    documents: [
      { type: 'Aadhaar', number: 'XXXX-XXXX-6677', status: 'Pending', expiry: '—' },
      { type: 'Driving License', number: 'MH14 20240066771', status: 'Pending', expiry: '21 Jan 2030' },
      { type: 'RC', number: 'MH14QR6677', status: 'Verified', expiry: '—' },
      { type: 'Photo', number: 'Selfie KYC', status: 'Verified', expiry: '—' },
    ],
    vehicleDetails: {
      make: 'Honda',
      model: 'Dio',
      year: '2024',
      color: 'Black',
      plate: 'MH14 QR 6677',
      insurance: 'Valid till Jul 2027',
      fitness: 'Valid till Jul 2027',
    },
    emergencyContact: {
      name: 'Mahesh Patil',
      relation: 'Father',
      phone: '+91 97000 11224',
    },
    bankDetails: {
      accountName: 'Suresh Patil',
      bank: 'Bank of Maharashtra',
      accountNumber: '****8834',
      ifsc: 'MAHB0000321',
      upi: 'sureshpatil@upi',
    },
    recentTrips: [
      { id: 'TRP-88012', route: 'Hadapsar → Magarpatta', fare: '₹78', distance: '3.2 km', status: 'Completed', date: '2 days ago' },
      { id: 'TRP-87980', route: 'Kharadi → Viman Nagar', fare: '₹95', distance: '4.0 km', status: 'Completed', date: '3 days ago' },
    ],
    walletHistory: [
      { label: 'Trip payout · TRP-88012', amount: '+₹70', type: 'credit', time: '2 days ago' },
      { label: 'Signup bonus', amount: '+₹500', type: 'credit', time: '1 mo ago' },
    ],
    recentActivity: [
      { text: 'Submitted Aadhaar & DL for verification', time: '2 hrs ago' },
      { text: 'Account in onboarding review', time: 'Yesterday' },
    ],
  },
  {
    id: 'DRV-10562',
    name: 'Pooja Verma',
    phone: '+91 96543 22110',
    email: 'pooja.verma@carryoo.driver',
    vehicle: 'Auto · UP32 ST 9901',
    vehicleType: 'Auto',
    city: 'Lucknow',
    rating: 4.1,
    wallet: 420,
    status: 'Suspended',
    trips: 367,
    todayEarnings: 0,
    joined: '11 Sep 2024',
    initials: 'PV',
    accent: '#dc2626',
    gender: 'Female',
    experience: '10 mo',
    completionRate: 88.0,
    acceptanceRate: 79.5,
    cancellationRate: 7.2,
    avgTripValue: '₹220',
    totalEarnings: '₹98.6K',
    documents: [
      { type: 'Aadhaar', number: 'XXXX-XXXX-9901', status: 'Verified', expiry: '—' },
      { type: 'Driving License', number: 'UP32 20190099018', status: 'Verified', expiry: '04 May 2027' },
      { type: 'RC', number: 'UP32ST9901', status: 'Rejected', expiry: '—' },
      { type: 'Insurance', number: 'POL-990112', status: 'Expired', expiry: '01 Jun 2026' },
    ],
    vehicleDetails: {
      make: 'Piaggio',
      model: 'Ape Auto',
      year: '2018',
      color: 'Yellow',
      plate: 'UP32 ST 9901',
      insurance: 'Expired Jun 2026',
      fitness: 'Expired — renewal needed',
    },
    emergencyContact: {
      name: 'Rajesh Verma',
      relation: 'Brother',
      phone: '+91 96543 22111',
    },
    bankDetails: {
      accountName: 'Pooja Verma',
      bank: 'ICICI Bank',
      accountNumber: '****9103',
      ifsc: 'ICIC0000789',
      upi: 'pooja@icici',
    },
    recentTrips: [
      { id: 'TRP-86820', route: 'Hazratganj → Gomti Nagar', fare: '₹180', distance: '7.5 km', status: 'Cancelled', date: '1 week ago' },
      { id: 'TRP-86790', route: 'Aliganj → Aminabad', fare: '₹140', distance: '5.8 km', status: 'Completed', date: '1 week ago' },
    ],
    walletHistory: [
      { label: 'Failed withdrawal WD-7705', amount: '₹9,960', type: 'debit', time: '4 hrs ago' },
      { label: 'Account hold · Compliance', amount: '-₹0', type: 'debit', time: '5 days ago' },
    ],
    recentActivity: [
      { text: 'Withdrawal WD-7705 failed — account on hold', time: '4 hrs ago' },
      { text: 'Suspended for expired vehicle fitness', time: '5 days ago' },
      { text: 'RC document rejected by ops', time: '6 days ago' },
    ],
  },
  {
    id: 'DRV-10570',
    name: 'Farhan Ali',
    phone: '+91 93322 77889',
    email: 'farhan.ali@carryoo.driver',
    vehicle: 'Pickup · WB06 UV 4455',
    vehicleType: 'Pickup',
    city: 'Kolkata',
    rating: 4.6,
    wallet: 7340,
    status: 'Online',
    trips: 712,
    todayEarnings: 2340,
    joined: '30 Apr 2024',
    initials: 'FA',
    accent: '#0ea5e9',
    gender: 'Male',
    experience: '2 yrs 2 mo',
    completionRate: 95.0,
    acceptanceRate: 89.8,
    cancellationRate: 2.8,
    avgTripValue: '₹540',
    totalEarnings: '₹3.05L',
    documents: [
      { type: 'Aadhaar', number: 'XXXX-XXXX-4455', status: 'Verified', expiry: '—' },
      { type: 'Driving License', number: 'WB06 20180044552', status: 'Verified', expiry: '16 Jul 2028' },
      { type: 'RC', number: 'WB06UV4455', status: 'Verified', expiry: '—' },
      { type: 'Insurance', number: 'POL-445512', status: 'Verified', expiry: '12 Nov 2026' },
    ],
    vehicleDetails: {
      make: 'Ashok Leyland',
      model: 'Dost+',
      year: '2021',
      color: 'Blue',
      plate: 'WB06 UV 4455',
      insurance: 'Valid till Nov 2026',
      fitness: 'Valid till Jan 2027',
    },
    emergencyContact: {
      name: 'Nazia Ali',
      relation: 'Spouse',
      phone: '+91 93322 77890',
    },
    bankDetails: {
      accountName: 'Farhan Ali',
      bank: 'UCO Bank',
      accountNumber: '****2267',
      ifsc: 'UCBA0001234',
      upi: 'farhan@upi',
    },
    recentTrips: [
      { id: 'TRP-88310', route: 'Salt Lake → Howrah', fare: '₹520', distance: '14.0 km', status: 'Completed', date: 'Today, 11:30 AM' },
      { id: 'TRP-88250', route: 'Park Street → New Town', fare: '₹610', distance: '17.2 km', status: 'Completed', date: 'Yesterday' },
    ],
    walletHistory: [
      { label: 'Trip payout · TRP-88310', amount: '+₹468', type: 'credit', time: '11:40 AM' },
      { label: 'Document upload bonus', amount: '+₹100', type: 'credit', time: 'Mon' },
    ],
    recentActivity: [
      { text: 'Available in Salt Lake zone', time: '30 min ago' },
      { text: 'Support ticket TKT-4401 resolved', time: 'Yesterday' },
    ],
  },
]

export const driverCities = ['All Cities', 'Pune', 'Hyderabad', 'Delhi', 'Chennai', 'Bengaluru', 'Mumbai', 'Kochi', 'Lucknow', 'Kolkata']
export const driverStatuses: Array<'All Status' | DriverStatus> = [
  'All Status',
  'New',
  'Pending KYC',
  'Online',
  'Busy',
  'Offline',
  'Suspended',
]
export const vehicleTypes = ['All Vehicles', 'Bike', 'Auto', 'Pickup', 'Mini Truck', 'Tempo']
