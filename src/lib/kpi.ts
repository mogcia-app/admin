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

// ユーザーデータからKPIを計算する関数
async function calculateKPIsFromUsers(): Promise<{
  totalUsers: number
  activeUsers: number
  newUsersThisMonth: number
  churnRate: number
  totalRevenue: number
  monthlyRecurringRevenue: number
  averageRevenuePerUser: number
  customerLifetimeValue: number
  revenueBySource: Record<string, number>
  revenueByPlan: Record<string, number>
  revenueGrowth: number
  trialToPayingConversion: number
  signupToTrialConversion: number
}> {
  try {
    // ユーザーデータを取得
    const usersSnapshot = await getDocs(collection(db, 'users'))
    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      lastLoginAt: doc.data().lastLoginAt?.toDate?.() || null,
      subscriptionStatus: doc.data().subscriptionStatus || 'free',
      plan: doc.data().plan || 'free',
      revenue: doc.data().revenue || 0
    }))

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

    // 基本統計
    const totalUsers = users.length
    const activeUsers = users.filter(user => 
      user.lastLoginAt && user.lastLoginAt >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    ).length
    const newUsersThisMonth = users.filter(user => 
      user.createdAt >= startOfMonth && user.createdAt <= endOfMonth
    ).length

    // チャーン率の計算（過去30日でアクティブでないユーザー）
    const churnedUsers = users.filter(user => 
      user.lastLoginAt && user.lastLoginAt < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    ).length
    const churnRate = totalUsers > 0 ? (churnedUsers / totalUsers) * 100 : 0

    // 売上関連の計算
    const totalRevenue = users.reduce((sum, user) => sum + (user.revenue || 0), 0)
    const monthlyRecurringRevenue = users
      .filter(user => user.subscriptionStatus === 'active')
      .reduce((sum, user) => sum + (user.revenue || 0), 0)
    const averageRevenuePerUser = totalUsers > 0 ? totalRevenue / totalUsers : 0
    const customerLifetimeValue = averageRevenuePerUser * 12

    // 売上ソース別・プラン別の計算
    const revenueBySource = users.reduce((acc, user) => {
      const source = user.subscriptionStatus === 'active' ? 'subscription' : 'one-time'
      acc[source] = (acc[source] || 0) + (user.revenue || 0)
      return acc
    }, {} as Record<string, number>)

    const revenueByPlan = users.reduce((acc, user) => {
      const plan = user.plan || 'free'
      acc[plan] = (acc[plan] || 0) + (user.revenue || 0)
      return acc
    }, {} as Record<string, number>)

    // 前月との比較（簡易版）
    const lastMonthUsers = users.filter(user => 
      user.createdAt >= startOfLastMonth && user.createdAt <= endOfLastMonth
    )
    const lastMonthRevenue = lastMonthUsers.reduce((sum, user) => sum + (user.revenue || 0), 0)
    const revenueGrowth = lastMonthRevenue > 0 ? ((totalRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0

    // コンバージョン率の計算
    const trialUsers = users.filter(user => user.subscriptionStatus === 'trial').length
    const payingUsers = users.filter(user => user.subscriptionStatus === 'active').length
    const signupUsers = users.filter(user => user.createdAt >= startOfMonth).length

    const trialToPayingConversion = trialUsers > 0 ? (payingUsers / trialUsers) * 100 : 0
    const signupToTrialConversion = signupUsers > 0 ? (trialUsers / signupUsers) * 100 : 0

    return {
      totalUsers,
      activeUsers,
      newUsersThisMonth,
      churnRate,
      totalRevenue,
      monthlyRecurringRevenue,
      averageRevenuePerUser,
      customerLifetimeValue,
      revenueBySource,
      revenueByPlan,
      revenueGrowth,
      trialToPayingConversion,
      signupToTrialConversion
    }
  } catch (error) {
    console.error('Error calculating KPIs from users:', error)
    throw error
  }
}

// KPIダッシュボードデータの統合取得
export async function getKPIDashboardData(): Promise<KPIDashboardData> {
  try {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

    // ユーザーデータからKPIを計算
    const kpiData = await calculateKPIsFromUsers()

    // 月次データの生成（ユーザーデータから）
    const monthlyRevenue = generateMonthlyRevenueData(kpiData.totalRevenue, startOfMonth, endOfMonth)
    const userGrowth = generateUserGrowthData(kpiData.newUsersThisMonth, startOfMonth, endOfMonth)

    return {
      overview: {
        totalRevenue: kpiData.totalRevenue,
        monthlyRecurringRevenue: kpiData.monthlyRecurringRevenue,
        averageRevenuePerUser: kpiData.averageRevenuePerUser,
        customerLifetimeValue: kpiData.customerLifetimeValue,
        totalUsers: kpiData.totalUsers,
        activeUsers: kpiData.activeUsers,
        newUsersThisMonth: kpiData.newUsersThisMonth,
        churnRate: kpiData.churnRate
      },
      revenueMetrics: {
        monthlyRevenue,
        revenueBySource: kpiData.revenueBySource,
        revenueByPlan: kpiData.revenueByPlan,
        revenueGrowth: kpiData.revenueGrowth
      },
      userMetrics: {
        userGrowth: userGrowth,
        acquisitionBySource: { 'organic': kpiData.newUsersThisMonth },
        userRetention: [],
        engagementMetrics: []
      },
      conversionMetrics: {
        trialToPayingConversion: kpiData.trialToPayingConversion,
        signupToTrialConversion: kpiData.signupToTrialConversion,
        funnels: []
      },
      kpiTargets: []
    }
  } catch (error) {
    console.error('Error fetching KPI dashboard data:', error)
    throw error
  }
}

// 月次売上データの生成（ユーザーデータから）
function generateMonthlyRevenueData(totalRevenue: number, startDate: string, endDate: string): RevenueData[] {
  const data: RevenueData[] = []
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0]
    const dailyRevenue = totalRevenue / 30 // 簡易的な日割り計算
    
    data.push({
      id: `revenue-${dateStr}`,
      date: dateStr,
      amount: Math.round(dailyRevenue),
      source: 'subscription',
      plan: 'pro',
      createdAt: new Date().toISOString()
    })
  }
  
  return data
}

// ユーザー成長データの生成
function generateUserGrowthData(totalNewUsers: number, startDate: string, endDate: string): UserAcquisitionData[] {
  const data: UserAcquisitionData[] = []
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0]
    const dailyUsers = Math.round(totalNewUsers / 30) // 簡易的な日割り計算
    
    data.push({
      id: `acquisition-${dateStr}`,
      date: dateStr,
      newUsers: dailyUsers,
      source: 'organic',
      createdAt: new Date().toISOString()
    })
  }
  
  return data
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
