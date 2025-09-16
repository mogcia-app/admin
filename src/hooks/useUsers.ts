'use client'

import { useState, useEffect } from 'react'
import { UserProfile, UserStats } from '@/types'
import { 
  getUserProfiles, 
  createUserProfile, 
  updateUserProfile, 
  deleteUserProfile, 
  subscribeToUserProfiles,
  getUserStats,
  searchUserProfiles,
  getUsersNearExpiry,
  getActiveUsers,
  getUsersByContractType
} from '@/lib/users'

export function useUsers() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let unsubscribe: (() => void) | undefined

    const initializeUsers = async () => {
      try {
        setLoading(true)
        
        // リアルタイム監視を開始
        unsubscribe = subscribeToUserProfiles((updatedUsers) => {
          setUsers(updatedUsers)
          setLoading(false)
          setError(null)
        })
        
      } catch (err) {
        console.error('Error initializing users:', err)
        setError(err instanceof Error ? err.message : '利用者データの読み込みに失敗しました')
        setLoading(false)
        
        // フォールバック: 一度だけ取得を試行
        try {
          const fetchedUsers = await getUserProfiles()
          setUsers(fetchedUsers)
        } catch (fallbackErr) {
          console.error('Fallback fetch failed:', fallbackErr)
        }
      }
    }

    initializeUsers()

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [])

  const addUser = async (userData: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setError(null)
      const id = await createUserProfile(userData)
      return id
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '利用者の作成に失敗しました'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const editUser = async (id: string, updates: Partial<UserProfile>) => {
    try {
      setError(null)
      await updateUserProfile(id, updates)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '利用者情報の更新に失敗しました'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const removeUser = async (id: string) => {
    try {
      setError(null)
      await deleteUserProfile(id)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '利用者の削除に失敗しました'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const searchUsers = async (searchTerm: string) => {
    try {
      setError(null)
      const results = await searchUserProfiles(searchTerm)
      return results
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '検索に失敗しました'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  return {
    users,
    loading,
    error,
    addUser,
    editUser,
    removeUser,
    searchUsers,
    refreshUsers: () => {
      setLoading(true)
      getUserProfiles().then(setUsers).finally(() => setLoading(false))
    }
  }
}

export function useUserStats() {
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    activeUsers: 0,
    trialUsers: 0,
    annualUsers: 0,
    teamUsers: 0,
    soloUsers: 0,
    snsBreakdown: {},
    industryBreakdown: {},
    monthlyRevenue: 0,
    churnRate: 0,
    averageContractValue: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        setError(null)
        const fetchedStats = await getUserStats()
        setStats(fetchedStats)
      } catch (err) {
        console.error('Error fetching user stats:', err)
        setError(err instanceof Error ? err.message : '統計データの読み込みに失敗しました')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  return { stats, loading, error, refreshStats: () => {} }
}

export function useUsersByCategory() {
  const [activeUsers, setActiveUsers] = useState<UserProfile[]>([])
  const [trialUsers, setTrialUsers] = useState<UserProfile[]>([])
  const [annualUsers, setAnnualUsers] = useState<UserProfile[]>([])
  const [expiringUsers, setExpiringUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCategorizedUsers = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const [active, trial, annual, expiring] = await Promise.all([
          getActiveUsers(),
          getUsersByContractType('trial'),
          getUsersByContractType('annual'),
          getUsersNearExpiry(30)
        ])
        
        setActiveUsers(active)
        setTrialUsers(trial)
        setAnnualUsers(annual)
        setExpiringUsers(expiring)
      } catch (err) {
        console.error('Error fetching categorized users:', err)
        setError(err instanceof Error ? err.message : 'カテゴリ別データの読み込みに失敗しました')
      } finally {
        setLoading(false)
      }
    }

    fetchCategorizedUsers()
  }, [])

  return {
    activeUsers,
    trialUsers,
    annualUsers,
    expiringUsers,
    loading,
    error,
    refreshData: () => {}
  }
}
