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
  KPIMetric, 
  RevenueData, 
  UserAcquisitionData, 
  EngagementMetrics, 
  RetentionMetrics,
  ConversionFunnel,
  KPIDashboardData
} from '@/types'

// コレクション名
const COLLECTIONS = {
  KPI_METRICS: 'kpiMetrics',
  REVENUE_DATA: 'revenueData',
  USER_ACQUISITION: 'userAcquisition',
  ENGAGEMENT: 'engagementMetrics',
  RETENTION: 'retentionMetrics',
  CONVERSION_FUNNELS: 'conversionFunnels'
}

// KPIメトリクスの取得
export async function getKPIMetrics(): Promise<KPIMetric[]> {
  try {
    // 複合インデックスエラーを避けるため、シンプルなクエリに変更
    const q = query(
      collection(db, COLLECTIONS.KPI_METRICS), 
      where('isActive', '==', true)
    )
    const querySnapshot = await getDocs(q)
    
    // クライアントサイドでソート
    const metrics = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt,
    })) as KPIMetric[]
    
    // カテゴリと名前でソート
    return metrics.sort((a, b) => {
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category)
      }
      return a.name.localeCompare(b.name)
    })
  } catch (error) {
    console.error('Error fetching KPI metrics:', error)
    throw error
  }
}

// 売上データの取得
export async function getRevenueData(startDate?: string, endDate?: string): Promise<RevenueData[]> {
  try {
    let q = query(
      collection(db, COLLECTIONS.REVENUE_DATA),
      orderBy('date', 'desc'),
      limit(100)
    )

    if (startDate && endDate) {
      q = query(
        collection(db, COLLECTIONS.REVENUE_DATA),
        where('date', '>=', startDate),
        where('date', '<=', endDate),
        orderBy('date', 'desc')
      )
    }

    const querySnapshot = await getDocs(q)
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
    })) as RevenueData[]
  } catch (error) {
    console.error('Error fetching revenue data:', error)
    throw error
  }
}

// ユーザー獲得データの取得
export async function getUserAcquisitionData(startDate?: string, endDate?: string): Promise<UserAcquisitionData[]> {
  try {
    let q = query(
      collection(db, COLLECTIONS.USER_ACQUISITION),
      orderBy('date', 'desc'),
      limit(100)
    )

    if (startDate && endDate) {
      q = query(
        collection(db, COLLECTIONS.USER_ACQUISITION),
        where('date', '>=', startDate),
        where('date', '<=', endDate),
        orderBy('date', 'desc')
      )
    }

    const querySnapshot = await getDocs(q)
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
    })) as UserAcquisitionData[]
  } catch (error) {
    console.error('Error fetching user acquisition data:', error)
    throw error
  }
}

// エンゲージメントメトリクスの取得
export async function getEngagementMetrics(startDate?: string, endDate?: string): Promise<EngagementMetrics[]> {
  try {
    let q = query(
      collection(db, COLLECTIONS.ENGAGEMENT),
      orderBy('date', 'desc'),
      limit(1000)
    )

    if (startDate && endDate) {
      q = query(
        collection(db, COLLECTIONS.ENGAGEMENT),
        where('date', '>=', startDate),
        where('date', '<=', endDate),
        orderBy('date', 'desc')
      )
    }

    const querySnapshot = await getDocs(q)
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
    })) as EngagementMetrics[]
  } catch (error) {
    console.error('Error fetching engagement metrics:', error)
    throw error
  }
}

// リテンションメトリクスの取得
export async function getRetentionMetrics(): Promise<RetentionMetrics[]> {
  try {
    // 複合インデックスエラーを避けるため、シンプルなクエリに変更
    const q = query(
      collection(db, COLLECTIONS.RETENTION),
      orderBy('cohort', 'desc')
    )
    const querySnapshot = await getDocs(q)
    
    // クライアントサイドでソート
    const metrics = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
    })) as RetentionMetrics[]
    
    // cohortとperiodでソート
    return metrics.sort((a, b) => {
      if (a.cohort !== b.cohort) {
        return b.cohort.localeCompare(a.cohort) // 降順
      }
      return a.period - b.period // 昇順
    })
  } catch (error) {
    console.error('Error fetching retention metrics:', error)
    throw error
  }
}

