import { NextRequest } from 'next/server'
import { adminAuth, adminFirestore } from '@/lib/firebase-admin-server'
import { getAdminUser } from '@/lib/admin-users'

export type AdminApiRole = 'super_admin' | 'billing_admin' | 'admin' | 'hq_admin' | 'agency_admin' | 'user'

export interface AdminApiActor {
  uid: string
  email: string
  role: AdminApiRole
}

function normalizeRole(value: unknown): AdminApiRole | null {
  if (typeof value !== 'string') return null
  if (
    value === 'super_admin' ||
    value === 'billing_admin' ||
    value === 'admin' ||
    value === 'hq_admin' ||
    value === 'agency_admin' ||
    value === 'user'
  ) {
    return value
  }
  return null
}

function resolveRole(params: {
  userDocRole: unknown
  claimRole: unknown
  email: string
  hasAdminClaim: boolean
}): AdminApiRole {
  const admin = getAdminUser(params.email)
  if (admin?.role === 'super_admin' || admin?.role === 'billing_admin' || admin?.role === 'admin') {
    return admin.role
  }

  const tokenRole = normalizeRole(params.claimRole)
  if (tokenRole) return tokenRole

  const docRole = normalizeRole(params.userDocRole)
  if (docRole) return docRole

  if (params.hasAdminClaim) {
    return 'admin'
  }

  return 'user'
}

export async function authenticateAdminApiRequest(request: NextRequest): Promise<AdminApiActor> {
  const authHeader = request.headers.get('authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    throw new Error('認証トークンが必要です')
  }

  const decoded = await adminAuth().verifyIdToken(token)
  const email = decoded.email || ''
  const userDoc = await adminFirestore().collection('users').doc(decoded.uid).get()
  const userData = userDoc.exists ? (userDoc.data() as Record<string, unknown>) : {}

  return {
    uid: decoded.uid,
    email,
    role: resolveRole({
      userDocRole: userData.role,
      claimRole: decoded.role,
      email,
      hasAdminClaim: decoded.admin === true,
    }),
  }
}

export function assertRoleAllowed(actor: AdminApiActor, allowedRoles: AdminApiRole[]) {
  if (!allowedRoles.includes(actor.role)) {
    throw new Error('この操作を実行する権限がありません')
  }
}
