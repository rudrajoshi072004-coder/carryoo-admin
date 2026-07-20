export interface CompanyProfile {
  name: string
  legalName: string
  gstin: string
  pan: string
  cin: string
  address: string
  city: string
  state: string
  pincode: string
  phone: string
  email: string
  website: string
  supportEmail: string
  supportPhone: string
}

export interface BrandColors {
  primary: string
  primaryHover: string
  accent: string
  success: string
  warning: string
  danger: string
  logoUrl: string
}

export interface TaxSettings {
  gstEnabled: boolean
  gstRate: number
  cgstRate: number
  sgstRate: number
  igstRate: number
  tdsEnabled: boolean
  tdsRate: number
  hsnCode: string
  invoicePrefix: string
}

export interface PaymentGatewaySettings {
  provider: string
  merchantId: string
  apiKey: string
  webhookUrl: string
  testMode: boolean
  supportedMethods: string[]
}

export interface FirebaseSettings {
  projectId: string
  apiKey: string
  authDomain: string
  storageBucket: string
  messagingSenderId: string
  appId: string
}

export interface GoogleMapsSettings {
  apiKey: string
  defaultCenter: { lat: number; lng: number }
  defaultZoom: number
  geocodingEnabled: boolean
  directionsEnabled: boolean
}

export interface EmailSettings {
  provider: string
  smtpHost: string
  smtpPort: number
  username: string
  fromEmail: string
  fromName: string
  tlsEnabled: boolean
}

export interface SmsSettings {
  provider: string
  senderId: string
  apiKey: string
  dltTemplateId: string
  otpEnabled: boolean
}

export interface LegalSettings {
  privacyPolicyUrl: string
  termsUrl: string
  refundPolicyUrl: string
  lastUpdated: string
}

export interface AppSettings {
  version: string
  minDriverVersion: string
  minCustomerVersion: string
  maintenanceMode: boolean
  maintenanceMessage: string
  forceUpdate: boolean
  featureFlags: Record<string, boolean>
}

export interface PlatformSettings {
  company: CompanyProfile
  branding: BrandColors
  taxes: TaxSettings
  paymentGateway: PaymentGatewaySettings
  firebase: FirebaseSettings
  googleMaps: GoogleMapsSettings
  email: EmailSettings
  sms: SmsSettings
  legal: LegalSettings
  app: AppSettings
}

export const platformSettings: PlatformSettings = {
  company: {
    name: 'Carryoo',
    legalName: 'Carryoo Logistics Pvt. Ltd.',
    gstin: '27AABCC1234D1Z5',
    pan: 'AABCC1234D',
    cin: 'U63030MH2020PTC345678',
    address: 'WeWork, BKC, Bandra Kurla Complex',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400051',
    phone: '+91 22 4890 1200',
    email: 'hello@carryoo.in',
    website: 'https://carryoo.in',
    supportEmail: 'support@carryoo.in',
    supportPhone: '+91 1800 209 8844',
  },
  branding: {
    primary: '#2563eb',
    primaryHover: '#1d4ed8',
    accent: '#f59e0b',
    success: '#16a34a',
    warning: '#d97706',
    danger: '#dc2626',
    logoUrl: '/carryoo-logo.svg',
  },
  taxes: {
    gstEnabled: true,
    gstRate: 18,
    cgstRate: 9,
    sgstRate: 9,
    igstRate: 18,
    tdsEnabled: true,
    tdsRate: 1,
    hsnCode: '9965',
    invoicePrefix: 'CY-INV',
  },
  paymentGateway: {
    provider: 'Razorpay',
    merchantId: 'rzp_live_Carryoo2026',
    apiKey: 'rzp_live_••••••••••••••••',
    webhookUrl: 'https://api.carryoo.in/webhooks/razorpay',
    testMode: false,
    supportedMethods: ['UPI', 'Credit Card', 'Debit Card', 'Net Banking', 'Wallet'],
  },
  firebase: {
    projectId: 'carryoo-prod',
    apiKey: 'AIza••••••••••••••••••••••••••••••••',
    authDomain: 'carryoo-prod.firebaseapp.com',
    storageBucket: 'carryoo-prod.appspot.com',
    messagingSenderId: '123456789012',
    appId: '1:123456789012:web:abcdef123456',
  },
  googleMaps: {
    apiKey: 'AIza••••••••••••••••••••••••••••••••',
    defaultCenter: { lat: 19.076, lng: 72.8777 },
    defaultZoom: 12,
    geocodingEnabled: true,
    directionsEnabled: true,
  },
  email: {
    provider: 'SendGrid',
    smtpHost: 'smtp.sendgrid.net',
    smtpPort: 587,
    username: 'apikey',
    fromEmail: 'noreply@carryoo.in',
    fromName: 'Carryoo',
    tlsEnabled: true,
  },
  sms: {
    provider: 'MSG91',
    senderId: 'CRYOOO',
    apiKey: '••••••••••••••••••••••••••••••••',
    dltTemplateId: '1107161234567890123',
    otpEnabled: true,
  },
  legal: {
    privacyPolicyUrl: 'https://carryoo.in/privacy',
    termsUrl: 'https://carryoo.in/terms',
    refundPolicyUrl: 'https://carryoo.in/refund-policy',
    lastUpdated: '1 Jun 2026',
  },
  app: {
    version: '3.2.1',
    minDriverVersion: '3.1.0',
    minCustomerVersion: '3.0.5',
    maintenanceMode: false,
    maintenanceMessage: 'Carryoo is undergoing scheduled maintenance. We will be back shortly.',
    forceUpdate: false,
    featureFlags: {
      scheduledDelivery: true,
      walletCashback: true,
      liveChat: true,
      multiStop: false,
      darkMode: true,
    },
  },
}
