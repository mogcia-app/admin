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
export async function seedSettingsData(): Promise<void> {
  try {
    const sampleSettings: Omit<SystemSettings, 'id' | 'updatedAt'>[] = [
      // 一般設定
      {
        category: 'general',
        key: 'app_name',
        value: 'Signal Admin Panel',
        description: 'アプリケーション名',
        type: 'string',
        isEditable: true,
        updatedBy: 'system'
      },
      {
        category: 'general',
        key: 'app_version',
        value: '1.0.0',
        description: 'アプリケーションバージョン',
        type: 'string',
        isEditable: false,
        updatedBy: 'system'
      },
      {
        category: 'general',
        key: 'maintenance_mode',
        value: false,
        description: 'メンテナンスモード',
        type: 'boolean',
        isEditable: true,
        updatedBy: 'system'
      },
      {
        category: 'general',
        key: 'max_users',
        value: 10000,
        description: '最大ユーザー数',
        type: 'number',
        isEditable: true,
        updatedBy: 'system'
      },
      
      // セキュリティ設定
      {
        category: 'security',
        key: 'session_timeout',
        value: 3600,
        description: 'セッションタイムアウト（秒）',
        type: 'number',
        isEditable: true,
        updatedBy: 'system'
      },
      {
        category: 'security',
        key: 'password_min_length',
        value: 8,
        description: 'パスワード最小文字数',
        type: 'number',
        isEditable: true,
        updatedBy: 'system'
      },
      {
        category: 'security',
        key: 'enable_2fa',
        value: false,
        description: '二要素認証を有効化',
        type: 'boolean',
        isEditable: true,
        updatedBy: 'system'
      },
      {
        category: 'security',
        key: 'allowed_domains',
        value: '["example.com", "signal-app.com"]',
        description: '許可ドメイン（JSON形式）',
        type: 'json',
        isEditable: true,
        updatedBy: 'system'
      },
      
      // 通知設定
      {
        category: 'notification',
        key: 'email_notifications',
        value: true,
        description: 'メール通知を有効化',
        type: 'boolean',
        isEditable: true,
        updatedBy: 'system'
      },
      {
        category: 'notification',
        key: 'notification_frequency',
        value: 'daily',
        description: '通知頻度',
        type: 'select',
        options: ['immediate', 'hourly', 'daily', 'weekly'],
        isEditable: true,
        updatedBy: 'system'
      },
      {
        category: 'notification',
        key: 'slack_webhook_url',
        value: '',
        description: 'Slack Webhook URL',
        type: 'string',
        isEditable: true,
        updatedBy: 'system'
      },
      
      // 統合設定
      {
        category: 'integration',
        key: 'openai_api_key',
        value: '',
        description: 'OpenAI API キー',
        type: 'string',
        isEditable: true,
        updatedBy: 'system'
      },
      {
        category: 'integration',
        key: 'google_analytics_id',
        value: '',
        description: 'Google Analytics ID',
        type: 'string',
        isEditable: true,
        updatedBy: 'system'
      },
      {
        category: 'integration',
        key: 'stripe_public_key',
        value: '',
        description: 'Stripe公開キー',
        type: 'string',
        isEditable: true,
        updatedBy: 'system'
      },
      
      // バックアップ設定
      {
        category: 'backup',
        key: 'auto_backup',
        value: true,
        description: '自動バックアップ',
        type: 'boolean',
        isEditable: true,
        updatedBy: 'system'
      },
      {
        category: 'backup',
        key: 'backup_frequency',
        value: 'daily',
        description: 'バックアップ頻度',
        type: 'select',
        options: ['hourly', 'daily', 'weekly', 'monthly'],
        isEditable: true,
        updatedBy: 'system'
      },
      {
        category: 'backup',
        key: 'backup_retention_days',
        value: 30,
        description: 'バックアップ保持日数',
        type: 'number',
        isEditable: true,
        updatedBy: 'system'
      }
    ]

    const sampleProfiles: Omit<AdminProfile, 'id' | 'lastLogin' | 'createdAt' | 'updatedAt'>[] = [
      {
        name: '石田真梨奈',
        email: 'admin@example.com',
        role: 'super_admin',
        preferences: {
          theme: 'light',
          language: 'ja',
          timezone: 'Asia/Tokyo',
          notifications: {
            email: true,
            browser: true,
            slack: false
          }
        }
      },
      {
        name: '堂本寛人',
        email: 'admin2@example.com',
        role: 'admin',
        preferences: {
          theme: 'dark',
          language: 'ja',
          timezone: 'Asia/Tokyo',
          notifications: {
            email: true,
            browser: false,
            slack: true
          }
        }
      },
      {
        name: 'システム管理者',
        email: 'admin3@example.com',
        role: 'moderator',
        preferences: {
          theme: 'system',
          language: 'ja',
          timezone: 'Asia/Tokyo',
          notifications: {
            email: false,
            browser: true,
            slack: false
          }
        }
      }
    ]

    // 並列でデータを作成
    const promises = [
      ...sampleSettings.map(setting => 
        addDoc(collection(db, COLLECTIONS.SYSTEM_SETTINGS), {
          ...setting,
          updatedAt: Timestamp.now()
        })
      ),
      ...sampleProfiles.map((profile, index) => 
        addDoc(collection(db, COLLECTIONS.ADMIN_PROFILES), {
          ...profile,
          lastLogin: Timestamp.now(),
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        })
      )
    ]

    await Promise.all(promises)

    console.log('✅ Sample settings data seeded successfully!')
  } catch (error) {
    console.error('❌ Error seeding settings data:', error)
    throw error
  }
}
