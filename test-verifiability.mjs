import { PrismaClient } from '@prisma/client';
import { verifiabilityScore, selectResolver } from './app/lib/resolvers.ts';

async function testVerifiability() {
  const prisma = new PrismaClient();
  
  try {
    // Test verifiability function with different examples
    console.log('=== Testing Verifiability Score Function ===');
    
    // PRICE resolver with Bitcoin ticker
    const priceResolver = selectResolver('PRICE', 'Bitcoin will reach $120,000 by January 31, 2025');
    console.log('PRICE resolver (Bitcoin):', JSON.stringify(priceResolver, null, 2));
    console.log('Verifiability score:', verifiabilityScore('PRICE', priceResolver));
    
    // URL resolver
    const urlResolver = selectResolver('URL', 'Will this specific URL contain text?');
    console.log('\nURL resolver:', JSON.stringify(urlResolver, null, 2));
    console.log('Verifiability score:', verifiabilityScore('URL', urlResolver));
    
    // TEXT resolver
    const textResolver = selectResolver('TEXT', 'Will some general event happen?');
    console.log('\nTEXT resolver:', JSON.stringify(textResolver, null, 2));
    console.log('Verifiability score:', verifiabilityScore('TEXT', textResolver));
    
    // Check if any insights exist in database
    const insights = await prisma.insight.findMany({
      take: 1,
      include: {
        creator: true
      }
    });
    
    if (insights.length > 0) {
      console.log('\n=== Sample Insight from Database ===');
      const insight = insights[0];
      const resolverRef = JSON.parse(insight.resolverRef);
      const score = verifiabilityScore(insight.resolverKind, resolverRef);
      
      console.log('Insight ID:', insight.id);
      console.log('Canonical:', insight.canonical);
      console.log('Resolver Kind:', insight.resolverKind);
      console.log('Resolver Ref:', resolverRef);
      console.log('Calculated Verifiability Score:', score);
    } else {
      console.log('\n=== Creating Test Insight ===');
      const creator = await prisma.creator.upsert({
        where: { handle: 'verifiability_tester' },
        update: {},
        create: {
          handle: 'verifiability_tester',
          score: 0.0,
          accuracy: null
        }
      });
      
      const statement = 'Bitcoin will reach $120,000 by January 31, 2025';
      const resolver = selectResolver('PRICE', statement);
      
      const insight = await prisma.insight.create({
        data: {
          canonical: statement,
          p: 0.75,
          deadline: new Date('2025-01-31T23:59:59.000Z'),
          resolverKind: 'PRICE',
          resolverRef: JSON.stringify(resolver),
          status: 'DRAFT',
          creatorId: creator.id
        }
      });
      
      console.log('Created test insight with ID:', insight.id);
      console.log('Visit: http://localhost:3000/i/' + insight.id);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testVerifiability();