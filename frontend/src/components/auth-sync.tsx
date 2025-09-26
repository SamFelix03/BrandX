"use client"

import { useEffect } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useAuthStore } from '@/stores/auth-store'

export default function AuthSync() {
  const { authenticated, user, ready } = usePrivy()
  const setAuth = useAuthStore((state) => state.setAuth)

  // Sync Privy auth state with Zustand store
  useEffect(() => {
    setAuth(authenticated, user, ready)
  }, [authenticated, user, ready, setAuth])

  return null // This component doesn't render anything
}