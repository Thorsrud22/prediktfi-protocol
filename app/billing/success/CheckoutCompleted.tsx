'use client'

import { useEffect } from 'react'
import { trackClient } from '../../lib/analytics'

export default function CheckoutCompleted({ hasCode }: { hasCode: boolean }) {
  useEffect(() => {
    trackClient('checkout_completed', { hasCode })
  }, [hasCode])

  return null
}
