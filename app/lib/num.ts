export function toNum(input: unknown, fallback = 0): number {
  if (typeof input === 'number' && Number.isFinite(input)) return input
  if (typeof input === 'string') {
    const cleaned = input.replace('%', '').trim()
    const n = Number(cleaned)
    if (Number.isFinite(n)) return n
  }
  if (Array.isArray(input) && input.length) {
    return toNum(input[0], fallback)
  }
  if (input && typeof input === 'object') {
    const v: any = input as any
    // try common shapes: { value }, { score }, first prop
    const cand = v.value ?? v.score ?? Object.values(v)[0]
    return toNum(cand, fallback)
  }
  return fallback
}

export function fmt(input: unknown, digits = 2, fallback = '—'): string {
  const n = toNum(input, Number.NaN)
  if (!Number.isFinite(n)) return fallback
  return n.toFixed(digits)
}

export function fmtPct(input: unknown, digits = 1, fallback = '—'): string {
  // input can be 0.72 or "72%" — we display "72.0%"
  let n = toNum(input, Number.NaN)
  if (!Number.isFinite(n)) return fallback
  if (n > 1) {
    // already in percent (e.g., 72)
    return `${n.toFixed(digits)}%`
  }
  // fraction (e.g., 0.72)
  return `${(n * 100).toFixed(digits)}%`
}
