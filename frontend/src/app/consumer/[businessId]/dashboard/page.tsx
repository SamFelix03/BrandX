"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import ConsumerDashboardHeader from '../../../../components/consumer-dashboard-header'
import BusinessGradientBackground from '../../../../components/business-gradient-background'
import BountyCompletionModal from '../../../../components/bounty-completion-modal'
import ConsumerBountyDetailsModal from '../../../../components/consumer-bounty-details-modal'

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

interface ContractPrize {
  id: string
  name: string
  description: string
  pointsCost: string
  active: boolean
  maxClaims: string
  claimed: string
  metadata: string
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

interface RewardTemplate {
  id: string
  name: string
  description: string
  rewardType: string
  pointsValue: number
  voucherMetadata: string
  validityPeriod: number
  tokenAddress: string
  tokenAmount: number
  nftMetadata: string
}

interface UserVoucher {
  tokenId: string
  rewardTemplateId: string
  claimed: boolean
  template?: RewardTemplate
}

export default function ConsumerDashboard() {
  const params = useParams()
  const router = useRouter()
  const { authenticated, user, ready } = useAuthStore()
  const businessId = params.businessId as string
  
  const [business, setBusiness] = useState<Business | null>(null)
  const [memberData, setMemberData] = useState<ContractMember | null>(null)
  const [bounties, setBounties] = useState<ContractBounty[]>([])
  const [prizes, setPrizes] = useState<ContractPrize[]>([])
  const [userVouchers, setUserVouchers] = useState<UserVoucher[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('bounties')
  const [showBountyModal, setShowBountyModal] = useState(false)
  const [showBountyDetails, setShowBountyDetails] = useState(false)
  const [selectedBounty, setSelectedBounty] = useState<ContractBounty | null>(null)
  const [claimingVouchers, setClaimingVouchers] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!ready) return
    
    if (!authenticated) {
      router.push('/consumer-auth')
      return
    }
    
    if (businessId && user?.wallet?.address) {
      fetchDashboardData()
    }
  }, [businessId, authenticated, user?.wallet?.address, ready, router])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch business details
      const businessResponse = await fetch(`/api/businesses/all`)
      const businessData = await businessResponse.json()
      
      if (businessResponse.ok) {
        const foundBusiness = businessData.businesses.find((b: Business) => b.id === businessId)
        if (!foundBusiness) {
          setError('Business not found')
          return
        }
        setBusiness(foundBusiness)
        
        if (foundBusiness.smart_contract_address && user?.wallet?.address) {
          // Fetch member data first to verify membership
          await fetchMemberData(foundBusiness.smart_contract_address, user.wallet.address)
          
          // Fetch other data in parallel
          await Promise.all([
            fetchBounties(foundBusiness.smart_contract_address),
            fetchPrizes(foundBusiness.smart_contract_address),
            fetchUserVouchers(foundBusiness.smart_contract_address, user.wallet.address)
          ])
        }
      } else {
        setError('Failed to fetch business data')
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err)
      setError('Failed to load dashboard')
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
        
        if (!member) {
          // User is not a member, redirect to join page
          router.push(`/consumer/${businessId}`)
          return
        }
        
        setMemberData(member)
      }
    } catch (err) {
      console.error('Failed to fetch member data:', err)
      setError('Failed to verify membership')
    }
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

  const fetchPrizes = async (contractAddress: string) => {
    try {
      const response = await fetch(`/api/contract/prizes?contractAddress=${contractAddress}`)
      const data = await response.json()
      
      if (response.ok) {
        setPrizes(data.prizes || [])
      }
    } catch (err) {
      console.error('Failed to fetch prizes:', err)
    }
  }

  const fetchUserVouchers = async (contractAddress: string, wallet: string) => {
    try {
      // This would need to be implemented in the API
      const response = await fetch(`/api/contract/user-vouchers?contractAddress=${contractAddress}&userAddress=${wallet}`)
      const data = await response.json()
      
      if (response.ok) {
        setUserVouchers(data.vouchers || [])
      }
    } catch (err) {
      console.error('Failed to fetch user vouchers:', err)
    }
  }

  const handleClaimVoucher = async (tokenId: string) => {
    if (!business?.smart_contract_address || !user?.wallet?.address) return
    
    // Add voucher to claiming set
    setClaimingVouchers(prev => new Set(prev).add(tokenId))
    
    try {
      const response = await fetch('/api/contract/claim-voucher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractAddress: business.smart_contract_address,
          tokenId: tokenId,
          walletAddress: user.wallet.address
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        // Refresh voucher data to show updated state
        await fetchUserVouchers(business.smart_contract_address, user.wallet.address)
        alert('Voucher claimed successfully!')
      } else {
        alert(data.error || 'Failed to claim voucher')
      }
    } catch (error) {
      console.error('Error claiming voucher:', error)
      alert('Failed to claim voucher')
    } finally {
      // Remove voucher from claiming set
      setClaimingVouchers(prev => {
        const newSet = new Set(prev)
        newSet.delete(tokenId)
        return newSet
      })
    }
  }

  if (!ready || loading) {
    return (
      <BusinessGradientBackground logoUrl={business?.profile_picture_url}>
        <div className="pt-20">
          <main className="absolute top-20 left-0 right-0 bottom-0 flex items-center justify-center z-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-white/70">{!ready ? 'Initializing...' : 'Loading dashboard...'}</p>
            </div>
          </main>
        </div>
      </BusinessGradientBackground>
    )
  }

  if (error || !business || !memberData) {
    return (
      <BusinessGradientBackground logoUrl={business?.profile_picture_url}>
        <div className="pt-20">
          <main className="absolute top-20 left-0 right-0 bottom-0 flex items-center justify-center z-20">
            <div className="text-center max-w-lg px-8">
              <h1 className="text-4xl font-light text-white mb-4">
                <span className="font-medium italic instrument">Oops!</span>
              </h1>
              <p className="text-white/70 mb-6">{error || 'Dashboard not accessible'}</p>
              <button 
                onClick={() => router.push('/consumer-landing')}
                className="px-8 py-3 rounded-full bg-white text-black font-normal text-sm transition-all duration-200 hover:bg-white/90"
              >
                Back to Businesses
              </button>
            </div>
          </main>
        </div>
      </BusinessGradientBackground>
    )
  }

  const activeBounties = bounties.filter(b => b.isActive)
  const availablePrizes = prizes.filter(p => p.active && parseInt(p.pointsCost) <= parseInt(memberData.totalPoints))

  return (
    <BusinessGradientBackground logoUrl={business?.profile_picture_url}>
      <ConsumerDashboardHeader 
        business={business}
        memberData={memberData}
      />
      
      {/* Floating Tab Navigation */}
      <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-40">
        <nav className="flex items-center space-x-2 bg-white/10 backdrop-blur-md rounded-2xl p-2 border border-white/20 shadow-lg">
          {[
            { id: 'bounties', label: 'Bounties', icon: '' },
            { id: 'rewards', label: 'My Rewards', icon: '' },
            { id: 'store', label: 'Prize Store', icon: '' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-white text-black shadow-md'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <main className="pt-32 pb-8 px-4 sm:px-6 lg:px-8 min-h-screen">
        <div className="max-w-7xl mx-auto">
          
          {/* Bounties Tab */}
          {activeTab === 'bounties' && (
            <div className="mt-9">
              {/* Company Welcome Section */}
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10 mb-4 text-center">
                <div className="flex items-center justify-center gap-6 mb-6">
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
                </div>
                
                <h1 className="text-3xl font-light text-white mb-4">
                  Welcome to the loyalty program of{' '}
                  <span className="font-medium italic instrument">{business.business_name}</span>
                </h1>
                
                {business.description && (
                  <p className="text-white/70 mb-4 max-w-2xl mx-auto leading-relaxed">{business.description}</p>
                )}
                
                <div className="flex items-center justify-center gap-6 text-sm">
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

              <div className="mb-6 flex flex-col items-center justify-center text-center">
                <h2 className="text-2xl font-light text-white mb-2">
                  Available Bounties
                </h2>
                <p className="text-white/60">Complete bounties to earn points and rewards</p>
              </div>
              {activeBounties.length === 0 ? (
                <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
                  <div className="mb-4">
                    <svg className="w-16 h-16 mx-auto text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">No Active Bounties</h3>
                  <p className="text-white/60">Check back later for new bounties to complete!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {activeBounties.map((bounty) => {
                    const expiryMs = Number(bounty.expiry) * 1000
                    const expiryText = bounty.expiry === '0' ? 'Never' : (isNaN(expiryMs) ? '—' : new Date(expiryMs).toLocaleDateString())
                    
                    return (
                      <div 
                        key={bounty.id} 
                        className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                        onClick={() => {
                          setSelectedBounty(bounty)
                          setShowBountyDetails(true)
                        }}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex flex-wrap gap-2">
                            <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-300 border border-green-500/30">
                              Active
                            </span>
                          </div>
                        </div>
                        
                        <h4 className="text-lg font-medium text-white mb-2">{bounty.title}</h4>
                        <p className="text-white/70 text-sm mb-4 line-clamp-3">{bounty.description}</p>
                        
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-white/60">Expires:</span>
                            <span className="text-white">{expiryText}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-white/60">Max Completions:</span>
                            <span className="text-white">{bounty.maxCompletions === '0' ? 'Unlimited' : bounty.maxCompletions}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-white/60">Current Completions:</span>
                            <span className="text-white">{bounty.currentCompletions}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-white/60">Bounty ID:</span>
                            <span className="text-white font-mono text-xs">{bounty.id}</span>
                          </div>
                          {bounty.rewardTemplateId && bounty.rewardTemplateId !== '0' && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-white/60">Reward Template:</span>
                              <span className="text-white font-mono text-xs">#{bounty.rewardTemplateId}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-white/10">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedBounty(bounty)
                              setShowBountyDetails(true)
                            }}
                            className="px-3 py-1 bg-white/10 text-white rounded text-sm hover:bg-white/20 transition-colors"
                          >
                            View Details
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedBounty(bounty)
                              setShowBountyModal(true)
                            }}
                            className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-2 bg-green-500/20 text-green-300 border border-green-500/30 hover:bg-green-500/30"
                          >
                            Complete Bounty
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* My Rewards Tab */}
          {activeTab === 'rewards' && (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-light text-white mb-2">
                  My <span className="font-medium italic instrument">Rewards</span>
                </h2>
                <p className="text-white/60">Your earned vouchers and rewards</p>
              </div>
              
              {userVouchers.length === 0 ? (
                <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
                  <div className="mb-4">
                    <svg className="w-16 h-16 mx-auto text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">No Rewards Yet</h3>
                  <p className="text-white/60">Complete bounties to earn your first rewards!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {userVouchers.map((voucher) => (
                    <div key={voucher.tokenId} className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                      <div className="flex items-start justify-between mb-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          voucher.claimed
                            ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                            : 'bg-green-500/20 text-green-300 border border-green-500/30'
                        }`}>
                          {voucher.claimed ? 'Used' : 'Available'}
                        </span>
                        <div className="text-xs text-white/60">
                          #{voucher.tokenId}
                        </div>
                      </div>
                      
                      <h3 className="text-lg font-medium text-white mb-2">
                        {voucher.template?.name || 'Reward Voucher'}
                      </h3>
                      <p className="text-white/70 text-sm mb-4">
                        {voucher.template?.description || 'Reward voucher from completing bounties'}
                      </p>
                      
                      {!voucher.claimed && (
                        <button 
                          onClick={() => handleClaimVoucher(voucher.tokenId)}
                          disabled={claimingVouchers.has(voucher.tokenId)}
                          className="w-full px-4 py-2 bg-white text-black rounded-lg hover:bg-white/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {claimingVouchers.has(voucher.tokenId) && (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                          )}
                          {claimingVouchers.has(voucher.tokenId) ? 'Claiming...' : 'Use Voucher'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Prize Store Tab */}
          {activeTab === 'store' && (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-light text-white mb-2">
                  Prize <span className="font-medium italic instrument">Store</span>
                </h2>
                <p className="text-white/60">Spend your points on exclusive prizes</p>
              </div>
              
              {prizes.length === 0 ? (
                <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
                  <div className="mb-4">
                    <svg className="w-16 h-16 mx-auto text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">No Prizes Available</h3>
                  <p className="text-white/60">The prize store is currently empty. Check back later!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {prizes.filter(p => p.active).map((prize) => {
                    const pointsCost = parseInt(prize.pointsCost)
                    const userPoints = parseInt(memberData?.totalPoints || '0')
                    const canAfford = userPoints >= pointsCost
                    const maxClaims = parseInt(prize.maxClaims)
                    const claimed = parseInt(prize.claimed)
                    const available = maxClaims === 0 || claimed < maxClaims
                    
                    return (
                      <div key={prize.id} className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex flex-wrap gap-2">
                            {!available && (
                              <span className="px-2 py-1 text-xs rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
                                Sold Out
                              </span>
                            )}
                            {!canAfford && available && (
                              <span className="px-2 py-1 text-xs rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                                Not Enough Points
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-white/60">
                            {claimed}/{maxClaims === 0 ? '∞' : maxClaims}
                          </div>
                        </div>
                        
                        <h3 className="text-lg font-medium text-white mb-2">{prize.name}</h3>
                        <p className="text-white/70 text-sm mb-4 line-clamp-3">{prize.description}</p>
                        
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-white/60">Cost:</span>
                          <span className="text-white font-bold text-lg">{pointsCost.toLocaleString()} pts</span>
                        </div>
                        
                        <button 
                          disabled={!canAfford || !available}
                          className="w-full px-4 py-2 bg-white text-black rounded-lg hover:bg-white/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-white/60"
                        >
                          {!available ? 'Sold Out' : !canAfford ? 'Insufficient Points' : 'Claim Prize'}
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Bounty Details Modal */}
      <ConsumerBountyDetailsModal
        isOpen={showBountyDetails}
        onClose={() => {
          setShowBountyDetails(false)
          setSelectedBounty(null)
        }}
        bounty={selectedBounty}
        contractAddress={business?.smart_contract_address}
        onStartCompletion={(bounty) => {
          setSelectedBounty(bounty)
          setShowBountyModal(true)
        }}
      />

      {/* Bounty Completion Modal */}
      <BountyCompletionModal
        isOpen={showBountyModal}
        onClose={() => {
          setShowBountyModal(false)
          setSelectedBounty(null)
          // Refresh data after modal closes (in case bounty was completed)
          if (business?.smart_contract_address && user?.wallet?.address) {
            fetchMemberData(business.smart_contract_address, user.wallet.address)
            fetchBounties(business.smart_contract_address)
          }
        }}
        bounty={selectedBounty}
        contractAddress={business?.smart_contract_address || ''}
        userAddress={user?.wallet?.address || ''}
      />
    </BusinessGradientBackground>
  )
}