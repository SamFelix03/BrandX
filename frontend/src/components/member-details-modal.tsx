"use client"

import { useState, useEffect } from 'react'

interface ContractMember {
  address: string
  ensName: string
  totalPoints: string
  completedBounties: number
  ownedVouchers: number
  claimedPrizes: number
  joinedAt: string
}

interface MemberDetailData {
  completedBounties?: Array<{
    id: string
    title?: string
    description?: string
    pointsEarned?: number
    completedAt?: number
  }>
  ownedVouchers?: Array<{
    tokenId: string
    name?: string
    description?: string
    claimed: boolean
    rewardTemplateId?: string
  }>
  claimedPrizes?: Array<{
    id: string
    name?: string
    description?: string
    pointsCost?: number
    claimedAt?: number
  }>
  recentActivity?: Array<{
    type: 'bounty_completed' | 'prize_claimed' | 'voucher_minted' | 'member_joined'
    description: string
    timestamp: number
    points?: number
  }>
}

interface MemberDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  member: ContractMember | null
  contractAddress?: string
}

type TabType = 'overview' | 'bounties' | 'vouchers' | 'prizes' | 'activity'

export default function MemberDetailsModal({ 
  isOpen, 
  onClose, 
  member, 
  contractAddress 
}: MemberDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [loading, setLoading] = useState(false)
  const [detailData, setDetailData] = useState<MemberDetailData | null>(null)

  useEffect(() => {
    if (isOpen && member && contractAddress) {
      fetchMemberDetails()
    }
  }, [isOpen, member, contractAddress])

  const fetchMemberDetails = async () => {
    if (!member || !contractAddress) return
    
    try {
      setLoading(true)
      const response = await fetch(`/api/contract/member-details?contractAddress=${contractAddress}&memberAddress=${member.address}`)
      if (response.ok) {
        const data = await response.json()
        setDetailData(data)
      }
    } catch (error) {
      console.error('Failed to fetch member details:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !member) return null

  const memberName = member.ensName || `${member.address.slice(0, 6)}...${member.address.slice(-4)}`
  const totalPoints = parseInt(member.totalPoints)
  const joinedDate = new Date(Number(member.joinedAt) * 1000)
  const daysSinceJoined = Math.floor((Date.now() - joinedDate.getTime()) / (1000 * 60 * 60 * 24))

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '👤' },
    { id: 'bounties', label: 'Bounties', icon: '🎯' },
    { id: 'vouchers', label: 'Vouchers', icon: '🎫' },
    { id: 'prizes', label: 'Prizes', icon: '🏆' },
    { id: 'activity', label: 'Activity', icon: '📊' }
  ] as const

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-medium text-lg overflow-hidden">
              <img
                src="/capped-thug.png"
                alt="Member avatar"
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            <div>
              <h3 className="text-2xl font-medium text-white">{memberName}</h3>
              <p className="text-white/60 text-sm">{member.address}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 px-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium transition-colors relative flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'text-white border-b-2 border-white'
                  : 'text-white/60 hover:text-white/80'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              <span className="ml-3 text-white/70">Loading member details...</span>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Information */}
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                    <h4 className="text-lg font-medium text-white mb-4 flex items-center">
                      <span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>
                      Basic Information
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/60">ENS Name:</span>
                        <span className="text-white font-medium">{member.ensName || 'Not set'}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/60">Wallet Address:</span>
                        <span className="text-white font-medium text-xs">{member.address}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/60">Joined Date:</span>
                        <span className="text-white">{joinedDate.toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/60">Member For:</span>
                        <span className="text-white">{daysSinceJoined} days</span>
                      </div>
                    </div>
                  </div>

                  {/* Statistics */}
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                    <h4 className="text-lg font-medium text-white mb-4 flex items-center">
                      <span className="w-2 h-2 bg-green-400 rounded-full mr-3"></span>
                      Statistics
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/60">Total Points:</span>
                        <span className="text-white font-bold text-lg">{totalPoints.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/60">Completed Bounties:</span>
                        <span className="text-white font-medium">{member.completedBounties}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/60">Owned Vouchers:</span>
                        <span className="text-white font-medium">{member.ownedVouchers}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/60">Claimed Prizes:</span>
                        <span className="text-white font-medium">{member.claimedPrizes}</span>
                      </div>
                    </div>
                  </div>

                  {/* Member Status */}
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 md:col-span-2">
                    <h4 className="text-lg font-medium text-white mb-4 flex items-center">
                      <span className="w-2 h-2 bg-purple-400 rounded-full mr-3"></span>
                      Member Status
                    </h4>
                    <div className="flex flex-wrap gap-3">
                      <div className="px-3 py-2 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30 text-sm">
                        Active Member
                      </div>
                      {totalPoints >= 1000 && (
                        <div className="px-3 py-2 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 text-sm">
                          High Value Customer
                        </div>
                      )}
                      {member.completedBounties >= 5 && (
                        <div className="px-3 py-2 rounded-lg bg-green-500/20 text-green-300 border border-green-500/30 text-sm">
                          Engaged Member
                        </div>
                      )}
                      {daysSinceJoined <= 7 && (
                        <div className="px-3 py-2 rounded-lg bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 text-sm">
                          New Member
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'bounties' && (
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                  <h4 className="text-lg font-medium text-white mb-4 flex items-center">
                    <span className="w-2 h-2 bg-purple-400 rounded-full mr-3"></span>
                    Completed Bounties ({member.completedBounties})
                  </h4>
                  {detailData?.completedBounties && detailData.completedBounties.length > 0 ? (
                    <div className="space-y-3">
                      {detailData.completedBounties.map((bounty, index) => (
                        <div key={index} className="bg-white/5 border border-white/10 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="text-white font-medium">{bounty.title || `Bounty #${bounty.id}`}</h5>
                            <div className="flex items-center gap-3">
                              {bounty.pointsEarned && (
                                <span className="text-green-400 font-medium text-sm">+{bounty.pointsEarned} pts</span>
                              )}
                              {bounty.completedAt && (
                                <span className="text-xs text-white/60">
                                  {new Date(bounty.completedAt * 1000).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                          {bounty.description && (
                            <p className="text-white/70 text-sm">{bounty.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-white/50">
                      <p>No bounty completion details available.</p>
                      <p className="text-xs mt-2">This member has completed {member.completedBounties} bounties.</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'vouchers' && (
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                  <h4 className="text-lg font-medium text-white mb-4 flex items-center">
                    <span className="w-2 h-2 bg-yellow-400 rounded-full mr-3"></span>
                    Owned Vouchers ({member.ownedVouchers})
                  </h4>
                  {detailData?.ownedVouchers && detailData.ownedVouchers.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {detailData.ownedVouchers.map((voucher, index) => (
                        <div key={index} className="bg-white/5 border border-white/10 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="text-white font-medium">{voucher.name || `Voucher #${voucher.tokenId}`}</h5>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              voucher.claimed
                                ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                                : 'bg-green-500/20 text-green-300 border border-green-500/30'
                            }`}>
                              {voucher.claimed ? 'Used' : 'Available'}
                            </span>
                          </div>
                          {voucher.description && (
                            <p className="text-white/70 text-sm mb-2">{voucher.description}</p>
                          )}
                          <div className="text-xs text-white/60">
                            Token ID: {voucher.tokenId}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-white/50">
                      <p>No voucher details available.</p>
                      <p className="text-xs mt-2">This member owns {member.ownedVouchers} vouchers.</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'prizes' && (
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                  <h4 className="text-lg font-medium text-white mb-4 flex items-center">
                    <span className="w-2 h-2 bg-orange-400 rounded-full mr-3"></span>
                    Claimed Prizes ({member.claimedPrizes})
                  </h4>
                  {detailData?.claimedPrizes && detailData.claimedPrizes.length > 0 ? (
                    <div className="space-y-3">
                      {detailData.claimedPrizes.map((prize, index) => (
                        <div key={index} className="bg-white/5 border border-white/10 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="text-white font-medium">{prize.name || `Prize #${prize.id}`}</h5>
                            <div className="flex items-center gap-3">
                              {prize.pointsCost && (
                                <span className="text-red-400 font-medium text-sm">-{prize.pointsCost} pts</span>
                              )}
                              {prize.claimedAt && (
                                <span className="text-xs text-white/60">
                                  {new Date(prize.claimedAt * 1000).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                          {prize.description && (
                            <p className="text-white/70 text-sm">{prize.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-white/50">
                      <p>No prize claim details available.</p>
                      <p className="text-xs mt-2">This member has claimed {member.claimedPrizes} prizes.</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'activity' && (
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                  <h4 className="text-lg font-medium text-white mb-4 flex items-center">
                    <span className="w-2 h-2 bg-cyan-400 rounded-full mr-3"></span>
                    Recent Activity
                  </h4>
                  {detailData?.recentActivity && detailData.recentActivity.length > 0 ? (
                    <div className="space-y-3">
                      {detailData.recentActivity.map((activity, index) => (
                        <div key={index} className="bg-white/5 border border-white/10 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              activity.type === 'bounty_completed'
                                ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                                : activity.type === 'prize_claimed'
                                ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                                : activity.type === 'voucher_minted'
                                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                : 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                            }`}>
                              {activity.type.replace('_', ' ').toUpperCase()}
                            </span>
                            <span className="text-xs text-white/60">
                              {new Date(activity.timestamp * 1000).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-white/70 text-sm">{activity.description}</p>
                          {activity.points && (
                            <div className="mt-2 text-sm">
                              <span className="text-white/60">Points: </span>
                              <span className={activity.points > 0 ? 'text-green-400' : 'text-red-400'}>
                                {activity.points > 0 ? '+' : ''}{activity.points}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-white/50">
                      <div className="mb-4">
                        <svg className="w-12 h-12 mx-auto text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <p>No recent activity data available.</p>
                      <p className="text-xs mt-2">Activity tracking might not be implemented yet.</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}