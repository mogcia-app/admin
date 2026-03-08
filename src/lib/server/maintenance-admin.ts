import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { adminFirestore } from '@/lib/firebase-admin-server'
import {
  MAINTENANCE_DOC_PATH,
  ToolMaintenanceCurrent,
  buildDefaultMaintenanceCurrent,
  normalizeMaintenanceCurrent,
  validateMaintenanceConfig,
} from '@/lib/server/maintenance-config'

export const MAINTENANCE_EVENTS = [
  'admin.maintenance.update',
  'admin.login_control.update',
  'admin.feature_flags.update',
] as const

export type MaintenanceEvent = (typeof MAINTENANCE_EVENTS)[number]

export interface MaintenancePatchPayload {
  enabled?: boolean
  message?: string
  allowAdminBypass?: boolean
  allowedRoles?: string[]
  loginBlocked?: boolean
  sessionPolicy?: 'allow_existing' | 'force_logout'
  allowPasswordReset?: boolean
  featureFlags?: Record<string, boolean>
}

const MAINTENANCE_KEYS = new Set(['enabled', 'message', 'allowAdminBypass', 'allowedRoles'])
const LOGIN_CONTROL_KEYS = new Set(['loginBlocked', 'sessionPolicy', 'allowPasswordReset'])
const FEATURE_FLAGS_KEYS = new Set(['featureFlags'])

export function toIso(value: unknown): string {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (value instanceof Date) return value.toISOString()
  if (value instanceof Timestamp) return value.toDate().toISOString()
  if (typeof value === 'object' && value && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate().toISOString()
  }
  return ''
}

export async function getMaintenanceCurrent(): Promise<ToolMaintenanceCurrent> {
  const snapshot = await adminFirestore().collection(MAINTENANCE_DOC_PATH.collection).doc(MAINTENANCE_DOC_PATH.doc).get()
  if (!snapshot.exists) {
    return {
      ...buildDefaultMaintenanceCurrent(),
      updatedAt: null,
    }
  }
  return normalizeMaintenanceCurrent(snapshot.data() as Record<string, unknown>)
}

export function normalizePatch(input: unknown): MaintenancePatchPayload {
  const body = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>
  const patch: MaintenancePatchPayload = {}

  if (typeof body.enabled === 'boolean') patch.enabled = body.enabled
  if (typeof body.message === 'string') patch.message = body.message
  if (typeof body.allowAdminBypass === 'boolean') patch.allowAdminBypass = body.allowAdminBypass
  if (Array.isArray(body.allowedRoles)) patch.allowedRoles = body.allowedRoles.map((v) => String(v)).filter(Boolean)
  if (typeof body.loginBlocked === 'boolean') patch.loginBlocked = body.loginBlocked
  if (body.sessionPolicy === 'allow_existing' || body.sessionPolicy === 'force_logout') patch.sessionPolicy = body.sessionPolicy
  if (typeof body.allowPasswordReset === 'boolean') patch.allowPasswordReset = body.allowPasswordReset

  if (body.featureFlags && typeof body.featureFlags === 'object' && !Array.isArray(body.featureFlags)) {
    patch.featureFlags = Object.fromEntries(
      Object.entries(body.featureFlags as Record<string, unknown>).map(([key, value]) => [key, value === true])
    )
  }

  return patch
}

export function applyPatch(current: ToolMaintenanceCurrent, patch: MaintenancePatchPayload): ToolMaintenanceCurrent {
  const nextInput: Record<string, unknown> = {
    ...current,
    ...patch,
    featureFlags: patch.featureFlags ? { ...current.featureFlags, ...patch.featureFlags } : current.featureFlags,
  }
  return normalizeMaintenanceCurrent(nextInput)
}

function isEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

export function computeChangedKeys(before: ToolMaintenanceCurrent, after: ToolMaintenanceCurrent): string[] {
  const keys = [
    'enabled',
    'message',
    'allowAdminBypass',
    'allowedRoles',
    'loginBlocked',
    'sessionPolicy',
    'allowPasswordReset',
    'featureFlags',
  ] as const

  return keys.filter((key) => !isEqual(before[key], after[key]))
}

export function resolveMaintenanceEvent(changedKeys: string[]): MaintenanceEvent {
  if (changedKeys.length > 0 && changedKeys.every((key) => FEATURE_FLAGS_KEYS.has(key))) {
    return 'admin.feature_flags.update'
  }
  if (changedKeys.length > 0 && changedKeys.every((key) => LOGIN_CONTROL_KEYS.has(key))) {
    return 'admin.login_control.update'
  }
  if (changedKeys.length > 0 && changedKeys.every((key) => MAINTENANCE_KEYS.has(key))) {
    return 'admin.maintenance.update'
  }
  return 'admin.maintenance.update'
}

export function validatePatchResult(nextConfig: ToolMaintenanceCurrent): string | null {
  return validateMaintenanceConfig(nextConfig)
}

export function buildMaintenanceResponse(config: ToolMaintenanceCurrent) {
  return {
    ...config,
    updatedAt: toIso(config.updatedAt),
  }
}

export function buildAuditLogPayload(params: {
  event: MaintenanceEvent
  actorUid: string
  actorEmail: string
  reason: string
  before: ToolMaintenanceCurrent
  after: ToolMaintenanceCurrent
  changedKeys: string[]
  requestId: string
  ip: string | null
  userAgent: string | null
}) {
  return {
    event: params.event,
    action: params.event,
    actorUid: params.actorUid,
    actorEmail: params.actorEmail,
    reason: params.reason,
    target: 'toolMaintenance/current',
    before: params.before,
    after: params.after,
    changedKeys: params.changedKeys,
    requestId: params.requestId,
    ip: params.ip,
    userAgent: params.userAgent,
    createdAt: FieldValue.serverTimestamp(),
  }
}
