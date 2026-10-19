export interface CityOption {
  id: string
  name: string
  state: string
  center: [number, number]
  zoom: number
  bounds?: [[number, number], [number, number]]
  description: string
}

export const SUPPORTED_CITIES: CityOption[] = [
  {
    id: 'Nashik',
    name: 'Nashik',
    state: 'Maharashtra',
    center: [19.9975, 73.7898],
    zoom: 13,
    bounds: [
      [19.8900, 73.6600],
      [20.0900, 73.8900],
    ],
    description: 'Carryoo Primary Logistics Operations District',
  },
  {
    id: 'Pune',
    name: 'Pune',
    state: 'Maharashtra',
    center: [18.5204, 73.8567],
    zoom: 12,
    bounds: [
      [18.4200, 73.7100],
      [18.6600, 73.9800],
    ],
    description: 'Industrial & IT Corridor (Hinjawadi, Magarpatta, MIDC)',
  },
  {
    id: 'Mumbai',
    name: 'Mumbai',
    state: 'Maharashtra',
    center: [19.0760, 72.8777],
    zoom: 11,
    bounds: [
      [18.9000, 72.7800],
      [19.2800, 73.0500],
    ],
    description: 'Metropolitan MMR Logistics & Port Corridor',
  },
  {
    id: 'Chhatrapati Sambhaji Nagar',
    name: 'Chhatrapati Sambhaji Nagar',
    state: 'Maharashtra',
    center: [19.8762, 75.3433],
    zoom: 13,
    bounds: [
      [19.8100, 75.2500],
      [19.9500, 75.4400],
    ],
    description: 'Marathwada Manufacturing Hub (Waluj & Shendra MIDC)',
  },
  {
    id: 'Nagpur',
    name: 'Nagpur',
    state: 'Maharashtra',
    center: [21.1458, 79.0882],
    zoom: 12,
    bounds: [
      [21.0500, 79.0000],
      [21.2500, 79.1800],
    ],
    description: 'Central India Logistics & Multi-modal Cargo Hub',
  },
]

export interface ZonalDriver {
  id: string
  name: string
  phone: string
  city: string
  lat: number
  lng: number
  status: 'Online' | 'Busy' | 'Offline'
  vehicleType: 'Tata Ace' | 'Pickup 8ft' | '3-Wheeler Auto' | '2-Wheeler' | 'Electric Tempo'
  vehicleNumber: string
  speedKmph: number
  batteryPct: number
  isAvailable: boolean
  currentTripId?: string | null
  lastUpdated: string
}

// Initial realistic zones across cities
export const INITIAL_PRESET_ZONES = [
  {
    id: 'zone-nsk-core',
    city_name: 'Nashik',
    zone_name: 'Nashik Metropolitan Core',
    dispatch_radius_km: '5.5',
    service_radius_km: '45.0',
    active: true,
    color: '#3b82f6',
    polygon_coordinates: [
      [19.9650, 73.7500],
      [20.0350, 73.7400],
      [20.0450, 73.8300],
      [19.9650, 73.8350],
      [19.9650, 73.7500],
    ],
  },
  {
    id: 'zone-nsk-ambad',
    city_name: 'Nashik',
    zone_name: 'Satpur & Ambad Industrial MIDC',
    dispatch_radius_km: '7.0',
    service_radius_km: '55.0',
    active: true,
    color: '#10b981',
    polygon_coordinates: [
      [19.9350, 73.6950],
      [19.9950, 73.7050],
      [19.9800, 73.7550],
      [19.9250, 73.7450],
      [19.9350, 73.6950],
    ],
  },
  {
    id: 'zone-nsk-panchavati',
    city_name: 'Nashik',
    zone_name: 'Panchavati Northern Hub',
    dispatch_radius_km: '5.0',
    service_radius_km: '40.0',
    active: true,
    color: '#8b5cf6',
    polygon_coordinates: [
      [20.0050, 73.7850],
      [20.0550, 73.7800],
      [20.0600, 73.8450],
      [20.0050, 73.8400],
      [20.0050, 73.7850],
    ],
  },
  {
    id: 'zone-pune-hinjawadi',
    city_name: 'Pune',
    zone_name: 'Hinjawadi IT & Wakad Cluster',
    dispatch_radius_km: '6.5',
    service_radius_km: '50.0',
    active: true,
    color: '#06b6d4',
    polygon_coordinates: [
      [18.5700, 73.7100],
      [18.6250, 73.7200],
      [18.6150, 73.7800],
      [18.5600, 73.7650],
      [18.5700, 73.7100],
    ],
  },
  {
    id: 'zone-mum-andheri',
    city_name: 'Mumbai',
    zone_name: 'Andheri East & Airport Logistics Hub',
    dispatch_radius_km: '6.0',
    service_radius_km: '40.0',
    active: true,
    color: '#f59e0b',
    polygon_coordinates: [
      [19.0950, 72.8450],
      [19.1450, 72.8500],
      [19.1400, 72.9050],
      [19.0900, 72.8950],
      [19.0950, 72.8450],
    ],
  },
]

