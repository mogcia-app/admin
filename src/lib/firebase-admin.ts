// Firebase Admin SDK for server-side operations
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy, setDoc } from 'firebase/firestore'
import { createUserWithEmailAndPassword, deleteUser as deleteAuthUser } from 'firebase/auth'
import { db, auth } from './firebase'
import { User } from '@/types'

// User management functions
export const userService = {
  // Get all users
  async getUsers() {
    try {
      const usersRef = collection(db, 'users')
      const q = query(usersRef, orderBy('createdAt', 'desc'))
      const snapshot = await getDocs(q)
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[]
    } catch (error) {
      console.error('Error getting users:', error)
      throw error
    }
  },

  // Get active users
  async getActiveUsers() {
    try {
      const usersRef = collection(db, 'users')
      const q = query(usersRef, where('isActive', '==', true), orderBy('updatedAt', 'desc'))
      const snapshot = await getDocs(q)
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[]
    } catch (error) {
      console.error('Error getting active users:', error)
      throw error
    }
  },

  // Create new user with Firebase Auth
  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      // デバッグ用：受け取ったデータを確認
      console.log('firebase-admin createUser - received data:', {
        ...userData,
        password: userData.password ? `[${userData.password.length} chars]` : '[NOT SET]'
      })
      
      // 1. Firebase Authでユーザーアカウント作成
      if (!userData.email || !userData.password) {
        console.error('Missing email or password:', { 
          email: !!userData.email, 
          password: !!userData.password 
        })
        throw new Error('メールアドレスとパスワードは必須です')
      }

      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        userData.email, 
        userData.password
      )
      
      const uid = userCredential.user.uid
      
      // 2. Firestoreにユーザー詳細情報を保存（パスワードは除く）
      const { password, ...userDataWithoutPassword } = userData
      const userRef = doc(db, 'users', uid)
      
      await setDoc(userRef, {
        id: uid, // Firebase Auth UIDを使用
        ...userDataWithoutPassword,
        snsCount: userData.snsCount || 1,
        usageType: userData.usageType || 'solo',
        contractType: userData.contractType || 'trial',
        contractSNS: userData.contractSNS || [],
        snsAISettings: userData.snsAISettings || {},
        businessInfo: userData.businessInfo || {
          industry: '',
          companySize: 'individual',
          businessType: 'b2c',
          description: '',
          targetMarket: '',
          goals: [],
          challenges: [],
          currentSNSStrategy: ''
        },
        status: userData.status || 'active',
        contractStartDate: userData.contractStartDate || new Date().toISOString(),
        contractEndDate: userData.contractEndDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      
      return uid
    } catch (error) {
      console.error('Error creating user:', error)
      if (error instanceof Error) {
        // Firebase Authエラーメッセージを日本語化
        if (error.message.includes('email-already-in-use')) {
          throw new Error('このメールアドレスは既に使用されています')
        }
        if (error.message.includes('weak-password')) {
          throw new Error('パスワードが弱すぎます。8文字以上で設定してください')
        }
        if (error.message.includes('invalid-email')) {
          throw new Error('無効なメールアドレスです')
        }
      }
      throw error
    }
  },

  // Update user
  async updateUser(userId: string, userData: Partial<User>) {
    try {
      const userRef = doc(db, 'users', userId)
      await updateDoc(userRef, {
        ...userData,
        updatedAt: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error updating user:', error)
      throw error
    }
  },

  // Delete user (both Firebase Auth and Firestore)
  async deleteUser(userId: string) {
    try {
      // 1. Firestoreからユーザー削除
      const userRef = doc(db, 'users', userId)
      await deleteDoc(userRef)
      
      // 2. Firebase Authからユーザー削除は管理者権限が必要
      // 現在のクライアントSDKでは他のユーザーを削除できないため、
      // 実際の運用では Firebase Admin SDK を使用する必要があります
      console.log(`User ${userId} deleted from Firestore. Firebase Auth deletion requires Admin SDK.`)
    } catch (error) {
      console.error('Error deleting user:', error)
      throw error
    }
  }
}

// Dashboard data functions
export const dashboardService = {
  // Get dashboard statistics
  async getDashboardStats() {
    try {
      const users = await userService.getUsers()
      const activeUsers = users.filter(user => user.isActive)
      
      // 実際のユーザー数に基づいて売上を計算
      const totalUsers = users.length
      const activeUsersCount = activeUsers.length
      
      // SNS契約数に基づく売上計算
      // 1SNS: 60,000円, 2SNS: 80,000円, 3SNS: 100,000円, 4SNS: 120,000円
      const snsPricing = {
        1: 60000,
        2: 80000,
        3: 100000,
        4: 120000
      }
      
      const totalRevenue = activeUsers.reduce((total, user) => {
        const snsCount = user.snsCount || 1 // デフォルトは1SNS
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
      
      console.log('Dashboard stats calculated:', {
        totalUsers,
        activeUsers: activeUsersCount,
        totalRevenue,
        monthlyGrowth: Math.round(monthlyGrowth * 10) / 10
      })
      
      return {
        totalUsers,
        activeUsers: activeUsersCount,
        totalRevenue,
        monthlyGrowth: Math.round(monthlyGrowth * 10) / 10
      }
    } catch (error) {
      console.error('Error getting dashboard stats:', error)
      // エラー時は0を返す
      return {
        totalUsers: 0,
        activeUsers: 0,
        totalRevenue: 0,
        monthlyGrowth: 0
      }
    }
  },

  // Log admin actions
  async logAdminAction(action: string, details: Record<string, unknown>) {
    try {
      const logsRef = collection(db, 'admin_logs')
      await addDoc(logsRef, {
        action,
        details,
        timestamp: new Date().toISOString(),
        // userId would come from auth context
      })
    } catch (error) {
      console.error('Error logging admin action:', error)
      throw error
    }
  }
}
