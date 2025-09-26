import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      wallet_address,
      business_name,
      description,
      location,
      website,
      social_links,
      is_token_issuer,
      token_contract_address,
      profile_picture_url
    } = body

    // Validate required fields
    if (!wallet_address || !business_name) {
      return NextResponse.json(
        { error: 'wallet_address and business_name are required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase.rpc('insert_business_with_context', {
      p_wallet_address: wallet_address,
      p_business_name: business_name,
      p_description: description || null,
      p_location: location || null,
      p_website: website || null,
      p_social_links: social_links || {},
      p_is_token_issuer: is_token_issuer || false,
      p_token_contract_address: token_contract_address || null,
      p_profile_picture_url: profile_picture_url || null
    })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to create business', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, business: data })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

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

    // Set RLS context and fetch business
    const { data, error } = await supabase.rpc('get_business_with_context', {
      p_wallet_address: wallet_address
    })

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch business', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ business: data || null })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}