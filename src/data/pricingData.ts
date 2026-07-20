import type { VehicleCategory } from './vehiclesData'

export interface VehiclePricing {
  vehicleType: VehicleCategory
  baseFare: number
  perKm: number
  perMinute: number
  waiting: number
  peak: number
  night: number
  festival: number
  cancellation: number
}

export type CouponStatus = 'Active' | 'Expired' | 'Scheduled'

export interface Coupon {
  id: string
  code: string
  discount: string
  discountValue: number
  discountType: 'flat' | 'percent'
  validFrom: string
  validUntil: string
  uses: number
  maxUses: number
  vehicleTypes: VehicleCategory[]
  status: CouponStatus
  minOrder: number
}

export interface PricingConfig {
  vehiclePricing: VehiclePricing[]
  coupons: Coupon[]
  referralBonus: number
}

export const fareComponentLabels: Record<keyof Omit<VehiclePricing, 'vehicleType'>, string> = {
  baseFare: 'Base fare',
  perKm: 'Per km rate',
  perMinute: 'Per minute',
  waiting: 'Waiting charge / min',
  peak: 'Peak surcharge (%)',
  night: 'Night surcharge (%)',
  festival: 'Festival surcharge (%)',
  cancellation: 'Cancellation fee',
}

export const pricingConfig: PricingConfig = {
  referralBonus: 150,
  vehiclePricing: [
    {
      vehicleType: 'Bike',
      baseFare: 35,
      perKm: 8,
      perMinute: 1.5,
      waiting: 2,
      peak: 25,
      night: 15,
      festival: 30,
      cancellation: 25,
    },
    {
      vehicleType: 'Scooter',
      baseFare: 40,
      perKm: 9,
      perMinute: 1.75,
      waiting: 2.5,
      peak: 25,
      night: 15,
      festival: 30,
      cancellation: 30,
    },
    {
      vehicleType: 'Mini Truck',
      baseFare: 199,
      perKm: 18,
      perMinute: 3.5,
      waiting: 5,
      peak: 20,
      night: 12,
      festival: 25,
      cancellation: 75,
    },
    {
      vehicleType: 'Pickup',
      baseFare: 249,
      perKm: 22,
      perMinute: 4,
      waiting: 6,
      peak: 20,
      night: 12,
      festival: 25,
      cancellation: 99,
    },
    {
      vehicleType: 'Tempo',
      baseFare: 299,
      perKm: 26,
      perMinute: 4.5,
      waiting: 7,
      peak: 18,
      night: 10,
      festival: 22,
      cancellation: 125,
    },
  ],
  coupons: [
    {
      id: 'CPN-001',
      code: 'FIRST50',
      discount: '₹50 off',
      discountValue: 50,
      discountType: 'flat',
      validFrom: '01 Jul 2026',
      validUntil: '31 Aug 2026',
      uses: 4821,
      maxUses: 10000,
      vehicleTypes: ['Bike', 'Scooter'],
      status: 'Active',
      minOrder: 99,
    },
    {
      id: 'CPN-002',
      code: 'MONSOON20',
      discount: '20% off',
      discountValue: 20,
      discountType: 'percent',
      validFrom: '01 Jul 2026',
      validUntil: '15 Sep 2026',
      uses: 1204,
      maxUses: 5000,
      vehicleTypes: ['Mini Truck', 'Pickup', 'Tempo'],
      status: 'Active',
      minOrder: 499,
    },
    {
      id: 'CPN-003',
      code: 'BLR100',
      discount: '₹100 off',
      discountValue: 100,
      discountType: 'flat',
      validFrom: '10 Jul 2026',
      validUntil: '10 Aug 2026',
      uses: 312,
      maxUses: 2000,
      vehicleTypes: ['Bike', 'Scooter', 'Mini Truck'],
      status: 'Active',
      minOrder: 199,
    },
    {
      id: 'CPN-004',
      code: 'DIWALI25',
      discount: '25% off',
      discountValue: 25,
      discountType: 'percent',
      validFrom: '20 Oct 2026',
      validUntil: '05 Nov 2026',
      uses: 0,
      maxUses: 15000,
      vehicleTypes: ['Bike', 'Scooter', 'Mini Truck', 'Pickup', 'Tempo'],
      status: 'Scheduled',
      minOrder: 149,
    },
    {
      id: 'CPN-005',
      code: 'HOLI2026',
      discount: '₹75 off',
      discountValue: 75,
      discountType: 'flat',
      validFrom: '10 Mar 2026',
      validUntil: '20 Mar 2026',
      uses: 8900,
      maxUses: 9000,
      vehicleTypes: ['Bike', 'Scooter'],
      status: 'Expired',
      minOrder: 149,
    },
    {
      id: 'CPN-006',
      code: 'TEMPO150',
      discount: '₹150 off',
      discountValue: 150,
      discountType: 'flat',
      validFrom: '01 Jun 2026',
      validUntil: '30 Jun 2026',
      uses: 456,
      maxUses: 1000,
      vehicleTypes: ['Tempo', 'Pickup'],
      status: 'Expired',
      minOrder: 799,
    },
  ],
}
