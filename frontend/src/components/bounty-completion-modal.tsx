"use client"

import { useState } from 'react'

interface ContractBounty {
  id: string
  title: string
  description: string
  isActive: boolean
  expiry: string
  maxCompletions: string
  currentCompletions: string
  rewardTemplateId?: string
}

interface BountyCompletionModalProps {
  isOpen: boolean
  onClose: () => void
  bounty: ContractBounty | null
  contractAddress: string
  userAddress: string
}

type ModalState = 'form' | 'submitting' | 'success' | 'error'

export default function BountyCompletionModal({
  isOpen,
  onClose,
  bounty,
  contractAddress,
  userAddress
}: BountyCompletionModalProps) {
  const [modalState, setModalState] = useState<ModalState>('form')
  const [proofImage, setProofImage] = useState<File | null>(null)
  const [proofImageUrl, setProofImageUrl] = useState<string>('')
  const [description, setDescription] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleImageUpload = async (file: File) => {
    try {
      setUploadingImage(true)
      const formData = new FormData()
      formData.append('file', file)
      formData.append('bucket', 'business-profiles')

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (data.success) {
        setProofImageUrl(data.url)
        setProofImage(file)
      } else {
        throw new Error(data.error || 'Upload failed')
      }
    } catch (error) {
      console.error('Image upload error:', error)
      setErrorMessage('Failed to upload image. Please try again.')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrorMessage('Please select an image file')
        return
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setErrorMessage('Image size must be less than 10MB')
        return
      }

      setErrorMessage('')
      handleImageUpload(file)
    }
  }

  const handleSubmit = async () => {
    if (!proofImageUrl || !description.trim()) {
      setErrorMessage('Please provide both proof image and description')
      return
    }

    if (!bounty) return

    try {
      setModalState('submitting')
      setErrorMessage('')

      // Call our API route for bounty completion
      const response = await fetch('/api/bounty/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contractAddress,
          userAddress,
          bountyId: bounty.id,
          bountyDescription: bounty.description,
          userDescription: description,
          imageUrl: proofImageUrl
        })
      })

      const result = await response.json()
      
      if (response.ok && result.success && result.verified) {
        setModalState('success')
        
        // Auto-close after success
        setTimeout(() => {
          onClose()
          resetModal()
        }, 3000)
      } else {
        setModalState('error')
        setErrorMessage(result.message || 'Verification failed. Please check your submission and try again.')
      }
    } catch (error) {
      console.error('Bounty completion error:', error)
      setModalState('error')
      setErrorMessage('Failed to submit bounty completion. Please try again.')
    }
  }

  const resetModal = () => {
    setModalState('form')
    setProofImage(null)
    setProofImageUrl('')
    setDescription('')
    setErrorMessage('')
    setUploadingImage(false)
  }

  const handleClose = () => {
    onClose()
    resetModal()
  }

  if (!isOpen || !bounty) return null

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <div className="bg-black/40 backdrop-blur-md rounded-xl border border-white/20 w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h3 className="text-xl font-medium text-white">Complete Bounty</h3>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {modalState === 'form' && (
            <div className="p-6 space-y-6">
              
              {/* Bounty Info */}
              <div className="bg-black/20 rounded-lg p-4 border border-white/10">
                <h4 className="text-white font-medium mb-2">{bounty.title}</h4>
                <p className="text-white/70 text-sm">{bounty.description}</p>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-white font-medium mb-3">Proof Image</label>
                <div className="border-2 border-dashed border-white/30 rounded-lg p-8 text-center">
                  {proofImageUrl ? (
                    <div className="space-y-4">
                      <img
                        src={proofImageUrl}
                        alt="Proof"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => {
                          setProofImageUrl('')
                          setProofImage(null)
                        }}
                        className="text-white/60 hover:text-white text-sm"
                      >
                        Change Image
                      </button>
                    </div>
                  ) : (
                    <div>
                      {uploadingImage ? (
                        <div className="flex flex-col items-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-2"></div>
                          <p className="text-white/70 text-sm">Uploading...</p>
                        </div>
                      ) : (
                        <div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                            id="proof-image"
                          />
                          <label
                            htmlFor="proof-image"
                            className="cursor-pointer flex flex-col items-center"
                          >
                            <svg className="w-12 h-12 text-white/40 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            <p className="text-white/70 text-sm mb-1">Click to upload proof image</p>
                            <p className="text-white/50 text-xs">PNG, JPG up to 10MB</p>
                          </label>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-white font-medium mb-3">What did you do?</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 bg-black/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/50 resize-none"
                  placeholder="Describe how you completed this bounty..."
                  rows={4}
                />
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  <p className="text-red-300 text-sm">{errorMessage}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={!proofImageUrl || !description.trim() || uploadingImage}
                className="w-full px-6 py-3 bg-white text-black rounded-lg hover:bg-white/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit for Verification
              </button>
            </div>
          )}

          {modalState === 'submitting' && (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-6"></div>
              <h4 className="text-xl font-medium text-white mb-2">Verifying Your Work</h4>
              <p className="text-white/70">Our AI is analyzing your submission...</p>
            </div>
          )}

          {modalState === 'success' && (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h4 className="text-xl font-medium text-white mb-3">🎉 Bounty Completed!</h4>
              <p className="text-white/80 mb-4 leading-relaxed">
                Congratulations! Your submission has been verified by our AI and your bounty reward has been credited to your account.
              </p>
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                  </svg>
                  <span className="text-green-300 font-medium">Reward Earned!</span>
                </div>
                <p className="text-green-200 text-sm">
                  Your reward has been added to your wallet. View it in the "My Rewards" tab to use your earned vouchers and see your updated points balance.
                </p>
              </div>
              <p className="text-white/60 text-sm">
                This window will close automatically in a few seconds...
              </p>
            </div>
          )}

          {modalState === 'error' && (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h4 className="text-xl font-medium text-white mb-2">Verification Failed</h4>
              <p className="text-white/70 mb-6">{errorMessage}</p>
              <button
                onClick={() => setModalState('form')}
                className="px-6 py-2 bg-black/30 text-white rounded-lg hover:bg-black/40 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}