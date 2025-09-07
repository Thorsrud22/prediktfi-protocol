/**
 * Intent receipt management
 * Track simulation and execution results
 */

import { prisma } from '../prisma';

export interface SimulationResult {
  expectedPrice: number;
  worstCasePrice: number;
  estSlippageBps: number;
  estimatedImpactBps: number;
  feesUsd: number;
  liqOk: boolean;
  portfolioAfter: {
    totalValueUsd: number;
    holdings: Array<{
      asset: string;
      valueUsd: number;
      amount: number;
    }>;
  };
  simConfidence: number;
  quoteTimestamp: number;
  historicalAccuracy?: {
    accuracy: number;
    confidence: string;
    sampleSize: number;
  };
}

export interface ExecutionResult {
  txSig: string;
  blockTime: Date;
  realizedPrice: number;
  feesUsd: number;
  slippageBps: number;
  route: string[];
  actualSlippageBps: number;
}

/**
 * Create a receipt for an intent
 */
export async function createReceipt(
  intentId: string,
  status: 'simulated' | 'executed' | 'failed',
  payload?: SimulationResult | ExecutionResult | any,
  notes?: string
) {
  try {
    const receipt = await prisma.intentReceipt.create({
      data: {
        intentId,
        status,
        simJson: status === 'simulated' ? JSON.stringify(payload) : null,
        execJson: status === 'executed' ? JSON.stringify(payload) : null,
        txSig: status === 'executed' && payload ? (payload as ExecutionResult).txSig : null,
        realizedPx: status === 'executed' && payload ? (payload as ExecutionResult).realizedPrice : null,
        feesUsd: payload ? (payload as SimulationResult | ExecutionResult).feesUsd : null,
        slippageBps: payload ? (payload as SimulationResult | ExecutionResult).slippageBps : null,
        blockTime: status === 'executed' && payload ? (payload as ExecutionResult).blockTime : null,
        notes
      }
    });
    
    return receipt;
  } catch (error) {
    console.error('Failed to create receipt:', error);
    throw new Error('Failed to create receipt');
  }
}

/**
 * Update receipt on execution
 */
export async function updateReceiptOnExecute(
  receiptId: string,
  execPayload: ExecutionResult
) {
  try {
    const receipt = await prisma.intentReceipt.update({
      where: { id: receiptId },
      data: {
        status: 'executed',
        execJson: JSON.stringify(execPayload),
        txSig: execPayload.txSig,
        realizedPx: execPayload.realizedPrice,
        feesUsd: execPayload.feesUsd,
        slippageBps: execPayload.slippageBps,
        blockTime: execPayload.blockTime
      }
    });
    
    return receipt;
  } catch (error) {
    console.error('Failed to update receipt:', error);
    throw new Error('Failed to update receipt');
  }
}

/**
 * Get receipts for an intent
 */
export async function getIntentReceipts(intentId: string) {
  try {
    const receipts = await prisma.intentReceipt.findMany({
      where: { intentId },
      orderBy: { createdAt: 'desc' }
    });
    
    return receipts.map(receipt => ({
      id: receipt.id,
      status: receipt.status,
      txSig: receipt.txSig,
      simJson: receipt.simJson ? JSON.parse(receipt.simJson) : null,
      execJson: receipt.execJson ? JSON.parse(receipt.execJson) : null,
      realizedPx: receipt.realizedPx,
      feesUsd: receipt.feesUsd,
      slippageBps: receipt.slippageBps,
      blockTime: receipt.blockTime,
      notes: receipt.notes,
      createdAt: receipt.createdAt
    }));
  } catch (error) {
    console.error('Failed to get intent receipts:', error);
    throw new Error('Failed to get intent receipts');
  }
}

/**
 * Get latest receipt for an intent
 */
export async function getLatestReceipt(intentId: string) {
  try {
    const receipt = await prisma.intentReceipt.findFirst({
      where: { intentId },
      orderBy: { createdAt: 'desc' }
    });
    
    if (!receipt) {
      return null;
    }
    
    return {
      id: receipt.id,
      status: receipt.status,
      txSig: receipt.txSig,
      simJson: receipt.simJson ? JSON.parse(receipt.simJson) : null,
      execJson: receipt.execJson ? JSON.parse(receipt.execJson) : null,
      realizedPx: receipt.realizedPx,
      feesUsd: receipt.feesUsd,
      slippageBps: receipt.slippageBps,
      blockTime: receipt.blockTime,
      notes: receipt.notes,
      createdAt: receipt.createdAt
    };
  } catch (error) {
    console.error('Failed to get latest receipt:', error);
    throw new Error('Failed to get latest receipt');
  }
}

/**
 * Get simulation accuracy metrics
 */
export async function getSimulationAccuracy(
  base: string,
  quote: string,
  days: number = 30
) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const receipts = await prisma.intentReceipt.findMany({
      where: {
        status: 'executed',
        createdAt: { gte: cutoffDate },
        intent: {
          base,
          quote
        }
      },
      include: {
        intent: true
      }
    });
    
    if (receipts.length === 0) {
      return {
        totalExecutions: 0,
        accuracy: 0,
        avgSlippageBps: 0,
        confidence: 'insufficient_data'
      };
    }
    
    // Calculate accuracy based on slippage vs estimated
    let accurateCount = 0;
    let totalSlippageBps = 0;
    
    receipts.forEach(receipt => {
      if (receipt.simJson && receipt.execJson) {
        const simData = JSON.parse(receipt.simJson) as SimulationResult;
        const execData = JSON.parse(receipt.execJson) as ExecutionResult;
        
        const slippageDiff = Math.abs(simData.estSlippageBps - execData.slippageBps);
        if (slippageDiff <= 50) { // Within 0.5%
          accurateCount++;
        }
        
        totalSlippageBps += execData.slippageBps;
      }
    });
    
    const accuracy = (accurateCount / receipts.length) * 100;
    const avgSlippageBps = totalSlippageBps / receipts.length;
    
    return {
      totalExecutions: receipts.length,
      accuracy: Math.round(accuracy),
      avgSlippageBps: Math.round(avgSlippageBps),
      confidence: receipts.length >= 10 ? 'high' : receipts.length >= 5 ? 'medium' : 'low'
    };
  } catch (error) {
    console.error('Failed to get simulation accuracy:', error);
    return {
      totalExecutions: 0,
      accuracy: 0,
      avgSlippageBps: 0,
      confidence: 'error'
    };
  }
}
