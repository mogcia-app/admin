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
  Timestamp,
  limit
} from 'firebase/firestore'
import { db } from './firebase'
import { UserNotification } from '@/types'

// コレクション名
const COLLECTIONS = {
  USER_NOTIFICATIONS: 'userNotifications'
}

// 個別通知一覧の取得
export async function getUserNotifications(
  userId?: string,
  type?: string,
  status?: string
): Promise<UserNotification[]> {
  try {
    let q = query(
      collection(db, COLLECTIONS.USER_NOTIFICATIONS),
      orderBy('createdAt', 'desc'),
      limit(100)
    )

    if (userId) {
      q = query(
        collection(db, COLLECTIONS.USER_NOTIFICATIONS),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(100)
      )
    }

    if (type) {
      q = query(
        collection(db, COLLECTIONS.USER_NOTIFICATIONS),
        where('type', '==', type),
        orderBy('createdAt', 'desc'),
        limit(100)
      )
    }

    if (status) {
      q = query(
        collection(db, COLLECTIONS.USER_NOTIFICATIONS),
        where('status', '==', status),
        orderBy('createdAt', 'desc'),
        limit(100)
      )
    }

    // 複数の条件を組み合わせる場合
    if (userId && type) {
      q = query(
        collection(db, COLLECTIONS.USER_NOTIFICATIONS),
        where('userId', '==', userId),
        where('type', '==', type),
        orderBy('createdAt', 'desc'),
        limit(100)
      )
    }

    if (userId && status) {
      q = query(
        collection(db, COLLECTIONS.USER_NOTIFICATIONS),
        where('userId', '==', userId),
        where('status', '==', status),
        orderBy('createdAt', 'desc'),
        limit(100)
      )
    }

    if (type && status) {
      q = query(
        collection(db, COLLECTIONS.USER_NOTIFICATIONS),
        where('type', '==', type),
        where('status', '==', status),
        orderBy('createdAt', 'desc'),
        limit(100)
      )
    }

    if (userId && type && status) {
      q = query(
        collection(db, COLLECTIONS.USER_NOTIFICATIONS),
        where('userId', '==', userId),
        where('type', '==', type),
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
      readAt: doc.data().readAt?.toDate?.()?.toISOString() || doc.data().readAt,
    })) as UserNotification[]
  } catch (error) {
    console.error('Error fetching user notifications:', error)
    throw error
  }
}

// 請求書発行通知の取得
export async function getInvoiceNotifications(
  userId?: string,
  status?: string
): Promise<UserNotification[]> {
  return getUserNotifications(userId, 'invoice', status)
}

// 個別通知の作成
export async function createUserNotification(
  notificationData: Omit<UserNotification, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.USER_NOTIFICATIONS), {
      ...notificationData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    })
    
    console.log('User notification created with ID:', docRef.id)
    return docRef.id
  } catch (error) {
    console.error('Error creating user notification:', error)
    throw error
  }
}

// 個別通知の更新
export async function updateUserNotification(
  id: string, 
  updates: Partial<UserNotification>
): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.USER_NOTIFICATIONS, id)
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now()
    })
    
    console.log('User notification updated:', id)
  } catch (error) {
    console.error('Error updating user notification:', error)
    throw error
  }
}

// 個別通知の削除
export async function deleteUserNotification(id: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.USER_NOTIFICATIONS, id)
    await deleteDoc(docRef)
    
    console.log('User notification deleted:', id)
  } catch (error) {
    console.error('Error deleting user notification:', error)
    throw error
  }
}

// 通知を既読にする
export async function markUserNotificationAsRead(id: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.USER_NOTIFICATIONS, id)
    await updateDoc(docRef, {
      status: 'read',
      readAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    })
    
    console.log('User notification marked as read:', id)
  } catch (error) {
    console.error('Error marking user notification as read:', error)
    throw error
  }
}

// 通知をアーカイブする
export async function archiveUserNotification(id: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.USER_NOTIFICATIONS, id)
    await updateDoc(docRef, {
      status: 'archived',
      updatedAt: Timestamp.now()
    })
    
    console.log('User notification archived:', id)
  } catch (error) {
    console.error('Error archiving user notification:', error)
    throw error
  }
}




