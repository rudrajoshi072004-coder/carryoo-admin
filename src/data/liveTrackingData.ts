import { fetchLiveTrackingAdmin } from '../api/services/adminData'

export type LiveDriverStatus = 'Online' | 'Busy' | 'Offline'
export type NetworkSignal = '4G' | '5G' | 'Weak'

export interface LiveDriverRoute {
  pickup: string
  drop: string
}

export interface LiveDriver {
  id: string
  name: string
  vehicle: string
  vehicleType: string
  status: LiveDriverStatus
  lat: number
  lng: number
  speed: number
  battery: number
  network: NetworkSignal
  eta: string
  currentTrip: string | null
  route: LiveDriverRoute | null
  city: string
  initials: string
  phone: string
}

export const liveTrackingCities = [
  'All Cities',
  'Mumbai',
  'Pune',
  'Bengaluru',
  'Delhi',
  'Hyderabad',
  'Chennai',
  'Kolkata',
  'Kochi',
]

export const liveTrackingStatuses: Array<'All Status' | LiveDriverStatus> = [
  'All Status',
  'Online',
  'Busy',
  'Offline',
]

export const liveTrackingVehicles = [
  'All Vehicles',
  'Bike',
  'Auto',
  'Pickup',
  'Mini Truck',
  'Tempo',
]

export const liveDrivers: LiveDriver[] = [
  {
    id: 'DRV-10482',
    name: 'Vikram Joshi',
    vehicle: 'MH12 AB 4491',
    vehicleType: 'Bike',
    status: 'Busy',
    lat: 62,
    lng: 38,
    speed: 34,
    battery: 78,
    network: '5G',
    eta: '12 min',
    currentTrip: 'TRP-88388',
    route: { pickup: 'Koregaon Park, Pune', drop: 'Hinjewadi Phase 2' },
    city: 'Pune',
    initials: 'VJ',
    phone: '+91 98765 41230',
  },
  {
    id: 'DRV-10491',
    name: 'Ananya Reddy',
    vehicle: 'TS09 CD 2210',
    vehicleType: 'Auto',
    status: 'Busy',
    lat: 44,
    lng: 72,
    speed: 22,
    battery: 64,
    network: '4G',
    eta: '8 min',
    currentTrip: 'TRP-88391',
    route: { pickup: 'Gachibowli, Hyderabad', drop: 'Madhapur Metro' },
    city: 'Hyderabad',
    initials: 'AR',
    phone: '+91 91234 77821',
  },
  {
    id: 'DRV-10503',
    name: 'Imran Qureshi',
    vehicle: 'DL8C EF 7782',
    vehicleType: 'Pickup',
    status: 'Offline',
    lat: 28,
    lng: 55,
    speed: 0,
    battery: 41,
    network: 'Weak',
    eta: '—',
    currentTrip: null,
    route: null,
    city: 'Delhi',
    initials: 'IQ',
    phone: '+91 99887 66554',
  },
  {
    id: 'DRV-10518',
    name: 'Lakshmi Iyer',
    vehicle: 'TN10 GH 3344',
    vehicleType: 'Bike',
    status: 'Online',
    lat: 71,
    lng: 81,
    speed: 0,
    battery: 92,
    network: '5G',
    eta: '—',
    currentTrip: null,
    route: null,
    city: 'Chennai',
    initials: 'LI',
    phone: '+91 90012 33445',
  },
  {
    id: 'DRV-10534',
    name: 'Neha Deshmukh',
    vehicle: 'MH02 LM 8812',
    vehicleType: 'Bike',
    status: 'Busy',
    lat: 55,
    lng: 22,
    speed: 28,
    battery: 55,
    network: '4G',
    eta: '6 min',
    currentTrip: 'TRP-88355',
    route: { pickup: 'Andheri East, Mumbai', drop: 'Bandra Kurla Complex' },
    city: 'Mumbai',
    initials: 'ND',
    phone: '+91 97654 88990',
  },
  {
    id: 'DRV-10541',
    name: 'Arjun Menon',
    vehicle: 'KL07 NP 1122',
    vehicleType: 'Tempo',
    status: 'Online',
    lat: 82,
    lng: 48,
    speed: 0,
    battery: 88,
    network: '4G',
    eta: '—',
    currentTrip: null,
    route: null,
    city: 'Kochi',
    initials: 'AM',
    phone: '+91 98989 44556',
  },
  {
    id: 'DRV-10555',
    name: 'Suresh Patil',
    vehicle: 'MH14 QR 6677',
    vehicleType: 'Bike',
    status: 'Offline',
    lat: 58,
    lng: 42,
    speed: 0,
    battery: 23,
    network: 'Weak',
    eta: '—',
    currentTrip: null,
    route: null,
    city: 'Pune',
    initials: 'SP',
    phone: '+91 97000 11223',
  },
  {
    id: 'DRV-10570',
    name: 'Farhan Ali',
    vehicle: 'WB06 UV 4455',
    vehicleType: 'Pickup',
    status: 'Busy',
    lat: 36,
    lng: 88,
    speed: 18,
    battery: 71,
    network: '4G',
    eta: '19 min',
    currentTrip: 'TRP-88402',
    route: { pickup: 'Salt Lake Sector V', drop: 'Howrah Station' },
    city: 'Kolkata',
    initials: 'FA',
    phone: '+91 93322 77889',
  },
  {
    id: 'DRV-10588',
    name: 'Priya Nair',
    vehicle: 'KA03 JK 9921',
    vehicleType: 'Mini Truck',
    status: 'Busy',
    lat: 48,
    lng: 64,
    speed: 42,
    battery: 67,
    network: '5G',
    eta: '24 min',
    currentTrip: 'TRP-88410',
    route: { pickup: 'Whitefield, Bengaluru', drop: 'Electronic City Phase 1' },
    city: 'Bengaluru',
    initials: 'PN',
    phone: '+91 98450 11223',
  },
  {
    id: 'DRV-10592',
    name: 'Rajesh Gupta',
    vehicle: 'DL1C GH 3340',
    vehicleType: 'Auto',
    status: 'Online',
    lat: 32,
    lng: 48,
    speed: 0,
    battery: 84,
    network: '5G',
    eta: '—',
    currentTrip: null,
    route: null,
    city: 'Delhi',
    initials: 'RG',
    phone: '+91 98100 44556',
  },
]

export async function fetchLiveTracking() {
  return fetchLiveTrackingAdmin()
}
