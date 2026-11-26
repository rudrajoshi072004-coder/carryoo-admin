import { listBookings } from '../api/services/bookings'
import { listVehicleCategories } from '../api/services/vehicleCategories'
import {
  fetchCustomersAdmin,
  fetchDriversAdmin,
  fetchNotificationsAdmin,
  fetchPaymentsAdmin,
  fetchSupportAdmin,
  fetchSystemLogsAdmin,
  fetchTripsAdmin,
  fetchWalletAdmin,
} from '../api/services/adminData'
import { downloadZip, toCsv } from './csvZip'

function stamp() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

async function settled<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try {
    return await promise
  } catch {
    return fallback
  }
}

export async function downloadFullCarryooBackup() {
  const [
    drivers,
    customers,
    bookings,
    trips,
    payments,
    support,
    wallet,
    categories,
    logs,
    notifications,
  ] = await Promise.all([
    settled(fetchDriversAdmin(), []),
    settled(fetchCustomersAdmin(), []),
    settled(listBookings({ page_size: 500 }), []),
    settled(fetchTripsAdmin(), []),
    settled(fetchPaymentsAdmin(), { summary: {
      daily: 0, weekly: 0, monthly: 0, driverPayouts: 0, pendingWithdrawals: 0, refunds: 0, commissions: 0,
    }, transactions: [] }),
    settled(fetchSupportAdmin(), { tickets: [], chats: [], kpis: [] }),
    settled(fetchWalletAdmin(), {
      summary: { credits: 0, debits: 0, bonus: 0, referral: 0, withdrawals: 0, balance: 0 },
      history: [],
      flowSeries: [],
      balanceSeries: [],
    }),
    settled(listVehicleCategories(), []),
    settled(fetchSystemLogsAdmin(), []),
    settled(fetchNotificationsAdmin(), { templates: [], history: [] }),
  ])

  const driverRows = drivers.map((driver) => [
    driver.displayId ?? driver.id,
    driver.id,
    driver.name,
    driver.phone,
    driver.accountPhone ?? '',
    driver.driverPhone ?? '',
    driver.email,
    driver.city,
    driver.status,
    driver.vehicle,
    driver.vehicleType,
    driver.vehicleDetails.make,
    driver.vehicleDetails.model,
    driver.vehicleDetails.year,
    driver.vehicleDetails.color,
    driver.vehicleDetails.plate,
    driver.vehicleDetails.insurance,
    driver.vehicleDetails.fitness,
    driver.vehicleDetails.fuelType ?? '',
    driver.rating,
    driver.trips,
    driver.wallet,
    driver.totalEarnings,
    driver.todayEarnings,
    driver.avgTripValue,
    driver.completionRate,
    driver.acceptanceRate,
    driver.cancellationRate,
    driver.joined,
    driver.emergencyContact.name,
    driver.emergencyContact.phone,
    driver.emergencyContact.relation,
    driver.bankDetails.accountName,
    driver.bankDetails.bank,
    driver.bankDetails.accountNumber,
    driver.bankDetails.ifsc,
    driver.bankDetails.upi,
  ])

  const documentRows = drivers.flatMap((driver) =>
    driver.documents.map((doc) => [
      driver.displayId ?? driver.id,
      driver.name,
      driver.phone,
      doc.type,
      doc.number,
      doc.status,
      doc.expiry,
    ]),
  )

  const customerRows = customers.map((customer) => [
    customer.id,
    customer.name,
    customer.phone,
    customer.email,
    customer.city,
    customer.status,
    customer.orders,
    customer.lifetimeSpend,
    customer.wallet,
    customer.rating,
    customer.joined,
    customer.referrals.code,
    customer.referrals.invites,
    customer.referrals.successful,
    customer.referrals.earnings,
  ])

  const addressRows = customers.flatMap((customer) =>
    customer.addresses.map((address) => [
      customer.id,
      customer.name,
      customer.phone,
      address.label,
      address.line1,
      address.line2 ?? '',
      address.city,
      address.pincode,
      address.isDefault ? 'Yes' : 'No',
    ]),
  )

  const customerComplaintRows = customers.flatMap((customer) =>
    customer.complaints.map((complaint) => [
      customer.id,
      customer.name,
      customer.phone,
      complaint.id,
      complaint.subject,
      complaint.status,
      complaint.date,
      complaint.resolution ?? '',
    ]),
  )

  const reviewRows = customers.flatMap((customer) =>
    customer.reviews.map((review) => [
      customer.id,
      customer.name,
      review.id,
      review.rating,
      review.comment,
      review.date,
      review.driverName,
    ]),
  )

  const bookingRows = bookings.map((booking) => [
    booking.id,
    booking.state,
    booking.booking_type,
    booking.customer_phone ?? '',
    booking.driver_summary?.name ?? '',
    booking.driver_summary?.phone ?? booking.driver ?? '',
    booking.vehicle_category ?? '',
    booking.pickup_address_text,
    booking.drop_address_text,
    booking.estimated_distance_km ?? '',
    booking.estimated_duration_min ?? '',
    booking.estimated_fare ?? '',
    booking.final_fare ?? '',
    booking.notes ?? '',
    booking.created_at,
  ])

  const tripRows = trips.map((trip) => [
    trip.id,
    trip.orderId,
    trip.driver,
    trip.driverId,
    trip.customer,
    trip.customerPhone,
    trip.pickup,
    trip.drop,
    trip.route,
    trip.vehicle,
    trip.vehicleType,
    trip.distance,
    trip.fare,
    trip.status,
    trip.duration,
    trip.started,
    trip.city,
    trip.notes ?? '',
  ])

  const paymentRows = payments.transactions.map((txn) => [
    txn.id,
    txn.type,
    txn.party,
    txn.amount,
    txn.method,
    txn.status,
    txn.date,
    txn.time,
    txn.reference ?? '',
    txn.city ?? '',
  ])

  const complaintRows = support.tickets.map((ticket) => [
    ticket.id,
    ticket.subject,
    ticket.category,
    ticket.requester,
    ticket.requesterEmail,
    ticket.priority,
    ticket.status,
    ticket.agent ?? '',
    ticket.channel,
    ticket.created,
    ticket.updated,
    ticket.messages.map((message) => `${message.sender}: ${message.body}`).join(' | '),
  ])

  const walletRows = wallet.history.map((entry) => [
    entry.id,
    entry.type,
    entry.description,
    entry.amount,
    entry.balance,
    entry.status,
    entry.date,
    entry.time,
    entry.party ?? '',
  ])

  const vehicleRows = categories.map((category) => [
    category.id,
    category.name,
    category.base_fare,
    category.base_fare_km ?? '',
    category.per_km_rate,
    category.minimum_fare ?? '',
    category.waiting_per_min ?? '',
    category.outstation_base_fare ?? '',
    category.outstation_base_fare_km ?? '',
    category.outstation_per_km_rate ?? '',
    category.outstation_minimum_fare ?? '',
    category.outstation_step_km ?? '',
    category.outstation_step_discount ?? '',
    category.max_weight_kg ?? '',
    category.active ? 'Active' : 'Inactive',
    category.helper_supported ? 'Yes' : 'No',
    category.intra_city_available ? 'Yes' : 'No',
  ])

  const logRows = logs.map((log) => [
    log.id,
    log.category,
    log.severity,
    log.timestamp,
    log.user,
    log.action,
    log.resource,
    log.ip,
    log.city,
    log.details,
  ])

  const notificationRows = notifications.history.map((item) => [
    item.id,
    item.channel,
    item.audience,
    item.audienceDetail,
    item.title,
    item.message,
    item.sentAt,
    item.sentBy,
    item.recipients,
    item.status,
  ])

  const readme = [
    'Carryoo full data backup',
    `Generated: ${new Date().toLocaleString('en-IN')}`,
    '',
    'CSV files in this ZIP:',
    `- drivers.csv (${drivers.length} rows)`,
    `- driver_documents.csv (${documentRows.length} rows)`,
    `- customers.csv (${customers.length} rows)`,
    `- customer_addresses.csv (${addressRows.length} rows)`,
    `- customer_complaints.csv (${customerComplaintRows.length} rows)`,
    `- customer_reviews.csv (${reviewRows.length} rows)`,
    `- bookings.csv (${bookings.length} rows)`,
    `- trips.csv (${trips.length} rows)`,
    `- payments.csv (${payments.transactions.length} rows)`,
    `- complaints.csv (${support.tickets.length} rows)`,
    `- wallet_transactions.csv (${wallet.history.length} rows)`,
    `- vehicle_types.csv (${categories.length} rows)`,
    `- system_logs.csv (${logs.length} rows)`,
    `- notifications.csv (${notifications.history.length} rows)`,
    '',
    'Open any CSV in Excel or Google Sheets.',
  ].join('\r\n')

  downloadZip(`carryoo-full-backup-${stamp()}.zip`, [
    { name: 'README.txt', content: readme },
    {
      name: 'drivers.csv',
      content: toCsv(
        [
          'Display ID', 'Driver ID', 'Name', 'Phone', 'Account phone', 'Driver phone', 'Email', 'City', 'Status',
          'Vehicle', 'Vehicle type', 'Make', 'Model', 'Year', 'Color', 'Plate', 'Insurance', 'Fitness', 'Fuel type',
          'Rating', 'Trips', 'Wallet', 'Total earnings', 'Today earnings', 'Avg trip value',
          'Completion %', 'Acceptance %', 'Cancellation %', 'Joined',
          'Emergency name', 'Emergency phone', 'Emergency relation',
          'Bank account name', 'Bank', 'Account number', 'IFSC', 'UPI',
        ],
        driverRows,
      ),
    },
    {
      name: 'driver_documents.csv',
      content: toCsv(
        ['Driver ID', 'Driver name', 'Phone', 'Document type', 'Number', 'Status', 'Expiry'],
        documentRows,
      ),
    },
    {
      name: 'customers.csv',
      content: toCsv(
        [
          'Customer ID', 'Name', 'Phone', 'Email', 'City', 'Status', 'Orders', 'Lifetime spend',
          'Wallet', 'Rating', 'Joined', 'Referral code', 'Invites', 'Successful referrals', 'Referral earnings',
        ],
        customerRows,
      ),
    },
    {
      name: 'customer_addresses.csv',
      content: toCsv(
        ['Customer ID', 'Name', 'Phone', 'Label', 'Line 1', 'Line 2', 'City', 'Pincode', 'Default'],
        addressRows,
      ),
    },
    {
      name: 'customer_complaints.csv',
      content: toCsv(
        ['Customer ID', 'Name', 'Phone', 'Complaint ID', 'Subject', 'Status', 'Date', 'Resolution'],
        customerComplaintRows,
      ),
    },
    {
      name: 'customer_reviews.csv',
      content: toCsv(
        ['Customer ID', 'Name', 'Review ID', 'Rating', 'Comment', 'Date', 'Driver'],
        reviewRows,
      ),
    },
    {
      name: 'bookings.csv',
      content: toCsv(
        [
          'Booking ID', 'State', 'Type', 'Customer phone', 'Driver name', 'Driver phone', 'Vehicle',
          'Pickup', 'Drop', 'Distance km', 'Duration min', 'Estimated fare', 'Final fare', 'Notes', 'Created at',
        ],
        bookingRows,
      ),
    },
    {
      name: 'trips.csv',
      content: toCsv(
        [
          'Trip ID', 'Order ID', 'Driver', 'Driver ID', 'Customer', 'Customer phone', 'Pickup', 'Drop', 'Route',
          'Vehicle', 'Vehicle type', 'Distance', 'Fare', 'Status', 'Duration', 'Started', 'City', 'Notes',
        ],
        tripRows,
      ),
    },
    {
      name: 'payments.csv',
      content: toCsv(
        ['Transaction ID', 'Type', 'Party', 'Amount', 'Method', 'Status', 'Date', 'Time', 'Reference', 'City'],
        paymentRows,
      ),
    },
    {
      name: 'complaints.csv',
      content: toCsv(
        [
          'Ticket ID', 'Subject', 'Category', 'Requester', 'Email', 'Priority', 'Status', 'Agent',
          'Channel', 'Created', 'Updated', 'Messages',
        ],
        complaintRows,
      ),
    },
    {
      name: 'wallet_transactions.csv',
      content: toCsv(
        ['ID', 'Type', 'Description', 'Amount', 'Balance', 'Status', 'Date', 'Time', 'Party'],
        walletRows,
      ),
    },
    {
      name: 'vehicle_types.csv',
      content: toCsv(
        [
          'ID', 'Name', 'Base fare', 'Base fare km', 'Per km', 'Minimum fare', 'Waiting / min',
          'Outstation base', 'Outstation base km', 'Outstation per km', 'Outstation minimum',
          'Outstation step km', 'Outstation per km subtract', 'Max weight kg',
          'Status', 'Helper', 'Intra city',
        ],
        vehicleRows,
      ),
    },
    {
      name: 'system_logs.csv',
      content: toCsv(
        ['ID', 'Category', 'Severity', 'Timestamp', 'User', 'Action', 'Resource', 'IP', 'City', 'Details'],
        logRows,
      ),
    },
    {
      name: 'notifications.csv',
      content: toCsv(
        ['ID', 'Channel', 'Audience', 'Audience detail', 'Title', 'Message', 'Sent at', 'Sent by', 'Recipients', 'Status'],
        notificationRows,
      ),
    },
  ])

  return {
    drivers: drivers.length,
    customers: customers.length,
    bookings: bookings.length,
    complaints: support.tickets.length + customerComplaintRows.length,
  }
}
