import { 
  Notification, 
  NotificationTemplate, 
  NotificationStats 
} from '@/types'
import { API_ENDPOINTS, apiGet, apiPost, apiPut, apiDelete } from './api-config'

// 通知一覧取得 (Cloud Functions API使用)
export async function getNotifications(
  type?: string, 
  status?: string, 
  limit?: number
): Promise<Notification[]> {
  try {
    const params: Record<string, string> = {}
    if (type) params.type = type
    if (status) params.status = status
    if (limit) params.limit = limit.toString()

    const response = await apiGet(API_ENDPOINTS.notifications.list, params)
    return response.notifications || []
  } catch (error) {
    console.error('Error fetching notifications from API:', error)
    throw error
  }
}

// 通知作成 (Cloud Functions API使用)
export async function createNotification(notificationData: {
  title: string
  message: string
  type?: string
  targetUsers?: string
  scheduledAt?: string
  priority?: string
  createdBy: string
}): Promise<string> {
  try {
    const response = await apiPost(API_ENDPOINTS.notifications.create, notificationData)
    console.log('Notification created with ID:', response.id)
    return response.id
  } catch (error) {
    console.error('Error creating notification via API:', error)
    throw error
  }
}

// 通知更新 (Cloud Functions API使用)
export async function updateNotification(id: string, updates: Partial<Notification>): Promise<void> {
  try {
    const { id: _, createdAt, ...updateData } = updates
    const url = `${API_ENDPOINTS.notifications.update}?id=${id}`
    
    await apiPut(url, updateData)
    console.log('Notification updated via API:', id)
  } catch (error) {
    console.error('Error updating notification via API:', error)
    throw error
  }
}

// 通知削除 (Cloud Functions API使用)
export async function deleteNotification(id: string): Promise<void> {
  try {
    const url = `${API_ENDPOINTS.notifications.delete}?id=${id}`
    await apiDelete(url)
    console.log('Notification deleted via API:', id)
  } catch (error) {
    console.error('Error deleting notification via API:', error)
    throw error
  }
}

// 通知統計取得 (Cloud Functions API使用)
export async function getNotificationStats(): Promise<NotificationStats> {
  try {
    const response = await apiGet(API_ENDPOINTS.notifications.stats)
    return response.stats || {
      total: 0,
      sent: 0,
      scheduled: 0,
      draft: 0,
      totalReads: 0,
      avgReadRate: 0
    }
  } catch (error) {
    console.error('Error fetching notification stats from API:', error)
    throw error
  }
}

// 通知タイプ別取得
export async function getNotificationsByType(type: string): Promise<Notification[]> {
  return getNotifications(type)
}

// 送信済み通知取得
export async function getSentNotifications(): Promise<Notification[]> {
  return getNotifications(undefined, 'sent')
}

// スケジュール通知取得
export async function getScheduledNotifications(): Promise<Notification[]> {
  return getNotifications(undefined, 'scheduled')
}

// 下書き通知取得
export async function getDraftNotifications(): Promise<Notification[]> {
  return getNotifications(undefined, 'draft')
}

// 通知の即座送信
export async function sendNotificationNow(id: string): Promise<void> {
  try {
    await updateNotification(id, {
      status: 'published'
    })
  } catch (error) {
    console.error('Error sending notification immediately:', error)
    throw error
  }
}

// 通知のスケジュール変更
export async function rescheduleNotification(id: string, newScheduledAt: string): Promise<void> {
  try {
    await updateNotification(id, {
      scheduledAt: newScheduledAt,
      status: 'draft'
    })
  } catch (error) {
    console.error('Error rescheduling notification:', error)
    throw error
  }
}

// 通知の一括操作
export async function bulkDeleteNotifications(ids: string[]): Promise<void> {
  try {
    await Promise.all(ids.map(id => deleteNotification(id)))
  } catch (error) {
    console.error('Error bulk deleting notifications:', error)
    throw error
  }
}

export async function bulkSendNotifications(ids: string[]): Promise<void> {
  try {
    await Promise.all(ids.map(id => sendNotificationNow(id)))
  } catch (error) {
    console.error('Error bulk sending notifications:', error)
    throw error
  }
}
