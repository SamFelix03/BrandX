import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Only handle business-related routes
  if (pathname.startsWith('/business-onboarding') || pathname.startsWith('/business-dashboard')) {
    // For now, let the pages handle their own auth logic
    // We'll need to implement proper auth checking here once we have session management
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/business-onboarding/:path*', '/business-dashboard/:path*']
}