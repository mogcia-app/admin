'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'
import { UI_EVENT_TYPE } from '@/lib/ui-event-types'

interface AggregateItem {
  key: string
  label: string
  count: number
  uniqueUsers: number
}

interface UiEventsResponse {
  totalClicks: number
  uniqueUsers: number
  eventType: string
  from: string | null
  to: string | null
  buttonBreakdown: AggregateItem[]
  userBreakdown: AggregateItem[]
  recentLogs: Array<Record<string, unknown>>
}

const EVENT_TYPE_OPTIONS = [
  { value: UI_EVENT_TYPE.SIDEBAR_CLICK, label: 'サイドバー' },
  { value: UI_EVENT_TYPE.PAGE_BUTTON_CLICK, label: 'ページ内ボタン' },
]

function getEventTypeLabel(value: string): string {
  const matched = EVENT_TYPE_OPTIONS.find((item) => item.value === value)
  return matched?.label || value
}

function getDateString(offsetDays: number): string {
  const date = new Date()
  date.setDate(date.getDate() + offsetDays)
  return date.toISOString().slice(0, 10)
}

export default function UiEventsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<UiEventsResponse | null>(null)
  const [eventType, setEventType] = useState<string>(UI_EVENT_TYPE.SIDEBAR_CLICK)
  const [from, setFrom] = useState<string>(getDateString(-7))
  const [to, setTo] = useState<string>(getDateString(0))
  const [actorUid, setActorUid] = useState('')
  const [buttonId, setButtonId] = useState('')
  const [limit, setLimit] = useState('300')

  const dateRangeQuery = useMemo(() => {
    const nextTo = to ? `${to}T23:59:59.999Z` : ''
    const parts = [
      from ? `from=${encodeURIComponent(`${from}T00:00:00.000Z`)}` : '',
      nextTo ? `to=${encodeURIComponent(nextTo)}` : '',
      `eventType=${encodeURIComponent(eventType)}`,
      actorUid ? `actorUid=${encodeURIComponent(actorUid)}` : '',
      buttonId ? `buttonId=${encodeURIComponent(buttonId)}` : '',
      limit ? `limit=${encodeURIComponent(limit)}` : '',
    ].filter(Boolean)

    return parts.join('&')
  }, [from, to, eventType, actorUid, buttonId, limit])

  const fetchEvents = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)
      const idToken = await user.getIdToken()
      const response = await fetch(`/api/admin/ui-events/sidebar-clicks?${dateRangeQuery}`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.error || 'UI操作ログの取得に失敗しました')
      }

      setResult(data as UiEventsResponse)
    } catch (err) {
      setResult(null)
      setError(err instanceof Error ? err.message : 'UI操作ログの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }, [user, dateRangeQuery])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  return (
    <div className="space-y-4">
      <div className="border border-slate-200 bg-white shadow-sm">
        <div className="px-5 py-4 border-b border-slate-200 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">ユーザー行動ログ</h1>
            <p className="text-sm text-slate-500">
              {result ? `${result.totalClicks} クリックを表示中` : '集計を表示中'}
              {error && <span className="text-red-600 ml-2">({error})</span>}
            </p>
          </div>
          <Button onClick={fetchEvents} variant="outline" disabled={loading} className="rounded-none">
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            再取得
          </Button>
        </div>
      </div>

      <div className="border border-slate-200 bg-white px-5 py-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-slate-500">イベント種別</label>
          <select
            value={eventType}
            onChange={(event) => setEventType(event.target.value)}
            className="mt-1 h-10 w-full rounded-none border border-slate-200 px-3 text-sm"
          >
            {EVENT_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-500">期間開始</label>
          <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="mt-1 h-10 w-full rounded-none border border-slate-200 px-3 text-sm" />
        </div>
        <div>
          <label className="text-xs text-slate-500">期間終了</label>
          <input type="date" value={to} onChange={(event) => setTo(event.target.value)} className="mt-1 h-10 w-full rounded-none border border-slate-200 px-3 text-sm" />
        </div>
        <div>
          <label className="text-xs text-slate-500">実行ユーザーUID</label>
          <input value={actorUid} onChange={(event) => setActorUid(event.target.value)} placeholder="任意" className="mt-1 h-10 w-full rounded-none border border-slate-200 px-3 text-sm" />
        </div>
        <div>
          <label className="text-xs text-slate-500">ボタンID</label>
          <input value={buttonId} onChange={(event) => setButtonId(event.target.value)} placeholder="任意" className="mt-1 h-10 w-full rounded-none border border-slate-200 px-3 text-sm" />
        </div>
        <div>
          <label className="text-xs text-slate-500">取得上限</label>
          <input value={limit} onChange={(event) => setLimit(event.target.value)} className="mt-1 h-10 w-full rounded-none border border-slate-200 px-3 text-sm" />
        </div>
      </div>

      {loading ? (
        <div className="border border-slate-200 bg-white min-h-[220px] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : !result ? (
        <div className="border border-slate-200 bg-white min-h-[120px] flex items-center justify-center text-slate-500">
          データがありません
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="border border-slate-200 bg-white px-5 py-4">
              <p className="text-xs text-slate-500">総クリック数</p>
              <p className="text-2xl font-semibold mt-1">{result.totalClicks}</p>
            </div>
            <div className="border border-slate-200 bg-white px-5 py-4">
              <p className="text-xs text-slate-500">ユーザー数</p>
              <p className="text-2xl font-semibold mt-1">{result.uniqueUsers}</p>
            </div>
            <div className="border border-slate-200 bg-white px-5 py-4">
              <p className="text-xs text-slate-500">イベント種別</p>
              <p className="text-lg font-semibold mt-1">{getEventTypeLabel(result.eventType)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 font-medium text-sm">ボタン別クリック数</div>
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs">
                  <tr className="border-b border-slate-200">
                    <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider">ボタンID</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider">ラベル</th>
                    <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider">回数</th>
                  </tr>
                </thead>
                <tbody>
                  {result.buttonBreakdown.map((item) => (
                    <tr key={item.key} className="border-t border-slate-100">
                      <td className="px-5 py-2.5 font-mono text-xs">{item.key}</td>
                      <td className="px-5 py-2.5">{item.label}</td>
                      <td className="px-5 py-2.5 text-right">{item.count}</td>
                    </tr>
                  ))}
                  {result.buttonBreakdown.length === 0 && (
                    <tr><td className="px-5 py-6 text-center text-slate-500" colSpan={3}>データなし</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 font-medium text-sm">ユーザー別クリック数</div>
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs">
                  <tr className="border-b border-slate-200">
                    <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider">実行ユーザーUID</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider">メール</th>
                    <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider">回数</th>
                  </tr>
                </thead>
                <tbody>
                  {result.userBreakdown.map((item) => (
                    <tr key={item.key} className="border-t border-slate-100">
                      <td className="px-5 py-2.5 font-mono text-xs">{item.key}</td>
                      <td className="px-5 py-2.5">{item.label}</td>
                      <td className="px-5 py-2.5 text-right">{item.count}</td>
                    </tr>
                  ))}
                  {result.userBreakdown.length === 0 && (
                    <tr><td className="px-5 py-6 text-center text-slate-500" colSpan={3}>データなし</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
