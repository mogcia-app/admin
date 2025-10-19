import { 
  collection, 
  doc, 
  getDoc, 
  updateDoc, 
  Timestamp 
} from 'firebase/firestore'
import { db } from './firebase'
import { User } from '@/types'

// プロフィール情報の型定義
export interface AdminProfile {
  id: string
  name: string
  email: string
  role: 'admin' | 'super_admin' | 'moderator'
  avatar?: string
  phone?: string
  location?: string
  bio?: string
  department?: string
  createdAt: string
  lastLoginAt: string
  preferences: {
    language: string
    timezone: string
    theme: 'light' | 'dark' | 'system'
    notifications: {
      email: boolean
      browser: boolean
      slack: boolean
    }
  }
  security: {
    twoFactorEnabled: boolean
    lastPasswordChange: string
    loginAttempts: number
  }
}

// 現在のユーザーのプロフィールを取得
export async function getCurrentUserProfile(userId: string): Promise<AdminProfile | null> {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId))
    
    if (!userDoc.exists()) {
      return null
    }

    const userData = userDoc.data()
    
    return {
      id: userDoc.id,
      name: userData.name || '',
      email: userData.email || '',
      role: userData.role || 'admin',
      avatar: userData.avatar || '',
      phone: userData.phone || '',
      location: userData.location || '',
      bio: userData.bio || '',
      department: userData.department || '',
      createdAt: userData.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      lastLoginAt: userData.lastLoginAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      preferences: {
        language: userData.preferences?.language || 'ja',
        timezone: userData.preferences?.timezone || 'Asia/Tokyo',
        theme: userData.preferences?.theme || 'system',
        notifications: {
          email: userData.preferences?.notifications?.email ?? true,
          browser: userData.preferences?.notifications?.browser ?? true,
          slack: userData.preferences?.notifications?.slack ?? false
        }
      },
      security: {
        twoFactorEnabled: userData.security?.twoFactorEnabled ?? false,
        lastPasswordChange: userData.security?.lastPasswordChange?.toDate?.()?.toISOString() || new Date().toISOString(),
        loginAttempts: userData.security?.loginAttempts || 0
      }
    }
  } catch (error) {
    console.error('Error fetching user profile:', error)
    throw error
  }
}

// プロフィールを更新
export async function updateUserProfile(userId: string, updates: Partial<AdminProfile>): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId)
    
    // 更新データを準備
    const updateData: any = {
      updatedAt: Timestamp.now()
    }

    // 基本情報の更新
    if (updates.name !== undefined) updateData.name = updates.name
    if (updates.email !== undefined) updateData.email = updates.email
    if (updates.phone !== undefined) updateData.phone = updates.phone
    if (updates.location !== undefined) updateData.location = updates.location
    if (updates.bio !== undefined) updateData.bio = updates.bio
    if (updates.department !== undefined) updateData.department = updates.department
    if (updates.avatar !== undefined) updateData.avatar = updates.avatar

    // 設定の更新
    if (updates.preferences) {
      updateData.preferences = {
        ...updates.preferences,
        updatedAt: Timestamp.now()
      }
    }

    // セキュリティ設定の更新
    if (updates.security) {
      updateData.security = {
        ...updates.security,
        updatedAt: Timestamp.now()
      }
    }

    await updateDoc(userRef, updateData)
    console.log('User profile updated successfully')
  } catch (error) {
    console.error('Error updating user profile:', error)
    throw error
  }
}

// パスワード変更（実際の実装では認証システムと連携）
export async function changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
  try {
    // ここでは実際のパスワード変更ロジックを実装
    // Firebase Auth の updatePassword を使用する必要があります
    console.log('Password change requested for user:', userId)
    
    // セキュリティ情報を更新
    await updateDoc(doc(db, 'users', userId), {
      'security.lastPasswordChange': Timestamp.now(),
      'security.loginAttempts': 0,
      updatedAt: Timestamp.now()
    })
  } catch (error) {
    console.error('Error changing password:', error)
    throw error
  }
}

// 2段階認証の設定
export async function toggleTwoFactorAuth(userId: string, enabled: boolean): Promise<void> {
  try {
    await updateDoc(doc(db, 'users', userId), {
      'security.twoFactorEnabled': enabled,
      updatedAt: Timestamp.now()
    })
    console.log('Two-factor authentication toggled:', enabled)
  } catch (error) {
    console.error('Error toggling two-factor auth:', error)
    throw error
  }
}
