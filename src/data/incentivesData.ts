export type IncentiveType =
  | 'Peak Hour'
  | 'Weekend'
  | 'Festival'
  | 'Rain'
  | 'Trip Target'

export type IncentiveStatus = 'Active' | 'Scheduled' | 'Ended'

export interface Incentive {
  id: string
  name: string
  type: IncentiveType
  city: string
  vehicle: string
  driversAssigned: number
  bonusAmount: number
  status: IncentiveStatus
  period: string
  description: string
  targetTrips?: number
  assignedDrivers: string[]
}

export const incentiveTypes: (IncentiveType | 'All Types')[] = [
  'All Types',
  'Peak Hour',
  'Weekend',
  'Festival',
  'Rain',
  'Trip Target',
]

export const incentiveStatuses: (IncentiveStatus | 'All Status')[] = [
  'All Status',
  'Active',
  'Scheduled',
  'Ended',
]

export const incentiveCities = [
  'All Cities',
  'Mumbai',
  'Delhi',
  'Bengaluru',
  'Hyderabad',
  'Pune',
  'Chennai',
  'Kolkata',
]

export const incentiveVehicles = [
  'All Vehicles',
  'Bike',
  'Auto',
  'Pickup',
  'Mini Truck',
  'Tempo',
]

export const incentives: Incentive[] = [
  {
    id: 'INC-2401',
    name: 'Mumbai Evening Rush',
    type: 'Peak Hour',
    city: 'Mumbai',
    vehicle: 'Bike',
    driversAssigned: 142,
    bonusAmount: 150,
    status: 'Active',
    period: 'Mon–Fri · 5:00 PM – 9:00 PM',
    description: 'Extra ₹150 per completed trip during evening peak in South Mumbai zones.',
    assignedDrivers: ['Vikram Joshi', 'Rahul Sharma', 'Amit Patel', 'Suresh Kumar'],
  },
  {
    id: 'INC-2402',
    name: 'Delhi Weekend Surge',
    type: 'Weekend',
    city: 'Delhi',
    vehicle: 'Auto',
    driversAssigned: 89,
    bonusAmount: 200,
    status: 'Active',
    period: 'Sat–Sun · All day',
    description: 'Weekend bonus for auto drivers completing 8+ trips per day.',
    assignedDrivers: ['Rajesh Verma', 'Deepak Singh', 'Manoj Yadav'],
  },
  {
    id: 'INC-2403',
    name: 'Diwali Festival Bonus',
    type: 'Festival',
    city: 'Bengaluru',
    vehicle: 'Pickup',
    driversAssigned: 56,
    bonusAmount: 500,
    status: 'Scheduled',
    period: 'Oct 28 – Nov 3',
    description: 'Festival incentive for pickup drivers during Diwali week deliveries.',
    assignedDrivers: ['Karthik Reddy', 'Prakash Nair', 'Sunil Rao'],
  },
  {
    id: 'INC-2404',
    name: 'Hyderabad Rain Shield',
    type: 'Rain',
    city: 'Hyderabad',
    vehicle: 'Bike',
    driversAssigned: 118,
    bonusAmount: 100,
    status: 'Active',
    period: 'Active during rain alerts',
    description: '₹100 bonus per trip when IMD rain alert is active in Hyderabad.',
    assignedDrivers: ['Arjun Desai', 'Nikhil Gupta', 'Vivek Mehta', 'Ravi Teja'],
  },
  {
    id: 'INC-2405',
    name: 'Pune 20-Trip Target',
    type: 'Trip Target',
    city: 'Pune',
    vehicle: 'Mini Truck',
    driversAssigned: 34,
    bonusAmount: 800,
    status: 'Active',
    period: 'Jul 1 – Jul 31',
    description: 'Complete 20 trips in a week to earn ₹800 flat bonus.',
    targetTrips: 20,
    assignedDrivers: ['Sandeep Kulkarni', 'Anil Deshmukh'],
  },
  {
    id: 'INC-2406',
    name: 'Chennai Morning Peak',
    type: 'Peak Hour',
    city: 'Chennai',
    vehicle: 'Auto',
    driversAssigned: 67,
    bonusAmount: 120,
    status: 'Scheduled',
    period: 'Aug 1 – Aug 31 · 7:00 AM – 10:00 AM',
    description: 'Morning commute incentive for OMR and Anna Nagar corridors.',
    assignedDrivers: ['Murugan S', 'Senthil Kumar', 'Balaji R'],
  },
  {
    id: 'INC-2407',
    name: 'Kolkata Monsoon Relief',
    type: 'Rain',
    city: 'Kolkata',
    vehicle: 'Tempo',
    driversAssigned: 41,
    bonusAmount: 250,
    status: 'Ended',
    period: 'Jun 15 – Jun 30',
    description: 'Monsoon delivery bonus for tempo drivers in Salt Lake and Howrah.',
    assignedDrivers: ['Subhash Das', 'Amit Banerjee'],
  },
  {
    id: 'INC-2408',
    name: 'Mumbai 15-Trip Sprint',
    type: 'Trip Target',
    city: 'Mumbai',
    vehicle: 'Bike',
    driversAssigned: 203,
    bonusAmount: 600,
    status: 'Active',
    period: 'Jul 7 – Jul 20',
    description: 'Hit 15 trips in 3 days for a ₹600 completion bonus.',
    targetTrips: 15,
    assignedDrivers: ['Vikram Joshi', 'Rahul Sharma', 'Priya Nair', 'Kiran Shah'],
  },
  {
    id: 'INC-2409',
    name: 'Independence Day Special',
    type: 'Festival',
    city: 'Delhi',
    vehicle: 'Bike',
    driversAssigned: 175,
    bonusAmount: 300,
    status: 'Scheduled',
    period: 'Aug 15',
    description: 'One-day national holiday bonus for all active bike partners.',
    assignedDrivers: ['Rajesh Verma', 'Deepak Singh', 'Neha Kapoor'],
  },
  {
    id: 'INC-2410',
    name: 'Bengaluru Weekend Bike',
    type: 'Weekend',
    city: 'Bengaluru',
    vehicle: 'Bike',
    driversAssigned: 94,
    bonusAmount: 175,
    status: 'Ended',
    period: 'Jun 1 – Jun 30',
    description: 'Weekend flat bonus for bike drivers in Whitefield and Koramangala.',
    assignedDrivers: ['Karthik Reddy', 'Ananya Iyer'],
  },
]
