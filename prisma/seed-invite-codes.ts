import { prisma } from '@/app/lib/prisma';

async function main() {
    const codes = [
        { code: 'PREDIKT-BETA', maxUses: 1000 },
        { code: 'ALPHA-ALPHA', maxUses: 100 },
    ];

    console.log('🌱 Seeding invite codes...');

    for (const item of codes) {
        const existing = await prisma.inviteCode.findUnique({
            where: { code: item.code },
        });

        if (!existing) {
            await prisma.inviteCode.create({
                data: {
                    id: `seed-${item.code.toLowerCase()}`,
                    code: item.code,
                    maxUses: item.maxUses,
                    isActive: true,
                },
            });
            console.log(`✅ Created code: ${item.code}`);
        } else {
            console.log(`⏩ Code ${item.code} already exists, skipping.`);
        }
    }

    console.log('✅ Seeding complete.');
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
