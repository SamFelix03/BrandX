import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const is_token_issuer = searchParams.get('is_token_issuer') === 'true'

    let query = supabase
      .from('reward_templates')
      .select('*')
      .order('name')

    // If not a token issuer, exclude Web3 rewards
    if (!is_token_issuer) {
      query = query.eq('requires_token', false)
    }

    const { data, error } = await query

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch reward templates', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ templates: data })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}