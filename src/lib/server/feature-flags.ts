import { getMaintenanceCurrent } from '@/lib/server/maintenance-admin'

export class FeatureDisabledError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'FeatureDisabledError'
  }
}

export async function getPublicFeatureFlags() {
  const current = await getMaintenanceCurrent()

  return {
    enabled: current.enabled,
    loginBlocked: current.loginBlocked,
    allowPasswordReset: current.allowPasswordReset,
    sessionPolicy: current.sessionPolicy,
    featureFlags: current.featureFlags,
    version: current.version,
    updatedAt: current.updatedAt,
  }
}

export async function assertFeatureEnabled(featureKey: string) {
  const current = await getMaintenanceCurrent()
  const enabled = current.featureFlags[featureKey]

  if (enabled === false) {
    throw new FeatureDisabledError(`現在この機能は停止中です: ${featureKey}`)
  }
}
