'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Users, Search, Edit, Trash2, Eye, Loader2, Calendar, Building2, X, Copy, Check, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { UserModal } from '@/components/users/user-modal'
import { User } from '@/types'
import { useUsers } from '@/hooks/useUsers'
import { userService } from '@/lib/firebase-admin'
import { useCompanies } from '@/hooks/useCompanies'
import { getPlanName, getUserPlanTier, normalizePlanTier } from '@/lib/plan-access'
import { recordPlanHistory } from '@/lib/plan-history'
import { useAuth } from '@/contexts/auth-context'
import { Textarea } from '@/components/ui/textarea'
import { getErrorMessage, parseJsonResponse } from '@/lib/http-response'

// SNSアイコンマッピング
const snsIcons = {
  instagram: '📷',
  x: '🐦',
  // youtube: '📺', // 将来的に必要になる可能性あり
  tiktok: '🎵'
}

const snsLabels = {
  instagram: 'Instagram',
  x: 'X (Twitter)',
  // youtube: 'YouTube', // 将来的に必要になる可能性あり
  tiktok: 'TikTok'
}

type PlanTierOption = 'basic' | 'standard' | 'pro'

interface AiUsageSummary {
  month: string
  tier: PlanTierOption
  limit: number
  count: number
  remaining: number
  breakdown: Record<string, number>
}

interface OnboardingMeta {
  onboardingInitialPassword: string
  signalToolAccessUrl: string
  signalInviteExpiresAt: string
  onboardingIntakeToken: string
  submittedData?: Record<string, unknown> | null
}

const PLAN_TIER_OPTIONS: Array<{ value: PlanTierOption; label: string }> = [
  { value: 'basic', label: 'basic' },
  { value: 'standard', label: 'standard' },
  { value: 'pro', label: 'pro' },
]

const PLAN_TIER_LABELS: Record<PlanTierOption, string> = {
  basic: 'ベーシック',
  standard: 'スタンダード',
  pro: 'プロ',
}

const AI_FEATURE_LABELS: Record<string, string> = {
  home_advisor_chat: '投稿チャットβ',
  home_post_generation: 'AI投稿文生成',
  instagram_posts_advisor_chat: '分析チャットβ',
  analytics_monthly_review: '月次レポート再生成',
}

