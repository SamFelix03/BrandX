"use client"

export default function HeroContent() {
  return (
    <main className="absolute inset-0 flex items-center justify-start pl-8 z-20">
      <div className="text-left max-w-xl ml-10">
        <div
          className="inline-flex items-center px-4 py-2 rounded-full bg-white/5 backdrop-blur-sm mb-6 relative"
          style={{
            filter: "url(#glass-effect)",
          }}
        >
          <div className="absolute top-0 left-1 right-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full" />
          <span className="text-white/90 text-sm font-light relative z-10">Loyalty & Blockchain</span>
        </div>

        {/* Main Heading */}
        <h1 className="text-6xl md:text-7xl md:leading-18 tracking-tight font-light text-white mb-6">
          <span className="font-light tracking-tight text-white">Loyalty Programs</span>
          <br />
          <span className="font-medium italic instrument">that Work</span>
        </h1>

        {/* Description */}
        <p className="text-sm font-light text-white/70 mb-6 max-w-lg leading-relaxed">
          Businesses create <span className="font-bold">world class loyalty programs in MINUTES</span> by setting up bounties for users with our AI agent's assistance. 
          Users earn rewards for hunting bounties.
        </p>

        {/* Buttons */}
        <div className="flex items-center gap-6 flex-wrap">
          <button 
            onClick={() => window.location.href = '/business-landing'}
            className="px-10 py-4 rounded-full bg-transparent border border-white/30 text-white font-normal text-sm transition-all duration-200 hover:bg-white/10 hover:border-white/50 cursor-pointer"
          >
            For Businesses
          </button>
          <button className="px-10 py-4 rounded-full bg-white text-black font-normal text-sm transition-all duration-200 hover:bg-white/90 cursor-pointer">
            For Consumers
          </button>
        </div>
      </div>
    </main>
  )
}
