"use client"

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'

export default function AuthMiddleware() {
  const pathname = usePathname()
  const router = useRouter()
  const { ready, authenticated, hasBusiness, business, businessLoading } = useAuthStore()

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
        // Already has business - check if contract is deployed
        if (business?.smart_contract_address) {
          // Contract deployed - redirect to dashboard  
          router.push('/business-dashboard')
        } else {
          // Contract not deployed - redirect to bounty management to complete setup
          router.push('/bounty-management')
        }
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
          // Has business - check if contract is deployed
          if (business?.smart_contract_address) {
            // Contract deployed - go to dashboard
            router.push('/business-dashboard')
          } else {
            // Contract not deployed - go to bounty management to complete setup
            router.push('/bounty-management')
          }
        } else {
          // No business - go to onboarding
          router.push('/business-onboarding')
        }
        return
      }
    }

  }, [pathname, router, ready, authenticated, hasBusiness, business, businessLoading])

  return null // This component doesn't render anything
}