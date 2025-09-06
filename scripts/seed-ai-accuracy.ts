#!/usr/bin/env tsx

/**
 * Seed AI accuracy data for demo purposes
 * This shows how the AI has performed historically
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding AI accuracy data...');

  const demoData = [
    { 
      modelVersion: 'enhanced-v1', 
      category: 'crypto', 
      accuracy: 0.72, 
      total: 25, 
      correct: 18,
      brierScore: 0.18
    },
    { 
      modelVersion: 'enhanced-v1', 
      category: 'technology', 
      accuracy: 0.85, 
      total: 20, 
      correct: 17,
      brierScore: 0.12
    },
    { 
      modelVersion: 'enhanced-v1', 
      category: 'politics', 
      accuracy: 0.65, 
      total: 15, 
      correct: 10,
      brierScore: 0.24
    },
    { 
      modelVersion: 'enhanced-v1', 
      category: 'sports', 
      accuracy: 0.78, 
      total: 18, 
      correct: 14,
      brierScore: 0.16
    },
    { 
      modelVersion: 'enhanced-v1', 
      category: 'business', 
      accuracy: 0.82, 
      total: 22, 
      correct: 18,
      brierScore: 0.14
    },
    { 
      modelVersion: 'enhanced-v1', 
      category: 'science', 
      accuracy: 0.88, 
      total: 16, 
      correct: 14,
      brierScore: 0.10
    },
    { 
      modelVersion: 'enhanced-v1', 
      category: 'economics', 
      accuracy: 0.75, 
      total: 12, 
      correct: 9,
      brierScore: 0.19
    },
  ];

  for (const data of demoData) {
    await prisma.aIAccuracy.upsert({
      where: {
        modelVersion_category: {
          modelVersion: data.modelVersion,
          category: data.category
        }
      },
      update: {
        totalPredictions: data.total,
        correctPredictions: data.correct,
        accuracy: data.accuracy,
        brierScore: data.brierScore,
        lastUpdated: new Date()
      },
      create: {
        modelVersion: data.modelVersion,
        category: data.category,
        totalPredictions: data.total,
        correctPredictions: data.correct,
        accuracy: data.accuracy,
        brierScore: data.brierScore,
        lastUpdated: new Date()
      }
    });

    console.log(`✅ ${data.category}: ${Math.round(data.accuracy * 100)}% (${data.correct}/${data.total})`);
  }

  // Calculate and display overall stats
  const totalPredictions = demoData.reduce((sum, d) => sum + d.total, 0);
  const totalCorrect = demoData.reduce((sum, d) => sum + d.correct, 0);
  const overallAccuracy = totalCorrect / totalPredictions;

  console.log(`\n📊 Overall AI Performance:`);
  console.log(`   Total predictions: ${totalPredictions}`);
  console.log(`   Overall accuracy: ${Math.round(overallAccuracy * 100)}%`);
  console.log(`   Best category: ${demoData.sort((a, b) => b.accuracy - a.accuracy)[0].category} (${Math.round(demoData.sort((a, b) => b.accuracy - a.accuracy)[0].accuracy * 100)}%)`);

  console.log('\n🎯 AI accuracy data seeded successfully!');
  console.log('💡 This demonstrates how Predikt AI builds a track record over time');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
