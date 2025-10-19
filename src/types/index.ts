export interface User {
  id: string // Firebase Auth UID
  name: string
  email: string
  role: 'admin' | 'user' | 'moderator'
  createdAt: string
  updatedAt: string
  isActive: boolean
  snsCount: number // 契約SNS数 (1-3) ※4は将来的に必要になる可能性あり
  // ビジネス情報
  usageType: 'team' | 'solo'
  contractType: 'annual' | 'trial'
  contractSNS: ('instagram' | 'x' | /* 'youtube' | */ 'tiktok')[]
  snsAISettings: SNSAISettings
  businessInfo: BusinessInfo
  status: 'active' | 'inactive' | 'suspended'
  lastLoginAt?: string
  contractStartDate: string
  contractEndDate: string
  billingInfo?: BillingInfo
  notes?: string
  // パスワードは新規作成時のみ使用（Firestoreには保存しない）
  password?: string
}

export interface AdminLayoutProps {
  children: React.ReactNode
}

export interface SidebarItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  badge?: string | number
}

export interface DashboardStats {
  totalUsers: number
  activeUsers: number
  totalRevenue: number
  monthlyGrowth: number
}

// プロンプト管理システム用の型定義
export interface PromptTemplate {
  id: string
  name: string
  description: string
  category: 'system' | 'user' | 'assistant' | 'custom'
  prompt: string
  variables: PromptVariable[]
  isActive: boolean
  createdAt: string
  updatedAt: string
  createdBy: string
  usageCount: number
  tags: string[]
}

export interface PromptVariable {
  name: string
  type: 'text' | 'number' | 'boolean' | 'select'
  description: string
  required: boolean
  defaultValue?: string
  options?: string[] // for select type
}

export interface PromptCategory {
  id: string
  name: string
  description: string
  color: string
  icon: string
}

export interface PromptUsageLog {
  id: string
  promptId: string
  userId: string
  executedAt: string
  variables: Record<string, any>
  result?: string
  success: boolean
}

// 利用者管理システム用の型定義
export interface UserProfile {
  id: string
  name: string
  email: string
  usageType: 'team' | 'solo'
  contractType: 'annual' | 'trial'
  contractSNS: ('instagram' | 'x' | /* 'youtube' | */ 'tiktok')[]
  snsCount: number // 契約SNS数 (1-3) ※4は将来的に必要になる可能性あり
  snsAISettings: SNSAISettings
  businessInfo: BusinessInfo
  status: 'active' | 'inactive' | 'suspended'
  createdAt: string
  updatedAt: string
  lastLoginAt?: string
  contractStartDate: string
  contractEndDate: string
  billingInfo?: BillingInfo
  notes?: string
}

export interface SNSAISettings {
  instagram?: SNSAISetting
  x?: SNSAISetting
  // youtube?: SNSAISetting // 将来的に必要になる可能性あり
  tiktok?: SNSAISetting
}

export interface SNSAISetting {
  enabled: boolean
  // なぜこのSNSを選んだのか
  whyThisSNS: string
  // このSNSでの目標・期待する成果
  snsGoal: string
  // コンテンツの方向性
  contentDirection: string
  // 投稿頻度の目安
  postFrequency: string
  // ターゲットとするアクション
  targetAction: string
  // トーン＆マナー
  tone: string
  // 重視する指標
  focusMetrics: string[]
  // その他の戦略メモ
  strategyNotes?: string
}

export interface BusinessInfo {
  // 業種・事業内容
  industry: string
  companySize: 'individual' | 'small' | 'medium' | 'large'
  businessType: 'b2b' | 'b2c' | 'both'
  description: string
  
  // SNS活用の大目標（Why SNS?）
  snsMainGoals: string[] // 例: ['認知拡大で月間新規顧客100人', 'EC売上30%UP']
  
  // ブランドの核
  brandMission: string // ブランドのミッション・理念
  targetCustomer: string // ターゲット顧客の詳細
  uniqueValue: string // 独自の価値・差別化ポイント
  brandVoice: string // ブランドの声・トーン
  
  // 測定したいKPI
  kpiTargets: string[] // 例: ['月間新規顧客100人', 'リピート率50%']
  
