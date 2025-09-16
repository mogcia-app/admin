'use client'

import { useState, useEffect } from 'react'
import { 
  ErrorLog, 
  SalesProgress, 
  Deal 
} from '@/types'
import { 
  getErrorLogs,
  createErrorLog,
  updateErrorLog,
  resolveError,
  getSalesProgress,
  createSalesProgress,
  updateSalesProgress,
  getDeals,
  createDeal,
  updateDeal,
  getErrorStats,
  getSalesStats
} from '@/lib/monitoring'

export function useErrorLogs(filters?: {
  level?: string
  source?: string
  resolved?: boolean
}) {
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchErrorLogs = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getErrorLogs(filters)
      setErrorLogs(data)
    } catch (err) {
      console.error('Error fetching error logs:', err)
      setError(err instanceof Error ? err.message : 'エラーログの読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchErrorLogs()
  }, [filters?.level, filters?.source, filters?.resolved])

  const addErrorLog = async (errorData: Omit<ErrorLog, 'id' | 'timestamp' | 'count'>) => {
    try {
      setError(null)
      const id = await createErrorLog(errorData)
      
      // ローカル状態を更新
      const newError: ErrorLog = {
        ...errorData,
        id,
        timestamp: new Date().toISOString(),
        count: 1,
        resolved: false
      }
      setErrorLogs([newError, ...errorLogs])
      
      return id
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'エラーログの作成に失敗しました'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const updateError = async (id: string, updates: Partial<ErrorLog>) => {
    try {
      setError(null)
      await updateErrorLog(id, updates)
      
      // ローカル状態を更新
      setErrorLogs(errorLogs.map(errorLog =>
        errorLog.id === id ? { ...errorLog, ...updates } : errorLog
      ))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'エラーログの更新に失敗しました'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const resolveErrorById = async (id: string, assignedTo?: string) => {
    try {
      setError(null)
      await resolveError(id, assignedTo)
      
      // ローカル状態を更新
      setErrorLogs(errorLogs.map(errorLog =>
        errorLog.id === id ? { ...errorLog, resolved: true, assignedTo } : errorLog
      ))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'エラーの解決に失敗しました'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  return {
    errorLogs,
    loading,
    error,
    addErrorLog,
    updateError,
    resolveError: resolveErrorById,
    refreshErrorLogs: fetchErrorLogs
  }
}

export function useSalesProgress() {
  const [salesProgress, setSalesProgress] = useState<SalesProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSalesProgress = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getSalesProgress()
      setSalesProgress(data)
    } catch (err) {
      console.error('Error fetching sales progress:', err)
      setError(err instanceof Error ? err.message : '営業進捗の読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSalesProgress()
  }, [])

  const addSalesProgress = async (progressData: Omit<SalesProgress, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setError(null)
      const id = await createSalesProgress(progressData)
      
      // ローカル状態を更新
      const newProgress: SalesProgress = {
        ...progressData,
        id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      setSalesProgress([newProgress, ...salesProgress])
      
      return id
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '営業進捗の作成に失敗しました'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const updateProgress = async (id: string, updates: Partial<SalesProgress>) => {
    try {
      setError(null)
      await updateSalesProgress(id, updates)
      
      // ローカル状態を更新
      setSalesProgress(salesProgress.map(progress =>
        progress.id === id 
          ? { ...progress, ...updates, updatedAt: new Date().toISOString() } 
          : progress
      ))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '営業進捗の更新に失敗しました'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  return {
    salesProgress,
    loading,
    error,
    addSalesProgress,
    updateProgress,
    refreshSalesProgress: fetchSalesProgress
  }
}

export function useDeals(filters?: { stage?: string; salesRep?: string }) {
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDeals = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getDeals(filters)
      setDeals(data)
    } catch (err) {
      console.error('Error fetching deals:', err)
      setError(err instanceof Error ? err.message : '案件の読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDeals()
  }, [filters?.stage, filters?.salesRep])

  const addDeal = async (dealData: Omit<Deal, 'id'>) => {
    try {
      setError(null)
      const id = await createDeal(dealData)
      
      // ローカル状態を更新
      const newDeal: Deal = { ...dealData, id }
      setDeals([newDeal, ...deals])
      
      return id
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '案件の作成に失敗しました'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const updateDealById = async (id: string, updates: Partial<Deal>) => {
    try {
      setError(null)
      await updateDeal(id, updates)
      
      // ローカル状態を更新
      setDeals(deals.map(deal =>
        deal.id === id ? { ...deal, ...updates } : deal
      ))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '案件の更新に失敗しました'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  return {
    deals,
    loading,
    error,
    addDeal,
    updateDeal: updateDealById,
    refreshDeals: fetchDeals
  }
}

export function useErrorStats() {
  const [stats, setStats] = useState<{
    totalErrors: number
    unresolvedErrors: number
    criticalErrors: number
    errorsByLevel: Record<string, number>
    errorsBySource: Record<string, number>
    recentErrors: ErrorLog[]
  }>({
    totalErrors: 0,
    unresolvedErrors: 0,
    criticalErrors: 0,
    errorsByLevel: {},
    errorsBySource: {},
    recentErrors: []
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getErrorStats()
      setStats(data)
    } catch (err) {
      console.error('Error fetching error stats:', err)
      setError(err instanceof Error ? err.message : 'エラー統計の読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  return {
    stats,
    loading,
    error,
    refreshStats: fetchStats
  }
}

export function useSalesStats() {
  const [stats, setStats] = useState<{
    totalDeals: number
    closedDeals: number
    totalRevenue: number
    averageDealSize: number
    conversionRate: number
    dealsByStage: Record<string, number>
    monthlyProgress: SalesProgress[]
  }>({
    totalDeals: 0,
    closedDeals: 0,
    totalRevenue: 0,
    averageDealSize: 0,
    conversionRate: 0,
    dealsByStage: {},
    monthlyProgress: []
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getSalesStats()
      setStats(data)
    } catch (err) {
      console.error('Error fetching sales stats:', err)
      setError(err instanceof Error ? err.message : '営業統計の読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  return {
    stats,
    loading,
    error,
    refreshStats: fetchStats
  }
}
