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
          // This is the complete analysis! Fetch bounties and save to database
          const bountiesData = await fetchBountiesFromEndpoint()
          
          // Save both analysis and bounty data to database
          await saveBrandAnalysisToDatabase(businessData.id, statusData, bountiesData)
          
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

async function saveBrandAnalysisToDatabase(businessId: string, analysisData: AIAnalysisResponse, bountiesData?: any) {
  try {
    // Parse metrics result from status endpoint
    let metricsData = null
    try {
      metricsData = JSON.parse(analysisData.metrics_result)
    } catch (e) {
      console.error('Failed to parse metrics result:', e)
    }

    // Use bounties data from dedicated endpoint if available, otherwise fallback to status endpoint
    let bountiesToStore = []
    if (bountiesData && bountiesData.auto_generated_bounties) {
      // Get bounties from the dedicated bounty endpoint (preferred)
      const brandKey = Object.keys(bountiesData.auto_generated_bounties)[0]
      if (brandKey && bountiesData.auto_generated_bounties[brandKey]?.bounties) {
        bountiesToStore = bountiesData.auto_generated_bounties[brandKey].bounties
      }
    } else {
      // Fallback to bounty result from status endpoint
      try {
        const bountyData = JSON.parse(analysisData.bounty_result)
        bountiesToStore = bountyData?.auto_generated_bounties?.[analysisData.brand_name]?.bounties || []
      } catch (e) {
        console.error('Failed to parse bounty result from status endpoint:', e)
      }
    }

    console.log(`Storing ${bountiesToStore.length} bounties for ${analysisData.brand_name}`)

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
        metrics_result: metricsData,
        bounty_suggestions: bountiesToStore, // Store the actual bounties array in bounty_suggestions
        analysis_timestamp: analysisData.timestamp,
        kg_storage_status: analysisData.kg_storage_status,
        raw_response: {
          status_endpoint: analysisData,
          bounty_endpoint: bountiesData
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