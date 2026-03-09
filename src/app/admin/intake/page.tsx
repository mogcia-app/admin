'use client'

import { useCallback, useEffect, useState } from 'react'
import { Copy, Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'
import { useCompanies } from '@/hooks/useCompanies'
import { getErrorMessage, parseJsonResponse } from '@/lib/http-response'

interface IntakeItem {
  token: string
  status: string
  companyName: string
  registeredCompanyId?: string
  registeredCompanyName?: string
  contractStartDate: string
  contractEndDate?: string
  planTier: string
  email: string
  submittedAt: string
  confirmedAt: string
  submittedData?: Record<string, unknown> | null
  userId?: string
  signalInviteUrl?: string
  signalInviteExpiresAt?: string
}

interface ConfirmResult {
  uid: string
  email: string
  signalInviteUrl: string
  signalInviteExpiresAt: string
}

function toConfirmResult(data: Record<string, unknown>): ConfirmResult {
  return {
    uid: String(data.uid || ''),
    email: String(data.email || ''),
    signalInviteUrl: String(data.signalInviteUrl || ''),
    signalInviteExpiresAt: String(data.signalInviteExpiresAt || ''),
  }
}

function toPlanLabel(plan: string): string {
  if (plan === 'basic') return 'ベーシック'
  if (plan === 'standard') return 'スタンダード'
  if (plan === 'pro') return 'プロ'
  return plan
}

function calcEndDate(startDate: string): string {
  if (!startDate) return ''
  const date = new Date(startDate)
  if (Number.isNaN(date.getTime())) return ''
  date.setFullYear(date.getFullYear() + 1)
  return date.toISOString().slice(0, 10)
}

const PLAN_OPTIONS = [
  { value: 'basic', label: 'ベーシック' },
  { value: 'standard', label: 'スタンダード' },
  { value: 'pro', label: 'プロ' },
]

const STATUS_TABS: Array<{ key: 'draft' | 'submitted' | 'confirmed'; label: string }> = [
  { key: 'draft', label: '下書き' },
  { key: 'submitted', label: '送信済み' },
  { key: 'confirmed', label: '確定済み' },
]

export default function AdminIntakePage() {
  const { user } = useAuth()
  const { companies, addCompany, removeCompany, refreshCompanies } = useCompanies()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingCompany, setSavingCompany] = useState(false)
  const [deletingCompanyId, setDeletingCompanyId] = useState<string | null>(null)
  const [confirmingToken, setConfirmingToken] = useState<string | null>(null)
  const [bulkRecovering, setBulkRecovering] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState<IntakeItem[]>([])
  const [createdIntakeUrl, setCreatedIntakeUrl] = useState('')
  const [confirmResult, setConfirmResult] = useState<ConfirmResult | null>(null)
  const [activeStatusTab, setActiveStatusTab] = useState<'draft' | 'submitted' | 'confirmed'>('submitted')

  const [companyName, setCompanyName] = useState('')
  const [contractStartDate, setContractStartDate] = useState(new Date().toISOString().slice(0, 10))
  const [contractEndDate, setContractEndDate] = useState(calcEndDate(new Date().toISOString().slice(0, 10)))
  const [planTier, setPlanTier] = useState<'basic' | 'standard' | 'pro'>('basic')
  const [email, setEmail] = useState('')
  const [registeredCompanyId, setRegisteredCompanyId] = useState('')
  const [newRegisteredCompanyName, setNewRegisteredCompanyName] = useState('')

  const fetchItems = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)
      const idToken = await user.getIdToken()
      const response = await fetch('/api/admin/intake-links?limit=200', {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      })
      const data = await parseJsonResponse<{ items?: IntakeItem[] } & Record<string, unknown>>(response)
      if (!response.ok) {
        throw new Error(getErrorMessage(data, '申込一覧の取得に失敗しました'))
      }
      setItems(data.items || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : '申込一覧の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  useEffect(() => {
    setContractEndDate(calcEndDate(contractStartDate))
  }, [contractStartDate])

  const confirmSubmission = async (token: string) => {
    if (!user) return

    try {
      setConfirmingToken(token)
      setError(null)
      setConfirmResult(null)
      const idToken = await user.getIdToken()
      const response = await fetch(`/api/admin/intake-links/${token}/confirm`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      })

      const data = await parseJsonResponse(response)
      if (!response.ok) {
        throw new Error(getErrorMessage(data, '救済確定に失敗しました'))
      }

      setConfirmResult(toConfirmResult(data))
      await fetchItems()
    } catch (err) {
      setError(err instanceof Error ? err.message : '救済確定に失敗しました')
    } finally {
      setConfirmingToken(null)
    }
  }

  const recoverAllSubmitted = async () => {
    if (!user) return
    const targets = items.filter((item) => item.status === 'submitted')
    if (targets.length === 0) {
      setError('救済対象の送信済みデータはありません')
      return
    }

    try {
      setBulkRecovering(true)
      setError(null)
      setConfirmResult(null)
      const idToken = await user.getIdToken()
      let successCount = 0
      let lastResult: ConfirmResult | null = null

      for (const item of targets) {
        const response = await fetch(`/api/admin/intake-links/${item.token}/confirm`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        })
        const data = await parseJsonResponse(response)
        if (response.ok) {
          successCount += 1
          lastResult = toConfirmResult(data)
        }
      }

      if (successCount === 0) {
        throw new Error('一括救済で確定できるデータがありませんでした')
      }

      setConfirmResult(lastResult)
      await fetchItems()
    } catch (err) {
      setError(err instanceof Error ? err.message : '一括救済に失敗しました')
    } finally {
      setBulkRecovering(false)
    }
  }

  const createLink = async () => {
    if (!user) return
    if (!companyName.trim() || !contractStartDate || !email.trim()) {
      setError('会社名・契約日・メールアドレスは必須です')
      return
    }

    try {
      setSaving(true)
      setError(null)
      const idToken = await user.getIdToken()
      const response = await fetch('/api/admin/intake-links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          companyName,
          registeredCompanyId: registeredCompanyId || undefined,
          contractStartDate,
          contractEndDate,
          planTier,
          email,
        }),
      })
      const data = await parseJsonResponse(response)
      if (!response.ok) {
        throw new Error(getErrorMessage(data, 'intakeリンクの発行に失敗しました'))
      }

      setCreatedIntakeUrl(String(data.intakeUrl || ''))
      setCompanyName('')
      setEmail('')
      setContractEndDate(calcEndDate(contractStartDate))
      setRegisteredCompanyId('')
      await fetchItems()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'intakeリンクの発行に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const addRegisteredCompany = async () => {
    const name = newRegisteredCompanyName.trim()
    if (!name) {
      setError('登録企業名を入力してください')
      return
    }

    try {
      setSavingCompany(true)
      setError(null)
      await addCompany(
        {
          name,
          status: 'active',
          createdBy: user?.uid || user?.email || 'admin',
        },
        user?.uid || user?.email || 'admin'
      )
      setNewRegisteredCompanyName('')
      await refreshCompanies()
    } catch (err) {
      setError(err instanceof Error ? err.message : '登録企業の追加に失敗しました')
    } finally {
      setSavingCompany(false)
    }
  }

  const deleteRegisteredCompany = async (companyId: string) => {
    if (!confirm('この登録企業を削除しますか？')) return

    try {
      setDeletingCompanyId(companyId)
      setError(null)
      await removeCompany(companyId)
      if (registeredCompanyId === companyId) {
        setRegisteredCompanyId('')
      }
      await refreshCompanies()
    } catch (err) {
      setError(err instanceof Error ? err.message : '登録企業の削除に失敗しました')
    } finally {
      setDeletingCompanyId(null)
    }
  }

  const filteredItems = items.filter((item) => item.status === activeStatusTab)
  const draftCount = items.filter((item) => item.status === 'draft').length
  const submittedCount = items.filter((item) => item.status === 'submitted').length
  const confirmedCount = items.filter((item) => item.status === 'confirmed').length

  return (
    <div className="space-y-4">
      <div className="border border-slate-200 bg-white shadow-sm">
        <div className="px-5 py-4 border-b border-slate-200 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">利用者Intake管理</h1>
            {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
          </div>
          <Button onClick={fetchItems} variant="outline" disabled={loading} className="rounded-none">
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            更新
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-none border border-slate-200 bg-white px-5 py-4">
          <p className="text-xs text-slate-500">下書き</p>
          <p className="text-2xl font-semibold mt-1">{draftCount}</p>
        </div>
        <div className="rounded-none border border-slate-200 bg-white px-5 py-4">
          <p className="text-xs text-slate-500">送信済み（救済対象）</p>
          <p className="text-2xl font-semibold mt-1">{submittedCount}</p>
        </div>
        <div className="rounded-none border border-slate-200 bg-white px-5 py-4">
          <p className="text-xs text-slate-500">確定済み</p>
          <p className="text-2xl font-semibold mt-1">{confirmedCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        <div className="xl:col-span-3 rounded-none border border-slate-200 bg-white px-5 py-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-none bg-slate-900 text-white text-xs px-2">1</span>
            <h2 className="font-semibold">Intakeリンク発行</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-500">会社名</label>
            <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="mt-1 h-10 w-full border rounded-none px-3" placeholder="例: 株式会社〇〇" />
          </div>
          <div>
            <label className="text-xs text-slate-500">契約日</label>
            <input type="date" value={contractStartDate} onChange={(e) => setContractStartDate(e.target.value)} className="mt-1 h-10 w-full border rounded-none px-3" />
          </div>
          <div>
            <label className="text-xs text-slate-500">終了日（1年後）</label>
            <input type="date" value={contractEndDate} readOnly className="mt-1 h-10 w-full border rounded-none px-3 bg-slate-50" />
          </div>
          <div>
            <label className="text-xs text-slate-500">登録企業（内部管理用）</label>
            <select
              value={registeredCompanyId}
              onChange={(e) => {
                const nextId = e.target.value
                setRegisteredCompanyId(nextId)
                if (!companyName.trim() && nextId) {
                  const selected = companies.find((company) => company.id === nextId)
                  if (selected?.name) {
                    setCompanyName(selected.name)
                  }
                }
              }}
              className="mt-1 h-10 w-full border rounded-none px-3"
            >
              <option value="">MOGCIA</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-500 mt-1">未選択時は MOGCIA として保存されます</p>
          </div>
          <div>
            <label className="text-xs text-slate-500">プラン</label>
            <select value={planTier} onChange={(e) => setPlanTier(e.target.value as 'basic' | 'standard' | 'pro')} className="mt-1 h-10 w-full border rounded-none px-3">
              {PLAN_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500">メールアドレス</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 h-10 w-full border rounded-none px-3" placeholder="client@example.com" />
          </div>
        </div>
          <Button onClick={createLink} disabled={saving} className="w-full sm:w-auto rounded-none">{saving ? '作成中...' : 'intakeリンクを発行'}</Button>

          {createdIntakeUrl && (
            <div className="rounded-none border border-emerald-200 p-3 bg-emerald-50">
              <p className="text-xs text-emerald-700 mb-1">発行済みURL</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <input value={createdIntakeUrl} readOnly className="h-9 flex-1 border rounded-none px-3 bg-white text-sm" />
                <Button
                  variant="outline"
                  onClick={() => navigator.clipboard.writeText(createdIntakeUrl)}
                >
                  <Copy className="h-4 w-4 mr-1" />コピー
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="xl:col-span-2 rounded-none border border-slate-200 bg-white px-5 py-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-none bg-slate-900 text-white text-xs px-2">2</span>
            <h2 className="font-semibold">販売代理店</h2>
          </div>
          <div className="flex gap-2">
            <input
              value={newRegisteredCompanyName}
              onChange={(e) => setNewRegisteredCompanyName(e.target.value)}
              placeholder="登録企業名"
              className="h-10 flex-1 border rounded-none px-3"
            />
            <Button onClick={addRegisteredCompany} disabled={savingCompany} className="rounded-none">
              {savingCompany ? '追加中...' : '追加'}
            </Button>
          </div>
          <div className="border rounded-none overflow-hidden max-h-[360px] overflow-y-auto">
            <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500">
              <tr>
                <th className="px-3 py-2 text-left">企業名</th>
                <th className="px-3 py-2 text-left">状態</th>
                <th className="px-3 py-2 text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((company) => (
                <tr key={company.id} className="border-t border-slate-100">
                  <td className="px-3 py-2">{company.name}</td>
                  <td className="px-3 py-2">{company.status}</td>
                  <td className="px-3 py-2 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteRegisteredCompany(company.id)}
                      disabled={deletingCompanyId === company.id}
                    >
                      {deletingCompanyId === company.id ? '削除中...' : '削除'}
                    </Button>
                  </td>
                </tr>
              ))}
              {companies.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-3 py-6 text-center text-slate-500">登録企業がありません</td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      </div>

      <div className="rounded-none border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
            <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-none bg-slate-900 text-white text-xs px-2">3</span>
            <h2 className="font-semibold">ステータス別一覧</h2>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={recoverAllSubmitted}
              disabled={bulkRecovering || submittedCount === 0}
            >
              {bulkRecovering ? '一括救済中...' : '送信済みを一括救済'}
            </Button>
          </div>
          <div className="mt-3 flex gap-2">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveStatusTab(tab.key)}
                className={`px-3 py-1.5 rounded-none text-sm border ${
                  activeStatusTab === tab.key
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        {loading ? (
          <div className="p-8 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : filteredItems.length === 0 ? (
          <div className="p-8 text-sm text-slate-500">該当データはありません</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500">
              <tr className="border-b border-slate-200">
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">会社名</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">登録企業</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">メール</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">契約日</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">プラン</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">ステータス日時</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">UID</th>
                <th className="px-5 py-3 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr key={item.token} className="border-t border-slate-100">
                  <td className="px-5 py-2.5">{item.companyName}</td>
                  <td className="px-5 py-2.5">{item.registeredCompanyName || '-'}</td>
                  <td className="px-5 py-2.5">{String((item.submittedData?.email as string) || item.email || '-')}</td>
                  <td className="px-5 py-2.5">{String((item.submittedData?.contractDate as string) || item.contractStartDate || '-')}</td>
                  <td className="px-5 py-2.5">{toPlanLabel(item.planTier)}</td>
                  <td className="px-5 py-2.5">
                    {item.status === 'draft' && '-'}
                    {item.status === 'submitted' && (item.submittedAt ? new Date(item.submittedAt).toLocaleString('ja-JP') : '-')}
                    {item.status === 'confirmed' && (item.confirmedAt ? new Date(item.confirmedAt).toLocaleString('ja-JP') : '-')}
                  </td>
                  <td className="px-5 py-2.5 font-mono text-xs">{item.userId || '-'}</td>
                  <td className="px-5 py-2.5 text-right">
                    {item.status === 'submitted' ? (
                      <Button
                        size="sm"
                        onClick={() => confirmSubmission(item.token)}
                        disabled={confirmingToken === item.token}
                      >
                        {confirmingToken === item.token ? '救済中...' : '救済確定'}
                      </Button>
                    ) : item.status === 'confirmed' && item.signalInviteUrl ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setConfirmResult({
                            uid: item.userId || '-',
                            email: String((item.submittedData?.email as string) || item.email || '-'),
                            signalInviteUrl: item.signalInviteUrl || '',
                            signalInviteExpiresAt: item.signalInviteExpiresAt || '',
                          })
                        }
                      >
                        招待情報
                      </Button>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        )}
      </div>

      {confirmResult && (
        <div className="rounded-none border border-emerald-200 bg-emerald-50 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-none bg-emerald-700 text-white text-xs px-2">4</span>
            <h2 className="font-semibold text-emerald-900">確定完了</h2>
          </div>
          <p className="text-sm">UID: {confirmResult.uid}</p>
          <p className="text-sm">メール: {confirmResult.email}</p>
          <p className="text-sm text-slate-700">初期パスワードは `/users` の詳細画面で手動発行してください。</p>
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <span className="text-sm">Signal.ツール招待リンク:</span>
            <input value={confirmResult.signalInviteUrl} readOnly className="h-9 flex-1 border rounded-none px-3 bg-white text-sm" />
            <Button variant="outline" onClick={() => navigator.clipboard.writeText(confirmResult.signalInviteUrl)}>
              <Copy className="h-4 w-4 mr-1" />コピー
            </Button>
          </div>
          <p className="text-xs text-slate-600">有効期限: {new Date(confirmResult.signalInviteExpiresAt).toLocaleString('ja-JP')}</p>
        </div>
      )}
    </div>
  )
}
