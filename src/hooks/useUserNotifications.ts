'use client'

import { useState, useEffect } from 'react'
import { UserNotification } from '@/types'
import { 
  getUserNotifications,
  getInvoiceNotifications,
  createUserNotification, 
  updateUserNotification, 
  deleteUserNotification,
  markUserNotificationAsRead,
  archiveUserNotification
} from '@/lib/user-notifications'

export function useUserNotifications(userId?: string, type?: string, status?: string) {
  const [notifications, setNotifications] = useState<UserNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getUserNotifications(userId, type, status)
      setNotifications(data)
    } catch (err) {
      console.error('Error fetching user notifications:', err)
      setError(err instanceof Error ? err.message : '個別通知の読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [userId, type, status])

  const addUserNotification = async (
    notificationData: Omit<UserNotification, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    try {
      setError(null)
      
      const cleanData = Object.fromEntries(
        Object.entries(notificationData).filter(([_, value]) => value !== undefined)
      ) as Omit<UserNotification, 'id' | 'createdAt' | 'updatedAt'>
      
      const id = await createUserNotification(cleanData)
      
      // ローカル状態を更新
      const newNotification: UserNotification = {
        ...notificationData,
        id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      setNotifications([newNotification, ...notifications])
      
      return id
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '個別通知の作成に失敗しました'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const editUserNotification = async (id: string, updates: Partial<UserNotification>) => {
    try {
      setError(null)
      await updateUserNotification(id, updates)
      
      // ローカル状態を更新
      setNotifications(notifications.map(notification =>
        notification.id === id
          ? { ...notification, ...updates, updatedAt: new Date().toISOString() }
          : notification
      ))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '個別通知の更新に失敗しました'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const removeUserNotification = async (id: string) => {
    try {
      setError(null)
      await deleteUserNotification(id)
      
      // ローカル状態を更新
      setNotifications(notifications.filter(notification => notification.id !== id))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '個別通知の削除に失敗しました'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      setError(null)
      await markUserNotificationAsRead(id)
      
      // ローカル状態を更新
      setNotifications(notifications.map(notification =>
        notification.id === id
          ? { 
              ...notification, 
              status: 'read' as const,
              readAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          : notification
      ))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '通知の既読処理に失敗しました'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const archive = async (id: string) => {
    try {
      setError(null)
      await archiveUserNotification(id)
      
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
      const errorMessage = err instanceof Error ? err.message : '通知のアーカイブに失敗しました'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  return {
    notifications,
    loading,
    error,
    addUserNotification,
    editUserNotification,
    removeUserNotification,
    markAsRead,
    archive,
    refreshNotifications: fetchNotifications
  }
}

export function useInvoiceNotifications(userId?: string, status?: string) {
  const [notifications, setNotifications] = useState<UserNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchNotifications = async () => {
    if (!userId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const data = await getInvoiceNotifications(userId, status)
      setNotifications(data)
    } catch (err) {
      console.error('Error fetching invoice notifications:', err)
      setError(err instanceof Error ? err.message : '請求書発行通知の読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [userId, status])

  const markAsRead = async (id: string) => {
    try {
      setError(null)
      await markUserNotificationAsRead(id)
      
      // ローカル状態を更新
      setNotifications(notifications.map(notification =>
        notification.id === id
          ? { 
              ...notification, 
              status: 'read' as const,
              readAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          : notification
      ))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '通知の既読処理に失敗しました'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const archive = async (id: string) => {
    try {
      setError(null)
      await archiveUserNotification(id)
      
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
      const errorMessage = err instanceof Error ? err.message : '通知のアーカイブに失敗しました'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  return {
    notifications,
    loading,
    error,
    markAsRead,
    archive,
    refreshNotifications: fetchNotifications
  }
}

