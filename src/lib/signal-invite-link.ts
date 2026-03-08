import { createHash, createHmac, randomBytes, randomUUID } from 'crypto'
import { adminFirestore } from '@/lib/firebase-admin-server'

interface InvitePayload {
  uid: string
  email: string
  exp: number
  nonce: string
}

function base64UrlEncode(input: string): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

function signPayload(payload: InvitePayload, secret: string): string {
  const header = { alg: 'HS256', typ: 'JWT' }
  const headerPart = base64UrlEncode(JSON.stringify(header))
  const payloadPart = base64UrlEncode(JSON.stringify(payload))
  const data = `${headerPart}.${payloadPart}`
  const signature = createHmac('sha256', secret)
    .update(data)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')

  return `${data}.${signature}`
}

function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex')
}

export async function createSignalInviteLink(params: {
  userId: string
  userEmail: string
  createdBy: string
  createdByRole: string
  expiresInMinutes?: number
}) {
  const secret = process.env.INVITE_LINK_SECRET
  if (!secret) {
    throw new Error('INVITE_LINK_SECRET が設定されていません')
  }

  const signalToolBaseUrl = process.env.NEXT_PUBLIC_SIGNAL_TOOL_BASE_URL || 'https://signaltool.app'
  const expiresInMinutes = params.expiresInMinutes ?? 1440
  const now = Date.now()
  const exp = now + expiresInMinutes * 60 * 1000

  const payload: InvitePayload = {
    uid: params.userId,
    email: params.userEmail,
    exp,
    nonce: `${randomUUID()}_${randomBytes(16).toString('hex')}`,
  }

  const token = signPayload(payload, secret)
  const tokenHash = sha256(token)

  const inviteDoc = await adminFirestore().collection('inviteLinks').add({
    userId: params.userId,
    userEmail: params.userEmail,
    tenantType: 'hq',
    agencyId: null,
    tokenHash,
    expiresAt: new Date(exp),
    used: false,
    usedAt: null,
    createdAt: new Date(now),
    createdBy: params.createdBy,
    createdByRole: params.createdByRole,
  })

  return {
    inviteId: inviteDoc.id,
    inviteUrl: `${signalToolBaseUrl}/invite?token=${encodeURIComponent(token)}`,
    expiresAt: new Date(exp).toISOString(),
  }
}
