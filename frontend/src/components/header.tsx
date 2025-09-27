"use client"

export default function Header() {
  return (
    <header className="relative z-30 flex items-center justify-between px-8 py-6">
      {/* Logo */}
      <div className="flex items-center">
        <a href="/" className="cursor-pointer flex items-center gap-3 group">
          <div className="relative">
            <img
              src="/logo.png"
              alt="BrandX Logo"
              className="h-16 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
            />
          </div>
        </a>
      </div>

      {/* Navigation */}
      <nav className="flex items-center space-x-2">
        <a
          href="https://BrandX.gitbook.io/BrandX-docs"
          className="text-white font-medium text-sm px-6 py-3 rounded-full bg-white/10 border border-white/20 hover:bg-white/20 hover:border-white/30 transition-all duration-200 backdrop-blur-sm"
        >
          View Docs
        </a>
      </nav>
    </header>
  )
}
