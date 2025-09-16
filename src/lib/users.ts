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
  startAfter,
  QueryDocumentSnapshot
} from 'firebase/firestore'
import { db } from './firebase'
import { UserProfile, UserStats, SNSAISettings, BusinessInfo, BillingInfo } from '@/types'

const COLLECTION_NAME = 'userProfiles'

// 利用者一覧を取得
export async function getUserProfiles(limitCount = 50): Promise<UserProfile[]> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME), 
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    )
    const querySnapshot = await getDocs(q)
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt,
      lastLoginAt: doc.data().lastLoginAt?.toDate?.()?.toISOString() || doc.data().lastLoginAt,
    })) as UserProfile[]
  } catch (error) {
    console.error('Error fetching user profiles:', error)
    throw error
  }
}

// 特定の利用者を取得
export async function getUserProfile(id: string): Promise<UserProfile | null> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id)
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      const data = docSnap.data()
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
        lastLoginAt: data.lastLoginAt?.toDate?.()?.toISOString() || data.lastLoginAt,
      } as UserProfile
    }
    
    return null
  } catch (error) {
    console.error('Error fetching user profile:', error)
    throw error
  }
}

// 利用者を作成
export async function createUserProfile(userData: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    const now = Timestamp.now()
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...userData,
      createdAt: now,
      updatedAt: now,
      lastLoginAt: userData.lastLoginAt ? Timestamp.fromDate(new Date(userData.lastLoginAt)) : null
    })
    
    console.log('User profile created with ID:', docRef.id)
    return docRef.id
  } catch (error) {
    console.error('Error creating user profile:', error)
    throw error
  }
}

// 利用者情報を更新
export async function updateUserProfile(id: string, updates: Partial<UserProfile>): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id)
    const { id: _, createdAt, ...updateData } = updates
    
    // 日付フィールドの変換
    const processedData = {
      ...updateData,
      updatedAt: Timestamp.now(),
      ...(updateData.lastLoginAt && {
        lastLoginAt: Timestamp.fromDate(new Date(updateData.lastLoginAt))
      })
    }
    
    await updateDoc(docRef, processedData)
    console.log('User profile updated:', id)
  } catch (error) {
    console.error('Error updating user profile:', error)
    throw error
  }
}

// 利用者を削除
export async function deleteUserProfile(id: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id)
    await deleteDoc(docRef)
    console.log('User profile deleted:', id)
  } catch (error) {
    console.error('Error deleting user profile:', error)
    throw error
  }
}

// 契約タイプ別利用者を取得
export async function getUsersByContractType(contractType: 'annual' | 'trial'): Promise<UserProfile[]> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME), 
      where('contractType', '==', contractType),
      orderBy('createdAt', 'desc')
    )
    const querySnapshot = await getDocs(q)
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt,
      lastLoginAt: doc.data().lastLoginAt?.toDate?.()?.toISOString() || doc.data().lastLoginAt,
    })) as UserProfile[]
  } catch (error) {
    console.error('Error fetching users by contract type:', error)
    throw error
  }
}

// アクティブな利用者のみ取得
export async function getActiveUsers(): Promise<UserProfile[]> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME), 
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc')
    )
    const querySnapshot = await getDocs(q)
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt,
      lastLoginAt: doc.data().lastLoginAt?.toDate?.()?.toISOString() || doc.data().lastLoginAt,
    })) as UserProfile[]
  } catch (error) {
    console.error('Error fetching active users:', error)
    throw error
  }
}

