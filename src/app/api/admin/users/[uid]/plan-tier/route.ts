import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { adminFirestore } from '@/lib/firebase-admin-server'
import { authenticateAdminApiRequest, assertRoleAllowed } from '@/lib/admin-api-auth'
import { resolveTier } from '@/lib/ai-usage-limit'

interface PatchPlanTierBody {
  planTier?: string
  reason?: string
  expectedUpdatedAt?: string
}

const ALLOWED_TIERS = new Set(['basic', 'standard', 'pro'])

export async function PATCH(request: NextRequest, context: { params: Promise<{ uid: string }> }) {
  try {
    const actor = await authenticateAdminApiRequest(request)
    assertRoleAllowed(actor, ['super_admin', 'billing_admin'])

    const { uid } = await context.params
    const body = (await request.json()) as PatchPlanTierBody

    const planTier = typeof body.planTier === 'string' ? body.planTier.trim() : ''
    const reason = typeof body.reason === 'string' ? body.reason.trim() : ''
    const expectedUpdatedAt = typeof body.expectedUpdatedAt === 'string' ? body.expectedUpdatedAt : ''

    if (!uid) {
      return NextResponse.json({ error: 'uid は必須です' }, { status: 400 })
    }

    if (!planTier) {
      return NextResponse.json({ error: 'planTier は必須です' }, { status: 400 })
    }

    if (!ALLOWED_TIERS.has(planTier)) {
      return NextResponse.json({ error: 'planTier は basic / standard / pro のみ指定可能です' }, { status: 400 })
    }

    if (!reason) {
      return NextResponse.json({ error: '変更理由(reason)は必須です' }, { status: 400 })
    }

    const db = adminFirestore()
    const userRef = db.collection('users').doc(uid)
    const auditRef = db.collection('auditLogs').doc()
    const nowIso = new Date().toISOString()

    const result = await db.runTransaction(async (transaction) => {
      const userSnapshot = await transaction.get(userRef)
      if (!userSnapshot.exists) {
        throw new Error('USER_NOT_FOUND')
      }

      const current = userSnapshot.data() as Record<string, unknown>
      const currentUpdatedAt = typeof current.updatedAt === 'string' ? current.updatedAt : ''

      if (expectedUpdatedAt && currentUpdatedAt && expectedUpdatedAt !== currentUpdatedAt) {
        throw new Error('VERSION_CONFLICT')
      }

      const before = resolveTier(current.planTier)
      const after = resolveTier(planTier)

      if (before === after) {
        return {
          updated: false,
          before,
          after,
          updatedAt: currentUpdatedAt,
        }
      }

      transaction.update(userRef, {
        planTier: after,
        updatedAt: nowIso,
      })

      transaction.set(auditRef, {
        event: 'admin.planTier.update',
        action: 'admin.planTier.update',
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
        before,
        after,
        reason,
        changes: {
          planTier: {
            before,
            after,
          },
        },
        createdAt: FieldValue.serverTimestamp(),
      })

      return {
        updated: true,
        before,
        after,
        updatedAt: nowIso,
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'USER_NOT_FOUND') {
        return NextResponse.json({ error: '対象ユーザーが存在しません' }, { status: 404 })
      }
      if (error.message === 'VERSION_CONFLICT') {
        return NextResponse.json({ error: '他の管理者が先に更新しました。再読み込みしてから再実行してください。' }, { status: 409 })
      }
      if (error.message.includes('権限')) {
        return NextResponse.json({ error: error.message }, { status: 403 })
      }
      if (error.message.includes('認証')) {
        return NextResponse.json({ error: error.message }, { status: 401 })
      }
    }

    console.error('[PATCH /api/admin/users/:uid/plan-tier] error', error)
    return NextResponse.json({ error: 'planTier更新に失敗しました' }, { status: 500 })
  }
}
