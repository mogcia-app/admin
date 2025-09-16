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
  limit
} from 'firebase/firestore'
import { db } from './firebase'
import { 
  ErrorLog, 
  SalesProgress, 
  Deal 
} from '@/types'

// コレクション名
const COLLECTIONS = {
  ERROR_LOGS: 'errorLogs',
  SALES_PROGRESS: 'salesProgress',
  DEALS: 'deals'
}

// エラーログの取得
export async function getErrorLogs(filters?: {
  level?: string
  source?: string
  resolved?: boolean
  limit?: number
}): Promise<ErrorLog[]> {
  try {
    let q = query(
      collection(db, COLLECTIONS.ERROR_LOGS),
      orderBy('timestamp', 'desc')
    )

    if (filters?.level) {
      q = query(q, where('level', '==', filters.level))
    }

    if (filters?.source) {
      q = query(q, where('source', '==', filters.source))
    }

    if (filters?.resolved !== undefined) {
      q = query(q, where('resolved', '==', filters.resolved))
    }

    if (filters?.limit) {
      q = query(q, limit(filters.limit))
    }

    const querySnapshot = await getDocs(q)
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || doc.data().timestamp,
    })) as ErrorLog[]
  } catch (error) {
    console.error('Error fetching error logs:', error)
    throw error
  }
}

// エラーログの作成
export async function createErrorLog(errorData: Omit<ErrorLog, 'id' | 'timestamp' | 'count'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.ERROR_LOGS), {
      ...errorData,
      timestamp: Timestamp.now(),
      count: 1,
      resolved: false
    })
    
    console.log('Error log created with ID:', docRef.id)
    return docRef.id
  } catch (error) {
    console.error('Error creating error log:', error)
    throw error
  }
}

// エラーログの更新
export async function updateErrorLog(id: string, updates: Partial<ErrorLog>): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.ERROR_LOGS, id)
    await updateDoc(docRef, updates)
    
    console.log('Error log updated:', id)
  } catch (error) {
    console.error('Error updating error log:', error)
    throw error
  }
}

// エラーの解決
export async function resolveError(id: string, assignedTo?: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.ERROR_LOGS, id)
    await updateDoc(docRef, {
      resolved: true,
      assignedTo: assignedTo || null,
      resolvedAt: Timestamp.now()
    })
    
    console.log('Error resolved:', id)
  } catch (error) {
    console.error('Error resolving error log:', error)
    throw error
  }
}

// 営業進捗の取得
export async function getSalesProgress(period?: string): Promise<SalesProgress[]> {
  try {
    let q = query(
      collection(db, COLLECTIONS.SALES_PROGRESS),
      orderBy('period', 'desc'),
      limit(12) // 過去12ヶ月
    )

    if (period) {
      q = query(
        collection(db, COLLECTIONS.SALES_PROGRESS),
        where('period', '==', period)
      )
    }

    const querySnapshot = await getDocs(q)
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt,
    })) as SalesProgress[]
  } catch (error) {
    console.error('Error fetching sales progress:', error)
    throw error
  }
}

// 営業進捗の作成
export async function createSalesProgress(progressData: Omit<SalesProgress, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.SALES_PROGRESS), {
      ...progressData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    })
    
    console.log('Sales progress created with ID:', docRef.id)
    return docRef.id
  } catch (error) {
    console.error('Error creating sales progress:', error)
    throw error
  }
}

// 営業進捗の更新
export async function updateSalesProgress(id: string, updates: Partial<SalesProgress>): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.SALES_PROGRESS, id)
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now()
    })
    
    console.log('Sales progress updated:', id)
  } catch (error) {
    console.error('Error updating sales progress:', error)
    throw error
  }
}

// 案件の取得
export async function getDeals(filters?: {
  stage?: string
  salesRep?: string
  limit?: number
}): Promise<Deal[]> {
  try {
    let q = query(
      collection(db, COLLECTIONS.DEALS),
      orderBy('expectedCloseDate', 'desc')
    )

    if (filters?.stage) {
      q = query(q, where('stage', '==', filters.stage))
    }

    if (filters?.salesRep) {
      q = query(q, where('salesRep', '==', filters.salesRep))
    }

    if (filters?.limit) {
      q = query(q, limit(filters.limit))
    }

    const querySnapshot = await getDocs(q)
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Deal[]
  } catch (error) {
    console.error('Error fetching deals:', error)
    throw error
  }
}

// 案件の作成
export async function createDeal(dealData: Omit<Deal, 'id'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.DEALS), dealData)
    
    console.log('Deal created with ID:', docRef.id)
    return docRef.id
  } catch (error) {
    console.error('Error creating deal:', error)
    throw error
  }
}

// 案件の更新
export async function updateDeal(id: string, updates: Partial<Deal>): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.DEALS, id)
    await updateDoc(docRef, updates)
    
    console.log('Deal updated:', id)
  } catch (error) {
    console.error('Error updating deal:', error)
    throw error
  }
}

