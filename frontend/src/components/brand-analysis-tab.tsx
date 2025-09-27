"use client"

import { useState, useEffect } from 'react'
import { BrandAnalysisDataWithImpacts, BountyWithImpacts, MetricImpactsSummary, BrandBountyResponse } from '@/types/bounty-with-impacts'

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
  bounty_suggestions: {
    bounties: BountyWithImpacts[]
    success: boolean
    brand_name: string
    analysis_summary?: string
    timestamp?: string
    agent_address?: string
  }
  analysis_timestamp: string
  kg_storage_status: string
  raw_response: any
  created_at: string
  updated_at: string
}

interface BrandAnalysisTabProps {
  businessId: string
  walletAddress?: string
  selectedBountyIndices?: Set<number> // Receive selected bounties from parent
}

export default function BrandAnalysisTab({ businessId, walletAddress, selectedBountyIndices = new Set() }: BrandAnalysisTabProps) {
  const [analysisData, setAnalysisData] = useState<BrandAnalysisData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<'overview' | 'sentiment' | 'metrics' | 'bounties'>('metrics')
  const [refreshing, setRefreshing] = useState(false)
  const [modalContent, setModalContent] = useState<{title: string, content: string} | null>(null)

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
  const customerMetrics = metrics.customer_experience_metrics || {}
  const performanceMetrics = metrics.performance_indicators || {}
  const strategicInsights = metrics.strategic_insights || {}

  // Calculate total metric impacts from selected bounties (passed from parent)
  const calculateMetricImpacts = (): MetricImpactsSummary => {
    const impacts: MetricImpactsSummary = {}
    
    // Access bounties list from the bounty_suggestions.bounties array
    const bounties = analysisData?.bounty_suggestions?.bounties || []
    
    Array.from(selectedBountyIndices).forEach(index => {
      const bounty = bounties[index]
      if (bounty?.metric_impacts) {
        Object.entries(bounty.metric_impacts).forEach(([metric, impact]) => {
          impacts[metric] = (impacts[metric] || 0) + impact
        })
      }
    })
    
    return impacts
  }

  const metricImpacts = calculateMetricImpacts()

  // Helper function to get impact value for a specific metric
  const getImpactValue = (metricName: string): number => {
    return metricImpacts[metricName] || 0
  }

  // Helper function to open modal with full content
  const openModal = (title: string, content: string) => {
    setModalContent({ title, content })
  }

  // Helper function to close modal
  const closeModal = () => {
    setModalContent(null)
  }

  // Helper function to render metric value with impact
  const renderMetricWithImpact = (value: string | number, metricName: string) => {
    const impact = getImpactValue(metricName)
    return (
      <div className="flex items-center gap-2">
        <span className="text-white font-medium">{value || 'N/A'}</span>
        {impact > 0 && (
          <span className="text-green-400 font-medium text-sm">
            +{impact}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-white font-medium text-lg mb-1">BrandX Analysis</h3>
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
          { id: 'metrics', label: 'Metrics'},
          { id: 'overview', label: 'Overview'},
          { id: 'sentiment', label: 'Knowledge Graph'},
          { id: 'bounties', label: 'AI Bounties'}
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
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content Sections */}
      {activeSection === 'overview' && (
        <div className="space-y-6">
          {/* Key Performance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Brand Health Score */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <h4 className="text-white font-medium mb-3 flex items-center">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-3"></span>
                Brand Health Index
              </h4>
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">
                  {renderMetricWithImpact(performanceMetrics.brand_health_index, 'brand_health_index')}
                </div>
                <div className="text-white/60 text-sm">out of 100</div>
              </div>
            </div>

            {/* Overall Sentiment */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <h4 className="text-white font-medium mb-3 flex items-center">
                <span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>
                Overall Sentiment
              </h4>
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">
                  {renderMetricWithImpact(sentimentMetrics.overall_brand_sentiment_score, 'overall_brand_sentiment_score')}
                </div>
                <div className="text-white/60 text-sm">sentiment score</div>
              </div>
            </div>

            {/* Customer Satisfaction */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <h4 className="text-white font-medium mb-3 flex items-center">
                <span className="w-2 h-2 bg-purple-400 rounded-full mr-3"></span>
                Customer Satisfaction
              </h4>
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">
                  {renderMetricWithImpact(customerMetrics.customer_satisfaction_proxy, 'customer_satisfaction_proxy')}
                </div>
                <div className="text-white/60 text-sm">satisfaction proxy</div>
              </div>
            </div>

            {/* Market Leadership */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <h4 className="text-white font-medium mb-3 flex items-center">
                <span className="w-2 h-2 bg-yellow-400 rounded-full mr-3"></span>
                Market Leadership
              </h4>
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">
                  {renderMetricWithImpact(marketMetrics.market_leadership_perception, 'market_leadership_perception')}
                </div>
                <div className="text-white/60 text-sm">perception score</div>
              </div>
            </div>
          </div>

          {/* Strategic Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Strategic Insights Card */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <h4 className="text-white font-medium mb-4 flex items-center">
                <span className="w-2 h-2 bg-orange-400 rounded-full mr-3"></span>
                Strategic Overview
              </h4>
              <div className="space-y-4">
                <div>
                  <div className="text-white/60 text-sm mb-1">Primary Focus Area</div>
                  <div className="text-white font-medium">{strategicInsights.primary_improvement_area || 'N/A'}</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-white/60 text-sm">Urgency Level</div>
                  <span className={`font-medium px-3 py-1 rounded-full text-sm ${
                    strategicInsights.urgency_level === 'HIGH' ? 'bg-red-500/20 text-red-300' :
                    strategicInsights.urgency_level === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-300' :
                    'bg-green-500/20 text-green-300'
                  }`}>{strategicInsights.urgency_level || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-white/60 text-sm">Brand Momentum</div>
                  <span className={`font-medium px-3 py-1 rounded-full text-sm ${
                    strategicInsights.brand_momentum_direction === 'POSITIVE' ? 'bg-green-500/20 text-green-300' :
                    strategicInsights.brand_momentum_direction === 'STABLE' ? 'bg-blue-500/20 text-blue-300' :
                    'bg-red-500/20 text-red-300'
                  }`}>{strategicInsights.brand_momentum_direction || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Risk Assessment Card */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <h4 className="text-white font-medium mb-4 flex items-center">
                <span className="w-2 h-2 bg-red-400 rounded-full mr-3"></span>
                Risk Assessment
              </h4>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-white/60 text-sm">Crisis Severity</span>
                  <span className="text-white font-medium">{reputationMetrics.crisis_severity_level || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60 text-sm">Vulnerability Score</span>
                  <span className="text-white font-medium">{reputationMetrics.reputation_vulnerability_score || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60 text-sm">Competitive Threat</span>
                  <span className="text-white font-medium">{strategicInsights.competitive_threat_level || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60 text-sm">Future Readiness</span>
                  <span className="text-white font-medium">{performanceMetrics.future_readiness_score || 'N/A'}</span>
                </div>
              </div>
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
                <div 
                  className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 cursor-pointer hover:bg-green-500/20 transition-colors"
                  onClick={() => openModal('Positive Social Media', analysisData.positive_social_result || 'No content available')}
                >
                  <h5 className="text-green-300 font-medium mb-2 flex items-center justify-between">
                    Social Media
                    <span className="text-xs text-green-400">Click to view full</span>
                  </h5>
                  <p className="text-green-200 text-sm line-clamp-3">
                    {analysisData.positive_social_result?.substring(0, 200)}...
                  </p>
                </div>
                <div 
                  className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 cursor-pointer hover:bg-green-500/20 transition-colors"
                  onClick={() => openModal('Positive Reviews', analysisData.positive_reviews_result || 'No content available')}
                >
                  <h5 className="text-green-300 font-medium mb-2 flex items-center justify-between">
                    Reviews
                    <span className="text-xs text-green-400">Click to view full</span>
                  </h5>
                  <p className="text-green-200 text-sm line-clamp-3">
                    {analysisData.positive_reviews_result?.substring(0, 200)}...
                  </p>
                </div>
                <div 
                  className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 cursor-pointer hover:bg-green-500/20 transition-colors"
                  onClick={() => openModal('Positive Reddit', analysisData.positive_reddit_result || 'No content available')}
                >
                  <h5 className="text-green-300 font-medium mb-2 flex items-center justify-between">
                    Reddit
                    <span className="text-xs text-green-400">Click to view full</span>
                  </h5>
                  <p className="text-green-200 text-sm line-clamp-3">
                    {analysisData.positive_reddit_result?.substring(0, 200)}...
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <h4 className="text-white font-medium mb-4">Areas for Improvement</h4>
              <div className="space-y-4">
                <div 
                  className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 cursor-pointer hover:bg-red-500/20 transition-colors"
                  onClick={() => openModal('Negative Social Media', analysisData.negative_social_result || 'No content available')}
                >
                  <h5 className="text-red-300 font-medium mb-2 flex items-center justify-between">
                    Social Media
                    <span className="text-xs text-red-400">Click to view full</span>
                  </h5>
                  <p className="text-red-200 text-sm line-clamp-3">
                    {analysisData.negative_social_result?.substring(0, 200)}...
                  </p>
                </div>
                <div 
                  className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 cursor-pointer hover:bg-red-500/20 transition-colors"
                  onClick={() => openModal('Negative Reviews', analysisData.negative_reviews_result || 'No content available')}
                >
                  <h5 className="text-red-300 font-medium mb-2 flex items-center justify-between">
                    Reviews
                    <span className="text-xs text-red-400">Click to view full</span>
                  </h5>
                  <p className="text-red-200 text-sm line-clamp-3">
                    {analysisData.negative_reviews_result?.substring(0, 200)}...
                  </p>
                </div>
                <div 
                  className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 cursor-pointer hover:bg-red-500/20 transition-colors"
                  onClick={() => openModal('Negative Reddit', analysisData.negative_reddit_result || 'No content available')}
                >
                  <h5 className="text-red-300 font-medium mb-2 flex items-center justify-between">
                    Reddit
                    <span className="text-xs text-red-400">Click to view full</span>
                  </h5>
                  <p className="text-red-200 text-sm line-clamp-3">
                    {analysisData.negative_reddit_result?.substring(0, 200)}...
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Web Search Insights */}
          <div 
            className="bg-white/5 border border-white/10 rounded-lg p-6 cursor-pointer hover:bg-white/10 transition-colors"
            onClick={() => openModal('Web Search Insights', analysisData.web_search_result || 'No content available')}
          >
            <h4 className="text-white font-medium mb-4 flex items-center justify-between">
              Web Search Insights
              <span className="text-xs text-white/60">Click to view full</span>
            </h4>
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
            <h4 className="text-white font-medium mb-4 flex items-center">
              <span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>
              Sentiment Metrics
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-white/60 text-sm">Overall Score</span>
                {renderMetricWithImpact(sentimentMetrics.overall_brand_sentiment_score, 'overall_brand_sentiment_score')}
              </div>
              <div className="flex justify-between">
                <span className="text-white/60 text-sm">Web Media</span>
                {renderMetricWithImpact(sentimentMetrics.web_media_sentiment_score, 'web_media_sentiment_score')}
              </div>
              <div className="flex justify-between">
                <span className="text-white/60 text-sm">Customer Reviews</span>
                {renderMetricWithImpact(sentimentMetrics.customer_review_sentiment_score, 'customer_review_sentiment_score')}
              </div>
              <div className="flex justify-between">
                <span className="text-white/60 text-sm">Social Media</span>
                {renderMetricWithImpact(sentimentMetrics.social_media_sentiment_score, 'social_media_sentiment_score')}
              </div>
              <div className="flex justify-between">
                <span className="text-white/60 text-sm">Volatility Score</span>
                {renderMetricWithImpact(sentimentMetrics.sentiment_volatility_score, 'sentiment_volatility_score')}
              </div>
              <div className="flex justify-between">
                <span className="text-white/60 text-sm">Positive Mention Ratio</span>
                <span className="text-white font-medium">{sentimentMetrics.positive_mention_ratio || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Reputation Risk Metrics */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <h4 className="text-white font-medium mb-4 flex items-center">
              <span className="w-2 h-2 bg-red-400 rounded-full mr-3"></span>
              Reputation Risk
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-white/60 text-sm">Crisis Severity</span>
                <span className="text-white font-medium">{reputationMetrics.crisis_severity_level || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60 text-sm">Safety Recalls</span>
                <span className="text-white font-medium">{reputationMetrics.active_safety_recalls_count || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60 text-sm">Vulnerability Score</span>
                <span className="text-white font-medium">{reputationMetrics.reputation_vulnerability_score || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60 text-sm">Regulatory Attention</span>
                <span className="text-white font-medium">{reputationMetrics.regulatory_attention_score || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60 text-sm">Negative Media</span>
                <span className="text-white font-medium">{reputationMetrics.negative_media_coverage_intensity || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Market Position Metrics */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <h4 className="text-white font-medium mb-4 flex items-center">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-3"></span>
              Market Position
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-white/60 text-sm">Competitive Advantage</span>
                <span className="text-white font-medium">{marketMetrics.competitive_advantage_score || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60 text-sm">Competitive Pressure</span>
                <span className="text-white font-medium">{marketMetrics.competitive_pressure_intensity || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60 text-sm">Market Leadership</span>
                <span className="text-white font-medium">{marketMetrics.market_leadership_perception || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60 text-sm">Differentiation Score</span>
                <span className="text-white font-medium">{marketMetrics.brand_differentiation_score || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60 text-sm">Innovation Ranking</span>
                <span className="text-white font-medium">{marketMetrics.industry_innovation_ranking || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Customer Experience Metrics */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <h4 className="text-white font-medium mb-4 flex items-center">
              <span className="w-2 h-2 bg-purple-400 rounded-full mr-3"></span>
              Customer Experience
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-white/60 text-sm">Satisfaction Proxy</span>
                <span className="text-white font-medium">{customerMetrics.customer_satisfaction_proxy || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60 text-sm">Review Volume</span>
                <span className="text-white font-medium">{customerMetrics.review_volume_strength || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60 text-sm">Advocacy Level</span>
                <span className="text-white font-medium">{customerMetrics.customer_advocacy_level || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60 text-sm">Complaint Resolution</span>
                <span className="text-white font-medium">{customerMetrics.complaint_resolution_effectiveness || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60 text-sm">Service Quality</span>
                <span className="text-white font-medium">{customerMetrics.service_quality_perception || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Performance Indicators */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <h4 className="text-white font-medium mb-4 flex items-center">
              <span className="w-2 h-2 bg-yellow-400 rounded-full mr-3"></span>
              Performance Indicators
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-white/60 text-sm">Brand Health Index</span>
                <span className="text-white font-medium">{performanceMetrics.brand_health_index || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60 text-sm">Resilience Score</span>
                <span className="text-white font-medium">{performanceMetrics.brand_resilience_score || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60 text-sm">Growth Potential</span>
                <span className="text-white font-medium">{performanceMetrics.growth_potential_indicator || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60 text-sm">Stakeholder Confidence</span>
                <span className="text-white font-medium">{performanceMetrics.stakeholder_confidence_level || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60 text-sm">Future Readiness</span>
                <span className="text-white font-medium">{performanceMetrics.future_readiness_score || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Strategic Insights */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <h4 className="text-white font-medium mb-4 flex items-center">
              <span className="w-2 h-2 bg-orange-400 rounded-full mr-3"></span>
              Strategic Insights
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-white/60 text-sm">Primary Focus Area</span>
                <span className="text-white font-medium text-right max-w-[60%]">{strategicInsights.primary_improvement_area || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60 text-sm">Urgency Level</span>
                <span className={`font-medium px-2 py-1 rounded-full text-xs ${
                  strategicInsights.urgency_level === 'HIGH' ? 'bg-red-500/20 text-red-300' :
                  strategicInsights.urgency_level === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-300' :
                  'bg-green-500/20 text-green-300'
                }`}>{strategicInsights.urgency_level || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60 text-sm">Investment Priority</span>
                <span className="text-white font-medium">{strategicInsights.investment_priority_score || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60 text-sm">Threat Level</span>
                <span className="text-white font-medium">{strategicInsights.competitive_threat_level || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60 text-sm">Brand Momentum</span>
                <span className={`font-medium px-2 py-1 rounded-full text-xs ${
                  strategicInsights.brand_momentum_direction === 'POSITIVE' ? 'bg-green-500/20 text-green-300' :
                  strategicInsights.brand_momentum_direction === 'STABLE' ? 'bg-blue-500/20 text-blue-300' :
                  'bg-red-500/20 text-red-300'
                }`}>{strategicInsights.brand_momentum_direction || 'N/A'}</span>
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
              {analysisData?.bounty_suggestions?.bounties?.length || 0} suggestions
            </span>
          </div>
          
          {analysisData?.bounty_suggestions?.bounties && analysisData.bounty_suggestions.bounties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analysisData.bounty_suggestions.bounties.map((bounty: BountyWithImpacts, index: number) => (
                <div key={index} className="bg-white/5 border border-white/10 rounded-lg p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h5 className="text-white font-medium">{bounty.title}</h5>
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full">
                      {bounty.difficulty || 'Medium'}
                    </span>
                  </div>
                  <p className="text-white/70 text-sm mb-4">{bounty.description}</p>
                  
                  <div className="space-y-2 text-xs mb-4">
                    <div className="flex justify-between">
                      <span className="text-white/60">Category:</span>
                      <span className="text-white">{bounty.category || 'General'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Est. Reward:</span>
                      <span className="text-white">{bounty.estimated_reward || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Impact Users:</span>
                      <span className="text-white">{bounty.impact_users || 'N/A'}</span>
                    </div>
                    {bounty.target_audience && (
                      <div className="flex justify-between">
                        <span className="text-white/60">Target:</span>
                        <span className="text-white text-right max-w-[60%]">{bounty.target_audience}</span>
                      </div>
                    )}
                  </div>

                  {/* Success Metrics */}
                  {bounty.success_metrics && bounty.success_metrics.length > 0 && (
                    <div className="mb-4">
                      <span className="text-white/60 text-xs">Success Metrics:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {bounty.success_metrics.map((metric, idx) => (
                          <span key={idx} className="px-2 py-1 bg-blue-500/10 text-blue-300 text-xs rounded">
                            {metric}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Metric Impacts */}
                  {bounty.metric_impacts && Object.keys(bounty.metric_impacts).length > 0 && (
                    <div>
                      <span className="text-white/60 text-xs">Metric Impacts:</span>
                      <div className="grid grid-cols-2 gap-1 mt-1">
                        {Object.entries(bounty.metric_impacts).map(([metric, impact]) => (
                          <div key={metric} className="flex justify-between text-xs">
                            <span className="text-white/50 truncate">{metric.replace(/_/g, ' ')}</span>
                            <span className="text-green-400 font-medium">+{impact}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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

      {/* Modal for full content display */}
      {modalContent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-medium text-white">{modalContent.title}</h3>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="prose prose-invert max-w-none">
                <p className="text-white/80 text-sm whitespace-pre-wrap leading-relaxed">
                  {modalContent.content}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
