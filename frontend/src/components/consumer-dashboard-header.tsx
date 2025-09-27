"use client"

import { useAuthStore } from '@/stores/auth-store'

interface Business {
  id: string
  business_name: string
  profile_picture_url?: string
  ens_domain?: string
}

interface MemberData {
  totalPoints: string
  ensName: string
}

interface ConsumerDashboardHeaderProps {
  business: Business
  memberData: MemberData | null
}

export default function ConsumerDashboardHeader({ 
  business, 
  memberData
}: ConsumerDashboardHeaderProps) {
  const { user } = useAuthStore()
  
  const totalPoints = memberData ? parseInt(memberData.totalPoints) : 0

  return (
    <header className="fixed top-0 left-0 right-0 z-20 bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Left: Empty */}
          <div className="flex-1"></div>

          {/* Center: Points Display */}
          <div className="flex-1 flex justify-center">
            {memberData && (
              <div className="px-6 py-3 bg-white/10 backdrop-blur-md rounded-full text-white font-medium text-lg border border-white/20">
                {totalPoints.toLocaleString()} pts
              </div>
            )}
          </div>

          {/* Right: User Info */}
          <div className="flex-1 flex justify-end">
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <div className="text-white text-md font-medium">
                  {memberData?.ensName || 
                   (user?.wallet?.address ? `${user.wallet.address.slice(0, 6)}...${user.wallet.address.slice(-4)}` : 'User')}
                </div>
              </div>
              <img
                src="/capped-thug.png"
                alt="User avatar"
                className="w-10 h-10 rounded-full object-cover bg-white/10"
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}