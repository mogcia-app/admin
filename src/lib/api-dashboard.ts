import { API_ENDPOINTS, apiGet, apiPost } from './api-config'

// ダッシュボードデータ取得 (Cloud Functions API使用)
export async function getDashboardData(): Promise<{
  stats: {
    totalUsers: number
    activeUsers: number
    totalRevenue: number
    monthlyGrowth: number
  }
  recentActivity: Array<{
    id: string
    type: string
    message: string
    timestamp: string
    user?: string
  }>
  chartData?: {
    userGrowth: Array<{ month: string; users: number }>
    revenue: Array<{ month: string; amount: number }>
  }
}> {
  try {
    const response = await apiGet(API_ENDPOINTS.dashboard.data)
    return response
  } catch (error) {
    console.error('Error fetching dashboard data from API:', error)
    throw error
  }
}

// ユーザー一覧取得 (Cloud Functions API使用)
export async function getUsers(params?: {
  page?: number
  limit?: number
  search?: string
}): Promise<{
  users: Array<{
    id: string
    name: string
    email: string
    role: string
    createdAt: string
    updatedAt: string
    isActive: boolean
  }>
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}> {
  try {
    const queryParams: Record<string, string> = {}
    if (params?.page) queryParams.page = params.page.toString()
    if (params?.limit) queryParams.limit = params.limit.toString()
    if (params?.search) queryParams.search = params.search

    const response = await apiGet(API_ENDPOINTS.users.list, queryParams)
    return response
  } catch (error) {
    console.error('Error fetching users from API:', error)
    throw error
  }
}

// ユーザー作成 (Cloud Functions API使用)
export async function createUser(userData: {
  name: string
  email: string
  role?: string
}): Promise<{
  id: string
  name: string
  email: string
  role: string
  createdAt: string
  updatedAt: string
  isActive: boolean
}> {
  try {
    const response = await apiPost(API_ENDPOINTS.users.create, userData)
    console.log('User created with ID:', response.id)
    return response
  } catch (error) {
    console.error('Error creating user via API:', error)
    throw error
  }
}

// ダッシュボード統計の計算
export function calculateDashboardStats(dashboardData: any) {
  const { stats, recentActivity, chartData } = dashboardData

  // 成長率の計算
  const growthRate = stats.monthlyGrowth || 0
  
  // 最近のアクティビティの分析
  const activityTypes = recentActivity.reduce((acc: Record<string, number>, activity: any) => {
    acc[activity.type] = (acc[activity.type] || 0) + 1
    return acc
  }, {})

  // チャートデータの分析
  let revenueGrowth = 0
  let userGrowth = 0
  
  if (chartData?.revenue && chartData.revenue.length >= 2) {
    const current = chartData.revenue[chartData.revenue.length - 1]?.amount || 0
    const previous = chartData.revenue[chartData.revenue.length - 2]?.amount || 0
    revenueGrowth = previous > 0 ? ((current - previous) / previous) * 100 : 0
  }

  if (chartData?.userGrowth && chartData.userGrowth.length >= 2) {
    const current = chartData.userGrowth[chartData.userGrowth.length - 1]?.users || 0
    const previous = chartData.userGrowth[chartData.userGrowth.length - 2]?.users || 0
    userGrowth = previous > 0 ? ((current - previous) / previous) * 100 : 0
  }

  return {
    ...stats,
    revenueGrowth: Math.round(revenueGrowth * 100) / 100,
    userGrowth: Math.round(userGrowth * 100) / 100,
    activityTypes,
    totalActivities: recentActivity.length,
    activeUserRate: stats.totalUsers > 0 ? (stats.activeUsers / stats.totalUsers) * 100 : 0
  }
}

// リアルタイム更新用の定期取得
export class DashboardUpdater {
  private intervalId: NodeJS.Timeout | null = null
  private updateCallback: ((data: any) => void) | null = null

  start(callback: (data: any) => void, intervalMs: number = 30000) {
    this.updateCallback = callback
    
    // 初回実行
    this.fetchAndUpdate()
    
    // 定期実行
    this.intervalId = setInterval(() => {
      this.fetchAndUpdate()
    }, intervalMs)
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    this.updateCallback = null
  }

  private async fetchAndUpdate() {
    if (!this.updateCallback) return

    try {
      const data = await getDashboardData()
      this.updateCallback(data)
    } catch (error) {
      console.error('Error updating dashboard data:', error)
    }
  }
}
