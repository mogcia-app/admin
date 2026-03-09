import { NextRequest, NextResponse } from 'next/server'
import { Query } from 'firebase-admin/firestore'
import { UI_EVENT_TYPE, type UiEventAggregateResponse } from '@/lib/ui-event-types'
import { UI_EVENT_COLLECTION, assertUiEventAdminRole, parseDateFilter } from '@/lib/ui-event-server'
import { adminFirestore } from '@/lib/firebase-admin-server'

export const runtime = 'nodejs'

function toIso(value: unknown): string {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'object' && value && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate().toISOString()
  }
  return ''
}

export async function GET(request: NextRequest) {
  try {
    await assertUiEventAdminRole(request)

    const params = request.nextUrl.searchParams
    const fromRaw = params.get('from')
    const toRaw = params.get('to')
    const eventType = params.get('eventType') || UI_EVENT_TYPE.SIDEBAR_CLICK
    const actorUid = params.get('actorUid') || ''
    const buttonId = params.get('buttonId') || ''
    const limitValue = Number(params.get('limit') || '300')
    const limit = Number.isFinite(limitValue) ? Math.min(Math.max(Math.floor(limitValue), 1), 1000) : 300

    const from = parseDateFilter(fromRaw)
    const to = parseDateFilter(toRaw)

    let q: Query = adminFirestore().collection(UI_EVENT_COLLECTION)

    if (from) {
      q = q.where('createdAt', '>=', from)
    }
    if (to) {
      q = q.where('createdAt', '<=', to)
    }

    q = q.orderBy('createdAt', 'desc').limit(limit)

    const snapshot = await q.get()

    const rows = snapshot.docs
      .map((doc) => {
        const data = doc.data() as Record<string, unknown>
        return {
          id: doc.id,
          eventType: String(data.eventType || ''),
          actorUid: String(data.actorUid || ''),
          actorEmail: String(data.actorEmail || ''),
          buttonId: String(data.buttonId || ''),
          label: String(data.label || ''),
          href: String(data.href || ''),
          currentPath: String(data.currentPath || ''),
          pagePath: String(data.pagePath || ''),
          sessionId: String(data.sessionId || ''),
          clickedAtClient: String(data.clickedAtClient || ''),
          createdAt: toIso(data.createdAt),
          clickedAt: toIso(data.clickedAt) || toIso(data.createdAt),
        }
      })
      .filter((row) => row.eventType === eventType)
      .filter((row) => (actorUid ? row.actorUid === actorUid : true))
      .filter((row) => (buttonId ? row.buttonId === buttonId : true))

    const buttonMap = new Map<string, { label: string; count: number; users: Set<string> }>()
    const userMap = new Map<string, { label: string; count: number; users: Set<string> }>()

    for (const row of rows) {
      const buttonKey = row.buttonId || 'unknown'
      const buttonEntry = buttonMap.get(buttonKey) || { label: row.label || buttonKey, count: 0, users: new Set<string>() }
      buttonEntry.count += 1
      buttonEntry.users.add(row.actorUid)
      buttonMap.set(buttonKey, buttonEntry)

      const userKey = row.actorUid || 'unknown'
      const userEntry = userMap.get(userKey) || {
        label: row.actorEmail || userKey,
        count: 0,
        users: new Set<string>(),
      }
      userEntry.count += 1
      userEntry.users.add(userKey)
      userMap.set(userKey, userEntry)
    }

    const response: UiEventAggregateResponse = {
      totalClicks: rows.length,
      uniqueUsers: new Set(rows.map((row) => row.actorUid).filter(Boolean)).size,
      eventType,
      from: fromRaw,
      to: toRaw,
      buttonBreakdown: [...buttonMap.entries()]
        .map(([key, item]) => ({ key, label: item.label, count: item.count, uniqueUsers: item.users.size }))
        .sort((a, b) => b.count - a.count),
      userBreakdown: [...userMap.entries()]
        .map(([key, item]) => ({ key, label: item.label, count: item.count, uniqueUsers: item.users.size }))
        .sort((a, b) => b.count - a.count),
      recentLogs: rows.slice(0, 100),
    }

    return NextResponse.json(response)
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('認証')) {
        return NextResponse.json({ error: error.message }, { status: 401 })
      }
      if (error.message.includes('権限')) {
        return NextResponse.json({ error: error.message }, { status: 403 })
      }
    }

    console.error('[GET /api/admin/ui-events/sidebar-clicks] error', error)
    return NextResponse.json({ error: 'UIイベント集計の取得に失敗しました' }, { status: 500 })
  }
}
