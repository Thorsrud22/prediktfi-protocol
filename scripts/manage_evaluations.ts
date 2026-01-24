
import { PrismaClient } from '@prisma/client';
import readline from 'readline';

const prisma = new PrismaClient();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query: string): Promise<string> => {
    return new Promise((resolve) => {
        rl.question(query, resolve);
    });
};

async function listEvaluations() {
    const evaluations = await prisma.ideaEvaluation.findMany({
        orderBy: { createdAt: 'desc' },
        include: { wallet: true }
    });

    if (evaluations.length === 0) {
        console.log('No evaluations found.');
        return;
    }

    console.log('---------------------------------------------------------------------------------------------');
    console.log('| ID                 | Date       | Score | Type       | Wallet           | Title             |');
    console.log('---------------------------------------------------------------------------------------------');

    evaluations.forEach(ev => {
        const date = ev.createdAt.toISOString().split('T')[0];
        const score = ev.score.toFixed(1).padEnd(5);
        const type = ev.projectType.padEnd(10).slice(0, 10);
        const wallet = (ev.wallet?.address || 'Anonymous').slice(0, 16).padEnd(16);
        const title = ev.title.slice(0, 25).padEnd(25);

        console.log(`| ${ev.id} | ${date} | ${score} | ${type} | ${wallet} | ${title} |`);
    });
    console.log('---------------------------------------------------------------------------------------------');
    console.log(`Total: ${evaluations.length} evaluations`);
}

async function showEvaluation(id: string) {
    const ev = await prisma.ideaEvaluation.findUnique({
        where: { id },
        include: { wallet: true }
    });

    if (!ev) {
        console.log(`Evaluation with ID ${id} not found.`);
        return;
    }

    console.log(JSON.stringify(ev, null, 2));
}

async function deleteEvaluation(id: string) {
    const ev = await prisma.ideaEvaluation.findUnique({
        where: { id }
    });

    if (!ev) {
        console.log(`Evaluation with ID ${id} not found.`);
        return;
    }

    console.log(`You are about to DELETE evaluation:`);
    console.log(`Title: ${ev.title}`);
    console.log(`ID:    ${ev.id}`);

    const answer = await question('Are you sure? (yes/no): ');

    if (answer.toLowerCase() === 'yes') {
        await prisma.ideaEvaluation.delete({ where: { id } });
        console.log(`Evaluation ${id} deleted.`);
    } else {
        console.log('Deletion cancelled.');
    }
}

async function main() {
    const args = process.argv.slice(2);
    const command = args[0];
    const param = args[1];

    try {
        switch (command) {
            case 'list':
                await listEvaluations();
                break;
            case 'show':
                if (!param) {
                    console.log('Usage: show <id>');
                    break;
                }
                await showEvaluation(param);
                break;
            case 'delete':
                if (!param) {
                    console.log('Usage: delete <id>');
                    break;
                }
                await deleteEvaluation(param);
                break;
            default:
                console.log('Usage:');
                console.log('  npx tsx scripts/manage_evaluations.ts list');
                console.log('  npx tsx scripts/manage_evaluations.ts show <id>');
                console.log('  npx tsx scripts/manage_evaluations.ts delete <id>');
                break;
        }
    } catch (error) {
        console.error('An error occurred:', error);
    } finally {
        await prisma.$disconnect();
        rl.close();
    }
}

main();
