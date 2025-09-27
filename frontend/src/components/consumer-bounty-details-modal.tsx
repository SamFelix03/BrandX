"use client"

import { useState, useEffect } from 'react'

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
  parsedVoucher?: any
}

interface ConsumerBountyDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  bounty: ContractBounty | null
  contractAddress?: string
  onStartCompletion: (bounty: ContractBounty) => void
}

export default function ConsumerBountyDetailsModal({
  isOpen,
  onClose,
  bounty,
  contractAddress,
  onStartCompletion
}: ConsumerBountyDetailsModalProps) {
  const [selectedReward, setSelectedReward] = useState<RewardTemplate | null>(null)
  const [loadingReward, setLoadingReward] = useState(false)

  const parseJSONSafely = (value: string | undefined | null) => {
    if (!value) return null
    try {
      return JSON.parse(value)
    } catch {
      return null
    }
  }

  useEffect(() => {
    if (isOpen && bounty && contractAddress && bounty.rewardTemplateId) {
      fetchRewardDetails()
    }
  }, [isOpen, bounty, contractAddress])

  const fetchRewardDetails = async () => {
    if (!bounty || !contractAddress || !bounty.rewardTemplateId) return
    
    try {
      setLoadingReward(true)
      const res = await fetch(`/api/contract/reward-templates?contractAddress=${contractAddress}`)
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
    } catch (error) {
      console.error('Failed to fetch reward details:', error)
    } finally {
      setLoadingReward(false)
    }
  }

  if (!isOpen || !bounty) return null

  const expiryText = bounty.expiry === '0' ? 'Never' : new Date(Number(bounty.expiry) * 1000).toLocaleDateString()

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white/20 backdrop-blur-md rounded-xl border border-white/30 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h3 className="text-2xl font-medium text-white">Bounty Details</h3>
          <button
            onClick={() => {
              onClose()
              setSelectedReward(null)
            }}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Main Bounty Information */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-start justify-between mb-4">
              <div className="flex flex-wrap gap-2">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  bounty.isActive 
                    ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                    : 'bg-red-500/20 text-red-300 border border-red-500/30'
                }`}>
                  {bounty.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              {bounty.isActive && (
                <button
                  onClick={() => {
                    onStartCompletion(bounty)
                    onClose()
                  }}
                  className="px-6 py-2 bg-white text-black rounded-lg hover:bg-white/90 transition-colors font-medium"
                >
                  Complete Bounty
                </button>
              )}
            </div>
            
            <h4 className="text-xl font-medium text-white mb-3">{bounty.title}</h4>
            <p className="text-white/80 text-sm mb-6 leading-relaxed">{bounty.description}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60">Expires:</span>
                  <span className="text-white">{expiryText}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60">Max Completions:</span>
                  <span className="text-white">{bounty.maxCompletions === '0' ? 'Unlimited' : bounty.maxCompletions}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60">Current Completions:</span>
                  <span className="text-white">{bounty.currentCompletions}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60">Bounty ID:</span>
                  <span className="text-white font-mono text-xs">{bounty.id}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Associated Reward */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h4 className="text-lg font-medium text-white mb-4 flex items-center">
              <span className="w-2 h-2 bg-purple-400 rounded-full mr-3"></span>
              Reward Details
            </h4>
            {loadingReward ? (
              <div className="flex items-center gap-3 text-white/70">
                <div className="animate-spin rounded-full h-4 w-4 border border-gray-400 border-t-transparent"></div>
                <span>Loading reward details...</span>
              </div>
            ) : selectedReward ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/60">Reward Name:</span>
                      <span className="text-white font-medium">{selectedReward.name}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/60">Type:</span>
                      <span className="text-white capitalize">{selectedReward.rewardType.replace('_', ' ')}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/60">Points Value:</span>
                      <span className="text-white font-bold text-lg text-green-400">+{selectedReward.pointsValue}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/60">Template ID:</span>
                      <span className="text-white font-mono text-xs">#{bounty.rewardTemplateId}</span>
                    </div>
                  </div>
                </div>

                {selectedReward.description && (
                  <div className="bg-white/10 border border-white/20 rounded-lg p-4">
                    <div className="text-white/60 text-sm mb-2">Description</div>
                    <div className="text-white/90 text-sm leading-relaxed">{selectedReward.description}</div>
                  </div>
                )}

                {selectedReward.parsedVoucher && (
                  <div className="bg-white/10 border border-white/20 rounded-lg p-4">
                    <div className="text-white/60 text-sm mb-3">Voucher Details</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {'discountPercentage' in selectedReward.parsedVoucher && (
                        <div>
                          <div className="text-white/60 text-xs mb-2">Discount</div>
                          <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-500/20 text-green-300 border border-green-500/30 text-sm font-medium">
                            {selectedReward.parsedVoucher.discountPercentage}% off
                          </div>
                        </div>
                      )}
                      {'validFor' in selectedReward.parsedVoucher && (
                        <div>
                          <div className="text-white/60 text-xs mb-2">Valid For</div>
                          <div className="text-white text-sm">{selectedReward.parsedVoucher.validFor}</div>
                        </div>
                      )}
                      {'terms' in selectedReward.parsedVoucher && (
                        <div className="md:col-span-2">
                          <div className="text-white/60 text-xs mb-2">Terms & Conditions</div>
                          <div className="text-white/90 bg-white/5 border border-white/10 rounded-lg p-3 text-sm leading-relaxed">
                            {selectedReward.parsedVoucher.terms}
                          </div>
                        </div>
                      )}
                      {'excludes' in selectedReward.parsedVoucher && Array.isArray(selectedReward.parsedVoucher.excludes) && selectedReward.parsedVoucher.excludes.length > 0 && (
                        <div className="md:col-span-2">
                          <div className="text-white/60 text-xs mb-2">Exclusions</div>
                          <div className="flex flex-wrap gap-2">
                            {selectedReward.parsedVoucher.excludes.map((item: string, idx: number) => (
                              <span key={idx} className="px-2 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 text-xs">
                                {item}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedReward.tokenAddress && selectedReward.tokenAddress !== '0x0000000000000000000000000000000000000000' && (
                  <div className="bg-white/10 border border-white/20 rounded-lg p-4">
                    <div className="text-white/60 text-sm mb-3">Token Airdrop Details</div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/60">Token Address:</span>
                        <span className="text-white font-mono text-xs">{selectedReward.tokenAddress}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/60">Token Amount:</span>
                        <span className="text-white font-medium">{selectedReward.tokenAmount}</span>
                      </div>
                    </div>
                  </div>
                )}

                {selectedReward.validityPeriod > 0 && (
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-blue-300 text-sm font-medium">Validity Period</span>
                    </div>
                    <p className="text-blue-200 text-sm">
                      This reward is valid for {selectedReward.validityPeriod} days after claiming.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-white/50">
                <div className="mb-4">
                  <svg className="w-12 h-12 mx-auto text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                  </svg>
                </div>
                <p>No reward details available for this bounty.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}