// Realistic geographic driver positions across cities
export const INITIAL_FLEET_DRIVERS: ZonalDriver[] = [
  // --- NASHIK FLEET ---
  {
    id: 'DRV-NSK-101',
    name: 'Ramesh Patil',
    phone: '+91 98220 11223',
    city: 'Nashik',
    lat: 20.0063,
    lng: 73.7629, // College Road
    status: 'Online',
    vehicleType: 'Tata Ace',
    vehicleNumber: 'MH 15 EF 2910',
    speedKmph: 22,
    batteryPct: 88,
    isAvailable: true,
    lastUpdated: '1 min ago',
  },
  {
    id: 'DRV-NSK-102',
    name: 'Sachin Jadhav',
    phone: '+91 98221 44556',
    city: 'Nashik',
    lat: 20.0125,
    lng: 73.7915, // Panchavati
    status: 'Online',
    vehicleType: 'Pickup 8ft',
    vehicleNumber: 'MH 15 AB 4491',
    speedKmph: 0,
    batteryPct: 94,
    isAvailable: true,
    lastUpdated: 'Just now',
  },
  {
    id: 'DRV-NSK-103',
    name: 'Vikram Shinde',
    phone: '+91 98222 77889',
    city: 'Nashik',
    lat: 19.9882,
    lng: 73.8055, // Dwarka Circle
    status: 'Busy',
    vehicleType: '3-Wheeler Auto',
    vehicleNumber: 'MH 15 TR 7120',
    speedKmph: 34,
    batteryPct: 62,
    isAvailable: false,
    currentTripId: 'BK-NSK-9041',
    lastUpdated: '2 min ago',
  },
  {
    id: 'DRV-NSK-104',
    name: 'Ganesh More',
    phone: '+91 98223 99001',
    city: 'Nashik',
    lat: 19.9856,
    lng: 73.7314, // Satpur MIDC
    status: 'Online',
    vehicleType: 'Electric Tempo',
    vehicleNumber: 'MH 15 EV 8802',
    speedKmph: 18,
    batteryPct: 76,
    isAvailable: true,
    lastUpdated: '3 min ago',
  },
  {
    id: 'DRV-NSK-105',
    name: 'Kiran Sonawane',
    phone: '+91 98224 22334',
    city: 'Nashik',
    lat: 19.9537,
    lng: 73.7335, // Ambad MIDC
    status: 'Online',
    vehicleType: 'Tata Ace',
    vehicleNumber: 'MH 15 GH 1198',
    speedKmph: 0,
    batteryPct: 82,
    isAvailable: true,
    lastUpdated: '1 min ago',
  },
  {
    id: 'DRV-NSK-106',
    name: 'Nitin Deshmukh',
    phone: '+91 98225 55667',
    city: 'Nashik',
    lat: 19.9542,
    lng: 73.8341, // Nashik Road Bytco
    status: 'Online',
    vehicleType: 'Pickup 8ft',
    vehicleNumber: 'MH 15 DC 6632',
    speedKmph: 28,
    batteryPct: 91,
    isAvailable: true,
    lastUpdated: 'Just now',
  },
  {
    id: 'DRV-NSK-107',
    name: 'Rahul Kulkarni',
    phone: '+91 98226 88990',
    city: 'Nashik',
    lat: 19.9678,
    lng: 73.7845, // Indira Nagar
    status: 'Busy',
    vehicleType: '2-Wheeler',
    vehicleNumber: 'MH 15 BC 3012',
    speedKmph: 41,
    batteryPct: 58,
    isAvailable: false,
    currentTripId: 'BK-NSK-9042',
    lastUpdated: '4 min ago',
  },
  {
    id: 'DRV-NSK-108',
    name: 'Deepak Chavan',
    phone: '+91 98227 12345',
    city: 'Nashik',
    lat: 20.0245,
    lng: 73.7512, // Gangapur Road
    status: 'Online',
    vehicleType: '3-Wheeler Auto',
    vehicleNumber: 'MH 15 RT 8004',
    speedKmph: 12,
    batteryPct: 84,
    isAvailable: true,
    lastUpdated: 'Just now',
  },
  {
    id: 'DRV-NSK-109',
    name: 'Amol Pawar',
    phone: '+91 98228 33445',
    city: 'Nashik',
    lat: 19.9824,
    lng: 73.7638, // City Centre Mall
    status: 'Online',
    vehicleType: 'Tata Ace',
    vehicleNumber: 'MH 15 KL 5543',
    speedKmph: 0,
    batteryPct: 90,
    isAvailable: true,
    lastUpdated: '2 min ago',
  },
  {
    id: 'DRV-NSK-110',
    name: 'Suresh Gaikwad',
    phone: '+91 98229 66778',
    city: 'Nashik',
    lat: 19.9482,
    lng: 73.7654, // Pathardi Phata
    status: 'Online',
    vehicleType: 'Electric Tempo',
    vehicleNumber: 'MH 15 EV 1234',
    speedKmph: 19,
    batteryPct: 79,
    isAvailable: true,
    lastUpdated: '3 min ago',
  },
  {
    id: 'DRV-NSK-111',
    name: 'Bhushan Ahire',
    phone: '+91 98230 88991',
    city: 'Nashik',
    lat: 20.0380,
    lng: 73.8050, // Dindori Naka
    status: 'Busy',
    vehicleType: 'Tata Ace',
    vehicleNumber: 'MH 15 JK 9912',
    speedKmph: 31,
    batteryPct: 65,
    isAvailable: false,
    currentTripId: 'BK-NSK-9043',
    lastUpdated: '5 min ago',
  },
  {
    id: 'DRV-NSK-112',
    name: 'Pravin Wagh',
    phone: '+91 98231 22334',
    city: 'Nashik',
    lat: 19.9710,
    lng: 73.7420, // Untwadi / Govind Nagar
    status: 'Online',
    vehicleType: 'Pickup 8ft',
    vehicleNumber: 'MH 15 XY 4455',
    speedKmph: 15,
    batteryPct: 93,
    isAvailable: true,
    lastUpdated: 'Just now',
  },

  // --- PUNE FLEET ---
  {
    id: 'DRV-PUN-201',
    name: 'Omkar Bhosale',
    phone: '+91 98900 11223',
    city: 'Pune',
    lat: 18.5913,
    lng: 73.7389, // Hinjawadi Phase 1
    status: 'Online',
    vehicleType: 'Tata Ace',
    vehicleNumber: 'MH 12 AB 9988',
    speedKmph: 26,
    batteryPct: 82,
    isAvailable: true,
    lastUpdated: '1 min ago',
  },
  {
    id: 'DRV-PUN-202',
    name: 'Prasad Joshi',
    phone: '+91 98901 33445',
    city: 'Pune',
    lat: 18.5987,
    lng: 73.7661, // Wakad
    status: 'Online',
    vehicleType: 'Pickup 8ft',
    vehicleNumber: 'MH 12 CD 4411',
    speedKmph: 0,
    batteryPct: 96,
    isAvailable: true,
    lastUpdated: 'Just now',
  },
  {
    id: 'DRV-PUN-203',
    name: 'Tanaji Kamble',
    phone: '+91 98902 55667',
    city: 'Pune',
    lat: 18.5590,
    lng: 73.7868, // Baner
    status: 'Busy',
    vehicleType: '3-Wheeler Auto',
    vehicleNumber: 'MH 12 EF 7722',
    speedKmph: 35,
    batteryPct: 69,
    isAvailable: false,
    currentTripId: 'BK-PUN-3310',
    lastUpdated: '2 min ago',
  },
  {
    id: 'DRV-PUN-204',
    name: 'Manoj Shirole',
    phone: '+91 98903 77889',
    city: 'Pune',
    lat: 18.5314,
    lng: 73.8446, // Shivajinagar
    status: 'Online',
    vehicleType: 'Tata Ace',
    vehicleNumber: 'MH 12 GH 1133',
    speedKmph: 14,
    batteryPct: 78,
    isAvailable: true,
    lastUpdated: '1 min ago',
  },
  {
    id: 'DRV-PUN-205',
    name: 'Shrikant Jagtap',
    phone: '+91 98904 99001',
    city: 'Pune',
    lat: 18.5089,
    lng: 73.9259, // Hadapsar Magarpatta
    status: 'Online',
    vehicleType: 'Electric Tempo',
    vehicleNumber: 'MH 12 EV 9901',
    speedKmph: 22,
    batteryPct: 85,
    isAvailable: true,
    lastUpdated: '3 min ago',
  },
  {
    id: 'DRV-PUN-206',
    name: 'Mahesh Kadam',
    phone: '+91 98905 11234',
    city: 'Pune',
    lat: 18.5679,
    lng: 73.9143, // Viman Nagar
    status: 'Online',
    vehicleType: 'Pickup 8ft',
    vehicleNumber: 'MH 12 JK 5522',
    speedKmph: 0,
    batteryPct: 89,
    isAvailable: true,
    lastUpdated: 'Just now',
  },

  // --- MUMBAI FLEET ---
  {
    id: 'DRV-MUM-301',
    name: 'Aslam Sheikh',
    phone: '+91 98200 44332',
    city: 'Mumbai',
    lat: 19.1197,
    lng: 72.8697, // Andheri East MIDC
    status: 'Online',
    vehicleType: 'Tata Ace',
    vehicleNumber: 'MH 02 CR 1092',
    speedKmph: 20,
    batteryPct: 91,
    isAvailable: true,
    lastUpdated: 'Just now',
  },
  {
    id: 'DRV-MUM-302',
    name: 'Sunil Yadav',
    phone: '+91 98201 66554',
    city: 'Mumbai',
    lat: 19.0657,
    lng: 72.8687, // BKC
    status: 'Busy',
    vehicleType: 'Pickup 8ft',
    vehicleNumber: 'MH 03 BT 8821',
    speedKmph: 33,
    batteryPct: 54,
    isAvailable: false,
    currentTripId: 'BK-MUM-7721',
    lastUpdated: '4 min ago',
  },
  {
    id: 'DRV-MUM-303',
    name: 'Santosh Sawant',
    phone: '+91 98202 88776',
    city: 'Mumbai',
    lat: 19.1982,
    lng: 72.9558, // Thane West Wagle MIDC
    status: 'Online',
    vehicleType: 'Tata Ace',
    vehicleNumber: 'MH 04 FK 3399',
    speedKmph: 24,
    batteryPct: 88,
    isAvailable: true,
    lastUpdated: '2 min ago',
  },
  {
    id: 'DRV-MUM-304',
    name: 'Rajendra Gupta',
    phone: '+91 98203 11990',
    city: 'Mumbai',
    lat: 19.0771,
    lng: 72.9986, // Vashi APMC Market
    status: 'Online',
    vehicleType: 'Electric Tempo',
    vehicleNumber: 'MH 43 EV 5510',
    speedKmph: 16,
    batteryPct: 79,
    isAvailable: true,
    lastUpdated: 'Just now',
  },
  {
    id: 'DRV-MUM-305',
    name: 'Irfan Khan',
    phone: '+91 98204 33221',
    city: 'Mumbai',
    lat: 19.0178,
    lng: 72.8478, // Dadar TT
    status: 'Online',
    vehicleType: '3-Wheeler Auto',
    vehicleNumber: 'MH 01 ZA 4410',
    speedKmph: 0,
    batteryPct: 92,
    isAvailable: true,
    lastUpdated: '1 min ago',
  },
]

