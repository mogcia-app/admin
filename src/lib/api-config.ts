// Cloud Functions API 設定
const FUNCTIONS_BASE_URL = 'https://us-central1-signal-v1-fc481.cloudfunctions.net'

// API エンドポイント定義
export const API_ENDPOINTS = {
  // ユーザー管理
  users: {
    list: `${FUNCTIONS_BASE_URL}/getUsers`,
    create: `${FUNCTIONS_BASE_URL}/createUser`,
  },
  
  // ダッシュボード
  dashboard: {
    data: `${FUNCTIONS_BASE_URL}/getDashboardData`,
  },
  
  // プロンプト管理
  prompts: {
    list: `${FUNCTIONS_BASE_URL}/getPrompts`,
    create: `${FUNCTIONS_BASE_URL}/createPrompt`,
    update: `${FUNCTIONS_BASE_URL}/updatePrompt`,
    delete: `${FUNCTIONS_BASE_URL}/deletePrompt`,
    incrementUsage: `${FUNCTIONS_BASE_URL}/incrementPromptUsage`,
  },
  
  // KPI・分析
  kpi: {
    metrics: `${FUNCTIONS_BASE_URL}/getKPIMetrics`,
    revenue: `${FUNCTIONS_BASE_URL}/getRevenueData`,
    userAcquisition: `${FUNCTIONS_BASE_URL}/getUserAcquisitionData`,
    engagement: `${FUNCTIONS_BASE_URL}/getEngagementMetrics`,
    retention: `${FUNCTIONS_BASE_URL}/getRetentionMetrics`,
    conversionFunnel: `${FUNCTIONS_BASE_URL}/getConversionFunnel`,
  },
  
  // 通知管理
  notifications: {
    list: `${FUNCTIONS_BASE_URL}/getNotifications`,
    create: `${FUNCTIONS_BASE_URL}/createNotification`,
    update: `${FUNCTIONS_BASE_URL}/updateNotification`,
    delete: `${FUNCTIONS_BASE_URL}/deleteNotification`,
    stats: `${FUNCTIONS_BASE_URL}/getNotificationStats`,
  },
  
  // エラー監視
  monitoring: {
    reportError: `${FUNCTIONS_BASE_URL}/reportError`,
  },
}

// HTTP ヘルパー関数
export const apiRequest = async (url: string, options: RequestInit = {}) => {
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  }

  try {
    const response = await fetch(url, defaultOptions)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('API request failed:', error)
    throw error
  }
}

// GET リクエスト
export const apiGet = (url: string, params?: Record<string, string>) => {
  const urlWithParams = params 
    ? `${url}?${new URLSearchParams(params).toString()}`
    : url
  
  return apiRequest(urlWithParams, { method: 'GET' })
}

// POST リクエスト
export const apiPost = (url: string, data: any) => {
  return apiRequest(url, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

// PUT リクエスト
export const apiPut = (url: string, data: any) => {
  return apiRequest(url, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

// DELETE リクエスト
export const apiDelete = (url: string) => {
  return apiRequest(url, { method: 'DELETE' })
}
