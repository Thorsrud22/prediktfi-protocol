import { formatDistanceToNow } from 'date-fns';

export function roundTo6(n: number): number {
  return Math.round(n * 1e6) / 1e6;
}

export function calcFeeNet(amount: number, feeBps: number) {
  const fee = roundTo6((amount * feeBps) / 10000);
  const net = roundTo6(amount - fee);
  return { fee, net };
}

export function formatRelative(date: string | Date): string {
  try {
    const targetDate = typeof date === 'string' ? new Date(date) : date;
    return formatDistanceToNow(targetDate, { addSuffix: true });
  } catch {
    return 'Invalid date';
  }
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

export function formatSol(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
