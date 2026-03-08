import { addDoc, collection, getDocs, limit, orderBy, query, Timestamp, where } from 'firebase/firestore'
import { db } from './firebase'
import { AuditLog, User } from '@/types'

interface LogAuditActionInput {
  tenantType: AuditLog['tenantType']
  agencyId?: string
  action: AuditLog['action']
  actor: {
    uid: string
    email?: string
    role: User['role']
  }
  target?: AuditLog['target']
  changes?: AuditLog['changes']
  metadata?: AuditLog['metadata']
}

export async function logAuditAction(input: LogAuditActionInput): Promise<string> {
  const docRef = await addDoc(collection(db, 'auditLogs'), {
    tenantType: input.tenantType,
    agencyId: input.agencyId || null,
    action: input.action,
    actor: input.actor,
    target: input.target || null,
    changes: input.changes || null,
    metadata: input.metadata || null,
    createdAt: Timestamp.now(),
  })

  return docRef.id
}

interface GetAuditLogsOptions {
  agencyId?: string
  max?: number
}

export async function getAuditLogs(options: GetAuditLogsOptions = {}): Promise<AuditLog[]> {
  const max = options.max ?? 200

  const baseRef = collection(db, 'auditLogs')
  const q = options.agencyId
    ? query(baseRef, where('agencyId', '==', options.agencyId), orderBy('createdAt', 'desc'), limit(max))
    : query(baseRef, orderBy('createdAt', 'desc'), limit(max))

  const snapshot = await getDocs(q)

  return snapshot.docs.map((docSnapshot) => {
    const data = docSnapshot.data() as Record<string, unknown>
    const createdAtValue = data.createdAt as { toDate?: () => Date } | string | undefined
    return {
      id: docSnapshot.id,
      tenantType: (data.tenantType as AuditLog['tenantType']) || 'hq',
      agencyId: data.agencyId ? String(data.agencyId) : undefined,
      action: data.action as AuditLog['action'],
      actor: data.actor as AuditLog['actor'],
      target: (data.target as AuditLog['target']) || undefined,
      changes: (data.changes as AuditLog['changes']) || undefined,
      metadata: (data.metadata as AuditLog['metadata']) || undefined,
      createdAt:
        createdAtValue && typeof createdAtValue === 'object' && createdAtValue.toDate
          ? createdAtValue.toDate().toISOString()
          : String(createdAtValue || ''),
    }
  })
}
