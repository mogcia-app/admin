'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, RefreshCw, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'
import { getErrorMessage, parseJsonResponse } from '@/lib/http-response'

type SessionPolicy = 'allow_existing' | 'force_logout'

type MaintenanceConfig = {
  enabled: boolean
  message: string
  allowAdminBypass: boolean
  allowedRoles: string[]
  loginBlocked: boolean
  sessionPolicy: SessionPolicy
  allowPasswordReset: boolean
  featureFlags: Record<string, boolean>
  version: number
  updatedBy: string
  updatedByEmail: string
  updatedAt: string
}

type MaintenanceAuditLog = {
  id: string
  event: string
  actorUid: string
  actorEmail: string
  reason: string
  changedKeys: string[]
  createdAt: string
}

const FEATURE_LABELS: Record<string, { label: string; description: string }> = {
  'dashboard.write': { label: 'ダッシュボード更新', description: 'ダッシュボードの更新系操作を許可' },
  'plan.write': { label: 'プラン更新', description: 'プラン関連の更新系操作を許可' },
  'post.write': { label: '投稿更新', description: '投稿作成/編集の更新系操作を許可' },
  'analytics.write': { label: '分析更新', description: '分析設定などの更新系操作を許可' },
  'ai.generate': { label: 'AI生成', description: 'AI生成APIの実行を許可' },
}

function formatDateTime(value: string): string {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('ja-JP')
}

function toEventLabel(value: string): string {
  if (value === 'admin.maintenance.update') return '全体メンテ更新'
  if (value === 'admin.login_control.update') return 'ログイン制御更新'
  if (value === 'admin.feature_flags.update') return '機能フラグ更新'
  return value
}

