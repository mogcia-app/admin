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
  Timestamp
} from 'firebase/firestore'
import { db } from './firebase'

// 設定データの型定義
export interface SystemSettings {
  id: string
  category: 'general' | 'security' | 'notification' | 'integration' | 'backup'
  key: string
  value: string | number | boolean
  description: string
  type: 'string' | 'number' | 'boolean' | 'select' | 'json'
  options?: string[]
  isEditable: boolean
  updatedBy: string
  updatedAt: string
}

export interface AdminProfile {
  id: string
  name: string
  email: string
  role: 'super_admin' | 'admin' | 'moderator'
  avatar?: string
  preferences: {
    theme: 'light' | 'dark' | 'system'
    language: 'ja' | 'en'
    timezone: string
    notifications: {
      email: boolean
      browser: boolean
      slack: boolean
    }
  }
  lastLogin: string
  createdAt: string
  updatedAt: string
}

// コレクション名
const COLLECTIONS = {
  SYSTEM_SETTINGS: 'systemSettings',
  ADMIN_PROFILES: 'adminProfiles'
}

// システム設定の取得
export async function getSystemSettings(category?: string): Promise<SystemSettings[]> {
  try {
    // 複合インデックスエラーを避けるため、シンプルなクエリに変更
    let q = query(collection(db, COLLECTIONS.SYSTEM_SETTINGS))
    
    if (category) {
      q = query(
        collection(db, COLLECTIONS.SYSTEM_SETTINGS),
        where('category', '==', category)
      )
    }

    const querySnapshot = await getDocs(q)
    
    // クライアントサイドでソート
    const settings = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt,
    })) as SystemSettings[]

    // categoryとkeyでソート
    return settings.sort((a, b) => {
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category)
      }
      return a.key.localeCompare(b.key)
    })
  } catch (error) {
    console.error('Error fetching system settings:', error)
    throw error
  }
}

// システム設定の更新
export async function updateSystemSetting(id: string, value: any, updatedBy: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.SYSTEM_SETTINGS, id)
    await updateDoc(docRef, {
      value,
      updatedBy,
      updatedAt: Timestamp.now()
    })
    
    console.log('System setting updated:', id)
  } catch (error) {
    console.error('Error updating system setting:', error)
    throw error
  }
}

// 管理者プロフィールの取得
export async function getAdminProfile(adminId: string): Promise<AdminProfile | null> {
  try {
    const docRef = doc(db, COLLECTIONS.ADMIN_PROFILES, adminId)
    const docSnap = await getDoc(docRef)
    
    if (!docSnap.exists()) return null
    
    return {
      id: docSnap.id,
      ...docSnap.data(),
      lastLogin: docSnap.data().lastLogin?.toDate?.()?.toISOString() || docSnap.data().lastLogin,
      createdAt: docSnap.data().createdAt?.toDate?.()?.toISOString() || docSnap.data().createdAt,
      updatedAt: docSnap.data().updatedAt?.toDate?.()?.toISOString() || docSnap.data().updatedAt,
    } as AdminProfile
  } catch (error) {
    console.error('Error fetching admin profile:', error)
    throw error
  }
}

// 管理者プロフィールの更新
export async function updateAdminProfile(adminId: string, updates: Partial<AdminProfile>): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.ADMIN_PROFILES, adminId)
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now()
    })
    
    console.log('Admin profile updated:', adminId)
  } catch (error) {
    console.error('Error updating admin profile:', error)
    throw error
  }
}

// サンプル設定データの作成
