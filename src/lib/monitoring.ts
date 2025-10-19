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
