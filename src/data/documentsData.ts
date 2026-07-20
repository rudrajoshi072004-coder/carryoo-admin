export type DocumentType = 'DL' | 'RC' | 'Insurance' | 'Aadhaar' | 'PAN' | 'Photo'

export type DocumentStatus = 'Pending' | 'Approved' | 'Rejected' | 'Resubmitted'

export interface AuditEntry {
  action: string
  by: string
  at: string
  note?: string
}

export interface VerificationDocument {
  id: string
  driverName: string
  driverId: string
  type: DocumentType
  status: DocumentStatus
  city: string
  submitted: string
  previewLabel: string
  audit: AuditEntry[]
}

export const documentStatuses: DocumentStatus[] = [
  'Pending',
  'Approved',
  'Rejected',
  'Resubmitted',
]

export const documentTypes: DocumentType[] = [
  'DL',
  'RC',
  'Insurance',
  'Aadhaar',
  'PAN',
  'Photo',
]

export const documentCities = [
  'All Cities',
  'Mumbai',
  'Delhi NCR',
  'Bengaluru',
  'Hyderabad',
  'Pune',
  'Chennai',
  'Kolkata',
  'Ahmedabad',
  'Jaipur',
]

export const verificationDocuments: VerificationDocument[] = [
  {
    id: 'DOC-24001',
    driverName: 'Vikram Joshi',
    driverId: 'DRV-10482',
    type: 'DL',
    status: 'Pending',
    city: 'Mumbai',
    submitted: '14 Jul 2026, 09:12',
    previewLabel: 'Driving Licence · MH-14-2024-0018234',
    audit: [
      { action: 'Submitted', by: 'Driver app', at: '14 Jul 2026, 09:12' },
      { action: 'Queued for review', by: 'System', at: '14 Jul 2026, 09:13' },
    ],
  },
  {
    id: 'DOC-24002',
    driverName: 'Priya Nair',
    driverId: 'DRV-10891',
    type: 'RC',
    status: 'Pending',
    city: 'Bengaluru',
    submitted: '14 Jul 2026, 08:45',
    previewLabel: 'Registration Certificate · KA-03-ME-4821',
    audit: [
      { action: 'Submitted', by: 'Driver app', at: '14 Jul 2026, 08:45' },
    ],
  },
  {
    id: 'DOC-24003',
    driverName: 'Rahul Verma',
    driverId: 'DRV-10234',
    type: 'Insurance',
    status: 'Pending',
    city: 'Delhi NCR',
    submitted: '13 Jul 2026, 18:30',
    previewLabel: 'Vehicle Insurance · Policy #ICICI-7829341',
    audit: [
      { action: 'Submitted', by: 'Driver app', at: '13 Jul 2026, 18:30' },
      { action: 'OCR parsed', by: 'System', at: '13 Jul 2026, 18:31' },
    ],
  },
  {
    id: 'DOC-24004',
    driverName: 'Ananya Sharma',
    driverId: 'DRV-11102',
    type: 'Aadhaar',
    status: 'Resubmitted',
    city: 'Pune',
    submitted: '13 Jul 2026, 14:20',
    previewLabel: 'Aadhaar Card · XXXX-XXXX-4821',
    audit: [
      { action: 'Submitted', by: 'Driver app', at: '12 Jul 2026, 11:00' },
      { action: 'Rejected', by: 'Neha Kapoor', at: '12 Jul 2026, 16:45', note: 'Image blurry — please re-upload full card' },
      { action: 'Resubmitted', by: 'Driver app', at: '13 Jul 2026, 14:20' },
    ],
  },
  {
    id: 'DOC-24005',
    driverName: 'Suresh Reddy',
    driverId: 'DRV-10567',
    type: 'PAN',
    status: 'Pending',
    city: 'Hyderabad',
    submitted: '13 Jul 2026, 11:55',
    previewLabel: 'PAN Card · ABCDE1234F',
    audit: [
      { action: 'Submitted', by: 'Driver app', at: '13 Jul 2026, 11:55' },
    ],
  },
  {
    id: 'DOC-24006',
    driverName: 'Kavita Desai',
    driverId: 'DRV-10945',
    type: 'Photo',
    status: 'Pending',
    city: 'Ahmedabad',
    submitted: '13 Jul 2026, 10:08',
    previewLabel: 'Profile Photo · Selfie verification',
    audit: [
      { action: 'Submitted', by: 'Driver app', at: '13 Jul 2026, 10:08' },
    ],
  },
  {
    id: 'DOC-23901',
    driverName: 'Arjun Mehta',
    driverId: 'DRV-10112',
    type: 'DL',
    status: 'Approved',
    city: 'Mumbai',
    submitted: '10 Jul 2026, 15:22',
    previewLabel: 'Driving Licence · MH-02-2019-0092341',
    audit: [
      { action: 'Submitted', by: 'Driver app', at: '10 Jul 2026, 15:22' },
      { action: 'Approved', by: 'Aarav Mehta', at: '10 Jul 2026, 16:10' },
    ],
  },
  {
    id: 'DOC-23902',
    driverName: 'Deepa Iyer',
    driverId: 'DRV-10678',
    type: 'RC',
    status: 'Approved',
    city: 'Chennai',
    submitted: '09 Jul 2026, 12:40',
    previewLabel: 'Registration Certificate · TN-07-BQ-3392',
    audit: [
      { action: 'Submitted', by: 'Driver app', at: '09 Jul 2026, 12:40' },
      { action: 'Approved', by: 'Neha Kapoor', at: '09 Jul 2026, 14:05' },
    ],
  },
  {
    id: 'DOC-23903',
    driverName: 'Mohammed Farhan',
    driverId: 'DRV-10389',
    type: 'Insurance',
    status: 'Approved',
    city: 'Kolkata',
    submitted: '08 Jul 2026, 09:15',
    previewLabel: 'Vehicle Insurance · Policy #HDFC-4492103',
    audit: [
      { action: 'Submitted', by: 'Driver app', at: '08 Jul 2026, 09:15' },
      { action: 'Approved', by: 'Aarav Mehta', at: '08 Jul 2026, 11:30' },
    ],
  },
  {
    id: 'DOC-23904',
    driverName: 'Lakshmi Patel',
    driverId: 'DRV-10723',
    type: 'Aadhaar',
    status: 'Approved',
    city: 'Jaipur',
    submitted: '07 Jul 2026, 17:50',
    previewLabel: 'Aadhaar Card · XXXX-XXXX-9012',
    audit: [
      { action: 'Submitted', by: 'Driver app', at: '07 Jul 2026, 17:50' },
      { action: 'Approved', by: 'Neha Kapoor', at: '08 Jul 2026, 10:00' },
    ],
  },
  {
    id: 'DOC-23801',
    driverName: 'Rohit Singh',
    driverId: 'DRV-10401',
    type: 'DL',
    status: 'Rejected',
    city: 'Delhi NCR',
    submitted: '05 Jul 2026, 13:00',
    previewLabel: 'Driving Licence · DL-04-2022-0089123',
    audit: [
      { action: 'Submitted', by: 'Driver app', at: '05 Jul 2026, 13:00' },
      { action: 'Rejected', by: 'Aarav Mehta', at: '05 Jul 2026, 15:20', note: 'Licence expired — upload renewed DL' },
    ],
  },
  {
    id: 'DOC-23802',
    driverName: 'Sneha Gupta',
    driverId: 'DRV-11056',
    type: 'PAN',
    status: 'Rejected',
    city: 'Pune',
    submitted: '04 Jul 2026, 10:30',
    previewLabel: 'PAN Card · Name mismatch with Aadhaar',
    audit: [
      { action: 'Submitted', by: 'Driver app', at: '04 Jul 2026, 10:30' },
      { action: 'Rejected', by: 'Neha Kapoor', at: '04 Jul 2026, 14:00', note: 'Name on PAN does not match Aadhaar record' },
    ],
  },
  {
    id: 'DOC-23803',
    driverName: 'Harish Kumar',
    driverId: 'DRV-10298',
    type: 'Photo',
    status: 'Rejected',
    city: 'Bengaluru',
    submitted: '03 Jul 2026, 08:15',
    previewLabel: 'Profile Photo · Face not clearly visible',
    audit: [
      { action: 'Submitted', by: 'Driver app', at: '03 Jul 2026, 08:15' },
      { action: 'Rejected', by: 'Aarav Mehta', at: '03 Jul 2026, 09:45', note: 'Face obscured — retake without mask/sunglasses' },
    ],
  },
  {
    id: 'DOC-23701',
    driverName: 'Manish Agarwal',
    driverId: 'DRV-10834',
    type: 'RC',
    status: 'Resubmitted',
    city: 'Mumbai',
    submitted: '12 Jul 2026, 16:00',
    previewLabel: 'Registration Certificate · MH-01-AB-7721',
    audit: [
      { action: 'Submitted', by: 'Driver app', at: '10 Jul 2026, 09:00' },
      { action: 'Rejected', by: 'Neha Kapoor', at: '10 Jul 2026, 12:30', note: 'RC back page missing' },
      { action: 'Resubmitted', by: 'Driver app', at: '12 Jul 2026, 16:00' },
    ],
  },
  {
    id: 'DOC-23702',
    driverName: 'Fatima Khan',
    driverId: 'DRV-11201',
    type: 'Insurance',
    status: 'Resubmitted',
    city: 'Hyderabad',
    submitted: '11 Jul 2026, 11:20',
    previewLabel: 'Vehicle Insurance · Policy #BAJAJ-3310294',
    audit: [
      { action: 'Submitted', by: 'Driver app', at: '09 Jul 2026, 14:00' },
      { action: 'Rejected', by: 'Aarav Mehta', at: '09 Jul 2026, 17:00', note: 'Policy validity date not visible' },
      { action: 'Resubmitted', by: 'Driver app', at: '11 Jul 2026, 11:20' },
    ],
  },
  {
    id: 'DOC-24007',
    driverName: 'Gopal Das',
    driverId: 'DRV-11345',
    type: 'DL',
    status: 'Pending',
    city: 'Kolkata',
    submitted: '14 Jul 2026, 07:30',
    previewLabel: 'Driving Licence · WB-19-2023-0045123',
    audit: [
      { action: 'Submitted', by: 'Driver app', at: '14 Jul 2026, 07:30' },
    ],
  },
  {
    id: 'DOC-24008',
    driverName: 'Neha Rathore',
    driverId: 'DRV-11402',
    type: 'RC',
    status: 'Approved',
    city: 'Jaipur',
    submitted: '11 Jul 2026, 09:45',
    previewLabel: 'Registration Certificate · RJ-14-CA-2290',
    audit: [
      { action: 'Submitted', by: 'Driver app', at: '11 Jul 2026, 09:45' },
      { action: 'Approved', by: 'Neha Kapoor', at: '11 Jul 2026, 11:00' },
    ],
  },
  {
    id: 'DOC-24009',
    driverName: 'Imran Shaikh',
    driverId: 'DRV-11567',
    type: 'Aadhaar',
    status: 'Pending',
    city: 'Mumbai',
    submitted: '14 Jul 2026, 06:55',
    previewLabel: 'Aadhaar Card · XXXX-XXXX-3345',
    audit: [
      { action: 'Submitted', by: 'Driver app', at: '14 Jul 2026, 06:55' },
    ],
  },
  {
    id: 'DOC-24010',
    driverName: 'Divya Menon',
    driverId: 'DRV-11678',
    type: 'Insurance',
    status: 'Rejected',
    city: 'Chennai',
    submitted: '06 Jul 2026, 19:00',
    previewLabel: 'Vehicle Insurance · Policy expired',
    audit: [
      { action: 'Submitted', by: 'Driver app', at: '06 Jul 2026, 19:00' },
      { action: 'Rejected', by: 'Aarav Mehta', at: '07 Jul 2026, 10:15', note: 'Insurance policy expired on 30 Jun 2026' },
    ],
  },
]
