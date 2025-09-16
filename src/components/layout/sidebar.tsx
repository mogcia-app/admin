'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Users,
  Settings,
  BarChart3,
  User,
  X,
  MessageSquare,
  TrendingUp,
  Bell,
  Shield,
  Bot,
  Monitor,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { SidebarItem } from '@/types'

const sidebarItems: SidebarItem[] = [
  {
    id: 'users',
    label: 'ユーザー管理',
    icon: Users,
    href: '/users',
  },
  {
    id: 'prompts',
    label: 'プロンプト管理',
    icon: MessageSquare,
    href: '/prompts',
  },
  {
    id: 'analytics',
    label: 'アナリティクス',
    icon: BarChart3,
    href: '/analytics',
  },
  {
    id: 'kpi',
    label: 'KPIダッシュボード',
    icon: TrendingUp,
    href: '/kpi',
  },
  {
    id: 'notifications',
    label: 'お知らせ管理',
    icon: Bell,
    href: '/notifications',
  },
  {
    id: 'access-control',
    label: 'アクセス制御',
    icon: Shield,
    href: '/access-control',
  },
  {
    id: 'ai-assistant',
    label: 'AIアシスタント',
    icon: Bot,
    href: '/ai-assistant',
  },
  {
    id: 'monitoring',
    label: 'エラー監視・営業',
    icon: Monitor,
    href: '/monitoring',
  },
  {
    id: 'settings',
    label: '設定',
    icon: Settings,
    href: '/settings',
  },
  {
    id: 'profile',
    label: 'プロフィール',
    icon: User,
    href: '/profile',
  },
]

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-sidebar-background border-r border-sidebar-border transform transition-transform duration-200 ease-in-out lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-sidebar-border">
            <h1 className="text-xl font-bold text-sidebar-foreground">
              Admin Panel
            </h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="lg:hidden"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {sidebarItems.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon
              
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                  {item.badge && (
                    <span className="ml-auto bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-sidebar-border">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  管理者
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  admin@example.com
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
