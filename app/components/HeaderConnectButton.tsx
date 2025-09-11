'use client'
import { useState, useRef, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletAuth } from '../lib/useWalletAuth'
import { toast } from 'react-hot-toast'
import { ChevronDown, User, LogOut, CheckCircle } from 'lucide-react'

export function HeaderConnectButton() {
  const { connected, publicKey, disconnect } = useWallet()
  const { isAuthenticated, wallet, connectAndAuthenticate, signOut, isLoading } = useWalletAuth()
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close dropdown on escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowDropdown(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  const handleSignIn = async () => {
    try {
      await connectAndAuthenticate()
    } catch (error) {
      toast.error('Failed to sign in. Please try again.')
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      setShowDropdown(false)
    } catch (error) {
      toast.error('Failed to sign out. Please try again.')
    }
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`
  }

  // Not connected - show connect button
  if (!connected) {
    return (
      <button
        onClick={() => {
          // This will trigger the wallet selection modal
          const event = new CustomEvent('wallet-adapter-connect')
          window.dispatchEvent(event)
        }}
        className="bg-indigo-600 text-white rounded-full h-10 px-4 text-sm font-medium hover:bg-indigo-700 transition-all focus-visible:ring-2 focus-visible:ring-indigo-400/50"
      >
        Connect Wallet
      </button>
    )
  }

  // Connected but not authenticated - show sign in button
  if (connected && !isAuthenticated) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-300">
          {publicKey && formatAddress(publicKey.toString())}
        </span>
        <button
          onClick={handleSignIn}
          disabled={isLoading}
          className="bg-orange-600 text-white rounded-full h-10 px-4 text-sm font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all focus-visible:ring-2 focus-visible:ring-orange-400/50"
        >
          {isLoading ? 'Signing...' : 'Sign to continue'}
        </button>
      </div>
    )
  }

  // Authenticated - show dropdown
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 bg-green-600 text-white rounded-full h-10 px-4 text-sm font-medium hover:bg-green-700 transition-all focus-visible:ring-2 focus-visible:ring-green-400/50"
      >
        <CheckCircle className="w-4 h-4" />
        <span>{wallet && formatAddress(wallet)}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
      </button>

      {showDropdown && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          <div className="px-4 py-2 border-b border-gray-100">
            <div className="text-sm font-medium text-gray-900">Account</div>
            <div className="text-xs text-gray-500 font-mono">{wallet}</div>
          </div>
          
          <button
            onClick={() => {
              setShowDropdown(false)
              // Navigate to account page
              window.location.href = '/account'
            }}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <User className="w-4 h-4" />
            Account
          </button>
          
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}
