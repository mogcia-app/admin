import { FieldValue } from 'firebase-admin/firestore'
import { NextRequest, NextResponse } from 'next/server'
import { adminFirestore } from '@/lib/firebase-admin-server'
import { authenticateAdminApiRequest } from '@/lib/admin-api-auth'

export const runtime = 'nodejs'

interface Body {
  actorName?: string
  source?: string
}

function getRequestIp(request: NextRequest): string {
  const xff = request.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0]?.trim() || ''
  return request.headers.get('x-real-ip') || ''
}

export async function POST(request: NextRequest) {
  try {
    const actor = await authenticateAdminApiRequest(request)
    const body = (await request.json().catch(() => ({}))) as Body

    await adminFirestore().collection('loginEventLogs').add({
      eventType: 'auth.login.success',
      actorUid: actor.uid,
      actorName: String(body.actorName || '').trim() || actor.email,
      actorEmail: actor.email,
      errorCode: null,
      ip: getRequestIp(request),
      userAgent: request.headers.get('user-agent') || '',
      source: String(body.source || '').trim() || 'admin.login-form',
      createdAt: FieldValue.serverTimestamp(),
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof Error && error.message.includes('認証')) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    console.error('[POST /api/auth/login-events/success] error', error)
    return NextResponse.json({ error: 'ログイン成功イベントの保存に失敗しました' }, { status: 500 })
  }
}
