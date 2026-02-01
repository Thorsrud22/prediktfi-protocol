
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const evaluations = await prisma.ideaEvaluation.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: {
      id: true,
      walletId: true,
      title: true,
      createdAt: true,
    }
  })

  console.log('Recent Evaluations:')
  console.table(evaluations)
  
  const uniqueWallets = [...new Set(evaluations.map(e => e.walletId))]
  console.log('Unique Wallets:', uniqueWallets)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