// エラー統計の取得
export async function getErrorStats(): Promise<{
  totalErrors: number
  unresolvedErrors: number
  criticalErrors: number
  errorsByLevel: Record<string, number>
  errorsBySource: Record<string, number>
  recentErrors: ErrorLog[]
}> {
  try {
    const errors = await getErrorLogs({ limit: 1000 })
    
    const totalErrors = errors.length
    const unresolvedErrors = errors.filter(e => !e.resolved).length
    const criticalErrors = errors.filter(e => e.level === 'fatal' || e.level === 'error').length
    
    const errorsByLevel = errors.reduce((acc, error) => {
      acc[error.level] = (acc[error.level] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const errorsBySource = errors.reduce((acc, error) => {
      acc[error.source] = (acc[error.source] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const recentErrors = errors.slice(0, 10)
    
    return {
      totalErrors,
      unresolvedErrors,
      criticalErrors,
      errorsByLevel,
      errorsBySource,
      recentErrors
    }
  } catch (error) {
    console.error('Error fetching error stats:', error)
    throw error
  }
}

// 営業統計の取得
export async function getSalesStats(): Promise<{
  totalDeals: number
  closedDeals: number
  totalRevenue: number
  averageDealSize: number
  conversionRate: number
  dealsByStage: Record<string, number>
  monthlyProgress: SalesProgress[]
}> {
  try {
    const [deals, progress] = await Promise.all([
      getDeals({ limit: 1000 }),
      getSalesProgress()
    ])
    
    const totalDeals = deals.length
    const closedDeals = deals.filter(d => d.stage === 'closed_won').length
    const totalRevenue = deals
      .filter(d => d.stage === 'closed_won')
      .reduce((sum, deal) => sum + deal.amount, 0)
    
    const averageDealSize = closedDeals > 0 ? totalRevenue / closedDeals : 0
    const conversionRate = totalDeals > 0 ? (closedDeals / totalDeals) * 100 : 0
    
    const dealsByStage = deals.reduce((acc, deal) => {
      acc[deal.stage] = (acc[deal.stage] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    return {
      totalDeals,
      closedDeals,
      totalRevenue,
      averageDealSize,
      conversionRate,
      dealsByStage,
      monthlyProgress: progress
    }
  } catch (error) {
    console.error('Error fetching sales stats:', error)
    throw error
  }
}

// サンプル監視データの作成
export async function seedMonitoringData(): Promise<void> {
  try {
    const sampleErrorLogs: Omit<ErrorLog, 'id' | 'timestamp' | 'count'>[] = [
      {
        message: 'Database connection timeout',
        stack: 'Error: Database connection timeout\n    at DatabaseManager.connect\n    at async UserService.getUser',
        level: 'error',
        source: 'database',
        userId: 'user_123',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        url: '/api/users/profile',
        resolved: false,
        tags: ['database', 'timeout', 'connection']
      },
      {
        message: 'API rate limit exceeded',
        level: 'warn',
        source: 'api',
        url: '/api/ai/generate',
        resolved: true,
        assignedTo: 'admin_001',
        tags: ['rate-limit', 'api']
      },
      {
        message: 'Payment processing failed',
        level: 'error',
        source: 'server',
        userId: 'user_456',
        url: '/api/payments/process',
        resolved: false,
        tags: ['payment', 'stripe', 'processing']
      },
      {
        message: 'Memory usage high',
        level: 'warn',
        source: 'server',
        resolved: true,
        tags: ['memory', 'performance']
      },
      {
        message: 'Authentication token expired',
        level: 'info',
        source: 'client',
        userId: 'user_789',
        resolved: true,
        tags: ['auth', 'token', 'expired']
      }
    ]

    const sampleSalesProgress: Omit<SalesProgress, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        period: '2024-01',
        target: 3000000,
        achieved: 2850000,
        salesRep: '石田真梨奈',
        deals: [
          {
            id: 'deal_001',
            customerName: '株式会社テックソリューション',
            amount: 980000,
            stage: 'closed_won',
            probability: 100,
            expectedCloseDate: '2024-01-15',
            actualCloseDate: '2024-01-12',
            source: 'inbound',
            notes: 'エンタープライズプランで契約成立'
          },
          {
            id: 'deal_002',
            customerName: 'デジタルマーケティング合同会社',
            amount: 490000,
            stage: 'closed_won',
            probability: 100,
            expectedCloseDate: '2024-01-25',
            actualCloseDate: '2024-01-23',
            source: 'referral',
            notes: 'プロフェッショナルプランで契約'
          }
        ],
        notes: '目標の95%を達成。新規顧客開拓が好調'
      },
      {
        period: '2024-02',
        target: 3200000,
        achieved: 3450000,
        salesRep: '堂本寛人',
        deals: [
          {
            id: 'deal_003',
            customerName: 'スタートアップ株式会社',
            amount: 1200000,
            stage: 'closed_won',
            probability: 100,
            expectedCloseDate: '2024-02-10',
            actualCloseDate: '2024-02-08',
            source: 'paid_ads',
            notes: 'カスタムプランでの大型契約'
          }
        ],
        notes: '目標を大幅に上回る成果。大型案件の獲得に成功'
      }
    ]

    const sampleDeals: Omit<Deal, 'id'>[] = [
      {
        customerName: 'AIベンチャー株式会社',
        amount: 750000,
        stage: 'proposal',
        probability: 70,
        expectedCloseDate: '2024-03-15',
        source: 'inbound',
        notes: 'プロフェッショナルプラン + カスタム機能'
      },
      {
        customerName: 'マーケティング代理店',
        amount: 320000,
        stage: 'negotiation',
        probability: 85,
        expectedCloseDate: '2024-03-05',
        source: 'referral',
        notes: '価格交渉中、来週クロージング予定'
      },
      {
        customerName: 'EC事業者',
        amount: 180000,
        stage: 'qualified',
        probability: 50,
        expectedCloseDate: '2024-03-25',
        source: 'paid_ads',
        notes: '導入時期を検討中'
      }
    ]

    // 並列でデータを作成
    const promises = [
      ...sampleErrorLogs.map(error => createErrorLog(error)),
      ...sampleSalesProgress.map(progress => createSalesProgress(progress)),
      ...sampleDeals.map(deal => createDeal(deal))
    ]

    await Promise.all(promises)

    console.log('✅ Sample monitoring data seeded successfully!')
  } catch (error) {
    console.error('❌ Error seeding monitoring data:', error)
    throw error
  }
}
