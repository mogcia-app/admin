'use client'

import React, { useState, useEffect } from 'react'
import { X, AlertCircle, Info, CheckCircle, AlertTriangle, Wrench, Bell } from 'lucide-react'
import { getPublishedNotifications, incrementReadCount } from '@/lib/notifications'
import { Notification } from '@/types'
import { Button } from '@/components/ui/button'

interface NotificationBannerProps {
  targetAudience?: 'all' | 'trial' | 'paid'
  maxDisplay?: number // 最大表示数（固定表示のみ、または固定表示 + 通常表示）
  className?: string
}

export function NotificationBanner({ 
  targetAudience, 
  maxDisplay = 3,
  className = '' 
}: NotificationBannerProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [dismissedIds, setDismissedIds] = useState<string[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const publishedNotifications = await getPublishedNotifications(targetAudience)
        
        // 固定表示のお知らせを優先し、期限切れでないもののみ表示
        const now = new Date().toISOString()
        const validNotifications = publishedNotifications
          .filter(n => {
            const isNotExpired = !n.expiresAt || n.expiresAt > now
            const isScheduled = !n.scheduledAt || n.scheduledAt <= now
            return isNotExpired && isScheduled
          })
          .sort((a, b) => {
            // 固定表示を最優先
            if (a.isSticky && !b.isSticky) return -1
            if (!a.isSticky && b.isSticky) return 1
            // 次に優先度でソート
            const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
            const aPriority = priorityOrder[a.priority] || 0
            const bPriority = priorityOrder[b.priority] || 0
            if (aPriority !== bPriority) return bPriority - aPriority
            // 最後に公開日時でソート
            return new Date(b.publishedAt || b.createdAt).getTime() - 
                   new Date(a.publishedAt || a.createdAt).getTime()
          })
          .slice(0, maxDisplay)

        setNotifications(validNotifications)
        
        // 表示されたお知らせの読了数を増やす
        validNotifications.forEach(async (notification) => {
          try {
            await incrementReadCount(notification.id)
          } catch (error) {
            console.error('Error incrementing read count:', error)
          }
        })
      } catch (error) {
        console.error('Error fetching notifications:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchNotifications()
  }, [targetAudience, maxDisplay])

  const handleDismiss = (id: string) => {
    setDismissedIds([...dismissedIds, id])
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'info': return <Info className="h-5 w-5" />
      case 'success': return <CheckCircle className="h-5 w-5" />
      case 'warning': return <AlertTriangle className="h-5 w-5" />
      case 'error': return <AlertCircle className="h-5 w-5" />
      case 'maintenance': return <Wrench className="h-5 w-5" />
      default: return <Bell className="h-5 w-5" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'info': return 'bg-blue-50 border-blue-200 text-blue-800'
      case 'success': return 'bg-green-50 border-green-200 text-green-800'
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'error': return 'bg-red-50 border-red-200 text-red-800'
      case 'maintenance': return 'bg-purple-50 border-purple-200 text-purple-800'
      default: return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  const getPriorityBadge = (priority: string) => {
    if (priority === 'urgent') {
      return (
        <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-800 text-xs font-semibold rounded">
          緊急
        </span>
      )
    }
    if (priority === 'high') {
      return (
        <span className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-800 text-xs font-semibold rounded">
          重要
        </span>
      )
    }
    return null
  }

  if (loading) {
    return null
  }

  const visibleNotifications = notifications.filter(n => !dismissedIds.includes(n.id))

  if (visibleNotifications.length === 0) {
    return null
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {visibleNotifications.map((notification) => {
        const isExpanded = expandedId === notification.id
        const typeColor = getTypeColor(notification.type)
        
        return (
          <div
            key={notification.id}
            className={`border-l-4 rounded-r-lg p-4 shadow-sm ${typeColor} ${
              notification.isSticky ? 'ring-2 ring-yellow-300' : ''
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <div className="mt-0.5 flex-shrink-0">
                  {getTypeIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-sm md:text-base">
                      {notification.title}
                    </h3>
                    {getPriorityBadge(notification.priority)}
                    {notification.isSticky && (
                      <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded">
                        固定
                      </span>
                    )}
                  </div>
                  
                  {isExpanded ? (
                    <div className="mt-2">
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">
                        {notification.content}
                      </p>
                      {notification.tags && notification.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {notification.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 bg-white/50 rounded text-xs"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <button
                        onClick={() => setExpandedId(null)}
                        className="mt-3 text-xs underline hover:no-underline"
                      >
                        折りたたむ
                      </button>
                    </div>
                  ) : (
                    <div className="mt-1">
                      <p className="text-sm line-clamp-2">
                        {notification.content}
                      </p>
                      {notification.content.length > 100 && (
                        <button
                          onClick={() => setExpandedId(notification.id)}
                          className="mt-2 text-xs underline hover:no-underline"
                        >
                          続きを読む
                        </button>
                      )}
                    </div>
                  )}
                  
                  <div className="mt-2 text-xs opacity-75">
                    {new Date(notification.publishedAt || notification.createdAt).toLocaleDateString('ja-JP', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDismiss(notification.id)}
                className="ml-2 flex-shrink-0 h-6 w-6 p-0 hover:bg-white/50"
                aria-label="閉じる"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}



