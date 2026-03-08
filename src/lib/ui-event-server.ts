import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { NextRequest } from 'next/server'
import { adminFirestore } from '@/lib/firebase-admin-server'
import { authenticateAdminApiRequest, assertRoleAllowed } from '@/lib/admin-api-auth'
import { UI_EVENT_TYPE, type UiEventType } from '@/lib/ui-event-types'

const UI_EVENT_COLLECTION = 'uiEventLogs'

interface BaseUiEventPayload {
  buttonId?: string
  label?: string
  pagePath?: string
  currentPath?: string
  href?: string
  sessionId?: string
  clickedAtClient?: string
}

function normalizeString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value.trim() : fallback
}

function parseClientDate(value: string): Timestamp {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return Timestamp.now()
  }
  return Timestamp.fromDate(parsed)
}

export async function writeUiEventLog(request: NextRequest, eventType: UiEventType) {
  const actor = await authenticateAdminApiRequest(request)
  const body = (await request.json().catch(() => ({}))) as BaseUiEventPayload

  const buttonId = normalizeString(body.buttonId)
  const label = normalizeString(body.label)
  const currentPath = normalizeString(body.currentPath)
  const sessionId = normalizeString(body.sessionId)
  const pagePath = normalizeString(body.pagePath)
  const href = normalizeString(body.href)
  const clickedAtClientRaw = normalizeString(body.clickedAtClient)

  if (!buttonId) {
    throw new Error('buttonId は必須です')
  }
  if (!label) {
    throw new Error('label は必須です')
  }
  if (!currentPath) {
    throw new Error('currentPath は必須です')
  }
  if (!sessionId) {
    throw new Error('sessionId は必須です')
  }

  const clickedAtClient = clickedAtClientRaw || new Date().toISOString()

  await adminFirestore().collection(UI_EVENT_COLLECTION).add({
    eventType,
    actorUid: actor.uid,
    actorEmail: actor.email,
    buttonId,
    label,
    pagePath: pagePath || currentPath,
    currentPath,
    href: eventType === UI_EVENT_TYPE.SIDEBAR_CLICK ? href : null,
    sessionId,
    clickedAtClient,
    clickedAt: parseClientDate(clickedAtClient),
    createdAt: FieldValue.serverTimestamp(),
  })
}

export function assertUiEventAdminRole(request: NextRequest) {
  return authenticateAdminApiRequest(request).then((actor) => {
    assertRoleAllowed(actor, ['super_admin', 'billing_admin', 'admin', 'hq_admin'])
    return actor
  })
}

export function parseDateFilter(value: string | null): Timestamp | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return Timestamp.fromDate(date)
}

export { UI_EVENT_COLLECTION }
