"use client"

import { useState, useEffect } from 'react'

interface BrandAnalysisData {
  id: string
  business_id: string
  brand_name: string
  web_search_result: string
  negative_reviews_result: string
  positive_reviews_result: string
  negative_reddit_result: string
  positive_reddit_result: string
  negative_social_result: string
  positive_social_result: string
  metrics_result: any
  bounty_suggestions: any[]
  analysis_timestamp: string
  kg_storage_status: string
  raw_response: any
  created_at: string
  updated_at: string
}

interface BrandAnalysisTabProps {
  businessId: string
  walletAddress?: string
}

export default function BrandAnalysisTab({ businessId, walletAddress }: BrandAnalysisTabProps) {
  const [analysisData, setAnalysisData] = useState<BrandAnalysisData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<'overview' | 'sentiment' | 'metrics' | 'bounties'>('overview')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchAnalysisData()
  }, [businessId, walletAddress])

  const fetchAnalysisData = async () => {
    if (!businessId || !walletAddress) return

    try {
      setLoading(true)
      const response = await fetch(`/api/brand-analysis?businessId=${businessId}&walletAddress=${walletAddress}`)
      const result = await response.json()

      if (result.success && result.analysis) {
        setAnalysisData(result.analysis)
      } else {
        setAnalysisData(null)
      }
    } catch (error) {
      console.error('Failed to fetch brand analysis:', error)
      setAnalysisData(null)
    } finally {
      setLoading(false)
    }
  }

  const triggerNewAnalysis = async () => {
    if (!businessId || !walletAddress) return

    try {
      setRefreshing(true)
      
      // Delete existing analysis
      await fetch(`/api/brand-analysis?businessId=${businessId}&walletAddress=${walletAddress}`, {
        method: 'DELETE'
      })

      // Trigger new analysis
      const response = await fetch('/api/ai/suggest-bounties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessData: { id: businessId, wallet_address: walletAddress, business_name: analysisData?.brand_name || 'Brand' },
          action: 'initiate'
        })
      })

      if (response.ok) {
        // Clear current data and show loading
        setAnalysisData(null)
        setLoading(true)
        
        // Start polling for completion (simple version - in production you'd want more sophisticated polling)
        setTimeout(() => {
          fetchAnalysisData()
        }, 60000) // Check again in 1 minute
      }
    } catch (error) {
      console.error('Failed to trigger new analysis:', error)
    } finally {
      setRefreshing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white mx-auto mb-3"></div>
          <p className="text-white/70 text-sm">Loading brand analysis...</p>
        </div>
      </div>
    )
  }

  if (!analysisData) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-lg p-8 text-center">
        <div className="mb-4">
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-white font-medium text-lg mb-2">No Brand Analysis Available</h3>
          <p className="text-white/70 text-sm mb-6">
            Brand analysis helps you understand your online presence and generate targeted bounties.
          </p>
        </div>
        <button
          onClick={triggerNewAnalysis}
          disabled={refreshing}
          className="px-6 py-2 bg-white text-black rounded-lg font-medium hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {refreshing ? 'Starting Analysis...' : 'Start Brand Analysis'}
        </button>
      </div>
    )
  }

  const metrics = analysisData.metrics_result || {}
  const sentimentMetrics = metrics.sentiment_metrics || {}
  const reputationMetrics = metrics.reputation_risk_metrics || {}
  const marketMetrics = metrics.market_position_metrics || {}
  const performanceMetrics = metrics.performance_indicators || {}

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-white font-medium text-lg mb-1">BrandHero Analysis</h3>
          <p className="text-white/60 text-sm">
            Last updated: {new Date(analysisData.updated_at).toLocaleString()}
          </p>
        </div>
        {/* <button
          onClick={triggerNewAnalysis}
          disabled={refreshing}
          className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50"
        >
          {refreshing ? 'Refreshing...' : 'Refresh Analysis'}
        </button> */}
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-white/5 backdrop-blur-sm rounded-lg p-1 border border-white/10">
        {[
          { id: 'overview', label: 'Overview', icon: '📊' },
          { id: 'sentiment', label: 'Sentiment', icon: '💭' },
          { id: 'metrics', label: 'Metrics', icon: '📈' },
          { id: 'bounties', label: 'AI Bounties', icon: '🎯' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id as any)}
            className={`flex-1 py-2 px-3 rounded-md transition-all duration-200 text-sm font-medium flex items-center justify-center gap-2 ${
              activeSection === tab.id
                ? 'bg-white text-black'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            <span>{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content Sections */}
      {activeSection === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Brand Health Score */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <h4 className="text-white font-medium mb-3">Brand Health Score</h4>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">
                {performanceMetrics.brand_health_index || 'N/A'}
              </div>
              <div className="text-white/60 text-sm">out of 100</div>
            </div>
          </div>

          {/* Overall Sentiment */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <h4 className="text-white font-medium mb-3">Overall Sentiment</h4>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">
                {sentimentMetrics.overall_brand_sentiment_score || 'N/A'}
              </div>
              <div className="text-white/60 text-sm">sentiment score</div>
            </div>
          </div>

          {/* Market Position */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <h4 className="text-white font-medium mb-3">Market Leadership</h4>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">
                {marketMetrics.market_leadership_perception || 'N/A'}
              </div>
              <div className="text-white/60 text-sm">perception score</div>
            </div>
          </div>
        </div>
      )}

      {activeSection === 'sentiment' && (
        <div className="space-y-6">
          {/* Sentiment Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <h4 className="text-white font-medium mb-4">Positive Sentiment</h4>
              <div className="space-y-4">
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                  <h5 className="text-green-300 font-medium mb-2">Social Media</h5>
                  <p className="text-green-200 text-sm line-clamp-3">
                    {analysisData.positive_social_result?.substring(0, 200)}...
                  </p>
                </div>
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                  <h5 className="text-green-300 font-medium mb-2">Reviews</h5>
                  <p className="text-green-200 text-sm line-clamp-3">
                    {analysisData.positive_reviews_result?.substring(0, 200)}...
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <h4 className="text-white font-medium mb-4">Areas for Improvement</h4>
              <div className="space-y-4">
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                  <h5 className="text-red-300 font-medium mb-2">Social Media</h5>
                  <p className="text-red-200 text-sm line-clamp-3">
                    {analysisData.negative_social_result?.substring(0, 200)}...
                  </p>
                </div>
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                  <h5 className="text-red-300 font-medium mb-2">Reviews</h5>
                  <p className="text-red-200 text-sm line-clamp-3">
                    {analysisData.negative_reviews_result?.substring(0, 200)}...
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Web Search Insights */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <h4 className="text-white font-medium mb-4">Web Search Insights</h4>
            <div className="prose prose-invert max-w-none">
              <p className="text-white/80 text-sm whitespace-pre-wrap">
                {analysisData.web_search_result?.substring(0, 1000)}...
              </p>
            </div>
          </div>
        </div>
      )}

      {activeSection === 'metrics' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Sentiment Metrics */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <h4 className="text-white font-medium mb-4">Sentiment Metrics</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-white/60 text-sm">Overall Score</span>
                <span className="text-white font-medium">{sentimentMetrics.overall_brand_sentiment_score || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60 text-sm">Web Media</span>
                <span className="text-white font-medium">{sentimentMetrics.web_media_sentiment_score || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60 text-sm">Customer Reviews</span>
                <span className="text-white font-medium">{sentimentMetrics.customer_review_sentiment_score || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60 text-sm">Social Media</span>
                <span className="text-white font-medium">{sentimentMetrics.social_media_sentiment_score || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Reputation Risk */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <h4 className="text-white font-medium mb-4">Reputation Risk</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-white/60 text-sm">Crisis Severity</span>
                <span className="text-white font-medium">{reputationMetrics.crisis_severity_level || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60 text-sm">Vulnerability</span>
                <span className="text-white font-medium">{reputationMetrics.reputation_vulnerability_score || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60 text-sm">Regulatory Attention</span>
                <span className="text-white font-medium">{reputationMetrics.regulatory_attention_score || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Market Position */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <h4 className="text-white font-medium mb-4">Market Position</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-white/60 text-sm">Competitive Advantage</span>
                <span className="text-white font-medium">{marketMetrics.competitive_advantage_score || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60 text-sm">Market Leadership</span>
                <span className="text-white font-medium">{marketMetrics.market_leadership_perception || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60 text-sm">Innovation Ranking</span>
                <span className="text-white font-medium">{marketMetrics.industry_innovation_ranking || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSection === 'bounties' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-white font-medium">AI-Generated Bounty Suggestions</h4>
            <span className="text-white/60 text-sm">
              {analysisData.bounty_suggestions?.length || 0} suggestions
            </span>
          </div>
          
          {analysisData.bounty_suggestions && analysisData.bounty_suggestions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analysisData.bounty_suggestions.map((bounty: any, index: number) => (
                <div key={index} className="bg-white/5 border border-white/10 rounded-lg p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h5 className="text-white font-medium">{bounty.title}</h5>
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full">
                      {bounty.difficulty || 'Medium'}
                    </span>
                  </div>
                  <p className="text-white/70 text-sm mb-4">{bounty.description}</p>
                  
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-white/60">Category:</span>
                      <span className="text-white">{bounty.category || 'General'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Est. Reward:</span>
                      <span className="text-white">{bounty.estimated_reward || 'N/A'}</span>
                    </div>
                    {bounty.target_audience && (
                      <div className="flex justify-between">
                        <span className="text-white/60">Target:</span>
                        <span className="text-white text-right max-w-[60%]">{bounty.target_audience}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white/5 border border-white/10 rounded-lg p-6 text-center">
              <p className="text-white/70">No bounty suggestions available yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