// Point in polygon Ray-Casting algorithm for [lat, lng]
export function isPointInPolygon(point: [number, number], polygon: number[][]): boolean {
  if (!polygon || polygon.length < 3) return false
  const [lat, lng] = point
  let inside = false
  const n = polygon.length

  let j = n - 1
  for (let i = 0; i < n; i++) {
    const p1 = polygon[i]
    const p2 = polygon[j]
    const p1_lat = p1[0]
    const p1_lng = p1[1]
    const p2_lat = p2[0]
    const p2_lng = p2[1]

    if (p1_lng > lng !== p2_lng > lng && lat < ((p2_lat - p1_lat) * (lng - p1_lng)) / (p2_lng - p1_lng) + p1_lat) {
      inside = !inside
    }
    j = i
  }

  return inside
}

// Compute center point of polygon
export function calculatePolygonCenter(coords: number[][]): [number, number] {
  if (!coords || coords.length === 0) return [19.9975, 73.7898]
  const lats = coords.map((c) => c[0])
  const lngs = coords.map((c) => c[1])
  const cLat = (Math.min(...lats) + Math.max(...lats)) / 2
  const cLng = (Math.min(...lngs) + Math.max(...lngs)) / 2
  return [Number(cLat.toFixed(5)), Number(cLng.toFixed(5))]
}

