'use client'

import { useState, useEffect } from 'react'
import { dashboardService, userService } from '@/lib/firebase-admin'
import { User } from '@/types'

export function useDashboardData() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalRevenue: 0,
    monthlyGrowth: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const dashboardStats = await dashboardService.getDashboardStats()
      setStats(dashboardStats)
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
      setError('ダッシュボードデータの取得に失敗しました。Firebase接続を確認してください。')
      // エラー時は空のデータを表示
      setStats({
        totalUsers: 0,
        activeUsers: 0,
        totalRevenue: 0,
        monthlyGrowth: 0
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  return { stats, loading, error, refresh: fetchDashboardData }
}

export function useUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const userData = await userService.getUsers()
      setUsers(userData)
    } catch (err) {
      console.error('Error fetching users:', err)
      setError('ユーザーデータの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const createUser = async (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await userService.createUser(userData)
      await fetchUsers() // リフレッシュ
    } catch (err) {
      console.error('Error creating user:', err)
      throw new Error('ユーザーの作成に失敗しました')
    }
  }

  const updateUser = async (userId: string, userData: Partial<User>) => {
    try {
      await userService.updateUser(userId, userData)
      await fetchUsers() // リフレッシュ
    } catch (err) {
      console.error('Error updating user:', err)
      throw new Error('ユーザーの更新に失敗しました')
    }
  }

  const deleteUser = async (userId: string) => {
    try {
      await userService.deleteUser(userId)
      await fetchUsers() // リフレッシュ
    } catch (err) {
      console.error('Error deleting user:', err)
      throw new Error('ユーザーの削除に失敗しました')
    }
  }

  return {
    users,
    loading,
    error,
    createUser,
    updateUser,
    deleteUser,
    refetch: fetchUsers
  }
}
