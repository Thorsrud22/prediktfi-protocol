/**
 * Generate Invite Codes Script
 * Creates 100 invite codes for the growth campaign
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function generateInviteCodes() {
  try {
    console.log('🚀 Generating 100 invite codes for growth campaign...');

    // Generate 100 codes
    const codes = [];
    for (let i = 0; i < 100; i++) {
      const code = generateCode();
      codes.push({
        code,
        maxUses: 1,
        isActive: true,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      });
    }

    // Insert codes into database (SQLite doesn't support skipDuplicates)
    const result = await prisma.inviteCode.createMany({
      data: codes
    });

    console.log(`✅ Successfully created ${result.count} invite codes`);
    console.log('📋 Sample codes:');
    codes.slice(0, 5).forEach((code, index) => {
      console.log(`   ${index + 1}. ${code.code}`);
    });

    console.log('\n🎯 Next steps:');
    console.log('1. Share codes with early users');
    console.log('2. Monitor usage in /advisor/actions');
    console.log('3. Track virality through usage counts');

  } catch (error) {
    console.error('❌ Error generating invite codes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

function generateCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Run the script
generateInviteCodes();
