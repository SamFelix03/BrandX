"use client"

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'

export default function AuthMiddleware() {
  const pathname = usePathname()
  const router = useRouter()
  const { ready, authenticated, hasBusiness, businessLoading } = useAuthStore()

  useEffect(() => {
    // Don't do anything if Privy isn't ready yet
    if (!ready) return

    // Business onboarding route logic
    if (pathname === '/business-onboarding') {
      if (!authenticated) {
        // Not authenticated - redirect to business landing
        router.push('/business-landing')
        return
      }
      
      if (!businessLoading && hasBusiness) {
        // Already has business - redirect to dashboard
        router.push('/business-dashboard')
        return
      }
    }

    // Business dashboard route logic
    if (pathname === '/business-dashboard') {
      if (!authenticated) {
        // Not authenticated - redirect to business landing
        router.push('/business-landing')
        return
      }
      
      if (!businessLoading && !hasBusiness) {
        // No business account - redirect to onboarding
        router.push('/business-onboarding')
        return
      }
    }

    // Business landing route logic
    if (pathname === '/business-landing') {
      if (authenticated && !businessLoading) {
        if (hasBusiness) {
          // Has business - go to dashboard
          router.push('/business-dashboard')
        } else {
          // No business - go to onboarding
          router.push('/business-onboarding')
        }
        return
      }
    }

  }, [pathname, router, ready, authenticated, hasBusiness, businessLoading])

  return null // This component doesn't render anything
}