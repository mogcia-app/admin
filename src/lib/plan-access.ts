import { User } from '@/types'

export type PlanTier = 'ume' | 'take' | 'matsu'

// プラン階層の定義
export const PLAN_CONFIG = {
  ume: {
    name: '梅プラン',
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
  take: {
    name: '竹プラン',
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
  matsu: {
    name: '松プラン',
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
  ume: PLAN_CONFIG.ume.features,
  take: PLAN_CONFIG.take.features,
  matsu: PLAN_CONFIG.matsu.features,
} as const

/**
 * ユーザーのプラン階層を取得（デフォルトは"ume"）
 */
export function getUserPlanTier(user: User | null | undefined): PlanTier {
  return user?.planTier || 'ume'
}

/**
 * 特定機能へのアクセス権限をチェック
 */
export function canAccessFeature(
  user: User | null | undefined,
  feature: keyof typeof PLAN_FEATURES.ume
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
  return PLAN_CONFIG[tier].name
}

/**
 * プランの月額料金を取得
 */
export function getPlanPrice(tier: PlanTier): number {
  return PLAN_CONFIG[tier].monthlyFee
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
    { value: 'ume', label: PLAN_CONFIG.ume.name, price: PLAN_CONFIG.ume.monthlyFee },
    { value: 'take', label: PLAN_CONFIG.take.name, price: PLAN_CONFIG.take.monthlyFee },
    { value: 'matsu', label: PLAN_CONFIG.matsu.name, price: PLAN_CONFIG.matsu.monthlyFee },
  ]
}


