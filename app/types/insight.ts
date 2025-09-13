export type InsightMetrics = {
  sentiment?: unknown
  confidence?: unknown
  certainty?: unknown
  risk?: unknown
  rsi?: unknown
  trend?: unknown
  [k: string]: unknown
}

export type InsightResponse = {
  id?: string
  title?: string
  summary?: string
  probability?: number
  confidence?: number
  interval?: {
    lower: number
    upper: number
  }
  rationale?: string
  metrics?: InsightMetrics
  scenarios?: Array<{
    label: string
    probability: number
    drivers: string[]
  }>
  sources?: Array<{
    name: string
    url: string
    quality?: number
  }>
  tookMs?: number
  // Additional fields for compatibility
  [k: string]: unknown
}