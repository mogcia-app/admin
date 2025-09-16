'use client'

import React, { useState } from 'react'
import { Sidebar } from './sidebar'
import { Header } from './header'
import { AdminLayoutProps } from '@/types'

export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen)

  return (
    <div className="min-h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
      
      <div className="lg:ml-64 relative z-0">
        <Header onMenuClick={toggleSidebar} />
        
        <main className="p-6 relative">
          {children}
        </main>
      </div>
    </div>
  )
}
