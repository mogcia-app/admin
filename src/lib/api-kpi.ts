import { 
  KPIMetric, 
  RevenueData, 
  UserAcquisitionData, 
  EngagementMetrics, 
  RetentionMetrics,
  ConversionFunnel,
  KPIDashboardData
} from '@/types'
import { API_ENDPOINTS, apiGet, apiPost } from './api-config'

// KPIメトリクスの取得 (Cloud Functions API使用)
export async function getKPIMetrics(category?: string, period?: string): Promise<KPIMetric[]> {
  try {
    const params: Record<string, string> = {}
    if (category) params.category = category
    if (period) params.period = period

    const response = await apiGet(API_ENDPOINTS.kpi.metrics, params)
    return response.metrics || []
  } catch (error) {
    console.error('Error fetching KPI metrics from API:', error)
    throw error
  }
}

// 売上データ取得 (Cloud Functions API使用)
export async function getRevenueData(startDate?: string, endDate?: string): Promise<RevenueData[]> {
  try {
    const params: Record<string, string> = {}
    if (startDate) params.startDate = startDate
    if (endDate) params.endDate = endDate

    const response = await apiGet(API_ENDPOINTS.kpi.revenue, params)
    return response.revenueData || []
  } catch (error) {
    console.error('Error fetching revenue data from API:', error)
    throw error
  }
}

// ユーザー獲得データ取得 (Cloud Functions API使用)
export async function getUserAcquisitionData(period?: number): Promise<UserAcquisitionData[]> {
  try {
    const params: Record<string, string> = {}
    if (period) params.period = period.toString()

    const response = await apiGet(API_ENDPOINTS.kpi.userAcquisition, params)
    return response.userAcquisitionData || []
  } catch (error) {
    console.error('Error fetching user acquisition data from API:', error)
    throw error
  }
}

// エンゲージメントメトリクス取得 (Cloud Functions API使用)
export async function getEngagementMetrics(): Promise<EngagementMetrics[]> {
  try {
    const response = await apiGet(API_ENDPOINTS.kpi.engagement)
    return response.engagementMetrics || []
  } catch (error) {
    console.error('Error fetching engagement metrics from API:', error)
    throw error
  }
}

// リテンションメトリクス取得 (Cloud Functions API使用)
export async function getRetentionMetrics(): Promise<RetentionMetrics[]> {
  try {
    const response = await apiGet(API_ENDPOINTS.kpi.retention)
    return response.retentionMetrics || []
  } catch (error) {
    console.error('Error fetching retention metrics from API:', error)
    throw error
  }
}

// コンバージョンファネル取得 (Cloud Functions API使用)
export async function getConversionFunnel(): Promise<ConversionFunnel | null> {
  try {
    const response = await apiGet(API_ENDPOINTS.kpi.conversionFunnel)
    return response.conversionFunnel || null
  } catch (error) {
    console.error('Error fetching conversion funnel from API:', error)
    throw error
  }
}

// KPIダッシュボードデータ統合取得
export async function getKPIDashboardData(): Promise<KPIDashboardData> {
  try {
    const [
      metrics,
      revenueData,
      userAcquisitionData,
      engagementMetrics,
      retentionMetrics,
      conversionFunnel
    ] = await Promise.all([
      getKPIMetrics(),
      getRevenueData(),
      getUserAcquisitionData(30),
      getEngagementMetrics(),
      getRetentionMetrics(),
      getConversionFunnel()
    ])

    return {
      metrics,
      revenueData,
      userAcquisitionData,
      engagementMetrics,
      retentionMetrics,
      conversionFunnel
    }
  } catch (error) {
    console.error('Error fetching KPI dashboard data:', error)
    throw error
  }
}

// KPI統計計算
export function calculateKPIStats(data: KPIDashboardData) {
  const totalRevenue = data.revenueData.reduce((sum, item) => sum + item.amount, 0)
  const totalUsers = data.userAcquisitionData.reduce((sum, item) => sum + item.newUsers, 0)
  const avgEngagement = data.engagementMetrics.length > 0 
    ? data.engagementMetrics.reduce((sum, item) => sum + item.engagementRate, 0) / data.engagementMetrics.length
    : 0

  return {
    totalRevenue,
    totalUsers,
    avgEngagement: Math.round(avgEngagement * 100) / 100,
    activeMetrics: data.metrics.filter(m => m.isActive).length,
    totalMetrics: data.metrics.length,
    conversionRate: data.conversionFunnel?.steps[data.conversionFunnel.steps.length - 1]?.conversionRate || 0
  }
}
