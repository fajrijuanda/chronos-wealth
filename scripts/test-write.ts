import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    const email = 'test_agent@example.com'
    const displayName = 'Test Agent'
    
    console.log('Attempting to create user...')
    const result = await prisma.appUser.upsert({
      where: { email },
      update: { displayName },
      create: { 
        email, 
        displayName,
        boothBasePrice: 7500000 
      },
    })
    console.log('Successfully created/updated user:', result)
    
    // Clean up
    await prisma.appUser.delete({ where: { id: result.id } })
    console.log('Successfully deleted test user')
  } catch (err) {
    console.error('CRITICAL ERROR DURING DB OPERATION:', err)
  } finally {
    await prisma.$disconnect()
  }
}

main()
