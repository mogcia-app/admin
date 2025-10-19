'use client'

import React, { useState } from 'react'
import { AlertTriangle, TrendingUp, Loader2, RefreshCw, BarChart3, DollarSign, Briefcase, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ErrorMonitor } from '@/components/monitoring/error-monitor'
import { SalesTracker } from '@/components/monitoring/sales-tracker'
import { PieChart } from '@/components/charts/pie-chart'
import { BarChart } from '@/components/charts/bar-chart'
import { useErrorLogs, useSalesProgress, useDeals, useErrorStats, useSalesStats } from '@/hooks/useMonitoring'

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
    salesProgress, 
    loading: salesLoading, 
    error: salesError, 
    updateProgress, 
    refreshSalesProgress 
  } = useSalesProgress()
  
  const { 
    deals, 
    loading: dealsLoading, 
    error: dealsError, 
    updateDeal, 
    refreshDeals 
  } = useDeals()
  
  const { 
    stats: errorStats, 
    loading: errorStatsLoading, 
    refreshStats: refreshErrorStats 
  } = useErrorStats()
  
  const { 
    stats: salesStats, 
    loading: salesStatsLoading, 
    refreshStats: refreshSalesStats 
  } = useSalesStats()

  const [activeView, setActiveView] = useState<'overview' | 'errors' | 'sales'>('overview')


  const handleRefresh = () => {
    refreshErrorLogs()
    refreshSalesProgress()
    refreshDeals()
    refreshErrorStats()
    refreshSalesStats()
  }

  // エラーレベル別チャートデータ
  const errorLevelData = Object.entries(errorStats.errorsByLevel).map(([level, count]) => ({
    x: level,
    y: count,
    label: `${level}: ${count}件`,
    color: level === 'fatal' ? '#ef4444' : 
           level === 'error' ? '#f97316' : 
           level === 'warn' ? '#eab308' : '#3b82f6'
  }))

  // 案件ステージ別チャートデータ
  const dealStageData = [{
    name: '案件ステージ',
    data: Object.entries(salesStats.dealsByStage).map(([stage, count]) => ({
      x: stage === 'lead' ? 'リード' :
         stage === 'qualified' ? '見込み客' :
         stage === 'proposal' ? '提案' :
         stage === 'negotiation' ? '交渉' :
         stage === 'closed_won' ? '受注' :
         stage === 'closed_lost' ? '失注' : stage,
      y: count,
      label: `${stage}: ${count}件`
    })),
    color: '#3b82f6'
  }]

  const tabs = [
    { id: 'overview', label: '概要', icon: '📊' },
    { id: 'errors', label: 'エラー監視', icon: '⚠️' },
    { id: 'sales', label: '営業進捗', icon: '📈' }
  ]

  const anyError = errorError || salesError || dealsError
  const anyLoading = errorLoading || salesLoading || dealsLoading || errorStatsLoading || salesStatsLoading

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">エラー監視・営業進捗管理</h1>
          <p className="text-muted-foreground">
            システムエラーの監視と営業活動の進捗管理
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
            <CardTitle className="text-sm font-medium">総エラー数</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{errorStats.totalErrors}</div>
            <p className="text-xs text-muted-foreground">
              未解決 {errorStats.unresolvedErrors}件
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">重要エラー</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{errorStats.criticalErrors}</div>
            <p className="text-xs text-muted-foreground">
              要対応
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総売上</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {new Intl.NumberFormat('ja-JP', {
                style: 'currency',
                currency: 'JPY',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(salesStats.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              受注率 {salesStats.conversionRate.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">案件数</CardTitle>
            <Briefcase className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{salesStats.totalDeals}</div>
            <p className="text-xs text-muted-foreground">
              受注 {salesStats.closedDeals}件
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
              onClick={() => setActiveView(tab.id as 'overview' | 'errors' | 'sales')}
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

              {/* 案件ステージ別分布 */}
              <BarChart
                data={dealStageData}
                config={{
                  title: '案件ステージ別分布',
                  subtitle: '営業案件の進捗状況',
                  height: 350,
                  showLegend: false
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
                {errorStats.recentErrors.length > 0 ? (
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

            {/* 月次営業実績サマリー */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  月次営業実績サマリー
                </CardTitle>
                <CardDescription>最近の営業成果</CardDescription>
              </CardHeader>
              <CardContent>
                {salesStats.monthlyProgress.length > 0 ? (
                  <div className="space-y-4">
                    {salesStats.monthlyProgress.slice(0, 3).map((progress) => {
                      const achievementRate = (progress.achieved / progress.target) * 100
                      
                      return (
                        <div key={progress.id} className="flex items-center justify-between p-3 border rounded">
                          <div className="space-y-1">
                            <div className="flex items-center gap-3">
                              <span className="font-medium">
                                {new Date(progress.period).toLocaleDateString('ja-JP', {
                                  year: 'numeric',
                                  month: 'long'
                                })}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {progress.salesRep}
                              </span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              目標: {new Intl.NumberFormat('ja-JP', {
                                style: 'currency',
                                currency: 'JPY',
                                minimumFractionDigits: 0,
                              }).format(progress.target)} • 
                              実績: {new Intl.NumberFormat('ja-JP', {
                                style: 'currency',
                                currency: 'JPY',
                                minimumFractionDigits: 0,
                              }).format(progress.achieved)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-lg font-bold ${
                              achievementRate >= 100 ? 'text-green-600' :
                              achievementRate >= 80 ? 'text-blue-600' :
                              'text-orange-600'
                            }`}>
                              {achievementRate.toFixed(1)}%
                            </div>
                            <div className="text-xs text-muted-foreground">達成率</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <BarChart3 className="h-8 w-8 mx-auto mb-2" />
                    <p>営業実績データがありません</p>
                  </div>
                )}
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

        {activeView === 'sales' && (
          <SalesTracker
            salesProgress={salesProgress}
            deals={deals}
            loading={anyLoading}
            onUpdateProgress={updateProgress}
            onUpdateDeal={updateDeal}
          />
        )}
      </div>
    </div>
  )
}
