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
    <header className="h-16 bg-background border-b border-border flex items-center justify-between px-6 relative z-10">
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
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="検索..."
            className="pl-10 pr-4 py-2 w-64 bg-muted rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 h-4 w-4 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
            3
          </span>
        </Button>
        
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium">
              {adminUser?.name || '管理者'}
              {adminUser?.role === 'super_admin' && (
                <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                  Super Admin
                </span>
              )}
            </p>
            <p className="text-xs text-muted-foreground">
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
