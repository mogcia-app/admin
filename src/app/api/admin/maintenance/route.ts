import { randomUUID } from 'crypto'
import { FieldValue } from 'firebase-admin/firestore'
import { NextRequest, NextResponse } from 'next/server'
import { adminFirestore } from '@/lib/firebase-admin-server'
import { authenticateAdminApiRequest, assertRoleAllowed } from '@/lib/admin-api-auth'
import { MAINTENANCE_DOC_PATH, buildDefaultMaintenanceCurrent, normalizeMaintenanceCurrent } from '@/lib/server/maintenance-config'
import {
  applyPatch,
  buildAuditLogPayload,
  buildMaintenanceResponse,
  computeChangedKeys,
  getMaintenanceCurrent,
  normalizePatch,
  resolveMaintenanceEvent,
  validatePatchResult,
} from '@/lib/server/maintenance-admin'

export const runtime = 'nodejs'

interface PatchRequestBody {
  reason?: string
  expectedVersion?: number
  patch?: Record<string, unknown>
}

function getRequestIp(request: NextRequest): string | null {
  const xff = request.headers.get('x-forwarded-for')
  if (xff) {
    return xff.split(',')[0]?.trim() || null
  }
  return request.headers.get('x-real-ip') || null
}

export async function GET(request: NextRequest) {
  try {
    const actor = await authenticateAdminApiRequest(request)
    assertRoleAllowed(actor, ['admin', 'hq_admin', 'billing_admin', 'super_admin'])

    const current = await getMaintenanceCurrent()

    return NextResponse.json({
      success: true,
      data: buildMaintenanceResponse(current),
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

    console.error('[GET /api/admin/maintenance] error', error)
    return NextResponse.json({ error: 'メンテナンス設定の取得に失敗しました' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const actor = await authenticateAdminApiRequest(request)
    assertRoleAllowed(actor, ['billing_admin', 'super_admin'])

    const body = (await request.json()) as PatchRequestBody
    const reason = typeof body.reason === 'string' ? body.reason.trim() : ''
    const expectedVersion = Number(body.expectedVersion)
    const patch = normalizePatch(body.patch)

    if (!reason) {
      return NextResponse.json({ error: 'reason は必須です' }, { status: 400 })
    }
    if (reason.length < 10) {
      return NextResponse.json({ error: 'reason は10文字以上で入力してください' }, { status: 400 })
    }
    if (!Number.isFinite(expectedVersion) || expectedVersion <= 0) {
      return NextResponse.json({ error: 'expectedVersion は必須です' }, { status: 400 })
    }

    if (patch.loginBlocked === true && patch.sessionPolicy === 'force_logout' && actor.role !== 'super_admin') {
      return NextResponse.json({ error: 'force_logout を伴うログイン遮断は super_admin のみ実行可能です' }, { status: 403 })
    }

    const db = adminFirestore()
    const configRef = db.collection(MAINTENANCE_DOC_PATH.collection).doc(MAINTENANCE_DOC_PATH.doc)
    const auditRef = db.collection('auditLogs').doc()

    const requestId = randomUUID()
    const ip = getRequestIp(request)
    const userAgent = request.headers.get('user-agent') || null

    const result = await db.runTransaction(async (tx) => {
      const snapshot = await tx.get(configRef)
      const current = snapshot.exists
        ? normalizeMaintenanceCurrent(snapshot.data() as Record<string, unknown>)
        : {
            ...buildDefaultMaintenanceCurrent(),
            updatedAt: null,
          }

      if (current.version !== expectedVersion) {
        throw new Error('VERSION_CONFLICT')
      }

      const next = applyPatch(current, patch)
      const validationError = validatePatchResult(next)
      if (validationError) {
        throw new Error(`VALIDATION:${validationError}`)
      }

      if (next.loginBlocked && next.sessionPolicy === 'force_logout' && actor.role !== 'super_admin') {
        throw new Error('FORCE_LOGOUT_FORBIDDEN')
      }

      const changedKeys = computeChangedKeys(current, next)
      if (changedKeys.length === 0) {
        return {
          updated: false,
          version: current.version,
          config: buildMaintenanceResponse(current),
          changedKeys,
        }
      }

      const event = resolveMaintenanceEvent(changedKeys)
      const nextVersion = current.version + 1

      tx.set(
        configRef,
        {
          ...next,
          version: nextVersion,
          updatedBy: actor.uid,
          updatedByEmail: actor.email,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      )

      tx.set(
        auditRef,
        buildAuditLogPayload({
          event,
          actorUid: actor.uid,
          actorEmail: actor.email,
          reason,
          before: buildMaintenanceResponse(current),
          after: { ...buildMaintenanceResponse(next), version: nextVersion },
          changedKeys,
          requestId,
          ip,
          userAgent,
        })
      )

      return {
        updated: true,
        version: nextVersion,
        config: {
          ...buildMaintenanceResponse(next),
          version: nextVersion,
        },
        changedKeys,
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        version: result.version,
        updated: result.updated,
        changedKeys: result.changedKeys,
        config: result.config,
      },
    })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'VERSION_CONFLICT') {
        return NextResponse.json({ error: '他の管理者が先に更新しました。再読み込みしてください。' }, { status: 409 })
      }
      if (error.message === 'FORCE_LOGOUT_FORBIDDEN') {
        return NextResponse.json({ error: 'force_logout を伴うログイン遮断は super_admin のみ実行可能です' }, { status: 403 })
      }
      if (error.message.startsWith('VALIDATION:')) {
        return NextResponse.json({ error: error.message.replace('VALIDATION:', '') }, { status: 400 })
      }
      if (error.message.includes('認証')) {
        return NextResponse.json({ error: error.message }, { status: 401 })
      }
      if (error.message.includes('権限')) {
        return NextResponse.json({ error: error.message }, { status: 403 })
      }
    }

    console.error('[PATCH /api/admin/maintenance] error', error)
    return NextResponse.json({ error: 'メンテナンス設定の更新に失敗しました' }, { status: 500 })
  }
}
