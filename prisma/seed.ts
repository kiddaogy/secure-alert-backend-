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
  console.log('🌱 Seed completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
