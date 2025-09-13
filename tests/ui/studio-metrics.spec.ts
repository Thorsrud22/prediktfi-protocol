import { describe, it, expect } from 'vitest'
import { fmt, fmtPct, toNum } from '../../app/lib/num'

describe('Numeric helpers', () => {
  it('toNum handles various input types', () => {
    // Numbers
    expect(toNum(42)).toBe(42)
    expect(toNum(3.14)).toBe(3.14)
    
    // Strings
    expect(toNum('42')).toBe(42)
    expect(toNum('3.14')).toBe(3.14)
    expect(toNum('72%')).toBe(72)
    expect(toNum(' 42 ')).toBe(42)
    
    // Arrays
    expect(toNum([42])).toBe(42)
    expect(toNum(['42'])).toBe(42)
    expect(toNum([])).toBe(0)
    
    // Objects
    expect(toNum({ value: 42 })).toBe(42)
    expect(toNum({ score: 3.14 })).toBe(3.14)
    
    // Invalid inputs
    expect(toNum('invalid')).toBe(0)
    expect(toNum(null)).toBe(0)
    expect(toNum(undefined)).toBe(0)
    expect(toNum({})).toBe(0)
    
    // Custom fallback
    expect(toNum('invalid', -1)).toBe(-1)
  })

  it('fmt formats numbers with fallback', () => {
    expect(fmt(42.123)).toBe('42.12')
    expect(fmt(42.123, 1)).toBe('42.1')
    expect(fmt('42.123')).toBe('42.12')
    expect(fmt('invalid')).toBe('—')
    expect(fmt(null)).toBe('—')
    expect(fmt(undefined)).toBe('—')
    expect(fmt('invalid', 2, 'N/A')).toBe('N/A')
  })

  it('fmtPct formats percentages correctly', () => {
    // Fraction inputs (0.72 -> 72.0%)
    expect(fmtPct(0.72)).toBe('72.0%')
    expect(fmtPct(0.725, 2)).toBe('72.50%')
    
    // Percentage inputs (72 -> 72.0%)
    expect(fmtPct(72)).toBe('72.0%')
    expect(fmtPct(72.5, 1)).toBe('72.5%')
    
    // String inputs
    expect(fmtPct('72%')).toBe('72.0%')
    expect(fmtPct('0.72')).toBe('72.0%')
    
    // Invalid inputs
    expect(fmtPct('invalid')).toBe('—')
    expect(fmtPct(null)).toBe('—')
    expect(fmtPct(undefined)).toBe('—')
    expect(fmtPct('invalid', 1, 'N/A')).toBe('N/A')
  })
})
