"use client"

import { useState } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import ShaderBackground from '../../components/shader-background'
import Header from '../../components/header'
import BusinessOnboardingForm from '../../components/business-onboarding-form'
import EnsDomainMigration from '../../components/ens-domain-migration'

export default function BusinessOnboarding() {
  const { authenticated, user, businessLoading, ready } = useAuthStore()
  const [currentStage, setCurrentStage] = useState<'ens-migration' | 'business-profile'>('ens-migration')
  const [verifiedDomain, setVerifiedDomain] = useState<string>('')

  // Show loading state while Privy is initializing
  if (!ready) {
    return (
      <ShaderBackground>
        <Header />
        <main className="absolute top-20 left-0 right-0 bottom-0 flex items-center justify-center z-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white/70">Initializing...</p>
          </div>
        </main>
      </ShaderBackground>
    )
  }

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

  const handleDomainVerified = (domain: string) => {
    setVerifiedDomain(domain)
    setCurrentStage('business-profile')
  }

  const handleBackToEnsMigration = () => {
    setCurrentStage('ens-migration')
    setVerifiedDomain('')
  }

  return (
    <ShaderBackground>
      <Header />
      <main className="absolute top-20 left-0 right-0 bottom-0 flex items-start justify-center z-20 py-8 overflow-y-auto">
        <div className="w-full max-w-4xl px-8">
          {/* Stage Navigation */}
          <div className="flex justify-center mb-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-1">
              <div className="flex gap-1">
                <button
                  onClick={() => setCurrentStage('ens-migration')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    currentStage === 'ens-migration'
                      ? 'bg-white text-black'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  ENS Migration
                </button>
                <button
                  onClick={() => currentStage === 'business-profile' ? undefined : undefined}
                  disabled={currentStage === 'ens-migration'}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    currentStage === 'business-profile'
                      ? 'bg-white text-black'
                      : 'text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed'
                  }`}
                >
                  Business Profile
                </button>
              </div>
            </div>
          </div>

          {currentStage === 'ens-migration' ? (
            <EnsDomainMigration 
              walletAddress={user?.wallet?.address || ''} 
              onDomainVerified={handleDomainVerified}
            />
          ) : (
            <div className="space-y-6">
              {/* Back Button */}
              <div className="flex justify-start">
                <button
                  onClick={handleBackToEnsMigration}
                  className="flex items-center gap-2 px-4 py-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to ENS Migration
                </button>
              </div>

              {/* Business Profile Setup */}
              <div className="text-center mb-8">
                <h1 className="text-4xl md:text-5xl font-light text-white mb-4">
                  Welcome to <span className="font-medium italic instrument">BrandX</span>
                </h1>
                <p className="text-white/70 text-lg">
                  Let's complete your business profile setup
                </p>
                {verifiedDomain && (
                  <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-lg">
                    <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-green-400 text-sm">Domain verified: {verifiedDomain}</span>
                  </div>
                )}
              </div>
              
              <BusinessOnboardingForm 
                walletAddress={user?.wallet?.address || ''} 
                prefillDomain={verifiedDomain}
              />
            </div>
          )}
        </div>
      </main>
    </ShaderBackground>
  )
}