'use client'

import { useEffect } from 'react'
import { trackClient } from '../lib/analytics'

export default function Seen() {
  useEffect(() => {
    trackClient('pricing_viewed', { where: 'pricing' })
  }, [])

  return null
}
