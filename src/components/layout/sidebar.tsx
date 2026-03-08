'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Users,
  User,
  X,
  Bell,
  History,
  MousePointerClick,
  Wrench,
  ClipboardList,
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
    id: 'admin-intake',
    label: '利用者Intake',
    icon: ClipboardList,
    href: '/admin/intake',
  },
  {
    id: 'audit-logs',
    label: '代理店監査ログ',
    icon: History,
    href: '/audit-logs',
  },
  {
    id: 'ui-events',
    label: 'ユーザー行動ログ',
    icon: MousePointerClick,
    href: '/admin/ui-events',
  },
  // {
  //   id: 'kpi',
  //   label: 'KPIダッシュボード',
  //   icon: TrendingUp,
  //   href: '/kpi',
  // },
  {
    id: 'notifications',
    label: 'お知らせ管理',
    icon: Bell,
    href: '/notifications',
  },
  {
    id: 'maintenance',
    label: 'メンテ管理',
    icon: Wrench,
    href: '/admin/maintenance',
  },
  // {
  //   id: 'profile',
  //   label: 'プロフィール',
  //   icon: User,
  //   href: '/profile',
  // },
  // {
  //   id: 'settings',
  //   label: '設定',
  //   icon: Settings,
  //   href: '/settings',
  // },
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
      <div
        data-ui-region="sidebar"
        className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 lg:w-20 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between h-16 px-4 lg:px-3 border-b border-slate-200">
            <h1 className="text-base font-bold text-slate-900 tracking-tight lg:hidden">
              Admin Panel
            </h1>
            <span className="hidden lg:flex w-10 h-10 rounded-xl bg-slate-900 text-white items-center justify-center text-sm font-semibold">
              A
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="lg:hidden"
              data-track-ignore="true"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-5 space-y-2">
            {sidebarItems.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon
              
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  title={item.label}
                  className={cn(
                    "flex items-center lg:justify-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors border",
                    isActive
                      ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                      : "text-slate-600 border-transparent hover:bg-slate-100 hover:text-slate-900"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="lg:hidden">{item.label}</span>
                  {item.badge && (
                    <span className="ml-auto lg:hidden bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="p-3 border-t border-slate-200">
            <div className="flex items-center lg:justify-center gap-3 px-3 py-2">
              <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-slate-700" />
              </div>
              <div className="flex-1 min-w-0 lg:hidden">
                <p className="text-sm font-medium text-slate-900 truncate">
                  管理者
                </p>
                <p className="text-xs text-slate-500 truncate">
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