export interface DirectionalQuadrant {
  key: 'north' | 'east' | 'south' | 'west'
  label: string
  sublabel: string
  polygonPoints: [number, number][]
  targetQuota: number
  driverCount: number
  availableCount: number
  busyCount: number
  availabilityRatio: number
  color: string
  status: 'optimal' | 'moderate' | 'critical'
}

export function interpolateAvailabilityColor(ratio: number): string {
  const r = Math.max(0, Math.min(1, ratio))
  if (r <= 0.5) {
    const t = r / 0.5
    const red = Math.round(239 + t * (245 - 239))
    const green = Math.round(68 + t * (158 - 68))
    const blue = Math.round(68 + t * (11 - 68))
    return `rgb(${red}, ${green}, ${blue})`
  } else {
    const t = (r - 0.5) / 0.5
    const red = Math.round(245 + t * (16 - 245))
    const green = Math.round(158 + t * (185 - 158))
    const blue = Math.round(11 + t * (129 - 11))
    return `rgb(${red}, ${green}, ${blue})`
  }
}

export function computeDirectionalQuadrants(
  coords: number[][],
  center: [number, number],
  drivers: ZonalDriver[],
): Record<'north' | 'east' | 'south' | 'west', DirectionalQuadrant> {
  const lats = coords.map((c) => c[0])
  const lngs = coords.map((c) => c[1])
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const minLng = Math.min(...lngs)
  const maxLng = Math.max(...lngs)
  const [cLat, cLng] = center

  const quadrantPolygons: Record<'north' | 'east' | 'south' | 'west', {
    label: string
    sublabel: string
    points: [number, number][]
    targetQuota: number
  }> = {
    north: {
      label: 'North Section',
      sublabel: 'Panchavati / Dindori Naka',
      targetQuota: 8,
      points: [
        [cLat, cLng],
        [maxLat, minLng],
        [maxLat, maxLng],
        [cLat, cLng],
      ],
    },
    east: {
      label: 'East Section',
      sublabel: 'Dwarka / Mumbai-Agra Hwy',
      targetQuota: 6,
      points: [
        [cLat, cLng],
        [maxLat, maxLng],
        [minLat, maxLng],
        [cLat, cLng],
      ],
    },
    south: {
      label: 'South Section',
      sublabel: 'Nashik Road / Deolali',
      targetQuota: 8,
      points: [
        [cLat, cLng],
        [minLat, maxLng],
        [minLat, minLng],
        [cLat, cLng],
      ],
    },
    west: {
      label: 'West Section',
      sublabel: 'Satpur & Ambad MIDC',
      targetQuota: 10,
      points: [
        [cLat, cLng],
        [minLat, minLng],
        [maxLat, minLng],
        [cLat, cLng],
      ],
    },
  }

  const out = {} as Record<'north' | 'east' | 'south' | 'west', DirectionalQuadrant>
  const keys: ('north' | 'east' | 'south' | 'west')[] = ['north', 'east', 'south', 'west']

  for (const k of keys) {
    const q = quadrantPolygons[k]
    const driversInQuadrant = drivers.filter((d) => isPointInPolygon([d.lat, d.lng], q.points))
    const total = driversInQuadrant.length
    const available = driversInQuadrant.filter((d) => d.isAvailable).length
    const busy = driversInQuadrant.filter((d) => d.status === 'Busy').length
    const ratio = Math.min(1.0, available / Math.max(1, q.targetQuota))
    const color = total === 0 ? '#ef4444' : interpolateAvailabilityColor(ratio)
    const status: 'optimal' | 'moderate' | 'critical' =
      total === 0 || ratio < 0.25 ? 'critical' : ratio < 0.65 ? 'moderate' : 'optimal'

    out[k] = {
      key: k,
      label: q.label,
      sublabel: q.sublabel,
      polygonPoints: q.points,
      targetQuota: q.targetQuota,
      driverCount: total,
      availableCount: available,
      busyCount: busy,
      availabilityRatio: ratio,
      color,
      status,
    }
  }

  return out
}

