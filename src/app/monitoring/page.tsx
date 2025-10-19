'use client'

import React, { useState, useEffect } from 'react'
import { AlertTriangle, Loader2, RefreshCw, CheckCircle, Bell, Activity } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ErrorMonitor } from '@/components/monitoring/error-monitor'
import { PieChart } from '@/components/charts/pie-chart'
import { useErrorLogs, useErrorStats } from '@/hooks/useMonitoring'

export default function MonitoringPage() {
  const { 
    errorLogs, 
    loading: errorLoading, 
    error: errorError, 
    resolveError, 
    updateError, 
    refreshErrorLogs 
  } = useErrorLogs()
  
  const { 
    stats: errorStats, 
    loading: errorStatsLoading, 
    refreshStats: refreshErrorStats 
  } = useErrorStats()

  const [activeView, setActiveView] = useState<'overview' | 'errors'>('overview')
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())


  const handleRefresh = () => {
    refreshErrorLogs()
    refreshErrorStats()
    setLastUpdate(new Date())
  }

  // リアルタイム監視の設定
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isRealTimeEnabled) {
      interval = setInterval(() => {
        handleRefresh()
      }, 30000) // 30秒ごとに更新
    }

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [isRealTimeEnabled])

  // エラーレベル別チャートデータ
  const errorLevelData = Object.entries(errorStats.errorsByLevel || {}).map(([level, count]) => ({
    x: level,
    y: count,
    label: `${level}: ${count}件`,
    color: level === 'fatal' ? '#ef4444' : 
           level === 'error' ? '#f97316' : 
           level === 'warn' ? '#eab308' : '#3b82f6'
  }))

  // エラーソース別チャートデータ
  const errorSourceData = Object.entries(errorStats.errorsBySource || {}).map(([source, count]) => ({
    x: source,
    y: count,
    label: `${source}: ${count}件`,
    color: '#3b82f6'
  }))

  const tabs = [
    { id: 'overview', label: '概要', icon: '📊' },
    { id: 'errors', label: 'エラー監視', icon: '⚠️' }
  ]

  const anyError = errorError
  const anyLoading = errorLoading || errorStatsLoading

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">エラー監視システム</h1>
          <p className="text-muted-foreground">
            システムエラーの監視と管理
            {anyError && <span className="text-destructive ml-2">({anyError})</span>}
            {isRealTimeEnabled && (
              <span className="text-green-600 ml-2">
                • 最終更新: {lastUpdate.toLocaleTimeString('ja-JP')}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setIsRealTimeEnabled(!isRealTimeEnabled)}
            variant={isRealTimeEnabled ? "default" : "outline"}
            className={isRealTimeEnabled ? "bg-green-600 hover:bg-green-700" : ""}
          >
            <Activity className="h-4 w-4 mr-2" />
            {isRealTimeEnabled ? 'リアルタイム監視中' : 'リアルタイム監視開始'}
          </Button>
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
            <CardTitle className="text-sm font-medium">総エラー数</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{errorStats.totalErrors || 0}</div>
            <p className="text-xs text-muted-foreground">
              未解決 {errorStats.unresolvedErrors || 0}件
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">重要エラー</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{errorStats.criticalErrors || 0}</div>
            <p className="text-xs text-muted-foreground">
              要対応
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">エラーソース数</CardTitle>
            <Activity className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {Object.keys(errorStats.errorsBySource || {}).length}
            </div>
            <p className="text-xs text-muted-foreground">
              監視中システム
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">解決済み</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {(errorStats.totalErrors || 0) - (errorStats.unresolvedErrors || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              解決済みエラー
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
              onClick={() => setActiveView(tab.id as 'overview' | 'errors')}
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
        {activeView === 'overview' && (
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* エラーレベル別分布 */}
              <PieChart
                data={errorLevelData}
                config={{
                  title: 'エラーレベル別分布',
                  subtitle: 'システムエラーの重要度別内訳',
                  height: 350
                }}
              />

              {/* エラーソース別分布 */}
              <PieChart
                data={errorSourceData}
                config={{
                  title: 'エラーソース別分布',
                  subtitle: 'システム別エラー発生状況',
                  height: 350
                }}
              />
            </div>

            {/* 最新の重要エラー */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  最新の重要エラー
                </CardTitle>
                <CardDescription>直近の未解決エラー（上位5件）</CardDescription>
              </CardHeader>
              <CardContent>
                {errorStats.recentErrors && errorStats.recentErrors.length > 0 ? (
                  <div className="space-y-3">
                    {errorStats.recentErrors.slice(0, 5).map((error) => (
                      <div key={error.id} className="flex items-center justify-between p-3 border rounded">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              error.level === 'fatal' ? 'bg-red-100 text-red-800' :
                              error.level === 'error' ? 'bg-orange-100 text-orange-800' :
                              error.level === 'warn' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {error.level.toUpperCase()}
                            </span>
                            <span className="font-medium">{error.message}</span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(error.timestamp).toLocaleString('ja-JP')} • {error.source}
                          </div>
                        </div>
                        {!error.resolved && (
                          <Button
                            size="sm"
                            onClick={() => resolveError(error.id, 'admin_001')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            解決
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <p>重要なエラーはありません</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* エラー監視設定 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-blue-600" />
                  エラー監視設定
                </CardTitle>
                <CardDescription>別プロジェクトからのエラー送信設定</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg bg-blue-50">
                    <h4 className="font-medium text-blue-900 mb-2">エラー送信API</h4>
                    <p className="text-sm text-blue-700 mb-3">
                      別プロジェクト（ツール側）からエラーを送信するためのAPIエンドポイント
                    </p>
                    <div className="bg-white p-3 rounded border font-mono text-sm">
                      POST {process.env.NEXT_PUBLIC_FUNCTIONS_BASE_URL}/reportError
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-lg bg-green-50">
                    <h4 className="font-medium text-green-900 mb-2">送信データ形式</h4>
                    <pre className="text-sm text-green-700 bg-white p-3 rounded border overflow-x-auto">
{`{
  "level": "error|warn|info|fatal",
  "message": "エラーメッセージ",
  "source": "プロジェクト名",
  "stack": "スタックトレース（任意）",
  "metadata": {
    "userId": "ユーザーID（任意）",
    "sessionId": "セッションID（任意）"
  }
}`}
                    </pre>
                  </div>
                  
                  <div className="p-4 border rounded-lg bg-yellow-50">
                    <h4 className="font-medium text-yellow-900 mb-2">使用例（JavaScript）</h4>
                    <pre className="text-sm text-yellow-700 bg-white p-3 rounded border overflow-x-auto">
{`// 別プロジェクト（ツール側）での使用例
async function reportError(error, source = 'tool-project') {
  try {
    const response = await fetch('${process.env.NEXT_PUBLIC_FUNCTIONS_BASE_URL}/reportError', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        level: 'error',
        message: error.message,
        source: source,
        stack: error.stack,
        metadata: {
          userId: getCurrentUserId(),
          url: window.location.href
        }
      })
    });
    
    if (response.ok) {
      console.log('Error reported successfully');
    }
  } catch (err) {
    console.error('Failed to report error:', err);
  }
}

// 使用例
try {
  // 何らかの処理
} catch (error) {
  reportError(error, 'tool-project');
}`}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeView === 'errors' && (
          <ErrorMonitor
            errors={errorLogs}
            loading={anyLoading}
            onResolveError={resolveError}
            onUpdateError={updateError}
          />
        )}
      </div>
    </div>
  )
}
