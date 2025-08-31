export function roundTo6(n: number): number {
  return Math.round(n * 1e6) / 1e6;
}

export function calcFeeNet(amount: number, feeBps: number) {
  const fee = roundTo6((amount * feeBps) / 10000);
  const net = roundTo6(amount - fee);
  return { fee, net };
}
