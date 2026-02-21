/**
 * 会員サイト側でのお知らせ一覧ページの実装例
 * 
 * このファイルは実装例です。会員サイト側のプロジェクトにコピーして使用してください。
 * 
 * 使用方法:
 * 1. このファイルを会員サイト側のプロジェクトにコピー
 * 2. `src/app/notifications/page.tsx` として保存
 * 3. 必要に応じてスタイルやレイアウトを調整
 */

'use client'

import React, { useState } from 'react'
import { NotificationCard } from '@/components/notifications/notification-card'
import { usePublishedNotifications } from '@/hooks/useNotifications'
import { getUserPlanTier } from '@/lib/plan-access'
import { User } from '@/types'
import { incrementClickCount } from '@/lib/notifications'

interface NotificationsPageExampleProps {
  userProfile?: User | null
}

export default function NotificationsPageExample({ userProfile }: NotificationsPageExampleProps) {
  // プラン階層に基づいて対象オーディエンスを決定
  const planTier = getUserPlanTier(userProfile)
  const targetAudience = planTier === 'basic' ? 'trial' : 'paid'
  
  const { notifications, loading, error } = usePublishedNotifications(targetAudience)
  const [selectedNotification, setSelectedNotification] = useState<string | null>(null)

  const handleNotificationClick = async (notificationId: string) => {
    setSelectedNotification(notificationId)
    try {
      await incrementClickCount(notificationId)
    } catch (error) {
      console.error('Error incrementing click count:', error)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">お知らせを読み込み中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">お知らせの読み込みに失敗しました</p>
          <p className="text-sm text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">お知らせ</h1>
        <p className="text-muted-foreground">
          最新のお知らせやメンテナンス情報をお知らせします
        </p>
      </div>
      
      {notifications.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📢</div>
          <h3 className="text-lg font-semibold mb-2">お知らせはありません</h3>
          <p className="text-muted-foreground">
            現在、表示するお知らせはありません
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onClick={() => handleNotificationClick(notification.id)}
              className={selectedNotification === notification.id ? 'ring-2 ring-blue-500' : ''}
            />
          ))}
        </div>
      )}
    </div>
  )
}




