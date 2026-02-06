'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { getAdminUser, AdminUser } from '@/lib/admin-users'

interface AuthContextType {
  user: User | null
  adminUser: AdminUser | null
  loading: boolean
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      
      if (firebaseUser) {
        // Firebase ユーザーから管理者情報を取得
        const admin = getAdminUser(firebaseUser.email || '')
        setAdminUser(admin)
        
        // 管理者の場合、カスタムクレームを設定
        if (admin && firebaseUser.email) {
          try {
            // カスタムクレームが設定されているか確認（常に最新のトークンを取得）
            let tokenResult = await firebaseUser.getIdTokenResult(true)
            
            // デバッグ: トークンの内容を確認
            console.log('Token claims:', {
              admin: tokenResult.claims.admin,
              email: tokenResult.claims.email,
              allClaims: tokenResult.claims
            })
            
            if (!tokenResult.claims.admin) {
              // カスタムクレームが設定されていない場合、APIを呼び出して設定
              console.log('Admin claims not found, setting...')
              const response = await fetch('/api/auth/set-admin-claims', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  uid: firebaseUser.uid,
                  email: firebaseUser.email,
                }),
              })
              
              if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                console.error('Failed to set admin claims:', response.status, response.statusText, errorData)
              } else {
                // トークンを強制的に再取得してカスタムクレームを反映
                await firebaseUser.getIdToken(true)
                // 再取得したトークンで再度確認
                tokenResult = await firebaseUser.getIdTokenResult(true)
                console.log('Token claims after setting:', {
                  admin: tokenResult.claims.admin,
                  email: tokenResult.claims.email,
                  allClaims: tokenResult.claims
                })
                if (tokenResult.claims.admin) {
                  console.log('✅ Admin claims successfully set and verified')
                  // Firestoreが新しいトークンを使用するように、少し待つ
                  await new Promise(resolve => setTimeout(resolve, 1000))
                } else {
                  console.warn('⚠️ Admin claims may not be set correctly')
                }
              }
            } else {
              console.log('✅ Admin claims already set in token')
              // 念のため、トークンを再取得してFirestoreが最新のトークンを使用するようにする
              await firebaseUser.getIdToken(true)
              await new Promise(resolve => setTimeout(resolve, 500))
            }
          } catch (error) {
            console.error('❌ Error setting admin claims:', error)
            // エラーが発生しても続行（カスタムクレームが設定されていない場合でも動作するように）
          }
        }
      } else {
        setAdminUser(null)
      }
      
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const logout = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <AuthContext.Provider value={{ user, adminUser, loading, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
