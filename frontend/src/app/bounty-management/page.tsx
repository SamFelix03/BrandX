"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import ShaderBackground from '../../components/shader-background'
import DashboardHeader from '../../components/dashboard-header'
import BountyManagementForm from '../../components/bounty-management-form'

export default function BountyManagement() {
  const router = useRouter()
  const { authenticated, user, business, businessLoading } = useAuthStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user should be on this page
    if (!businessLoading && authenticated) {
      if (business?.smart_contract_address) {
        // Business already deployed, redirect to dashboard
        router.push('/business-dashboard')
      } else {
        setLoading(false)
      }
    } else if (!businessLoading && !authenticated) {
      router.push('/business-landing')
    }
  }, [authenticated, business, businessLoading, router])

  if (businessLoading || loading) {
    return (
      <ShaderBackground>
        <DashboardHeader />
        <main className="absolute top-20 left-0 right-0 bottom-0 flex items-center justify-center z-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white/70">Loading bounty management...</p>
          </div>
        </main>
      </ShaderBackground>
    )
  }

  if (!authenticated || !business) {
    return null // Will redirect
  }

  return (
    <ShaderBackground>
      <DashboardHeader business={business} />
      <main className="absolute top-20 left-0 right-0 bottom-0 z-20 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          
          {/* Header Section */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-light text-white mb-4">
              Setup Your <span className="font-medium italic instrument">Bounty System</span>
            </h1>
            <p className="text-white/70 text-lg max-w-3xl mx-auto">
              Our AI has analyzed your business and suggested bounties to help you grow. 
              Review, edit, or add your own bounties, rewards, and prizes before deploying your smart contract.
            </p>
          </div>

          {/* Business Info Card */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-medium text-white mb-2">{business.business_name}</h2>
                <p className="text-white/70">{business.description || "Setting up bounty system..."}</p>
              </div>
              <div className="text-right">
                <div className="text-white/70 text-sm">ENS Domain</div>
                <div className="text-white font-mono">{business.ens_domain || "Not set"}</div>
              </div>
            </div>
          </div>

          {/* Bounty Management Form */}
          <BountyManagementForm 
            business={business}
            walletAddress={user?.wallet?.address || ''}
          />
        </div>
      </main>
    </ShaderBackground>
  )
}