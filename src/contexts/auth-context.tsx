'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { getAdminUser, AdminUser } from '@/lib/admin-users'
import { parseJsonResponse } from '@/lib/http-response'

interface AuthContextType {
  user: User | null
  adminUser: AdminUser | null
  loading: boolean
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)
const AUTH_AUDIT_SESSION_KEY = 'admin_auth_audit_logged_uid'

async function recordAuthAudit(firebaseUser: User, action: 'auth.login' | 'auth.logout') {
  try {
    const idToken = await firebaseUser.getIdToken()
    await fetch('/api/auth/audit-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ action }),
    })
  } catch (error) {
    console.error('Failed to record auth audit:', error)
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      
      if (firebaseUser) {
        if (typeof window !== 'undefined') {
          const loggedUid = window.sessionStorage.getItem(AUTH_AUDIT_SESSION_KEY)
          if (loggedUid !== firebaseUser.uid) {
            await recordAuthAudit(firebaseUser, 'auth.login')
            window.sessionStorage.setItem(AUTH_AUDIT_SESSION_KEY, firebaseUser.uid)
          }
        }

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
                const errorData = await parseJsonResponse(response).catch(() => ({}))
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
        if (typeof window !== 'undefined') {
          window.sessionStorage.removeItem(AUTH_AUDIT_SESSION_KEY)
        }
      }
      
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const logout = async () => {
    try {
      if (user) {
        await recordAuthAudit(user, 'auth.logout')
      }
      await signOut(auth)
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem(AUTH_AUDIT_SESSION_KEY)
      }
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
