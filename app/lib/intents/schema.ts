/**
 * Intent schema validation using Zod
 * Strict validation for trading intents
 */

import { z } from 'zod';

// Supported trading pairs in v1 - Focus on SOL/USDC for initial launch
const SUPPORTED_BASES = ['SOL'] as const;
const SUPPORTED_QUOTES = ['USDC'] as const;
const SUPPORTED_SIDES = ['BUY', 'SELL'] as const;

// Size configuration schema
export const SizeSchema = z.object({
  type: z.enum(['pct', 'abs']),
  value: z.number().positive().max(50), // Max 50% for safety
  token: z.string().optional()
});

// Take profit / Stop loss schema
export const TPSLSchema = z.object({
  type: z.enum(['pct', 'abs']),
  value: z.number().positive(),
  trigger: z.number().positive().optional()
});

// Guards schema for risk management
export const GuardsSchema = z.object({
  dailyLossCapPct: z.number().min(0).max(20), // Max 20% daily loss
  posLimitPct: z.number().min(0).max(50), // Max 50% position size
  minLiqUsd: z.number().min(100000), // Min $100k liquidity
  maxSlippageBps: z.number().min(0).max(100), // Max 1% slippage
  expiresAt: z.string().datetime() // ISO string
});

// Main intent schema
export const IntentSchema = z.object({
  walletId: z.string().min(1),
  strategyId: z.string().optional(),
  chain: z.string().default('solana'),
  base: z.enum(SUPPORTED_BASES),
  quote: z.enum(SUPPORTED_QUOTES).default('USDC'),
  side: z.enum(SUPPORTED_SIDES),
  sizeJson: SizeSchema,
  tpJson: TPSLSchema.optional(),
  slJson: TPSLSchema.optional(),
  rationale: z.string().max(1000).optional(),
  confidence: z.number().min(0).max(1).optional(),
  backtestWin: z.number().min(0).max(1).optional(),
  expectedDur: z.string().optional(),
  guardsJson: GuardsSchema,
  venuePref: z.string().default('jupiter'),
  simOnly: z.boolean().default(false)
});

// Create intent request schema
export const CreateIntentSchema = z.object({
  signalId: z.string().optional(),
  intent: IntentSchema,
  idempotencyKey: z.string().min(1).max(100)
});

// Simulate intent request schema
export const SimulateIntentSchema = z.object({
  intentId: z.string().min(1)
});

// Execute intent request schema
export const ExecuteIntentSchema = z.object({
  intentId: z.string().min(1),
  idempotencyKey: z.string().min(1).max(100)
});

// Type exports
export type Size = z.infer<typeof SizeSchema>;
export type TPSL = z.infer<typeof TPSLSchema>;
export type Guards = z.infer<typeof GuardsSchema>;
export type Intent = z.infer<typeof IntentSchema>;
export type CreateIntentRequest = z.infer<typeof CreateIntentSchema>;
export type SimulateIntentRequest = z.infer<typeof SimulateIntentSchema>;
export type ExecuteIntentRequest = z.infer<typeof ExecuteIntentSchema>;

// Validation helpers
export function validateIntent(data: unknown): { valid: boolean; errors: string[]; intent?: Intent } {
  try {
    const intent = IntentSchema.parse(data);
    return { valid: true, errors: [], intent };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        valid: false, 
        errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      };
    }
    return { valid: false, errors: ['Unknown validation error'] };
  }
}

export function validateCreateIntent(data: unknown): { valid: boolean; errors: string[]; request?: CreateIntentRequest } {
  try {
    const request = CreateIntentSchema.parse(data);
    return { valid: true, errors: [], request };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        valid: false, 
        errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      };
    }
    return { valid: false, errors: ['Unknown validation error'] };
  }
}

export function validateSimulateIntent(data: unknown): { valid: boolean; errors: string[]; request?: SimulateIntentRequest } {
  try {
    const request = SimulateIntentSchema.parse(data);
    return { valid: true, errors: [], request };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        valid: false, 
        errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      };
    }
    return { valid: false, errors: ['Unknown validation error'] };
  }
}

export function validateExecuteIntent(data: unknown): { valid: boolean; errors: string[]; request?: ExecuteIntentRequest } {
  try {
    const request = ExecuteIntentSchema.parse(data);
    return { valid: true, errors: [], request };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        valid: false, 
        errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      };
    }
    return { valid: false, errors: ['Unknown validation error'] };
  }
}

// Guard validation helpers
export function validateGuards(guards: Guards): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check expiry is in the future
  const expiresAt = new Date(guards.expiresAt);
  const now = new Date();
  if (expiresAt <= now) {
    errors.push('expiresAt must be in the future');
  }
  
  // Check expiry is not too far in the future (max 24h)
  const maxExpiry = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  if (expiresAt > maxExpiry) {
    errors.push('expiresAt cannot be more than 24 hours in the future');
  }
  
  return { valid: errors.length === 0, errors };
}
