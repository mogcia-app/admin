// Firebase Admin SDK for server-side operations
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy } from 'firebase/firestore'
import { db } from './firebase'
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

  // Create new user
  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      const usersRef = collection(db, 'users')
      const docRef = await addDoc(usersRef, {
        ...userData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      
      return docRef.id
    } catch (error) {
      console.error('Error creating user:', error)
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

  // Delete user
  async deleteUser(userId: string) {
    try {
      const userRef = doc(db, 'users', userId)
      await deleteDoc(userRef)
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
      
      return {
        totalUsers: users.length,
        activeUsers: activeUsers.length,
        totalRevenue: 2340000, // This would come from a revenue collection
        monthlyGrowth: 23.1 // This would be calculated from historical data
      }
    } catch (error) {
      console.error('Error getting dashboard stats:', error)
      throw error
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
