import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    const users = await prisma.appUser.findMany({ take: 1 })
    console.log('Successfully connected to the database')
    console.log('Sample user count:', users.length)
  } catch (err) {
    console.error('Failed to connect to the database:', err)
  } finally {
    await prisma.$disconnect()
  }
}

main()
