import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET - Fetch consumer's loyalty requests
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const wallet_address = searchParams.get('wallet_address')

    if (!wallet_address) {
      return NextResponse.json(
        { error: 'wallet_address parameter is required' },
        { status: 400 }
      )
    }

    // Fetch consumer's loyalty requests
    const { data, error } = await supabase.rpc('get_consumer_loyalty_requests', {
      p_wallet_address: wallet_address
    })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch loyalty requests', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      requests: data || [] 
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create new loyalty membership request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      consumer_wallet_address, 
      business_id, 
      consumer_ens_name, 
      consumer_message 
    } = body

    if (!consumer_wallet_address || !business_id) {
      return NextResponse.json(
        { error: 'consumer_wallet_address and business_id are required' },
        { status: 400 }
      )
    }

    // Check if request already exists
    const { data: existingRequest, error: checkError } = await supabase
      .from('loyalty_membership_requests')
      .select('id, status')
      .eq('consumer_wallet_address', consumer_wallet_address)
      .eq('business_id', business_id)
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error checking existing request:', checkError)
      return NextResponse.json(
        { error: 'Failed to check existing request', details: checkError.message },
        { status: 500 }
      )
    }

    if (existingRequest) {
      return NextResponse.json({
        success: false,
        error: 'Request already exists',
        existing_status: existingRequest.status,
        message: `You already have a ${existingRequest.status} request for this business`
      })
    }

    // Create new request
    const { data, error } = await supabase.rpc('create_loyalty_request', {
      p_consumer_wallet_address: consumer_wallet_address,
      p_business_id: business_id,
      p_consumer_ens_name: consumer_ens_name || null,
      p_consumer_message: consumer_message || null
    })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to create loyalty request', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      request: data?.[0] || {},
      message: 'Loyalty program request submitted successfully'
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}