'use client'

import React from 'react'
import { Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuditLogs } from '@/hooks/useAuditLogs'

function getTenantLabel(tenantType: string): string {
  if (tenantType === 'hq') return '本部'
  if (tenantType === 'agency') return '代理店'
  return tenantType
}

function getTenantBadgeClass(tenantType: string): string {
  if (tenantType === 'hq') return 'bg-blue-100 text-blue-800 border border-blue-200'
  if (tenantType === 'agency') return 'bg-amber-100 text-amber-800 border border-amber-200'
  return 'bg-slate-100 text-slate-700 border border-slate-200'
}

const ACTION_LABELS: Record<string, string> = {
  'agency.create': '代理店作成',
  'agency.update': '代理店更新',
  'agency.delete': '代理店削除',
  'agency.suspend': '代理店停止',
  'agency.activate': '代理店有効化',
  'user.create': '利用者作成',
  'user.update': '利用者更新',
  'user.suspend': '利用者停止',
  'user.activate': '利用者有効化',
  'user.delete': '利用者削除',
  'role.change': '権限変更',
  'auth.login': 'ログイン',
  'auth.logout': 'ログアウト',
  'admin.planTier.update': 'プラン変更',
  'admin.aiUsage.reset': 'AI利用回数リセット',
  'admin.intake.confirm': 'Intake確定（管理者）',
  'intake.auto.confirm': 'Intake自動確定',
  'admin.user.initialPassword.regenerate': '初期パスワード再発行',
}

function getActionLabel(action: string): string {
  return ACTION_LABELS[action] || action
}

export default function AuditLogsPage() {
  const { logs, loading, error, refreshLogs } = useAuditLogs()
  const hqCount = logs.filter((log) => log.tenantType === 'hq').length
  const agencyCount = logs.filter((log) => log.tenantType === 'agency').length

  return (
    <div className="space-y-4">
      <div className="border border-slate-200 bg-white shadow-sm">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">監査ログ</h1>
            <p className="text-sm text-slate-500">
              {logs.length} 件を表示中
              {error && <span className="text-red-600 ml-2">({error})</span>}
            </p>
          </div>
          <Button onClick={refreshLogs} variant="outline" className="rounded-none">
            <RefreshCw className="h-4 w-4 mr-2" />
            更新
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="border border-slate-200 bg-white px-5 py-4">
          <p className="text-xs text-slate-500">総ログ件数</p>
          <p className="text-2xl font-semibold mt-1">{logs.length}</p>
        </div>
        <div className="border border-slate-200 bg-white px-5 py-4">
          <p className="text-xs text-slate-500">本部ログ</p>
          <p className="text-2xl font-semibold mt-1">{hqCount}</p>
        </div>
        <div className="border border-slate-200 bg-white px-5 py-4">
          <p className="text-xs text-slate-500">代理店ログ</p>
          <p className="text-2xl font-semibold mt-1">{agencyCount}</p>
        </div>
      </div>

      <div className="border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center min-h-[260px]">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">監査ログを読み込み中...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-14 text-slate-500">監査ログがありません</div>
        ) : (
          <div className="overflow-x-auto overflow-y-auto h-[760px] max-h-[calc(100vh-260px)]">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 z-20 bg-white">
                <tr className="border-b border-slate-200">
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider min-w-[190px]">日時</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider min-w-[220px]">アクション</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider min-w-[120px]">種別</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider min-w-[140px]">代理店ID</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider min-w-[240px]">実行者</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider min-w-[260px]">対象</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-2.5 text-sm whitespace-nowrap text-slate-700">
                      {new Date(log.createdAt).toLocaleString('ja-JP')}
                    </td>
                    <td className="px-5 py-2.5 text-sm font-medium text-slate-900">
                      {getActionLabel(log.action)}
                    </td>
                    <td className="px-5 py-2.5 text-sm">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-none text-xs font-medium ${getTenantBadgeClass(log.tenantType)}`}>
                        {getTenantLabel(log.tenantType)}
                      </span>
                    </td>
                    <td className="px-5 py-2.5 text-sm text-slate-700">{log.agencyId || '-'}</td>
                    <td className="px-5 py-2.5 text-sm text-slate-700">{log.actor?.email || log.actor?.uid || '-'}</td>
                    <td className="px-5 py-2.5 text-sm text-slate-700">
                      {log.target?.type || '-'}
                      {log.target?.name ? ` (${log.target.name})` : ''}
                    </td>
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
