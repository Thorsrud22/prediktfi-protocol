
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const total = await prisma.ideaEvaluation.count();
    const withWallet = await prisma.ideaEvaluation.count({
        where: {
            walletId: { not: null }
        }
    });

    console.log(`Total evaluations: ${total}`);
    console.log(`Evaluations with wallet: ${withWallet}`);
    console.log(`Evaluations without wallet: ${total - withWallet}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
