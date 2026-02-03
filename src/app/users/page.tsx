'use client'

import React, { useState, useEffect } from 'react'
import { Users, Plus, Search, Edit, Trash2, Eye, Loader2, Calendar, Building, ChevronDown, ChevronUp, Building2, X, Filter, CheckCircle, XCircle, Lock, Unlock, Grid, List, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { UserModal } from '@/components/users/user-modal'
import { User } from '@/types'
import { useUsers, useUserStats } from '@/hooks/useUsers'
import { userService } from '@/lib/firebase-admin'
import { useCompanies } from '@/hooks/useCompanies'
import { getPlanName, getUserPlanTier } from '@/lib/plan-access'
import { recordPlanHistory } from '@/lib/plan-history'
import { useAuth } from '@/contexts/auth-context'

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

export default function UsersPage() {
  const { users, loading, error, addUser, editUser, removeUser } = useUsers()
  const { stats } = useUserStats()
  const { companies } = useCompanies()
  const { user: currentAdminUser } = useAuth()
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedContractType, setSelectedContractType] = useState<string>('all')
  const [selectedPlanTier, setSelectedPlanTier] = useState<string>('all')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('grid') // デフォルトをグリッド表示に
  const [copiedSupportId, setCopiedSupportId] = useState<string | null>(null)

  // 検索とフィルタリング
  useEffect(() => {
    let filtered = users

    // ステータスフィルター
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(user => user.status === selectedStatus)
    }

    // 契約タイプフィルター
    if (selectedContractType !== 'all') {
      filtered = filtered.filter(user => user.contractType === selectedContractType)
    }

    // プラン階層フィルター
    if (selectedPlanTier !== 'all') {
      filtered = filtered.filter(user => getUserPlanTier(user) === selectedPlanTier)
    }

    // 検索クエリフィルター
    if (searchQuery) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.businessInfo?.industry && user.businessInfo.industry.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (user.businessInfo?.description && user.businessInfo.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    setFilteredUsers(filtered)
  }, [users, searchQuery, selectedStatus, selectedContractType, selectedPlanTier])

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

  const handleCreateUser = async (userData: Partial<User>) => {
    try {
      // デバッグ用：受け取ったデータを確認
      console.log('handleCreateUser received data:', {
        ...userData,
        password: userData.password ? `[${userData.password.length} chars]` : '[NOT SET]'
      })

      await addUser({
        name: userData.name || '',
        email: userData.email || '',
        password: userData.password || '', // パスワードを明示的に渡す
        role: userData.role || 'user',
        isActive: userData.isActive !== undefined ? userData.isActive : true,
        snsCount: userData.snsCount || 1,
        usageType: userData.usageType || 'solo',
        contractType: userData.contractType || 'trial',
        contractSNS: userData.contractSNS || [],
        snsAISettings: userData.snsAISettings || {},
        businessInfo: userData.businessInfo || {
          industry: '',
          companySize: 'individual',
          businessType: 'b2c',
          description: '',
          snsMainGoals: [],
          brandMission: '',
          targetCustomer: '',
          uniqueValue: '',
          brandVoice: '',
          kpiTargets: [],
          challenges: []
        },
        status: userData.status || 'active',
        contractStartDate: userData.contractStartDate || new Date().toISOString(),
        contractEndDate: userData.contractEndDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        billingInfo: userData.billingInfo,
        notes: userData.notes
      })
      alert('利用者を作成しました！')
    } catch (err) {
      console.error('Error in handleCreateUser:', err)
      alert('利用者の作成に失敗しました: ' + (err instanceof Error ? err.message : '不明なエラー'))
    }
  }

  const handleEditUser = async (userData: Partial<User>) => {
    if (!selectedUser) return
    
    try {
      // プラン階層が変更された場合、履歴を記録
      if (userData.planTier && userData.planTier !== selectedUser.planTier) {
        const fromPlan = (selectedUser.planTier || 'ume') as 'ume' | 'take' | 'matsu'
        const toPlan = userData.planTier as 'ume' | 'take' | 'matsu'
        const changedBy = currentAdminUser?.uid || currentAdminUser?.email || 'admin'
        
        try {
          await recordPlanHistory(
            selectedUser.id,
            fromPlan === 'ume' ? null : fromPlan, // デフォルト値から変更する場合はnull
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
    setShowDetailModal(true)
  }

  const openEditModal = (user: User) => {
    setSelectedUser(user)
    setShowEditModal(true)
  }

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


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY'
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">利用者データを読み込み中...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">利用者管理</h1>
          <p className="text-muted-foreground">
            Signal App利用者の基本情報とAI設定を管理します
            {error && <span className="text-destructive ml-2">({error})</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            新規利用者追加
          </Button>
        </div>
      </div>

      {/* URLパラメータから企業IDを取得してモーダルを開く */}
      {typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('companyId') && (
        <div className="mb-4">
          <Button
            variant="outline"
            onClick={() => {
              const companyId = new URLSearchParams(window.location.search).get('companyId')
              if (companyId) {
                setShowCreateModal(true)
                window.history.replaceState({}, '', '/users')
              }
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            この企業のユーザーを追加
          </Button>
        </div>
      )}

      {/* 利用者一覧 */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">利用者一覧</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {filteredUsers.length} 人の利用者が見つかりました
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="flex items-center gap-2"
            >
              <Grid className="h-4 w-4" />
              カード
            </Button>
            <Button
              variant={viewMode === 'table' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="flex items-center gap-2"
            >
              <List className="h-4 w-4" />
              テーブル
            </Button>
          </div>
        </div>

        {viewMode === 'grid' ? (
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
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                        user.planTier === 'ume' ? 'bg-pink-100 text-pink-700 border border-pink-200' :
                        user.planTier === 'take' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                        user.planTier === 'matsu' ? 'bg-purple-100 text-purple-700 border border-purple-200' :
                        'bg-gray-100 text-gray-700 border border-gray-200'
                      }`}>
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
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto max-h-[calc(100vh-420px)]">
                <table className="w-full border-collapse">
                <thead className="sticky top-0 z-20 bg-background">
                  <tr className="border-b-2 border-border bg-muted/30">
                    <th className="px-5 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider sticky left-0 bg-muted/30 z-20 min-w-[180px] backdrop-blur-sm">
                      名前
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider min-w-[220px]">
                      メール
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider min-w-[110px]">
                      ステータス
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider min-w-[120px]">
                      プラン階層
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider min-w-[120px]">
                      契約タイプ
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider min-w-[160px]">
                      所属企業
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider min-w-[130px]">
                      業界
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider min-w-[110px]">
                      契約SNS
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider min-w-[130px]">
                      契約終了日
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider min-w-[200px]">
                      サポートID
                    </th>
                    <th className="px-5 py-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider sticky right-0 bg-muted/30 z-20 min-w-[140px] backdrop-blur-sm">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-background divide-y divide-border">
                  {filteredUsers.map((user, index) => (
                    <tr 
                      key={user.id} 
                      className="hover:bg-muted/30 transition-colors cursor-pointer group"
                      onClick={() => openDetailModal(user)}
                    >
                      <td className="px-5 py-4 sticky left-0 bg-inherit z-10 group-hover:bg-muted/30">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                            <span className="text-sm font-semibold text-primary-foreground">
                              {user.name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <span className="font-semibold text-sm whitespace-nowrap block">{user.name}</span>
                            {user.role && user.role !== 'user' && (
                              <span className="text-xs text-muted-foreground">{user.role}</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-muted-foreground whitespace-nowrap">
                        <a 
                          href={`mailto:${user.email}`}
                          onClick={(e) => e.stopPropagation()}
                          className="hover:text-foreground transition-colors"
                        >
                          {user.email}
                        </a>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap shadow-sm ${getStatusColor(user.status)}`}>
                          {getStatusLabel(user.status)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-1">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap shadow-sm ${
                            user.planTier === 'ume' ? 'bg-pink-100 text-pink-700 border border-pink-200' :
                            user.planTier === 'take' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                            user.planTier === 'matsu' ? 'bg-purple-100 text-purple-700 border border-purple-200' :
                            'bg-gray-100 text-gray-700 border border-gray-200'
                          }`}>
                            {getPlanName(getUserPlanTier(user))}
                          </span>
                          {!user.accessGranted && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                              アクセス未許可
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 text-xs rounded-full font-semibold whitespace-nowrap shadow-sm">
                          {getContractTypeLabel(user.contractType)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm">
                        {user.companyId ? (
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="text-muted-foreground whitespace-nowrap truncate max-w-[150px]" title={companies.find(c => c.id === user.companyId)?.name}>
                              {companies.find(c => c.id === user.companyId)?.name || '不明な企業'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic">個人利用者</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-sm text-muted-foreground whitespace-nowrap">
                        {user.businessInfo?.industry || <span className="italic text-muted-foreground">未設定</span>}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-1.5 items-center flex-wrap">
                          {user.contractSNS.slice(0, 3).map((sns) => (
                            <span
                              key={sns}
                              className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-muted hover:bg-muted/80 transition-colors text-base"
                              title={snsLabels[sns]}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {snsIcons[sns]}
                            </span>
                          ))}
                          {user.contractSNS.length > 3 && (
                            <span className="text-xs text-muted-foreground whitespace-nowrap font-medium" title={`他${user.contractSNS.length - 3}件`}>
                              +{user.contractSNS.length - 3}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm">
                        <div className="whitespace-nowrap">
                          {new Date(user.contractEndDate).toLocaleDateString('ja-JP', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                          {new Date(user.contractEndDate) < new Date() && (
                            <span className="ml-2 text-xs text-red-600 font-semibold">期限切れ</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm">
                        {user.supportId ? (
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
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground italic text-xs">未付与</span>
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
                      </td>
                      <td className="px-5 py-4 sticky right-0 bg-inherit z-10 group-hover:bg-muted/30">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => openDetailModal(user)}
                            title="詳細表示"
                            className="h-8 w-8 p-0 hover:bg-muted"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => openEditModal(user)}
                            title="編集"
                            className="h-8 w-8 p-0 hover:bg-muted"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
                            title="削除"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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
          </CardContent>
        </Card>
        )}
      </div>

      {/* 詳細モーダル（簡易版） */}
      {showDetailModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-background rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-background z-10">
              <h2 className="text-2xl font-bold">{selectedUser.name} - 詳細情報</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowDetailModal(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-2">基本情報</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">名前:</span> {selectedUser.name}</p>
                    <p><span className="font-medium">メール:</span> {selectedUser.email}</p>
                    <p><span className="font-medium">利用形態:</span> {getUsageTypeLabel(selectedUser.usageType)}</p>
                    <p><span className="font-medium">契約タイプ:</span> {getContractTypeLabel(selectedUser.contractType)}</p>
                    <p><span className="font-medium">ステータス:</span> {getStatusLabel(selectedUser.status)}</p>
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
                    {selectedUser.signalToolAccessUrl && (
                      <div className="mt-4 p-3 bg-muted rounded-md">
                        <p className="font-medium mb-2">Signal.ツールアクセスURL:</p>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={selectedUser.signalToolAccessUrl}
                            readOnly
                            className="flex-1 px-2 py-1 text-xs bg-background border border-border rounded"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              navigator.clipboard.writeText(selectedUser.signalToolAccessUrl || '')
                              alert('URLをコピーしました')
                            }}
                          >
                            コピー
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="font-medium mb-2">契約情報</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">開始日:</span> {new Date(selectedUser.contractStartDate).toLocaleDateString('ja-JP')}</p>
                    <p><span className="font-medium">終了日:</span> {new Date(selectedUser.contractEndDate).toLocaleDateString('ja-JP')}</p>
                    {selectedUser.billingInfo && (
                      <>
                        <p><span className="font-medium">月額:</span> {formatCurrency(selectedUser.billingInfo.monthlyFee)}</p>
                        <p><span className="font-medium">支払い方法:</span> {selectedUser.billingInfo.paymentMethod}</p>
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
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">事業情報</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">業界:</span> {selectedUser.businessInfo.industry}</p>
                  <p><span className="font-medium">事業内容:</span> {selectedUser.businessInfo.description}</p>
                  {selectedUser.businessInfo.snsMainGoals && selectedUser.businessInfo.snsMainGoals.length > 0 && (
                    <p><span className="font-medium">SNS活用目標:</span> {selectedUser.businessInfo.snsMainGoals.join(', ')}</p>
                  )}
                  {selectedUser.businessInfo.brandMission && (
                    <p><span className="font-medium">ブランドミッション:</span> {selectedUser.businessInfo.brandMission}</p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">SNS AI設定</h3>
                <div className="grid grid-cols-2 gap-4">
                  {selectedUser.contractSNS.map((sns) => {
                    const setting = selectedUser.snsAISettings[sns]
                    if (!setting) return null
                    return (
                      <div key={sns} className="border rounded p-3">
                        <h4 className="font-medium text-sm">{snsLabels[sns]}</h4>
                        <div className="text-xs space-y-1 mt-2">
                          {setting.whyThisSNS && <p><span className="font-medium">選定理由:</span> {setting.whyThisSNS}</p>}
                          {setting.snsGoal && <p><span className="font-medium">目標:</span> {setting.snsGoal}</p>}
                          {setting.postFrequency && <p><span className="font-medium">投稿頻度:</span> {setting.postFrequency}</p>}
                          {setting.tone && <p><span className="font-medium">トーン:</span> {setting.tone}</p>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* 支払い確認・アクセス許可アクション */}
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

              {/* 契約管理アクション */}
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
          </div>
        </div>
      )}

      {/* モーダル */}
      <UserModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false)
          if (typeof window !== 'undefined') {
            window.history.replaceState({}, '', '/users')
          }
        }}
        onSave={handleCreateUser}
        preselectedCompanyId={typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('companyId') || undefined : undefined}
      />
      
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