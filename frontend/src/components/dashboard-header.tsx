"use client"

import { usePrivy } from '@privy-io/react-auth'
import { useAuthStore } from '@/stores/auth-store'

interface DashboardHeaderProps {
  business?: {
    business_name: string
    profile_picture_url?: string
  }
}

export default function DashboardHeader({ business }: DashboardHeaderProps) {
  const { logout: privyLogout } = usePrivy()
  const storeLogout = useAuthStore((state) => state.logout)
  
  const handleLogout = () => {
    storeLogout()
    privyLogout()
  }

  return (
    <header className="relative z-30 flex items-center justify-between p-6 bg-black/20 backdrop-blur-sm border-b border-white/10">
      {/* Business Logo/Name */}
      <div className="flex items-center gap-3">
        {business?.profile_picture_url ? (
          <img 
            src={business.profile_picture_url} 
            alt={business.business_name}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
        )}
        <div>
          <h1 className="text-white font-medium text-lg">
            {business?.business_name || 'Business Dashboard'}
          </h1>
          <p className="text-white/60 text-xs">EzEarn Dashboard</p>
        </div>
      </div>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="px-4 py-2 bg-white/10 text-white text-sm rounded-lg hover:bg-white/20 transition-colors border border-white/20"
      >
        Logout
      </button>
    </header>
  )
}