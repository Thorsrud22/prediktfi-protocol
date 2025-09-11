// Debug script to test the API logic
const { PrismaClient } = require('@prisma/client');

// Set the correct database URL
process.env.DATABASE_URL = "file:/Users/thorsrud/prediktfi-protocol/dev.db";

async function debugAPI() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Testing database queries...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL);
    
    // Test basic creator query first
    const creators = await prisma.creator.findMany();
    console.log('Creators found:', creators.length);
    
    // Test basic creator daily query
    const allRecords = await prisma.creatorDaily.findMany();
    console.log('All creator daily records:', allRecords.length);
    console.log('Sample record:', allRecords[0]);
    
    // Test aggregation query
    const aggregated = await prisma.creatorDaily.groupBy({
      by: ['creatorId'],
      _avg: {
        accuracy: true,
        consistency: true,
        volumeScore: true,
        recencyScore: true,
        score: true
      },
      _sum: {
        maturedN: true
      },
      _count: {
        creatorId: true
      }
    });
    console.log('Aggregated results:', aggregated.length);
    console.log('Sample aggregated:', aggregated[0]);
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

debugAPI();
