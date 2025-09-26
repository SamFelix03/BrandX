"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { REWARD_TYPES, DEFAULT_VALUES, VALIDATION, REWARD_TEMPLATES, WEB2_REWARD_TEMPLATES } from '@/lib/constants'

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
}

export default function BountyManagementForm({ business, walletAddress }: BountyManagementFormProps) {
  const router = useRouter()
  const [bounties, setBounties] = useState<Bounty[]>([])
  const [prizes, setPrizes] = useState<Prize[]>([])
  const [loading, setLoading] = useState(true)
  const [deploying, setDeploying] = useState(false)
  const [activeTab, setActiveTab] = useState<'bounties' | 'prizes'>('bounties')
  const [editingBounty, setEditingBounty] = useState<Bounty | null>(null)
  const [editingPrize, setEditingPrize] = useState<Prize | null>(null)
  const [showAddBounty, setShowAddBounty] = useState(false)
  const [showAddPrize, setShowAddPrize] = useState(false)

  // Load AI suggestions
  useEffect(() => {
    loadAISuggestions()
  }, [])

  const loadAISuggestions = async () => {
    try {
      const response = await fetch('/api/ai/suggest-bounties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessData: business })
      })

      const result = await response.json()
      
      if (result.success) {
        // AI bounties come without reward data - business owner will select rewards
        // Give them unique IDs so they can be edited properly
        setBounties(result.suggestedBounties.map((bounty: any, index: number) => ({
          ...bounty,
          id: Date.now() + index, // Assign unique ID to prevent duplicates when editing
          rewardData: undefined // Ensure no reward data from AI
        })))
        // Add some default prizes with IDs
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
    } catch (error) {
      console.error('Failed to load AI suggestions:', error)
    } finally {
      setLoading(false)
    }
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
    setEditingBounty(newBounty)
    setShowAddBounty(true)
  }

  const handleAddPrize = () => {
    const newPrize = createNewPrize()
    setEditingPrize(newPrize)
    setShowAddPrize(true)
  }

  const saveBounty = (bounty: Bounty) => {
    if (bounty.id) {
      setBounties(prev => prev.map(b => b.id === bounty.id ? bounty : b))
    } else {
      setBounties(prev => [...prev, { ...bounty, id: Date.now() }])
    }
    setEditingBounty(null)
    setShowAddBounty(false)
  }

  const savePrize = (prize: Prize) => {
    if (prize.id) {
      setPrizes(prev => prev.map(p => p.id === prize.id ? prize : p))
    } else {
      setPrizes(prev => [...prev, { ...prize, id: Date.now() }])
    }
    setEditingPrize(null)
    setShowAddPrize(false)
  }

  const deleteBounty = (id: number) => {
    setBounties(prev => prev.filter(b => b.id !== id))
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

      // Step 2: Add bounties with embedded reward data
      for (const bounty of bounties) {
        if (!bounty.rewardData) continue

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
              className="px-4 py-2 bg-white text-black rounded-lg font-medium hover:bg-white/90 transition-colors"
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
                  onEdit={() => setEditingBounty(bounty)}
                  onDelete={() => bounty.id && deleteBounty(bounty.id)}
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
              className="px-4 py-2 bg-white text-black rounded-lg font-medium hover:bg-white/90 transition-colors"
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
                  onEdit={() => setEditingPrize(prize)}
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
          className="px-8 py-4 bg-white hover:bg-white-700 disabled:bg-white-600/50 text-black rounded-lg font-medium text-lg transition-colors disabled:cursor-not-allowed"
        >
          {deploying ? 'Deploying Smart Contract...' : 'Deploy Business Contract'}
        </button>
        <p className="text-white/50 text-sm mt-2">
          This will deploy your business smart contract with all bounties, rewards, and prizes
        </p>
      </div>

      {/* Edit Modals */}
      {editingBounty && (
        <BountyEditModal
          bounty={editingBounty}
          business={business}
          onSave={saveBounty}
          onCancel={() => {
            setEditingBounty(null)
            setShowAddBounty(false)
          }}
        />
      )}

      {editingPrize && (
        <PrizeEditModal
          prize={editingPrize}
          onSave={savePrize}
          onCancel={() => {
            setEditingPrize(null)
            setShowAddPrize(false)
          }}
        />
      )}
    </div>
  )
}

// Bounty Card Component
function BountyCard({ 
  bounty, 
  onEdit, 
  onDelete 
}: { 
  bounty: Bounty
  onEdit: () => void
  onDelete: () => void 
}) {
  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
      {bounty.suggested && (
        <div className="inline-flex items-center px-2 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-medium mb-3">
          <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
          AI Suggested
        </div>
      )}
      
      <h4 className="text-lg font-medium text-white mb-2">{bounty.title}</h4>
      <p className="text-white/70 text-sm mb-4">{bounty.description}</p>
      
      <div className="space-y-2 mb-4">
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
          <div className="text-yellow-400 text-sm">⚠️ No reward selected</div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={onEdit}
          className="px-3 py-1 bg-white/10 text-white rounded text-sm hover:bg-white/20 transition-colors"
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
          className="px-3 py-1 bg-white/10 text-white rounded text-sm hover:bg-white/20 transition-colors"
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
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
              className="px-6 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-white text-black rounded-lg hover:bg-white/90 transition-colors"
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-xl p-6 w-full max-w-lg">
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
              className="px-6 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-white text-black rounded-lg hover:bg-white/90 transition-colors"
            >
              Save Prize
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}