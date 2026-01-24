
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Scanning Evaluation Log...\n');

    try {
        const evaluations = await prisma.ideaEvaluation.findMany({
            orderBy: { createdAt: 'desc' },
            take: 50 // Cap at 50 for safety
        });

        if (evaluations.length === 0) {
            console.log('✅ No evaluations found. The system is clean.');
            return;
        }

        console.log(`Found ${evaluations.length} evaluations:\n`);

        // Print header
        console.log(`${'ID'.padEnd(20)} | ${'DATE'.padEnd(20)} | ${'TYPE'.padEnd(10)} | ${'SCORE'} | ${'TITLE'}`);
        console.log('-'.repeat(100));

        for (const ev of evaluations) {
            const date = ev.createdAt.toISOString().replace('T', ' ').substring(0, 16);
            const title = ev.title.substring(0, 40);
            const score = ev.score.toFixed(1).padEnd(5);

            console.log(`${ev.id.padEnd(20)} | ${date.padEnd(20)} | ${ev.projectType.padEnd(10)} | ${score} | ${title}`);
        }

        console.log('\n--- End of Report ---');

    } catch (error) {
        console.error('❌ Failed to fetch evaluations:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
