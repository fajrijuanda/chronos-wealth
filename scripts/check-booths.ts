import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    // Get active user with their booths
    const user = await prisma.appUser.findFirst({
      include: {
        boothOwnerships: {
          include: {
            booth: true
          }
        }
      }
    })

    if (!user) {
      console.log('No users found')
      return
    }

    console.log('\n=== User Info ===')
    console.log('User ID:', user.id)
    console.log('Email:', user.email)

    console.log('\n=== Booth Ownerships ===')
    console.log('Total BoothOwnership records:', user.boothOwnerships.length)
    
    user.boothOwnerships.forEach((ownership, index) => {
      console.log(`\nBooth ${index + 1}:`)
      console.log('  - Booth Name:', ownership.booth.name)
      console.log('  - Booth ID:', ownership.boothId)
      console.log('  - Capital Amount:', ownership.capitalAmount)
      console.log('  - Revenue Share %:', ownership.revenueSharePct)
      console.log('  - Expected Monthly Income:', ownership.booth.expectedMonthlyIncome)
      console.log('  - Unit Count:', ownership.booth.boothUnitCount)
    })

  } catch (err) {
    console.error('Error:', err)
  } finally {
    await prisma.$disconnect()
  }
}

main()
