"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import ConsumerHeader from "../../components/consumer-header"
import ShaderBackground from "../../components/shader-background"

interface Business {
  id: string
  business_name: string
  description?: string
  location?: string
  website?: string
  profile_picture_url?: string
  ens_domain?: string
  smart_contract_address: string
  created_at: string
}

interface UserProfile {
  id: string
  wallet_address: string
  username: string
  display_name?: string
  bio?: string
  profile_picture_url?: string
  location?: string
  website?: string
  social_links?: Record<string, string>
  created_at: string
  updated_at: string
}

export default function ConsumerLanding() {
  const router = useRouter()
  const { authenticated, user, ready } = useAuthStore()
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Wait for Privy to be ready before making auth decisions
    if (!ready) return
    
    if (authenticated) {
      fetchUserProfile()
      fetchBusinesses()
    } else {
      router.push('/consumer-auth')
    }
  }, [authenticated, ready, router])

  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`/api/user-profiles?wallet_address=${user?.wallet?.address}`)
      const data = await response.json()
      
      if (response.ok) {
        setUserProfile(data.profile)
      }
    } catch (err) {
      console.error('Failed to fetch user profile:', err)
    }
  }

  const fetchBusinesses = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/businesses/all')
      const data = await response.json()

      if (response.ok) {
        setBusinesses(data.businesses || [])
      } else {
        setError(data.error || 'Failed to fetch businesses')
      }
    } catch (err) {
      console.error('Failed to fetch businesses:', err)
      setError('Failed to load businesses')
    } finally {
      setLoading(false)
    }
  }

  // Check if user profile is complete (has all required fields)
  const isProfileComplete = (profile: UserProfile | null) => {
    if (!profile) return false
    
    const requiredFields = ['username', 'display_name', 'bio', 'profile_picture_url']
    return requiredFields.every(field => {
      const value = profile[field as keyof UserProfile]
      return value && typeof value === 'string' && value.trim() !== ''
    })
  }

  const handleBusinessClick = (business: Business) => {
    // Navigate to business-specific consumer page
    router.push(`/consumer/${business.id}`)
  }

  // Show loading state while Privy is initializing
  if (!ready) {
    return (
      <ShaderBackground>
        <ConsumerHeader />
        <main className="absolute top-20 left-0 right-0 bottom-0 flex items-center justify-center z-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white/70">Initializing...</p>
          </div>
        </main>
      </ShaderBackground>
    )
  }

  if (!authenticated) {
    return (
      <ShaderBackground>
        <ConsumerHeader />
        <main className="absolute top-20 left-0 right-0 bottom-0 flex items-center justify-center z-20">
          <div className="text-center max-w-lg px-8">
            <h1 className="text-4xl font-light text-white mb-4">
              Please <span className="font-medium italic instrument">Connect Wallet</span>
            </h1>
            <p className="text-white/70 mb-6">
              You need to connect your wallet to discover and join loyalty programs.
            </p>
            <button 
              onClick={() => router.push('/consumer-auth')}
              className="px-8 py-3 rounded-full bg-white text-black font-normal text-sm transition-all duration-200 hover:bg-white/90"
            >
              Go to Sign In
            </button>
          </div>
        </main>
      </ShaderBackground>
    )
  }

  return (
    <ShaderBackground>
      <ConsumerHeader />
      <main className="absolute top-20 left-0 right-0 bottom-0 z-20 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-light text-white mb-4">
              Discover <span className="font-medium italic instrument">Loyalty Programs</span>
            </h1>
            <p className="text-white/70 text-lg max-w-3xl mx-auto">
              Join exciting loyalty programs and earn rewards by completing bounties. 
              Choose from businesses using blockchain-powered loyalty systems.
            </p>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-white/70">Loading businesses...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-12">
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 max-w-md mx-auto">
                <p className="text-red-300">{error}</p>
                <button 
                  onClick={fetchBusinesses}
                  className="mt-4 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* Businesses Grid */}
          {!loading && !error && (
            <>
              {businesses.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-white/5 border border-white/10 rounded-lg p-8 max-w-md mx-auto">
                    <p className="text-white/70 mb-4">No businesses available yet.</p>
                    <p className="text-white/50 text-sm">
                      Check back later for exciting loyalty programs to join!
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {businesses.map((business) => (
                    <button
                      key={business.id}
                      onClick={() => handleBusinessClick(business)}
                      className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 text-left transition-all duration-200 hover:bg-white/10 hover:border-white/20 hover:scale-105 cursor-pointer group"
                    >
                      {/* Business Logo/Image */}
                      <div className="mb-4">
                        {business.profile_picture_url ? (
                          <img
                            src={business.profile_picture_url}
                            alt={business.business_name}
                            className="w-16 h-16 rounded-full object-cover border-2 border-white/20 group-hover:border-white/40 transition-colors"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-white/20 to-white/10 border-2 border-white/20 group-hover:border-white/40 transition-colors flex items-center justify-center">
                            <span className="text-white font-medium text-lg">
                              {business.business_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Business Info */}
                      <div className="space-y-3">
                        <div>
                          <h3 className="text-white font-medium text-xl mb-2 group-hover:text-white/90 transition-colors">
                            {business.business_name}
                          </h3>
                          {business.description && (
                            <p className="text-white/70 text-sm line-clamp-3 leading-relaxed">
                              {business.description}
                            </p>
                          )}
                        </div>

                        {/* Business Details */}
                        <div className="space-y-2 text-xs">
                          {business.location && (
                            <div className="flex items-center gap-2">
                              <svg className="w-3 h-3 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span className="text-white/60">{business.location}</span>
                            </div>
                          )}
                          
                          {business.ens_domain && (
                            <div className="flex items-center gap-2">
                              <svg className="w-3 h-3 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                              </svg>
                              <span className="text-white/60 font-mono">{business.ens_domain}</span>
                            </div>
                          )}

                          <div className="flex items-center gap-2">
                            <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-green-400 text-xs">Active Loyalty Program</span>
                          </div>
                        </div>

                        {/* Join CTA */}
                        <div className="pt-3 border-t border-white/10">
                          <div className="flex items-center justify-between">
                            <span className="text-white/80 text-sm font-medium">Join Program</span>
                            <svg className="w-4 h-4 text-white/60 group-hover:text-white/80 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </ShaderBackground>
  )
}