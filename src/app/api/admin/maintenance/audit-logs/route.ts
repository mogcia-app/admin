import { Timestamp } from 'firebase-admin/firestore'
import { NextRequest, NextResponse } from 'next/server'
import { adminFirestore } from '@/lib/firebase-admin-server'
import { authenticateAdminApiRequest, assertRoleAllowed } from '@/lib/admin-api-auth'
import { MAINTENANCE_EVENTS, toIso } from '@/lib/server/maintenance-admin'

interface MaintenanceAuditRow {
  id: string
  event: string
  actorUid: string
  actorEmail: string
  reason: string
  target: string
  before: Record<string, unknown>
  after: Record<string, unknown>
  changedKeys: string[]
  requestId: string
  ip: string
  userAgent: string
  createdAt: string
}

function parseLimit(raw: string | null): number {
  const value = Number(raw || '100')
  if (!Number.isFinite(value)) return 100
  return Math.min(Math.max(Math.floor(value), 1), 200)
}

export async function GET(request: NextRequest) {
  try {
    const actor = await authenticateAdminApiRequest(request)
    assertRoleAllowed(actor, ['admin', 'billing_admin', 'super_admin'])

    const limit = parseLimit(request.nextUrl.searchParams.get('limit'))
    const cursor = request.nextUrl.searchParams.get('cursor') || ''

    let query = adminFirestore().collection('auditLogs').orderBy('createdAt', 'desc').limit(limit + 80)

    if (cursor) {
      const date = new Date(cursor)
      if (!Number.isNaN(date.getTime())) {
        query = query.startAfter(Timestamp.fromDate(date))
      }
    }

    const snapshot = await query.get()

    const rows = snapshot.docs
      .map((doc) => {
        const data = doc.data() as Record<string, unknown>
        const actorObj = (data.actor && typeof data.actor === 'object') ? (data.actor as Record<string, unknown>) : {}

        return {
          id: doc.id,
          event: String(data.event || data.action || ''),
          actorUid: String(data.actorUid || actorObj.uid || ''),
          actorEmail: String(data.actorEmail || actorObj.email || ''),
          reason: String(data.reason || ''),
          target: typeof data.target === 'string' ? data.target : 'toolMaintenance/current',
          before: (data.before && typeof data.before === 'object') ? (data.before as Record<string, unknown>) : {},
          after: (data.after && typeof data.after === 'object') ? (data.after as Record<string, unknown>) : {},
          changedKeys: Array.isArray(data.changedKeys) ? data.changedKeys.map((v) => String(v)) : [],
          requestId: String(data.requestId || ''),
          ip: String(data.ip || ''),
          userAgent: String(data.userAgent || ''),
          createdAt: toIso(data.createdAt),
        } as MaintenanceAuditRow
      })
      .filter((row) => MAINTENANCE_EVENTS.includes(row.event as (typeof MAINTENANCE_EVENTS)[number]))

    const limitedRows = rows.slice(0, limit)
    const nextCursor = limitedRows.length === limit ? limitedRows[limitedRows.length - 1]?.createdAt || '' : ''

    return NextResponse.json({
      success: true,
      data: {
        rows: limitedRows,
        nextCursor,
      },
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

    console.error('[GET /api/admin/maintenance/audit-logs] error', error)
    return NextResponse.json({ error: 'メンテナンス監査ログの取得に失敗しました' }, { status: 500 })
  }
}
