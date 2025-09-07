/**
 * Copy Trading System
 * Enables sharing of trading templates with sanitization and size adjustment
 */

import { z } from 'zod';

// Template schema for copy trading
export const CopyTradingTemplateSchema = z.object({
  id: z.string(),
  base: z.literal('SOL'),
  quote: z.literal('USDC'),
  side: z.enum(['BUY', 'SELL']),
  rationale: z.string().min(10).max(500),
  confidence: z.number().min(0.1).max(1.0),
  expectedDur: z.enum(['1d', '3d', '7d', '14d', '30d']),
  // Guards (sanitized for safety)
  dailyLossCapPct: z.number().min(1).max(10),
  posLimitPct: z.number().min(5).max(25),
  minLiqUsd: z.number().min(10000).max(1000000),
  maxSlippageBps: z.number().min(10).max(100),
  expiresHours: z.number().min(1).max(168), // Max 1 week
  // Metadata
  createdAt: z.date(),
  createdBy: z.string().optional(),
  shareable: z.boolean().default(true)
});

export type CopyTradingTemplate = z.infer<typeof CopyTradingTemplateSchema>;

export interface SanitizedTemplate {
  base: 'SOL';
  quote: 'USDC';
  side: 'BUY' | 'SELL';
  rationale: string;
  confidence: number;
  expectedDur: string;
  // Sanitized guards with safe defaults
  dailyLossCapPct: number;
  posLimitPct: number;
  minLiqUsd: number;
  maxSlippageBps: number;
  expiresHours: number;
  // Template metadata
  templateId: string;
  originalCreator?: string;
  isCopy: boolean;
}

export class CopyTradingService {
  /**
   * Create a shareable template from an intent
   */
  static createTemplate(intent: any): CopyTradingTemplate {
    const template: CopyTradingTemplate = {
      id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      base: 'SOL',
      quote: 'USDC',
      side: intent.side,
      rationale: intent.rationale || '',
      confidence: intent.confidence || 0.8,
      expectedDur: intent.expectedDur || '14d',
      // Sanitize guards to safe ranges
      dailyLossCapPct: Math.min(Math.max(intent.guardsJson?.dailyLossCapPct || 3, 1), 10),
      posLimitPct: Math.min(Math.max(intent.guardsJson?.posLimitPct || 10, 5), 25),
      minLiqUsd: Math.min(Math.max(intent.guardsJson?.minLiqUsd || 50000, 10000), 1000000),
      maxSlippageBps: Math.min(Math.max(intent.guardsJson?.maxSlippageBps || 30, 10), 100),
      expiresHours: Math.min(Math.max(intent.guardsJson?.expiresHours || 24, 1), 168),
      createdAt: new Date(),
      createdBy: intent.walletId,
      shareable: true
    };

    return template;
  }

  /**
   * Sanitize a template for safe sharing
   */
  static sanitizeTemplate(template: CopyTradingTemplate): SanitizedTemplate {
    return {
      base: 'SOL',
      quote: 'USDC',
      side: template.side,
      rationale: this.sanitizeRationale(template.rationale),
      confidence: Math.min(Math.max(template.confidence, 0.1), 1.0),
      expectedDur: template.expectedDur,
      // Apply conservative sanitization
      dailyLossCapPct: Math.min(Math.max(template.dailyLossCapPct, 1), 5),
      posLimitPct: Math.min(Math.max(template.posLimitPct, 5), 15),
      minLiqUsd: Math.max(template.minLiqUsd, 50000),
      maxSlippageBps: Math.min(Math.max(template.maxSlippageBps, 20), 50),
      expiresHours: Math.min(Math.max(template.expiresHours, 6), 48),
      templateId: template.id,
      originalCreator: template.createdBy,
      isCopy: true
    };
  }

  /**
   * Sanitize rationale text
   */
  private static sanitizeRationale(rationale: string): string {
    // Remove potentially sensitive information
    let sanitized = rationale
      .replace(/\b\d+%\b/g, '[SIZE]') // Replace specific percentages
      .replace(/\$\d+/g, '[AMOUNT]') // Replace specific amounts
      .replace(/\b\d+\.\d+\b/g, '[NUMBER]') // Replace specific numbers
      .trim();

    // Ensure minimum length
    if (sanitized.length < 10) {
      sanitized = 'Trading strategy based on market analysis.';
    }

    // Ensure maximum length
    if (sanitized.length > 500) {
      sanitized = sanitized.substring(0, 497) + '...';
    }

    return sanitized;
  }

  /**
   * Generate shareable template URL
   */
  static generateShareUrl(templateId: string, baseUrl: string = process.env.NEXT_PUBLIC_APP_URL || 'https://predikt.fi'): string {
    return `${baseUrl}/copy-trade/${templateId}`;
  }

  /**
   * Parse template from URL
   */
  static parseTemplateId(url: string): string | null {
    const match = url.match(/\/copy-trade\/([a-zA-Z0-9_]+)/);
    return match ? match[1] : null;
  }

  /**
   * Validate template ID format
   */
  static isValidTemplateId(templateId: string): boolean {
    return /^template_\d+_[a-zA-Z0-9]+$/.test(templateId);
  }
}

/**
 * Template storage interface
 */
export interface TemplateStorage {
  save(template: CopyTradingTemplate): Promise<void>;
  get(templateId: string): Promise<CopyTradingTemplate | null>;
  delete(templateId: string): Promise<void>;
  list(createdBy?: string): Promise<CopyTradingTemplate[]>;
}

/**
 * In-memory template storage (for demo purposes)
 * In production, this would use a database
 */
export class MemoryTemplateStorage implements TemplateStorage {
  private templates = new Map<string, CopyTradingTemplate>();

  async save(template: CopyTradingTemplate): Promise<void> {
    this.templates.set(template.id, template);
  }

  async get(templateId: string): Promise<CopyTradingTemplate | null> {
    return this.templates.get(templateId) || null;
  }

  async delete(templateId: string): Promise<void> {
    this.templates.delete(templateId);
  }

  async list(createdBy?: string): Promise<CopyTradingTemplate[]> {
    const allTemplates = Array.from(this.templates.values());
    if (createdBy) {
      return allTemplates.filter(t => t.createdBy === createdBy);
    }
    return allTemplates.filter(t => t.shareable);
  }
}

// Global template storage instance
export const templateStorage = new MemoryTemplateStorage();
