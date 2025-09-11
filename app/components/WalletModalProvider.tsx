'use client'

import { useEffect } from 'react'
import { WalletModalProvider as BaseWalletModalProvider } from '@solana/wallet-adapter-react-ui'

export function WalletModalProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Handle body scroll lock when modal opens/closes
    const handleModalOpen = () => {
      document.body.classList.add('modal-open')
    }

    const handleModalClose = () => {
      document.body.classList.remove('modal-open')
    }

    // Listen for modal events
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          const modal = document.querySelector('.wallet-adapter-modal-wrapper')
          if (modal) {
            handleModalOpen()
          } else {
            handleModalClose()
          }
        }
      })
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true
    })

    // Cleanup
    return () => {
      observer.disconnect()
      document.body.classList.remove('modal-open')
    }
  }, [])

  useEffect(() => {
    // Handle focus trap and ESC key
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        const modal = document.querySelector('.wallet-adapter-modal-wrapper')
        if (modal) {
          // Close modal by clicking the overlay
          const overlay = modal.querySelector('.wallet-adapter-modal-overlay')
          if (overlay) {
            (overlay as HTMLElement).click()
          }
        }
      }

      if (event.key === 'Tab') {
        const modal = document.querySelector('.wallet-adapter-modal')
        if (modal) {
          const focusableElements = modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          )
          const firstElement = focusableElements[0] as HTMLElement
          const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

          if (event.shiftKey) {
            if (document.activeElement === firstElement) {
              event.preventDefault()
              lastElement?.focus()
            }
          } else {
            if (document.activeElement === lastElement) {
              event.preventDefault()
              firstElement?.focus()
            }
          }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return <BaseWalletModalProvider>{children}</BaseWalletModalProvider>
}
