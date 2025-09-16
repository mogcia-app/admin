export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'user' | 'moderator'
  createdAt: string
  updatedAt: string
  isActive: boolean
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
  contractSNS: ('instagram' | 'x' | 'youtube' | 'tiktok')[]
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
  youtube?: SNSAISetting
  tiktok?: SNSAISetting
}

export interface SNSAISetting {
  enabled: boolean
  tone: 'casual' | 'professional' | 'friendly' | 'energetic'
  language: 'japanese' | 'english' | 'mixed'
  postFrequency: 'high' | 'medium' | 'low'
  targetAudience: string
  brandVoice: string
  keywords: string[]
  customPrompts?: string[]
  autoPost: boolean
  contentTypes: ('text' | 'image' | 'video' | 'story')[]
}

export interface BusinessInfo {
  industry: string
  companySize: 'individual' | 'small' | 'medium' | 'large'
  businessType: 'b2b' | 'b2c' | 'both'
  description: string
  targetMarket: string
  goals: string[]
  challenges: string[]
  currentSNSStrategy?: string
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
