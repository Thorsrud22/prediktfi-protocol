// Test database directly
const { PrismaClient } = require('@prisma/client');

async function testDB() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: "file:/Users/thorsrud/prediktfi-protocol/dev.db"
      }
    }
  });
  
  try {
    console.log('Testing database connection...');
    
    // Test basic query
    const allRecords = await prisma.creatorDaily.findMany();
    console.log('All records:', allRecords.length);
    
    if (allRecords.length > 0) {
      console.log('Sample record:', allRecords[0]);
      
      // Test date filtering
      const now = new Date();
      const since = new Date();
      since.setDate(since.getDate() - 30);
      
      console.log('Now:', now.toISOString());
      console.log('Since:', since.toISOString());
      
      // Test without date filtering first
      const allRecordsInPeriod = await prisma.creatorDaily.findMany({
        where: {
          day: {
            gte: since
          }
        }
      });
      
      console.log('Records >= since:', allRecordsInPeriod.length);
      
      const filteredRecords = await prisma.creatorDaily.findMany({
        where: {
          day: {
            gte: since,
            lte: now
          }
        }
      });
      
      console.log('Filtered records:', filteredRecords.length);
      
      // Test with exact date
      const exactDate = new Date('2025-09-09T19:41:34.000Z');
      const exactRecords = await prisma.creatorDaily.findMany({
        where: {
          day: {
            gte: exactDate,
            lte: exactDate
          }
        }
      });
      
      console.log('Exact date records:', exactRecords.length);
      
      // Test with a wider range
      const wideSince = new Date('2025-09-09T00:00:00.000Z');
      const wideUntil = new Date('2025-09-09T23:59:59.999Z');
      const wideRecords = await prisma.creatorDaily.findMany({
        where: {
          day: {
            gte: wideSince,
            lte: wideUntil
          }
        }
      });
      
      console.log('Wide range records:', wideRecords.length);
      
      // Test distinct query without date filtering
      const distinctCreators = await prisma.creatorDaily.findMany({
        select: {
          creatorId: true
        },
        distinct: ['creatorId']
      });
      
      console.log('Distinct creators (no filter):', distinctCreators.length);
      console.log('Creator IDs:', distinctCreators.map(c => c.creatorId));
      
      // Test with date filtering
      const distinctCreatorsFiltered = await prisma.creatorDaily.findMany({
        where: {
          day: {
            gte: since,
            lte: now
          }
        },
        select: {
          creatorId: true
        },
        distinct: ['creatorId']
      });
      
      console.log('Distinct creators (filtered):', distinctCreatorsFiltered.length);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testDB();
