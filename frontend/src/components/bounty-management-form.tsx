"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { REWARD_TYPES, DEFAULT_VALUES, VALIDATION, REWARD_TEMPLATES, WEB2_REWARD_TEMPLATES } from '@/lib/constants'
import { BountyWithImpacts, MetricImpacts } from '@/types/bounty-with-impacts'

interface Business {
  id: string
  business_name: string
  description?: string
  location?: string
  website?: string
  ens_domain?: string
  is_token_issuer?: boolean
}

interface RewardData {
  name: string
  description: string
  rewardType: keyof typeof REWARD_TYPES
  pointsValue: number
  voucherMetadata: string
  validityPeriod: number
  tokenAddress: string
  tokenAmount: number
  nftMetadata: string
}

interface Bounty {
  id?: number
  title: string
  description: string
  rewardData?: RewardData
  expiry: number
  maxCompletions: number
  suggested?: boolean
  category?: string
  difficulty?: string
  estimatedReward?: number | string
  targetAudience?: string
  // New fields for metric impacts
  successMetrics?: string[]
  metricImpacts?: { [key: string]: number }
  impactUsers?: number
}

interface Prize {
  id?: number
  name: string
  description: string
  pointsCost: number
  maxClaims: number
  metadata: string
}

interface BountyManagementFormProps {
  business: Business
  walletAddress: string
  showAnalysisModal: boolean
  setShowAnalysisModal: (show: boolean) => void
  editingBounty: boolean
  setEditingBounty: (editing: boolean) => void
  editingPrize: boolean
  setEditingPrize: (editing: boolean) => void
  selectedBountyIndices: Set<number>
  setSelectedBountyIndices: (indices: Set<number>) => void
}

