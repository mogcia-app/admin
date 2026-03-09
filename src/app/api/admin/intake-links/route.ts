import { randomBytes } from 'crypto'
import { FieldValue } from 'firebase-admin/firestore'
import { NextRequest, NextResponse } from 'next/server'
import { adminFirestore } from '@/lib/firebase-admin-server'
import { authenticateAdminApiRequest, assertRoleAllowed } from '@/lib/admin-api-auth'

export const runtime = 'nodejs'

interface CreateIntakeLinkBody {
  companyName?: string
  registeredCompanyId?: string
  contractStartDate?: string
  contractEndDate?: string
  planTier?: string
  email?: string
  expiresInDays?: number
}

const ALLOWED_PLAN_TIER = new Set(['basic', 'standard', 'pro'])
const DEFAULT_INTERNAL_COMPANY_NAME = 'MOGCIA'

function toIso(value: unknown): string {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'object' && value && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate().toISOString()
  }
  return ''
}

function generateToken(): string {
  return randomBytes(24).toString('hex')
}

export async function POST(request: NextRequest) {
  try {
    const actor = await authenticateAdminApiRequest(request)
    assertRoleAllowed(actor, ['super_admin', 'billing_admin', 'admin', 'hq_admin'])

    const body = (await request.json()) as CreateIntakeLinkBody
    const companyName = String(body.companyName || '').trim()
    const registeredCompanyId = String(body.registeredCompanyId || '').trim()
    const contractStartDate = String(body.contractStartDate || '').trim()
    const contractEndDate = String(body.contractEndDate || '').trim()
    const planTier = String(body.planTier || '').trim()
    const email = String(body.email || '').trim().toLowerCase()
    const expiresInDays = Number(body.expiresInDays || 14)

    if (!companyName) {
      return NextResponse.json({ error: '会社名は必須です' }, { status: 400 })
    }
    if (!contractStartDate || Number.isNaN(new Date(contractStartDate).getTime())) {
      return NextResponse.json({ error: '契約日が不正です' }, { status: 400 })
    }
    if (contractEndDate && Number.isNaN(new Date(contractEndDate).getTime())) {
      return NextResponse.json({ error: '終了日が不正です' }, { status: 400 })
    }
    if (!ALLOWED_PLAN_TIER.has(planTier)) {
      return NextResponse.json({ error: 'planTier は basic / standard / pro のみ指定可能です' }, { status: 400 })
    }
    if (!email) {
      return NextResponse.json({ error: 'メールアドレスは必須です' }, { status: 400 })
    }

    let registeredCompanyName = DEFAULT_INTERNAL_COMPANY_NAME
    if (registeredCompanyId) {
      const companyDoc = await adminFirestore().collection('companies').doc(registeredCompanyId).get()
      if (!companyDoc.exists) {
        return NextResponse.json({ error: '登録企業が見つかりません' }, { status: 400 })
      }
      const companyData = companyDoc.data() as Record<string, unknown>
      registeredCompanyName = String(companyData.name || '')
    }

    const token = generateToken()
    const now = Date.now()
    const expiresAt = new Date(now + Math.max(1, Math.min(expiresInDays, 60)) * 24 * 60 * 60 * 1000)

    await adminFirestore().collection('intakeInvites').doc(token).set({
      token,
      status: 'draft',
      companyName,
      registeredCompanyId: registeredCompanyId || null,
      registeredCompanyName: registeredCompanyName || null,
      contractStartDate,
      contractEndDate: contractEndDate || null,
      planTier,
      email,
      createdByUid: actor.uid,
      createdByEmail: actor.email,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      expiresAt,
    })

    const intakeUrl = `${request.nextUrl.origin}/intake/${token}`

    return NextResponse.json({
      token,
      intakeUrl,
      expiresAt: expiresAt.toISOString(),
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

    console.error('[POST /api/admin/intake-links] error', error)
    return NextResponse.json({ error: 'intakeリンクの作成に失敗しました' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    await authenticateAdminApiRequest(request).then((actor) => {
      assertRoleAllowed(actor, ['super_admin', 'billing_admin', 'admin', 'hq_admin'])
    })

    const params = request.nextUrl.searchParams
    const statusFilter = String(params.get('status') || '').trim()
    const limitValue = Number(params.get('limit') || '100')
    const limit = Number.isFinite(limitValue) ? Math.min(Math.max(Math.floor(limitValue), 1), 300) : 100

    let query = adminFirestore().collection('intakeInvites').orderBy('createdAt', 'desc').limit(limit)
    if (statusFilter) {
      query = adminFirestore()
        .collection('intakeInvites')
        .where('status', '==', statusFilter)
        .orderBy('createdAt', 'desc')
        .limit(limit)
    }

    const snapshot = await query.get()
    const rows = snapshot.docs.map((doc) => {
      const data = doc.data() as Record<string, unknown>
      return {
        token: doc.id,
        status: String(data.status || ''),
        companyName: String(data.companyName || ''),
        registeredCompanyId: String(data.registeredCompanyId || ''),
        registeredCompanyName: String(data.registeredCompanyName || ''),
        contractStartDate: String(data.contractStartDate || ''),
        contractEndDate: String(data.contractEndDate || ''),
        planTier: String(data.planTier || ''),
        email: String(data.email || ''),
        createdByEmail: String(data.createdByEmail || ''),
        userId: String(data.userId || ''),
        createdAt: toIso(data.createdAt),
        updatedAt: toIso(data.updatedAt),
        expiresAt: toIso(data.expiresAt),
        submittedAt: toIso(data.submittedAt),
        confirmedAt: toIso(data.confirmedAt),
        submittedData: (data.submittedData as Record<string, unknown>) || null,
        signalInviteUrl: String(data.signalInviteUrl || ''),
        signalInviteExpiresAt: String(data.signalInviteExpiresAt || ''),
      }
    })

    return NextResponse.json({ items: rows })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('認証')) {
        return NextResponse.json({ error: error.message }, { status: 401 })
      }
      if (error.message.includes('権限')) {
        return NextResponse.json({ error: error.message }, { status: 403 })
      }
    }

    console.error('[GET /api/admin/intake-links] error', error)
    return NextResponse.json({ error: 'intakeリンク一覧の取得に失敗しました' }, { status: 500 })
  }
}
