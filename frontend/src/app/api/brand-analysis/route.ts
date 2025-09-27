import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const businessId = searchParams.get('businessId')
    const walletAddress = searchParams.get('walletAddress')

    if (!businessId && !walletAddress) {
      return NextResponse.json(
        { error: 'Business ID or wallet address is required' },
        { status: 400 }
      )
    }

    // Set user context for RLS
    if (walletAddress) {
      await supabase.rpc('set_user_context', { user_wallet: walletAddress })
    }

    let query = supabase
      .from('brand_analysis')
      .select(`
        *,
        businesses!inner(
          id,
          business_name,
          wallet_address
        )
      `)

    if (businessId) {
      query = query.eq('business_id', businessId)
    } else if (walletAddress) {
      query = query.eq('businesses.wallet_address', walletAddress)
    }

    const { data, error } = await query.single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          success: true,
          analysis: null,
          message: 'No brand analysis found'
        })
      }
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch brand analysis' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      analysis: data
    })

  } catch (error) {
    console.error('Brand analysis fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch brand analysis' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const businessId = searchParams.get('businessId')
    const walletAddress = searchParams.get('walletAddress')

    if (!businessId || !walletAddress) {
      return NextResponse.json(
        { error: 'Business ID and wallet address are required' },
        { status: 400 }
      )
    }

    // Set user context for RLS
    await supabase.rpc('set_user_context', { user_wallet: walletAddress })

    const { error } = await supabase
      .from('brand_analysis')
      .delete()
      .eq('business_id', businessId)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to delete brand analysis' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Brand analysis deleted successfully'
    })

  } catch (error) {
    console.error('Brand analysis delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete brand analysis' },
      { status: 500 }
    )
  }
}
