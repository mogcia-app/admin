import { FieldValue } from 'firebase-admin/firestore'
import { NextRequest, NextResponse } from 'next/server'
import { authenticateAdminApiRequest, assertRoleAllowed } from '@/lib/admin-api-auth'
import { adminFirestore } from '@/lib/firebase-admin-server'
import { createTermsAgreementLink } from '@/lib/terms-link'
import type { TermsFlowType } from '../../../../../../types/index'

export const runtime = 'nodejs'

function normalizeFlowType(value: unknown): TermsFlowType {
  if (value === 'external_contract' || value === 'exempt') {
    return value
  }
  return 'required'
}

export async function POST(request: NextRequest, context: { params: Promise<{ uid: string }> }) {
  try {
    const actor = await authenticateAdminApiRequest(request)
    assertRoleAllowed(actor, ['super_admin', 'billing_admin', 'admin', 'hq_admin'])

    const { uid } = await context.params
    if (!uid) {
      return NextResponse.json({ error: 'uid は必須です' }, { status: 400 })
    }

    const body = await request.json().catch(() => ({}))
    const expiresInMinutes = Number(body.expiresInMinutes || 10080)
    if (!Number.isFinite(expiresInMinutes) || expiresInMinutes < 10 || expiresInMinutes > 43200) {
      return NextResponse.json({ error: 'expiresInMinutes は 10-43200 の範囲で指定してください' }, { status: 400 })
    }

    const db = adminFirestore()
    const userRef = db.collection('users').doc(uid)
    const userSnap = await userRef.get()
    if (!userSnap.exists) {
      return NextResponse.json({ error: '対象ユーザーが存在しません' }, { status: 404 })
    }

    const userData = userSnap.data() as Record<string, unknown>
    const userEmail = String(userData.email || '').trim().toLowerCase()
    if (!userEmail) {
      return NextResponse.json({ error: '対象ユーザーのメールアドレスがありません' }, { status: 400 })
    }

    const flowType = normalizeFlowType(body.flowType || userData.termsFlowType)
    const link = await createTermsAgreementLink({
      userId: uid,
      userEmail,
      createdBy: actor.email || actor.uid,
      createdByRole: actor.role,
      flowType,
      expiresInMinutes,
    })

    await Promise.all([
      userRef.set(
        {
          salesChannel: String(userData.salesChannel || 'direct'),
          termsFlowType: flowType,
          termsAgreementStatus: flowType === 'required' ? 'pending' : 'not_required',
          termsVersion: link.version,
          termsAgreementUrl: link.agreementUrl,
          termsAgreementExpiresAt: link.expiresAt,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      ),
      db.collection('auditLogs').add({
        event: 'admin.user.terms_link.create',
        action: 'user.update',
        tenantType: 'hq',
        actor: {
          uid: actor.uid,
          email: actor.email,
          role: actor.role,
        },
        target: {
          type: 'user',
          id: uid,
          name: String(userData.name || ''),
        },
        metadata: {
          flowType,
          expiresAt: link.expiresAt,
          version: link.version,
          termsLinkId: link.linkId,
        },
        createdAt: FieldValue.serverTimestamp(),
      }),
    ])

    return NextResponse.json({
      ok: true,
      agreementUrl: link.agreementUrl,
      expiresAt: link.expiresAt,
      version: link.version,
      flowType,
      privacyPolicyUrl: link.privacyPolicyUrl,
      toolTermsUrl: link.toolTermsUrl,
      memberSiteTermsUrl: link.memberSiteTermsUrl,
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

    console.error('[POST /api/admin/users/:uid/terms-link] error', error)
    const message = error instanceof Error ? error.message : '規約URLの発行に失敗しました'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
