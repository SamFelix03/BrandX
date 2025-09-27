import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Fetch all businesses with deployed contracts for consumer view
    const { data, error } = await supabase
      .from('businesses')
      .select(`
        id,
        business_name,
        description,
        location,
        website,
        profile_picture_url,
        ens_domain,
        smart_contract_address,
        created_at
      `)
      .not('smart_contract_address', 'is', null)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch businesses', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      businesses: data || [] 
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}