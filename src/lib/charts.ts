// チャート用のデータ型定義とユーティリティ関数

export interface ChartDataPoint {
  x: string | number
  y: number
  label?: string
  color?: string
  metadata?: any
}

export interface ChartSeries {
  name: string
  data: ChartDataPoint[]
  color?: string
  type?: 'line' | 'bar' | 'area' | 'scatter'
}

export interface ChartConfig {
  title?: string
  subtitle?: string
  xAxisLabel?: string
  yAxisLabel?: string
  showLegend?: boolean
  showGrid?: boolean
  showTooltip?: boolean
  height?: number
  width?: number
  colors?: string[]
  animation?: boolean
}

// デフォルトカラーパレット
export const DEFAULT_COLORS = [
  '#3b82f6', // blue-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#8b5cf6', // violet-500
  '#06b6d4', // cyan-500
  '#f97316', // orange-500
  '#84cc16', // lime-500
  '#ec4899', // pink-500
  '#6b7280'  // gray-500
]

// 日付フォーマット関数
export function formatDate(date: string | Date, format: 'short' | 'medium' | 'long' = 'medium'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  
  switch (format) {
    case 'short':
      return d.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })
    case 'long':
      return d.toLocaleDateString('ja-JP', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    default:
      return d.toLocaleDateString('ja-JP', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
  }
}

// 数値フォーマット関数
export function formatNumber(value: number, type: 'currency' | 'percentage' | 'decimal' | 'integer' = 'integer'): string {
  switch (type) {
    case 'currency':
      return new Intl.NumberFormat('ja-JP', {
        style: 'currency',
        currency: 'JPY',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value)
    case 'percentage':
      return `${value.toFixed(1)}%`
    case 'decimal':
      return value.toFixed(2)
    default:
      return value.toLocaleString('ja-JP')
  }
}

// データ集計関数
export function aggregateDataByPeriod(
  data: Array<{ date: string; value: number }>,
  period: 'daily' | 'weekly' | 'monthly'
): ChartDataPoint[] {
  const grouped = data.reduce((acc, item) => {
    const date = new Date(item.date)
    let key: string

    switch (period) {
      case 'weekly':
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay())
        key = weekStart.toISOString().split('T')[0]
        break
      case 'monthly':
        key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`
        break
      default:
        key = date.toISOString().split('T')[0]
    }

    if (!acc[key]) {
      acc[key] = { total: 0, count: 0 }
    }
    acc[key].total += item.value
    acc[key].count += 1

    return acc
  }, {} as Record<string, { total: number; count: number }>)

  return Object.entries(grouped)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, { total }]) => ({
      x: formatDate(date, 'short'),
      y: total,
      label: formatDate(date, 'medium')
    }))
}

// トレンド計算
export function calculateTrend(data: number[]): {
  trend: 'up' | 'down' | 'neutral'
  percentage: number
} {
  if (data.length < 2) {
    return { trend: 'neutral', percentage: 0 }
  }

  const first = data[0]
  const last = data[data.length - 1]
  
  if (first === 0) {
    return { trend: last > 0 ? 'up' : 'neutral', percentage: 0 }
  }

  const percentage = ((last - first) / first) * 100

  return {
    trend: percentage > 0.5 ? 'up' : percentage < -0.5 ? 'down' : 'neutral',
    percentage: Math.abs(percentage)
  }
}

// 移動平均計算
export function calculateMovingAverage(data: number[], window: number): number[] {
  const result: number[] = []
  
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - window + 1)
    const subset = data.slice(start, i + 1)
    const average = subset.reduce((sum, val) => sum + val, 0) / subset.length
    result.push(average)
  }
  
  return result
}

// パーセンタイル計算
export function calculatePercentile(data: number[], percentile: number): number {
  const sorted = [...data].sort((a, b) => a - b)
  const index = (percentile / 100) * (sorted.length - 1)
  
  if (Math.floor(index) === index) {
    return sorted[index]
  }
  
  const lower = sorted[Math.floor(index)]
  const upper = sorted[Math.ceil(index)]
  const weight = index - Math.floor(index)
  
  return lower * (1 - weight) + upper * weight
}

// 相関係数計算
export function calculateCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length === 0) {
    return 0
  }

  const n = x.length
  const sumX = x.reduce((sum, val) => sum + val, 0)
  const sumY = y.reduce((sum, val) => sum + val, 0)
  const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0)
  const sumXX = x.reduce((sum, val) => sum + val * val, 0)
  const sumYY = y.reduce((sum, val) => sum + val * val, 0)

  const numerator = n * sumXY - sumX * sumY
  const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY))

  return denominator === 0 ? 0 : numerator / denominator
}

// チャートデータ変換関数
export function transformKPIDataForChart(
  kpiData: any,
  chartType: 'revenue' | 'users' | 'engagement' | 'retention'
): ChartSeries[] {
  switch (chartType) {
    case 'revenue':
      return [
        {
          name: '売上',
          data: kpiData.revenueMetrics?.monthlyRevenue?.map((item: any) => ({
            x: formatDate(item.date, 'short'),
            y: item.amount,
            label: `${formatDate(item.date)}: ${formatNumber(item.amount, 'currency')}`
          })) || [],
          color: DEFAULT_COLORS[0],
          type: 'line'
        }
      ]

    case 'users':
      return [
        {
          name: '新規ユーザー',
          data: kpiData.userMetrics?.userGrowth?.map((item: any) => ({
            x: formatDate(item.date, 'short'),
            y: item.newUsers,
            label: `${formatDate(item.date)}: ${item.newUsers}人`
          })) || [],
          color: DEFAULT_COLORS[1],
          type: 'bar'
        }
      ]

    case 'engagement':
      const engagementData = kpiData.userMetrics?.engagementMetrics || []
      const dailyEngagement = aggregateDataByPeriod(
        engagementData.map((item: any) => ({
          date: item.date,
          value: item.averageSessionDuration
        })),
        'daily'
      )
      
      return [
        {
          name: '平均セッション時間',
          data: dailyEngagement,
          color: DEFAULT_COLORS[2],
          type: 'area'
        }
      ]

    case 'retention':
      const retentionData = kpiData.userMetrics?.userRetention || []
      const cohortData = retentionData.reduce((acc: any, item: any) => {
        if (!acc[item.cohort]) {
          acc[item.cohort] = []
        }
        acc[item.cohort].push({
          x: `Week ${item.period}`,
          y: item.retentionRate,
          label: `${item.cohort} Week ${item.period}: ${item.retentionRate.toFixed(1)}%`
        })
        return acc
      }, {})

      return Object.entries(cohortData).map(([cohort, data], index) => ({
        name: cohort,
        data: data as ChartDataPoint[],
        color: DEFAULT_COLORS[index % DEFAULT_COLORS.length],
        type: 'line'
      }))

    default:
      return []
  }
}
