"use client"

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'

interface BusinessOnboardingFormProps {
  walletAddress: string
}

export default function BusinessOnboardingForm({ walletAddress }: BusinessOnboardingFormProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const fetchBusiness = useAuthStore((state) => state.fetchBusiness)
  
  const [formData, setFormData] = useState({
    business_name: '',
    description: '',
    location: '',
    website: '',
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
        router.push('/business-dashboard')
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
        
        {/* Profile Picture */}
        <div className="mb-6">
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
          disabled={isSubmitting || !formData.business_name}
          className="w-full px-8 py-4 bg-white text-black rounded-lg font-medium text-lg transition-all duration-200 hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Creating Your Profile...' : 'Continue to BrandHero Setup'}
        </button>
      </div>
    </form>
  )
}