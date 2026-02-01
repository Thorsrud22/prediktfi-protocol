
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const creators = await prisma.creator.findMany({
        select: {
            id: true,
            handle: true,
            wallet: true,
            insightsCount: true
        }
    })

    console.log('Creators:')
    console.table(creators)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
