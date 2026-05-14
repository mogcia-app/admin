import { NextRequest, NextResponse } from 'next/server'
import { adminFirestore } from '@/lib/firebase-admin-server'
import { resolveTermsToken } from '@/lib/terms-link'

export const runtime = 'nodejs'

export async function GET(_request: NextRequest, context: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await context.params
    if (!token) {
      return NextResponse.json({ error: 'token は必須です' }, { status: 400 })
    }

    const resolved = await resolveTermsToken(token)
    if (!resolved) {
      return NextResponse.json({ error: '有効な規約URLではありません' }, { status: 404 })
    }

    const userSnap = await adminFirestore().collection('users').doc(resolved.userId).get()
    const userData = userSnap.exists ? (userSnap.data() as Record<string, unknown>) : {}

    return NextResponse.json({
      ok: true,
      userId: resolved.userId,
      userEmail: resolved.userEmail,
      userName: String(userData.name || ''),
      flowType: resolved.flowType,
      version: resolved.version,
      privacyPolicyUrl: resolved.privacyPolicyUrl,
      toolTermsUrl: resolved.toolTermsUrl,
      memberSiteTermsUrl: resolved.memberSiteTermsUrl,
      expiresAt: resolved.expiresAtIso,
      alreadyUsed: resolved.alreadyUsed,
    })
  } catch (error) {
    console.error('[GET /api/terms/:token] error', error)
    return NextResponse.json({ error: '規約情報の取得に失敗しました' }, { status: 500 })
  }
}
