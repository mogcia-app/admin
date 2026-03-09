import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { adminFirestore } from '@/lib/firebase-admin-server'
import { authenticateAdminApiRequest, assertRoleAllowed } from '@/lib/admin-api-auth'
import {
  AI_USAGE_COLLECTION,
  buildAiUsageSummary,
  getAiUsageDocId,
  getAiUsageLimitForTier,
  getCurrentBillingMonth,
  isValidBillingMonth,
  normalizeCount,
  resolveTier,
} from '@/lib/ai-usage-limit'

export const runtime = 'nodejs'

function resolveMonth(searchParams: URLSearchParams): { month: string; error?: string } {
  const monthParam = searchParams.get('month')
  if (!monthParam) {
    return { month: getCurrentBillingMonth() }
  }

  const month = monthParam.trim()
  if (!isValidBillingMonth(month)) {
    return { month, error: 'month は YYYY-MM 形式で指定してください' }
  }

  return { month }
}

export async function GET(request: NextRequest, context: { params: Promise<{ uid: string }> }) {
  try {
    const actor = await authenticateAdminApiRequest(request)
    assertRoleAllowed(actor, ['super_admin', 'billing_admin', 'admin', 'hq_admin'])

    const { uid } = await context.params
    if (!uid) {
      return NextResponse.json({ error: 'uid は必須です' }, { status: 400 })
    }

    const { month, error } = resolveMonth(request.nextUrl.searchParams)
    if (error) {
      return NextResponse.json({ error }, { status: 400 })
    }

    const db = adminFirestore()
    const userRef = db.collection('users').doc(uid)
    const usageRef = db.collection(AI_USAGE_COLLECTION).doc(getAiUsageDocId(uid, month))

    const [userSnapshot, usageSnapshot] = await Promise.all([userRef.get(), usageRef.get()])

    if (!userSnapshot.exists) {
      return NextResponse.json({ error: '対象ユーザーが存在しません' }, { status: 404 })
    }

    const userData = userSnapshot.data() as Record<string, unknown>
    const usageData = usageSnapshot.exists ? (usageSnapshot.data() as Record<string, unknown>) : undefined

    const summary = buildAiUsageSummary({
      month,
      currentTier: userData.planTier,
      usageDocData: usageData,
    })

    return NextResponse.json(summary)
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('権限')) {
        return NextResponse.json({ error: error.message }, { status: 403 })
      }
      if (error.message.includes('認証')) {
        return NextResponse.json({ error: error.message }, { status: 401 })
      }
    }

    console.error('[GET /api/admin/users/:uid/ai-usage] error', error)
    return NextResponse.json({ error: 'AI利用状況の取得に失敗しました' }, { status: 500 })
  }
}

interface ResetBody {
  month?: string
  reason?: string
}

export async function POST(request: NextRequest, context: { params: Promise<{ uid: string }> }) {
  try {
    const actor = await authenticateAdminApiRequest(request)
    assertRoleAllowed(actor, ['super_admin'])

    const { uid } = await context.params
    if (!uid) {
      return NextResponse.json({ error: 'uid は必須です' }, { status: 400 })
    }

    const body = (await request.json().catch(() => ({}))) as ResetBody
    const month = body.month?.trim() || getCurrentBillingMonth()
    const reason = body.reason?.trim() || ''

    if (!isValidBillingMonth(month)) {
      return NextResponse.json({ error: 'month は YYYY-MM 形式で指定してください' }, { status: 400 })
    }

    if (!reason) {
      return NextResponse.json({ error: 'リセット理由(reason)は必須です' }, { status: 400 })
    }

    const db = adminFirestore()
    const userRef = db.collection('users').doc(uid)
    const usageRef = db.collection(AI_USAGE_COLLECTION).doc(getAiUsageDocId(uid, month))
    const auditRef = db.collection('auditLogs').doc()

    const response = await db.runTransaction(async (transaction) => {
      const [userSnapshot, usageSnapshot] = await Promise.all([
        transaction.get(userRef),
        transaction.get(usageRef),
      ])

      if (!userSnapshot.exists) {
        throw new Error('USER_NOT_FOUND')
      }

      const userData = userSnapshot.data() as Record<string, unknown>
      const tier = resolveTier(userData.planTier)
      const limit = getAiUsageLimitForTier(tier)

      const usageData = usageSnapshot.exists ? (usageSnapshot.data() as Record<string, unknown>) : {}
      const beforeCount = normalizeCount(usageData.count)

      transaction.set(
        usageRef,
        {
          uid,
          month,
          tier,
          limit,
          count: 0,
          breakdown: {},
          updatedAt: FieldValue.serverTimestamp(),
          createdAt: usageSnapshot.exists ? usageData.createdAt || FieldValue.serverTimestamp() : FieldValue.serverTimestamp(),
        },
        { merge: true }
      )

      transaction.set(auditRef, {
        event: 'admin.aiUsage.reset',
        action: 'admin.aiUsage.reset',
        tenantType: 'hq',
        actor: {
          uid: actor.uid,
          email: actor.email,
          role: actor.role,
        },
        target: {
          type: 'user',
          id: uid,
        },
        month,
        beforeCount,
        afterCount: 0,
        reason,
        createdAt: FieldValue.serverTimestamp(),
      })

      return {
        month,
        tier,
        limit,
        count: 0,
        remaining: limit,
        breakdown: {},
      }
    })

    return NextResponse.json(response)
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'USER_NOT_FOUND') {
        return NextResponse.json({ error: '対象ユーザーが存在しません' }, { status: 404 })
      }
      if (error.message.includes('権限')) {
        return NextResponse.json({ error: error.message }, { status: 403 })
      }
      if (error.message.includes('認証')) {
        return NextResponse.json({ error: error.message }, { status: 401 })
      }
    }

    console.error('[POST /api/admin/users/:uid/ai-usage] error', error)
    return NextResponse.json({ error: 'AI利用回数のリセットに失敗しました' }, { status: 500 })
  }
}
