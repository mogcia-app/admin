import { NextRequest, NextResponse } from 'next/server'
import { adminFirestore } from '@/lib/firebase-admin-server'
import { authenticateAdminApiRequest, assertRoleAllowed } from '@/lib/admin-api-auth'

export const runtime = 'nodejs'

function toIso(value: unknown): string {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'object' && value && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate().toISOString()
  }
  return ''
}

function extractTokenFromNotes(notes: string): string {
  const match = notes.match(/intake token:\s*([a-zA-Z0-9_-]+)/i)
  return match?.[1] || ''
}

export async function GET(request: NextRequest, context: { params: Promise<{ uid: string }> }) {
  try {
    const actor = await authenticateAdminApiRequest(request)
    assertRoleAllowed(actor, ['super_admin', 'billing_admin', 'admin', 'hq_admin'])

    const { uid } = await context.params
    if (!uid) {
      return NextResponse.json({ error: 'uid は必須です' }, { status: 400 })
    }

    const db = adminFirestore()
    const userSnap = await db.collection('users').doc(uid).get()
    if (!userSnap.exists) {
      return NextResponse.json({ error: '対象ユーザーが存在しません' }, { status: 404 })
    }

    const userData = userSnap.data() as Record<string, unknown>
    const fromUser = {
      onboardingInitialPassword: String(userData.onboardingInitialPassword || ''),
      signalToolAccessUrl: String(userData.signalToolAccessUrl || ''),
      signalInviteExpiresAt: String(userData.signalInviteExpiresAt || ''),
      onboardingIntakeToken: String(userData.onboardingIntakeToken || ''),
      termsAgreementUrl: String(userData.termsAgreementUrl || ''),
      termsAgreementExpiresAt: String(userData.termsAgreementExpiresAt || ''),
      salesChannel: String(userData.salesChannel || 'direct'),
      termsFlowType: String(userData.termsFlowType || 'required'),
      termsAgreementStatus: String(userData.termsAgreementStatus || 'pending'),
      termsAgreedAt: String(userData.termsAgreedAt || ''),
      termsVersion: String(userData.termsVersion || ''),
      submittedData: null as Record<string, unknown> | null,
    }

    if (fromUser.onboardingInitialPassword || fromUser.signalToolAccessUrl) {
      return NextResponse.json({ ok: true, ...fromUser })
    }

    let inviteData: Record<string, unknown> | null = null
    const explicitToken =
      String(userData.onboardingIntakeToken || '').trim() || extractTokenFromNotes(String(userData.notes || ''))
    if (explicitToken) {
      const byToken = await db.collection('intakeInvites').doc(explicitToken).get()
      if (byToken.exists) {
        inviteData = byToken.data() as Record<string, unknown>
      }
    }

    const byUid = await db.collection('intakeInvites').where('userId', '==', uid).limit(5).get()
    if (!inviteData && !byUid.empty) {
      inviteData = byUid.docs
        .map((doc) => doc.data() as Record<string, unknown>)
        .sort((a, b) => toIso(b.confirmedAt).localeCompare(toIso(a.confirmedAt)))[0]
    }

    if (!inviteData) {
      const email = String(userData.email || '').trim().toLowerCase()
      if (email) {
        const byEmail = await db.collection('intakeInvites').where('email', '==', email).limit(5).get()
        const confirmedRows = byEmail.docs
          .map((doc) => doc.data() as Record<string, unknown>)
          .filter((row) => String(row.status || '') === 'confirmed')
          .sort((a, b) => toIso(b.confirmedAt).localeCompare(toIso(a.confirmedAt)))
        if (confirmedRows.length > 0) {
          inviteData = confirmedRows[0]
        }
      }
    }

    return NextResponse.json({
      ok: true,
      onboardingInitialPassword: '',
      signalToolAccessUrl: inviteData ? String(inviteData.signalInviteUrl || '') : '',
      signalInviteExpiresAt: inviteData ? String(inviteData.signalInviteExpiresAt || '') : '',
      onboardingIntakeToken: inviteData ? String(inviteData.token || '') : '',
      termsAgreementUrl: String(userData.termsAgreementUrl || ''),
      termsAgreementExpiresAt: String(userData.termsAgreementExpiresAt || ''),
      salesChannel: String(userData.salesChannel || 'direct'),
      termsFlowType: String(userData.termsFlowType || 'required'),
      termsAgreementStatus: String(userData.termsAgreementStatus || 'pending'),
      termsAgreedAt: String(userData.termsAgreedAt || ''),
      termsVersion: String(userData.termsVersion || ''),
      submittedData: inviteData ? ((inviteData.submittedData as Record<string, unknown>) || null) : null,
    })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('認証')) {
        return NextResponse.json({ error: error.message }, { status: 401 })
      }
      if (error.message.includes('権限')) {
        return NextResponse.json({ error: error.message }, { status: 403 })
      }
    }

    console.error('[GET /api/admin/users/:uid/onboarding-meta] error', error)
    return NextResponse.json({ error: '初回案内情報の取得に失敗しました' }, { status: 500 })
  }
}
