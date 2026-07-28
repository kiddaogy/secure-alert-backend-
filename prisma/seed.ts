import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create Admin User
  const hashedPassword = await bcrypt.hash('admin123', 10)
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@securealert.com' },
    update: {},
    create: {
      email: 'admin@securealert.com',
      fullName: 'System Administrator',
      phone: '+1234567890',
      password: hashedPassword,
      role: 'ADMIN',
    },
  })

  console.log('✅ Admin user created:', admin.email)
  console.log('🔑 Password: admin123')

  // Create Police Users
  const policePassword = await bcrypt.hash('police123', 10)
  
  const police1 = await prisma.user.upsert({
    where: { email: 'police1@securealert.com' },
    update: {},
    create: {
      email: 'police1@securealert.com',
      fullName: 'Officer John Smith',
      phone: '+1234567891',
      password: policePassword,
      role: 'POLICE',
    },
  })

  const police2 = await prisma.user.upsert({
    where: { email: 'police2@securealert.com' },
    update: {},
    create: {
      email: 'police2@securealert.com',
      fullName: 'Officer Sarah Johnson',
      phone: '+1234567892',
      password: policePassword,
      role: 'POLICE',
    },
  })

  console.log('✅ Police users created:', police1.email, police2.email)
  console.log('🔑 Police password: police123')

  // Create Owner Users
  const ownerPassword = await bcrypt.hash('owner123', 10)
  
  const owner1 = await prisma.user.upsert({
    where: { email: 'owner1@securealert.com' },
    update: {},
    create: {
      email: 'owner1@securealert.com',
      fullName: 'James Wilson',
      phone: '+1234567893',
      password: ownerPassword,
      role: 'OWNER',
    },
  })

  const owner2 = await prisma.user.upsert({
    where: { email: 'owner2@securealert.com' },
    update: {},
    create: {
      email: 'owner2@securealert.com',
      fullName: 'Emily Davis',
      phone: '+1234567894',
      password: ownerPassword,
      role: 'OWNER',
    },
  })

  console.log('✅ Owner users created:', owner1.email, owner2.email)
  console.log('🔑 Owner password: owner123')

  // Create Locations with Pairing Codes
  const location1 = await prisma.location.upsert({
    where: { id: 'loc-001' },
    update: {},
    create: {
      id: 'loc-001',
      name: 'Main Office',
      address: '123 Business Street, City',
      type: 'SHOP',
      policeStation: 'Central Police Station',
      latitude: '40.7128',
      longitude: '-74.0060',
      pairingCode: 'SECURE123',
      ownerId: owner1.id,
    },
  })

  const location2 = await prisma.location.upsert({
    where: { id: 'loc-002' },
    update: {},
    create: {
      id: 'loc-002',
      name: 'Warehouse',
      address: '456 Industrial Ave, City',
      type: 'SHOP',
      policeStation: 'Central Police Station',
      latitude: '40.7138',
      longitude: '-74.0070',
      pairingCode: 'WARE456',
      ownerId: owner1.id,
    },
  })

  const location3 = await prisma.location.upsert({
    where: { id: 'loc-003' },
    update: {},
    create: {
      id: 'loc-003',
      name: 'Home Security',
      address: '789 Residential Blvd, City',
      type: 'HOME',
      policeStation: 'Central Police Station',
      latitude: '40.7148',
      longitude: '-74.0080',
      pairingCode: 'HOME789',
      ownerId: owner2.id,
    },
  })

  console.log('✅ Locations created with pairing codes:')
  console.log('   - Main Office: SECURE123')
  console.log('   - Warehouse: WARE456')
  console.log('   - Home Security: HOME789')

  // Create Sample Devices
  const device1 = await prisma.device.upsert({
    where: { deviceId: 'ESP32-TEST-001' },
    update: {},
    create: {
      deviceId: 'ESP32-TEST-001',
      status: 'OFFLINE',
      locationId: location1.id,
    },
  })

  const device2 = await prisma.device.upsert({
    where: { deviceId: 'ESP32-WARE-001' },
    update: {},
    create: {
      deviceId: 'ESP32-WARE-001',
      status: 'OFFLINE',
      locationId: location2.id,
    },
  })

  console.log('✅ Sample devices created')

  // Create Sample Alerts
  const alert1 = await prisma.alert.create({
    data: {
      deviceId: device1.id,
      locationId: location1.id,
      status: 'RESOLVED',
      triggeredAt: new Date(Date.now() - 86400000), // 1 day ago
    },
  })

  const alert2 = await prisma.alert.create({
    data: {
      deviceId: device1.id,
      locationId: location1.id,
      status: 'RESOLVED',
      triggeredAt: new Date(Date.now() - 172800000), // 2 days ago
    },
  })

  console.log('✅ Sample alerts created')

  console.log('🌱 Seed completed successfully!')
  console.log('\n📋 Login Credentials:')
  console.log('   Admin: admin@securealert.com / admin123')
  console.log('   Police: police1@securealert.com / police123')
  console.log('   Owner: owner1@securealert.com / owner123')
  console.log('\n🔑 Pairing Codes:')
  console.log('   Main Office: SECURE123 (for ESP32-TEST-001)')
  console.log('   Warehouse: WARE456')
  console.log('   Home Security: HOME789')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
