'use client'

import React, { useState } from 'react'
import { Plus, Search, Filter, Loader2, BarChart3, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { NotificationModal } from '@/components/notifications/notification-modal'
import { NotificationList } from '@/components/notifications/notification-list'
import { Notification } from '@/types'
import { useNotifications, useNotificationStats } from '@/hooks/useNotifications'

export default function NotificationsPage() {
  const { 
    notifications, 
    loading, 
    error, 
    addNotification, 
    editNotification, 
    removeNotification,
    publishNotification,
    archiveNotification,
    refreshNotifications
  } = useNotifications()
  const { stats, loading: statsLoading } = useNotificationStats()
  
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  // 検索とフィルタリング
  React.useEffect(() => {
    let filtered = notifications || []

    // ステータスフィルター
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(notification => notification.status === selectedStatus)
    }

    // タイプフィルター
    if (selectedType !== 'all') {
      filtered = filtered.filter(notification => notification.type === selectedType)
    }

    // 検索クエリフィルター
    if (searchQuery) {
      filtered = filtered.filter(notification =>
        notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notification.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notification.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    setFilteredNotifications(filtered)
  }, [notifications, searchQuery, selectedStatus, selectedType])

  const handleCreateNotification = async (notificationData: Partial<Notification>) => {
    try {
      // 必要なフィールドのみを含むデータを作成
      const baseData = {
        title: notificationData.title || '',
        content: notificationData.content || '',
        type: notificationData.type || 'info',
        priority: notificationData.priority || 'medium',
        status: notificationData.status || 'draft',
        targetAudience: notificationData.targetAudience || 'all',
        createdBy: 'admin_001', // 実際は認証されたユーザーのID
        tags: notificationData.tags || [],
        isSticky: notificationData.isSticky || false
      }

      // 日時フィールドは値がある場合のみ追加
      const cleanData = {
        ...baseData,
        ...(notificationData.scheduledAt && { scheduledAt: notificationData.scheduledAt }),
        ...(notificationData.expiresAt && { expiresAt: notificationData.expiresAt })
      }

      await addNotification(cleanData)
      alert('お知らせを作成しました！')
    } catch (err) {
      console.error('Notification creation error:', err)
      alert('お知らせの作成に失敗しました: ' + (err instanceof Error ? err.message : '不明なエラー'))
    }
  }

  const handleEditNotification = async (notificationData: Partial<Notification>) => {
    if (!selectedNotification) return

    try {
      await editNotification(selectedNotification.id, notificationData)
      setSelectedNotification(null)
      alert('お知らせを更新しました！')
    } catch (err) {
      alert('お知らせの更新に失敗しました: ' + (err instanceof Error ? err.message : '不明なエラー'))
    }
  }

  const handleDeleteNotification = async (notificationId: string) => {
    if (confirm('このお知らせを削除しますか？この操作は取り消せません。')) {
      try {
        await removeNotification(notificationId)
        alert('お知らせを削除しました')
      } catch (err) {
        alert('お知らせの削除に失敗しました: ' + (err instanceof Error ? err.message : '不明なエラー'))
      }
    }
  }

  const handlePublishNotification = async (notificationId: string) => {
    if (confirm('このお知らせを公開しますか？')) {
      try {
        await publishNotification(notificationId)
        alert('お知らせを公開しました')
      } catch (err) {
        alert('お知らせの公開に失敗しました: ' + (err instanceof Error ? err.message : '不明なエラー'))
      }
    }
  }

  const handleArchiveNotification = async (notificationId: string) => {
    if (confirm('このお知らせをアーカイブしますか？')) {
      try {
        await archiveNotification(notificationId)
        alert('お知らせをアーカイブしました')
      } catch (err) {
        alert('お知らせのアーカイブに失敗しました: ' + (err instanceof Error ? err.message : '不明なエラー'))
      }
    }
  }


  const openEditModal = (notification: Notification) => {
    setSelectedNotification(notification)
    setShowEditModal(true)
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">お知らせ管理</h1>
          <p className="text-muted-foreground">
            ユーザー向けのお知らせ・メンテナンス情報の作成と管理
            {error && <span className="text-destructive ml-2">({error})</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={refreshNotifications} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            更新
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            新規お知らせ作成
          </Button>
        </div>
      </div>

      {/* 統計情報 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総お知らせ数</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? '-' : stats.totalNotifications}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">公開中</CardTitle>
            <BarChart3 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? '-' : stats.publishedNotifications}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">下書き</CardTitle>
            <BarChart3 className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? '-' : stats.draftNotifications}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総閲覧数</CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? '-' : stats.totalReads.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 検索・フィルター */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="お知らせを検索..."
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
          <option value="published">公開中</option>
          <option value="draft">下書き</option>
          <option value="archived">アーカイブ</option>
        </select>
        
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">すべての種別</option>
          <option value="info">情報</option>
          <option value="success">成功・完了</option>
          <option value="warning">警告・注意</option>
          <option value="error">エラー・障害</option>
          <option value="maintenance">メンテナンス</option>
        </select>
      </div>

      {/* お知らせ一覧 */}
      <NotificationList
        notifications={filteredNotifications}
        loading={loading}
        onEdit={openEditModal}
        onDelete={handleDeleteNotification}
        onPublish={handlePublishNotification}
        onArchive={handleArchiveNotification}
      />

      {/* モーダル */}
      <NotificationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={handleCreateNotification}
      />
      
      <NotificationModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setSelectedNotification(null)
        }}
        notification={selectedNotification}
        onSave={handleEditNotification}
      />
    </div>
  )
}
