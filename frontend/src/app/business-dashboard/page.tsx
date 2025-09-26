"use client"

import { useAuthStore } from '@/stores/auth-store'
import ShaderBackground from '../../components/shader-background'
import DashboardHeader from '../../components/dashboard-header'

export default function BusinessDashboard() {
  const { authenticated, user, business, businessLoading } = useAuthStore()

  if (!authenticated) {
    return (
      <ShaderBackground>
        <DashboardHeader />
        <main className="absolute top-20 left-0 right-0 bottom-0 flex items-center justify-center z-20">
          <div className="text-center max-w-lg px-8">
            <h1 className="text-4xl font-light text-white mb-4">
              Please <span className="font-medium italic instrument">Sign In</span>
            </h1>
            <p className="text-white/70 mb-6">
              You need to authenticate with your wallet to access your dashboard.
            </p>
            <button 
              onClick={() => window.location.href = '/business-landing'}
              className="px-8 py-3 rounded-full bg-white text-black font-normal text-sm transition-all duration-200 hover:bg-white/90"
            >
              Go Back
            </button>
          </div>
        </main>
      </ShaderBackground>
    )
  }

  if (businessLoading) {
    return (
      <ShaderBackground>
        <DashboardHeader />
        <main className="absolute top-20 left-0 right-0 bottom-0 flex items-center justify-center z-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white/70">Loading your dashboard...</p>
          </div>
        </main>
      </ShaderBackground>
    )
  }

  return (
    <ShaderBackground>
      <DashboardHeader business={business || { business_name: 'Loading...', profile_picture_url: '' }} />
      <main className="absolute top-20 left-0 right-0 bottom-0 z-20 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center gap-6 mb-4">
              <div>
                <h1 className="text-4xl font-light text-white mb-2">
                  Welcome back, <span className="font-medium italic instrument">{business?.business_name}</span>
                </h1>
                <p className="text-white/70">
                  {business?.description || "Your business dashboard is ready"}
                </p>
              </div>
            </div>
            
            {business?.smart_contract_address ? (
              <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                <p className="text-green-400 font-medium">✅ Smart Contract Deployed</p>
                <p className="text-green-300/70 text-sm font-mono mt-1">
                  {business.smart_contract_address}
                </p>
              </div>
            ) : (
              <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
                <p className="text-yellow-400 font-medium">⏳ Smart Contract Pending</p>
                <p className="text-yellow-300/70 text-sm">
                  BrandHero AI is analyzing your business and preparing your bounty system...
                </p>
              </div>
            )}
          </div>

          {/* Dashboard Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            
            {/* Bounties Card */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <h3 className="text-white font-medium text-lg mb-4">Active Bounties</h3>
              <div className="text-center py-8">
                <div className="text-4xl font-light text-white/50 mb-2">0</div>
                <p className="text-white/70 text-sm">No bounties yet</p>
              </div>
              <button 
                disabled
                className="w-full py-2 px-4 bg-white/10 text-white/50 rounded-lg cursor-not-allowed"
              >
                Create Bounty (Coming Soon)
              </button>
            </div>

            {/* Members Card */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <h3 className="text-white font-medium text-lg mb-4">Community Members</h3>
              <div className="text-center py-8">
                <div className="text-4xl font-light text-white/50 mb-2">0</div>
                <p className="text-white/70 text-sm">No members yet</p>
              </div>
              <button 
                disabled
                className="w-full py-2 px-4 bg-white/10 text-white/50 rounded-lg cursor-not-allowed"
              >
                View Members (Coming Soon)
              </button>
            </div>

            {/* Analytics Card */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <h3 className="text-white font-medium text-lg mb-4">Analytics</h3>
              <div className="text-center py-8">
                <div className="text-4xl font-light text-white/50 mb-2">📊</div>
                <p className="text-white/70 text-sm">Analytics coming soon</p>
              </div>
              <button 
                disabled
                className="w-full py-2 px-4 bg-white/10 text-white/50 rounded-lg cursor-not-allowed"
              >
                View Reports (Coming Soon)
              </button>
            </div>
          </div>

          {/* Business Info */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <h3 className="text-white font-medium text-lg mb-4">Business Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {business?.location && (
                <div>
                  <span className="text-white/70">Location:</span>
                  <span className="text-white ml-2">{business.location}</span>
                </div>
              )}
              {business?.website && (
                <div>
                  <span className="text-white/70">Website:</span>
                  <a href={business.website} target="_blank" rel="noopener noreferrer" className="text-blue-400 ml-2 hover:underline">
                    {business.website}
                  </a>
                </div>
              )}
              <div>
                <span className="text-white/70">Wallet:</span>
                <span className="text-white ml-2 font-mono text-xs">{user?.wallet?.address}</span>
              </div>
              <div>
                <span className="text-white/70">Joined:</span>
                <span className="text-white ml-2">
                  {new Date(business?.created_at || '').toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </ShaderBackground>
  )
}