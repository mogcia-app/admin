export type SessionPolicy = 'allow_existing' | 'force_logout'

export interface ToolMaintenanceCurrent {
  enabled: boolean
  message: string
  allowAdminBypass: boolean
  allowedRoles: string[]
  loginBlocked: boolean
  sessionPolicy: SessionPolicy
  allowPasswordReset: boolean
  featureFlags: Record<string, boolean>
  version: number
  updatedBy: string
  updatedByEmail: string
  updatedAt: unknown
}

export const MAINTENANCE_DOC_PATH = {
  collection: 'toolMaintenance',
  doc: 'current',
}

export const DEFAULT_FEATURE_FLAGS: Record<string, boolean> = {
  'dashboard.write': true,
  'plan.write': true,
  'post.write': true,
  'analytics.write': true,
  'ai.generate': true,
}

export function buildDefaultMaintenanceCurrent(): Omit<ToolMaintenanceCurrent, 'updatedAt'> {
  return {
    enabled: false,
    message: '',
    allowAdminBypass: true,
    allowedRoles: ['super_admin'],
    loginBlocked: false,
    sessionPolicy: 'allow_existing',
    allowPasswordReset: true,
    featureFlags: { ...DEFAULT_FEATURE_FLAGS },
    version: 1,
    updatedBy: 'system',
    updatedByEmail: 'system',
  }
}

export function normalizeMaintenanceCurrent(input: Record<string, unknown> | undefined): ToolMaintenanceCurrent {
  const defaults = buildDefaultMaintenanceCurrent()
  const featureFlagsRaw = (input?.featureFlags as Record<string, unknown> | undefined) || {}
  const mergedFeatureFlags: Record<string, boolean> = {}

  Object.entries({ ...DEFAULT_FEATURE_FLAGS, ...featureFlagsRaw }).forEach(([key, value]) => {
    mergedFeatureFlags[key] = typeof value === 'boolean' ? value : true
  })

  const sessionPolicy = input?.sessionPolicy === 'force_logout' ? 'force_logout' : 'allow_existing'

  return {
    enabled: typeof input?.enabled === 'boolean' ? input.enabled : defaults.enabled,
    message: typeof input?.message === 'string' ? input.message : defaults.message,
    allowAdminBypass: typeof input?.allowAdminBypass === 'boolean' ? input.allowAdminBypass : defaults.allowAdminBypass,
    allowedRoles: Array.isArray(input?.allowedRoles)
      ? input.allowedRoles.map((role) => String(role)).filter(Boolean)
      : defaults.allowedRoles,
    loginBlocked: typeof input?.loginBlocked === 'boolean' ? input.loginBlocked : defaults.loginBlocked,
    sessionPolicy,
    allowPasswordReset: typeof input?.allowPasswordReset === 'boolean' ? input.allowPasswordReset : defaults.allowPasswordReset,
    featureFlags: mergedFeatureFlags,
    version: typeof input?.version === 'number' && Number.isFinite(input.version) ? input.version : defaults.version,
    updatedBy: typeof input?.updatedBy === 'string' ? input.updatedBy : defaults.updatedBy,
    updatedByEmail: typeof input?.updatedByEmail === 'string' ? input.updatedByEmail : defaults.updatedByEmail,
    updatedAt: input?.updatedAt,
  }
}

export function validateMaintenanceConfig(config: ToolMaintenanceCurrent): string | null {
  if (config.enabled && !config.message.trim()) {
    return 'enabled=true の場合は message が必須です'
  }
  if (!Array.isArray(config.allowedRoles) || config.allowedRoles.length === 0) {
    return 'allowedRoles は1件以上必須です'
  }
  if (config.sessionPolicy !== 'allow_existing' && config.sessionPolicy !== 'force_logout') {
    return 'sessionPolicy は allow_existing / force_logout のみ指定可能です'
  }
  return null
}

