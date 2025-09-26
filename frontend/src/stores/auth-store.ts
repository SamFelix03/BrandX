import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface Business {
  id: string
  business_name: string
  description?: string
  location?: string
  website?: string
  profile_picture_url?: string
  smart_contract_address?: string
  is_token_issuer: boolean
  created_at: string
}

interface AuthState {
  // Privy auth state
  authenticated: boolean
  user: any
  ready: boolean
  
  // Business state
  business: Business | null
  hasBusiness: boolean
  businessLoading: boolean
  
  // Actions
  setAuth: (authenticated: boolean, user: any, ready: boolean) => void
  setBusiness: (business: Business | null) => void
  setBusinessLoading: (loading: boolean) => void
  fetchBusiness: (walletAddress: string) => Promise<void>
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  devtools(
    (set, get) => ({
      // Initial state
      authenticated: false,
      user: null,
      ready: false,
      business: null,
      hasBusiness: false,
      businessLoading: false,

      // Actions
      setAuth: (authenticated, user, ready) => {
        set({ authenticated, user, ready })
        
        // Fetch business data when user authenticates
        if (authenticated && ready && user?.wallet?.address) {
          get().fetchBusiness(user.wallet.address)
        } else if (!authenticated) {
          set({ business: null, hasBusiness: false, businessLoading: false })
        }
      },

      setBusiness: (business) => {
        set({ 
          business, 
          hasBusiness: !!business,
          businessLoading: false
        })
      },

      setBusinessLoading: (loading) => {
        set({ businessLoading: loading })
      },

      fetchBusiness: async (walletAddress: string) => {
        set({ businessLoading: true })
        
        try {
          const response = await fetch(`/api/businesses?wallet_address=${walletAddress}`)
          const result = await response.json()
          
          if (result.business) {
            set({ 
              business: result.business, 
              hasBusiness: true, 
              businessLoading: false 
            })
          } else {
            set({ 
              business: null, 
              hasBusiness: false, 
              businessLoading: false 
            })
          }
        } catch (error) {
          console.error('Failed to fetch business:', error)
          set({ 
            business: null, 
            hasBusiness: false, 
            businessLoading: false 
          })
        }
      },

      logout: () => {
        set({
          authenticated: false,
          user: null,
          business: null,
          hasBusiness: false,
          businessLoading: false
        })
      }
    }),
    {
      name: 'auth-store'
    }
  )
)