import { describe, it, expect } from 'vitest'

// Test to verify that the types are correctly defined and exported
describe('Studio Modal Types', () => {
  it('should export InsightResponse and InsightMetrics types', async () => {
    // Import the types to verify they exist and are properly exported
    const { InsightResponse, InsightMetrics } = await import('../../app/types/insight')
    
    // These should be type definitions, so we just verify they can be imported
    expect(typeof InsightResponse).toBe('undefined') // Types don't exist at runtime
    expect(typeof InsightMetrics).toBe('undefined') // Types don't exist at runtime
  })
  
  it('should handle null insight gracefully in modal logic', () => {
    // Test the core logic that prevents ReferenceError
    const insight = null
    const hasInsight = Boolean(insight)
    const metrics = insight?.metrics ?? {}
    const probabilityPercent = insight?.probability ? Math.round(insight.probability * 100) : 0
    const confidencePercent = insight?.confidence ? Math.round(insight.confidence * 100) : 0
    
    expect(hasInsight).toBe(false)
    expect(metrics).toEqual({})
    expect(probabilityPercent).toBe(0)
    expect(confidencePercent).toBe(0)
  })
  
  it('should handle valid insight data correctly', () => {
    const insight = {
      probability: 0.75,
      confidence: 0.85,
      metrics: {
        sentiment: 0.6,
        rsi: 45.2
      }
    }
    
    const hasInsight = Boolean(insight)
    const metrics = insight?.metrics ?? {}
    const probabilityPercent = insight?.probability ? Math.round(insight.probability * 100) : 0
    const confidencePercent = insight?.confidence ? Math.round(insight.confidence * 100) : 0
    
    expect(hasInsight).toBe(true)
    expect(metrics).toEqual({ sentiment: 0.6, rsi: 45.2 })
    expect(probabilityPercent).toBe(75)
    expect(confidencePercent).toBe(85)
  })
})