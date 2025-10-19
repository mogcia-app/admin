import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  Timestamp,
  limit,
  startAfter
} from 'firebase/firestore'
import { db } from './firebase'
import { 
  Notification, 
  NotificationTemplate, 
  NotificationStats 
} from '@/types'

// コレクション名
const COLLECTIONS = {
  NOTIFICATIONS: 'notifications',
  NOTIFICATION_TEMPLATES: 'notificationTemplates'
}

// お知らせ一覧の取得
export async function getNotifications(status?: string): Promise<Notification[]> {
  try {
    let q = query(
      collection(db, COLLECTIONS.NOTIFICATIONS),
      orderBy('createdAt', 'desc'),
      limit(100)
    )

    if (status) {
      q = query(
        collection(db, COLLECTIONS.NOTIFICATIONS),
        where('status', '==', status),
        orderBy('createdAt', 'desc'),
        limit(100)
      )
    }

    const querySnapshot = await getDocs(q)
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt,
      scheduledAt: doc.data().scheduledAt?.toDate?.()?.toISOString() || doc.data().scheduledAt,
      publishedAt: doc.data().publishedAt?.toDate?.()?.toISOString() || doc.data().publishedAt,
      expiresAt: doc.data().expiresAt?.toDate?.()?.toISOString() || doc.data().expiresAt,
    })) as Notification[]
  } catch (error) {
    console.error('Error fetching notifications:', error)
    throw error
  }
}

// 公開中のお知らせ取得（ユーザー向け）
export async function getPublishedNotifications(targetAudience?: string): Promise<Notification[]> {
  try {
    const now = new Date().toISOString()
    
    let q = query(
      collection(db, COLLECTIONS.NOTIFICATIONS),
      where('status', '==', 'published'),
      orderBy('isSticky', 'desc'),
      orderBy('publishedAt', 'desc')
    )

    const querySnapshot = await getDocs(q)
    
    const notifications = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt,
      scheduledAt: doc.data().scheduledAt?.toDate?.()?.toISOString() || doc.data().scheduledAt,
      publishedAt: doc.data().publishedAt?.toDate?.()?.toISOString() || doc.data().publishedAt,
      expiresAt: doc.data().expiresAt?.toDate?.()?.toISOString() || doc.data().expiresAt,
    })) as Notification[]

    // 期限切れでないもの、対象オーディエンスに該当するものをフィルター
    return notifications.filter(notification => {
      const isNotExpired = !notification.expiresAt || notification.expiresAt > now
      const isTargetAudience = !targetAudience || 
        notification.targetAudience === 'all' || 
        notification.targetAudience === targetAudience
      
      return isNotExpired && isTargetAudience
    })
  } catch (error) {
    console.error('Error fetching published notifications:', error)
    throw error
  }
}

// お知らせの作成
export async function createNotification(notificationData: Omit<Notification, 'id' | 'createdAt' | 'updatedAt' | 'readCount' | 'clickCount'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.NOTIFICATIONS), {
      ...notificationData,
      readCount: 0,
      clickCount: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    })
    
    console.log('Notification created with ID:', docRef.id)
    return docRef.id
  } catch (error) {
    console.error('Error creating notification:', error)
    throw error
  }
}

// お知らせの更新
export async function updateNotification(id: string, updates: Partial<Notification>): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.NOTIFICATIONS, id)
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now()
    })
    
    console.log('Notification updated:', id)
  } catch (error) {
    console.error('Error updating notification:', error)
    throw error
  }
}

// お知らせの削除
export async function deleteNotification(id: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.NOTIFICATIONS, id)
    await deleteDoc(docRef)
    
    console.log('Notification deleted:', id)
  } catch (error) {
    console.error('Error deleting notification:', error)
    throw error
  }
}

// お知らせの公開
export async function publishNotification(id: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.NOTIFICATIONS, id)
    await updateDoc(docRef, {
      status: 'published',
      publishedAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    })
    
    console.log('Notification published:', id)
  } catch (error) {
    console.error('Error publishing notification:', error)
    throw error
  }
}

// お知らせのアーカイブ
export async function archiveNotification(id: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.NOTIFICATIONS, id)
    await updateDoc(docRef, {
      status: 'archived',
      updatedAt: Timestamp.now()
    })
    
    console.log('Notification archived:', id)
  } catch (error) {
    console.error('Error archiving notification:', error)
    throw error
  }
}

// 読了数の増加
export async function incrementReadCount(id: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.NOTIFICATIONS, id)
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      const currentCount = docSnap.data().readCount || 0
      await updateDoc(docRef, {
        readCount: currentCount + 1
      })
    }
  } catch (error) {
    console.error('Error incrementing read count:', error)
    throw error
  }
}

// クリック数の増加
export async function incrementClickCount(id: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.NOTIFICATIONS, id)
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      const currentCount = docSnap.data().clickCount || 0
      await updateDoc(docRef, {
        clickCount: currentCount + 1
      })
    }
  } catch (error) {
    console.error('Error incrementing click count:', error)
    throw error
  }
}

// お知らせテンプレートの取得
export async function getNotificationTemplates(): Promise<NotificationTemplate[]> {
  try {
    const q = query(
      collection(db, COLLECTIONS.NOTIFICATION_TEMPLATES),
      orderBy('name')
    )
    const querySnapshot = await getDocs(q)
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt,
    })) as NotificationTemplate[]
  } catch (error) {
    console.error('Error fetching notification templates:', error)
    throw error
  }
}

// お知らせテンプレートの作成
export async function createNotificationTemplate(templateData: Omit<NotificationTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.NOTIFICATION_TEMPLATES), {
      ...templateData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    })
    
    console.log('Notification template created with ID:', docRef.id)
    return docRef.id
  } catch (error) {
    console.error('Error creating notification template:', error)
    throw error
  }
}

// お知らせ統計の取得
export async function getNotificationStats(): Promise<NotificationStats> {
  try {
    const notifications = await getNotifications()
    
    const totalNotifications = notifications.length
    const publishedNotifications = notifications.filter(n => n.status === 'published').length
    const draftNotifications = notifications.filter(n => n.status === 'draft').length
    
    const totalReads = notifications.reduce((sum, n) => sum + n.readCount, 0)
    const totalClicks = notifications.reduce((sum, n) => sum + n.clickCount, 0)
    
    const averageReadRate = publishedNotifications > 0 ? totalReads / publishedNotifications : 0
    const averageClickRate = totalReads > 0 ? (totalClicks / totalReads) * 100 : 0
    
    const notificationsByType = notifications.reduce((acc, n) => {
      acc[n.type] = (acc[n.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const notificationsByPriority = notifications.reduce((acc, n) => {
      acc[n.priority] = (acc[n.priority] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    return {
      totalNotifications,
      publishedNotifications,
      draftNotifications,
      totalReads,
      totalClicks,
      averageReadRate,
      averageClickRate,
      notificationsByType,
      notificationsByPriority
    }
  } catch (error) {
    console.error('Error getting notification stats:', error)
    throw error
  }
}

// サンプルお知らせデータの作成
