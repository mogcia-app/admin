import { createHash, createHmac, randomBytes, randomUUID } from 'crypto'
import { adminFirestore } from '@/lib/firebase-admin-server'

interface SignalInitialLoginTokenPayload {
  userId: string
  userEmail: string
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

function signPayload(payload: SignalInitialLoginTokenPayload, secret: string): string {
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

export async function createSignalInitialLoginToken(input: {
  userId: string
  userEmail: string
  expiresInMinutes?: number
}) {
  const secret = process.env.INVITE_LINK_SECRET
  if (!secret) {
    throw new Error('INVITE_LINK_SECRET が設定されていません')
  }

  const expiresInMinutes = input.expiresInMinutes ?? 1440
  const exp = Math.floor(Date.now() / 1000) + expiresInMinutes * 60
  const payload: SignalInitialLoginTokenPayload = {
    userId: input.userId,
    userEmail: input.userEmail,
    exp,
    nonce: `${randomUUID()}_${randomBytes(16).toString('hex')}`,
  }

  return {
    token: signPayload(payload, secret),
    exp,
  }
}

export async function createSignalInviteLink(params: {
  userId: string
  userEmail: string
  createdBy: string
  createdByRole: string
  expiresInMinutes?: number
}) {
  const signalToolBaseUrl = process.env.NEXT_PUBLIC_SIGNAL_TOOL_BASE_URL || 'https://signaltool.app'
  const expiresInMinutes = params.expiresInMinutes ?? 1440
  const now = Date.now()
  const { token, exp } = await createSignalInitialLoginToken({
    userId: params.userId,
    userEmail: params.userEmail,
    expiresInMinutes,
  })
  const expiresAt = new Date(exp * 1000)
  const tokenHash = sha256(token)

  const inviteDoc = await adminFirestore().collection('inviteLinks').add({
    userId: params.userId,
    userEmail: params.userEmail,
    tenantType: 'hq',
    agencyId: null,
    tokenHash,
    expiresAt,
    used: false,
    usedAt: null,
    createdAt: new Date(now),
    createdBy: params.createdBy,
    createdByRole: params.createdByRole,
  })

  return {
    inviteId: inviteDoc.id,
    inviteUrl: `${signalToolBaseUrl}/auth/callback?token=${encodeURIComponent(token)}`,
    expiresAt: expiresAt.toISOString(),
  }
}