// コンバージョンファネルの取得
export async function getConversionFunnels(): Promise<ConversionFunnel[]> {
  try {
    const q = query(
      collection(db, COLLECTIONS.CONVERSION_FUNNELS),
      orderBy('updatedAt', 'desc')
    )
    const querySnapshot = await getDocs(q)
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt,
    })) as ConversionFunnel[]
  } catch (error) {
    console.error('Error fetching conversion funnels:', error)
    throw error
  }
}

// KPIダッシュボードデータの統合取得
export async function getKPIDashboardData(): Promise<KPIDashboardData> {
  try {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0]
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0]

    // 並列でデータを取得
    const [
      revenueData,
      lastMonthRevenueData,
      userAcquisitionData,
      engagementData,
      retentionData,
      funnelData,
      kpiMetrics
    ] = await Promise.all([
      getRevenueData(startOfMonth, endOfMonth),
      getRevenueData(startOfLastMonth, endOfLastMonth),
      getUserAcquisitionData(startOfMonth, endOfMonth),
      getEngagementMetrics(startOfMonth, endOfMonth),
      getRetentionMetrics(),
      getConversionFunnels(),
      getKPIMetrics()
    ])

    // 売上関連の計算
    const totalRevenue = revenueData.reduce((sum, item) => sum + item.amount, 0)
    const lastMonthRevenue = lastMonthRevenueData.reduce((sum, item) => sum + item.amount, 0)
    const revenueGrowth = lastMonthRevenue > 0 ? ((totalRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0

    const monthlyRecurringRevenue = revenueData
      .filter(item => item.source === 'subscription')
      .reduce((sum, item) => sum + item.amount, 0)

    const revenueBySource = revenueData.reduce((acc, item) => {
      acc[item.source] = (acc[item.source] || 0) + item.amount
      return acc
    }, {} as Record<string, number>)

    const revenueByPlan = revenueData.reduce((acc, item) => {
      acc[item.plan] = (acc[item.plan] || 0) + item.amount
      return acc
    }, {} as Record<string, number>)

    // ユーザー関連の計算
    const totalNewUsers = userAcquisitionData.reduce((sum, item) => sum + item.newUsers, 0)
    const acquisitionBySource = userAcquisitionData.reduce((acc, item) => {
      acc[item.source] = (acc[item.source] || 0) + item.newUsers
      return acc
    }, {} as Record<string, number>)

    // エンゲージメント関連の計算
    const totalActiveUsers = new Set(engagementData.map(item => item.userId)).size
    const averageSessionDuration = engagementData.length > 0 
      ? engagementData.reduce((sum, item) => sum + item.averageSessionDuration, 0) / engagementData.length 
      : 0

    // 仮の値（実際のユーザーデータと連携が必要）
    const totalUsers = 1000 // 実際はuserProfilesから取得
    const averageRevenuePerUser = totalUsers > 0 ? totalRevenue / totalUsers : 0
    const customerLifetimeValue = averageRevenuePerUser * 12 // 仮の計算
    const churnRate = 5.2 // 仮の値

    // コンバージョン関連
    const trialToPayingConversion = 25.5 // 仮の値
    const signupToTrialConversion = 68.3 // 仮の値

    return {
      overview: {
        totalRevenue,
        monthlyRecurringRevenue,
        averageRevenuePerUser,
        customerLifetimeValue,
        totalUsers,
        activeUsers: totalActiveUsers,
        newUsersThisMonth: totalNewUsers,
        churnRate
      },
      revenueMetrics: {
        monthlyRevenue: revenueData,
        revenueBySource,
        revenueByPlan,
        revenueGrowth
      },
      userMetrics: {
        userGrowth: userAcquisitionData,
        acquisitionBySource,
        userRetention: retentionData,
        engagementMetrics: engagementData
      },
      conversionMetrics: {
        trialToPayingConversion,
        signupToTrialConversion,
        funnels: funnelData
      },
      kpiTargets: kpiMetrics
    }
  } catch (error) {
    console.error('Error fetching KPI dashboard data:', error)
    throw error
  }
}

