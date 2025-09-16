'use client'

import { useState, useEffect } from 'react'
import { 
  Notification, 
  NotificationTemplate, 
  NotificationStats 
} from '@/types'
import { 
  getNotifications, 
  getPublishedNotifications,
  createNotification, 
  updateNotification, 
  deleteNotification,
  publishNotification,
  archiveNotification,
  getNotificationTemplates,
  createNotificationTemplate,
  getNotificationStats
} from '@/lib/notifications'

export function useNotifications(status?: string) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getNotifications(status)
      setNotifications(data)
    } catch (err) {
      console.error('Error fetching notifications:', err)
      setError(err instanceof Error ? err.message : 'お知らせの読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [status])

  const addNotification = async (notificationData: Omit<Notification, 'id' | 'createdAt' | 'updatedAt' | 'readCount' | 'clickCount'>) => {
    try {
      setError(null)
      const id = await createNotification(notificationData)
      
      // ローカル状態を更新
      const newNotification: Notification = {
        ...notificationData,
        id,
        readCount: 0,
        clickCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      setNotifications([newNotification, ...notifications])
      
      return id
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'お知らせの作成に失敗しました'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const editNotification = async (id: string, updates: Partial<Notification>) => {
    try {
      setError(null)
      await updateNotification(id, updates)
      
      // ローカル状態を更新
      setNotifications(notifications.map(notification =>
        notification.id === id
          ? { ...notification, ...updates, updatedAt: new Date().toISOString() }
          : notification
      ))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'お知らせの更新に失敗しました'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const removeNotification = async (id: string) => {
    try {
      setError(null)
      await deleteNotification(id)
      
      // ローカル状態を更新
      setNotifications(notifications.filter(notification => notification.id !== id))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'お知らせの削除に失敗しました'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const publishNotificationById = async (id: string) => {
    try {
      setError(null)
      await publishNotification(id)
      
      // ローカル状態を更新
      setNotifications(notifications.map(notification =>
        notification.id === id
          ? { 
              ...notification, 
              status: 'published' as const, 
              publishedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          : notification
      ))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'お知らせの公開に失敗しました'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const archiveNotificationById = async (id: string) => {
    try {
      setError(null)
      await archiveNotification(id)
      
      // ローカル状態を更新
      setNotifications(notifications.map(notification =>
        notification.id === id
          ? { 
              ...notification, 
              status: 'archived' as const,
              updatedAt: new Date().toISOString()
            }
          : notification
      ))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'お知らせのアーカイブに失敗しました'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  return {
    notifications,
    loading,
    error,
    addNotification,
    editNotification,
    removeNotification,
    publishNotification: publishNotificationById,
    archiveNotification: archiveNotificationById,
    refreshNotifications: fetchNotifications
  }
}

export function usePublishedNotifications(targetAudience?: string) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPublishedNotifications = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getPublishedNotifications(targetAudience)
        setNotifications(data)
      } catch (err) {
        console.error('Error fetching published notifications:', err)
        setError(err instanceof Error ? err.message : '公開中のお知らせの読み込みに失敗しました')
      } finally {
        setLoading(false)
      }
    }

    fetchPublishedNotifications()
  }, [targetAudience])

  return {
    notifications,
    loading,
    error
  }
}

export function useNotificationTemplates() {
  const [templates, setTemplates] = useState<NotificationTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getNotificationTemplates()
        setTemplates(data)
      } catch (err) {
        console.error('Error fetching notification templates:', err)
        setError(err instanceof Error ? err.message : 'テンプレートの読み込みに失敗しました')
      } finally {
        setLoading(false)
      }
    }

    fetchTemplates()
  }, [])

  const addTemplate = async (templateData: Omit<NotificationTemplate, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setError(null)
      const id = await createNotificationTemplate(templateData)
      
      // ローカル状態を更新
      const newTemplate: NotificationTemplate = {
        ...templateData,
        id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      setTemplates([...templates, newTemplate])
      
      return id
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'テンプレートの作成に失敗しました'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  return {
    templates,
    loading,
    error,
    addTemplate
  }
}

export function useNotificationStats() {
  const [stats, setStats] = useState<NotificationStats>({
    totalNotifications: 0,
    publishedNotifications: 0,
    draftNotifications: 0,
    totalReads: 0,
    totalClicks: 0,
    averageReadRate: 0,
    averageClickRate: 0,
    notificationsByType: {},
    notificationsByPriority: {}
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getNotificationStats()
      setStats(data)
    } catch (err) {
      console.error('Error fetching notification stats:', err)
      setError(err instanceof Error ? err.message : '統計データの読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  return {
    stats,
    loading,
    error,
    refreshStats: fetchStats
  }
}
