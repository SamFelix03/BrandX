"use client"

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import ShaderBackground from '../../components/shader-background'
import DashboardHeader from '../../components/dashboard-header'

interface AnalysisStatus {
  status: 'processing' | 'completed' | 'error'
  progress: string
  timestamp: string
  data?: any
}

export default function BrandAnalysisPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { authenticated, user, business, businessLoading, ready } = useAuthStore()
  
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>({
    status: 'processing',
    progress: 'Initializing brand research...',
    timestamp: new Date().toISOString()
  })
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null)
  const [timeElapsed, setTimeElapsed] = useState(0)

  useEffect(() => {
    if (!ready) return

    if (!authenticated || !business) {
      router.push('/business-landing')
      return
    }

    // Start the analysis process
    initiateAnalysis()

    // Start timer
    const timer = setInterval(() => {
      setTimeElapsed(prev => prev + 1)
    }, 1000)

    return () => {
      if (pollingInterval) clearInterval(pollingInterval)
      clearInterval(timer)
    }
  }, [ready, authenticated, business, router])

  const initiateAnalysis = async () => {
    if (!business) return

    try {
      // First, initiate the analysis
      const response = await fetch('/api/ai/suggest-bounties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessData: { 
            ...business, 
            id: business.id, 
            wallet_address: user?.wallet?.address 
          },
          action: 'initiate'
        })
      })

      const result = await response.json()
      
      if (result.success && result.status === 'processing') {
        setAnalysisStatus({
          status: 'processing',
          progress: result.progress,
          timestamp: result.timestamp
        })
        startStatusPolling()
      } else {
        throw new Error(result.error || 'Failed to initiate analysis')
      }
    } catch (error) {
      console.error('Failed to initiate analysis:', error)
      setAnalysisStatus({
        status: 'error',
        progress: 'Failed to start brand analysis',
        timestamp: new Date().toISOString()
      })
    }
  }

  const startStatusPolling = () => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch('/api/ai/suggest-bounties', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessData: { 
              ...business, 
              id: business?.id, 
              wallet_address: user?.wallet?.address 
            },
            action: 'status'
          })
        })

        const result = await response.json()
        
        if (result.success) {
          setAnalysisStatus({
            status: result.status,
            progress: result.progress,
            timestamp: result.timestamp,
            data: result.data
          })

          if (result.status === 'completed' && result.data) {
            clearInterval(interval)
            setPollingInterval(null)
            // Wait a moment to show completion, then redirect
            setTimeout(() => {
              router.push('/bounty-management')
            }, 3000)
          } else if (result.status === 'error') {
            clearInterval(interval)
            setPollingInterval(null)
          }
        }
      } catch (error) {
        console.error('Status polling error:', error)
      }
    }, 45000) // Poll every 45 seconds

    setPollingInterval(interval)
  }


  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const retryAnalysis = () => {
    setTimeElapsed(0)
    setAnalysisStatus({
      status: 'processing',
      progress: 'Retrying brand analysis...',
      timestamp: new Date().toISOString()
    })
    initiateAnalysis()
  }

  if (!ready || businessLoading) {
    return (
      <ShaderBackground>
        <DashboardHeader />
        <main className="absolute top-20 left-0 right-0 bottom-0 flex items-center justify-center z-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white/70">Loading...</p>
          </div>
        </main>
      </ShaderBackground>
    )
  }

  return (
    <ShaderBackground>
      <DashboardHeader business={business || undefined} />
      <main className="absolute top-20 left-0 right-0 bottom-0 z-20 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          
          {/* Header Section */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-light text-white mb-4">
              <span className="font-medium italic instrument">BrandHero</span> Analysis
            </h1>
            <p className="text-white/70 text-lg max-w-3xl mx-auto">
              Our AI is conducting a comprehensive analysis of {business?.business_name} to generate personalized bounty suggestions.
            </p>
          </div>

          {/* Business Info Card */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-medium text-white mb-2">{business?.business_name}</h2>
                <p className="text-white/70">{business?.description || "Analyzing business data..."}</p>
              </div>
              <div className="text-right">
                <div className="text-white/70 text-sm">Time Elapsed</div>
                <div className="text-white font-mono">{formatTime(timeElapsed)}</div>
              </div>
            </div>
          </div>

          {/* Analysis Status */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-medium text-white">Analysis Progress</h3>
              <div className="flex items-center text-white/60 text-sm">
                {analysisStatus.status === 'processing' && (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white/60 mr-2"></div>
                    Processing
                  </>
                )}
                {analysisStatus.status === 'completed' && (
                  <>
                    <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
                    Completed
                  </>
                )}
                {analysisStatus.status === 'error' && (
                  <>
                    <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
                    Error
                  </>
                )}
              </div>
            </div>

            {/* Current Status */}
            <div className="mb-6">
              <div className="text-white/70 text-sm mb-2">Current Status:</div>
              <div className="text-white text-lg">{analysisStatus.progress}</div>
            </div>

            {/* Progress Bar */}
            {analysisStatus.status === 'processing' && (
              <div className="mb-6">
                <div className="bg-white/10 rounded-full h-2 overflow-hidden">
                  <div className="bg-blue-400 h-full animate-pulse" style={{ width: '60%' }}></div>
                </div>
              </div>
            )}

            {/* Status Messages */}
            {analysisStatus.status === 'completed' && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                <div className="flex items-center text-green-300 mb-2">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Analysis Complete!
                </div>
                <div className="text-green-200 text-sm">
                  Your brand analysis is ready. Redirecting to bounty management...
                </div>
              </div>
            )}

            {analysisStatus.status === 'error' && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-red-300 font-medium mb-1">Analysis Failed</div>
                    <div className="text-red-200 text-sm">
                      Something went wrong during the analysis process.
                    </div>
                  </div>
                  <button
                    onClick={retryAnalysis}
                    className="px-4 py-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}

            <div className="text-white/50 text-xs mt-4">
              Last updated: {new Date(analysisStatus.timestamp).toLocaleString()}
            </div>
          </div>

          {/* Info Card */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <h4 className="text-white font-medium mb-3">What's Happening</h4>
            <div className="space-y-2 text-white/70 text-sm">
              <p>• Analyzing web mentions and online presence</p>
              <p>• Processing social media sentiment data</p>
              <p>• Evaluating market positioning and competitors</p>
              <p>• Generating personalized bounty recommendations</p>
            </div>
            <div className="mt-4 text-white/50 text-xs">
              This process typically takes 2-5 minutes depending on your brand's online presence.
            </div>
          </div>
        </div>
      </main>
    </ShaderBackground>
  )
}
