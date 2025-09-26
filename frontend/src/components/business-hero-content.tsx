"use client"

import {usePrivy} from '@privy-io/react-auth';

export default function BusinessHeroContent() {
  const {login, authenticated, ready} = usePrivy();

  const handleGetStarted = () => {
    if (!authenticated) {
      login();
    } else {
      // User is already authenticated, redirect to dashboard/onboarding
      // This will be implemented later
      console.log('User is authenticated, redirect to dashboard');
    }
  };
  return (
    <main className="absolute inset-0 flex items-center justify-center z-20">
      <div className="text-center max-w-4xl px-8">

        {/* Main CTA */}
        <h1 className="text-5xl md:text-6xl lg:text-7xl tracking-tight font-light text-white mb-8 leading-tight">
          Let us <span className="font-medium italic instrument">Supercharge</span> your business
          <br />
          with <span className="font-medium italic instrument">BrandHero</span>, our AI agent.
        </h1>

        {/* Description */}
        <p className="text-lg font-light text-white/70 mb-8 leading-relaxed max-w-2xl mx-auto">
          Transform your customer engagement with intelligent loyalty programs that adapt and grow with your business.
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
              {authenticated ? 'Go to Dashboard' : 'Get Started'}
            </button>
          )}
        </div>
      </div>
    </main>
  )
}