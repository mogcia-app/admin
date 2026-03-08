'use client'

import React from 'react'
import { Menu, Bell, Search, LogOut, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'

interface HeaderProps {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const { adminUser, logout } = useAuth()

  const handleLogout = async () => {
    if (confirm('ログアウトしますか？')) {
      await logout()
    }
  }

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 relative z-10">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="search"
            placeholder="全体検索"
            className="pl-10 pr-4 py-2 w-72 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="relative hover:bg-slate-100 rounded-xl">
          <Bell className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 h-4 w-4 bg-slate-900 text-white text-xs rounded-full flex items-center justify-center">
            3
          </span>
        </Button>
        
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-slate-700" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-slate-900">
              {adminUser?.name || '管理者'}
              {adminUser?.role === 'super_admin' && (
                <span className="ml-2 text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                  Super Admin
                </span>
              )}
            </p>
            <p className="text-xs text-slate-500">
              {adminUser?.email || 'admin@example.com'}
            </p>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            title="ログアウト"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}
