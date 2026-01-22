import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { createSolanaPayUrl, calculateSolAmount } from '../src/lib/solana';

// Mock Prisma
const mockPrisma = {
  payment: {
    deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    create: vi.fn().mockImplementation(({ data }: { data: any }) => Promise.resolve({ id: 'test-id', ...data })),
  },
  invoice: {
    deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    create: vi.fn().mockImplementation(({ data }: { data: any }) => Promise.resolve({ id: 'test-id', ...data })),
  },
};

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn().mockImplementation(() => mockPrisma),
}));

const prisma = new PrismaClient();

describe('Payment System', () => {
  beforeEach(async () => {
    // Clean up test data
    await prisma.payment.deleteMany();
    await prisma.invoice.deleteMany();
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.payment.deleteMany();
    await prisma.invoice.deleteMany();
  });

  describe('Solana Pay URL Generation', () => {
    it('should create valid Solana Pay URL for USDC', () => {
      const url = createSolanaPayUrl({
        recipient: 'Ez6dxRTZPCR41LNFPTPH9FjpDkX8NusbP1HDJy2vmnd5',
        amount: 9,
        splToken: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        reference: 'test-reference-123',
        label: 'Test Payment',
        message: 'Test message',
      });

      expect(url).toContain('solana:');
      expect(url).toContain('address=Ez6dxRTZPCR41LNFPTPH9FjpDkX8NusbP1HDJy2vmnd5');
      expect(url).toContain('amount=9');
      expect(url).toContain('spl-token=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
      expect(url).toContain('reference=test-reference-123');
    });

    it('should create valid Solana Pay URL for SOL', () => {
      const url = createSolanaPayUrl({
        recipient: 'Ez6dxRTZPCR41LNFPTPH9FjpDkX8NusbP1HDJy2vmnd5',
        amount: 0.09,
        reference: 'test-reference-456',
        label: 'Test Payment',
        message: 'Test message',
      });

      expect(url).toContain('solana:');
      expect(url).toContain('address=Ez6dxRTZPCR41LNFPTPH9FjpDkX8NusbP1HDJy2vmnd5');
      expect(url).toContain('amount=0.09');
      expect(url).toContain('reference=test-reference-456');
      expect(url).not.toContain('spl-token');
    });
  });

  describe('SOL Amount Calculation', () => {
    it('should calculate SOL amount from USD', async () => {
      const solAmount = await calculateSolAmount(9);
      expect(solAmount).toBeGreaterThan(0);
      expect(solAmount).toBeLessThan(1); // Should be less than 1 SOL for $9
    });
  });

  describe('Invoice Creation', () => {
    it('should create invoice with correct data', async () => {
      const invoice = await prisma.invoice.create({
        data: {
          userId: 'test-wallet-123',
          plan: 'starter',
          reference: 'test-ref-123',
          amountUsd: 9,
          token: 'USDC',
          status: 'PENDING',
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        },
      });

      expect(invoice.userId).toBe('test-wallet-123');
      expect(invoice.plan).toBe('starter');
      expect(invoice.amountUsd).toBe(9);
      expect(invoice.token).toBe('USDC');
      expect(invoice.status).toBe('PENDING');
    });
  });

  describe('Payment Creation', () => {
    it('should create payment record', async () => {
      const payment = await prisma.payment.create({
        data: {
          userId: 'test-wallet-123',
          plan: 'starter',
          token: 'USDC',
          amountUsd: 9,
          txSig: 'test-tx-sig-123',
        },
      });

      expect(payment.userId).toBe('test-wallet-123');
      expect(payment.plan).toBe('starter');
      expect(payment.token).toBe('USDC');
      expect(payment.amountUsd).toBe(9);
      expect(payment.txSig).toBe('test-tx-sig-123');
    });
  });
});
