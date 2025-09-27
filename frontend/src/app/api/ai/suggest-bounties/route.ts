import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

interface BusinessData {
  business_name: string
  description?: string
  location?: string
  website?: string
  ens_domain?: string
  id?: string
  wallet_address?: string
}

interface AIAnalysisResponse {
  brand_name: string
  web_search_result: string
  negative_reviews_result: string
  positive_reviews_result: string
  negative_reddit_result: string
  positive_reddit_result: string
  negative_social_result: string
  positive_social_result: string
  metrics_result: string
  bounty_result: string
  timestamp: string
  kg_storage_status: string
}

interface ProcessingStatus {
  status: 'processing' | 'completed' | 'error'
  brand_name: string
  progress: string
  timestamp: string
  data?: AIAnalysisResponse
}

const ORCHESTRATOR_BASE_URL = 'https://orchestrator-739298578243.us-central1.run.app'
const BOUNTY_AGENT_URL = 'https://bountyagent-739298578243.us-central1.run.app'
const METRICS_AGENT_URL = 'https://metricsagent-739298578243.us-central1.run.app'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { businessData, action = 'initiate' } = body as { businessData: BusinessData, action?: 'initiate' | 'status' }

    if (!businessData || !businessData.business_name) {
      return NextResponse.json(
        { error: 'Business data with business_name is required' },
        { status: 400 }
      )
    }

    if (action === 'status') {
      // Check status of analysis
      try {
        const statusResponse = await fetch(`${ORCHESTRATOR_BASE_URL}/research-status`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })

        if (!statusResponse.ok) {
          return NextResponse.json(
            { error: 'Failed to fetch analysis status' },
            { status: statusResponse.status }
          )
        }

        const statusData = await statusResponse.json()
        
        // Check if this is the complete analysis response (has all the analysis fields)
        if (statusData.brand_name && statusData.web_search_result && businessData.id) {
          // This is the complete analysis! Fetch bounties and metrics and save to database
          const [bountiesData, metricsData] = await Promise.all([
            fetchBountiesFromEndpoint(),
            fetchMetricsFromEndpoint()
          ])
          
          // Save analysis, bounty, and metrics data to database
          await saveBrandAnalysisToDatabase(businessData.id, statusData, bountiesData, metricsData)
          
          return NextResponse.json({
            success: true,
            status: 'completed',
            progress: 'Analysis completed successfully',
            timestamp: statusData.timestamp,
            data: statusData
          })
        } else if (statusData.status && statusData.progress) {
          // This is a processing status response
          return NextResponse.json({
            success: true,
            status: statusData.status,
            progress: statusData.progress,
            timestamp: statusData.timestamp
          })
        } else {
          // Unknown response format
          return NextResponse.json({
            success: true,
            status: 'processing',
            progress: statusData.progress || 'Analysis in progress...',
            timestamp: statusData.timestamp || new Date().toISOString()
          })
        }
      } catch (error) {
        console.error('Status check error:', error)
        return NextResponse.json(
          { error: 'Failed to check analysis status' },
          { status: 500 }
        )
      }
    }

    // Initiate brand research
    try {
      const researchResponse = await fetch(`${ORCHESTRATOR_BASE_URL}/research-brand`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          brand_name: businessData.business_name
        })
      })

      if (!researchResponse.ok) {
        return NextResponse.json(
          { error: 'Failed to initiate brand research' },
          { status: researchResponse.status }
        )
      }

      const researchData = await researchResponse.json()

      // Log the AI interaction
      if (businessData.id) {
        await logAIInteraction(businessData.id, {
          brand_name: businessData.business_name,
          action: 'initiate_research'
        }, researchData)
      }

      return NextResponse.json({
        success: true,
        status: researchData.status,
        brand_name: researchData.brand_name,
        progress: researchData.progress,
        timestamp: researchData.timestamp,
        message: `Brand research initiated for ${businessData.business_name}`
      })
    } catch (error) {
      console.error('Research initiation error:', error)
      return NextResponse.json(
        { error: 'Failed to initiate brand research' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('AI bounty suggestion error:', error)
    return NextResponse.json(
      { error: 'Failed to process AI request' },
      { status: 500 }
    )
  }
}

async function fetchBountiesFromEndpoint() {
  try {
    const bountiesResponse = await fetch(`${BOUNTY_AGENT_URL}/bounties/auto-generated`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!bountiesResponse.ok) {
      console.error('Failed to fetch bounties from endpoint:', bountiesResponse.status)
      return null
    }

    const bountiesData = await bountiesResponse.json()
    console.log('Successfully fetched bounties from endpoint:', bountiesData)
    return bountiesData
  } catch (error) {
    console.error('Error fetching bounties from endpoint:', error)
    return null
  }
}

async function fetchMetricsFromEndpoint() {
  try {
    const metricsResponse = await fetch(`${METRICS_AGENT_URL}/brand/metrics/last`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!metricsResponse.ok) {
      console.error('Failed to fetch metrics from endpoint:', metricsResponse.status)
      return null
    }

    const metricsData = await metricsResponse.json()
    console.log('Successfully fetched metrics from endpoint:', metricsData)
    return metricsData
  } catch (error) {
    console.error('Error fetching metrics from endpoint:', error)
    return null
  }
}

async function saveBrandAnalysisToDatabase(businessId: string, analysisData: AIAnalysisResponse, bountiesData?: any, metricsData?: any) {
  try {
    // Use structured metrics data from metrics agent if available, otherwise fallback to parsing status endpoint
    let structuredMetricsData = null
    if (metricsData && metricsData.success && metricsData.metrics) {
      // Use the structured metrics from the metrics agent
      structuredMetricsData = metricsData.metrics
      console.log(`Using structured metrics data for ${metricsData.brand_name}`)
    } else {
      // Fallback to parsing metrics result from status endpoint
      try {
        structuredMetricsData = JSON.parse(analysisData.metrics_result)
        console.log('Using fallback metrics data from status endpoint')
      } catch (e) {
        console.error('Failed to parse metrics result from status endpoint:', e)
      }
    }

    // Use bounties data from dedicated endpoint if available, otherwise fallback to status endpoint
    let bountyStructureToStore = null
    if (bountiesData && bountiesData.auto_generated_bounties) {
      // Get the complete bounty structure from the dedicated bounty endpoint (preferred)
      const brandKey = Object.keys(bountiesData.auto_generated_bounties)[0]
      if (brandKey && bountiesData.auto_generated_bounties[brandKey]) {
        bountyStructureToStore = bountiesData.auto_generated_bounties[brandKey]
        console.log(`Using complete bounty structure for ${brandKey} with ${bountyStructureToStore.bounties?.length || 0} bounties`)
      }
    } else {
      // Fallback to bounty result from status endpoint
      try {
        const bountyData = JSON.parse(analysisData.bounty_result)
        const brandBounties = bountyData?.auto_generated_bounties?.[analysisData.brand_name]
        if (brandBounties) {
          bountyStructureToStore = brandBounties
          console.log('Using fallback bounty structure from status endpoint')
        }
      } catch (e) {
        console.error('Failed to parse bounty result from status endpoint:', e)
      }
    }

    const bountyCount = bountyStructureToStore?.bounties?.length || 0
    console.log(`Storing complete bounty structure with ${bountyCount} bounties for ${analysisData.brand_name}`)

    // Insert into brand_analysis table using the existing schema
    const { error } = await supabase
      .from('brand_analysis')
      .upsert({
        business_id: businessId,
        brand_name: analysisData.brand_name,
        web_search_result: analysisData.web_search_result,
        negative_reviews_result: analysisData.negative_reviews_result,
        positive_reviews_result: analysisData.positive_reviews_result,
        negative_reddit_result: analysisData.negative_reddit_result,
        positive_reddit_result: analysisData.positive_reddit_result,
        negative_social_result: analysisData.negative_social_result,
        positive_social_result: analysisData.positive_social_result,
        metrics_result: structuredMetricsData,
        bounty_suggestions: bountyStructureToStore, // Store the complete bounty structure with impacts
        analysis_timestamp: analysisData.timestamp,
        kg_storage_status: analysisData.kg_storage_status,
        raw_response: {
          status_endpoint: analysisData,
          bounty_endpoint: bountiesData,
          metrics_endpoint: metricsData
        }
      }, {
        onConflict: 'business_id'
      })

    if (error) {
      console.error('Database save error:', error)
      throw error
    }

    console.log('Brand analysis saved to database successfully')
  } catch (error) {
    console.error('Error saving brand analysis:', error)
    throw error
  }
}

async function logAIInteraction(businessId: string, request: any, response: any) {
  try {
    const { error } = await supabase
      .from('business_ai_log')
      .insert({
        business_id: businessId,
        request_payload: request,
        response_bounties: response,
        agent_version: 'orchestrator-v1'
      })

    if (error) {
      console.error('AI log error:', error)
    }
  } catch (error) {
    console.error('Error logging AI interaction:', error)
  }
}