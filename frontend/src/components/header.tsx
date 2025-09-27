"use client"

export default function Header() {
  return (
    <header className="relative z-20 flex items-center justify-between px-8 py-6">
      {/* Logo */}
      <div className="flex items-center">
        <a href="/" className="cursor-pointer flex items-center gap-3 group">
          <div className="relative">
            <img
              src="/logo.png"
              alt="EzEarn Logo"
              className="h-16 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
            />
          </div>
        </a>
      </div>

      {/* Navigation */}
      <nav className="flex items-center space-x-2">
        <a
          href="#"
          className="text-white font-medium text-sm px-6 py-3 rounded-full bg-white/10 border border-white/20 hover:bg-white/20 hover:border-white/30 transition-all duration-200 backdrop-blur-sm"
        >
          View Docs
        </a>
      </nav>

      {/* Login Button Group with Arrow
      <div id="gooey-btn" className="relative flex items-center group" style={{ filter: "url(#gooey-filter)" }}>
        <button className="absolute right-0 px-2.5 py-2 rounded-full bg-white text-black font-normal text-xs transition-all duration-300 hover:bg-white/90 cursor-pointer h-8 flex items-center justify-center -translate-x-10 group-hover:-translate-x-19 z-0">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M17 7H7M17 7V17" />
          </svg>
        </button>
        <button className="px-6 py-2 rounded-full bg-white text-black font-normal text-xs transition-all duration-300 hover:bg-white/90 cursor-pointer h-8 flex items-center z-10">
          Login
        </button>
      </div> */}
    </header>
  )
}
