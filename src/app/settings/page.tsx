'use client'

import React, { useState } from 'react'
import { Settings, User, Shield, Bell, Loader2, RefreshCw, Search, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SettingItem } from '@/components/settings/setting-item'
import { ProfileSettings } from '@/components/settings/profile-settings'
import { useSystemSettings, useAdminProfile, useSettingsStats } from '@/hooks/useSettings'

export default function SettingsPage() {
  const adminId = 'admin_001' // 実際は認証されたユーザーのID
  
  const { 
    settings, 
    loading: settingsLoading, 
    error: settingsError, 
    updateSetting, 
    refreshSettings 
  } = useSystemSettings()
  
  const { 
    profile, 
    loading: profileLoading, 
    error: profileError, 
    updateProfile, 
    refreshProfile 
  } = useAdminProfile(adminId)
  
  const stats = useSettingsStats()
  
  const [activeView, setActiveView] = useState<'profile' | 'system'>('profile')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')


  const handleRefresh = () => {
    refreshSettings()
    refreshProfile()
  }

  const handleUpdateSetting = async (id: string, value: any) => {
    await updateSetting(id, value, adminId)
  }

  // 設定のフィルタリング
  const filteredSettings = settings.filter(setting => {
    const matchesSearch = setting.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         setting.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || setting.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // カテゴリ別にグループ化
  const groupedSettings = filteredSettings.reduce((acc, setting) => {
    if (!acc[setting.category]) {
      acc[setting.category] = []
    }
    acc[setting.category].push(setting)
    return acc
  }, {} as Record<string, typeof settings>)

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'general': return <Settings className="h-5 w-5" />
      case 'security': return <Shield className="h-5 w-5" />
      case 'notification': return <Bell className="h-5 w-5" />
      case 'integration': return <Database className="h-5 w-5" />
      case 'backup': return <Database className="h-5 w-5" />
      default: return <Settings className="h-5 w-5" />
    }
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'general': return '一般設定'
      case 'security': return 'セキュリティ'
      case 'notification': return '通知設定'
      case 'integration': return '統合設定'
      case 'backup': return 'バックアップ'
      default: return category
    }
  }

  const tabs = [
    { id: 'profile', label: 'プロフィール', icon: '👤' },
    { id: 'system', label: 'システム設定', icon: '⚙️' }
  ]

  const anyError = settingsError || profileError
  const anyLoading = settingsLoading || profileLoading

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">設定</h1>
          <p className="text-muted-foreground">
            システム設定とプロフィール管理
            {anyError && <span className="text-destructive ml-2">({anyError})</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            更新
          </Button>
        </div>
      </div>

      {/* 統計情報 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総設定数</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSettings}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">編集可能</CardTitle>
            <Settings className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.editableSettings}</div>
            <p className="text-xs text-muted-foreground">
              全体の {((stats.editableSettings / stats.totalSettings) * 100).toFixed(0)}%
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">カテゴリ数</CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(stats.settingsByCategory).length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">管理者</CardTitle>
            <User className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile ? 1 : 0}</div>
            <p className="text-xs text-muted-foreground">
              アクティブ
            </p>
          </CardContent>
        </Card>
      </div>

      {/* タブナビゲーション */}
      <div className="border-b">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeView === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* コンテンツエリア */}
      <div className="space-y-6">
        {activeView === 'profile' && (
          <div>
            {profileLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p className="text-muted-foreground">プロフィールを読み込み中...</p>
                </div>
              </div>
            ) : profile ? (
              <ProfileSettings
                profile={profile}
                onUpdate={updateProfile}
              />
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center h-64">
                  <User className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">プロフィールが見つかりません</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    管理者プロフィールが見つかりません。手動でプロフィールを作成してください。
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeView === 'system' && (
          <div className="space-y-6">
            {/* 検索・フィルター */}
            <Card>
              <CardHeader>
                <CardTitle>システム設定</CardTitle>
                <CardDescription>アプリケーションの動作を制御する設定項目</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 mb-6">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="設定を検索..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="カテゴリを選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">すべてのカテゴリ</SelectItem>
                      <SelectItem value="general">一般設定</SelectItem>
                      <SelectItem value="security">セキュリティ</SelectItem>
                      <SelectItem value="notification">通知設定</SelectItem>
                      <SelectItem value="integration">統合設定</SelectItem>
                      <SelectItem value="backup">バックアップ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* 設定項目 */}
            {settingsLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p className="text-muted-foreground">設定を読み込み中...</p>
                </div>
              </div>
            ) : Object.keys(groupedSettings).length > 0 ? (
              Object.entries(groupedSettings).map(([category, categorySettings]) => (
                <div key={category} className="space-y-4">
                  <div className="flex items-center gap-3">
                    {getCategoryIcon(category)}
                    <h2 className="text-xl font-semibold">{getCategoryLabel(category)}</h2>
                    <span className="text-sm text-muted-foreground">
                      ({categorySettings.length}件)
                    </span>
                  </div>
                  
                  <div className="grid gap-4">
                    {categorySettings.map((setting) => (
                      <SettingItem
                        key={setting.id}
                        setting={setting}
                        onUpdate={handleUpdateSetting}
                      />
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center h-64">
                  <Settings className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">設定が見つかりません</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    {searchQuery || selectedCategory !== 'all' 
                      ? '検索条件に一致する設定がありません。' 
                      : 'システム設定がありません。手動で設定を作成してください。'
                    }
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
