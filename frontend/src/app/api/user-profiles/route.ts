import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      wallet_address,
      username,
      display_name,
      bio,
      profile_picture_url,
      location,
      website,
      social_links
    } = body

    // Validate required fields
    if (!wallet_address || !username) {
      return NextResponse.json(
        { error: 'wallet_address and username are required' },
        { status: 400 }
      )
    }

    // Check if username is already taken
    const { data: existingUser } = await supabase
      .from('user_profiles')
      .select('username')
      .eq('username', username)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username is already taken' },
        { status: 400 }
      )
    }

    // Set RLS context and insert profile
    const { data, error } = await supabase.rpc('insert_user_profile_with_context', {
      p_wallet_address: wallet_address,
      p_username: username,
      p_display_name: display_name || null,
      p_bio: bio || null,
      p_profile_picture_url: profile_picture_url || null,
      p_location: location || null,
      p_website: website || null,
      p_social_links: social_links || {}
    })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to create profile', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, profile: data })
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

    // Set RLS context and fetch profile
    const { data, error } = await supabase.rpc('get_user_profile_with_context', {
      p_wallet_address: wallet_address
    })

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch profile', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ profile: data || null })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      wallet_address,
      username,
      display_name,
      bio,
      profile_picture_url,
      location,
      website,
      social_links
    } = body

    // Validate required fields
    if (!wallet_address || !username) {
      return NextResponse.json(
        { error: 'wallet_address and username are required' },
        { status: 400 }
      )
    }

    // Check if username is already taken by another user
    const { data: existingUser } = await supabase
      .from('user_profiles')
      .select('username, wallet_address')
      .eq('username', username)
      .single()

    if (existingUser && existingUser.wallet_address !== wallet_address) {
      return NextResponse.json(
        { error: 'Username is already taken' },
        { status: 400 }
      )
    }

    // Set RLS context and update profile
    const { data, error } = await supabase.rpc('update_user_profile_with_context', {
      p_wallet_address: wallet_address,
      p_username: username,
      p_display_name: display_name || null,
      p_bio: bio || null,
      p_profile_picture_url: profile_picture_url || null,
      p_location: location || null,
      p_website: website || null,
      p_social_links: social_links || {}
    })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to update profile', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, profile: data })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}