'use client'

import React, { useState } from 'react'
import { Search, Filter, Loader2, RefreshCw, FileText, User, Calendar, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { UserNotification } from '@/types'
import { useInvoiceNotifications } from '@/hooks/useUserNotifications'
import { useAuth } from '@/contexts/auth-context'

export default function InvoiceNotificationsPage() {
  const { adminUser } = useAuth()
  const { 
    notifications, 
    loading, 
    error, 
    refreshNotifications,
    markAsRead,
    archive
  } = useInvoiceNotifications()
  
  const [filteredNotifications, setFilteredNotifications] = useState<UserNotification[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')

  // 検索とフィルタリング
  React.useEffect(() => {
    let filtered = notifications || []

    // ステータスフィルター
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(notification => notification.status === selectedStatus)
    }

    // 検索クエリフィルター
    if (searchQuery) {
      filtered = filtered.filter(notification =>
        notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notification.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notification.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notification.userEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notification.metadata?.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredNotifications(filtered)
  }, [notifications, searchQuery, selectedStatus])

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead(notificationId)
      alert('通知を既読にしました')
    } catch (err) {
      alert('通知の既読処理に失敗しました: ' + (err instanceof Error ? err.message : '不明なエラー'))
    }
  }

  const handleArchive = async (notificationId: string) => {
    if (confirm('この通知をアーカイブしますか？')) {
      try {
        await archive(notificationId)
        alert('通知をアーカイブしました')
      } catch (err) {
        alert('通知のアーカイブに失敗しました: ' + (err instanceof Error ? err.message : '不明なエラー'))
      }
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'unread': return 'bg-blue-100 text-blue-800'
      case 'read': return 'bg-gray-100 text-gray-800'
      case 'archived': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'unread': return '未読'
      case 'read': return '既読'
      case 'archived': return 'アーカイブ'
      default: return status
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-blue-100 text-blue-800'
      case 'low': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount?: number) => {
    if (!amount) return '-'
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY'
    }).format(amount)
  }

  // 統計情報の計算
  const stats = React.useMemo(() => {
    const total = notifications.length
    const unread = notifications.filter(n => n.status === 'unread').length
    const read = notifications.filter(n => n.status === 'read').length
    const archived = notifications.filter(n => n.status === 'archived').length
    
    return { total, unread, read, archived }
  }, [notifications])

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">請求書発行通知</h1>
          <p className="text-muted-foreground">
            個別ユーザー向けの請求書発行通知の管理
            {error && <span className="text-destructive ml-2">({error})</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={refreshNotifications} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            更新
          </Button>
        </div>
      </div>

      {/* 統計情報 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総通知数</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '-' : stats.total}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">未読</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {loading ? '-' : stats.unread}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">既読</CardTitle>
            <FileText className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {loading ? '-' : stats.read}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">アーカイブ</CardTitle>
            <FileText className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {loading ? '-' : stats.archived}
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
            placeholder="ユーザー名、メールアドレス、請求書番号で検索..."
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
          <option value="unread">未読</option>
          <option value="read">既読</option>
          <option value="archived">アーカイブ</option>
        </select>
      </div>

      {/* 通知一覧 */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-3 bg-muted rounded w-5/6"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📄</div>
          <h3 className="text-lg font-semibold mb-2">請求書発行通知がありません</h3>
          <p className="text-muted-foreground">
            {searchQuery || selectedStatus !== 'all' 
              ? '検索条件に一致する通知が見つかりませんでした。'
              : 'まだ請求書発行通知はありません。'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotifications.map((notification) => (
            <Card 
              key={notification.id} 
              className={`hover:shadow-md transition-shadow ${
                notification.status === 'unread' ? 'border-blue-300 bg-blue-50/50' : ''
              }`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="text-lg">{notification.title}</CardTitle>
                      
                      <Badge className={getStatusColor(notification.status)}>
                        {getStatusLabel(notification.status)}
                      </Badge>
                      
                      <Badge variant="outline" className={getPriorityColor(notification.priority)}>
                        {notification.priority === 'urgent' ? '🚨 緊急' :
                         notification.priority === 'high' ? '🔥 高' :
                         notification.priority === 'medium' ? '📋 中' :
                         notification.priority === 'low' ? '📝 低' : notification.priority}
                      </Badge>
                    </div>
                    
                    <CardDescription className="flex items-center gap-4 text-sm flex-wrap">
                      {notification.userName && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {notification.userName}
                        </span>
                      )}
                      {notification.userEmail && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {notification.userEmail}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(notification.createdAt)}
                      </span>
                      {notification.metadata?.invoiceNumber && (
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          請求書番号: {notification.metadata.invoiceNumber}
                        </span>
                      )}
                      {notification.metadata?.amount && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          金額: {formatCurrency(notification.metadata.amount)}
                        </span>
                      )}
                      {notification.metadata?.dueDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          支払期限: {formatDate(notification.metadata.dueDate)}
                        </span>
                      )}
                      {notification.readAt && (
                        <span className="flex items-center gap-1 text-green-600">
                          <Calendar className="h-3 w-3" />
                          既読: {formatDate(notification.readAt)}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    {notification.status === 'unread' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMarkAsRead(notification.id)}
                        title="既読にする"
                      >
                        既読にする
                      </Button>
                    )}
                    
                    {notification.status !== 'archived' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleArchive(notification.id)}
                        title="アーカイブ"
                        className="text-orange-600 hover:text-orange-700"
                      >
                        アーカイブ
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {notification.content}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}


