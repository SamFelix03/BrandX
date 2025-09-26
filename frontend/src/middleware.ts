import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Only handle business-related routes
  if (pathname.startsWith('/business-onboarding') || pathname.startsWith('/business-dashboard')) {
    // Temporarily disable server-side auth checking
    // Let client-side auth handle the logic with ready state
    // This prevents the redirect loop while still solving the flicker issue
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/business-onboarding/:path*', '/business-dashboard/:path*']
}