  // 現在の課題
  challenges: string[]
}

export interface BillingInfo {
  plan: 'trial' | 'basic' | 'professional' | 'enterprise'
  monthlyFee: number
  currency: 'JPY' | 'USD'
  paymentMethod: 'credit_card' | 'bank_transfer' | 'invoice'
  nextBillingDate: string
  paymentStatus: 'paid' | 'pending' | 'overdue'
}

// ユーザー統計情報
export interface UserStats {
  totalUsers: number
  activeUsers: number
  trialUsers: number
  annualUsers: number
  teamUsers: number
  soloUsers: number
  snsBreakdown: Record<string, number>
  industryBreakdown: Record<string, number>
  monthlyRevenue: number
  churnRate: number
  averageContractValue: number
}

// KPI管理システム用の型定義
export interface KPIMetric {
  id: string
  name: string
  description: string
  category: 'revenue' | 'users' | 'engagement' | 'retention' | 'conversion'
  value: number
  target: number
  unit: string
  trend: 'up' | 'down' | 'neutral'
  changePercent: number
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
  updatedAt: string
  isActive: boolean
}

export interface RevenueData {
  id: string
  date: string
  amount: number
  source: 'subscription' | 'one_time' | 'upgrade' | 'addon'
  userId?: string
  plan: 'trial' | 'basic' | 'professional' | 'enterprise'
  currency: 'JPY' | 'USD'
  createdAt: string
}

export interface UserAcquisitionData {
  id: string
  date: string
  newUsers: number
  source: 'organic' | 'paid' | 'referral' | 'social' | 'direct'
  campaign?: string
  cost?: number
  conversionRate: number
  createdAt: string
}

export interface EngagementMetrics {
  id: string
  userId: string
  date: string
  sessionsCount: number
  totalSessionDuration: number
  averageSessionDuration: number
  pagesViewed: number
  featuresUsed: string[]
  aiInteractions: number
  createdAt: string
}

export interface RetentionMetrics {
  id: string
  cohort: string // YYYY-MM format
  period: number // weeks since signup
  totalUsers: number
  activeUsers: number
  retentionRate: number
  createdAt: string
}

export interface ConversionFunnel {
  id: string
  name: string
  stages: ConversionStage[]
  totalUsers: number
  conversionRate: number
  period: string
  createdAt: string
  updatedAt: string
}

export interface ConversionStage {
  name: string
  users: number
  conversionRate: number
  dropoffRate: number
}

export interface KPIDashboardData {
  overview: {
    totalRevenue: number
    monthlyRecurringRevenue: number
    averageRevenuePerUser: number
    customerLifetimeValue: number
    totalUsers: number
    activeUsers: number
    newUsersThisMonth: number
    churnRate: number
  }
  revenueMetrics: {
    monthlyRevenue: RevenueData[]
    revenueBySource: Record<string, number>
    revenueByPlan: Record<string, number>
    revenueGrowth: number
  }
  userMetrics: {
    userGrowth: UserAcquisitionData[]
    acquisitionBySource: Record<string, number>
    userRetention: RetentionMetrics[]
    engagementMetrics: EngagementMetrics[]
  }
  conversionMetrics: {
    trialToPayingConversion: number
    signupToTrialConversion: number
    funnels: ConversionFunnel[]
  }
  kpiTargets: KPIMetric[]
}

// お知らせ管理システム用の型定義
export interface Notification {
  id: string
  title: string
  content: string
  type: 'info' | 'warning' | 'error' | 'success' | 'maintenance'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'draft' | 'published' | 'archived'
  targetAudience: 'all' | 'trial' | 'paid' | 'admin'
  scheduledAt?: string
  publishedAt?: string
  expiresAt?: string
  createdBy: string
  createdAt: string
  updatedAt: string
  tags: string[]
  isSticky: boolean
  readCount: number
  clickCount: number
}

export interface NotificationTemplate {
  id: string
  name: string
  description: string
  type: 'info' | 'warning' | 'error' | 'success' | 'maintenance'
  titleTemplate: string
  contentTemplate: string
  variables: string[]
  createdAt: string
  updatedAt: string
}