function getMonthKey(offset = 0): string {
  const date = new Date()
  date.setMonth(date.getMonth() + offset)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

function getAiFeatureLabel(feature: string): string {
  return AI_FEATURE_LABELS[feature] || feature
}

export default function UsersPage() {
  const { users, loading, error, editUser, removeUser } = useUsers()
  const { companies } = useCompanies()
  const { user: currentAdminUser, adminUser } = useAuth()
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedPlanTier, setSelectedPlanTier] = useState<string>('all')
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('all')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [copiedSupportId, setCopiedSupportId] = useState<string | null>(null)
  const [copiedMetaKey, setCopiedMetaKey] = useState<string | null>(null)
  const [openRowMenuId, setOpenRowMenuId] = useState<string | null>(null)
  const [inviteLink, setInviteLink] = useState('')
  const [inviteExpiresAt, setInviteExpiresAt] = useState('')
  const [inviteGenerating, setInviteGenerating] = useState(false)
  const [planTierDraft, setPlanTierDraft] = useState<PlanTierOption>('basic')
  const [planTierReason, setPlanTierReason] = useState('')
  const [showPlanTierReasonModal, setShowPlanTierReasonModal] = useState(false)
  const [isSavingPlanTier, setIsSavingPlanTier] = useState(false)
  const [aiUsageMonth, setAiUsageMonth] = useState(getMonthKey(0))
  const [aiUsageSummary, setAiUsageSummary] = useState<AiUsageSummary | null>(null)
  const [aiUsageLoading, setAiUsageLoading] = useState(false)
  const [aiUsageError, setAiUsageError] = useState<string | null>(null)
  const [showResetReasonModal, setShowResetReasonModal] = useState(false)
  const [resetReason, setResetReason] = useState('')
  const [isResettingAiUsage, setIsResettingAiUsage] = useState(false)
  const [onboardingMeta, setOnboardingMeta] = useState<OnboardingMeta | null>(null)
  const [isRegeneratingInitialPassword, setIsRegeneratingInitialPassword] = useState(false)
  const [detailTab, setDetailTab] = useState<'profile' | 'business' | 'ops'>('profile')

  // 検索とフィルタリング
  useEffect(() => {
    // /users は signaltool.app のエンドユーザー管理専用
    // 代理店管理者・本部管理者アカウントは表示対象から除外する
    let filtered = users.filter((user) => user.role === 'user')

    // ステータスフィルター
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(user => user.status === selectedStatus)
    }

    // プラン階層フィルター
    if (selectedPlanTier !== 'all') {
      filtered = filtered.filter(user => getUserPlanTier(user) === selectedPlanTier)
    }

    // 登録企業フィルター
    if (selectedCompanyId !== 'all') {
      if (selectedCompanyId === 'self') {
        filtered = filtered.filter(user => !user.companyId)
      } else {
        filtered = filtered.filter(user => user.companyId === selectedCompanyId)
      }
    }

    // 検索クエリフィルター
    if (searchQuery) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.supportId && user.supportId.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (companies.find((company) => company.id === user.companyId)?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.businessInfo?.industry && user.businessInfo.industry.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (user.businessInfo?.description && user.businessInfo.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    setFilteredUsers(filtered)
  }, [users, searchQuery, selectedStatus, selectedPlanTier, selectedCompanyId, companies])

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('[data-row-menu]')) {
        setOpenRowMenuId(null)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  const actorRole = (() => {
    const roleInUserDoc = users.find((user) => user.id === currentAdminUser?.uid)?.role
    return adminUser?.role || roleInUserDoc || null
  })()

  const canManagePlanTier = actorRole === 'super_admin' || actorRole === 'billing_admin'
  const canResetAiUsage = actorRole === 'super_admin'

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      suspended: 'bg-red-100 text-red-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getStatusLabel = (status: string) => {
    const labels = {
      active: 'アクティブ',
      inactive: '非アクティブ',
      suspended: '停止中'
    }
    return labels[status as keyof typeof labels] || status
  }

  const getContractTypeLabel = (type: string) => {
    const labels = {
      annual: '年間契約',
      trial: 'お試し契約'
    }
    return labels[type as keyof typeof labels] || type
  }

  const getUsageTypeLabel = (type: string) => {
    const labels = {
      team: 'チーム',
      solo: 'ソロ'
    }
    return labels[type as keyof typeof labels] || type
  }

  const getPaymentMethodLabel = (method: string) => {
    const labels = {
      credit_card: 'クレジットカード',
      bank_transfer: '銀行振込',
      invoice: '請求書払い',
    }
    return labels[method as keyof typeof labels] || method
  }

  const getPlanTierBadgeClass = (tier: string) => {
    const normalizedTier = normalizePlanTier(tier)
    if (normalizedTier === 'basic') return 'bg-pink-100 text-pink-700 border border-pink-200'
    if (normalizedTier === 'standard') return 'bg-emerald-100 text-emerald-700 border border-emerald-200'
    if (normalizedTier === 'pro') return 'bg-blue-100 text-blue-700 border border-blue-200'
    return 'bg-gray-100 text-gray-700 border border-gray-200'
  }

  const getCompanyLabel = (companyId?: string) => {
    if (!companyId) return 'MOGCIA'
    return companies.find((company) => company.id === companyId)?.name || '未設定'
  }

  const fetchAiUsageSummary = useCallback(async (userId: string, month: string) => {
    if (!currentAdminUser) return

    try {
      setAiUsageLoading(true)
      setAiUsageError(null)
      const idToken = await currentAdminUser.getIdToken()
      const response = await fetch(`/api/admin/users/${userId}/ai-usage?month=${encodeURIComponent(month)}`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      })
      const data = await parseJsonResponse<AiUsageSummary & Record<string, unknown>>(response)
      if (!response.ok) {
        throw new Error(getErrorMessage(data, 'AI利用状況の取得に失敗しました'))
      }
      setAiUsageSummary(data)
    } catch (err) {
      setAiUsageSummary(null)
      setAiUsageError(err instanceof Error ? err.message : 'AI利用状況の取得に失敗しました')
    } finally {
      setAiUsageLoading(false)
    }
  }, [currentAdminUser])

  const submitPlanTierUpdate = async () => {
    if (!selectedUser || !canManagePlanTier || !currentAdminUser) return

    if (!planTierReason.trim()) {
      alert('変更理由は必須です')
      return
    }

    const before = normalizePlanTier(selectedUser.planTier)
    if (before === planTierDraft) {
      alert('現在と同じプランです')
      return
    }

    try {
      setIsSavingPlanTier(true)
      const idToken = await currentAdminUser.getIdToken()
      const response = await fetch(`/api/admin/users/${selectedUser.id}/plan-tier`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          planTier: planTierDraft,
          reason: planTierReason.trim(),
          expectedUpdatedAt: selectedUser.updatedAt,
        }),
      })

      const data = await parseJsonResponse<AiUsageSummary & Record<string, unknown>>(response)
      if (response.status === 409) {
        throw new Error('他の管理者が先に更新しました。画面を再読み込みして再実行してください。')
      }
      if (!response.ok) {
        throw new Error(getErrorMessage(data, 'planTier更新に失敗しました'))
      }

      setSelectedUser((prev) =>
        prev
          ? {
              ...prev,
              planTier: normalizePlanTier(String(data.after || prev.planTier)),
              updatedAt: String(data.updatedAt || new Date().toISOString()),
            }
          : prev
      )
      setPlanTierReason('')
      setShowPlanTierReasonModal(false)
      alert('プランを更新しました')
      await fetchAiUsageSummary(selectedUser.id, aiUsageMonth)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'planTier更新に失敗しました')
    } finally {
      setIsSavingPlanTier(false)
    }
  }

  const resetAiUsageForMonth = async () => {
    if (!selectedUser || !canResetAiUsage || !currentAdminUser) return

    if (!resetReason.trim()) {
      alert('リセット理由は必須です')
      return
    }

    try {
      setIsResettingAiUsage(true)
      const idToken = await currentAdminUser.getIdToken()
      const response = await fetch(`/api/admin/users/${selectedUser.id}/ai-usage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          month: aiUsageMonth,
          reason: resetReason.trim(),
        }),
      })

      const data = await parseJsonResponse<AiUsageSummary & Record<string, unknown>>(response)
      if (!response.ok) {
        throw new Error(getErrorMessage(data, 'AI利用回数のリセットに失敗しました'))
      }

      setAiUsageSummary(data)
      setResetReason('')
      setShowResetReasonModal(false)
      alert('AI利用回数をリセットしました')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'AI利用回数のリセットに失敗しました')
    } finally {
      setIsResettingAiUsage(false)
    }
  }

  const handleEditUser = async (userData: Partial<User>) => {
    if (!selectedUser) return
    
    try {
      // プラン階層が変更された場合、履歴を記録
      if (userData.planTier && userData.planTier !== selectedUser.planTier) {
        const fromPlan = normalizePlanTier(selectedUser.planTier)
        const toPlan = normalizePlanTier(userData.planTier)
        const changedBy = currentAdminUser?.uid || currentAdminUser?.email || 'admin'
        
        try {
          await recordPlanHistory(
            selectedUser.id,
            fromPlan === 'basic' ? null : fromPlan, // デフォルト値から変更する場合はnull
            toPlan,
            changedBy,
            '管理者による手動変更'
          )
        } catch (historyError) {
          console.error('Failed to record plan history:', historyError)
          // 履歴記録の失敗は警告のみ（ユーザー更新は続行）
        }
      }

      await editUser(selectedUser.id, userData)
      setSelectedUser(null)
      alert('利用者情報を更新しました！')
    } catch (err) {
      alert('利用者情報の更新に失敗しました: ' + (err instanceof Error ? err.message : '不明なエラー'))
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (confirm('この利用者を削除しますか？')) {
      try {
        await removeUser(userId)
        alert('利用者を削除しました')
      } catch (err) {
        alert('利用者の削除に失敗しました: ' + (err instanceof Error ? err.message : '不明なエラー'))
      }
    }
  }

  const openDetailModal = (user: User) => {
    setSelectedUser(user)
    setInviteLink('')
    setInviteExpiresAt('')
    setPlanTierDraft(normalizePlanTier(user.planTier))
    setPlanTierReason('')
    setAiUsageMonth(getMonthKey(0))
    setAiUsageSummary(null)
    setAiUsageError(null)
    setResetReason('')
    setShowPlanTierReasonModal(false)
    setShowResetReasonModal(false)
    setDetailTab('profile')
    setShowDetailModal(true)
  }

  const openEditModal = (user: User) => {
    setSelectedUser(user)
    setShowEditModal(true)
  }

  useEffect(() => {
    if (!showDetailModal || !selectedUser || !canManagePlanTier) {
      return
    }

    fetchAiUsageSummary(selectedUser.id, aiUsageMonth)
  }, [showDetailModal, selectedUser, aiUsageMonth, canManagePlanTier, fetchAiUsageSummary])

  useEffect(() => {
    if (!showDetailModal || !selectedUser || !currentAdminUser) return

    const loadOnboardingMeta = async () => {
      try {
        const idToken = await currentAdminUser.getIdToken()
        const response = await fetch(`/api/admin/users/${selectedUser.id}/onboarding-meta`, {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        })
        const data = await parseJsonResponse(response)
        if (!response.ok) return
        setOnboardingMeta({
          onboardingInitialPassword: String(data.onboardingInitialPassword || ''),
          signalToolAccessUrl: String(data.signalToolAccessUrl || ''),
          signalInviteExpiresAt: String(data.signalInviteExpiresAt || ''),
          onboardingIntakeToken: String(data.onboardingIntakeToken || ''),
          submittedData: (data.submittedData as Record<string, unknown>) || null,
        })
      } catch {
        setOnboardingMeta(null)
      }
    }

    setOnboardingMeta(null)
    loadOnboardingMeta()
  }, [showDetailModal, selectedUser, currentAdminUser])

  const copySupportId = async (supportId: string) => {
    try {
      await navigator.clipboard.writeText(supportId)
      setCopiedSupportId(supportId)
      setTimeout(() => setCopiedSupportId(null), 2000)
    } catch (err) {
      console.error('Failed to copy support ID:', err)
      alert('コピーに失敗しました')
    }
  }

  const copyMetaValue = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopiedMetaKey(key)
      setTimeout(() => setCopiedMetaKey(null), 2000)
    } catch (err) {
      console.error('Failed to copy value:', err)
      alert('コピーに失敗しました')
    }
  }

  const assignSupportId = async (userId: string) => {
    try {
      const supportId = await userService.assignSupportId(userId)
      if (supportId) {
        alert(`サポートIDを付与しました: ${supportId}`)
        // ユーザー一覧を更新
        window.location.reload()
      }
    } catch (err) {
      alert('サポートIDの付与に失敗しました: ' + (err instanceof Error ? err.message : '不明なエラー'))
    }
  }

  const generateInviteLink = async (targetUser: User) => {
    try {
      setInviteGenerating(true)
      const idToken = await currentAdminUser?.getIdToken()
      if (!idToken) throw new Error('認証トークンの取得に失敗しました')

      const response = await fetch('/api/invite-links/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          userId: targetUser.id,
          userEmail: targetUser.email,
          expiresInMinutes: 1440,
        }),
      })

      const data = await parseJsonResponse(response)
      if (!response.ok) throw new Error(getErrorMessage(data, '招待リンク生成に失敗しました'))

      setInviteLink(String(data.inviteUrl || ''))
      setInviteExpiresAt(String(data.expiresAt || ''))
      alert('短命ワンタイム招待リンクを生成しました')
    } catch (err) {
      alert('招待リンクの生成に失敗しました: ' + (err instanceof Error ? err.message : '不明なエラー'))
    } finally {
      setInviteGenerating(false)
    }
  }

  const regenerateInitialPassword = async (targetUser: User) => {
    try {
      setIsRegeneratingInitialPassword(true)
      const idToken = await currentAdminUser?.getIdToken()
      if (!idToken) throw new Error('認証トークンの取得に失敗しました')

      const response = await fetch(`/api/admin/users/${targetUser.id}/onboarding-password`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      })
      const data = await parseJsonResponse(response)
      if (!response.ok) {
        throw new Error(getErrorMessage(data, '初期パスワードの再発行に失敗しました'))
      }

      const nextPassword = String(data.password || '')
      setSelectedUser((prev) => (prev ? { ...prev, onboardingInitialPassword: nextPassword } : prev))
      setOnboardingMeta((prev) => ({
        onboardingInitialPassword: nextPassword,
        signalToolAccessUrl: prev?.signalToolAccessUrl || '',
        signalInviteExpiresAt: prev?.signalInviteExpiresAt || '',
        onboardingIntakeToken: prev?.onboardingIntakeToken || '',
      }))
      alert('初期パスワードを再発行しました')
    } catch (err) {
      alert('初期パスワードの再発行に失敗しました: ' + (err instanceof Error ? err.message : '不明なエラー'))
    } finally {
      setIsRegeneratingInitialPassword(false)
    }
  }


  const displayInitialPassword = selectedUser?.onboardingInitialPassword || onboardingMeta?.onboardingInitialPassword || ''
  const displayInviteUrl = selectedUser?.signalToolAccessUrl || onboardingMeta?.signalToolAccessUrl || ''
  const displayInviteExpiresAt = selectedUser?.signalInviteExpiresAt || onboardingMeta?.signalInviteExpiresAt || ''
  const snsPurposeText =
    selectedUser?.snsAISettings?.instagram?.whyThisSNS ||
    selectedUser?.snsAISettings?.instagram?.snsGoal ||
    selectedUser?.businessInfo?.snsMainGoals?.join('\n') ||
    '-'
  const ngWordsText =
    selectedUser?.snsAISettings?.instagram?.cautions ||
    selectedUser?.snsAISettings?.instagram?.strategyNotes ||
    '-'
  const activeUserCount = filteredUsers.filter((user) => user.status === 'active').length
  const suspendedUserCount = filteredUsers.filter((user) => user.status === 'suspended').length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">利用者データを読み込み中...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="border border-slate-200 bg-white shadow-sm">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">利用者管理</h1>
            <p className="text-sm text-slate-500">
              {filteredUsers.length} 件を表示中
              {error && <span className="text-destructive ml-2">({error})</span>}
            </p>
          </div>
        </div>

        <div className="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center gap-3">
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="名前・メール・サポートID・企業名で検索"
              className="w-full h-10 rounded-none border border-slate-200 bg-white pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>
          <select
            value={selectedPlanTier}
            onChange={(e) => setSelectedPlanTier(e.target.value)}
            className="h-10 rounded-none border border-slate-200 bg-white px-3 text-sm"
          >
            <option value="all">プラン: すべて</option>
            <option value="basic">ベーシック</option>
            <option value="standard">スタンダード</option>
            <option value="pro">プロ</option>
          </select>
          <select
            value={selectedCompanyId}
            onChange={(e) => setSelectedCompanyId(e.target.value)}
            className="h-10 rounded-none border border-slate-200 bg-white px-3 text-sm min-w-[210px]"
          >
            <option value="all">登録企業: すべて</option>
            <option value="self">MOGCIA</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
        </div>

        <div className="px-5 py-3 border-b border-slate-200 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedStatus('all')}
            className={`px-3 py-1.5 rounded-none text-sm transition-colors ${selectedStatus === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            すべて
          </button>
          <button
            type="button"
            onClick={() => setSelectedStatus('active')}
            className={`px-3 py-1.5 rounded-none text-sm transition-colors ${selectedStatus === 'active' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            稼働中 ({activeUserCount})
          </button>
          <button
            type="button"
            onClick={() => setSelectedStatus('suspended')}
            className={`px-3 py-1.5 rounded-none text-sm transition-colors ${selectedStatus === 'suspended' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            停止中 ({suspendedUserCount})
          </button>
        </div>
      </div>

      {/* 利用者一覧 */}
      <div>
        {false ? (
          /* カード表示 */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map((user) => (
              <Card 
                key={user.id} 
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => openDetailModal(user)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                        <span className="text-lg font-semibold text-primary-foreground">
                          {user.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-base">{user.name}</h3>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(user.status)}`}>
                      {getStatusLabel(user.status)}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {/* プラン階層 */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getPlanTierBadgeClass(user.planTier || 'basic')}`}>
                        {getPlanName(getUserPlanTier(user))}
                      </span>
                      {!user.accessGranted && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                          🔒 アクセス未許可
                        </span>
                      )}
                    </div>

                    {/* 契約情報 */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{getContractTypeLabel(user.contractType)}</span>
                    </div>

                    {/* 所属企業 */}
                    {user.companyId && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Building2 className="h-4 w-4" />
                        <span className="truncate">
                          {companies.find(c => c.id === user.companyId)?.name || '不明な企業'}
                        </span>
                      </div>
                    )}

                    {/* 業界 */}
                    {user.businessInfo?.industry && (
                      <div className="text-sm text-muted-foreground">
                        業界: {user.businessInfo.industry}
                      </div>
                    )}

                    {/* 契約SNS */}
                    {user.contractSNS.length > 0 && (
                      <div className="flex items-center gap-2">
                        {user.contractSNS.slice(0, 3).map((sns) => (
                          <span
                            key={sns}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-muted text-lg"
                            title={snsLabels[sns]}
                          >
                            {snsIcons[sns]}
                          </span>
                        ))}
                        {user.contractSNS.length > 3 && (
                          <span className="text-xs text-muted-foreground">
                            +{user.contractSNS.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* サポートID */}
                    <div className="text-xs pt-2 border-t">
                      {user.supportId ? (
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">サポートID:</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              copySupportId(user.supportId!)
                            }}
                            className="flex items-center gap-1 text-primary hover:underline font-mono text-xs"
                            title="クリックでコピー"
                          >
                            {user.supportId.substring(0, 8)}...
                            {copiedSupportId === user.supportId ? (
                              <Check className="h-3 w-3 text-green-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">サポートID: 未付与</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              assignSupportId(user.id)
                            }}
                            className="h-6 text-xs"
                          >
                            付与
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* 契約終了日 */}
                    <div className="text-xs text-muted-foreground pt-2 border-t">
                      {new Date(user.contractEndDate).toLocaleDateString('ja-JP', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                      {new Date(user.contractEndDate) < new Date() && (
                        <span className="ml-2 text-red-600 font-semibold">期限切れ</span>
                      )}
                    </div>
                  </div>

                  {/* アクションボタン */}
                  <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t" onClick={(e) => e.stopPropagation()}>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => openDetailModal(user)}
                      className="h-8"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      詳細
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => openEditModal(user)}
                      className="h-8"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      編集
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredUsers.length === 0 && (
              <div className="col-span-full text-center py-12">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">該当する利用者が見つかりませんでした。</p>
              </div>
            )}
          </div>
        ) : (
          /* テーブル表示 */
          <div className="border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto overflow-y-auto h-[760px] max-h-[calc(100vh-260px)]">
              <table className="w-full border-collapse">
                <thead className="sticky top-0 z-20 bg-white">
                  <tr className="border-b border-slate-200">
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider min-w-[220px]">
                      名前
                    </th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider min-w-[220px]">
                      メール
                    </th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider min-w-[160px]">
                      プラン階層
                    </th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider min-w-[200px]">
                      登録企業
                    </th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider min-w-[140px]">
                      ステータス
                    </th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider min-w-[220px]">
                      サポートID
                    </th>
                    <th className="px-5 py-3 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wider sticky right-0 bg-white z-20 min-w-[140px]">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {filteredUsers.map((user) => (
                    <tr 
                      key={user.id} 
                      className="hover:bg-slate-50 transition-colors cursor-pointer group"
                      onClick={() => openDetailModal(user)}
                    >
                      <td className="px-5 py-2.5">
                        <div className="flex items-center">
                          <div>
                            <span className="font-semibold text-sm whitespace-nowrap block">{user.name}</span>
                            {user.role && user.role !== 'user' && (
                              <span className="text-xs text-slate-400">{user.role}</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-2.5 text-sm text-slate-600 whitespace-nowrap">
                        <a 
                          href={`mailto:${user.email}`}
                          onClick={(e) => e.stopPropagation()}
                          className="hover:text-slate-900 transition-colors"
                        >
                          {user.email}
                        </a>
                      </td>
                      <td className="px-5 py-2.5">
                        <div className="flex flex-col gap-1">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-none text-xs font-semibold whitespace-nowrap shadow-sm ${getPlanTierBadgeClass(user.planTier || 'basic')}`}>
                            {getPlanName(getUserPlanTier(user))}
                          </span>
                          {!user.accessGranted && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-none text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                              アクセス未許可
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-2.5 text-sm text-slate-700 whitespace-nowrap">
                        {getCompanyLabel(user.companyId)}
                      </td>
                      <td className="px-5 py-2.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-none text-xs font-medium ${getStatusColor(user.status)}`}>
                          {getStatusLabel(user.status)}
                        </span>
                      </td>
                      <td className="px-5 py-2.5">
                        {user.supportId ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              copySupportId(user.supportId!)
                            }}
                            className="font-mono text-xs text-slate-700 hover:text-slate-900"
                          >
                            {copiedSupportId === user.supportId ? 'コピーしました' : user.supportId}
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">未付与</span>
                        )}
                      </td>
                      <td
                        className={`px-5 py-2.5 sticky right-0 bg-white group-hover:bg-slate-50 ${
                          openRowMenuId === user.id ? 'z-[80]' : 'z-10'
                        }`}
                      >
                        <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
                          <div className="relative" data-row-menu>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setOpenRowMenuId(openRowMenuId === user.id ? null : user.id)}
                              className="h-7 w-7 p-0 hover:bg-slate-100"
                              title="操作メニュー"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                            {openRowMenuId === user.id && (
                              <div className="absolute right-0 mt-1 w-32 rounded-none border border-slate-200 bg-white shadow-lg z-[90] py-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenRowMenuId(null)
                                    openDetailModal(user)
                                  }}
                                  className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"
                                >
                                  <Eye className="h-4 w-4" />
                                  詳細
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenRowMenuId(null)
                                    openEditModal(user)
                                  }}
                                  className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"
                                >
                                  <Edit className="h-4 w-4" />
                                  編集
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenRowMenuId(null)
                                    handleDeleteUser(user.id)
                                  }}
                                  className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  削除
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredUsers.length === 0 && (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">該当する利用者が見つかりませんでした。</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 詳細モーダル（簡易版） */}
      {showDetailModal && selectedUser && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black bg-opacity-50">
          <div className="relative z-[201] bg-background rounded-none shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-background z-10">
              <h2 className="text-2xl font-bold">{selectedUser.name} - 詳細情報</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setShowDetailModal(false)
                  setShowPlanTierReasonModal(false)
                  setShowResetReasonModal(false)
                }}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
                <Button
                  type="button"
                  size="sm"
                  variant={detailTab === 'profile' ? 'default' : 'outline'}
                  onClick={() => setDetailTab('profile')}
                >
                  プロフィール
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={detailTab === 'business' ? 'default' : 'outline'}
                  onClick={() => setDetailTab('business')}
                >
                  事業・SNS
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={detailTab === 'ops' ? 'default' : 'outline'}
                  onClick={() => setDetailTab('ops')}
                >
                  運用アクション
                </Button>
              </div>

              {detailTab === 'profile' && (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-2">基本情報</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">UID:</span> <code className="px-1 py-0.5 rounded bg-slate-100 border border-slate-200 text-xs">{selectedUser.id}</code></p>
                    <p><span className="font-medium">名前:</span> {selectedUser.name}</p>
                    <p><span className="font-medium">メール:</span> {selectedUser.email}</p>
                    <p><span className="font-medium">利用形態:</span> {getUsageTypeLabel(selectedUser.usageType)}</p>
                    <p><span className="font-medium">契約タイプ:</span> {getContractTypeLabel(selectedUser.contractType)}</p>
                    <p><span className="font-medium">ステータス:</span> {getStatusLabel(selectedUser.status)}</p>
                    {canManagePlanTier && (
                      <div className="mt-4 p-3 border border-slate-200 rounded-md space-y-2">
                        <p className="font-medium">プラン設定（AI利用制限）</p>
                        <select
                          value={planTierDraft}
                          onChange={(event) => setPlanTierDraft(event.target.value as PlanTierOption)}
                          className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                        >
                          {PLAN_TIER_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs text-slate-500">
                            現在: {normalizePlanTier(selectedUser.planTier)}
                          </span>
                          <Button
                            size="sm"
                            onClick={() => setShowPlanTierReasonModal(true)}
                            disabled={isSavingPlanTier || planTierDraft === normalizePlanTier(selectedUser.planTier)}
                          >
                            {isSavingPlanTier ? '保存中...' : '理由を入力して保存'}
                          </Button>
                        </div>
                      </div>
                    )}
                    <div className="mt-4 p-3 bg-muted rounded-md">
                      <p className="font-medium mb-2">サポートID</p>
                      {selectedUser.supportId ? (
                        <div className="flex items-center gap-2">
                          <code className="flex-1 px-2 py-1 text-xs bg-background border border-border rounded font-mono">
                            {selectedUser.supportId}
                          </code>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copySupportId(selectedUser.supportId!)}
                            className="h-8"
                          >
                            {copiedSupportId === selectedUser.supportId ? (
                              <>
                                <Check className="h-4 w-4 mr-1" />
                                コピーしました
                              </>
                            ) : (
                              <>
                                <Copy className="h-4 w-4 mr-1" />
                                コピー
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              if (confirm('サポートIDを再生成しますか？この操作は元に戻せません。')) {
                                try {
                                  const newSupportId = await userService.regenerateSupportId(selectedUser.id)
                                  setSelectedUser({ ...selectedUser, supportId: newSupportId })
                                  alert(`サポートIDを再生成しました: ${newSupportId}`)
                                } catch (err) {
                                  alert('再生成に失敗しました: ' + (err instanceof Error ? err.message : '不明なエラー'))
                                }
                              }
                            }}
                            className="h-8"
                          >
                            再生成
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground text-sm">未付与</span>
                          <Button
                            size="sm"
                            onClick={() => assignSupportId(selectedUser.id)}
                            className="h-8"
                          >
                            サポートIDを付与
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="mt-4 p-3 bg-muted rounded-md">
                      <p className="font-medium mb-2">初回案内情報</p>
                      <p className="text-xs text-muted-foreground mb-3">
                        初回アクセスは短命・ワンタイムの招待リンクを利用します。通常ログインはメール/パスワードで行います。
                      </p>
                      <div className="flex items-center gap-2 mb-2">
                        <Button
                          size="sm"
                          onClick={() => generateInviteLink(selectedUser)}
                          disabled={inviteGenerating}
                        >
                          {inviteGenerating ? '生成中...' : '招待リンクを生成（24時間）'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => regenerateInitialPassword(selectedUser)}
                          disabled={isRegeneratingInitialPassword}
                        >
                          {isRegeneratingInitialPassword
                            ? '発行中...'
                            : displayInitialPassword
                              ? '初期パスワードを再発行'
                              : '初期パスワードを発行'}
                        </Button>
                      </div>
                      {(inviteLink || displayInviteUrl) && (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={inviteLink || displayInviteUrl}
                            readOnly
                            className="w-full px-2 py-1 text-xs bg-background border border-border rounded"
                          />
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs text-muted-foreground">
                              有効期限: {(inviteExpiresAt || displayInviteExpiresAt) ? new Date(inviteExpiresAt || displayInviteExpiresAt).toLocaleString('ja-JP') : '-'}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                navigator.clipboard.writeText(inviteLink || displayInviteUrl)
                                alert('招待リンクをコピーしました')
                              }}
                            >
                              コピー
                            </Button>
                          </div>
                        </div>
                      )}
                      {displayInitialPassword && (
                        <div className="space-y-1 mt-2">
                          <p className="text-xs text-muted-foreground">初期パスワード</p>
                          <div className="flex items-center gap-2">
                            <code className="flex-1 px-2 py-1 text-xs bg-background border border-border rounded font-mono">
                              {displayInitialPassword}
                            </code>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyMetaValue('onboardingInitialPassword', displayInitialPassword)}
                            >
                              {copiedMetaKey === 'onboardingInitialPassword' ? 'コピーしました' : 'コピー'}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium mb-2">契約情報</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">開始日:</span> {new Date(selectedUser.contractStartDate).toLocaleDateString('ja-JP')}</p>
                    <p><span className="font-medium">終了日:</span> {new Date(selectedUser.contractEndDate).toLocaleDateString('ja-JP')}</p>
                    {selectedUser.billingInfo && (
                      <>
                        <p><span className="font-medium">支払い方法:</span> {getPaymentMethodLabel(selectedUser.billingInfo.paymentMethod)}</p>
                      </>
                    )}
                  </div>
                  
                  {/* 支払い確認・アクセス許可ステータス */}
                  <div className="mt-4 p-3 bg-muted rounded-md space-y-2">
                    <h4 className="font-medium text-sm mb-2">支払い確認状況</h4>
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span>初期費用:</span>
                        <span className={`font-semibold ${selectedUser.initialPaymentConfirmed ? 'text-green-600' : 'text-red-600'}`}>
                          {selectedUser.initialPaymentConfirmed ? '✓ 確認済み' : '✗ 未確認'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>初月分:</span>
                        <span className={`font-semibold ${selectedUser.firstMonthPaymentConfirmed ? 'text-green-600' : 'text-red-600'}`}>
                          {selectedUser.firstMonthPaymentConfirmed ? '✓ 確認済み' : '✗ 未確認'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t">
                        <span>会員サイトアクセス:</span>
                        <span className={`font-semibold ${selectedUser.accessGranted ? 'text-green-600' : 'text-gray-600'}`}>
                          {selectedUser.accessGranted ? '✓ 許可済み' : '✗ 未許可'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {canManagePlanTier && (
                    <div className="mt-4 p-3 border border-slate-200 rounded-md space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-medium text-sm">AI利用状況</h4>
                        <select
                          value={aiUsageMonth}
                          onChange={(event) => setAiUsageMonth(event.target.value)}
                          className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs"
                        >
                          <option value={getMonthKey(0)}>当月 ({getMonthKey(0)})</option>
                          <option value={getMonthKey(-1)}>前月 ({getMonthKey(-1)})</option>
                        </select>
                      </div>
                      {aiUsageLoading ? (
                        <p className="text-xs text-slate-500">読み込み中...</p>
                      ) : aiUsageError ? (
                        <p className="text-xs text-red-600">{aiUsageError}</p>
                      ) : aiUsageSummary ? (
                        <div className="space-y-1 text-xs">
                          <p><span className="font-medium">対象月:</span> {aiUsageSummary.month}</p>
                          <p><span className="font-medium">プラン:</span> {PLAN_TIER_LABELS[aiUsageSummary.tier]}</p>
                          <p><span className="font-medium">上限回数:</span> {aiUsageSummary.limit}</p>
                          <p><span className="font-medium">利用回数:</span> {aiUsageSummary.count}</p>
                          <p><span className="font-medium">残り回数:</span> {aiUsageSummary.remaining}</p>
                          <div>
                            <p className="font-medium">機能別内訳:</p>
                            {Object.keys(aiUsageSummary.breakdown).length === 0 ? (
                              <p className="text-slate-500">なし</p>
                            ) : (
                              <ul className="list-disc pl-4">
                                {Object.entries(aiUsageSummary.breakdown).map(([feature, count]) => (
                                  <li key={feature}>
                                    {getAiFeatureLabel(feature)}: {count}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500">データなし</p>
                      )}

                      {canResetAiUsage && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowResetReasonModal(true)}
                          disabled={isResettingAiUsage}
                          className="w-full"
                        >
                          {isResettingAiUsage ? 'リセット中...' : '当月カウントをリセット'}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
              )}

              {detailTab === 'business' && (
              <div className="space-y-6">
                <div className="space-y-4 text-sm">
                  <h3 className="font-medium">事業・SNS情報（保存済み）</h3>
                  <div>
                    <p className="font-medium">SNS活用の目的</p>
                    <p className="whitespace-pre-wrap">{snsPurposeText}</p>
                  </div>
                  <div>
                    <p className="font-medium">NGワード設定</p>
                    <p className="whitespace-pre-wrap">{ngWordsText}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <p><span className="font-medium">業界:</span> {selectedUser.businessInfo.industry || '-'}</p>
                    <p><span className="font-medium">会社規模:</span> {selectedUser.businessInfo.companySize || '-'}</p>
                    <p><span className="font-medium">事業タイプ:</span> {selectedUser.businessInfo.businessType || '-'}</p>
                    <p><span className="font-medium">フォロワー数:</span> {String(selectedUser.businessInfo.initialFollowers ?? '-')}</p>
                    <p><span className="font-medium">キャッチコピー:</span> {selectedUser.businessInfo.catchphrase || '-'}</p>
                  </div>
                  <div>
                    <p className="font-medium">事業内容</p>
                    <p className="whitespace-pre-wrap">{selectedUser.businessInfo.description || '-'}</p>
                  </div>
                  <div>
                    <p className="font-medium">ターゲット市場</p>
                    <p className="whitespace-pre-wrap">
                      {Array.isArray(selectedUser.businessInfo.targetMarket) && selectedUser.businessInfo.targetMarket.length > 0
                        ? selectedUser.businessInfo.targetMarket.join('\n')
                        : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium mb-1">商品・サービス情報</p>
                    {Array.isArray(selectedUser.businessInfo.productsOrServices) &&
                    selectedUser.businessInfo.productsOrServices.length > 0 ? (
                      <div className="space-y-2">
                        {selectedUser.businessInfo.productsOrServices.map((item) => (
                          <div key={item.id} className="border rounded p-2">
                            <p><span className="font-medium">商品名:</span> {item.name || '-'}</p>
                            <p><span className="font-medium">価格:</span> {item.price || '-'}</p>
                            <p><span className="font-medium">詳細:</span> {item.details || '-'}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p>-</p>
                    )}
                  </div>
                </div>
              </div>
              )}

              {detailTab === 'ops' && (
              <div className="space-y-6">
              <div className="border-t pt-4">
                <h3 className="font-medium mb-3">支払い確認・アクセス管理</h3>
                <div className="flex gap-2 flex-wrap mb-4">
                  <Button
                    onClick={async () => {
                      if (confirm('初期費用の支払いを確認済みにしますか？')) {
                        try {
                          await userService.updateUser(selectedUser.id, {
                            initialPaymentConfirmed: true
                          })
                          setSelectedUser({ ...selectedUser, initialPaymentConfirmed: true })
                          alert('初期費用を確認済みにしました')
                        } catch (err) {
                          alert('更新に失敗しました: ' + (err instanceof Error ? err.message : '不明なエラー'))
                        }
                      }
                    }}
                    variant={selectedUser.initialPaymentConfirmed ? "outline" : "default"}
                    className={selectedUser.initialPaymentConfirmed ? "" : "bg-blue-600 hover:bg-blue-700"}
                  >
                    {selectedUser.initialPaymentConfirmed ? '✓ 初期費用確認済み' : '初期費用を確認'}
                  </Button>
                  <Button
                    onClick={async () => {
                      if (confirm('初月分の支払いを確認済みにしますか？')) {
                        try {
                          await userService.updateUser(selectedUser.id, {
                            firstMonthPaymentConfirmed: true
                          })
                          setSelectedUser({ ...selectedUser, firstMonthPaymentConfirmed: true })
                          alert('初月分を確認済みにしました')
                        } catch (err) {
                          alert('更新に失敗しました: ' + (err instanceof Error ? err.message : '不明なエラー'))
                        }
                      }
                    }}
                    variant={selectedUser.firstMonthPaymentConfirmed ? "outline" : "default"}
                    className={selectedUser.firstMonthPaymentConfirmed ? "" : "bg-blue-600 hover:bg-blue-700"}
                  >
                    {selectedUser.firstMonthPaymentConfirmed ? '✓ 初月分確認済み' : '初月分を確認'}
                  </Button>
                  <Button
                    onClick={async () => {
                      if (!selectedUser.initialPaymentConfirmed || !selectedUser.firstMonthPaymentConfirmed) {
                        alert('初期費用と初月分の両方を確認済みにしてから、アクセスを許可してください。')
                        return
                      }
                      if (confirm('会員サイトへのアクセスを許可しますか？\n（支払い確認後に実行してください）')) {
                        try {
                          await userService.updateUser(selectedUser.id, {
                            accessGranted: true
                          })
                          setSelectedUser({ ...selectedUser, accessGranted: true })
                          alert('会員サイトへのアクセスを許可しました')
                        } catch (err) {
                          alert('更新に失敗しました: ' + (err instanceof Error ? err.message : '不明なエラー'))
                        }
                      }
                    }}
                    variant={selectedUser.accessGranted ? "outline" : "default"}
                    className={selectedUser.accessGranted ? "" : "bg-green-600 hover:bg-green-700"}
                    disabled={!selectedUser.initialPaymentConfirmed || !selectedUser.firstMonthPaymentConfirmed}
                  >
                    {selectedUser.accessGranted ? '✓ アクセス許可済み' : '会員サイトアクセスを許可'}
                  </Button>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-medium mb-3">契約管理</h3>
                <div className="flex gap-2 flex-wrap">
                  {new Date(selectedUser.contractEndDate) < new Date() ? (
                    <Button
                      onClick={async () => {
                        if (confirm('この利用者の契約を再開しますか？')) {
                          try {
                            const newEndDate = new Date()
                            newEndDate.setFullYear(newEndDate.getFullYear() + 1)
                            await userService.reactivateContract(selectedUser.id, newEndDate.toISOString())
                            setSelectedUser(null)
                            setShowDetailModal(false)
                            alert('契約を1年間再開しました！')
                            window.location.reload()
                          } catch (err) {
                            alert('契約の再開に失敗しました: ' + (err instanceof Error ? err.message : '不明なエラー'))
                          }
                        }
                      }}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      契約を再開（1年間）
                    </Button>
                  ) : (
                    <>
                      <Button
                        onClick={async () => {
                          if (confirm('契約期間を1年延長しますか？')) {
                            try {
                              await userService.extendContract(selectedUser.id, 12)
                              setSelectedUser(null)
                              setShowDetailModal(false)
                              alert('契約期間を1年延長しました！')
                              window.location.reload()
                            } catch (err) {
                              alert('契約期間の延長に失敗しました: ' + (err instanceof Error ? err.message : '不明なエラー'))
                            }
                          }
                        }}
                        variant="default"
                      >
                        契約期間+1年
                      </Button>
                      <Button
                        onClick={async () => {
                          if (confirm('この利用者のログインを停止しますか？\n（途中解約）')) {
                            try {
                              const now = new Date()
                              await userService.updateUser(selectedUser.id, {
                                status: 'suspended',
                                contractEndDate: now.toISOString(),
                                isActive: false
                              })
                              setSelectedUser(null)
                              setShowDetailModal(false)
                              alert('ログインを停止しました。')
                              window.location.reload()
                            } catch (err) {
                              alert('ログイン停止に失敗しました: ' + (err instanceof Error ? err.message : '不明なエラー'))
                            }
                          }
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        途中解約（ログイン停止）
                      </Button>
                    </>
                  )}
                </div>
              </div>
              </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showPlanTierReasonModal && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black bg-opacity-50">
          <div className="relative z-[211] bg-white rounded-none shadow-lg w-full max-w-lg m-4 p-5 space-y-4">
            <h3 className="text-lg font-semibold">プラン変更理由を入力</h3>
            <p className="text-sm text-slate-600">
              変更内容: {normalizePlanTier(selectedUser?.planTier)} → {planTierDraft}
            </p>
            <Textarea
              value={planTierReason}
              onChange={(event) => setPlanTierReason(event.target.value)}
              placeholder="変更理由を入力してください（監査ログに保存されます）"
              className="min-h-[120px]"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  if (isSavingPlanTier) return
                  setShowPlanTierReasonModal(false)
                }}
              >
                キャンセル
              </Button>
              <Button onClick={submitPlanTierUpdate} disabled={isSavingPlanTier || !planTierReason.trim()}>
                {isSavingPlanTier ? '保存中...' : '保存'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {showResetReasonModal && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black bg-opacity-50">
          <div className="relative z-[211] bg-white rounded-none shadow-lg w-full max-w-lg m-4 p-5 space-y-4">
            <h3 className="text-lg font-semibold">AI利用回数リセット理由</h3>
            <p className="text-sm text-slate-600">対象月: {aiUsageMonth}</p>
            <Textarea
              value={resetReason}
              onChange={(event) => setResetReason(event.target.value)}
              placeholder="リセット理由を入力してください（監査ログに保存されます）"
              className="min-h-[120px]"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  if (isResettingAiUsage) return
                  setShowResetReasonModal(false)
                }}
              >
                キャンセル
              </Button>
              <Button
                variant="destructive"
                onClick={resetAiUsageForMonth}
                disabled={isResettingAiUsage || !resetReason.trim()}
              >
                {isResettingAiUsage ? 'リセット中...' : 'リセット実行'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* モーダル */}
      <UserModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setSelectedUser(null)
        }}
        user={selectedUser}
        onSave={handleEditUser}
      />
    </div>
  )
}
