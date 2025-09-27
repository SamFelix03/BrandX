"use client"

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import ConsumerHeader from "../../components/consumer-header"
import ShaderBackground from "../../components/shader-background"

interface UserProfile {
  id: string
  wallet_address: string
  username: string
  display_name?: string
  bio?: string
  profile_picture_url?: string
  location?: string
  website?: string
  social_links?: Record<string, string>
  created_at: string
  updated_at: string
}

export default function UserProfile() {
  const router = useRouter()
  const { authenticated, user, ready } = useAuthStore()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(true) // Start in editing mode for new users
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form state
  const [formData, setFormData] = useState({
    username: '',
    display_name: '',
    bio: '',
    profile_picture_url: '',
    location: '',
    website: '',
    social_links: {
      twitter: '',
      instagram: '',
      linkedin: '',
      github: ''
    }
  })

  // Required fields for profile completion
  const requiredFields = ['username', 'display_name', 'bio', 'profile_picture_url']
  
  const isProfileComplete = () => {
    return requiredFields.every(field => {
      const value = formData[field as keyof typeof formData]
      return value && typeof value === 'string' && value.trim() !== ''
    })
  }

  const getMissingFields = () => {
    return requiredFields.filter(field => {
      const value = formData[field as keyof typeof formData]
      return !value || (typeof value === 'string' && value.trim() === '')
    })
  }

  useEffect(() => {
    // Wait for Privy to be ready before making auth decisions
    if (!ready) return
    
    if (!authenticated) {
      router.push('/consumer-auth')
      return
    }
    
    if (user?.wallet?.address) {
      fetchProfile()
    }
  }, [authenticated, user?.wallet?.address, ready, router])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/user-profiles?wallet_address=${user?.wallet?.address}`)
      const data = await response.json()

      if (response.ok) {
        if (data.profile) {
          setProfile(data.profile)
          setFormData({
            username: data.profile.username || '',
            display_name: data.profile.display_name || '',
            bio: data.profile.bio || '',
            profile_picture_url: data.profile.profile_picture_url || '',
            location: data.profile.location || '',
            website: data.profile.website || '',
            social_links: {
              twitter: data.profile.social_links?.twitter || '',
              instagram: data.profile.social_links?.instagram || '',
              linkedin: data.profile.social_links?.linkedin || '',
              github: data.profile.social_links?.github || ''
            }
          })
          setIsEditing(false) // User has profile, start in view mode
        } else {
          setIsEditing(true) // No profile, start in edit mode
        }
      } else {
        setError(data.error || 'Failed to fetch profile')
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err)
      setError('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!user?.wallet?.address) return

    try {
      setSaving(true)
      setError(null)

      const response = await fetch('/api/user-profiles', {
        method: profile ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: user.wallet.address,
          ...formData
        })
      })

      const data = await response.json()

      if (response.ok) {
        setProfile(data.profile)
        setIsEditing(false)
        alert(profile ? 'Profile updated successfully!' : 'Profile created successfully!')
      } else {
        setError(data.error || 'Failed to save profile')
      }
    } catch (err) {
      console.error('Failed to save profile:', err)
      setError('Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith('social_links.')) {
      const socialField = field.split('.')[1]
      setFormData(prev => ({
        ...prev,
        social_links: {
          ...prev.social_links,
          [socialField]: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
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
      } else {
        console.error('Upload failed:', result.error)
        setError('Failed to upload image')
      }
    } catch (error) {
      console.error('Upload error:', error)
      setError('Failed to upload image')
    } finally {
      setUploadingImage(false)
    }
  }

  // Show loading state while Privy is initializing
  if (!ready) {
    return (
      <ShaderBackground>
        <ConsumerHeader />
        <main className="absolute top-20 left-0 right-0 bottom-0 flex items-center justify-center z-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white/70">Initializing...</p>
          </div>
        </main>
      </ShaderBackground>
    )
  }

  if (!authenticated) {
    return (
      <ShaderBackground>
        <ConsumerHeader />
        <main className="absolute top-20 left-0 right-0 bottom-0 flex items-center justify-center z-20">
          <div className="text-center max-w-lg px-8">
            <h1 className="text-4xl font-light text-white mb-4">
              Please <span className="font-medium italic instrument">Connect Wallet</span>
            </h1>
            <p className="text-white/70 mb-6">
              You need to connect your wallet to access your profile.
            </p>
            <button 
              onClick={() => router.push('/consumer-auth')}
              className="px-8 py-3 rounded-full bg-white text-black font-normal text-sm transition-all duration-200 hover:bg-white/90"
            >
              Sign In
            </button>
          </div>
        </main>
      </ShaderBackground>
    )
  }

  if (loading) {
    return (
      <ShaderBackground>
        <ConsumerHeader />
        <main className="absolute top-20 left-0 right-0 bottom-0 flex items-center justify-center z-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white/70">Loading profile...</p>
          </div>
        </main>
      </ShaderBackground>
    )
  }

  return (
    <ShaderBackground>
      <ConsumerHeader />
      <main className="absolute top-20 left-0 right-0 bottom-0 z-20 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          
          {/* Back Button */}
          <div className="mb-6">
            <button
              onClick={() => router.push('/consumer-landing')}
              className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm">Back to Businesses</span>
            </button>
          </div>

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-light text-white mb-2">
                {profile ? 'My' : 'Create'} <span className="font-medium italic instrument">Profile</span>
              </h1>
              <p className="text-white/70">
                {profile ? 'Manage your EzEarn profile' : 'Complete your profile to join loyalty programs'}
              </p>
            </div>
            
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-6 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors border border-white/20"
            >
              {isEditing ? 'Cancel' : (profile ? 'Edit Profile' : 'Create Profile')}
            </button>
          </div>

          {/* Profile Completion Status */}
          {(profile || !loading) && (
            <div className={`rounded-xl p-6 mb-8 border ${
              isProfileComplete() 
                ? 'bg-green-500/10 border-green-500/20' 
                : 'bg-yellow-500/10 border-yellow-500/20'
            }`}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-3 h-3 rounded-full ${
                  isProfileComplete() ? 'bg-green-400' : 'bg-yellow-400'
                }`}></div>
                <h3 className="text-white font-medium text-lg">
                  {isProfileComplete() ? 'Profile Complete' : 'Profile Incomplete'}
                </h3>
              </div>
              
              {isProfileComplete() ? (
                <p className="text-green-300 text-sm">
                  ✅ Your profile is complete! You can now join loyalty programs and participate in bounties.
                </p>
              ) : (
                <div className="space-y-3">
                  <p className="text-yellow-300 text-sm">
                    ⚠️ Complete the following required fields to access loyalty programs:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {getMissingFields().map(field => (
                      <span key={field} className="px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-xs font-medium">
                        {field.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
              <p className="text-red-300">{error}</p>
            </div>
          )}

          {/* Profile Form */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Profile Picture Section */}
              <div className="lg:col-span-1">
                <div className="text-center">
                  <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-gradient-to-br from-white/20 to-white/10 border-2 border-white/20 flex items-center justify-center overflow-hidden">
                    {formData.profile_picture_url ? (
                      <img
                        src={formData.profile_picture_url}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-medium text-4xl">
                        {formData.username.charAt(0).toUpperCase() || '?'}
                      </span>
                    )}
                  </div>
                  
                  {isEditing && (
                    <div className="space-y-2">
                      <label className="block text-white/70 text-sm mb-2">
                        Profile Picture <span className="text-red-400">*</span>
                        {!formData.profile_picture_url && <span className="text-red-400 text-xs ml-2">Required</span>}
                      </label>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingImage}
                        className="w-full px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50 border border-white/30"
                      >
                        {uploadingImage ? 'Uploading...' : (formData.profile_picture_url ? 'Change Image' : 'Upload Image')}
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Profile Details */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Username */}
                <div>
                  <label className="block text-white/70 text-sm mb-2">
                    Username <span className="text-red-400">*</span>
                    {!formData.username && <span className="text-red-400 text-xs ml-2">Required</span>}
                  </label>
                  <div className="mb-2">
                    <p className="text-white/50 text-xs">
                      Your username will be used to create your ENS subdomain (username.ezearn.eth)
                    </p>
                  </div>
                  {isEditing && !profile?.username ? (
                    // New user can set username
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => handleInputChange('username', e.target.value)}
                      className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/50"
                      placeholder="Enter your username (permanent)"
                      required
                    />
                  ) : (
                    // Username is permanent once set
                    <div className="px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white flex items-center gap-2">
                      @{formData.username || 'Not set'}
                      {profile?.username && (
                        <span className="text-xs text-white/60 bg-white/10 px-2 py-1 rounded-full">permanent</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Display Name */}
                <div>
                  <label className="block text-white/70 text-sm mb-2">
                    Display Name <span className="text-red-400">*</span>
                    {!formData.display_name && <span className="text-red-400 text-xs ml-2">Required</span>}
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.display_name}
                      onChange={(e) => handleInputChange('display_name', e.target.value)}
                      className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/50"
                      placeholder="Your display name"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white">
                      {formData.display_name || 'Not set'}
                    </div>
                  )}
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-white/70 text-sm mb-2">
                    Bio <span className="text-red-400">*</span>
                    {!formData.bio && <span className="text-red-400 text-xs ml-2">Required</span>}
                  </label>
                  {isEditing ? (
                    <textarea
                      value={formData.bio}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/50 h-24 resize-none"
                      placeholder="Tell us about yourself..."
                    />
                  ) : (
                    <div className="px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white min-h-[6rem]">
                      {formData.bio || 'Not set'}
                    </div>
                  )}
                </div>

                {/* Location */}
                <div>
                  <label className="block text-white/70 text-sm mb-2">Location</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/50"
                      placeholder="City, Country"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white">
                      {formData.location || 'Not set'}
                    </div>
                  )}
                </div>

                {/* Website */}
                <div>
                  <label className="block text-white/70 text-sm mb-2">Website</label>
                  {isEditing ? (
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/50"
                      placeholder="https://yourwebsite.com"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white">
                      {formData.website ? (
                        <a href={formData.website} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                          {formData.website}
                        </a>
                      ) : (
                        'Not set'
                      )}
                    </div>
                  )}
                </div>

                {/* Social Links */}
                <div>
                  <label className="block text-white/70 text-sm mb-3">Social Links</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(formData.social_links).map(([platform, url]) => (
                      <div key={platform}>
                        <label className="block text-white/60 text-xs mb-1 capitalize">{platform}</label>
                        {isEditing ? (
                          <input
                            type="url"
                            value={url}
                            onChange={(e) => handleInputChange(`social_links.${platform}`, e.target.value)}
                            className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/50 text-sm"
                            placeholder={`https://${platform}.com/username`}
                          />
                        ) : (
                          <div className="px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white text-sm">
                            {url ? (
                              <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                                {url}
                              </a>
                            ) : (
                              'Not set'
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Save Button */}
                {isEditing && (
                  <div className="pt-6 border-t border-white/10">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-white/60">
                        {isProfileComplete() ? (
                          <span className="text-green-400">✅ Profile Complete</span>
                        ) : (
                          <span className="text-yellow-400">
                            ⚠️ {getMissingFields().length} required field{getMissingFields().length !== 1 ? 's' : ''} missing
                          </span>
                        )}
                      </div>
                      <button
                        onClick={handleSave}
                        disabled={saving || !formData.username}
                        className="px-8 py-3 bg-white text-black rounded-lg hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                      >
                        {saving ? 'Saving...' : (profile ? 'Update Profile' : 'Create Profile')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </ShaderBackground>
  )
}