'use client'

import React, { useState, useEffect } from 'react'
import { Shield, Loader2, RefreshCw, Activity, AlertTriangle, Wrench, Clock, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FeatureControlCard } from '@/components/access-control/feature-control-card'
import { SystemStatusCard } from '@/components/access-control/system-status-card'
import { EmergencySecurityCard } from '@/components/access-control/emergency-security-card'
import { useAccessControl, useSystemStatus, useEmergencySecurityMode } from '@/hooks/useAccessControl'
import { getToolMaintenanceStatus, setToolMaintenanceMode, ToolMaintenanceStatus } from '@/lib/tool-maintenance-api'
import { useAuth } from '@/contexts/auth-context'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'

export default function AccessControlPage() {
  const { user, adminUser } = useAuth()
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
  
  const {
    currentMode: emergencyMode,
    presets,
    loading: emergencyLoading,
    error: emergencyError,
    activateMode,
    deactivateMode
  } = useEmergencySecurityMode()
  
  const [activeTab, setActiveTab] = useState<'features' | 'system' | 'tool' | 'emergency'>('features')
  
  // ツール側メンテナンス状態
  const [toolMaintenance, setToolMaintenance] = useState<ToolMaintenanceStatus | null>(null)
  const [toolMaintenanceLoading, setToolMaintenanceLoading] = useState(false)
  const [toolMaintenanceError, setToolMaintenanceError] = useState<string | null>(null)
  const [toolMaintenanceSuccess, setToolMaintenanceSuccess] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // フォーム状態
  const [enabled, setEnabled] = useState(false)
  const [message, setMessage] = useState('')
  const [scheduledStart, setScheduledStart] = useState('')
  const [scheduledEnd, setScheduledEnd] = useState('')

  // ツール側メンテナンス状態を取得
  const fetchToolMaintenanceStatus = async () => {
    try {
      setToolMaintenanceLoading(true)
      setToolMaintenanceError(null)
      const status = await getToolMaintenanceStatus()
      setToolMaintenance(status)
      setEnabled(status.enabled)
      setMessage(status.message || '')
      setScheduledStart(status.scheduledStart || '')
      setScheduledEnd(status.scheduledEnd || '')
    } catch (err) {
      // CORSエラーやAPI未実装の場合は、エラーを表示せずにデフォルト値を維持
      const error = err instanceof Error ? err.message : String(err)
      const isCorsError = error.includes('CORS') || error.includes('Failed to fetch')
      const isNetworkError = error.includes('404') || error.includes('NetworkError') || error.includes('ERR_FAILED')
      
      if (isCorsError || isNetworkError) {
        // APIエンドポイントが未実装またはCORS設定不足の場合は、エラーメッセージを設定せずにデフォルト状態を維持
        setToolMaintenanceError(null)
        // コンソールには警告のみ（開発時のみ）
        if (process.env.NODE_ENV === 'development') {
          console.warn('Tool maintenance API endpoint not available or CORS not configured. Using default state.')
        }
      } else {
        // その他のエラーは表示
        setToolMaintenanceError('ツール側メンテナンス状態の取得に失敗しました')
      }
    } finally {
      setToolMaintenanceLoading(false)
    }
  }

  // メンテナンスモードを設定（詳細設定フォーム用）
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setToolMaintenanceError(null)
    setToolMaintenanceSuccess(null)

    try {
      const result = await setToolMaintenanceMode({
        enabled,
        message: message || undefined,
        scheduledStart: scheduledStart || undefined,
        scheduledEnd: scheduledEnd || undefined,
        updatedBy: user?.email || adminUser?.email || user?.uid || 'admin',
      })

      setToolMaintenance(result)
      setToolMaintenanceSuccess(enabled ? 'メンテナンスモードを開始しました' : 'メンテナンスモードを終了しました')
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err)
      const isCorsError = error.includes('CORS') || error.includes('Failed to fetch')
      const isNetworkError = error.includes('404') || error.includes('NetworkError') || error.includes('ERR_FAILED')
      
      if (isCorsError || isNetworkError) {
        setToolMaintenanceError('APIエンドポイントが実装されていないか、CORS設定が必要です')
      } else {
        setToolMaintenanceError(err instanceof Error ? err.message : '設定に失敗しました')
      }
    } finally {
      setSaving(false)
    }
  }

  // メンテナンス開始（即座）
  const handleStartMaintenance = async () => {
    setSaving(true)
    setToolMaintenanceError(null)
    setToolMaintenanceSuccess(null)

    try {
      const result = await setToolMaintenanceMode({
        enabled: true,
        message: message || 'システムメンテナンス中です。しばらくお待ちください。',
        updatedBy: user?.email || adminUser?.email || user?.uid || 'admin',
      })

      setToolMaintenance(result)
      setEnabled(true)
      setMessage(result.message)
      setToolMaintenanceSuccess('メンテナンスモードを開始しました')
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err)
      const isCorsError = error.includes('CORS') || error.includes('Failed to fetch')
      const isNetworkError = error.includes('404') || error.includes('NetworkError') || error.includes('ERR_FAILED')
      
      if (isCorsError || isNetworkError) {
        setToolMaintenanceError('APIエンドポイントが実装されていないか、CORS設定が必要です')
      } else {
        setToolMaintenanceError(err instanceof Error ? err.message : 'メンテナンス開始に失敗しました')
      }
    } finally {
      setSaving(false)
    }
  }

  // メンテナンス終了
  const handleEndMaintenance = async () => {
    setSaving(true)
    setToolMaintenanceError(null)
    setToolMaintenanceSuccess(null)

    try {
      const result = await setToolMaintenanceMode({
        enabled: false,
        message: '',
        updatedBy: user?.email || adminUser?.email || user?.uid || 'admin',
      })

      setToolMaintenance(result)
      setEnabled(false)
      setMessage('')
      setScheduledStart('')
      setScheduledEnd('')
      setToolMaintenanceSuccess('メンテナンスモードを終了しました')
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err)
      const isCorsError = error.includes('CORS') || error.includes('Failed to fetch')
      const isNetworkError = error.includes('404') || error.includes('NetworkError') || error.includes('ERR_FAILED')
      
      if (isCorsError || isNetworkError) {
        setToolMaintenanceError('APIエンドポイントが実装されていないか、CORS設定が必要です')
      } else {
        setToolMaintenanceError(err instanceof Error ? err.message : 'メンテナンス終了に失敗しました')
      }
    } finally {
      setSaving(false)
    }
  }

  // 初期化時にツール側メンテナンス状態を取得
  useEffect(() => {
    fetchToolMaintenanceStatus()
  }, [])

  // ツール側メンテナンス状態が更新されたらフォーム状態も更新
  useEffect(() => {
    if (toolMaintenance) {
      setEnabled(toolMaintenance.enabled)
      setMessage(toolMaintenance.message || '')
      setScheduledStart(toolMaintenance.scheduledStart || '')
      setScheduledEnd(toolMaintenance.scheduledEnd || '')
    }
  }, [toolMaintenance])

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
    { id: 'emergency', label: '緊急セキュリティ', icon: '🚨' },
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
            {(error || statusError || emergencyError) && (
              <span className="text-destructive ml-2">
                ({error || statusError || emergencyError})
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
        {activeTab === 'emergency' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">緊急セキュリティモード</h2>
              <p className="text-muted-foreground mb-6">
                脆弱性発見時など、緊急時にユーザーアクセスを制限します。全ブロックまたは部分ブロックが可能です。
              </p>
            </div>
            
            <EmergencySecurityCard
              currentMode={emergencyMode}
              presets={presets}
              onActivate={activateMode}
              onDeactivate={deactivateMode}
              loading={emergencyLoading}
            />
          </div>
        )}

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
              {(toolMaintenanceError === null || toolMaintenanceError.includes('APIエンドポイント') || toolMaintenanceError.includes('CORS')) && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-sm text-blue-800">
                    <AlertTriangle className="h-4 w-4 inline mr-1" />
                    <strong>情報:</strong> ツール側メンテナンス機能は、Cloud Functionsの実装とCORS設定が必要です。現在はローカルの状態のみ表示されます。
                  </p>
                  <details className="mt-2 text-xs text-blue-700">
                    <summary className="cursor-pointer hover:text-blue-900">実装時の設定方法</summary>
                    <div className="mt-2 p-2 bg-blue-100 rounded">
                      <p className="mb-1"><strong>Cloud Functionsで実装する場合:</strong></p>
                      <pre className="text-xs bg-white p-2 rounded overflow-x-auto">
{`exports.getToolMaintenanceStatus = functions.https.onRequest((req, res) => {
  // CORS設定
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  
  // 実装...
});`}
                      </pre>
                    </div>
                  </details>
                </div>
              )}
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
                ) : toolMaintenanceError && !toolMaintenanceError.includes('APIエンドポイント') ? (
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
                ) : toolMaintenance ? (
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
                ) : (
                  <div className="text-muted-foreground">
                    状態を取得できませんでした
                  </div>
                )}
              </CardContent>
            </Card>

            {/* エラー・成功メッセージ */}
            {toolMaintenanceError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {toolMaintenanceError}
              </div>
            )}
            {toolMaintenanceSuccess && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                {toolMaintenanceSuccess}
              </div>
            )}

            {/* クイックアクション */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  クイックアクション
                </CardTitle>
                <CardDescription>
                  メンテナンスモードを即座に開始・終了します
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <Button
                    onClick={handleStartMaintenance}
                    disabled={saving || toolMaintenance?.enabled}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Wrench className="h-4 w-4 mr-2" />
                    )}
                    メンテナンス開始
                  </Button>
                  
                  <Button
                    onClick={handleEndMaintenance}
                    disabled={saving || !toolMaintenance?.enabled}
                    variant="outline"
                    className="border-green-600 text-green-600 hover:bg-green-50"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Activity className="h-4 w-4 mr-2" />
                    )}
                    メンテナンス終了
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 詳細設定フォーム */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  詳細設定
                </CardTitle>
                <CardDescription>
                  メッセージやスケジュールを設定してメンテナンスモードを制御します
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* メンテナンスモード有効化 */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="enabled"
                      checked={enabled}
                      onCheckedChange={(checked) => setEnabled(checked === true)}
                    />
                    <Label htmlFor="enabled" className="font-semibold cursor-pointer">
                      メンテナンスモードを有効化
                    </Label>
                  </div>

                  {/* メッセージ */}
                  <div>
                    <Label htmlFor="message" className="block text-sm font-medium mb-2">
                      メンテナンスメッセージ
                    </Label>
                    <Textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={4}
                      placeholder="システムメンテナンス中です。しばらくお待ちください。"
                    />
                  </div>

                  {/* スケジュール開始 */}
                  <div>
                    <Label htmlFor="scheduledStart" className="block text-sm font-medium mb-2">
                      スケジュール開始日時（オプション）
                    </Label>
                    <Input
                      type="datetime-local"
                      id="scheduledStart"
                      value={scheduledStart}
                      onChange={(e) => setScheduledStart(e.target.value)}
                    />
                  </div>

                  {/* スケジュール終了 */}
                  <div>
                    <Label htmlFor="scheduledEnd" className="block text-sm font-medium mb-2">
                      スケジュール終了日時（オプション）
                    </Label>
                    <Input
                      type="datetime-local"
                      id="scheduledEnd"
                      value={scheduledEnd}
                      onChange={(e) => setScheduledEnd(e.target.value)}
                    />
                  </div>

                  {/* 送信ボタン */}
                  <div>
                    <Button
                      type="submit"
                      disabled={saving}
                      className="w-full"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          保存中...
                        </>
                      ) : (
                        '設定を保存'
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
