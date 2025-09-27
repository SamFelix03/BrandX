import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET - Fetch loyalty requests for a business
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

    // Fetch business loyalty requests
    const { data, error } = await supabase.rpc('get_loyalty_requests_for_business', {
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

// PUT - Update loyalty request status (approve/reject)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      business_wallet_address, 
      request_id, 
      new_status, 
      rejection_reason 
    } = body

    if (!business_wallet_address || !request_id || !new_status) {
      return NextResponse.json(
        { error: 'business_wallet_address, request_id, and new_status are required' },
        { status: 400 }
      )
    }

    if (!['approved', 'rejected'].includes(new_status)) {
      return NextResponse.json(
        { error: 'new_status must be either "approved" or "rejected"' },
        { status: 400 }
      )
    }

    // Update request status
    const { data, error } = await supabase.rpc('update_loyalty_request_status', {
      p_business_wallet_address: business_wallet_address,
      p_request_id: request_id,
      p_new_status: new_status,
      p_rejection_reason: rejection_reason || null
    })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to update request status', details: error.message },
        { status: 500 }
      )
    }

    const result = data?.[0]
    if (!result?.success) {
      return NextResponse.json(
        { error: result?.message || 'Failed to update request status' },
        { status: 400 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      message: result.message
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}