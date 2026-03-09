'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'

type ResultFilter = 'all' | 'success' | 'failed'

interface LoginEventRow {
  id: string
  eventType: string
  actorUid: string
  actorName: string
  actorEmail: string
  errorCode: string
  ip: string
  userAgent: string
  source: string
  createdAt: string
}

interface LoginEventsResponse {
  summary: {
    totalCount: number
    successCount: number
    failedCount: number
    uniqueUsers: number
  }
  items: LoginEventRow[]
}

function getDateString(offsetDays: number): string {
  const date = new Date()
  date.setDate(date.getDate() + offsetDays)
  return date.toISOString().slice(0, 10)
}

function toEventLabel(value: string): string {
  if (value === 'auth.login.success') return '成功'
  if (value === 'auth.login.failed') return '失敗'
  return value
}

export default function AdminLoginEventsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<LoginEventsResponse | null>(null)

  const [from, setFrom] = useState<string>(getDateString(-7))
  const [to, setTo] = useState<string>(getDateString(0))
  const [resultFilter, setResultFilter] = useState<ResultFilter>('all')
  const [limit, setLimit] = useState<string>('300')

  const queryString = useMemo(() => {
    const nextTo = to ? `${to}T23:59:59.999Z` : ''
    const parts = [
      from ? `from=${encodeURIComponent(`${from}T00:00:00.000Z`)}` : '',
      nextTo ? `to=${encodeURIComponent(nextTo)}` : '',
      `result=${encodeURIComponent(resultFilter)}`,
      limit ? `limit=${encodeURIComponent(limit)}` : '',
    ].filter(Boolean)

    return parts.join('&')
  }, [from, to, resultFilter, limit])

  const fetchLoginEvents = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)
      const idToken = await user.getIdToken()
      const response = await fetch(`/api/admin/login-events?${queryString}`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      })

      const data = (await response.json().catch(() => ({}))) as LoginEventsResponse & { error?: string }
      if (!response.ok) {
        throw new Error(data.error || 'ログインイベントの取得に失敗しました')
      }

      setResult(data)
    } catch (err) {
      setResult(null)
      setError(err instanceof Error ? err.message : 'ログインイベントの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }, [queryString, user])

  useEffect(() => {
    fetchLoginEvents()
  }, [fetchLoginEvents])

  return (
    <div className="space-y-4">
      <div className="border border-slate-200 bg-white shadow-sm">
        <div className="px-5 py-4 border-b border-slate-200 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">ログインイベント</h1>
            <p className="text-sm text-slate-500">
              {result ? `${result.summary.totalCount} 件` : '集計を表示中'}
              {error && <span className="text-red-600 ml-2">({error})</span>}
            </p>
          </div>
          <Button onClick={fetchLoginEvents} variant="outline" disabled={loading} className="rounded-none">
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            再取得
          </Button>
        </div>
      </div>

      <div className="border border-slate-200 bg-white px-5 py-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <div>
          <label className="text-xs text-slate-500">期間開始</label>
          <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="mt-1 h-10 w-full rounded-none border border-slate-200 px-3 text-sm" />
        </div>
        <div>
          <label className="text-xs text-slate-500">期間終了</label>
          <input type="date" value={to} onChange={(event) => setTo(event.target.value)} className="mt-1 h-10 w-full rounded-none border border-slate-200 px-3 text-sm" />
        </div>
        <div>
          <label className="text-xs text-slate-500">結果</label>
          <select
            value={resultFilter}
            onChange={(event) => setResultFilter(event.target.value as ResultFilter)}
            className="mt-1 h-10 w-full rounded-none border border-slate-200 px-3 text-sm"
          >
            <option value="all">すべて</option>
            <option value="success">成功のみ</option>
            <option value="failed">失敗のみ</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-500">取得上限</label>
          <input value={limit} onChange={(event) => setLimit(event.target.value)} className="mt-1 h-10 w-full rounded-none border border-slate-200 px-3 text-sm" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="border border-slate-200 bg-white px-5 py-4">
          <p className="text-xs text-slate-500">総件数</p>
          <p className="text-2xl font-semibold mt-1">{result?.summary.totalCount || 0}</p>
        </div>
        <div className="border border-slate-200 bg-white px-5 py-4">
          <p className="text-xs text-slate-500">成功</p>
          <p className="text-2xl font-semibold mt-1">{result?.summary.successCount || 0}</p>
        </div>
        <div className="border border-slate-200 bg-white px-5 py-4">
          <p className="text-xs text-slate-500">失敗</p>
          <p className="text-2xl font-semibold mt-1">{result?.summary.failedCount || 0}</p>
        </div>
        <div className="border border-slate-200 bg-white px-5 py-4">
          <p className="text-xs text-slate-500">ユーザー数</p>
          <p className="text-2xl font-semibold mt-1">{result?.summary.uniqueUsers || 0}</p>
        </div>
      </div>

      <div className="border border-slate-200 bg-white overflow-hidden">
        {loading ? (
          <div className="min-h-[220px] flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : !result || result.items.length === 0 ? (
          <div className="min-h-[120px] flex items-center justify-center text-slate-500">データがありません</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs text-slate-500">
                  <th className="px-3 py-2 text-left">日時</th>
                  <th className="px-3 py-2 text-left">結果</th>
                  <th className="px-3 py-2 text-left">ユーザー</th>
                  <th className="px-3 py-2 text-left">メール</th>
                  <th className="px-3 py-2 text-left">errorCode</th>
                  <th className="px-3 py-2 text-left">IP</th>
                  <th className="px-3 py-2 text-left">source</th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((row) => (
                  <tr key={row.id} className="border-b border-slate-100">
                    <td className="px-3 py-2">{row.createdAt ? new Date(row.createdAt).toLocaleString('ja-JP') : '-'}</td>
                    <td className="px-3 py-2">{toEventLabel(row.eventType)}</td>
                    <td className="px-3 py-2">{row.actorName || row.actorUid || '-'}</td>
                    <td className="px-3 py-2">{row.actorEmail || '-'}</td>
                    <td className="px-3 py-2">{row.errorCode || '-'}</td>
                    <td className="px-3 py-2">{row.ip || '-'}</td>
                    <td className="px-3 py-2">{row.source || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
