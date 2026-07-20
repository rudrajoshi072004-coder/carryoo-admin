import { fetchWalletAdmin } from '../api/services/adminData'

export type WalletEntryType =
  | 'Credit'
  | 'Debit'
  | 'Bonus'
  | 'Referral'
  | 'Withdrawal'
  | 'Trip Payout'
  | 'Platform Fee'

export type WalletEntryStatus = 'Completed' | 'Pending' | 'Processing' | 'Failed'

export interface WalletSummary {
  credits: number
  debits: number
  bonus: number
  referral: number
  withdrawals: number
  balance: number
}

export interface WalletHistoryEntry {
  id: string
  type: WalletEntryType
  description: string
  amount: number
  balance: number
  status: WalletEntryStatus
  time: string
  date: string
  party?: string
}

export interface WalletChartPoint {
  day: string
  credits: number
  debits: number
  net: number
}

export const walletSummary: WalletSummary = {
  credits: 2847600,
  debits: 1623400,
  bonus: 186400,
  referral: 94200,
  withdrawals: 1438000,
  balance: 1224200,
}

export const walletFlowSeries: WalletChartPoint[] = [
  { day: 'Mon', credits: 412, debits: 286, net: 126 },
  { day: 'Tue', credits: 388, debits: 310, net: 78 },
  { day: 'Wed', credits: 445, debits: 298, net: 147 },
  { day: 'Thu', credits: 468, debits: 342, net: 126 },
  { day: 'Fri', credits: 512, debits: 378, net: 134 },
  { day: 'Sat', credits: 586, debits: 412, net: 174 },
  { day: 'Sun', credits: 498, debits: 356, net: 142 },
]

export const walletBalanceSeries = [
  { day: 'Mon', balance: 11.2 },
  { day: 'Tue', balance: 11.4 },
  { day: 'Wed', balance: 11.6 },
  { day: 'Thu', balance: 11.8 },
  { day: 'Fri', balance: 12.0 },
  { day: 'Sat', balance: 12.2 },
  { day: 'Sun', balance: 12.24 },
]

export const walletHistory: WalletHistoryEntry[] = [
  {
    id: 'WL-88421',
    type: 'Trip Payout',
    description: 'Trip payout · TRP-88355',
    amount: 261,
    balance: 1224200,
    status: 'Completed',
    time: '3:38 PM',
    date: '14 Jul 2026',
    party: 'Neha Deshmukh',
  },
  {
    id: 'WL-88418',
    type: 'Withdrawal',
    description: 'Withdrawal to HDFC · ****4821',
    amount: -12200,
    balance: 1223939,
    status: 'Processing',
    time: '3:12 PM',
    date: '14 Jul 2026',
    party: 'Neha Deshmukh',
  },
  {
    id: 'WL-88412',
    type: 'Credit',
    description: 'Customer trip fare · CRY-92841',
    amount: 420,
    balance: 1236139,
    status: 'Completed',
    time: '3:02 PM',
    date: '14 Jul 2026',
    party: 'Meera Nair',
  },
  {
    id: 'WL-88408',
    type: 'Platform Fee',
    description: 'Platform commission · TRP-88388',
    amount: -36,
    balance: 1235719,
    status: 'Completed',
    time: '2:58 PM',
    date: '14 Jul 2026',
  },
  {
    id: 'WL-88402',
    type: 'Bonus',
    description: 'Peak hour incentive · Pune zone',
    amount: 150,
    balance: 1235755,
    status: 'Completed',
    time: '2:40 PM',
    date: '14 Jul 2026',
    party: 'Vikram Joshi',
  },
  {
    id: 'WL-88396',
    type: 'Referral',
    description: 'Driver referral bonus · DRV-10599',
    amount: 500,
    balance: 1235605,
    status: 'Completed',
    time: '2:15 PM',
    date: '14 Jul 2026',
    party: 'Lakshmi Iyer',
  },
  {
    id: 'WL-88390',
    type: 'Trip Payout',
    description: 'Trip payout · TRP-88410',
    amount: 1116,
    balance: 1235105,
    status: 'Processing',
    time: '1:55 PM',
    date: '14 Jul 2026',
    party: 'Priya Nair',
  },
  {
    id: 'WL-88384',
    type: 'Debit',
    description: 'Refund issued · CRY-92790',
    amount: -180,
    balance: 1233989,
    status: 'Completed',
    time: '1:30 PM',
    date: '14 Jul 2026',
    party: 'Rahul Sharma',
  },
  {
    id: 'WL-88378',
    type: 'Withdrawal',
    description: 'Withdrawal to SBI · ****3341',
    amount: -8200,
    balance: 1234169,
    status: 'Pending',
    time: '1:10 PM',
    date: '14 Jul 2026',
    party: 'Farhan Ali',
  },
  {
    id: 'WL-88372',
    type: 'Credit',
    description: 'Customer trip fare · CRY-92818',
    amount: 680,
    balance: 1242369,
    status: 'Completed',
    time: '12:48 PM',
    date: '14 Jul 2026',
    party: 'Anjali Patel',
  },
  {
    id: 'WL-88366',
    type: 'Bonus',
    description: 'Weekly performance bonus',
    amount: 500,
    balance: 1241689,
    status: 'Completed',
    time: '12:20 PM',
    date: '14 Jul 2026',
    party: 'Lakshmi Iyer',
  },
  {
    id: 'WL-88360',
    type: 'Withdrawal',
    description: 'Withdrawal to Federal · ****5502',
    amount: -5780,
    balance: 1241189,
    status: 'Completed',
    time: '11:30 AM',
    date: '14 Jul 2026',
    party: 'Arjun Menon',
  },
  {
    id: 'WL-88354',
    type: 'Trip Payout',
    description: 'Trip payout · TRP-88310',
    amount: 468,
    balance: 1246969,
    status: 'Completed',
    time: '11:05 AM',
    date: '14 Jul 2026',
    party: 'Farhan Ali',
  },
  {
    id: 'WL-88348',
    type: 'Platform Fee',
    description: 'Platform commission · TRP-88391',
    amount: -22,
    balance: 1246501,
    status: 'Completed',
    time: '10:40 AM',
    date: '14 Jul 2026',
  },
  {
    id: 'WL-88342',
    type: 'Withdrawal',
    description: 'Withdrawal failed · insufficient KYC',
    amount: -4500,
    balance: 1246523,
    status: 'Failed',
    time: '9:22 AM',
    date: '14 Jul 2026',
    party: 'Imran Qureshi',
  },
]

export async function fetchWallet() {
  return fetchWalletAdmin()
}
