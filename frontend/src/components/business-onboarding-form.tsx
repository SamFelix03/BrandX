"use client"

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePrivy } from '@privy-io/react-auth'
import { useAuthStore } from '@/stores/auth-store'

interface BusinessOnboardingFormProps {
  walletAddress: string
}

export default function BusinessOnboardingForm({ walletAddress }: BusinessOnboardingFormProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { logout } = usePrivy()
  const fetchBusiness = useAuthStore((state) => state.fetchBusiness)
  
  const [formData, setFormData] = useState({
    business_name: '',
    description: '',
    location: '',
    website: '',
    ens_domain: '',
    social_links: {
      instagram: '',
      twitter: '',
      facebook: '',
      linkedin: ''
    },
    is_token_issuer: false,
    token_contract_address: '',
    profile_picture_url: ''
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [previewImage, setPreviewImage] = useState<string>('')
  const [ensVerifying, setEnsVerifying] = useState(false)
  const [ensError, setEnsError] = useState<string>('')
  const [ensVerified, setEnsVerified] = useState(false)
  const [showWalletDropdown, setShowWalletDropdown] = useState(false)
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

  const verifyEnsOwnership = async (domain: string) => {
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
      } else {
        setEnsError(result.error || 'ENS verification failed')
        setEnsVerified(false)
      }
    } catch (error) {
      setEnsError('Failed to verify ENS domain')
      setEnsVerified(false)
    } finally {
      setEnsVerifying(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }))
    } else if (name.startsWith('social_')) {
      const platform = name.split('social_')[1]
      setFormData(prev => ({
        ...prev,
        social_links: {
          ...prev.social_links,
          [platform]: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))

      // Reset ENS verification state when domain changes
      if (name === 'ens_domain') {
        setEnsError('')
        setEnsVerified(false)
      }
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('bucket', 'business-profiles')

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()
      
      if (result.success) {
        setFormData(prev => ({
          ...prev,
          profile_picture_url: result.url
        }))
        setPreviewImage(result.url)
      } else {
        console.error('Upload failed:', result.error)
      }
    } catch (error) {
      console.error('Upload error:', error)
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/businesses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          wallet_address: walletAddress
        })
      })

      const result = await response.json()
      
      if (result.success) {
        // Refresh the business data in our store
        await fetchBusiness(walletAddress)
        router.push('/bounty-management')
      } else {
        console.error('Submission failed:', result.error)
        alert('Failed to submit form. Please try again.')
      }
    } catch (error) {
      console.error('Submission error:', error)
      alert('Network error. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Connected Wallet Display */}
      <div className="flex justify-center mb-8">
        <div 
          ref={dropdownRef}
          className={`bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 text-white transition-all duration-300 ${
            showWalletDropdown ? 'w-80' : 'w-auto'
          }`}
        >
          {!showWalletDropdown ? (
            // Collapsed wallet display
            <button
              type="button"
              onClick={() => setShowWalletDropdown(true)}
              className="flex items-center gap-2 px-4 py-2 hover:bg-white/20 transition-all duration-200 rounded-lg w-full"
            >
              <div className="w-2 h-2 rounded-full bg-green-400"></div>
              <span className="font-mono text-sm">{formatWalletAddress(walletAddress)}</span>
              <svg 
                className="w-4 h-4" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          ) : (
            // Expanded dropdown content
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
                <div className="font-mono text-white text-sm break-all">{walletAddress}</div>
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

      <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
        
        {/* Profile Picture & ENS Domain Row */}
        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Profile Picture */}
            <div>
              <label className="block text-white font-medium mb-3">Profile Picture</label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
                  {previewImage ? (
                    <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-8 h-8 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50"
                >
                  {uploadingImage ? 'Uploading...' : 'Upload Image'}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            </div>

            {/* ENS Domain */}
            <div>
              <label htmlFor="ens_domain" className="block text-white font-medium mb-3">
                ENS Domain *
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="ens_domain"
                  name="ens_domain"
                  value={formData.ens_domain}
                  onChange={handleInputChange}
                  required
                  className={`w-full px-4 py-3 pr-20 bg-white/10 border rounded-lg text-white placeholder-white/60 focus:outline-none ${
                    ensError ? 'border-red-500' : ensVerified ? 'border-green-500' : 'border-white/30 focus:border-white/50'
                  }`}
                  placeholder="yourname.eth"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => verifyEnsOwnership(formData.ens_domain)}
                    disabled={!formData.ens_domain.trim() || ensVerifying}
                    className="px-2 py-1 text-xs bg-white/20 hover:bg-white/30 disabled:bg-white/10 text-white disabled:text-white/50 rounded transition-colors disabled:cursor-not-allowed"
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
                <p className="text-red-400 text-xs mt-2">{ensError}</p>
              )}
              {ensVerified && (
                <p className="text-green-400 text-xs mt-2">✅ ENS verified</p>
              )}
              <p className="text-white/50 text-xs mt-1">
                Your ENS domain must resolve to your connected wallet
              </p>
            </div>
          </div>
        </div>

        {/* Business Name */}
        <div className="mb-4">
          <label htmlFor="business_name" className="block text-white font-medium mb-2">
            Business Name *
          </label>
          <input
            type="text"
            id="business_name"
            name="business_name"
            value={formData.business_name}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/50"
            placeholder="Enter your business name"
          />
        </div>

        {/* Description */}
        <div className="mb-4">
          <label htmlFor="description" className="block text-white font-medium mb-2">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/50"
            placeholder="Tell us about your business"
          />
        </div>

        {/* Location */}
        <div className="mb-4">
          <label htmlFor="location" className="block text-white font-medium mb-2">
            Location
          </label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleInputChange}
            className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/50"
            placeholder="City, State/Country"
          />
        </div>

        {/* Website */}
        <div className="mb-4">
          <label htmlFor="website" className="block text-white font-medium mb-2">
            Website
          </label>
          <input
            type="url"
            id="website"
            name="website"
            value={formData.website}
            onChange={handleInputChange}
            className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/50"
            placeholder="https://yourwebsite.com"
          />
        </div>

        {/* Social Links */}
        <div className="mb-6">
          <label className="block text-white font-medium mb-3">Social Media Links</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(formData.social_links).map(([platform, value]) => (
              <input
                key={platform}
                type="url"
                name={`social_${platform}`}
                value={value}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/50"
                placeholder={`${platform.charAt(0).toUpperCase() + platform.slice(1)} URL`}
              />
            ))}
          </div>
        </div>

        {/* Token Issuer */}
        <div className="mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="checkbox"
                id="is_token_issuer"
                name="is_token_issuer"
                checked={formData.is_token_issuer}
                onChange={handleInputChange}
                className="sr-only"
              />
              <label 
                htmlFor="is_token_issuer" 
                className={`flex items-center justify-center w-5 h-5 rounded border-2 cursor-pointer transition-all duration-200 ${
                  formData.is_token_issuer 
                    ? 'bg-white border-white' 
                    : 'bg-transparent border-white/40 hover:border-white/60'
                }`}
              >
                {formData.is_token_issuer && (
                  <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </label>
            </div>
            <label htmlFor="is_token_issuer" className="text-white font-medium cursor-pointer">
              I have a token/crypto project (enables Web3 rewards)
            </label>
          </div>
        </div>

        {/* Token Contract Address */}
        {formData.is_token_issuer && (
          <div className="mb-4">
            <label htmlFor="token_contract_address" className="block text-white font-medium mb-2">
              Token Contract Address
            </label>
            <input
              type="text"
              id="token_contract_address"
              name="token_contract_address"
              value={formData.token_contract_address}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/50"
              placeholder="0x..."
            />
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={
            isSubmitting || 
            !formData.business_name || 
            !formData.ens_domain ||
            !ensVerified ||
            ensVerifying
          }
          className="w-full px-8 py-4 bg-white text-black rounded-lg font-medium text-lg transition-all duration-200 hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Creating Your Profile...' : 'Continue to BrandHero Setup'}
        </button>
        {(!formData.ens_domain || !ensVerified) && !ensVerifying && (
          <p className="text-amber-400 text-sm mt-2 text-center">
            Please enter and verify your ENS domain ownership before continuing
          </p>
        )}
      </div>
    </form>
    </div>
  )
}