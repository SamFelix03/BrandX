"use client"

import { useState } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useAuthStore } from '@/stores/auth-store'

export default function ConsumerHeader() {
  const { logout: privyLogout, user } = usePrivy()
  const storeLogout = useAuthStore((state) => state.logout)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  
  const handleLogout = () => {
    storeLogout()
    privyLogout()
  }

  // Format wallet address for display (show first 6 and last 4 characters)
  const formatWalletAddress = (address: string) => {
    if (!address) return ''
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  return (
    <header className="relative z-30 flex items-center justify-between p-6">
      {/* Logo */}
      <div className="flex items-center">
        <a href="/consumer-landing" className="cursor-pointer">
          <svg
            fill="currentColor"
            viewBox="0 0 147 70"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            className="size-10 translate-x-[-0.5px] text-white"
          >
            <path d="M56 50.2031V14H70V60.1562C70 65.5928 65.5928 70 60.1562 70C57.5605 70 54.9982 68.9992 53.1562 67.1573L0 14H19.7969L56 50.2031Z"></path>
            <path d="M147 56H133V23.9531L100.953 56H133V70H96.6875C85.8144 70 77 61.1856 77 50.3125V14H91V46.1562L123.156 14H91V0H127.312C138.186 0 147 8.81439 147 19.6875V56Z"></path>
          </svg>
        </a>
      </div>

      {/* Navigation */}
      <nav className="flex items-center space-x-2">
        {/* Wallet Component */}
        {user?.wallet?.address && (
          <div className="relative">
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="text-white font-medium text-sm px-6 py-3 rounded-full bg-white/10 border border-white/20 hover:bg-white/20 hover:border-white/30 transition-all duration-200 backdrop-blur-sm flex items-center gap-2"
            >
              <div className="w-2 h-2 rounded-full bg-green-400"></div>
              <span className="font-mono">{formatWalletAddress(user.wallet.address)}</span>
              <svg 
                className={`w-3 h-3 text-white/60 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <>
                {/* Backdrop to close dropdown */}
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsDropdownOpen(false)}
                />
                
                <div className="fixed right-6 top-20 w-72 z-[60]">
                  <div 
                    className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 relative pointer-events-auto"
                    style={{
                      filter: "url(#glass-effect)",
                    }}
                  >
                    {/* Glass effect highlight */}
                    <div className="absolute top-0 left-1 right-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full" />
                    
                    {/* Connected Status */}
                    <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/10">
                      <div className="w-3 h-3 rounded-full bg-green-400 shadow-lg shadow-green-400/25"></div>
                      <div>
                        <div className="text-white/90 text-sm font-medium">Wallet Connected</div>
                        <div className="text-white/60 text-xs">Click address to copy</div>
                      </div>
                    </div>

                    {/* Wallet Address */}
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(user?.wallet?.address || '')
                        // Optional: Add toast notification here
                      }}
                      className="w-full mb-4 p-3 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-all duration-200 group/copy"
                    >
                      <div className="text-white/60 text-xs mb-1">Wallet Address</div>
                      <div className="text-white text-sm font-mono break-all group-hover/copy:text-white/90">
                        {user.wallet.address}
                      </div>
                      <div className="text-white/40 text-xs mt-1 group-hover/copy:text-white/60 transition-colors">
                        Click to copy
                      </div>
                    </button>

                    {/* Quick Actions */}
                    <div className="space-y-2">
                      <button 
                        onClick={() => {
                          setIsDropdownOpen(false)
                          window.location.href = '/user-profile'
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A9 9 0 1118.88 17.804M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-sm font-medium">My Profile</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsDropdownOpen(false)
                          handleLogout()
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all duration-200 border border-red-500/20 hover:border-red-500/30"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span className="text-sm font-medium">Disconnect Wallet</span>
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </nav>
    </header>
  )
}