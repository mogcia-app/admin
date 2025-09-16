import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// セキュリティミドルウェア
export function middleware(request: NextRequest) {
  // APIルートのセキュリティヘッダー
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const response = NextResponse.next()
    
    // セキュリティヘッダーを追加
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    
    return response
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*'
}
