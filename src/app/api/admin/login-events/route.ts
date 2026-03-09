import { NextRequest, NextResponse } from 'next/server'
import { Query, Timestamp } from 'firebase-admin/firestore'
import { adminFirestore } from '@/lib/firebase-admin-server'
import { authenticateAdminApiRequest, assertRoleAllowed } from '@/lib/admin-api-auth'

export const runtime = 'nodejs'

type ResultFilter = 'all' | 'success' | 'failed'

function parseDate(value: string | null): Date | null {
  if (!value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed
}

function parseResultFilter(value: string | null): ResultFilter {
  if (value === 'success' || value === 'failed') return value
  return 'all'
}

function parseLimit(value: string | null): number {
  const n = Number(value || '200')
  if (!Number.isFinite(n)) return 200
  return Math.min(Math.max(Math.floor(n), 1), 500)
}

function toEventType(result: Exclude<ResultFilter, 'all'>): string {
  return result === 'success' ? 'auth.login.success' : 'auth.login.failed'
}

function toIso(value: unknown): string {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (value instanceof Timestamp) return value.toDate().toISOString()
  if (typeof value === 'object' && value && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate().toISOString()
  }
  return ''
}

export async function GET(request: NextRequest) {
  try {
    const actor = await authenticateAdminApiRequest(request)
    assertRoleAllowed(actor, ['super_admin', 'billing_admin', 'admin', 'hq_admin'])

    const params = request.nextUrl.searchParams
    const from = parseDate(params.get('from'))
    const to = parseDate(params.get('to'))
    const result = parseResultFilter(params.get('result'))
    const limit = parseLimit(params.get('limit'))

    const db = adminFirestore()
    let baseQuery: Query = db.collection('loginEventLogs')

    if (from) {
      baseQuery = baseQuery.where('createdAt', '>=', Timestamp.fromDate(from))
    }
    if (to) {
      baseQuery = baseQuery.where('createdAt', '<=', Timestamp.fromDate(to))
    }

    const listQuery = result === 'all'
      ? baseQuery.orderBy('createdAt', 'desc').limit(limit)
      : baseQuery.where('eventType', '==', toEventType(result)).orderBy('createdAt', 'desc').limit(limit)

    const [listSnapshot, summarySnapshot] = await Promise.all([
      listQuery.get(),
      baseQuery.orderBy('createdAt', 'desc').limit(2000).get(),
    ])

    const rows = listSnapshot.docs.map((doc) => {
      const data = doc.data() as Record<string, unknown>
      return {
        id: doc.id,
        eventType: String(data.eventType || ''),
        actorUid: String(data.actorUid || ''),
        actorName: String(data.actorName || ''),
        actorEmail: String(data.actorEmail || ''),
        errorCode: String(data.errorCode || ''),
        ip: String(data.ip || ''),
        userAgent: String(data.userAgent || ''),
        source: String(data.source || ''),
        createdAt: toIso(data.createdAt),
      }
    })

    const summaryRows = summarySnapshot.docs.map((doc) => doc.data() as Record<string, unknown>)
    const totalCount = summaryRows.length
    const successCount = summaryRows.filter((row) => String(row.eventType || '') === 'auth.login.success').length
    const failedCount = summaryRows.filter((row) => String(row.eventType || '') === 'auth.login.failed').length
    const uniqueUsers = new Set(
      summaryRows
        .map((row) => String(row.actorUid || ''))
        .filter((uid) => uid.length > 0)
    ).size

    return NextResponse.json({
      summary: {
        totalCount,
        successCount,
        failedCount,
        uniqueUsers,
      },
      items: rows,
      filter: {
        result,
        from: from ? from.toISOString() : null,
        to: to ? to.toISOString() : null,
        limit,
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

    console.error('[GET /api/admin/login-events] error', error)
    return NextResponse.json({ error: 'ログインイベントの取得に失敗しました' }, { status: 500 })
  }
}
