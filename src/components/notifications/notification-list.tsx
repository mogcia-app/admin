'use client'

import React from 'react'
import { 
  Edit, 
  Trash2, 
  Eye, 
  Send, 
  Archive, 
  Pin, 
  Users, 
  Calendar, 
  Tag,
  BarChart3,
  AlertTriangle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Notification } from '@/types'

interface NotificationListProps {
  notifications: Notification[] | undefined
  loading?: boolean
  onEdit: (notification: Notification) => void
  onDelete: (id: string) => void
  onPublish: (id: string) => void
  onArchive: (id: string) => void
}

export function NotificationList({ 
  notifications, 
  loading, 
  onEdit, 
  onDelete, 
  onPublish, 
  onArchive 
}: NotificationListProps) {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'info': return 'bg-blue-100 text-blue-800'
      case 'success': return 'bg-green-100 text-green-800'
      case 'warning': return 'bg-yellow-100 text-yellow-800'
      case 'error': return 'bg-red-100 text-red-800'
      case 'maintenance': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'info': return '💡'
      case 'success': return '✅'
      case 'warning': return '⚠️'
      case 'error': return '❌'
      case 'maintenance': return '🔧'
      default: return '📢'
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800'
      case 'draft': return 'bg-yellow-100 text-yellow-800'
      case 'archived': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'published': return '公開中'
      case 'draft': return '下書き'
      case 'archived': return 'アーカイブ'
      default: return status
    }
  }

  const getTargetAudienceLabel = (audience: string) => {
    switch (audience) {
      case 'all': return '全ユーザー'
      case 'trial': return 'トライアル'
      case 'paid': return '有料ユーザー'
      case 'admin': return '管理者のみ'
      default: return audience
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

  const isExpired = (notification: Notification) => {
    if (!notification.expiresAt) return false
    return new Date(notification.expiresAt) < new Date()
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="animate-pulse rounded-none border-slate-200 shadow-sm">
            <CardHeader>
              <div className="h-4 bg-muted rounded-none w-3/4"></div>
              <div className="h-3 bg-muted rounded-none w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-muted rounded-none"></div>
                <div className="h-3 bg-muted rounded-none w-5/6"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!notifications || notifications.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📢</div>
        <h3 className="text-lg font-semibold mb-2">お知らせがありません</h3>
        <p className="text-muted-foreground">新しいお知らせを作成してユーザーに情報を伝えましょう。</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {notifications?.map((notification) => {
        const expired = isExpired(notification)
        
        return (
          <Card key={notification.id} className={`rounded-none border-slate-200 shadow-sm hover:shadow-md transition-shadow ${
            expired ? 'opacity-75 border-gray-300' : ''
          }`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-lg">{getTypeIcon(notification.type)}</span>
                    <CardTitle className="text-lg">{notification.title}</CardTitle>
                    
                    {notification.isSticky && (
                      <Badge variant="outline" className="rounded-none bg-yellow-50 text-yellow-700 border-yellow-200">
                        <Pin className="h-3 w-3 mr-1" />
                        固定
                      </Badge>
                    )}
                    
                    <Badge className={`rounded-none ${getStatusColor(notification.status)}`}>
                      {getStatusLabel(notification.status)}
                    </Badge>
                    
                    <Badge variant="outline" className={`rounded-none ${getTypeColor(notification.type)}`}>
                      {notification.type}
                    </Badge>
                    
                    <Badge variant="outline" className={`rounded-none ${getPriorityColor(notification.priority)}`}>
                      {notification.priority === 'urgent' ? '🚨 緊急' :
                       notification.priority === 'high' ? '🔥 高' :
                       notification.priority === 'medium' ? '📋 中' :
                       notification.priority === 'low' ? '📝 低' : notification.priority}
                    </Badge>
                    
                    {expired && (
                      <Badge variant="outline" className="rounded-none bg-red-50 text-red-700 border-red-200">
                        期限切れ
                      </Badge>
                    )}
                  </div>
                  
                  <CardDescription className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {getTargetAudienceLabel(notification.targetAudience)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(notification.createdAt)}
                    </span>
                    {notification.publishedAt && (
                      <span className="flex items-center gap-1 text-green-600">
                        <Send className="h-3 w-3" />
                        公開: {formatDate(notification.publishedAt)}
                      </span>
                    )}
                    {notification.expiresAt && (
                      <span className={`flex items-center gap-1 ${expired ? 'text-red-600' : 'text-orange-600'}`}>
                        <AlertTriangle className="h-3 w-3" />
                        期限: {formatDate(notification.expiresAt)}
                      </span>
                    )}
                  </CardDescription>
                  
                  <div className="flex flex-wrap gap-1">
                    {notification.tags?.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-none flex items-center gap-1"
                      >
                        <Tag className="h-3 w-3" />
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  {notification.status === 'published' && (
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mr-4">
                      <span className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {notification.readCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <BarChart3 className="h-4 w-4" />
                        {notification.clickCount}
                      </span>
                    </div>
                  )}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(notification)}
                    title="編集"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  
                  {notification.status === 'draft' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onPublish(notification.id)}
                      title="公開"
                      className="text-green-600 hover:text-green-700"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  )}
                  
                  {notification.status === 'published' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onArchive(notification.id)}
                      title="アーカイブ"
                      className="text-orange-600 hover:text-orange-700"
                    >
                      <Archive className="h-4 w-4" />
                    </Button>
                  )}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(notification.id)}
                    title="削除"
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-3">
                {notification.content}
              </p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
