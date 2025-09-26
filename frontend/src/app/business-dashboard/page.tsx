"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import { REWARD_TEMPLATES, WEB2_REWARD_TEMPLATES } from '@/lib/constants'
import BusinessGradientBackground from '../../components/business-gradient-background'
import DashboardHeader from '../../components/dashboard-header'

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

interface RewardData {
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

interface Bounty {
  title: string
  description: string
  rewardData?: RewardData
  expiry: number
  maxCompletions: number
}

interface Prize {
  name: string
  description: string
  pointsCost: number
  maxClaims: number
  metadata: string
}

interface LoyaltyRequest {
  id: string
  business_id: string
  consumer_wallet_address: string
  consumer_ens_name?: string
  status: 'pending' | 'approved' | 'rejected'
  requested_at: string
  reviewed_at?: string
  reviewed_by?: string
  rejection_reason?: string
  consumer_message?: string
}

export default function BusinessDashboard() {
  const router = useRouter()
  const { authenticated, user, business, businessLoading, ready } = useAuthStore()
  
  // State for contract data
  const [bounties, setBounties] = useState<ContractBounty[]>([])
  const [prizes, setPrizes] = useState<ContractPrize[]>([])
  const [members, setMembers] = useState<ContractMember[]>([])
  const [loyaltyRequests, setLoyaltyRequests] = useState<LoyaltyRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [requestsLoading, setRequestsLoading] = useState(false)
  
  // Modal states
  const [showAddBounty, setShowAddBounty] = useState(false)
  const [showAddPrize, setShowAddPrize] = useState(false)
  const [activeTab, setActiveTab] = useState<'members' | 'bounties' | 'analysis' | 'prizes' | 'requests' | 'profile'>('members')
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [creatingBounty, setCreatingBounty] = useState(false)
  const [creatingBountyStep, setCreatingBountyStep] = useState<'idle' | 'addingTemplate' | 'creatingBounty' | 'done' | 'error'>('idle')
  const [showBountyDetails, setShowBountyDetails] = useState(false)
  const [selectedBounty, setSelectedBounty] = useState<ContractBounty | null>(null)
  const [selectedReward, setSelectedReward] = useState<any | null>(null)
  const [loadingReward, setLoadingReward] = useState(false)
  const anyModalOpen = showAddBounty || showAddPrize || showBountyDetails

  const parseJSONSafely = (value: string | undefined | null) => {
    if (!value) return null
    try {
      return JSON.parse(value)
    } catch {
      return null
    }
  }
  const [newBounty, setNewBounty] = useState<Bounty>({
    title: '',
    description: '',
    rewardData: undefined,
    expiry: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days from now
    maxCompletions: 100
  })
  const [newPrize, setNewPrize] = useState<Prize>({
    name: '',
    description: '',
    pointsCost: 100,
    maxClaims: 0,
    metadata: ''
  })

  useEffect(() => {
    // Wait for Privy to be ready before making auth decisions
    if (!ready) return
    
    // Enforce contract deployment requirement
    if (!businessLoading && authenticated && business) {
      if (!business.smart_contract_address) {
        // No contract deployed - redirect to bounty management to complete setup
        router.push('/bounty-management')
      } else {
        // Contract deployed - fetch bounties and prizes
        fetchContractData()
        fetchLoyaltyRequests()
      }
    } else if (!businessLoading && !authenticated) {
      router.push('/business-landing')
    }
  }, [authenticated, business, businessLoading, ready, router])

  const fetchContractData = async () => {
    if (!business?.smart_contract_address) return
    
    setLoading(true)
    try {
      // Fetch bounties, prizes, and members from contract
      const [bountiesRes, prizesRes, membersRes] = await Promise.all([
        fetch(`/api/contract/bounties?contractAddress=${business.smart_contract_address}`),
        fetch(`/api/contract/prizes?contractAddress=${business.smart_contract_address}`),
        fetch(`/api/contract/members?contractAddress=${business.smart_contract_address}`)
      ])

      if (bountiesRes.ok) {
        const bountiesData = await bountiesRes.json()
        setBounties(bountiesData.bounties || [])
      }

      if (prizesRes.ok) {
        const prizesData = await prizesRes.json()
        setPrizes(prizesData.prizes || [])
      }

      if (membersRes.ok) {
        const membersData = await membersRes.json()
        setMembers(membersData.members || [])
      }
    } catch (error) {
      console.error('Failed to fetch contract data:', error)
      // Set empty arrays on error
      setBounties([])
      setPrizes([])
      setMembers([])
    } finally {
      setLoading(false)
    }
  }

  const fetchLoyaltyRequests = async () => {
    if (!user?.wallet?.address) return
    
    try {
      setRequestsLoading(true)
      const response = await fetch(`/api/loyalty-requests/business?wallet_address=${user.wallet.address}`)
      const data = await response.json()
      
      if (response.ok) {
        setLoyaltyRequests(data.requests || [])
      } else {
        console.error('Failed to fetch loyalty requests:', data.error)
      }
    } catch (error) {
      console.error('Error fetching loyalty requests:', error)
    } finally {
      setRequestsLoading(false)
    }
  }

  const handleRequestAction = async (requestId: string, action: 'approved' | 'rejected', rejectionReason?: string) => {
    if (!user?.wallet?.address) return
    
    try {
      const response = await fetch('/api/loyalty-requests/business', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_wallet_address: user.wallet.address,
          request_id: requestId,
          new_status: action,
          rejection_reason: rejectionReason
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        // Refresh requests
        await fetchLoyaltyRequests()
        alert(`Request ${action} successfully`)
      } else {
        alert(data.error || `Failed to ${action} request`)
      }
    } catch (error) {
      console.error(`Error ${action} request:`, error)
      alert(`Failed to ${action} request`)
    }
  }

  const handleCreateBounty = async () => {
    if (!business?.smart_contract_address || !newBounty.rewardData) return
    
    try {
      setCreatingBounty(true)
      setCreatingBountyStep('addingTemplate')
      const response = await fetch('/api/add-bounty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractAddress: business.smart_contract_address,
          bounty: newBounty,
          walletAddress: user?.wallet?.address
        })
      })

