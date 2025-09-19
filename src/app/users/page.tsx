'use client'

import React, { useState, useEffect } from 'react'
import { Users, Plus, Search, Edit, Trash2, Eye, Database, Loader2, Calendar, DollarSign, Building } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { UserModal } from '@/components/users/user-modal'
import { User } from '@/types'
import { useUsers, useUserStats } from '@/hooks/useUsers'

// SNSアイコンマッピング
const snsIcons = {
  instagram: '📷',
  x: '🐦',
  youtube: '📺',
  tiktok: '🎵'
}

const snsLabels = {
  instagram: 'Instagram',
  x: 'X (Twitter)',
  youtube: 'YouTube',
  tiktok: 'TikTok'
}

export default function UsersPage() {
  const { users, loading, error, addUser, editUser, removeUser } = useUsers()
  const { stats } = useUserStats()
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedContractType, setSelectedContractType] = useState<string>('all')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [seeding, setSeeding] = useState(false)

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

    // 検索クエリフィルター
    if (searchQuery) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.businessInfo.industry.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.businessInfo.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredUsers(filtered)
  }, [users, searchQuery, selectedStatus, selectedContractType])

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
          targetMarket: '',
          goals: [],
          challenges: [],
          currentSNSStrategy: ''
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

  const handleSeedData = async () => {
    try {
      setSeeding(true)
      // サンプルデータ作成機能は削除されました
      alert('サンプルデータ作成機能は削除されました。手動でユーザーを追加してください。')
    } catch (err) {
      alert('データの作成中にエラーが発生しました: ' + (err instanceof Error ? err.message : '不明なエラー'))
    } finally {
      setSeeding(false)
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
          <Button
            onClick={handleSeedData}
            disabled={seeding}
            variant="outline"
          >
            {seeding ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                作成中...
              </>
            ) : (
              <>
                <Database className="h-4 w-4 mr-2" />
                サンプルデータ作成
              </>
            )}
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            新規利用者追加
          </Button>
        </div>
      </div>

      {/* 統計情報 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総利用者数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">アクティブ</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">お試し契約</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.trialUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">年間契約</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.annualUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">月間売上</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.monthlyRevenue)}</div>
          </CardContent>
        </Card>
      </div>

      {/* 検索・フィルター */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="利用者を検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 w-full bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">すべてのステータス</option>
          <option value="active">アクティブ</option>
          <option value="inactive">非アクティブ</option>
          <option value="suspended">停止中</option>
        </select>
        <select
          value={selectedContractType}
          onChange={(e) => setSelectedContractType(e.target.value)}
          className="px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">すべての契約</option>
          <option value="annual">年間契約</option>
          <option value="trial">お試し契約</option>
        </select>
      </div>

      {/* 利用者一覧 */}
      <Card>
        <CardHeader>
          <CardTitle>利用者一覧</CardTitle>
          <CardDescription>
            {filteredUsers.length} 人の利用者が見つかりました
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <Card key={user.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-primary-foreground">
                            {user.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-medium text-lg">{user.name}</h3>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                        <div className="flex gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                            {getStatusLabel(user.status)}
                          </span>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                            {getContractTypeLabel(user.contractType)}
                          </span>
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full font-medium">
                            {getUsageTypeLabel(user.usageType)}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="font-medium flex items-center gap-1">
                            <Building className="h-4 w-4" />
                            事業情報
                          </p>
                          <p className="text-muted-foreground">{user.businessInfo.industry}</p>
                          <p className="text-muted-foreground">{user.businessInfo.companySize === 'individual' ? '個人' : user.businessInfo.companySize === 'small' ? '小規模' : user.businessInfo.companySize === 'medium' ? '中規模' : '大規模'}</p>
                        </div>
                        
                        <div>
                          <p className="font-medium">契約SNS</p>
                          <div className="flex gap-1 mt-1">
                            {user.contractSNS.map((sns) => (
                              <span
                                key={sns}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-muted text-muted-foreground text-xs rounded"
                                title={snsLabels[sns]}
                              >
                                {snsIcons[sns]} {snsLabels[sns]}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div>
                          <p className="font-medium">契約期間</p>
                          <p className="text-muted-foreground">
                            {new Date(user.contractStartDate).toLocaleDateString('ja-JP')} - {new Date(user.contractEndDate).toLocaleDateString('ja-JP')}
                          </p>
                          {user.billingInfo && (
                            <p className="text-muted-foreground">
                              {formatCurrency(user.billingInfo.monthlyFee)}/月
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="text-sm">
                        <p className="font-medium">事業内容</p>
                        <p className="text-muted-foreground line-clamp-2">{user.businessInfo.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => openDetailModal(user)}
                        title="詳細表示"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => openEditModal(user)}
                        title="編集"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteUser(user.id)}
                        title="削除"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredUsers.length === 0 && (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">該当する利用者が見つかりませんでした。</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 詳細モーダル（簡易版） */}
      {showDetailModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-background rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-bold">{selectedUser.name} - 詳細情報</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowDetailModal(false)}>
                ✕
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
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">事業情報</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">業界:</span> {selectedUser.businessInfo.industry}</p>
                  <p><span className="font-medium">事業内容:</span> {selectedUser.businessInfo.description}</p>
                  <p><span className="font-medium">目標:</span> {selectedUser.businessInfo.goals.join(', ')}</p>
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
                          <p><span className="font-medium">トーン:</span> {setting.tone}</p>
                          <p><span className="font-medium">言語:</span> {setting.language}</p>
                          <p><span className="font-medium">投稿頻度:</span> {setting.postFrequency}</p>
                          <p><span className="font-medium">自動投稿:</span> {setting.autoPost ? 'ON' : 'OFF'}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* モーダル */}
      <UserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={handleCreateUser}
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