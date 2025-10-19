'use client'

import React, { useState, useEffect } from 'react'
import { Shield, Loader2, RefreshCw, Activity, AlertTriangle, Wrench, Clock, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FeatureControlCard } from '@/components/access-control/feature-control-card'
import { SystemStatusCard } from '@/components/access-control/system-status-card'
import { useAccessControl, useSystemStatus } from '@/hooks/useAccessControl'
import { API_ENDPOINTS, apiPost, apiGet } from '@/lib/api-config'

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
  
  const [activeTab, setActiveTab] = useState<'features' | 'system' | 'tool'>('features')
  
  // ツール側メンテナンス状態
  const [toolMaintenance, setToolMaintenance] = useState({
    enabled: false,
    message: '',
    scheduledStart: '',
    scheduledEnd: '',
    updatedBy: '',
    updatedAt: null
  })
  const [toolMaintenanceLoading, setToolMaintenanceLoading] = useState(false)
  const [toolMaintenanceError, setToolMaintenanceError] = useState<string | null>(null)


  // ツール側メンテナンス状態を取得
  const fetchToolMaintenanceStatus = async () => {
    try {
      setToolMaintenanceLoading(true)
      setToolMaintenanceError(null)
      const response = await apiGet(API_ENDPOINTS.toolMaintenance.getStatus)
      if (response.success) {
        setToolMaintenance(response.data)
      }
    } catch (err) {
      console.error('Error fetching tool maintenance status:', err)
      setToolMaintenanceError('ツール側メンテナンス状態の取得に失敗しました')
    } finally {
      setToolMaintenanceLoading(false)
    }
  }

  // ツール側メンテナンスモードを設定
  const setToolMaintenanceMode = async (enabled: boolean, message?: string, scheduledStart?: string, scheduledEnd?: string) => {
    try {
      setToolMaintenanceLoading(true)
      setToolMaintenanceError(null)
      
      const response = await apiPost(API_ENDPOINTS.toolMaintenance.setMode, {
        enabled,
        message: message || 'システムメンテナンス中です。しばらくお待ちください。',
        scheduledStart,
        scheduledEnd,
        updatedBy: 'admin'
      })
      
      if (response.success) {
        setToolMaintenance(response.data)
        alert('ツール側のメンテナンスモードを更新しました')
      }
    } catch (err) {
      console.error('Error setting tool maintenance mode:', err)
      setToolMaintenanceError('ツール側メンテナンスモードの設定に失敗しました')
    } finally {
      setToolMaintenanceLoading(false)
    }
  }

  // 初期化時にツール側メンテナンス状態を取得
  useEffect(() => {
    fetchToolMaintenanceStatus()
  }, [])

  const handleRefresh = () => {
    refreshAccessControls()
    refreshSystemStatus()
    fetchToolMaintenanceStatus()
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
    { id: 'system', label: 'システム状況', icon: '🖥️' },
    { id: 'tool', label: 'ツール側メンテナンス', icon: '🔧' }
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

        {activeTab === 'tool' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">ツール側メンテナンス制御</h2>
              <p className="text-muted-foreground mb-6">
                別プロジェクト（ツール側）のメンテナンスモードを制御します。
              </p>
            </div>

            {/* 現在の状態 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  現在の状態
                </CardTitle>
              </CardHeader>
              <CardContent>
                {toolMaintenanceLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>状態を取得中...</span>
                  </div>
                ) : toolMaintenanceError ? (
                  <div className="text-red-600">
                    <p>{toolMaintenanceError}</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={fetchToolMaintenanceStatus}
                      className="mt-2"
                    >
                      再試行
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">メンテナンスモード</span>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                        toolMaintenance.enabled 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {toolMaintenance.enabled ? '有効' : '無効'}
                      </div>
                    </div>
                    
                    {toolMaintenance.enabled && toolMaintenance.message && (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                        <p className="text-sm text-yellow-800">
                          <strong>メッセージ:</strong> {toolMaintenance.message}
                        </p>
                      </div>
                    )}
                    
                    {toolMaintenance.scheduledStart && (
                      <div className="text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>開始予定: {new Date(toolMaintenance.scheduledStart).toLocaleString('ja-JP')}</span>
                        </div>
                        {toolMaintenance.scheduledEnd && (
                          <div className="flex items-center gap-2 mt-1">
                            <Clock className="h-4 w-4" />
                            <span>終了予定: {new Date(toolMaintenance.scheduledEnd).toLocaleString('ja-JP')}</span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {toolMaintenance.updatedBy && (
                      <div className="text-sm text-muted-foreground">
                        最終更新: {toolMaintenance.updatedBy} - {toolMaintenance.updatedAt ? new Date(toolMaintenance.updatedAt).toLocaleString('ja-JP') : '不明'}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* メンテナンス制御 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  メンテナンス制御
                </CardTitle>
                <CardDescription>
                  ツール側のログインを制御するためのメンテナンスモードを設定します
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <Button
                    onClick={() => setToolMaintenanceMode(true)}
                    disabled={toolMaintenanceLoading || toolMaintenance.enabled}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {toolMaintenanceLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Wrench className="h-4 w-4 mr-2" />
                    )}
                    メンテナンス開始
                  </Button>
                  
                  <Button
                    onClick={() => setToolMaintenanceMode(false)}
                    disabled={toolMaintenanceLoading || !toolMaintenance.enabled}
                    variant="outline"
                    className="border-green-600 text-green-600 hover:bg-green-50"
                  >
                    {toolMaintenanceLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Activity className="h-4 w-4 mr-2" />
                    )}
                    メンテナンス終了
                  </Button>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  <p>• <strong>メンテナンス開始:</strong> ツール側へのログインを無効にします</p>
                  <p>• <strong>メンテナンス終了:</strong> ツール側へのログインを有効にします</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
