import { fetchPaymentsAdmin } from '../api/services/adminData'

export type TransactionType =
  | 'Trip Fare'
  | 'Driver Payout'
  | 'Withdrawal'
  | 'Refund'
  | 'Commission'
  | 'Incentive'
  | 'Platform Fee'

export type TransactionStatus = 'Completed' | 'Pending' | 'Failed' | 'Processing'
export type PaymentMethod = 'UPI' | 'Bank Transfer' | 'Wallet' | 'Card' | 'Cash'

export interface RevenueSummary {
  daily: number
  weekly: number
  monthly: number
  driverPayouts: number
  pendingWithdrawals: number
  refunds: number
  commissions: number
}

export interface Transaction {
  id: string
  type: TransactionType
  party: string
  amount: number
  method: PaymentMethod
  status: TransactionStatus
  time: string
  date: string
  reference?: string
  city?: string
}

export const transactionTypes: Array<'All Types' | TransactionType> = [
  'All Types',
  'Trip Fare',
  'Driver Payout',
  'Withdrawal',
  'Refund',
  'Commission',
  'Incentive',
  'Platform Fee',
]

export const transactionStatuses: Array<'All Status' | TransactionStatus> = [
  'All Status',
  'Completed',
  'Pending',
  'Processing',
  'Failed',
]

export const paymentMethods: Array<'All Methods' | PaymentMethod> = [
  'All Methods',
  'UPI',
  'Bank Transfer',
  'Wallet',
  'Card',
  'Cash',
]

export const revenueSummary: RevenueSummary = {
  daily: 312400,
  weekly: 2187600,
  monthly: 8943200,
  driverPayouts: 1845600,
  pendingWithdrawals: 342800,
  refunds: 48600,
  commissions: 447160,
}

