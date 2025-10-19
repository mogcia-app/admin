'use client'

import React, { useState } from 'react'
import { BarChart3, Loader2, RefreshCw, TrendingUp, PieChart, LineChart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AnalyticsDashboard } from '@/components/charts/analytics-dashboard'
import { LineChart as CustomLineChart } from '@/components/charts/line-chart'
import { BarChart as CustomBarChart } from '@/components/charts/bar-chart'
import { PieChart as CustomPieChart } from '@/components/charts/pie-chart'
import { useKPIDashboard } from '@/hooks/useKPI'

export default function AnalyticsPage() {
  const { dashboardData, loading, error, refreshData } = useKPIDashboard()
  const [activeView, setActiveView] = useState<'dashboard' | 'examples'>('dashboard')


  const handleRefresh = () => {
    refreshData()
  }

  // サンプルチャートデータ
  const sampleLineData = [
    {
      name: '売上',
      data: [
        { x: '1月', y: 1200000, label: '1月: ¥1,200,000' },
        { x: '2月', y: 1350000, label: '2月: ¥1,350,000' },
        { x: '3月', y: 1180000, label: '3月: ¥1,180,000' },
        { x: '4月', y: 1420000, label: '4月: ¥1,420,000' },
        { x: '5月', y: 1680000, label: '5月: ¥1,680,000' },
        { x: '6月', y: 1850000, label: '6月: ¥1,850,000' }
      ],
      color: '#3b82f6',
      type: 'line' as const
    }
  ]

  const sampleBarData = [
    {
      name: 'ユーザー獲得',
      data: [
        { x: 'オーガニック', y: 156, label: 'オーガニック: 156人' },
        { x: '有料広告', y: 89, label: '有料広告: 89人' },
        { x: '紹介', y: 67, label: '紹介: 67人' },
        { x: 'ソーシャル', y: 43, label: 'ソーシャル: 43人' },
        { x: 'ダイレクト', y: 31, label: 'ダイレクト: 31人' }
      ],
      color: '#10b981',
      type: 'bar' as const
    }
  ]

  const samplePieData = [
    { x: 'プロフェッショナル', y: 60, label: 'プロフェッショナル: 60%', color: '#3b82f6' },
    { x: 'ベーシック', y: 30, label: 'ベーシック: 30%', color: '#10b981' },
    { x: 'エンタープライズ', y: 10, label: 'エンタープライズ: 10%', color: '#f59e0b' }
  ]

  const tabs = [
    { id: 'dashboard', label: '高度な分析', icon: '📊' },
    { id: 'examples', label: 'チャート例', icon: '📈' }
  ]

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">データ可視化・分析</h1>
          <p className="text-muted-foreground">
            高度なチャートとグラフでデータを可視化・分析
            {error && <span className="text-destructive ml-2">({error})</span>}
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
            <CardTitle className="text-sm font-medium">利用可能チャート</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">種類</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">線グラフ</CardTitle>
            <LineChart className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">✓</div>
            <p className="text-xs text-muted-foreground">トレンド分析</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">棒グラフ</CardTitle>
            <BarChart3 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">✓</div>
            <p className="text-xs text-muted-foreground">比較分析</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">円グラフ</CardTitle>
            <PieChart className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">✓</div>
            <p className="text-xs text-muted-foreground">構成比分析</p>
          </CardContent>
        </Card>
      </div>

      {/* タブナビゲーション */}
      <div className="border-b">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id as 'dashboard' | 'examples')}
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
        {activeView === 'dashboard' && (
          <AnalyticsDashboard
            data={dashboardData}
            loading={loading}
            onRefresh={refreshData}
          />
        )}

        {activeView === 'examples' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-semibold mb-4">チャート例とデモ</h2>
              <p className="text-muted-foreground mb-6">
                各種チャートの表示例とインタラクティブ機能をご確認いただけます。
              </p>
            </div>

            {/* 線グラフ例 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <LineChart className="h-5 w-5 text-blue-600" />
                線グラフ - トレンド分析
              </h3>
              <CustomLineChart
                data={sampleLineData}
                config={{
                  title: '月別売上推移',
                  subtitle: '2024年上半期の売上トレンド',
                  xAxisLabel: '月',
                  yAxisLabel: '売上 (円)',
                  height: 350,
                  showGrid: true,
                  showLegend: true
                }}
              />
            </div>

            {/* 棒グラフ例 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-green-600" />
                棒グラフ - 比較分析
              </h3>
              <CustomBarChart
                data={sampleBarData}
                config={{
                  title: 'ユーザー獲得チャネル別実績',
                  subtitle: '各獲得チャネルの新規ユーザー数',
                  xAxisLabel: '獲得チャネル',
                  yAxisLabel: 'ユーザー数 (人)',
                  height: 350,
                  showGrid: true,
                  showLegend: false
                }}
              />
            </div>

            {/* 円グラフ例 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <PieChart className="h-5 w-5 text-orange-600" />
                円グラフ - 構成比分析
              </h3>
              <CustomPieChart
                data={samplePieData}
                config={{
                  title: 'プラン別契約構成比',
                  subtitle: '各プランの契約割合',
                  height: 400,
                  showLegend: true
                }}
              />
            </div>

            {/* 機能説明 */}
            <Card>
              <CardHeader>
                <CardTitle>チャート機能一覧</CardTitle>
                <CardDescription>実装されている可視化機能</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-3">
                    <h4 className="font-medium">基本機能</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• インタラクティブツールチップ</li>
                      <li>• ホバー効果とアニメーション</li>
                      <li>• レスポンシブデザイン</li>
                      <li>• カスタムカラーパレット</li>
                      <li>• 凡例表示</li>
                    </ul>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-medium">高度な機能</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• 移動平均表示</li>
                      <li>• トレンド分析</li>
                      <li>• データフィルタリング</li>
                      <li>• 期間選択</li>
                      <li>• エクスポート機能</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
