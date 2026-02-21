import { User } from '@/types'

export type ActivePlanTier = 'basic' | 'standard' | 'pro'
export type LegacyPlanTier = 'ume' | 'take' | 'matsu'
export type PlanTier = ActivePlanTier | LegacyPlanTier

// プラン階層の定義
export const PLAN_CONFIG = {
  basic: {
    name: 'ベーシックプラン',
    monthlyFee: 15000,
    features: {
      canAccessLab: true,
      canAccessPosts: false,
      canAccessAnalytics: false,
      canAccessPlan: false,
      canAccessReport: false,
      canAccessKPI: false,
      canAccessLearning: false,
    },
  },
  standard: {
    name: 'スタンダードプラン',
    monthlyFee: 30000,
    features: {
      canAccessLab: true,
      canAccessPosts: true,
      canAccessAnalytics: false,
      canAccessPlan: false,
      canAccessReport: false,
      canAccessKPI: false,
      canAccessLearning: false,
    },
  },
  pro: {
    name: 'プロプラン',
    monthlyFee: 60000,
    features: {
      canAccessLab: true,
      canAccessPosts: true,
      canAccessAnalytics: true,
      canAccessPlan: true,
      canAccessReport: true,
      canAccessKPI: true,
      canAccessLearning: true,
    },
  },
} as const

export const PLAN_FEATURES = {
  basic: PLAN_CONFIG.basic.features,
  standard: PLAN_CONFIG.standard.features,
  pro: PLAN_CONFIG.pro.features,
} as const

/**
 * 旧プラン値を新プラン値に正規化
 */
export function normalizePlanTier(tier: string | null | undefined): ActivePlanTier {
  switch (tier) {
    case 'basic':
    case 'standard':
    case 'pro':
      return tier
    case 'ume':
      return 'basic'
    case 'take':
      return 'standard'
    case 'matsu':
      return 'pro'
    default:
      return 'basic'
  }
}

/**
 * ユーザーのプラン階層を取得（デフォルトは"basic"）
 */
export function getUserPlanTier(user: User | null | undefined): ActivePlanTier {
  return normalizePlanTier(user?.planTier)
}

/**
 * 特定機能へのアクセス権限をチェック
 */
export function canAccessFeature(
  user: User | null | undefined,
  feature: keyof typeof PLAN_FEATURES.basic
): boolean {
  const tier = getUserPlanTier(user)
  return PLAN_FEATURES[tier][feature]
}

/**
 * プラン階層に基づいてアクセス拒否メッセージを取得
 */
export function getAccessDeniedMessage(feature: string): string {
  return `${feature}機能は、現在のプランではご利用いただけません。プランのアップグレードをご検討ください。`
}

/**
 * プランの表示名を取得
 */
export function getPlanName(tier: PlanTier): string {
  return PLAN_CONFIG[normalizePlanTier(tier)].name
}

/**
 * プランの月額料金を取得
 */
export function getPlanPrice(tier: PlanTier): number {
  return PLAN_CONFIG[normalizePlanTier(tier)].monthlyFee
}

/**
 * プランの全機能アクセス権限を取得
 */
export function getPlanAccess(user: User | null | undefined) {
  const tier = getUserPlanTier(user)
  return PLAN_FEATURES[tier]
}

/**
 * プランリストを取得
 */
export function getPlanList(): Array<{ value: PlanTier; label: string; price: number }> {
  return [
    { value: 'basic', label: PLAN_CONFIG.basic.name, price: PLAN_CONFIG.basic.monthlyFee },
    { value: 'standard', label: PLAN_CONFIG.standard.name, price: PLAN_CONFIG.standard.monthlyFee },
    { value: 'pro', label: PLAN_CONFIG.pro.name, price: PLAN_CONFIG.pro.monthlyFee },
  ]
}

/**
 * planTierをbillingInfo.planに変換
 */
export function planTierToBillingPlan(tier: PlanTier): 'light' | 'standard' | 'professional' {
  const mapping = {
    'basic': 'light' as const,
    'standard': 'standard' as const,
    'pro': 'professional' as const,
    'ume': 'light' as const,
    'take': 'standard' as const,
    'matsu': 'professional' as const,
  }
  return mapping[tier]
}

/**
 * billingInfo.planをplanTierに変換
 */
export function billingPlanToPlanTier(plan: 'light' | 'standard' | 'professional'): ActivePlanTier {
  const mapping = {
    'light': 'basic' as const,
    'standard': 'standard' as const,
    'professional': 'pro' as const,
  }
  return mapping[plan]
}


