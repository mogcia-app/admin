'use client'

import { useState, useEffect } from 'react'
import { User, UserStats } from '@/types'
import { userService } from '@/lib/firebase-admin'

export function useUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true)
        const userData = await userService.getUsers()
        setUsers(userData)
        setError(null)
      } catch (err) {
        console.error('Error fetching users:', err)
        setError('ユーザーデータの取得に失敗しました。Firebase接続を確認してください。')
        setUsers([])
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  const addUser = async (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setError(null)
      
      // デバッグ用：userServiceに渡すデータを確認
      console.log('useUsers addUser - calling userService.createUser with:', {
        ...userData,
        password: userData.password ? `[${userData.password.length} chars]` : '[NOT SET]'
      })
      
      const id = await userService.createUser(userData)
      const newUser: User = {
        ...userData,
        id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      setUsers(prev => [newUser, ...prev])
      return id
    } catch (err) {
      console.error('Error in useUsers addUser:', err)
      const errorMessage = err instanceof Error ? err.message : 'ユーザーの作成に失敗しました'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const editUser = async (id: string, updates: Partial<User>) => {
    try {
      setError(null)
      await userService.updateUser(id, updates)
      setUsers(prev => prev.map(user => 
        user.id === id 
          ? { ...user, ...updates, updatedAt: new Date().toISOString() }
          : user
      ))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ユーザー情報の更新に失敗しました'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const removeUser = async (id: string) => {
    try {
      setError(null)
      await userService.deleteUser(id)
      setUsers(prev => prev.filter(user => user.id !== id))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ユーザーの削除に失敗しました'
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
    removeUser
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
        const users = await userService.getUsers()
        
        const totalUsers = users.length
        const activeUsers = users.filter(user => user.isActive).length
        const trialUsers = users.filter(user => user.contractType === 'trial').length
        const annualUsers = users.filter(user => user.contractType === 'annual').length
        const teamUsers = users.filter(user => user.usageType === 'team').length
        const soloUsers = users.filter(user => user.usageType === 'solo').length
        
        // SNS契約数に基づく売上計算（お試し利用者は除外）
        const snsPricing = {
          1: 60000,
          2: 80000,
          3: 100000,
          4: 120000
        }
        
        const totalRevenue = users
          .filter(user => user.isActive && user.contractType === 'annual')
          .reduce((total, user) => {
            const snsCount = user.snsCount || 1
            return total + (snsPricing[snsCount as keyof typeof snsPricing] || 60000)
          }, 0)
        
        // 成長率計算（前月比）
        const currentMonth = new Date().getMonth()
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
        const currentMonthUsers = users.filter(user => 
          new Date(user.createdAt).getMonth() === currentMonth
        ).length
        const lastMonthUsers = users.filter(user => 
          new Date(user.createdAt).getMonth() === lastMonth
        ).length
        
        const monthlyGrowth = lastMonthUsers > 0 
          ? ((currentMonthUsers - lastMonthUsers) / lastMonthUsers) * 100
          : 0

        setStats({
          totalUsers,
          activeUsers,
          trialUsers,
          annualUsers,
          teamUsers,
          soloUsers,
          snsBreakdown: {},
          industryBreakdown: {},
          monthlyRevenue: totalRevenue,
          churnRate: 0,
          averageContractValue: totalRevenue / Math.max(activeUsers, 1)
        })
        setError(null)
      } catch (err) {
        console.error('Error fetching user stats:', err)
        setError('統計データの取得に失敗しました')
        setStats({
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
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  return {
    stats,
    loading,
    error
  }
}