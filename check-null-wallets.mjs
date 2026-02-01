
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const nullWalletEvals = await prisma.ideaEvaluation.findMany({
        where: {
            walletId: null
        }
    })

    console.log('Evaluations with NULL walletId:', nullWalletEvals.length)
    if (nullWalletEvals.length > 0) {
        console.table(nullWalletEvals.map(e => ({
            id: e.id,
            title: e.title,
            createdAt: e.createdAt
        })))
    }
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
