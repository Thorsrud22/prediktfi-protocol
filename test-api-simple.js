// Simple test to check if the API works
const { PrismaClient } = require('@prisma/client');

async function testAPI() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Testing database connection...');
    
    // Test basic query
    const creators = await prisma.creator.findMany({ take: 1 });
    console.log('Creators found:', creators.length);
    
    // Test creator daily query
    const dailyRecords = await prisma.creatorDaily.findMany({ take: 1 });
    console.log('Daily records found:', dailyRecords.length);
    
    // Test the scoring functions
    const { calculateCreatorScore } = require('./app/lib/creatorScore.ts');
    const testScore = calculateCreatorScore({
      maturedN: 25,
      brierMean: 0.3,
      retStd30d: 0.1,
      notional30d: 10000
    });
    console.log('Test score calculation:', testScore);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testAPI();
