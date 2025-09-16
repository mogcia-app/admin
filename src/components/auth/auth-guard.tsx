'use client'

import React from 'react'
import { useAuth } from '@/contexts/auth-context'
import { LoginForm } from './login-form'
import { Loader2 } from 'lucide-react'

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, adminUser, loading } = useAuth()

  // ローディング中
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">認証確認中...</p>
        </div>
      </div>
    )
  }

  // 未認証または管理者権限なし
  if (!user || !adminUser) {
    return <LoginForm onLoginSuccess={() => window.location.reload()} />
  }

  // 認証済み管理者
  return <>{children}</>
}