      if (response.ok) {
        setCreatingBountyStep('creatingBounty')
        // Reset form and close modal
        setNewBounty({
          title: '',
          description: '',
          rewardData: undefined,
          expiry: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
          maxCompletions: 100
        })
        setShowAddBounty(false)
        // Refresh contract data
        await fetchContractData()
        setCreatingBountyStep('done')
      } else {
        setCreatingBountyStep('error')
        alert('Failed to create bounty')
      }
    } catch (error) {
      console.error('Error creating bounty:', error)
      setCreatingBountyStep('error')
      alert('Failed to create bounty')
    } finally {
      setCreatingBounty(false)
      setCreatingBountyStep('idle')
    }
  }

  const handleCreatePrize = async () => {
    if (!business?.smart_contract_address) return
    
    try {
      const response = await fetch('/api/add-prize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractAddress: business.smart_contract_address,
          prize: newPrize,
          walletAddress: user?.wallet?.address
        })
      })

      if (response.ok) {
        // Reset form and close modal
        setNewPrize({
          name: '',
          description: '',
          pointsCost: 100,
          maxClaims: 0,
          metadata: ''
        })
        setShowAddPrize(false)
        // Refresh contract data
        await fetchContractData()
      } else {
        alert('Failed to create prize')
      }
    } catch (error) {
      console.error('Error creating prize:', error)
      alert('Failed to create prize')
    }
  }

  // Show loading state while Privy is initializing
  if (!ready) {
    return (
      <BusinessGradientBackground logoUrl={business?.profile_picture_url}>
        <DashboardHeader />
        <main className="absolute top-20 left-0 right-0 bottom-0 flex items-center justify-center z-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white/70">Initializing...</p>
          </div>
        </main>
      </BusinessGradientBackground>
    )
  }

  if (!authenticated) {
    return (
      <BusinessGradientBackground logoUrl={business?.profile_picture_url}>
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
      </BusinessGradientBackground>
    )
  }

  if (businessLoading) {
    return (
      <BusinessGradientBackground logoUrl={business?.profile_picture_url}>
        <DashboardHeader />
        <main className="absolute top-20 left-0 right-0 bottom-0 flex items-center justify-center z-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white/70">Loading your dashboard...</p>
          </div>
        </main>
      </BusinessGradientBackground>
    )
  }

  // Prevent access if no contract is deployed
  if (!business?.smart_contract_address) {
    return null // Will redirect to bounty management
  }

  return (
    <BusinessGradientBackground logoUrl={business?.profile_picture_url}>
      <DashboardHeader 
        business={business || { business_name: 'Loading...', profile_picture_url: '' }} 
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={() => setIsSidebarCollapsed(prev => !prev)}
      />
      <main className={`absolute top-20 left-0 right-0 bottom-0 ${anyModalOpen ? 'z-40' : 'z-20'} p-0 overflow-hidden`}>
        <div className="h-full flex">
          {/* Sidebar */}
          <aside className={`${isSidebarCollapsed ? 'w-16' : 'w-64'} shrink-0 h-full border-r border-white/10 bg-white/5 backdrop-blur-sm p-4 transition-all duration-200`}> 
            <div className="mb-6">
            </div>
            <nav className="space-y-2">
              <button
                className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-start gap-3'} px-3 py-2 rounded-lg transition-colors ${activeTab === 'members' ? 'bg-white text-black' : 'text-white hover:bg-white/10'}`}
                onClick={() => setActiveTab('members')}
                aria-label="Manage Members"
              >
                <svg className={`${isSidebarCollapsed ? 'w-5 h-5' : 'w-4 h-4'} ${activeTab === 'members' ? 'text-black' : 'text-white/80'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-3-3.87M9 11a4 4 0 100-8 4 4 0 000 8zm8 1a4 4 0 100-8 4 4 0 000 8zM3 20v-2a4 4 0 013-3.87M16 21v-2a4 4 0 00-3-3.87M7 21v-2a4 4 0 013-3.87" />
                </svg>
                {!isSidebarCollapsed && <span>Manage Members</span>}
              </button>
              <button
                className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-start gap-3'} px-3 py-2 rounded-lg transition-colors ${activeTab === 'bounties' ? 'bg-white text-black' : 'text-white hover:bg-white/10'}`}
                onClick={() => setActiveTab('bounties')}
                aria-label="My Bounties/Challenges"
              >
                <svg className={`${isSidebarCollapsed ? 'w-5 h-5' : 'w-4 h-4'} ${activeTab === 'bounties' ? 'text-black' : 'text-white/80'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.59 3.41A2 2 0 0119 4.83V21l-7-3-7 3V4.83a2 2 0 011.41-1.42L12 2l5.59 1.41z" />
                </svg>
                {!isSidebarCollapsed && <span>Bounties</span>}
              </button>
              <button
                className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-start gap-3'} px-3 py-2 rounded-lg transition-colors ${activeTab === 'analysis' ? 'bg-white text-black' : 'text-white hover:bg-white/10'}`}
                onClick={() => setActiveTab('analysis')}
                aria-label="BrandHero Analysis Results"
              >
                <svg className={`${isSidebarCollapsed ? 'w-5 h-5' : 'w-4 h-4'} ${activeTab === 'analysis' ? 'text-black' : 'text-white/80'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3v18M5 13l4 4L19 7" />
                </svg>
                {!isSidebarCollapsed && <span>BrandHero Analysis</span>}
              </button>
              <button
                className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-start gap-3'} px-3 py-2 rounded-lg transition-colors ${activeTab === 'prizes' ? 'bg-white text-black' : 'text-white hover:bg-white/10'}`}
                onClick={() => setActiveTab('prizes')}
                aria-label="Prize Store"
              >
                <svg className={`${isSidebarCollapsed ? 'w-5 h-5' : 'w-4 h-4'} ${activeTab === 'prizes' ? 'text-black' : 'text-white/80'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12v8a2 2 0 01-2 2H6a2 2 0 01-2-2v-8m16 0H4m16 0l-2-5a2 2 0 00-1.87-1.25H7.87A2 2 0 006 7l-2 5m16 0H4" />
                </svg>
                {!isSidebarCollapsed && <span>Prize Store</span>}
              </button>
              <button
                className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-start gap-3'} px-3 py-2 rounded-lg transition-colors ${activeTab === 'requests' ? 'bg-white text-black' : 'text-white hover:bg-white/10'}`}
                onClick={() => setActiveTab('requests')}
                aria-label="Membership Requests"
              >
                <svg className={`${isSidebarCollapsed ? 'w-5 h-5' : 'w-4 h-4'} ${activeTab === 'requests' ? 'text-black' : 'text-white/80'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {!isSidebarCollapsed && <span>Join Requests</span>}
                {!isSidebarCollapsed && loyaltyRequests.filter(r => r.status === 'pending').length > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                    {loyaltyRequests.filter(r => r.status === 'pending').length}
                  </span>
                )}
              </button>
              <button
                className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-start gap-3'} px-3 py-2 rounded-lg transition-colors ${activeTab === 'profile' ? 'bg-white text-black' : 'text-white hover:bg-white/10'}`}
                onClick={() => setActiveTab('profile')}
                aria-label="My Profile"
              >
                <svg className={`${isSidebarCollapsed ? 'w-5 h-5' : 'w-4 h-4'} ${activeTab === 'profile' ? 'text-black' : 'text-white/80'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A9 9 0 1118.88 17.804M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {!isSidebarCollapsed && <span>My Profile</span>}
              </button>
            </nav>
          </aside>

          {/* Content */}
          <section className="flex-1 h-full overflow-y-auto p-8">
          {/* Header Section */}
            <div className="mb-6">
              <h1 className="text-3xl font-light text-white mb-2">
                  Welcome back, <span className="font-medium italic instrument">{business?.business_name}</span>
                </h1>
              <p className="text-white/70">{business?.description || "Your business dashboard is ready"}</p>
            </div>
            
            {/* Contract status moved to header as clickable link */}

            {/* Tab Content */}
            {activeTab === 'members' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-medium text-lg">Members</h3>
                  <div className="text-white/60 text-sm">Total: {loading ? '—' : members.length}</div>
                </div>
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white mx-auto mb-3"></div>
                    <p className="text-white/70 text-sm">Loading members...</p>
              </div>
                ) : members.length === 0 ? (
                  <div className="bg-white/5 border border-white/10 rounded-lg p-6 text-white/70">No members yet.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {members.map((m) => (
                      <div key={m.address} className="bg-white/5 rounded-lg p-4 border border-white/10">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-white font-medium truncate max-w-[70%]">{m.ensName || m.address}</h4>
                          <span className="text-xs text-white/60">Joined {new Date(Number(m.joinedAt) * 1000).toLocaleDateString()}</span>
                        </div>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between"><span className="text-white/60">Address</span><span className="text-white font-mono truncate max-w-[60%]">{m.address}</span></div>
                          <div className="flex justify-between"><span className="text-white/60">Total Points</span><span className="text-white">{parseInt(m.totalPoints)}</span></div>
                          <div className="flex justify-between"><span className="text-white/60">Completed Bounties</span><span className="text-white">{m.completedBounties}</span></div>
                          <div className="flex justify-between"><span className="text-white/60">Owned Vouchers</span><span className="text-white">{m.ownedVouchers}</span></div>
                          <div className="flex justify-between"><span className="text-white/60">Claimed Prizes</span><span className="text-white">{m.claimedPrizes}</span></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'bounties' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-medium text-lg">Bounties</h3>
              <button 
                onClick={() => setShowAddBounty(true)}
                    className="px-4 py-2 bg-white text-black rounded-lg hover:bg-white/90 transition-colors"
              >
                Create Bounty
              </button>
            </div>
              {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white mx-auto mb-3"></div>
                    <p className="text-white/70 text-sm">Loading bounties...</p>
                </div>
                ) : bounties.length === 0 ? (
                  <div className="bg-white/5 border border-white/10 rounded-lg p-6 text-white/70">No bounties yet.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {bounties.map((bounty) => {
                      const expiryMs = Number(bounty.expiry) * 1000
                      const expiryText = isNaN(expiryMs) ? '—' : new Date(expiryMs).toLocaleDateString()
                      return (
                        <button
                          key={bounty.id}
                          className="bg-white/5 rounded-lg p-4 border border-white/10 text-left hover:bg-white/10 transition-colors"
                          onClick={async () => {
                            setSelectedBounty(bounty)
                            setSelectedReward(null)
                            setShowBountyDetails(true)
                            // Fetch reward template details
                            if (business?.smart_contract_address && bounty.rewardTemplateId) {
                              try {
                                setLoadingReward(true)
                                const res = await fetch(`/api/contract/reward-templates?contractAddress=${business.smart_contract_address}`)
                                if (res.ok) {
                                  const data = await res.json()
                                  const match = (data.rewardTemplates || []).find((r: any) => r.id?.toString() === bounty.rewardTemplateId?.toString())
                                  if (match) {
                                    setSelectedReward({
                                      ...match,
                                      parsedVoucher: parseJSONSafely(match.voucherMetadata)
                                    })
                                  }
                                }
                              } finally {
                                setLoadingReward(false)
                              }
                            }
                          }}
                        >
                          <h4 className="text-white font-medium mb-2">{bounty.title}</h4>
                          <p className="text-white/70 text-sm mb-3 line-clamp-3">{bounty.description}</p>
                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between"><span className="text-white/60">Status</span><span className={bounty.isActive ? 'text-green-400' : 'text-red-400'}>{bounty.isActive ? 'Active' : 'Inactive'}</span></div>
                            <div className="flex justify-between"><span className="text-white/60">Completions</span><span className="text-white">{bounty.currentCompletions}/{bounty.maxCompletions}</span></div>
                            <div className="flex justify-between"><span className="text-white/60">Expiry</span><span className="text-white">{expiryText}</span></div>
                          </div>
                        </button>
                      )
                    })}
                    </div>
                  )}
                </div>
              )}

            {activeTab === 'analysis' && (
              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h3 className="text-white font-medium text-lg mb-2">BrandHero Analysis</h3>
                <p className="text-white/70">Coming soon.</p>
                </div>
              )}

            {activeTab === 'prizes' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-medium text-lg">Prize Store</h3>
              <button 
                onClick={() => setShowAddPrize(true)}
                    className="px-4 py-2 bg-white text-black rounded-lg hover:bg-white/90 transition-colors"
              >
                Add Prize
              </button>
            </div>
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white mx-auto mb-3"></div>
                    <p className="text-white/70 text-sm">Loading prizes...</p>
                  </div>
                ) : prizes.length === 0 ? (
                  <div className="bg-white/5 border border-white/10 rounded-lg p-6 text-white/70">No prizes yet.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {prizes.map((prize) => (
                  <div key={prize.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <h4 className="text-white font-medium mb-2">{prize.name}</h4>
                        <p className="text-white/70 text-sm mb-3 line-clamp-3">{prize.description}</p>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between"><span className="text-white/60">Points Cost</span><span className="text-white font-medium">{prize.pointsCost}</span></div>
                          <div className="flex justify-between"><span className="text-white/60">Claims</span><span className="text-white">{prize.claimed}/{prize.maxClaims === '0' ? '∞' : prize.maxClaims}</span></div>
                      </div>
                      </div>
                    ))}
                  </div>
                )}
            </div>
          )}

            {activeTab === 'profile' && (
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
                    <span className="text-white ml-2">{new Date(business?.created_at || '').toLocaleDateString()}</span>
              </div>
            </div>
          </div>
            )}
          </section>
        </div>

        {/* Add Bounty Modal */}
        {showAddBounty && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-medium text-white mb-6">Create New Bounty</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-white font-medium mb-2">Bounty Title</label>
                  <input
                    type="text"
                    value={newBounty.title}
                    onChange={(e) => setNewBounty(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/50"
                    placeholder="Enter bounty title"
                  />
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">Description</label>
                  <textarea
                    value={newBounty.description}
                    onChange={(e) => setNewBounty(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/50"
                    placeholder="Describe what users need to do"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">Select Reward Template</label>
                  <select
                    value={newBounty.rewardData ? newBounty.rewardData.name : ''}
                    onChange={(e) => {
                      const selectedTemplate = (business?.is_token_issuer ? REWARD_TEMPLATES : WEB2_REWARD_TEMPLATES)
                        .find(t => t.name === e.target.value)
                      if (selectedTemplate) {
                        setNewBounty(prev => ({ 
                          ...prev, 
                          rewardData: {
                            name: selectedTemplate.name,
                            description: selectedTemplate.description,
                            rewardType: selectedTemplate.rewardType,
                            pointsValue: selectedTemplate.pointsValue,
                            voucherMetadata: selectedTemplate.voucherMetadata,
                            validityPeriod: selectedTemplate.validityPeriod,
                            tokenAddress: selectedTemplate.tokenAddress,
                            tokenAmount: selectedTemplate.tokenAmount,
                            nftMetadata: selectedTemplate.nftMetadata
                          }
                        }))
                      } else {
                        setNewBounty(prev => ({ ...prev, rewardData: undefined }))
                      }
                    }}
                    className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:border-white/50"
                  >
                    <option value="">Choose a reward...</option>
                    {(business?.is_token_issuer ? REWARD_TEMPLATES : WEB2_REWARD_TEMPLATES).map((template) => (
                      <option key={template.id} value={template.name}>
                        {template.name} ({template.pointsValue} pts)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white font-medium mb-2">Max Completions</label>
                    <input
                      type="number"
                      value={newBounty.maxCompletions}
                      onChange={(e) => setNewBounty(prev => ({ ...prev, maxCompletions: parseInt(e.target.value) || 100 }))}
                      className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:border-white/50"
                    />
                  </div>
                  <div>
                    <label className="block text-white font-medium mb-2">Expiry (days from now)</label>
                    <input
                      type="number"
                      value={Math.floor((newBounty.expiry - Date.now() / 1000) / (24 * 60 * 60))}
                      onChange={(e) => {
                        const days = parseInt(e.target.value) || 30
                        setNewBounty(prev => ({ ...prev, expiry: Math.floor(Date.now() / 1000) + (days * 24 * 60 * 60) }))
                      }}
                      className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:border-white/50"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-6">
                  {creatingBounty && (
                    <div className="text-xs text-white/70">
                      {creatingBountyStep === 'addingTemplate' && 'Adding/Ensuring reward template...'}
                      {creatingBountyStep === 'creatingBounty' && 'Creating bounty on-chain...'}
                      {creatingBountyStep === 'error' && 'Error occurred. Please try again.'}
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddBounty(false)}
                    className="px-6 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateBounty}
                      disabled={creatingBounty || !newBounty.title || !newBounty.description || !newBounty.rewardData}
                    className="px-6 py-2 bg-white text-black rounded-lg hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                      {creatingBounty ? 'Processing...' : 'Create Bounty'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bounty Details Modal */}
        {showBountyDetails && selectedBounty && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
            <div className="bg-gray-900 rounded-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-medium text-white">Bounty Details</h3>
                <button
                  onClick={() => { setShowBountyDetails(false); setSelectedBounty(null); setSelectedReward(null); }}
                  className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg白/20 transition-colors"
                >
                  Close
                  </button>
              </div>
              <div className="space-y-6">
                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-2">{selectedBounty.title}</h4>
                  <p className="text-white/70 text-sm mb-3">{selectedBounty.description}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="flex justify-between"><span className="text-white/60">Status</span><span className={selectedBounty.isActive ? 'text-green-400' : 'text-red-400'}>{selectedBounty.isActive ? 'Active' : 'Inactive'}</span></div>
                    <div className="flex justify-between"><span className="text-white/60">Completions</span><span className="text-white">{selectedBounty.currentCompletions}/{selectedBounty.maxCompletions}</span></div>
                    <div className="flex justify-between"><span className="text-white/60">Expiry</span><span className="text-white">{isNaN(Number(selectedBounty.expiry)) ? '—' : new Date(Number(selectedBounty.expiry) * 1000).toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-white/60">Bounty ID</span><span className="text-white font-mono">{selectedBounty.id}</span></div>
                  </div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-3">Associated Reward</h4>
                  {loadingReward ? (
                    <div className="text-white/70 text-sm">Loading reward details...</div>
                  ) : selectedReward ? (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-white/60">Name</span><span className="text-white">{selectedReward.name}</span></div>
                      <div className="flex justify-between"><span className="text-white/60">Type</span><span className="text-white">{selectedReward.rewardType}</span></div>
                      <div className="flex justify-between"><span className="text-white/60">Points</span><span className="text-white">{selectedReward.pointsValue}</span></div>
                      {selectedReward.parsedVoucher ? (
                        <div className="text-white/90">
                          <div className="text-white/60 mb-2">Voucher Details</div>
                          <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                              {'discountPercentage' in selectedReward.parsedVoucher && (
                                <div>
                                  <div className="text-white/60 mb-1">Discount</div>
                                  <div className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-400/10 text-green-300 border border-green-400/20">
                                    {selectedReward.parsedVoucher.discountPercentage}% off
                                  </div>
                                </div>
                              )}
                              {'validFor' in selectedReward.parsedVoucher && (
                                <div>
                                  <div className="text-white/60 mb-1">Valid For</div>
                                  <div className="text-white">{selectedReward.parsedVoucher.validFor}</div>
                                </div>
                              )}
                              {'terms' in selectedReward.parsedVoucher && (
                                <div className="md:col-span-2">
                                  <div className="text-white/60 mb-1">Terms</div>
                                  <div className="text-white/90 bg-black/20 border border-white/10 rounded-md p-2 leading-relaxed">
                                    {selectedReward.parsedVoucher.terms}
                                  </div>
                                </div>
                              )}
                              {'excludes' in selectedReward.parsedVoucher && Array.isArray(selectedReward.parsedVoucher.excludes) && selectedReward.parsedVoucher.excludes.length > 0 && (
                                <div className="md:col-span-2">
                                  <div className="text-white/60 mb-1">Excludes</div>
                                  <div className="flex flex-wrap gap-2">
                                    {selectedReward.parsedVoucher.excludes.map((item: string, idx: number) => (
                                      <span key={idx} className="px-2 py-0.5 rounded-full bg-white/10 text-white/80 border border-white/15 text-[11px]">
                                        {item}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        selectedReward.voucherMetadata && (
                          <div className="flex justify-between"><span className="text-white/60">Voucher</span><span className="text-white truncate max-w-[60%]">{selectedReward.voucherMetadata}</span></div>
                        )
                      )}
                      {selectedReward.validityPeriod !== '0' && <div className="flex justify-between"><span className="text-white/60">Validity</span><span className="text-white">{selectedReward.validityPeriod}s</span></div>}
                      {selectedReward.tokenAddress && selectedReward.tokenAddress !== '0x0000000000000000000000000000000000000000' && (
                        <div className="flex justify-between"><span className="text-white/60">Token</span><span className="text-white font-mono">{selectedReward.tokenAddress} ({selectedReward.tokenAmount})</span></div>
                      )}
                      {selectedReward.nftMetadata && <div className="flex justify-between"><span className="text-white/60">NFT</span><span className="text-white truncate max-w-[60%]">{selectedReward.nftMetadata}</span></div>}
                    </div>
                  ) : (
                    <div className="text-white/70 text-sm">No reward details available.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Prize Modal */}
        {showAddPrize && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 rounded-xl p-6 w-full max-w-lg">
              <h3 className="text-xl font-medium text-white mb-6">Add New Prize</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-white font-medium mb-2">Prize Name</label>
                  <input
                    type="text"
                    value={newPrize.name}
                    onChange={(e) => setNewPrize(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/50"
                    placeholder="Enter prize name"
                  />
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">Description</label>
                  <textarea
                    value={newPrize.description}
                    onChange={(e) => setNewPrize(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/50"
                    placeholder="Describe the prize"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white font-medium mb-2">Points Cost</label>
                    <input
                      type="number"
                      value={newPrize.pointsCost}
                      onChange={(e) => setNewPrize(prev => ({ ...prev, pointsCost: parseInt(e.target.value) || 100 }))}
                      className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:border-white/50"
                    />
                  </div>
                  <div>
                    <label className="block text-white font-medium mb-2">Max Claims (0 = unlimited)</label>
                    <input
                      type="number"
                      value={newPrize.maxClaims}
                      onChange={(e) => setNewPrize(prev => ({ ...prev, maxClaims: parseInt(e.target.value) || 0 }))}
                      className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:border-white/50"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-6">
                  <button
                    type="button"
                    onClick={() => setShowAddPrize(false)}
                    className="px-6 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreatePrize}
                    disabled={!newPrize.name || !newPrize.description || newPrize.pointsCost <= 0}
                    className="px-6 py-2 bg-white text-black rounded-lg hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add Prize
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </BusinessGradientBackground>
  )
}