export default function BountyManagementForm({ 
  business, 
  walletAddress, 
  showAnalysisModal, 
  setShowAnalysisModal,
  editingBounty,
  setEditingBounty,
  editingPrize,
  setEditingPrize,
  selectedBountyIndices,
  setSelectedBountyIndices
}: BountyManagementFormProps) {
  const router = useRouter()
  const [bounties, setBounties] = useState<Bounty[]>([])
  const [prizes, setPrizes] = useState<Prize[]>([])
  const [loading, setLoading] = useState(true)
  const [deploying, setDeploying] = useState(false)
  const [activeTab, setActiveTab] = useState<'bounties' | 'prizes'>('bounties')
  const [currentBounty, setCurrentBounty] = useState<Bounty | null>(null)
  const [currentPrize, setCurrentPrize] = useState<Prize | null>(null)
  const [showAddBounty, setShowAddBounty] = useState(false)
  const [showAddPrize, setShowAddPrize] = useState(false)
  const [analysisData, setAnalysisData] = useState<any>(null)
  
  // Load existing analysis or fallback bounties
  useEffect(() => {
    loadExistingAnalysis()
  }, [])

  const loadExistingAnalysis = async () => {
    try {
      // Check if we have existing analysis
      const existingResponse = await fetch(`/api/brand-analysis?businessId=${business.id}&walletAddress=${walletAddress}`)
      const existingResult = await existingResponse.json()
      
      if (existingResult.success && existingResult.analysis) {
        // We have existing analysis, use it
        setAnalysisData(existingResult.analysis)
        loadBountiesFromAnalysis(existingResult.analysis)
      } else {
        // No existing analysis, load fallback bounties
        loadFallbackBounties()
      }
    } catch (error) {
      console.error('Failed to load existing analysis:', error)
      loadFallbackBounties()
    }
  }

  const loadBountiesFromAnalysis = (analysisData: any) => {
    try {
      let bountiesToLoad: BountyWithImpacts[] = []

      // Handle new format: bounty_suggestions.bounties array
      if (analysisData.bounty_suggestions?.bounties && Array.isArray(analysisData.bounty_suggestions.bounties)) {
        bountiesToLoad = analysisData.bounty_suggestions.bounties
        console.log('Using new format with bounties array and metric impacts')
      }
      // Fallback to old format for backwards compatibility
      else if (analysisData.bounty_suggestions && Array.isArray(analysisData.bounty_suggestions)) {
        bountiesToLoad = analysisData.bounty_suggestions
        console.log('Using legacy format bounties array')
      }

      if (bountiesToLoad.length > 0) {
        const aiBounties = bountiesToLoad.map((bounty: BountyWithImpacts, index: number) => ({
          id: Date.now() + index,
          title: bounty.title,
          description: bounty.description,
          expiry: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days default
          maxCompletions: 100, // Default value
          rewardData: undefined, // Business owner will select rewards
          suggested: true,
          category: bounty.category,
          difficulty: bounty.difficulty,
          estimatedReward: bounty.estimated_reward,
          targetAudience: bounty.target_audience,
          // Keep the new fields for impact calculation
          successMetrics: bounty.success_metrics,
          metricImpacts: bounty.metric_impacts,
          impactUsers: bounty.impact_users
        }))
        
        console.log(`Loaded ${aiBounties.length} AI-generated bounties for ${analysisData.brand_name}`)
        setBounties(aiBounties)
        
        // Set all bounties as selected by default
        const allIndices = new Set(Array.from({ length: aiBounties.length }, (_, i) => i))
        setSelectedBountyIndices(allIndices)
        console.log(`Selected all ${aiBounties.length} bounties by default`)
      } else {
        console.log('No bounties found in analysis data, loading fallback bounties')
        loadFallbackBounties()
      }
    } catch (error) {
      console.error('Failed to parse bounty data:', error)
      loadFallbackBounties()
    }
    
    loadDefaultPrizes()
    setLoading(false)
  }

  const loadFallbackBounties = () => {
    // Fallback bounties if AI analysis fails or doesn't exist
    setBounties([
      {
        id: Date.now() + 1,
        title: "Share Your Experience",
        description: `Post about your experience at ${business.business_name} on social media and tag us. Help spread the word about our awesome service!`,
        expiry: Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60),
        maxCompletions: 0,
        rewardData: undefined,
        suggested: true,
        category: 'social_media',
        difficulty: 'easy',
        estimatedReward: 50,
        targetAudience: 'all'
      },
      {
        id: Date.now() + 2,
        title: "Refer a Friend",
        description: `Bring a friend to ${business.business_name}! When your referred friend makes their first purchase, you both get rewarded.`,
        expiry: 0,
        maxCompletions: 10,
        rewardData: undefined,
        suggested: true,
        category: 'referral',
        difficulty: 'medium',
        estimatedReward: 75,
        targetAudience: 'existing_customers'
      },
      {
        id: Date.now() + 3,
        title: "Write a Review",
        description: `Share your honest feedback about ${business.business_name}. Your review helps other customers and helps us improve!`,
        expiry: Math.floor(Date.now() / 1000) + (60 * 24 * 60 * 60),
        maxCompletions: 1,
        rewardData: undefined,
        suggested: true,
        category: 'review',
        difficulty: 'easy',
        estimatedReward: 25,
        targetAudience: 'customers'
      }
    ])
    
    // Set all fallback bounties as selected by default
    const allIndices = new Set([0, 1, 2]) // 3 fallback bounties
    setSelectedBountyIndices(allIndices)
    
    loadDefaultPrizes()
    setLoading(false)
  }

  const loadDefaultPrizes = () => {
    setPrizes([
      {
        id: Date.now() + 1000,
        name: "Free Coffee",
        description: "Redeem for a complimentary coffee of your choice",
        pointsCost: 100,
        maxClaims: 0,
        metadata: JSON.stringify({ category: "beverage", restrictions: "one per day" })
      },
      {
        id: Date.now() + 1001,
        name: "VIP Status",
        description: "Get VIP treatment and skip the line for a month",
        pointsCost: 500,
        maxClaims: 10,
        metadata: JSON.stringify({ category: "experience", duration: "30 days" })
      }
    ])
  }

  const createNewBounty = (): Bounty => ({
    title: "",
    description: "",
    rewardData: undefined,
    expiry: DEFAULT_VALUES.BOUNTY.expiry,
    maxCompletions: DEFAULT_VALUES.BOUNTY.maxCompletions
  })

  const createNewPrize = (): Prize => ({
    name: "",
    description: "",
    pointsCost: DEFAULT_VALUES.PRIZE.pointsCost,
    maxClaims: DEFAULT_VALUES.PRIZE.maxClaims,
    metadata: ""
  })

  const handleAddBounty = () => {
    const newBounty = createNewBounty()
    setCurrentBounty(newBounty)
    setShowAddBounty(true)
    setEditingBounty(true)
  }

  const handleAddPrize = () => {
    const newPrize = createNewPrize()
    setCurrentPrize(newPrize)
    setShowAddPrize(true)
    setEditingPrize(true)
  }

  const saveBounty = (bounty: Bounty) => {
    if (bounty.id) {
      setBounties(prev => prev.map(b => b.id === bounty.id ? bounty : b))
    } else {
      setBounties(prev => [...prev, { ...bounty, id: Date.now() }])
    }
    setCurrentBounty(null)
    setShowAddBounty(false)
    setEditingBounty(false)
  }

  const savePrize = (prize: Prize) => {
    if (prize.id) {
      setPrizes(prev => prev.map(p => p.id === prize.id ? prize : p))
    } else {
      setPrizes(prev => [...prev, { ...prize, id: Date.now() }])
    }
    setCurrentPrize(null)
    setShowAddPrize(false)
    setEditingPrize(false)
  }


  const deletePrize = (id: number) => {
    setPrizes(prev => prev.filter(p => p.id !== id))
  }

  const deployContract = async () => {
    setDeploying(true)
    try {
      // Step 1: Deploy business contract
      const deployResponse = await fetch('/api/deploy-business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business,
          walletAddress
        })
      })

      const deployResult = await deployResponse.json()
      
      if (!deployResult.success) {
        alert('Contract deployment failed: ' + deployResult.error)
        return
      }

      const contractAddress = deployResult.contractAddress

      // Step 2: Add bounties with embedded reward data (only selected ones)
      for (let i = 0; i < bounties.length; i++) {
        const bounty = bounties[i]
        
        // Only deploy bounties that are selected AND have reward data
        if (!selectedBountyIndices.has(i) || !bounty.rewardData) continue

        const bountyResponse = await fetch('/api/add-bounty', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contractAddress,
            bounty: {
              title: bounty.title,
              description: bounty.description,
              expiry: bounty.expiry,
              maxCompletions: bounty.maxCompletions,
              category: bounty.category || 'general',
              difficulty: bounty.difficulty || 'medium',
              estimatedReward: bounty.estimatedReward || 0,
              targetAudience: bounty.targetAudience || 'all',
              rewardData: bounty.rewardData
            },
            walletAddress
          })
        })

        const bountyResult = await bountyResponse.json()
        if (!bountyResult.success) {
          console.error('Failed to add bounty:', bounty.title, bountyResult.error)
          // Continue with other bounties instead of failing completely
        }
      }

      // Step 3: Add prizes
      for (const prize of prizes) {
        const prizeResponse = await fetch('/api/add-prize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contractAddress,
            prize: {
              name: prize.name,
              description: prize.description,
              pointsCost: prize.pointsCost,
              maxClaims: prize.maxClaims,
              metadata: prize.metadata || ""
            },
            walletAddress
          })
        })

        const prizeResult = await prizeResponse.json()
        if (!prizeResult.success) {
          console.error('Failed to add prize:', prize.name, prizeResult.error)
          // Continue with other prizes instead of failing completely
        }
      }

      // Success - redirect to dashboard
      router.push('/business-dashboard')
      
    } catch (error) {
      console.error('Deployment error:', error)
      alert('Deployment failed. Please try again.')
    } finally {
      setDeploying(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white/70">Loading AI suggestions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Analysis Link
      <div className="bg-white/5 border border-white/10 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-white font-medium mb-1">BrandX Analysis</h4>
            <p className="text-white/70 text-sm">View comprehensive brand insights and analysis results</p>
          </div>
          <button
            onClick={() => setShowAnalysisModal(true)}
            className="px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 rounded-lg hover:bg-white/20 transition-colors"
            disabled={!analysisData}
          >
            View Analysis
          </button>
        </div>
      </div> */}

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-white/5 backdrop-blur-sm rounded-lg p-1 border border-white/10">
        <button
          onClick={() => setActiveTab('bounties')}
          className={`flex-1 py-2 px-4 rounded-md transition-all duration-200 text-sm font-medium ${
            activeTab === 'bounties' 
              ? 'bg-white text-black' 
              : 'text-white/70 hover:text-white hover:bg-white/10'
          }`}
        >
          Bounties ({bounties.length})
        </button>
        <button
          onClick={() => setActiveTab('prizes')}
          className={`flex-1 py-2 px-4 rounded-md transition-all duration-200 text-sm font-medium ${
            activeTab === 'prizes' 
              ? 'bg-white text-black' 
              : 'text-white/70 hover:text-white hover:bg-white/10'
          }`}
        >
          Prizes ({prizes.length})
        </button>
      </div>

      {/* Bounties Tab */}
      {activeTab === 'bounties' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-medium text-white">Bounties & Rewards</h3>
            <button
              onClick={handleAddBounty}
              className="px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 rounded-lg font-medium hover:bg-white/20 transition-colors"
            >
              Add Custom Bounty
            </button>
          </div>

          {bounties.length === 0 ? (
            <div className="text-center py-8 text-white/50">
              <p>No bounties yet. Add your first bounty to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bounties.map((bounty, index) => (
                <BountyCard
                  key={bounty.id || index}
                  bounty={bounty}
                  index={index}
                  isSelected={selectedBountyIndices.has(index)}
                  onEdit={() => {
                    setCurrentBounty(bounty)
                    setEditingBounty(true)
                  }}
                  onToggleSelect={() => {
                    const newSelected = new Set(selectedBountyIndices)
                    if (newSelected.has(index)) {
                      newSelected.delete(index)
                    } else {
                      newSelected.add(index)
                    }
                    setSelectedBountyIndices(newSelected)
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Prizes Tab */}
      {activeTab === 'prizes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-medium text-white">Point-Based Prizes</h3>
            <button
              onClick={handleAddPrize}
              className="px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 rounded-lg font-medium hover:bg-white/20 transition-colors"
            >
              Add Prize
            </button>
          </div>

          {prizes.length === 0 ? (
            <div className="text-center py-8 text-white/50">
              <p>No prizes yet. Add your first prize to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {prizes.map((prize, index) => (
                <PrizeCard
                  key={prize.id || index}
                  prize={prize}
                  onEdit={() => {
                    setCurrentPrize(prize)
                    setEditingPrize(true)
                  }}
                  onDelete={() => prize.id && deletePrize(prize.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Deploy Button */}
      <div className="text-center pt-8">
        <button
          onClick={deployContract}
          disabled={deploying || (bounties.length === 0 && prizes.length === 0)}
          className="px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 rounded-lg font-medium text-lg hover:bg-white/20 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          {deploying ? 'Deploying Smart Contract...' : 'Deploy Business Contract'}
        </button>
        <p className="text-white/50 text-sm mt-2">
          This will deploy your business smart contract with all bounties, rewards, and prizes
        </p>
      </div>

      {/* Edit Modals */}
      {currentBounty && (
        <BountyEditModal
          bounty={currentBounty}
          business={business}
          onSave={saveBounty}
          onCancel={() => {
            setCurrentBounty(null)
            setShowAddBounty(false)
            setEditingBounty(false)
          }}
        />
      )}

      {currentPrize && (
        <PrizeEditModal
          prize={currentPrize}
          onSave={savePrize}
          onCancel={() => {
            setCurrentPrize(null)
            setShowAddPrize(false)
            setEditingPrize(false)
          }}
        />
      )}

      {showAnalysisModal && analysisData && (
        <AnalysisModal
          analysisData={analysisData}
          onClose={() => setShowAnalysisModal(false)}
        />
      )}
    </div>
  )
}

// Bounty Card Component
function BountyCard({ 
  bounty, 
  index,
  isSelected,
  onEdit, 
  onToggleSelect
}: { 
  bounty: Bounty
  index: number
  isSelected: boolean
  onEdit: () => void
  onToggleSelect: () => void
}) {
  return (
    <div 
      className={`backdrop-blur-sm rounded-xl p-6 border transition-all cursor-pointer hover:scale-[1.02] ${
        isSelected 
          ? 'bg-green-500/10 border-green-500/30' 
          : 'bg-white/5 border-white/10 hover:bg-white/10'
      }`}
      onClick={onToggleSelect}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div 
            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
              isSelected 
                ? 'bg-green-500 border-green-500' 
                : 'border-white/30'
            }`}
          >
            {isSelected && (
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {bounty.category && (
              <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full">
                {bounty.category}
              </span>
            )}
            {bounty.difficulty && (
              <span className={`px-2 py-1 text-xs rounded-full ${
                bounty.difficulty === 'Easy' ? 'bg-green-500/20 text-green-300' :
                bounty.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-300' :
                bounty.difficulty === 'Hard' ? 'bg-red-500/20 text-red-300' :
                'bg-gray-500/20 text-gray-300'
              }`}>
                {bounty.difficulty}
              </span>
            )}
          </div>
        </div>
      </div>
      
      <h4 className="text-lg font-medium text-white mb-2">{bounty.title}</h4>
      <p className="text-white/70 text-sm mb-4 line-clamp-3">{bounty.description}</p>
      
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-white/60">Expires:</span>
          <span className="text-white">{bounty.expiry === 0 ? 'Never' : new Date(bounty.expiry * 1000).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-white/60">Max Completions:</span>
          <span className="text-white">{bounty.maxCompletions === 0 ? 'Unlimited' : bounty.maxCompletions}</span>
        </div>
        {bounty.estimatedReward && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/60">Est. Reward:</span>
            <span className="text-white">{bounty.estimatedReward}</span>
          </div>
        )}
        {bounty.targetAudience && (
          <div className="flex items-start justify-between text-sm">
            <span className="text-white/60">Target:</span>
            <span className="text-white text-right max-w-[70%]">{bounty.targetAudience}</span>
          </div>
        )}
        {bounty.rewardData ? (
          <>
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/60">Reward:</span>
              <span className="text-white">{bounty.rewardData.name}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/60">Points:</span>
              <span className="text-white">{bounty.rewardData.pointsValue}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/60">Type:</span>
              <span className="text-white capitalize">{bounty.rewardData.rewardType.replace('_', ' ')}</span>
            </div>
          </>
        ) : (
          <div className="text-white/70 text-sm">⚠️ No reward selected</div>
        )}
      </div>

      <div className="flex items-center justify-center">
        <button
          onClick={(e) => {
            e.stopPropagation() // Prevent card click from triggering
            onEdit()
          }}
          className="px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 rounded-lg text-sm hover:bg-white/20 transition-colors"
        >
          {bounty.suggested ? 'View & Customize' : 'Edit'}
        </button>
      </div>
    </div>
  )
}

// Prize Card Component
function PrizeCard({ 
  prize, 
  onEdit, 
  onDelete 
}: { 
  prize: Prize
  onEdit: () => void
  onDelete: () => void 
}) {
  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
      <h4 className="text-lg font-medium text-white mb-2">{prize.name}</h4>
      <p className="text-white/70 text-sm mb-4">{prize.description}</p>
      
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-white/60">Points Cost:</span>
          <span className="text-white font-medium">{prize.pointsCost}</span>
        </div>
        {prize.maxClaims > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/60">Max Claims:</span>
            <span className="text-white">{prize.maxClaims}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={onEdit}
          className="px-3 py-1 bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 rounded text-sm hover:bg-white/20 transition-colors"
        >
          Edit
        </button>
        <button
          onClick={onDelete}
          className="px-3 py-1 bg-red-500/20 text-red-400 rounded text-sm hover:bg-red-500/30 transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  )
}

// Bounty Edit Modal Component
function BountyEditModal({ 
  bounty, 
  business,
  onSave, 
  onCancel 
}: { 
  bounty: Bounty
  business: Business
  onSave: (bounty: Bounty) => void
  onCancel: () => void 
}) {
  const [formData, setFormData] = useState(bounty)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.title.trim() && formData.description.trim() && formData.rewardData) {
      onSave(formData)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-medium text-white mb-6">
          {bounty.id ? 'Edit Bounty' : 'Add New Bounty'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white font-medium mb-2">Bounty Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/50"
              placeholder="Enter bounty title"
              required
            />
          </div>

          <div>
            <label className="block text-white font-medium mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/50"
              placeholder="Describe what users need to do"
              rows={3}
              required
            />
          </div>

          <div>
            <label className="block text-white font-medium mb-2">Select Reward Template</label>
            {business.is_token_issuer ? (
              <p className="text-blue-400 text-sm mb-2">
                🔹 Web3 enabled: All reward types available (Web2 + Web3)
              </p>
            ) : (
              <p className="text-yellow-400 text-sm mb-2">
                🔸 Web2 only: Vouchers and points available (upgrade to token issuer for Web3 rewards)
              </p>
            )}
            <select
              value={formData.rewardData ? `${formData.rewardData.name}` : ''}
              onChange={(e) => {
                const selectedTemplate = (business.is_token_issuer ? REWARD_TEMPLATES : WEB2_REWARD_TEMPLATES)
                  .find(t => t.name === e.target.value)
                if (selectedTemplate) {
                  setFormData(prev => ({ 
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
                  setFormData(prev => ({ ...prev, rewardData: undefined }))
                }
              }}
              className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:border-white/50"
              required
            >
              <option value="">Choose a reward...</option>
              {(business.is_token_issuer ? REWARD_TEMPLATES : WEB2_REWARD_TEMPLATES).map((template) => (
                <option key={template.id} value={template.name}>
                  {template.name} ({template.pointsValue} pts, {template.rewardType.replace('_', ' ').toLowerCase()})
                </option>
              ))}
            </select>
          </div>

          {formData.rewardData && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <h4 className="text-white font-medium mb-2">Reward Preview</h4>
              <p className="text-white/70 text-sm mb-2">{formData.rewardData.description}</p>
              <div className="text-xs text-white/50 space-y-1">
                <div>Points: {formData.rewardData.pointsValue}</div>
                <div>Type: {formData.rewardData.rewardType.replace('_', ' ').toLowerCase()}</div>
                {formData.rewardData.rewardType === 'WEB2_VOUCHER' && formData.rewardData.voucherMetadata && (
                  <div>Voucher: {JSON.parse(formData.rewardData.voucherMetadata || '{}').discountPercentage || 0}% discount</div>
                )}
                {formData.rewardData.rewardType === 'TOKEN_AIRDROP' && (
                  <div>Token Amount: {formData.rewardData.tokenAmount}</div>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center justify-end space-x-3 pt-6">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 rounded-lg hover:bg-white/20 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 rounded-lg hover:bg-white/20 transition-colors"
            >
              Save Bounty
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Prize Edit Modal Component
function PrizeEditModal({ 
  prize, 
  onSave, 
  onCancel 
}: { 
  prize: Prize
  onSave: (prize: Prize) => void
  onCancel: () => void 
}) {
  const [formData, setFormData] = useState(prize)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.name.trim() && formData.description.trim() && formData.pointsCost > 0) {
      onSave(formData)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 w-full max-w-lg">
        <h3 className="text-xl font-medium text-white mb-6">
          {prize.id ? 'Edit Prize' : 'Add New Prize'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white font-medium mb-2">Prize Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/50"
              placeholder="Enter prize name"
              required
            />
          </div>

          <div>
            <label className="block text-white font-medium mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/50"
              placeholder="Describe the prize"
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-white font-medium mb-2">Points Cost</label>
              <input
                type="number"
                min={VALIDATION.MIN_POINTS}
                value={formData.pointsCost}
                onChange={(e) => setFormData(prev => ({ ...prev, pointsCost: parseInt(e.target.value) || 0 }))}
                className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/50"
                required
              />
            </div>

            <div>
              <label className="block text-white font-medium mb-2">Max Claims (0 = unlimited)</label>
              <input
                type="number"
                min="0"
                value={formData.maxClaims}
                onChange={(e) => setFormData(prev => ({ ...prev, maxClaims: parseInt(e.target.value) || 0 }))}
                className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/50"
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-6">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 rounded-lg hover:bg-white/20 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 rounded-lg hover:bg-white/20 transition-colors"
            >
              Save Prize
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Analysis Modal Component
function AnalysisModal({ 
  analysisData, 
  onClose 
}: { 
  analysisData: any
  onClose: () => void 
}) {
  const formatMarkdownText = (text: string) => {
    if (!text) return ''
    
    // Convert markdown-style formatting to HTML-like JSX
    return text
      .split('\n')
      .map((line, index) => {
        // Handle headers
        if (line.startsWith('### ')) {
          return (
            <h3 key={index} className="text-lg font-semibold text-white mt-4 mb-2">
              {line.replace('### ', '')}
            </h3>
          )
        }
        if (line.startsWith('## ')) {
          return (
            <h2 key={index} className="text-xl font-semibold text-white mt-4 mb-2">
              {line.replace('## ', '')}
            </h2>
          )
        }
        if (line.startsWith('# ')) {
          return (
            <h1 key={index} className="text-2xl font-bold text-white mt-4 mb-2">
              {line.replace('# ', '')}
            </h1>
          )
        }
        
        // Handle bullet points
        if (line.startsWith('- ') || line.startsWith('* ')) {
          return (
            <li key={index} className="text-white/80 ml-4 mb-1">
              {line.replace(/^[-*] /, '')}
            </li>
          )
        }
        
        // Handle bold text **text**
        if (line.includes('**')) {
          const parts = line.split('**')
          return (
            <p key={index} className="text-white/80 mb-2">
              {parts.map((part, i) => 
                i % 2 === 1 ? <strong key={i} className="text-white font-semibold">{part}</strong> : part
              )}
            </p>
          )
        }
        
        // Handle empty lines
        if (line.trim() === '') {
          return <br key={index} />
        }
        
        // Regular paragraphs
        return (
          <p key={index} className="text-white/80 mb-2">
            {line}
          </p>
        )
      })
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-2xl font-semibold text-white">Brand Analysis Results</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="space-y-8">
            
            {/* Web Search Results */}
            {analysisData.web_search_result && (
              <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>
                  Web Analysis
                </h3>
                <div className="prose prose-invert max-w-none">
                  {formatMarkdownText(analysisData.web_search_result)}
                </div>
              </div>
            )}

            {/* Positive Reviews */}
            {analysisData.positive_reviews_result && (
              <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-3"></span>
                  Positive Reviews
                </h3>
                <div className="prose prose-invert max-w-none">
                  {formatMarkdownText(analysisData.positive_reviews_result)}
                </div>
              </div>
            )}

            {/* Negative Reviews */}
            {analysisData.negative_reviews_result && (
              <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <span className="w-2 h-2 bg-red-400 rounded-full mr-3"></span>
                  Negative Reviews
                </h3>
                <div className="prose prose-invert max-w-none">
                  {formatMarkdownText(analysisData.negative_reviews_result)}
                </div>
              </div>
            )}

            {/* Social Media Sentiment */}
            <div className="grid md:grid-cols-2 gap-6">
              {analysisData.positive_social_result && (
                <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <span className="w-2 h-2 bg-green-400 rounded-full mr-3"></span>
                    Positive Social Media
                  </h3>
                  <div className="prose prose-invert max-w-none">
                    {formatMarkdownText(analysisData.positive_social_result)}
                  </div>
                </div>
              )}

              {analysisData.negative_social_result && (
                <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <span className="w-2 h-2 bg-red-400 rounded-full mr-3"></span>
                    Negative Social Media
                  </h3>
                  <div className="prose prose-invert max-w-none">
                    {formatMarkdownText(analysisData.negative_social_result)}
                  </div>
                </div>
              )}
            </div>

            {/* Reddit Sentiment */}
            <div className="grid md:grid-cols-2 gap-6">
              {analysisData.positive_reddit_result && (
                <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <span className="w-2 h-2 bg-green-400 rounded-full mr-3"></span>
                    Positive Reddit Discussion
                  </h3>
                  <div className="prose prose-invert max-w-none">
                    {formatMarkdownText(analysisData.positive_reddit_result)}
                  </div>
                </div>
              )}

              {analysisData.negative_reddit_result && (
                <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <span className="w-2 h-2 bg-red-400 rounded-full mr-3"></span>
                    Negative Reddit Discussion
                  </h3>
                  <div className="prose prose-invert max-w-none">
                    {formatMarkdownText(analysisData.negative_reddit_result)}
                  </div>
                </div>
              )}
            </div>

            {/* Metrics */}
            {analysisData.metrics_result && (
              <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <span className="w-2 h-2 bg-purple-400 rounded-full mr-3"></span>
                  Brand Metrics
                </h3>
                <div className="bg-gray-800 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-white/80 text-sm">
                    {JSON.stringify(analysisData.metrics_result, null, 2)}
                  </pre>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}