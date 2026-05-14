import { FieldValue } from 'firebase-admin/firestore'
import { NextRequest, NextResponse } from 'next/server'
import { adminFirestore } from '@/lib/firebase-admin-server'
import { buildTermsSummary, resolveTermsToken } from '@/lib/terms-link'

export const runtime = 'nodejs'

function getIpAddress(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || ''
  }
  return request.headers.get('x-real-ip') || ''
}

export async function POST(request: NextRequest, context: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await context.params
    if (!token) {
      return NextResponse.json({ error: 'token は必須です' }, { status: 400 })
    }

    const resolved = await resolveTermsToken(token)
    if (!resolved) {
      return NextResponse.json({ error: '有効な規約URLではありません' }, { status: 404 })
    }

    const body = await request.json().catch(() => ({}))
    const acceptedPrivacyPolicy = body.acceptedPrivacyPolicy === true
    const acceptedToolTerms = body.acceptedToolTerms === true
    const acceptedMemberSiteTerms = body.acceptedMemberSiteTerms === true

    if (!acceptedPrivacyPolicy || !acceptedToolTerms || !acceptedMemberSiteTerms) {
      return NextResponse.json({ error: 'すべての規約への同意が必要です' }, { status: 400 })
    }

    const db = adminFirestore()
    const userRef = db.collection('users').doc(resolved.userId)
    const linkRef = db.collection('termsLinks').doc(resolved.linkId)
    const agreedAtIso = new Date().toISOString()
    const ipAddress = getIpAddress(request)
    const userAgent = request.headers.get('user-agent') || ''

    const summary = buildTermsSummary({
      status: 'agreed',
      agreedAt: agreedAtIso,
      version: resolved.version,
      source: 'admin_link',
    })

    await db.runTransaction(async (transaction) => {
      const [linkSnap, userSnap] = await Promise.all([transaction.get(linkRef), transaction.get(userRef)])
      if (!linkSnap.exists || !userSnap.exists) {
        throw new Error('リンクまたはユーザーが存在しません')
      }

      const linkData = linkSnap.data() as Record<string, unknown>
      if (linkData.usedAt) {
        throw new Error('この規約URLはすでに使用されています')
      }

      transaction.set(
        userRef,
        {
          termsAgreementStatus: 'agreed',
          termsAgreedAt: agreedAtIso,
          termsVersion: resolved.version,
          termsConsentSource: 'admin_link',
          privacyPolicyConsent: summary,
          toolTermsConsent: summary,
          memberSiteTermsConsent: summary,
          updatedAt: agreedAtIso,
        },
        { merge: true }
      )

      transaction.set(
        linkRef,
        {
          usedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      )

      transaction.set(userRef.collection('privacyPolicyConsents').doc(), {
        type: 'privacy_policy',
        version: resolved.version,
        agreedAt: FieldValue.serverTimestamp(),
        url: resolved.privacyPolicyUrl,
        source: 'admin_link',
        ipAddress,
        userAgent,
        linkId: resolved.linkId,
      })

      transaction.set(userRef.collection('toolTermsConsents').doc(), {
        type: 'tool_terms',
        version: resolved.version,
        agreedAt: FieldValue.serverTimestamp(),
        url: resolved.toolTermsUrl,
        source: 'admin_link',
        ipAddress,
        userAgent,
        linkId: resolved.linkId,
      })

      transaction.set(userRef.collection('memberSiteTermsConsents').doc(), {
        type: 'member_site_terms',
        version: resolved.version,
        agreedAt: FieldValue.serverTimestamp(),
        url: resolved.memberSiteTermsUrl,
        source: 'admin_link',
        ipAddress,
        userAgent,
        linkId: resolved.linkId,
      })

      transaction.set(db.collection('auditLogs').doc(), {
        event: 'user.terms.agreed',
        action: 'user.update',
        tenantType: 'hq',
        actor: {
          uid: resolved.userId,
          email: resolved.userEmail,
          role: 'user',
        },
        target: {
          type: 'user',
          id: resolved.userId,
          name: String((userSnap.data() as Record<string, unknown>).name || ''),
        },
        metadata: {
          version: resolved.version,
          linkId: resolved.linkId,
          source: 'admin_link',
        },
        createdAt: FieldValue.serverTimestamp(),
      })
    })

    return NextResponse.json({
      ok: true,
      agreedAt: agreedAtIso,
      version: resolved.version,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : '規約同意の保存に失敗しました'
    const status = message.includes('すでに使用') ? 409 : message.includes('存在しません') ? 404 : 500
    console.error('[POST /api/terms/:token/consent] error', error)
    return NextResponse.json({ error: message }, { status })
  }
}