export interface NotificationStats {
  totalNotifications: number
  publishedNotifications: number
  draftNotifications: number
  totalReads: number
  totalClicks: number
  averageReadRate: number
  averageClickRate: number
  notificationsByType: Record<string, number>
  notificationsByPriority: Record<string, number>
}

// アプリアクセス制御用の型定義
export interface AppAccessControl {
  id: string
  feature: string
  isEnabled: boolean
  description: string
  allowedRoles: ('admin' | 'user' | 'trial')[]
  maintenanceMode: boolean
  maintenanceMessage?: string
  scheduledMaintenance?: {
    startTime: string
    endTime: string
    message: string
  }
  updatedBy: string
  updatedAt: string
}

export interface SystemStatus {
  id: string
  service: string
  status: 'operational' | 'degraded' | 'partial_outage' | 'major_outage' | 'maintenance'
  description: string
  lastChecked: string
  responseTime?: number
  uptime: number
  incidents: SystemIncident[]
}

export interface SystemIncident {
  id: string
  title: string
  description: string
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved'
  severity: 'low' | 'medium' | 'high' | 'critical'
  affectedServices: string[]
  startTime: string
  endTime?: string
  updates: IncidentUpdate[]
}

export interface IncidentUpdate {
  id: string
  message: string
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved'
  timestamp: string
  author: string
}

// エラー監視用の型定義
export interface ErrorLog {
  id: string
  message: string
  stack?: string
  level: 'info' | 'warn' | 'error' | 'fatal'
  source: 'client' | 'server' | 'api' | 'database'
  userId?: string
  userAgent?: string
  url?: string
  timestamp: string
  resolved: boolean
  assignedTo?: string
  tags: string[]
  count: number
}

export interface SalesProgress {
  id: string
  period: string // YYYY-MM format
  target: number
  achieved: number
  salesRep: string
  deals: Deal[]
  notes: string
  createdAt: string
  updatedAt: string
}

export interface Deal {
  id: string
  customerName: string
  amount: number
  stage: 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost'
  probability: number
  expectedCloseDate: string
  actualCloseDate?: string
  source: string
  notes: string
}

// AIアシスタント用の型定義
export interface AdminAIChat {
  id: string
  messages: AIMessage[]
  title: string
  createdAt: string
  updatedAt: string
  adminId: string
}

export interface AIMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  metadata?: {
    dataQuery?: boolean
    chartGenerated?: boolean
    actionTaken?: string
    templateUsed?: string
    customerSearch?: boolean
    toolFunction?: boolean
    page?: string
    category?: string
    actionRequired?: boolean
    usage?: {
      promptTokens: number
      completionTokens: number
      totalTokens: number
    }
  }
}

export interface AIResponse {
  message: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  model: string
}

export interface AICapability {
  id: string
  name: string
  description: string
  category: 'analytics' | 'management' | 'reporting' | 'automation'
  isEnabled: boolean
  examples: string[]
}

// ブログ管理システム用の型定義
export interface BlogPost {
  id: string
  title: string
  slug: string // URL用のスラッグ
  excerpt: string // 抜粋文
  content: string // 本文（Markdown対応）
  featuredImage?: string // メイン画像
  images: string[] // 本文内画像
  category: string // カテゴリ
  tags: string[] // タグ
  status: 'draft' | 'published' | 'archived'
  publishedAt?: string // 公開日時
  createdAt: string
  updatedAt: string
  author: string // 作成者
  viewCount: number
  seoTitle?: string
  seoDescription?: string
  readingTime?: number // 読了時間（分）
}

export interface BlogCategory {
  id: string
  name: string
  slug: string
  description?: string
  color: string
  postCount: number
  createdAt: string
  updatedAt: string
}

export interface BlogTag {
  id: string
  name: string
  slug: string
  color?: string
  postCount: number
  createdAt: string
}

export interface BlogStats {
  totalPosts: number
  publishedPosts: number
  draftPosts: number
  totalViews: number
  totalCategories: number
  totalTags: number
  averageViewsPerPost: number
  mostPopularPost?: BlogPost
  postsByCategory: Record<string, number>
  postsByMonth: Record<string, number>
}
