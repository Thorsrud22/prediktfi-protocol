
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const ideaEvalsCount = await prisma.ideaEvaluation.count()
    const outcomesCount = await prisma.outcome.count()
    const walletsCount = await prisma.wallet.count()
    const insightsCount = await prisma.insight.count()
    const eventsCount = await prisma.event.count()
    const userEventsCount = await prisma.userEvent.count()

    console.log({
        ideaEvalsCount,
        outcomesCount,
        walletsCount,
        insightsCount,
        eventsCount,
        userEventsCount
    })

    const otherWallets = await prisma.ideaEvaluation.groupBy({
        by: ['walletId'],
        _count: {
            id: true
        }
    })
    console.log('IdeaEvaluations by Wallet:')
    console.table(otherWallets)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
