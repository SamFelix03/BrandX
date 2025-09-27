"use client"

import { useState, useRef, useEffect } from 'react'
import { usePrivy } from '@privy-io/react-auth'

interface EnsDomainMigrationProps {
  walletAddress: string
  onDomainVerified: (domain: string) => void
}

export default function EnsDomainMigration({ walletAddress, onDomainVerified }: EnsDomainMigrationProps) {
  const { logout } = usePrivy()
  const [showWalletDropdown, setShowWalletDropdown] = useState(false)
  const [domain, setDomain] = useState('')
  const [ensVerifying, setEnsVerifying] = useState(false)
  const [ensError, setEnsError] = useState<string>('')
  const [ensVerified, setEnsVerified] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowWalletDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const formatWalletAddress = (address: string) => {
    if (!address) return ''
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const handleLogout = () => {
    logout()
    setShowWalletDropdown(false)
  }

  const verifyDomainOwnership = async (domain: string) => {
    if (!domain.trim()) {
      setEnsError('')
      setEnsVerified(false)
      return
    }

    setEnsVerifying(true)
    setEnsError('')
    setEnsVerified(false)

    try {
      const response = await fetch('/api/verify-ens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ens_domain: domain,
          wallet_address: walletAddress
        })
      })

      const result = await response.json()
      console.log('ENS verification response:', result)
      
      if (result.success) {
        setEnsVerified(true)
        setEnsError('')
        onDomainVerified(domain)
      } else {
        setEnsError(result.error || 'Domain verification failed')
        setEnsVerified(false)
      }
    } catch (error) {
      setEnsError('Failed to verify domain ownership')
      setEnsVerified(false)
    } finally {
      setEnsVerifying(false)
    }
  }

  const handleDomainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setDomain(value)
    // Reset verification state when domain changes
    setEnsError('')
    setEnsVerified(false)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const steps = [
    {
      number: 1,
      title: "Access Your Domain DNS Configuration",
      description: "Go to your domain registrar's DNS management page (e.g., GoDaddy, Namecheap, Cloudflare)",
      icon: "🌐"
    },
    {
      number: 2,
      title: "Enable DNSSEC",
      description: "Turn on DNSSEC in your DNS settings to ensure domain security",
      icon: "🔒"
    },
    {
      number: 3,
      title: "Add TXT Record",
      description: "Add the following TXT record to your DNS records:",
      icon: "📝"
    },
    {
      number: 4,
      title: "Get Test ETH",
      description: "Get Sepolia ETH from Google's Web3 faucet for transaction fees",
      icon: "💰"
    },
    {
      number: 5,
      title: "Import Domain to ENS",
      description: "Import your domain to ENS on-chain using the ENS app",
      icon: "🔗"
    }
  ]

  return (
    <div className="space-y-8">
      {/* Connected Wallet Display */}
      <div className="flex justify-center mb-8">
        <div 
          ref={dropdownRef}
          className={`bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 text-white transition-all duration-300 ${
            showWalletDropdown ? 'w-80' : 'w-auto'
          }`}
        >
          {!showWalletDropdown ? (
            <button
              type="button"
              onClick={() => setShowWalletDropdown(true)}
              className="flex items-center gap-2 px-4 py-2 hover:bg-white/20 transition-all duration-200 rounded-lg w-full"
            >
              <div className="w-2 h-2 rounded-full bg-green-400"></div>
              <span className="text-sm">{formatWalletAddress(walletAddress)}</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          ) : (
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-medium text-sm">Connected Wallet</h3>
                <button
                  type="button"
                  onClick={() => setShowWalletDropdown(false)}
                  className="p-1 text-white/70 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              </div>
              
              <div className="flex items-center gap-2 mb-6">
                <div className="w-2 h-2 rounded-full bg-green-400"></div>
                <div className="text-white text-sm break-all">{walletAddress}</div>
              </div>
              
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-md transition-colors text-sm flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-light text-white mb-4">
          Migrate Your Domain to <span className="font-medium italic instrument">ENS</span>
        </h1>
        <p className="text-white/70 text-lg max-w-2xl mx-auto">
          Follow these simple steps to migrate your company domain to ENS and verify ownership for BrandX
        </p>
      </div>

      {/* Domain Entry Field */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 mb-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-light text-white mb-2">Enter Your Domain</h2>
          <p className="text-white/70">Start by entering your domain name below</p>
        </div>
        
        <div className="max-w-md mx-auto">
          <div className="relative">
            <input
              type="text"
              id="domain"
              value={domain}
              onChange={handleDomainChange}
              className={`w-full px-4 py-3 pr-20 bg-white/10 border rounded-lg text-white placeholder-white/60 focus:outline-none ${
                ensError ? 'border-red-500' : ensVerified ? 'border-green-500' : 'border-white/30 focus:border-white/50'
              }`}
              placeholder="yourdomain.com"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => verifyDomainOwnership(domain)}
                disabled={!domain.trim() || ensVerifying}
                className="px-3 py-1 text-sm bg-white/20 hover:bg-white/30 disabled:bg-white/10 text-white disabled:text-white/50 rounded transition-colors disabled:cursor-not-allowed"
              >
                {ensVerifying ? 'Verifying...' : 'Verify'}
              </button>
              {ensVerifying && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              {!ensVerifying && ensVerified && (
                <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
              {!ensVerifying && ensError && (
                <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              )}
            </div>
          </div>
          {ensError && (
            <p className="text-red-400 text-sm mt-2 text-center">{ensError}</p>
          )}
          {ensVerified && (
            <p className="text-green-400 text-sm mt-2 text-center">✅ Domain verified successfully!</p>
          )}
        </div>
      </div>

      {/* Steps */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
        <div className="space-y-8">
          {steps.map((step, index) => (
            <div key={step.number} className="flex gap-6">
              {/* Step Number */}
              <div className="flex-shrink-0">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold transition-all duration-300 ${
                  currentStep >= step.number 
                    ? 'bg-white text-black' 
                    : 'bg-white/20 text-white/60'
                }`}>
                  {step.number}
                </div>
              </div>

              {/* Step Content */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-white font-medium text-lg">{step.title}</h3>
                </div>
                <p className="text-white/70 mb-4">{step.description}</p>

                {/* Step-specific content */}
                {step.number === 3 && (
                  <div className="bg-black/20 rounded-lg p-4 border border-white/10">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-white/60">Type:</span>
                        <div className="text-white bg-white/10 px-3 py-2 rounded-lg mt-1">TXT</div>
                      </div>
                      <div>
                        <span className="text-white/60">Name:</span>
                        <div className="text-white bg-white/10 px-3 py-2 rounded-lg mt-1">_ens</div>
                      </div>
                      <div>
                        <span className="text-white/60">Data:</span>
                        <div className="mt-1">
                          <div className="flex items-center gap-2">
                            <div className="text-white bg-white/10 px-3 py-2 rounded-lg flex-1 break-all text-sm">
                              a={walletAddress}
                            </div>
                            <button
                              onClick={() => copyToClipboard(`a=${walletAddress}`)}
                              className="px-3 py-2 bg-white/20 hover:bg-white/30 text-white text-sm rounded-lg transition-colors"
                            >
                              Copy
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                      <p className="text-amber-200 text-sm">
                        ⚠️ Make sure this is the wallet address you want your company domain to be associated with
                      </p>
                    </div>
                  </div>
                )}

                {step.number === 4 && (
                  <div className="bg-black/20 rounded-lg p-4 border border-white/10">
                    <div className="mb-4">
                      <span className="text-white font-medium block mb-2">Your Wallet Address:</span>
                      <div className="flex items-center gap-2">
                        <div className="text-white bg-white/10 px-3 py-2 rounded-lg flex-1 break-all text-sm">
                          {walletAddress}
                        </div>
                        <button
                          onClick={() => copyToClipboard(walletAddress)}
                          className="px-3 py-2 bg-white/20 hover:bg-white/30 text-white text-sm rounded-lg transition-colors"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                    <a
                      href="https://cloud.google.com/application/web3/faucet/ethereum/sepolia"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg font-medium transition-all duration-200 hover:bg-white/90"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Get Sepolia ETH
                    </a>
                  </div>
                )}

                {step.number === 5 && (
                  <div className="bg-black/20 rounded-lg p-4 border border-white/10">
                    <p className="text-white/70 mb-3">Click the link below and select "Import on-chain":</p>
                    <div className="mb-3">
                      <div className="flex items-center gap-2">
                        <div className="text-white bg-white/10 px-3 py-2 rounded-lg flex-1 break-all text-sm">
                          https://sepolia.app.ens.domains/{domain || 'yourdomain.com'}/import
                        </div>
                        <button
                          onClick={() => copyToClipboard(`https://sepolia.app.ens.domains/${domain || 'yourdomain.com'}/import`)}
                          className="px-3 py-2 bg-white/20 hover:bg-white/30 text-white text-sm rounded-lg transition-colors"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                    <a
                      href={`https://sepolia.app.ens.domains/${domain || 'yourdomain.com'}/import`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg font-medium transition-all duration-200 hover:bg-white/90"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Import Domain to ENS
                    </a>
                  </div>
                )}

              </div>
            </div>
          ))}
        </div>

        {/* Continue Button */}
        <div className="mt-8 pt-6 border-t border-white/20">
          <button
            onClick={() => onDomainVerified(domain)}
            disabled={!ensVerified || ensVerifying}
            className="w-full px-8 py-4 bg-white text-black rounded-lg font-medium text-lg transition-all duration-200 hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {ensVerified ? 'Continue to Business Profile Setup' : 'Verify Domain to Continue'}
          </button>
          {!ensVerified && !ensVerifying && (
            <p className="text-amber-400 text-sm mt-2 text-center">
              Please complete all steps and verify your domain ownership before continuing
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