export default function AdminMaintenancePage() {
  const { user, adminUser } = useAuth()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [config, setConfig] = useState<MaintenanceConfig | null>(null)
  const [logs, setLogs] = useState<MaintenanceAuditLog[]>([])

  const [reason, setReason] = useState('')
  const [message, setMessage] = useState('')
  const [enabled, setEnabled] = useState(false)
  const [allowAdminBypass, setAllowAdminBypass] = useState(true)
  const [allowedRolesText, setAllowedRolesText] = useState('super_admin')

  const [loginBlocked, setLoginBlocked] = useState(false)
  const [sessionPolicy, setSessionPolicy] = useState<SessionPolicy>('allow_existing')
  const [allowPasswordReset, setAllowPasswordReset] = useState(true)

  const [featureFlags, setFeatureFlags] = useState<Record<string, boolean>>({})

  const canEdit = adminUser?.role === 'super_admin' || adminUser?.role === 'billing_admin'
  const isSuperAdmin = adminUser?.role === 'super_admin'

  const hydrateForm = useCallback((next: MaintenanceConfig) => {
    setConfig(next)
    setMessage(next.message || '')
    setEnabled(next.enabled)
    setAllowAdminBypass(next.allowAdminBypass)
    setAllowedRolesText((next.allowedRoles || []).join(', '))
    setLoginBlocked(next.loginBlocked)
    setSessionPolicy(next.sessionPolicy)
    setAllowPasswordReset(next.allowPasswordReset)
    setFeatureFlags(next.featureFlags || {})
  }, [])

  const fetchMaintenance = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)

      const idToken = await user.getIdToken()
      const [statusRes, logsRes] = await Promise.all([
        fetch('/api/admin/maintenance', {
          headers: { Authorization: `Bearer ${idToken}` },
        }),
        fetch('/api/admin/maintenance/audit-logs?limit=100', {
          headers: { Authorization: `Bearer ${idToken}` },
        }),
      ])

      const statusJson = await parseJsonResponse<{ data: MaintenanceConfig } & Record<string, unknown>>(statusRes)
      const logsJson = await parseJsonResponse<{ data?: { rows?: MaintenanceAuditLog[] } } & Record<string, unknown>>(logsRes)

      if (!statusRes.ok) {
        throw new Error(getErrorMessage(statusJson, 'メンテナンス設定の取得に失敗しました'))
      }
      if (!logsRes.ok) {
        throw new Error(getErrorMessage(logsJson, '監査ログの取得に失敗しました'))
      }

      const nextConfig = statusJson.data
      hydrateForm(nextConfig)
      const logData = logsJson.data
      const rowsCandidate =
        logData && typeof logData === 'object' && 'rows' in logData
          ? (logData as { rows: unknown }).rows
          : []
      const rows = Array.isArray(rowsCandidate) ? (rowsCandidate as MaintenanceAuditLog[]) : []
      setLogs(rows.slice(0, 100))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'データ取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }, [user, hydrateForm])

  useEffect(() => {
    fetchMaintenance()
  }, [fetchMaintenance])

  const summary = useMemo(() => {
    if (!config) {
      return {
        enabledFlags: 0,
        disabledFlags: 0,
      }
    }

    const values = Object.values(featureFlags)
    return {
      enabledFlags: values.filter(Boolean).length,
      disabledFlags: values.filter((v) => !v).length,
    }
  }, [config, featureFlags])

  const handleSave = async () => {
    if (!user || !config) return

    const nextAllowedRoles = allowedRolesText
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)

    if (!reason.trim()) {
      setError('変更理由は必須です')
      return
    }
    if (reason.trim().length < 10) {
      setError('変更理由は10文字以上で入力してください')
      return
    }
    if (enabled && !message.trim()) {
      setError('全体メンテナンスをONにする場合はメッセージを入力してください')
      return
    }
    if (nextAllowedRoles.length === 0) {
      setError('バイパス許可ロールを1件以上指定してください')
      return
    }

    if (enabled && !window.confirm('全体メンテナンスを有効化します。よろしいですか？')) {
      return
    }

    if (loginBlocked && sessionPolicy === 'force_logout' && !window.confirm('既存セッションを強制ログアウト対象にします。続行しますか？')) {
      return
    }

    if (loginBlocked && sessionPolicy === 'force_logout' && !isSuperAdmin) {
      setError('force_logout を伴うログイン制御は super_admin のみ実行できます')
      return
    }

    try {
      setSaving(true)
      setError(null)
      setSuccessMessage(null)

      const idToken = await user.getIdToken()
      const response = await fetch('/api/admin/maintenance', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          reason: reason.trim(),
          expectedVersion: config.version,
          patch: {
            enabled,
            message,
            allowAdminBypass,
            allowedRoles: nextAllowedRoles,
            loginBlocked,
            sessionPolicy,
            allowPasswordReset,
            featureFlags,
          },
        }),
      })

      const data = await parseJsonResponse(response)
      if (!response.ok) {
        throw new Error(getErrorMessage(data, '保存に失敗しました'))
      }

      const dataPayload = data.data
      const configCandidate =
        dataPayload && typeof dataPayload === 'object' && 'config' in dataPayload
          ? (dataPayload as { config: unknown }).config
          : null
      if (configCandidate && typeof configCandidate === 'object') {
        const nextConfig = configCandidate as MaintenanceConfig
        hydrateForm(nextConfig)
      }
      setReason('')
      setSuccessMessage('メンテナンス設定を更新しました')

      await fetchMaintenance()
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="border border-slate-200 bg-white shadow-sm">
        <div className="px-5 py-4 border-b border-slate-200 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">メンテナンス管理</h1>
            <p className="text-sm text-slate-500">
              全体メンテナンス / ログイン制御 / 機能フラグを一括管理
            </p>
            {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
            {successMessage && <p className="text-sm text-emerald-600 mt-1">{successMessage}</p>}
          </div>
          <Button onClick={fetchMaintenance} variant="outline" className="rounded-none" disabled={loading || saving}>
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            更新
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="border border-slate-200 bg-white px-5 py-4">
          <p className="text-xs text-slate-500">全体メンテ</p>
          <p className="text-lg font-semibold mt-1">{enabled ? 'ON' : 'OFF'}</p>
        </div>
        <div className="border border-slate-200 bg-white px-5 py-4">
          <p className="text-xs text-slate-500">ログイン制御</p>
          <p className="text-lg font-semibold mt-1">{loginBlocked ? 'ON' : 'OFF'}</p>
        </div>
        <div className="border border-slate-200 bg-white px-5 py-4">
          <p className="text-xs text-slate-500">更新許可フラグ</p>
          <p className="text-lg font-semibold mt-1">{summary.enabledFlags}</p>
        </div>
        <div className="border border-slate-200 bg-white px-5 py-4">
          <p className="text-xs text-slate-500">最終更新</p>
          <p className="text-sm font-medium mt-1">{formatDateTime(config?.updatedAt || '')}</p>
          <p className="text-xs text-slate-500 mt-1">{config?.updatedByEmail || '-'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 space-y-4">
          <div className="border border-slate-200 bg-white px-5 py-4 space-y-3">
            <h2 className="text-base font-semibold text-slate-900">全体メンテナンス</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} disabled={!canEdit || saving} />
                <span>有効化</span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={allowAdminBypass} onChange={(e) => setAllowAdminBypass(e.target.checked)} disabled={!canEdit || saving} />
                <span>管理者バイパス許可</span>
              </label>
            </div>
            <div>
              <label className="text-xs text-slate-500">ユーザー表示メッセージ</label>
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={2} className="mt-1 w-full border border-slate-200 rounded-none px-3 py-2 text-sm" disabled={!canEdit || saving} />
            </div>
            <div>
              <label className="text-xs text-slate-500">バイパス対象ロール（カンマ区切り）</label>
              <input value={allowedRolesText} onChange={(e) => setAllowedRolesText(e.target.value)} className="mt-1 h-10 w-full border border-slate-200 rounded-none px-3 text-sm" disabled={!canEdit || saving} />
            </div>
          </div>

          <div className="border border-slate-200 bg-white px-5 py-4 space-y-3">
            <h2 className="text-base font-semibold text-slate-900">ログイン制御</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={loginBlocked} onChange={(e) => setLoginBlocked(e.target.checked)} disabled={!canEdit || saving} />
                <span>ログイン遮断</span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={allowPasswordReset} onChange={(e) => setAllowPasswordReset(e.target.checked)} disabled={!canEdit || saving} />
                <span>パスワードリセット許可</span>
              </label>
            </div>
            <div>
              <label className="text-xs text-slate-500">既存セッションの扱い</label>
              <select
                value={sessionPolicy}
                onChange={(e) => setSessionPolicy(e.target.value as SessionPolicy)}
                disabled={!canEdit || saving}
                className="mt-1 h-10 w-full border border-slate-200 rounded-none px-3 text-sm"
              >
                <option value="allow_existing">既存セッション許可</option>
                <option value="force_logout">既存セッション強制ログアウト</option>
              </select>
              {!isSuperAdmin && (
                <p className="text-xs text-slate-500 mt-1">`force_logout` は super_admin のみ保存できます</p>
              )}
            </div>
          </div>

          <div className="border border-slate-200 bg-white px-5 py-4 space-y-3">
            <h2 className="text-base font-semibold text-slate-900">機能別フラグ</h2>
            <div className="space-y-2">
              {Object.keys(FEATURE_LABELS).map((key) => (
                <div key={key} className="border border-slate-200 px-3 py-2 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{FEATURE_LABELS[key].label}</p>
                    <p className="text-xs text-slate-500">{FEATURE_LABELS[key].description}</p>
                  </div>
                  <label className="flex items-center gap-2 text-sm whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={featureFlags[key] !== false}
                      onChange={(e) => setFeatureFlags((prev) => ({ ...prev, [key]: e.target.checked }))}
                      disabled={!canEdit || saving}
                    />
                    <span>{featureFlags[key] !== false ? 'ON' : 'OFF'}</span>
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="border border-slate-200 bg-white px-5 py-4 space-y-3">
            <h2 className="text-base font-semibold text-slate-900">変更実行</h2>
            <div>
              <label className="text-xs text-slate-500">変更理由（必須 / 10文字以上）</label>
              <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={4} className="mt-1 w-full border border-slate-200 rounded-none px-3 py-2 text-sm" disabled={!canEdit || saving} />
            </div>
            <Button onClick={handleSave} className="w-full rounded-none" disabled={!canEdit || saving || loading}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              保存
            </Button>
            {!canEdit && (
              <p className="text-xs text-slate-500">このアカウントは閲覧のみ可能です</p>
            )}
          </div>

          <div className="border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 font-medium text-sm">監査ログ（直近100件）</div>
            <div className="max-h-[520px] overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs sticky top-0">
                  <tr className="border-b border-slate-200">
                    <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider">時刻</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider">実行者</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider">イベント</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-t border-slate-100 align-top">
                      <td className="px-5 py-2.5 text-xs whitespace-nowrap">{formatDateTime(log.createdAt)}</td>
                      <td className="px-5 py-2.5 text-xs">
                        <div>{log.actorEmail || '-'}</div>
                        <div className="text-slate-500 font-mono">{log.actorUid || '-'}</div>
                      </td>
                      <td className="px-5 py-2.5 text-xs">
                        <div className="font-medium">{toEventLabel(log.event)}</div>
                        <div className="text-slate-500 mt-1">{log.reason || '-'}</div>
                      </td>
                    </tr>
                  ))}
                  {logs.length === 0 && (
                    <tr>
                      <td className="px-5 py-8 text-center text-slate-500" colSpan={3}>ログがありません</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