export const transactions: Transaction[] = [
  {
    id: 'TXN-92841',
    type: 'Trip Fare',
    party: 'Meera Nair · CRY-92841',
    amount: 420,
    method: 'UPI',
    status: 'Completed',
    time: '3:42 PM',
    date: '14 Jul 2026',
    reference: 'TRP-88355',
    city: 'Mumbai',
  },
  {
    id: 'TXN-92838',
    type: 'Driver Payout',
    party: 'Neha Deshmukh · DRV-10534',
    amount: 261,
    method: 'Wallet',
    status: 'Completed',
    time: '3:38 PM',
    date: '14 Jul 2026',
    reference: 'TRP-88331',
    city: 'Mumbai',
  },
  {
    id: 'TXN-92835',
    type: 'Withdrawal',
    party: 'Vikram Joshi · DRV-10482',
    amount: 5000,
    method: 'Bank Transfer',
    status: 'Processing',
    time: '3:12 PM',
    date: '14 Jul 2026',
    reference: 'WD-7724',
    city: 'Pune',
  },
  {
    id: 'TXN-92830',
    type: 'Commission',
    party: 'Platform · TRP-88388',
    amount: 36,
    method: 'Wallet',
    status: 'Completed',
    time: '2:58 PM',
    date: '14 Jul 2026',
    reference: 'TRP-88388',
    city: 'Pune',
  },
  {
    id: 'TXN-92822',
    type: 'Refund',
    party: 'Rahul Sharma · CRY-92790',
    amount: 180,
    method: 'UPI',
    status: 'Completed',
    time: '2:40 PM',
    date: '14 Jul 2026',
    reference: 'RF-4412',
    city: 'Delhi',
  },
  {
    id: 'TXN-92818',
    type: 'Trip Fare',
    party: 'Anjali Patel · CRY-92818',
    amount: 680,
    method: 'Card',
    status: 'Completed',
    time: '2:22 PM',
    date: '14 Jul 2026',
    reference: 'TRP-88410',
    city: 'Bengaluru',
  },
  {
    id: 'TXN-92810',
    type: 'Incentive',
    party: 'Lakshmi Iyer · DRV-10518',
    amount: 500,
    method: 'Wallet',
    status: 'Completed',
    time: '1:55 PM',
    date: '14 Jul 2026',
    reference: 'INC-WK28',
    city: 'Chennai',
  },
  {
    id: 'TXN-92805',
    type: 'Withdrawal',
    party: 'Farhan Ali · DRV-10570',
    amount: 8200,
    method: 'Bank Transfer',
    status: 'Pending',
    time: '1:30 PM',
    date: '14 Jul 2026',
    reference: 'WD-7723',
    city: 'Kolkata',
  },
  {
    id: 'TXN-92798',
    type: 'Driver Payout',
    party: 'Ananya Reddy · DRV-10491',
    amount: 238,
    method: 'Wallet',
    status: 'Completed',
    time: '1:12 PM',
    date: '14 Jul 2026',
    reference: 'TRP-88277',
    city: 'Hyderabad',
  },
  {
    id: 'TXN-92790',
    type: 'Platform Fee',
    party: 'Platform · TRP-88391',
    amount: 22,
    method: 'Wallet',
    status: 'Completed',
    time: '12:48 PM',
    date: '14 Jul 2026',
    reference: 'TRP-88391',
    city: 'Hyderabad',
  },
  {
    id: 'TXN-92782',
    type: 'Trip Fare',
    party: 'Karthik Menon · CRY-92782',
    amount: 520,
    method: 'Cash',
    status: 'Completed',
    time: '12:20 PM',
    date: '14 Jul 2026',
    reference: 'TRP-88310',
    city: 'Kolkata',
  },
  {
    id: 'TXN-92775',
    type: 'Refund',
    party: 'Pooja Verma · CRY-92710',
    amount: 240,
    method: 'Wallet',
    status: 'Failed',
    time: '11:55 AM',
    date: '14 Jul 2026',
    reference: 'RF-4408',
    city: 'Lucknow',
  },
  {
    id: 'TXN-92768',
    type: 'Withdrawal',
    party: 'Arjun Menon · DRV-10541',
    amount: 5780,
    method: 'UPI',
    status: 'Completed',
    time: '11:30 AM',
    date: '14 Jul 2026',
    reference: 'WD-7721',
    city: 'Kochi',
  },
  {
    id: 'TXN-92760',
    type: 'Commission',
    party: 'Platform · TRP-88402',
    amount: 47,
    method: 'Wallet',
    status: 'Completed',
    time: '11:05 AM',
    date: '14 Jul 2026',
    reference: 'TRP-88402',
    city: 'Kolkata',
  },
  {
    id: 'TXN-92752',
    type: 'Trip Fare',
    party: 'Sneha Kapoor · CRY-92752',
    amount: 156,
    method: 'UPI',
    status: 'Completed',
    time: '10:40 AM',
    date: '14 Jul 2026',
    reference: 'TRP-88340',
    city: 'Chennai',
  },
  {
    id: 'TXN-92744',
    type: 'Driver Payout',
    party: 'Priya Nair · DRV-10588',
    amount: 1116,
    method: 'Wallet',
    status: 'Processing',
    time: '10:15 AM',
    date: '14 Jul 2026',
    reference: 'TRP-88410',
    city: 'Bengaluru',
  },
  {
    id: 'TXN-92736',
    type: 'Incentive',
    party: 'Vikram Joshi · DRV-10482',
    amount: 150,
    method: 'Wallet',
    status: 'Completed',
    time: '9:50 AM',
    date: '14 Jul 2026',
    reference: 'INC-PEAK',
    city: 'Pune',
  },
  {
    id: 'TXN-92728',
    type: 'Withdrawal',
    party: 'Imran Qureshi · DRV-10503',
    amount: 4500,
    method: 'Bank Transfer',
    status: 'Failed',
    time: '9:22 AM',
    date: '14 Jul 2026',
    reference: 'WD-7719',
    city: 'Delhi',
  },
]

export async function fetchPayments() {
  return fetchPaymentsAdmin()
}
