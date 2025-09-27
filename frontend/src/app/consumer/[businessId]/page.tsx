"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import ConsumerHeader from "../../../components/consumer-header"
import ShaderBackground from "../../../components/shader-background"

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

interface LoyaltyRequest {
  id: string
  business_id: string
  business_name: string
  business_ens_domain?: string
  status: 'pending' | 'approved' | 'rejected'
  requested_at: string
  reviewed_at?: string
  rejection_reason?: string
  consumer_message?: string
}

interface ContractBounty {
  id: string
  title: string
  description: string
  isActive: boolean
  expiry: string
  maxCompletions: string
  currentCompletions: string
  rewardTemplateId?: string
}

interface ContractMember {
  address: string
  ensName: string
  totalPoints: string
  completedBounties: number
  ownedVouchers: number
  claimedPrizes: number
  joinedAt: string
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

export default function ConsumerBusinessPage() {
  const params = useParams()
  const router = useRouter()
  const { authenticated, user, ready } = useAuthStore()
  const businessId = params.businessId as string
  
  const [business, setBusiness] = useState<Business | null>(null)
  const [loyaltyRequest, setLoyaltyRequest] = useState<LoyaltyRequest | null>(null)
  const [bounties, setBounties] = useState<ContractBounty[]>([])
  const [memberData, setMemberData] = useState<ContractMember | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [requestMessage, setRequestMessage] = useState('')
  const [submittingRequest, setSubmittingRequest] = useState(false)

  useEffect(() => {
    // Wait for Privy to be ready before making auth decisions
    if (!ready) return
    
    if (!authenticated) {
      router.push('/consumer-auth')
      return
    }
    
    if (businessId) {
      fetchBusinessData()
      if (user?.wallet?.address) {
        fetchUserProfile(user.wallet.address)
        checkLoyaltyRequestStatus(user.wallet.address)
      }
    }
  }, [businessId, authenticated, user?.wallet?.address, ready, router])

  const fetchBusinessData = async () => {
    try {
      // Fetch business details
      const businessResponse = await fetch(`/api/businesses/all`)
      const businessData = await businessResponse.json()
      
      if (businessResponse.ok) {
        const foundBusiness = businessData.businesses.find((b: Business) => b.id === businessId)
        if (foundBusiness) {
          setBusiness(foundBusiness)
          
          // Fetch bounties for this business
          if (foundBusiness.smart_contract_address) {
            fetchBounties(foundBusiness.smart_contract_address)
          }
        } else {
          setError('Business not found')
        }
      } else {
        setError('Failed to fetch business data')
      }
    } catch (err) {
      console.error('Failed to fetch business:', err)
      setError('Failed to load business')
    }
  }

  const fetchUserProfile = async (wallet: string) => {
    try {
      const response = await fetch(`/api/user-profiles?wallet_address=${wallet}`)
      const data = await response.json()
      
      if (response.ok) {
        setUserProfile(data.profile)
      }
    } catch (err) {
      console.error('Failed to fetch user profile:', err)
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

  const fetchBounties = async (contractAddress: string) => {
    try {
      const response = await fetch(`/api/contract/bounties?contractAddress=${contractAddress}`)
      const data = await response.json()
      
      if (response.ok) {
        setBounties(data.bounties || [])
      }
    } catch (err) {
      console.error('Failed to fetch bounties:', err)
    }
  }

  const checkLoyaltyRequestStatus = async (wallet: string) => {
    try {
      const response = await fetch(`/api/loyalty-requests?wallet_address=${wallet}`)
      const data = await response.json()
      
      if (response.ok) {
        const businessRequest = data.requests.find((r: LoyaltyRequest) => r.business_id === businessId)
        setLoyaltyRequest(businessRequest || null)
        
        // If approved, fetch member data from contract
        if (businessRequest?.status === 'approved' && business?.smart_contract_address) {
          fetchMemberData(business.smart_contract_address, wallet)
        }
      }
    } catch (err) {
      console.error('Failed to check loyalty request status:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchMemberData = async (contractAddress: string, wallet: string) => {
    try {
      const response = await fetch(`/api/contract/members?contractAddress=${contractAddress}`)
      const data = await response.json()
      
      if (response.ok) {
        const member = data.members.find((m: ContractMember) => 
          m.address.toLowerCase() === wallet.toLowerCase()
        )
        setMemberData(member || null)
      }
    } catch (err) {
      console.error('Failed to fetch member data:', err)
    }
  }

  const handleJoinRequest = async () => {
    if (!user?.wallet?.address) {
      alert('Please connect your wallet first')
      return
    }

    try {
      setSubmittingRequest(true)
      const response = await fetch('/api/loyalty-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consumer_ens_name: userProfile?.username,
          consumer_wallet_address: user.wallet.address,
          business_id: businessId,
          consumer_message: requestMessage.trim() || null
        })
      })

      const data = await response.json()
      
      if (data.success) {
        // Refresh request status
        await checkLoyaltyRequestStatus(user.wallet.address)
        setRequestMessage('')
        alert('Request submitted successfully!')
      } else {
        alert(data.message || data.error || 'Failed to submit request')
      }
    } catch (err) {
      console.error('Failed to submit request:', err)
      alert('Failed to submit request')
    } finally {
      setSubmittingRequest(false)
    }
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
              You need to connect your wallet to access loyalty programs.
            </p>
            <button 
              onClick={() => router.push('/consumer-auth')}
              className="px-8 py-3 rounded-full bg-white text-black font-normal text-sm transition-all duration-200 hover:bg-white/90"
            >
              Sign In
            </button>
          </div>
        </main>
      </ShaderBackground>
    )
  }

  if (loading) {
    return (
      <ShaderBackground>
        <ConsumerHeader />
        <main className="absolute top-20 left-0 right-0 bottom-0 flex items-center justify-center z-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white/70">Loading business...</p>
          </div>
        </main>
      </ShaderBackground>
    )
  }

  if (error || !business) {
    return (
      <ShaderBackground>
        <ConsumerHeader />
        <main className="absolute top-20 left-0 right-0 bottom-0 flex items-center justify-center z-20">
          <div className="text-center max-w-lg px-8">
            <h1 className="text-4xl font-light text-white mb-4">
              <span className="font-medium italic instrument">Oops!</span>
            </h1>
            <p className="text-white/70 mb-6">{error || 'Business not found'}</p>
            <button 
              onClick={() => router.push('/consumer-landing')}
              className="px-8 py-3 rounded-full bg-white text-black font-normal text-sm transition-all duration-200 hover:bg-white/90"
            >
              Back to Businesses
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
        <div className="max-w-6xl mx-auto">
          
          {/* Business Header */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10 mb-8">
            <div className="flex items-start gap-6">
              {business.profile_picture_url ? (
                <img
                  src={business.profile_picture_url}
                  alt={business.business_name}
                  className="w-20 h-20 rounded-full object-cover border-2 border-white/20"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-white/20 to-white/10 border-2 border-white/20 flex items-center justify-center">
                  <span className="text-white font-medium text-2xl">
                    {business.business_name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              
              <div className="flex-1">
                <h1 className="text-3xl font-light text-white mb-2">
                  <span className="font-medium italic instrument">{business.business_name}</span>
                </h1>
                {business.description && (
                  <p className="text-white/70 mb-4 leading-relaxed">{business.description}</p>
                )}
                
                <div className="flex items-center gap-6 text-sm">
                  {business.location && (
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-white/70">{business.location}</span>
                    </div>
                  )}
                  
                  {business.ens_domain && (
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                      </svg>
                      <span className="text-white/70 font-mono">{business.ens_domain}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Loyalty Program Status */}
          {!loyaltyRequest && (
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10 mb-8">
              <h2 className="text-2xl font-light text-white mb-4">
                Join <span className="font-medium italic instrument">Loyalty Program</span>
              </h2>
              
              {!userProfile || !isProfileComplete(userProfile) ? (
                <div className="space-y-4">
                  <p className="text-white/70 mb-4">
                    {!userProfile 
                      ? `Complete your EzEarn profile to join ${business.business_name}'s loyalty program.`
                      : `Complete your EzEarn profile to join ${business.business_name}'s loyalty program.`
                    }
                  </p>
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                    <p className="text-yellow-300 text-sm mb-3">
                      <strong>Profile Required:</strong> {!userProfile 
                        ? 'You need to create your EzEarn profile with all required fields before joining loyalty programs.'
                        : 'You need to complete all required fields in your EzEarn profile before joining loyalty programs.'
                      }
                    </p>
                    <button
                      onClick={() => router.push('/user-profile')}
                      className="px-6 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition-colors font-medium"
                    >
                      {!userProfile ? 'Create Profile' : 'Complete Profile'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <p className="text-white/70 mb-4">
                    Request to join {business.business_name}'s loyalty program to start earning rewards and completing bounties.
                  </p>
                  
                  <div className="mb-6">
                    <label className="block text-white font-medium mb-2">Message (Optional)</label>
                    <textarea
                      value={requestMessage}
                      onChange={(e) => setRequestMessage(e.target.value)}
                      className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/50"
                      placeholder="Tell the business why you'd like to join their loyalty program..."
                      rows={3}
                    />
                  </div>
                  
                  <button
                    onClick={handleJoinRequest}
                    disabled={submittingRequest || !user?.wallet?.address}
                    className="px-8 py-3 rounded-full bg-white text-black font-normal text-sm transition-all duration-200 hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submittingRequest ? 'Submitting...' : 'Request to Join'}
                  </button>
                  
                  {!user?.wallet?.address && (
                    <p className="text-yellow-400 text-sm mt-3">Please connect your wallet to join the loyalty program</p>
                  )}
                </div>
              )}
            </div>
          )}

          {loyaltyRequest?.status === 'pending' && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-8 mb-8">
              <h2 className="text-2xl font-light text-white mb-4">
                <span className="font-medium italic instrument">Request Pending</span>
              </h2>
              <p className="text-white/70 mb-4">
                Your request to join {business.business_name}'s loyalty program is pending review.
              </p>
              <div className="text-sm text-white/60">
                Requested: {new Date(loyaltyRequest.requested_at).toLocaleDateString()}
              </div>
            </div>
          )}

          {loyaltyRequest?.status === 'rejected' && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-8 mb-8">
              <h2 className="text-2xl font-light text-white mb-4">
                <span className="font-medium italic instrument">Request Rejected</span>
              </h2>
              <p className="text-white/70 mb-4">
                Your request to join {business.business_name}'s loyalty program was rejected.
              </p>
              {loyaltyRequest.rejection_reason && (
                <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-4">
                  <div className="text-white/60 text-sm mb-1">Reason:</div>
                  <div className="text-white/90">{loyaltyRequest.rejection_reason}</div>
                </div>
              )}
              <button
                onClick={() => router.push('/consumer-landing')}
                className="px-6 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
              >
                Browse Other Businesses
              </button>
            </div>
          )}

          {loyaltyRequest?.status === 'approved' && (
            <div className="space-y-8">
              {/* Member Dashboard */}
              {memberData && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-8">
                  <h2 className="text-2xl font-light text-white mb-4">
                    Welcome to <span className="font-medium italic instrument">{business.business_name}</span>
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-light text-white">{parseInt(memberData.totalPoints)}</div>
                      <div className="text-white/60 text-sm">Total Points</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-light text-white">{memberData.completedBounties}</div>
                      <div className="text-white/60 text-sm">Bounties Completed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-light text-white">{memberData.ownedVouchers}</div>
                      <div className="text-white/60 text-sm">Vouchers Owned</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-light text-white">{memberData.claimedPrizes}</div>
                      <div className="text-white/60 text-sm">Prizes Claimed</div>
                    </div>
                  </div>
                  {memberData.ensName && (
                    <div className="mt-4 text-center">
                      <div className="text-white/60 text-sm">Your ENS Name</div>
                      <div className="text-white font-mono">{memberData.ensName}</div>
                    </div>
                  )}
                </div>
              )}

              {/* Available Bounties */}
              <div>
                <h3 className="text-2xl font-light text-white mb-6">
                  Available <span className="font-medium italic instrument">Bounties</span>
                </h3>
                
                {bounties.length === 0 ? (
                  <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                    <p className="text-white/70">No bounties available at the moment.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {bounties.filter(b => b.isActive).map((bounty) => (
                      <div key={bounty.id} className="bg-white/5 rounded-lg p-6 border border-white/10">
                        <h4 className="text-white font-medium text-lg mb-3">{bounty.title}</h4>
                        <p className="text-white/70 text-sm mb-4 leading-relaxed">{bounty.description}</p>
                        
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-white/60">Completions</span>
                            <span className="text-white">{bounty.currentCompletions}/{bounty.maxCompletions}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/60">Expires</span>
                            <span className="text-white">
                              {isNaN(Number(bounty.expiry)) ? '—' : new Date(Number(bounty.expiry) * 1000).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        
                        <button className="w-full mt-4 px-4 py-2 bg-white text-black rounded-lg hover:bg-white/90 transition-colors text-sm font-medium">
                          View Details
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </ShaderBackground>
  )
}