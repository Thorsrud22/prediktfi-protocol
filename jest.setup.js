import '@testing-library/jest-dom'

// Mock environment variables for tests
process.env.NODE_ENV = 'test'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/predikt_test'
process.env.JWT_SECRET = 'test-jwt-secret-min-32-chars-long-for-testing'
process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000'
process.env.SOLANA_CLUSTER = 'devnet'
process.env.COMMIT_ENABLED = 'false'

// Mock crypto for Node.js environment
const crypto = require('crypto')
const { TextEncoder, TextDecoder } = require('util')

Object.defineProperty(globalThis, 'crypto', {
  value: {
    randomUUID: () => crypto.randomUUID(),
    getRandomValues: (arr) => crypto.randomFillSync(arr),
    subtle: crypto.webcrypto?.subtle,
  },
  writable: true,
})

// Add TextEncoder/TextDecoder for crypto operations
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