// 利用者統計を取得
export async function getUserStats(): Promise<UserStats> {
  try {
    const users = await getUserProfiles(1000) // 大量データの場合は別途集計処理が必要
    
    const stats: UserStats = {
      totalUsers: users.length,
      activeUsers: users.filter(u => u.status === 'active').length,
      trialUsers: users.filter(u => u.contractType === 'trial').length,
      annualUsers: users.filter(u => u.contractType === 'annual').length,
      teamUsers: users.filter(u => u.usageType === 'team').length,
      soloUsers: users.filter(u => u.usageType === 'solo').length,
      snsBreakdown: {},
      industryBreakdown: {},
      monthlyRevenue: 0,
      churnRate: 0,
      averageContractValue: 0
    }

    // SNS別統計
    users.forEach(user => {
      user.contractSNS.forEach(sns => {
        stats.snsBreakdown[sns] = (stats.snsBreakdown[sns] || 0) + 1
      })
    })

    // 業界別統計
    users.forEach(user => {
      const industry = user.businessInfo.industry
      stats.industryBreakdown[industry] = (stats.industryBreakdown[industry] || 0) + 1
    })

    // 売上統計（アクティブユーザーのみ）
    const activeUsers = users.filter(u => u.status === 'active' && u.billingInfo)
    stats.monthlyRevenue = activeUsers.reduce((sum, user) => {
      return sum + (user.billingInfo?.monthlyFee || 0)
    }, 0)

    // 平均契約価値
    if (activeUsers.length > 0) {
      stats.averageContractValue = stats.monthlyRevenue / activeUsers.length
    }

    return stats
  } catch (error) {
    console.error('Error calculating user stats:', error)
    throw error
  }
}

// リアルタイム利用者監視
export function subscribeToUserProfiles(callback: (users: UserProfile[]) => void) {
  const q = query(
    collection(db, COLLECTION_NAME), 
    orderBy('createdAt', 'desc'),
    limit(100)
  )
  
  return onSnapshot(q, (querySnapshot) => {
    const users = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt,
      lastLoginAt: doc.data().lastLoginAt?.toDate?.()?.toISOString() || doc.data().lastLoginAt,
    })) as UserProfile[]
    
    callback(users)
  }, (error) => {
    console.error('Error in user profiles subscription:', error)
  })
}

// 利用者検索
export async function searchUserProfiles(searchTerm: string): Promise<UserProfile[]> {
  try {
    // Firestore の制限により、クライアントサイドでフィルタリング
    const users = await getUserProfiles(1000)
    
    return users.filter(user => 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.businessInfo.industry.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.businessInfo.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
  } catch (error) {
    console.error('Error searching user profiles:', error)
    throw error
  }
}

// 契約期限が近い利用者を取得
export async function getUsersNearExpiry(daysAhead = 30): Promise<UserProfile[]> {
  try {
    const users = await getActiveUsers()
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() + daysAhead)
    
    return users.filter(user => {
      const endDate = new Date(user.contractEndDate)
      return endDate <= cutoffDate
    })
  } catch (error) {
    console.error('Error fetching users near expiry:', error)
    throw error
  }
}

