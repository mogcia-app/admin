'use client'

import React, { useState } from 'react'
import { Shield, Database, Loader2, RefreshCw, Activity, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FeatureControlCard } from '@/components/access-control/feature-control-card'
import { SystemStatusCard } from '@/components/access-control/system-status-card'
import { useAccessControl, useSystemStatus } from '@/hooks/useAccessControl'
import { seedAccessControlData } from '@/lib/access-control'

export default function AccessControlPage() {
  const { 
    accessControls, 
    loading, 
    error, 
    toggleFeatureAccess, 
    toggleMaintenanceModeForFeature,
    editAccessControl,
    refreshAccessControls
  } = useAccessControl()
  
  const { 
    systemStatus, 
    loading: statusLoading, 
    error: statusError, 
    updateServiceStatus,
    refreshSystemStatus 
  } = useSystemStatus()
  
  const [seeding, setSeeding] = useState(false)
  const [activeTab, setActiveTab] = useState<'features' | 'system'>('features')

  const handleSeedData = async () => {
    try {
      setSeeding(true)
      await seedAccessControlData()
      alert('サンプルアクセス制御データを作成しました！')
      refreshAccessControls()
      refreshSystemStatus()
    } catch (err) {
      alert('データの作成中にエラーが発生しました: ' + (err instanceof Error ? err.message : '不明なエラー'))
    } finally {
      setSeeding(false)
    }
  }

  const handleRefresh = () => {
    refreshAccessControls()
    refreshSystemStatus()
  }

  // 統計情報の計算
  const stats = {
    totalFeatures: accessControls.length,
    enabledFeatures: accessControls.filter(ac => ac.isEnabled && !ac.maintenanceMode).length,
    maintenanceFeatures: accessControls.filter(ac => ac.maintenanceMode).length,
    disabledFeatures: accessControls.filter(ac => !ac.isEnabled).length,
    operationalServices: systemStatus.filter(s => s.status === 'operational').length,
    totalServices: systemStatus.length
  }

  const tabs = [
    { id: 'features', label: '機能制御', icon: '⚙️' },
    { id: 'system', label: 'システム状況', icon: '🖥️' }
  ]

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">アクセス制御</h1>
          <p className="text-muted-foreground">
            アプリケーション機能の有効化・メンテナンスモード・システム監視
            {(error || statusError) && (
              <span className="text-destructive ml-2">
                ({error || statusError})
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleSeedData}
            disabled={seeding}
            variant="outline"
          >
            {seeding ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                作成中...
              </>
            ) : (
              <>
                <Database className="h-4 w-4 mr-2" />
                サンプルデータ作成
              </>
            )}
          </Button>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            更新
          </Button>
        </div>
      </div>

      {/* 統計情報 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総機能数</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalFeatures}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">有効機能</CardTitle>
            <Shield className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.enabledFeatures}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">メンテナンス中</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.maintenanceFeatures}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">稼働サービス</CardTitle>
            <Activity className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.operationalServices}/{stats.totalServices}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* タブナビゲーション */}
      <div className="border-b">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
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
        {activeTab === 'features' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">機能アクセス制御</h2>
              <p className="text-muted-foreground mb-6">
                各機能の有効化・無効化、メンテナンスモードの設定を行います。
              </p>
            </div>
            
            {loading ? (
              <div className="grid gap-4 md:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="h-3 bg-muted rounded"></div>
                        <div className="h-3 bg-muted rounded w-5/6"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {accessControls.map((accessControl) => (
                  <FeatureControlCard
                    key={accessControl.id}
                    accessControl={accessControl}
                    onToggleFeature={toggleFeatureAccess}
                    onToggleMaintenance={toggleMaintenanceModeForFeature}
                    onUpdate={editAccessControl}
                  />
                ))}
              </div>
            )}
            
            {!loading && accessControls.length === 0 && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🚦</div>
                <h3 className="text-lg font-semibold mb-2">アクセス制御設定がありません</h3>
                <p className="text-muted-foreground">サンプルデータを作成して開始しましょう。</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'system' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">システム稼働状況</h2>
              <p className="text-muted-foreground mb-6">
                各サービスの稼働状況をリアルタイムで監視します。
              </p>
            </div>
            
            <SystemStatusCard
              systemStatus={systemStatus}
              onRefresh={refreshSystemStatus}
              onUpdateStatus={updateServiceStatus}
            />
          </div>
        )}
      </div>
    </div>
  )
}
