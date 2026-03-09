import { FieldValue } from 'firebase-admin/firestore'
import { NextRequest, NextResponse } from 'next/server'
import { adminFirestore } from '@/lib/firebase-admin-server'

export const runtime = 'nodejs'

interface Body {
  actorName?: string
  actorEmail?: string
  errorCode?: string
  source?: string
}

type RateLimitEntry = {
  count: number
  resetAt: number
}

const WINDOW_MS = 60_000
const MAX_REQUESTS_PER_WINDOW = 20
const ipRateLimitStore = new Map<string, RateLimitEntry>()

function getRequestIp(request: NextRequest): string {
  const xff = request.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0]?.trim() || ''
  return request.headers.get('x-real-ip') || ''
}

function hitRateLimit(ip: string): boolean {
  const now = Date.now()
  const current = ipRateLimitStore.get(ip)

  if (!current || current.resetAt <= now) {
    ipRateLimitStore.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return false
  }

  if (current.count >= MAX_REQUESTS_PER_WINDOW) {
    return true
  }

  current.count += 1
  ipRateLimitStore.set(ip, current)
  return false
}

export async function POST(request: NextRequest) {
  try {
    const ip = getRequestIp(request)
    if (hitRateLimit(ip || 'unknown')) {
      return NextResponse.json({ error: 'リクエストが多すぎます。しばらく待ってください。' }, { status: 429 })
    }

    const body = (await request.json().catch(() => ({}))) as Body

    await adminFirestore().collection('loginEventLogs').add({
      eventType: 'auth.login.failed',
      actorUid: null,
      actorName: String(body.actorName || '').trim() || '',
      actorEmail: String(body.actorEmail || '').trim().toLowerCase(),
      errorCode: String(body.errorCode || '').trim() || 'unknown',
      ip,
      userAgent: request.headers.get('user-agent') || '',
      source: String(body.source || '').trim() || 'admin.login-form',
      createdAt: FieldValue.serverTimestamp(),
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[POST /api/auth/login-events/failed] error', error)
    return NextResponse.json({ error: 'ログイン失敗イベントの保存に失敗しました' }, { status: 500 })
  }
}
