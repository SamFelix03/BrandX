"use client"

import { usePrivy } from '@privy-io/react-auth'
import { useRouter } from 'next/navigation'

export default function ConsumerHeroContent() {
  const { login, authenticated, ready } = usePrivy()
  const router = useRouter()

  const handleGetStarted = async () => {
    if (!authenticated) {
      login()
    } else {
      // Redirect to consumer landing to browse businesses
      router.push('/consumer-landing')
    }
  }

  return (
    <main className="absolute inset-0 flex items-center justify-center">
      <div className="text-center max-w-4xl px-8">

        {/* Main CTA */}
        <h1 className="text-5xl md:text-6xl lg:text-7xl tracking-tight font-light text-white mb-8 leading-tight">
          Discover amazing <span className="font-medium italic instrument">Loyalty Programs</span>
          <br />
          and start <span className="font-medium italic instrument">Earning Rewards</span>.
        </h1>

        {/* Description */}
        <p className="text-lg font-light text-white/70 mb-8 leading-relaxed max-w-2xl mx-auto">
          Join blockchain-powered loyalty programs from your favorite businesses. Complete bounties, earn points, and unlock exclusive rewards.
        </p>

        {/* Get Started Button */}
        <div className="flex justify-center">
          {!ready ? (
            <div className="px-12 py-5 rounded-full bg-white/20 text-white font-normal text-lg">
              Loading...
            </div>
          ) : (
            <button 
              onClick={handleGetStarted}
              className="px-12 py-5 rounded-full bg-white text-black font-normal text-lg transition-all duration-200 hover:bg-white/90 cursor-pointer shadow-lg hover:shadow-xl"
            >
              {authenticated ? 'Browse Programs' : 'Get Started'}
            </button>
          )}
        </div>
      </div>
    </main>
  )
}