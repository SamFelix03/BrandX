"use client"

import { useAuthStore } from '@/stores/auth-store'
import ShaderBackground from '../../components/shader-background'
import Header from '../../components/header'
import BusinessOnboardingForm from '../../components/business-onboarding-form'

export default function BusinessOnboarding() {
  const { authenticated, user, businessLoading } = useAuthStore()

  if (businessLoading) {
    return (
      <ShaderBackground>
        <Header />
        <main className="absolute top-20 left-0 right-0 bottom-0 flex items-center justify-center z-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white/70">Checking your account...</p>
          </div>
        </main>
      </ShaderBackground>
    )
  }

  if (!authenticated) {
    return (
      <ShaderBackground>
        <Header />
        <main className="absolute inset-0 flex items-center justify-center z-20">
          <div className="text-center max-w-lg px-8">
            <h1 className="text-4xl font-light text-white mb-4">
              Please <span className="font-medium italic instrument">Sign In</span>
            </h1>
            <p className="text-white/70 mb-6">
              You need to authenticate with your wallet to access business onboarding.
            </p>
            <button 
              onClick={() => window.location.href = '/business-landing'}
              className="px-8 py-3 rounded-full bg-white text-black font-normal text-sm transition-all duration-200 hover:bg-white/90"
            >
              Go Back
            </button>
          </div>
        </main>
      </ShaderBackground>
    )
  }

  return (
    <ShaderBackground>
      <Header />
      <main className="absolute top-20 left-0 right-0 bottom-0 flex items-start justify-center z-20 py-8 overflow-y-auto">
        <div className="w-full max-w-2xl px-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-light text-white mb-4">
              Welcome to <span className="font-medium italic instrument">EzEarn</span>
            </h1>
            <p className="text-white/70 text-lg">
              Let's set up your business profile to get started with BrandHero
            </p>
          </div>
          
          <BusinessOnboardingForm walletAddress={user?.wallet?.address || ''} />
        </div>
      </main>
    </ShaderBackground>
  )
}