// サンプルユーザーデータを作成
export async function seedUserData(): Promise<void> {
  try {
    const sampleUsers: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        name: '田中太郎',
        email: 'tanaka@example.com',
        usageType: 'team',
        contractType: 'annual',
        contractSNS: ['instagram', 'x'],
        snsAISettings: {
          instagram: {
            enabled: true,
            tone: 'friendly',
            language: 'japanese',
            postFrequency: 'medium',
            targetAudience: '20-30代女性',
            brandVoice: '親しみやすく、信頼感のある',
            keywords: ['美容', 'ライフスタイル', 'おしゃれ'],
            autoPost: false,
            contentTypes: ['text', 'image']
          },
          x: {
            enabled: true,
            tone: 'professional',
            language: 'japanese',
            postFrequency: 'high',
            targetAudience: 'ビジネスパーソン',
            brandVoice: '専門的で信頼性の高い',
            keywords: ['マーケティング', 'SNS', 'デジタル'],
            autoPost: true,
            contentTypes: ['text']
          }
        },
        businessInfo: {
          industry: '美容・コスメ',
          companySize: 'small',
          businessType: 'b2c',
          description: '自然派化粧品の製造・販売',
          targetMarket: '20-40代の美容意識の高い女性',
          goals: ['ブランド認知度向上', 'オンライン売上増加'],
          challenges: ['SNS運用の人手不足', 'コンテンツ制作時間の確保'],
          currentSNSStrategy: 'インフルエンサーとのコラボレーション'
        },
        status: 'active',
        contractStartDate: '2024-01-01T00:00:00Z',
        contractEndDate: '2024-12-31T23:59:59Z',
        billingInfo: {
          plan: 'professional',
          monthlyFee: 29800,
          currency: 'JPY',
          paymentMethod: 'credit_card',
          nextBillingDate: '2024-02-01T00:00:00Z',
          paymentStatus: 'paid'
        },
        notes: 'VIPクライアント。手厚いサポートが必要。'
      },
      {
        name: '佐藤花子',
        email: 'sato@example.com',
        usageType: 'solo',
        contractType: 'trial',
        contractSNS: ['youtube', 'tiktok'],
        snsAISettings: {
          youtube: {
            enabled: true,
            tone: 'energetic',
            language: 'japanese',
            postFrequency: 'medium',
            targetAudience: '10-20代',
            brandVoice: 'エネルギッシュで親しみやすい',
            keywords: ['料理', 'レシピ', '簡単'],
            autoPost: false,
            contentTypes: ['video']
          },
          tiktok: {
            enabled: true,
            tone: 'casual',
            language: 'japanese',
            postFrequency: 'high',
            targetAudience: '10-20代',
            brandVoice: 'トレンディで親近感のある',
            keywords: ['時短料理', 'バズレシピ'],
            autoPost: false,
            contentTypes: ['video']
          }
        },
        businessInfo: {
          industry: '料理・グルメ',
          companySize: 'individual',
          businessType: 'b2c',
          description: '料理系インフルエンサー',
          targetMarket: '料理初心者・時短料理に興味がある人',
          goals: ['フォロワー増加', '料理本出版'],
          challenges: ['動画編集時間', 'ネタ切れ'],
          currentSNSStrategy: 'トレンドに合わせた料理動画投稿'
        },
        status: 'active',
        contractStartDate: '2024-01-15T00:00:00Z',
        contractEndDate: '2024-02-15T00:00:00Z',
        billingInfo: {
          plan: 'trial',
          monthlyFee: 0,
          currency: 'JPY',
          paymentMethod: 'credit_card',
          nextBillingDate: '2024-02-15T00:00:00Z',
          paymentStatus: 'paid'
        }
      },
      {
        name: '鈴木一郎',
        email: 'suzuki@example.com',
        usageType: 'team',
        contractType: 'annual',
        contractSNS: ['x', 'instagram', 'youtube'],
        snsAISettings: {
          x: {
            enabled: true,
            tone: 'professional',
            language: 'mixed',
            postFrequency: 'high',
            targetAudience: 'IT業界関係者',
            brandVoice: '技術的で信頼性の高い',
            keywords: ['AI', 'テクノロジー', 'DX'],
            autoPost: true,
            contentTypes: ['text']
          },
          instagram: {
            enabled: true,
            tone: 'professional',
            language: 'japanese',
            postFrequency: 'medium',
            targetAudience: 'ビジネスパーソン',
            brandVoice: '専門的でありながら親しみやすい',
            keywords: ['IT', 'ビジネス', '効率化'],
            autoPost: false,
            contentTypes: ['text', 'image']
          },
          youtube: {
            enabled: false,
            tone: 'professional',
            language: 'japanese',
            postFrequency: 'low',
            targetAudience: 'IT学習者',
            brandVoice: '教育的で分かりやすい',
            keywords: ['プログラミング', '学習', 'チュートリアル'],
            autoPost: false,
            contentTypes: ['video']
          }
        },
        businessInfo: {
          industry: 'IT・テクノロジー',
          companySize: 'medium',
          businessType: 'b2b',
          description: 'AIソリューション開発会社',
          targetMarket: '中小企業のDX推進担当者',
          goals: ['リード獲得', 'ブランド認知度向上'],
          challenges: ['技術内容の分かりやすい説明', '競合との差別化'],
          currentSNSStrategy: '技術情報の発信とケーススタディの紹介'
        },
        status: 'active',
        contractStartDate: '2023-10-01T00:00:00Z',
        contractEndDate: '2024-09-30T23:59:59Z',
        billingInfo: {
          plan: 'enterprise',
          monthlyFee: 98000,
          currency: 'JPY',
          paymentMethod: 'bank_transfer',
          nextBillingDate: '2024-02-01T00:00:00Z',
          paymentStatus: 'paid'
        },
        notes: '長期契約クライアント。カスタム機能要求あり。'
      }
    ]

    for (const userData of sampleUsers) {
      await createUserProfile(userData)
    }

    console.log('✅ Sample user data seeded successfully!')
  } catch (error) {
    console.error('❌ Error seeding user data:', error)
    throw error
  }
}
