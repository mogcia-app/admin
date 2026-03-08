import { normalizePlanTier, type ActivePlanTier } from '@/lib/plan-access'

export const AI_USAGE_COLLECTION = 'ai_output_usage_monthly'

// Signal側実装(/Users/marina/Desktop/signal/src/lib/server/ai-usage-limit.ts)と同じ上限値。
const PLAN_LIMITS: Record<ActivePlanTier, number> = {
  basic: 25,
  standard: 55,
  pro: 1000,
}

export interface AiUsageSummary {
  month: string
  tier: ActivePlanTier
  limit: number
  count: number
  remaining: number
  breakdown: Record<string, number>
}

export function isValidBillingMonth(month: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(month)
}

export function getCurrentBillingMonth(date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

export function getAiUsageDocId(uid: string, billingMonth: string): string {
  return `${uid}_${billingMonth}`
}

export function resolveTier(rawTier: unknown): ActivePlanTier {
  return normalizePlanTier(typeof rawTier === 'string' ? rawTier : undefined)
}

export function getAiUsageLimitForTier(tier: ActivePlanTier): number {
  return PLAN_LIMITS[tier]
}

export function normalizeCount(value: unknown): number {
  const count = Number(value ?? 0)
  if (!Number.isFinite(count) || count < 0) {
    return 0
  }
  return Math.floor(count)
}

export function normalizeBreakdown(value: unknown): Record<string, number> {
  if (!value || typeof value !== 'object') {
    return {}
  }

  const entries = Object.entries(value as Record<string, unknown>)
  const normalizedEntries = entries
    .map(([feature, count]) => [feature, normalizeCount(count)] as const)
    .filter(([, count]) => count > 0)

  return Object.fromEntries(normalizedEntries)
}

export function buildAiUsageSummary(params: {
  month: string
  currentTier: unknown
  usageDocData?: Record<string, unknown>
}): AiUsageSummary {
  const usageData = params.usageDocData || {}
  const tier = resolveTier(usageData.tier ?? params.currentTier)
  const limitFromDoc = Number(usageData.limit)
  const limit = Number.isFinite(limitFromDoc) && limitFromDoc >= 0 ? limitFromDoc : getAiUsageLimitForTier(tier)
  const count = normalizeCount(usageData.count)

  return {
    month: params.month,
    tier,
    limit,
    count,
    remaining: Math.max(limit - count, 0),
    breakdown: normalizeBreakdown(usageData.breakdown),
  }
}
