import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for database tables
export interface Business {
  id: string
  wallet_address: string
  ens_domain?: string
  profile_picture_url?: string
  business_name: string
  description?: string
  location?: string
  website?: string
  social_links: Record<string, string>
  is_token_issuer: boolean
  token_contract_address?: string
  smart_contract_address?: string
  created_at: string
  updated_at: string
}

export interface RewardTemplate {
  id: string
  name: string
  reward_type: 'web2' | 'web3' | 'points'
  reward_logic_slug: string
  description?: string
  requires_token: boolean
  parameters: Record<string, any>
  created_at: string
}

export interface BountyDraft {
  id: string
  business_id: string
  title: string
  description?: string
  location?: string
  action_type?: string
  proof_type?: string
  goal?: string
  reward_type_id?: string
  max_claims?: number
  auto_verify: boolean
  expiry_date?: string
  tags: string[]
  created_at: string
}

export interface BusinessAILog {
  id: string
  business_id: string
  request_payload?: Record<string, any>
  response_bounties?: Record<string, any>
  agent_version?: string
  created_at: string
}