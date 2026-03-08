'use client'

import React, { useState } from 'react'
import { Sidebar } from './sidebar'
import { AdminLayoutProps } from '@/types'
import { useAuth } from '@/contexts/auth-context'
import { Loader2 } from 'lucide-react'

export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { loading, adminUser } = useAuth()

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen)

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2 text-slate-600">認証情報を確認中...</span>
      </div>
    )
  }

  // 親管理（固定3名）以外は画面を表示しない
  if (!adminUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-6xl font-bold text-slate-300">404</p>
          <p className="mt-2 text-slate-600">ページが見つかりません</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
      
      <div className="lg:ml-20 relative z-0">
        <main className="p-6 relative" data-ui-region="main">
          {children}
        </main>
      </div>
    </div>
  )
}
