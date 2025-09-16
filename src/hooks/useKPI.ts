'use client'

import { useState, useEffect } from 'react'
import { 
  KPIDashboardData, 
  KPIMetric, 
  RevenueData, 
  UserAcquisitionData 
} from '@/types'
import { 
  getKPIDashboardData, 
  getKPIMetrics, 
  getRevenueData, 
  getUserAcquisitionData,
  createKPIMetric,
  addRevenueData,
  addUserAcquisitionData
} from '@/lib/kpi'

export function useKPIDashboard() {
  const [dashboardData, setDashboardData] = useState<KPIDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getKPIDashboardData()
      setDashboardData(data)
    } catch (err) {
      console.error('Error fetching KPI dashboard data:', err)
      setError(err instanceof Error ? err.message : 'KPIダッシュボードデータの読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  return {
    dashboardData,
    loading,
    error,
    refreshData: fetchDashboardData
  }
}

export function useKPIMetrics() {
  const [metrics, setMetrics] = useState<KPIMetric[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getKPIMetrics()
        setMetrics(data)
      } catch (err) {
        console.error('Error fetching KPI metrics:', err)
        setError(err instanceof Error ? err.message : 'KPIメトリクスの読み込みに失敗しました')
      } finally {
        setLoading(false)
      }
    }

    fetchMetrics()
  }, [])

  const addMetric = async (metricData: Omit<KPIMetric, 'id' | 'updatedAt'>) => {
    try {
      setError(null)
      const id = await createKPIMetric(metricData)
      
      // ローカル状態を更新
      const newMetric: KPIMetric = {
        ...metricData,
        id,
        updatedAt: new Date().toISOString()
      }
      setMetrics([...metrics, newMetric])
      
      return id
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'KPIメトリクスの作成に失敗しました'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  return {
    metrics,
    loading,
    error,
    addMetric,
    refreshMetrics: () => {
      setLoading(true)
      getKPIMetrics().then(setMetrics).finally(() => setLoading(false))
    }
  }
}

export function useRevenueData(startDate?: string, endDate?: string) {
  const [revenueData, setRevenueData] = useState<RevenueData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchRevenueData = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getRevenueData(startDate, endDate)
        setRevenueData(data)
      } catch (err) {
        console.error('Error fetching revenue data:', err)
        setError(err instanceof Error ? err.message : '売上データの読み込みに失敗しました')
      } finally {
        setLoading(false)
      }
    }

    fetchRevenueData()
  }, [startDate, endDate])

  const addRevenue = async (revenueDataItem: Omit<RevenueData, 'id' | 'createdAt'>) => {
    try {
      setError(null)
      const id = await addRevenueData(revenueDataItem)
      
      // ローカル状態を更新
      const newRevenueItem: RevenueData = {
        ...revenueDataItem,
        id,
        createdAt: new Date().toISOString()
      }
      setRevenueData([newRevenueItem, ...revenueData])
      
      return id
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '売上データの追加に失敗しました'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  return {
    revenueData,
    loading,
    error,
    addRevenue
  }
}

export function useUserAcquisition(startDate?: string, endDate?: string) {
  const [acquisitionData, setAcquisitionData] = useState<UserAcquisitionData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAcquisitionData = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getUserAcquisitionData(startDate, endDate)
        setAcquisitionData(data)
      } catch (err) {
        console.error('Error fetching user acquisition data:', err)
        setError(err instanceof Error ? err.message : 'ユーザー獲得データの読み込みに失敗しました')
      } finally {
        setLoading(false)
      }
    }

    fetchAcquisitionData()
  }, [startDate, endDate])

  const addAcquisition = async (acquisitionDataItem: Omit<UserAcquisitionData, 'id' | 'createdAt'>) => {
    try {
      setError(null)
      const id = await addUserAcquisitionData(acquisitionDataItem)
      
      // ローカル状態を更新
      const newAcquisitionItem: UserAcquisitionData = {
        ...acquisitionDataItem,
        id,
        createdAt: new Date().toISOString()
      }
      setAcquisitionData([newAcquisitionItem, ...acquisitionData])
      
      return id
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ユーザー獲得データの追加に失敗しました'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  return {
    acquisitionData,
    loading,
    error,
    addAcquisition
  }
}
