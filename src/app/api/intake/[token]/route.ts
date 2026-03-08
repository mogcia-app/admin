import { NextRequest, NextResponse } from 'next/server'
import { adminFirestore } from '@/lib/firebase-admin-server'

function toIso(value: unknown): string {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'object' && value && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate().toISOString()
  }
  return ''
}

export async function GET(_request: NextRequest, context: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await context.params
    if (!token) {
      return NextResponse.json({ error: 'token が必要です' }, { status: 400 })
    }

    const doc = await adminFirestore().collection('intakeInvites').doc(token).get()
    if (!doc.exists) {
      return NextResponse.json({ error: 'リンクが見つかりません' }, { status: 404 })
    }

    const data = doc.data() as Record<string, unknown>
    const expiresAtIso = toIso(data.expiresAt)

    if (expiresAtIso && new Date(expiresAtIso).getTime() < Date.now() && data.status !== 'confirmed') {
      return NextResponse.json({ error: 'このリンクは有効期限切れです' }, { status: 410 })
    }

    return NextResponse.json({
      token,
      status: String(data.status || 'draft'),
      companyName: String(data.companyName || ''),
      contractStartDate: String(data.contractStartDate || ''),
      contractEndDate: String(data.contractEndDate || ''),
      planTier: String(data.planTier || ''),
      email: String(data.email || ''),
      expiresAt: expiresAtIso,
      submittedData: (data.submittedData as Record<string, unknown>) || null,
    })
  } catch (error) {
    console.error('[GET /api/intake/:token] error', error)
    return NextResponse.json({ error: 'intake情報の取得に失敗しました' }, { status: 500 })
  }
}
