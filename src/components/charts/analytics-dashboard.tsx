'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LineChart } from './line-chart'
import { BarChart } from './bar-chart'
import { PieChart } from './pie-chart'
import { transformKPIDataForChart, calculateTrend, calculateMovingAverage, DEFAULT_COLORS } from '@/lib/charts'
import { KPIDashboardData } from '@/types'
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart as PieChartIcon, 
  LineChart as LineChartIcon,
  Download,
  RefreshCw,
  Filter,
  Calendar
} from 'lucide-react'

interface AnalyticsDashboardProps {
  data: KPIDashboardData | null
  loading: boolean
  onRefresh?: () => void
}

export function AnalyticsDashboard({ data, loading, onRefresh }: AnalyticsDashboardProps) {
  const [selectedMetric, setSelectedMetric] = useState<'revenue' | 'users' | 'engagement' | 'retention'>('revenue')
  const [chartType, setChartType] = useState<'line' | 'bar' | 'pie'>('line')
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d')
  const [showMovingAverage, setShowMovingAverage] = useState(false)

  // チャートデータの生成
  const chartData = data ? transformKPIDataForChart(data, selectedMetric) : []

  // トレンド分析
  const trendData = chartData.length > 0 ? 
    calculateTrend(chartData[0].data.map(point => point.y)) : 
    { trend: 'neutral' as const, percentage: 0 }

  // 移動平均の計算
  const movingAverageData = showMovingAverage && chartData.length > 0 ? 
    calculateMovingAverage(chartData[0].data.map(point => point.y), 7) : 
    []

  // 拡張チャートデータ（移動平均を含む）
  const enhancedChartData = showMovingAverage && movingAverageData.length > 0 ? [
    ...chartData,
    {
      name: '移動平均 (7日)',
      data: chartData[0].data.map((point, index) => ({
        ...point,
        y: movingAverageData[index] || 0
      })),
      color: '#94a3b8',
      type: 'line' as const
    }
  ] : chartData

  // パイチャート用データの変換
  const pieChartData = selectedMetric === 'revenue' && data ? 
    Object.entries(data.revenueMetrics.revenueBySource).map(([source, amount]) => ({
      x: source,
      y: amount,
      label: `${source}: ${amount.toLocaleString()}円`
    })) : 
    selectedMetric === 'users' && data ?
    Object.entries(data.userMetrics.acquisitionBySource).map(([source, count]) => ({
      x: source,
      y: count,
      label: `${source}: ${count}人`
    })) : []

  const getMetricTitle = (metric: string) => {
    switch (metric) {
      case 'revenue': return '売上分析'
      case 'users': return 'ユーザー分析'
      case 'engagement': return 'エンゲージメント分析'
      case 'retention': return 'リテンション分析'
      default: return '分析'
    }
  }

  const getMetricDescription = (metric: string) => {
    switch (metric) {
      case 'revenue': return '売上推移と収益源の分析'
      case 'users': return 'ユーザー獲得と成長の分析'
      case 'engagement': return 'ユーザーエンゲージメントの分析'
      case 'retention': return 'ユーザー継続率の分析'
      default: return 'データの詳細分析'
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />
      default: return <BarChart3 className="h-4 w-4 text-gray-600" />
    }
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-green-600'
      case 'down': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-muted rounded w-1/3"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </CardHeader>
          <CardContent>
            <div className="h-80 bg-muted rounded"></div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* コントロールパネル */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>高度な分析ダッシュボード</CardTitle>
              <CardDescription>データを多角的に分析・可視化</CardDescription>
            </div>
            <div className="flex gap-2">
              {onRefresh && (
                <Button variant="outline" size="sm" onClick={onRefresh}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                エクスポート
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            {/* メトリクス選択 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">分析対象</label>
              <Select value={selectedMetric} onValueChange={(value: any) => setSelectedMetric(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="revenue">売上</SelectItem>
                  <SelectItem value="users">ユーザー</SelectItem>
                  <SelectItem value="engagement">エンゲージメント</SelectItem>
                  <SelectItem value="retention">リテンション</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* チャートタイプ選択 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">チャート形式</label>
              <Select value={chartType} onValueChange={(value: any) => setChartType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="line">
                    <div className="flex items-center gap-2">
                      <LineChartIcon className="h-4 w-4" />
                      線グラフ
                    </div>
                  </SelectItem>
                  <SelectItem value="bar">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      棒グラフ
                    </div>
                  </SelectItem>
                  <SelectItem value="pie">
                    <div className="flex items-center gap-2">
                      <PieChartIcon className="h-4 w-4" />
                      円グラフ
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 期間選択 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">期間</label>
              <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">過去7日間</SelectItem>
                  <SelectItem value="30d">過去30日間</SelectItem>
                  <SelectItem value="90d">過去90日間</SelectItem>
                  <SelectItem value="1y">過去1年間</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* オプション */}
            <div className="space-y-2">
              <label className="text-sm font-medium">オプション</label>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="movingAverage"
                  checked={showMovingAverage}
                  onChange={(e) => setShowMovingAverage(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="movingAverage" className="text-sm">
                  移動平均を表示
                </label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* トレンド分析カード */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">トレンド</CardTitle>
            {getTrendIcon(trendData.trend)}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getTrendColor(trendData.trend)}`}>
              {trendData.trend === 'up' ? '+' : trendData.trend === 'down' ? '-' : ''}
              {trendData.percentage.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {trendData.trend === 'up' ? '上昇トレンド' : 
               trendData.trend === 'down' ? '下降トレンド' : '横ばい'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">データポイント</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {chartData.reduce((sum, series) => sum + series.data.length, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {chartData.length}系列
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">最新値</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {chartData.length > 0 && chartData[0].data.length > 0 ? 
                chartData[0].data[chartData[0].data.length - 1].y.toLocaleString() : 
                '-'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              最新データ
            </p>
          </CardContent>
        </Card>
      </div>

      {/* メインチャート */}
      <div className="space-y-4">
        {chartType === 'line' && enhancedChartData.length > 0 && (
          <LineChart
            data={enhancedChartData}
            config={{
              title: getMetricTitle(selectedMetric),
              subtitle: getMetricDescription(selectedMetric),
              height: 400,
              showGrid: true,
              showLegend: true,
              colors: DEFAULT_COLORS
            }}
          />
        )}

        {chartType === 'bar' && chartData.length > 0 && (
          <BarChart
            data={chartData}
            config={{
              title: getMetricTitle(selectedMetric),
              subtitle: getMetricDescription(selectedMetric),
              height: 400,
              showGrid: true,
              showLegend: true,
              colors: DEFAULT_COLORS
            }}
          />
        )}

        {chartType === 'pie' && pieChartData.length > 0 && (
          <PieChart
            data={pieChartData}
            config={{
              title: `${getMetricTitle(selectedMetric)} - 内訳`,
              subtitle: '各カテゴリの構成比',
              height: 400,
              colors: DEFAULT_COLORS
            }}
          />
        )}
      </div>

      {/* データが不足している場合の表示 */}
      {(!data || (chartData.length === 0 && pieChartData.length === 0)) && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">データがありません</h3>
            <p className="text-muted-foreground text-center">
              選択された条件に該当するデータが見つかりませんでした。<br />
              サンプルデータを作成するか、別の条件を選択してください。
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
