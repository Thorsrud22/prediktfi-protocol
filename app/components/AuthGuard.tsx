'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface AuthGuardProps {
  children: React.ReactNode
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Check if user is authenticated by looking for the auth cookie
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/check', {
          method: 'GET',
          credentials: 'include'
        })
        
        if (response.ok) {
          setIsAuthenticated(true)
        } else {
          setIsAuthenticated(false)
          // Only redirect if not already on auth page
          if (window.location.pathname !== '/auth') {
            router.push('/auth')
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        setIsAuthenticated(false)
        // Only redirect if not already on auth page
        if (window.location.pathname !== '/auth') {
          router.push('/auth')
        }
      }
    }

    checkAuth()
  }, [router])

  // Show loading state while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    )
  }

  // If on auth page, always render children
  if (typeof window !== 'undefined' && window.location.pathname === '/auth') {
    return <>{children}</>
  }

  // Only render children if authenticated
  if (isAuthenticated) {
    return <>{children}</>
  }

  // This should not be reached due to redirect, but just in case
  return null
}
