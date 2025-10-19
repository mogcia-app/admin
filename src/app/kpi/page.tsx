'use client'

import React, { useState } from 'react'
import { RefreshCw, Loader2, Calendar, Download, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { KPIOverview } from '@/components/kpi/kpi-overview'
import { RevenueChart } from '@/components/kpi/revenue-chart'
import { UserAcquisitionChart } from '@/components/kpi/user-acquisition-chart'
import { KPIMetrics } from '@/components/kpi/kpi-metrics'
import { useKPIDashboard, useKPIMetrics } from '@/hooks/useKPI'

export default function KPIPage() {
  const { dashboardData, loading: dashboardLoading, error: dashboardError, refreshData } = useKPIDashboard()
  const { metrics, loading: metricsLoading, error: metricsError } = useKPIMetrics()
  const [activeTab, setActiveTab] = useState<'overview' | 'revenue' | 'users' | 'metrics'>('overview')


  const handleRefresh = () => {
    refreshData()
  }

  const tabs = [
    { id: 'overview', label: '概要', icon: '📊' },
    { id: 'revenue', label: '売上', icon: '💰' },
    { id: 'users', label: 'ユーザー', icon: '👥' },
    { id: 'metrics', label: 'KPIメトリクス', icon: '🎯' }
  ]

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">KPIダッシュボード</h1>
          <p className="text-muted-foreground">
            売上・ユーザー獲得・KPI指標の包括的な分析
            {(dashboardError || metricsError) && (
              <span className="text-destructive ml-2">
                ({dashboardError || metricsError})
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            更新
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            エクスポート
          </Button>
        </div>
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
        {activeTab === 'overview' && (
          <>
            {/* KPI概要 */}
            {dashboardData ? (
              <KPIOverview 
                data={dashboardData.overview} 
                loading={dashboardLoading}
              />
            ) : (
              <Card>
                <CardContent className="p-6">
                  <div className="text-center text-muted-foreground">
                    <p>KPIデータを読み込み中...</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* チャート概要 */}
            <div className="grid gap-6 lg:grid-cols-2">
              {dashboardData ? (
                <>
                  <RevenueChart 
                    data={dashboardData.revenueMetrics.monthlyRevenue}
                    loading={dashboardLoading}
                  />
                  <Card>
                    <CardHeader>
                      <CardTitle>主要指標</CardTitle>
                      <CardDescription>重要なKPI指標の一覧</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">売上成長率</span>
                          <span className="text-sm text-green-600 font-semibold">
                            +{dashboardData.revenueMetrics.revenueGrowth.toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">トライアル→有料転換率</span>
                          <span className="text-sm text-blue-600 font-semibold">
                            {dashboardData.conversionMetrics.trialToPayingConversion.toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">サインアップ→トライアル転換率</span>
                          <span className="text-sm text-purple-600 font-semibold">
                            {dashboardData.conversionMetrics.signupToTrialConversion.toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">チャーンレート</span>
                          <span className="text-sm text-orange-600 font-semibold">
                            {dashboardData.overview.churnRate.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <div className="col-span-2">
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-center text-muted-foreground">
                        <p>データを読み込み中...</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'revenue' && (
          <div className="space-y-6">
            {dashboardData ? (
              <>
                {/* 売上概要カード */}
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">総売上</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {new Intl.NumberFormat('ja-JP', {
                          style: 'currency',
                          currency: 'JPY'
                        }).format(dashboardData.overview.totalRevenue)}
                      </div>
                      <p className="text-xs text-green-600 mt-1">
                        +{dashboardData.revenueMetrics.revenueGrowth.toFixed(1)}% vs 先月
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">MRR</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {new Intl.NumberFormat('ja-JP', {
                          style: 'currency',
                          currency: 'JPY'
                        }).format(dashboardData.overview.monthlyRecurringRevenue)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        月間経常収益
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">ARPU</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {new Intl.NumberFormat('ja-JP', {
                          style: 'currency',
                          currency: 'JPY'
                        }).format(dashboardData.overview.averageRevenuePerUser)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        ユーザー当たり平均売上
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* 売上チャート */}
                <RevenueChart 
                  data={dashboardData.revenueMetrics.monthlyRevenue}
                  loading={dashboardLoading}
                />

                {/* 売上内訳 */}
                <div className="grid gap-6 lg:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>収益源別内訳</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {Object.entries(dashboardData.revenueMetrics.revenueBySource).map(([source, amount]) => {
                          const percentage = dashboardData.overview.totalRevenue > 0 
                            ? (amount / dashboardData.overview.totalRevenue) * 100 
                            : 0
                          
                          return (
                            <div key={source} className="flex justify-between items-center">
                              <span className="text-sm font-medium capitalize">{source}</span>
                              <div className="text-right">
                                <div className="text-sm font-semibold">
                                  {new Intl.NumberFormat('ja-JP', {
                                    style: 'currency',
                                    currency: 'JPY'
                                  }).format(amount)}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {percentage.toFixed(1)}%
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>プラン別売上</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {Object.entries(dashboardData.revenueMetrics.revenueByPlan).map(([plan, amount]) => {
                          const percentage = dashboardData.overview.totalRevenue > 0 
                            ? (amount / dashboardData.overview.totalRevenue) * 100 
                            : 0
                          
                          return (
                            <div key={plan} className="flex justify-between items-center">
                              <span className="text-sm font-medium capitalize">{plan}</span>
                              <div className="text-right">
                                <div className="text-sm font-semibold">
                                  {new Intl.NumberFormat('ja-JP', {
                                    style: 'currency',
                                    currency: 'JPY'
                                  }).format(amount)}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {percentage.toFixed(1)}%
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            ) : (
              <Card>
                <CardContent className="p-6">
                  <div className="text-center text-muted-foreground">
                    <p>売上データを読み込み中...</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-6">
            {dashboardData ? (
              <>
                {/* ユーザー概要カード */}
                <div className="grid gap-4 md:grid-cols-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">総ユーザー数</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {dashboardData.overview.totalUsers.toLocaleString()}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">アクティブユーザー</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {dashboardData.overview.activeUsers.toLocaleString()}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">新規ユーザー</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {dashboardData.overview.newUsersThisMonth.toLocaleString()}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        今月
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">チャーンレート</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {dashboardData.overview.churnRate.toFixed(1)}%
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* ユーザー獲得チャート */}
                <UserAcquisitionChart 
                  data={dashboardData.userMetrics.userGrowth}
                  loading={dashboardLoading}
                />
              </>
            ) : (
              <Card>
                <CardContent className="p-6">
                  <div className="text-center text-muted-foreground">
                    <p>ユーザーデータを読み込み中...</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'metrics' && (
          <div className="space-y-6">
            {metricsLoading ? (
              <Card>
                <CardContent className="p-6">
                  <div className="text-center text-muted-foreground">
                    <p>KPIメトリクスを読み込み中...</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <KPIMetrics 
                metrics={metrics} 
                loading={metricsLoading}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
