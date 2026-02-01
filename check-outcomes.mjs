
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const outcomes = await prisma.outcome.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
            insight: {
                select: {
                    question: true
                }
            }
        }
    })

    console.log('Recent Outcomes:')
    console.table(outcomes.map(o => ({
        id: o.id,
        insightId: o.insightId,
        question: o.insight?.question?.substring(0, 50),
        result: o.result,
        decidedBy: o.decidedBy,
        createdAt: o.createdAt
    })))

    const userDecided = outcomes.filter(o => o.decidedBy === 'USER')
    console.log('User Decided Outcomes:', userDecided.length)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