// KPIメトリクスの作成
export async function createKPIMetric(metricData: Omit<KPIMetric, 'id' | 'updatedAt'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.KPI_METRICS), {
      ...metricData,
      updatedAt: Timestamp.now()
    })
    
    console.log('KPI metric created with ID:', docRef.id)
    return docRef.id
  } catch (error) {
    console.error('Error creating KPI metric:', error)
    throw error
  }
}

// 売上データの追加
export async function addRevenueData(revenueData: Omit<RevenueData, 'id' | 'createdAt'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.REVENUE_DATA), {
      ...revenueData,
      createdAt: Timestamp.now()
    })
    
    console.log('Revenue data added with ID:', docRef.id)
    return docRef.id
  } catch (error) {
    console.error('Error adding revenue data:', error)
    throw error
  }
}

// ユーザー獲得データの追加
export async function addUserAcquisitionData(acquisitionData: Omit<UserAcquisitionData, 'id' | 'createdAt'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.USER_ACQUISITION), {
      ...acquisitionData,
      createdAt: Timestamp.now()
    })
    
    console.log('User acquisition data added with ID:', docRef.id)
    return docRef.id
  } catch (error) {
    console.error('Error adding user acquisition data:', error)
    throw error
  }
}

// サンプルKPIデータの作成
export async function seedKPIData(): Promise<void> {
  try {
    // KPIメトリクスのサンプルデータ
    const sampleKPIMetrics: Omit<KPIMetric, 'id' | 'updatedAt'>[] = [
      {
        name: '月間売上',
        description: '当月の総売上金額',
        category: 'revenue',
        value: 2850000,
        target: 3000000,
        unit: 'JPY',
        trend: 'up',
        changePercent: 15.2,
        period: 'monthly',
        isActive: true
      },
      {
        name: '新規ユーザー獲得',
        description: '当月の新規ユーザー数',
        category: 'users',
        value: 156,
        target: 200,
        unit: 'users',
        trend: 'up',
        changePercent: 23.8,
        period: 'monthly',
        isActive: true
      },
      {
        name: 'MRR',
        description: '月間経常収益',
        category: 'revenue',
        value: 2650000,
        target: 2800000,
        unit: 'JPY',
        trend: 'up',
        changePercent: 18.5,
        period: 'monthly',
        isActive: true
      },
      {
        name: 'チャーンレート',
        description: '月間解約率',
        category: 'retention',
        value: 3.2,
        target: 5.0,
        unit: '%',
        trend: 'down',
        changePercent: -12.5,
        period: 'monthly',
        isActive: true
      }
    ]

    // 売上データのサンプル
    const sampleRevenueData: Omit<RevenueData, 'id' | 'createdAt'>[] = [
      {
        date: '2024-01-01',
        amount: 29800,
        source: 'subscription',
        userId: 'user_001',
        plan: 'professional',
        currency: 'JPY'
      },
      {
        date: '2024-01-02',
        amount: 98000,
        source: 'subscription',
        userId: 'user_002',
        plan: 'enterprise',
        currency: 'JPY'
      },
      {
        date: '2024-01-03',
        amount: 9800,
        source: 'subscription',
        userId: 'user_003',
        plan: 'basic',
        currency: 'JPY'
      }
    ]

    // ユーザー獲得データのサンプル
    const sampleUserAcquisition: Omit<UserAcquisitionData, 'id' | 'createdAt'>[] = [
      {
        date: '2024-01-01',
        newUsers: 12,
        source: 'organic',
        conversionRate: 2.5,
        cost: 0
      },
      {
        date: '2024-01-02',
        newUsers: 8,
        source: 'paid',
        campaign: 'Google Ads - Beauty',
        conversionRate: 4.2,
        cost: 15000
      },
      {
        date: '2024-01-03',
        newUsers: 15,
        source: 'referral',
        conversionRate: 8.1,
        cost: 0
      }
    ]

    // データを並列で作成
    const promises = [
      ...sampleKPIMetrics.map(metric => createKPIMetric(metric)),
      ...sampleRevenueData.map(revenue => addRevenueData(revenue)),
      ...sampleUserAcquisition.map(acquisition => addUserAcquisitionData(acquisition))
    ]

    await Promise.all(promises)

    console.log('✅ Sample KPI data seeded successfully!')
  } catch (error) {
    console.error('❌ Error seeding KPI data:', error)
    throw error
  }
}
