import { createHash, createHmac, randomBytes, randomUUID } from 'crypto'
import { adminFirestore } from '@/lib/firebase-admin-server'
import { TermsAgreementStatus, TermsConsentSummary, TermsFlowType } from '@/types'

interface TermsLinkTokenPayload {
  userId: string
  userEmail: string
  exp: number
  nonce: string
}

interface TermsLinkDocument {
  userId: string
  userEmail: string
  tokenHash: string
  expiresAt: Date
  createdAt: Date
  createdBy: string
  createdByRole: string
  usedAt: Date | null
  revokedAt: Date | null
  flowType: TermsFlowType
  version: string
  privacyPolicyUrl: string
  toolTermsUrl: string
  memberSiteTermsUrl: string
}

export interface TermsConsentDocuments {
  version: string
  privacyPolicyUrl: string
  toolTermsUrl: string
  memberSiteTermsUrl: string
}

export interface TermsConsentResolution {
  userId: string
  userEmail: string
  version: string
  flowType: TermsFlowType
  privacyPolicyUrl: string
  toolTermsUrl: string
  memberSiteTermsUrl: string
  linkId: string
  expiresAtIso: string
  alreadyUsed: boolean
}

function toDateValue(value: unknown): Date | null {
  if (value instanceof Date) {
    return value
  }

  if (
    value &&
    typeof value === 'object' &&
    'toDate' in value &&
    typeof (value as { toDate?: unknown }).toDate === 'function'
  ) {
    const date = (value as { toDate: () => Date }).toDate()
    return date instanceof Date ? date : null
  }

  return null
}

function base64UrlEncode(input: string): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

function signPayload(payload: TermsLinkTokenPayload, secret: string): string {
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

function getTermsLinkSecret(): string {
  const secret = process.env.TERMS_LINK_SECRET || process.env.INVITE_LINK_SECRET
  if (!secret) {
    throw new Error('TERMS_LINK_SECRET または INVITE_LINK_SECRET が設定されていません')
  }
  return secret
}

export function getTermsDocuments(): TermsConsentDocuments {
  return {
    version: process.env.NEXT_PUBLIC_TERMS_VERSION || '2026-01',
    privacyPolicyUrl: process.env.NEXT_PUBLIC_PRIVACY_POLICY_URL || 'https://signaltool.app/privacy',
    toolTermsUrl: process.env.NEXT_PUBLIC_TOOL_TERMS_URL || 'https://signaltool.app/terms',
    memberSiteTermsUrl: process.env.NEXT_PUBLIC_MEMBER_SITE_TERMS_URL || 'https://signaltool.app/member-terms',
  }
}

export function buildTermsSummary(params: {
  status: TermsAgreementStatus
  agreedAt?: string
  version?: string
  source?: 'admin_link' | 'admin_manual' | 'legacy_import'
}): TermsConsentSummary {
  return {
    status: params.status,
    ...(params.agreedAt ? { agreedAt: params.agreedAt } : {}),
    ...(params.version ? { version: params.version } : {}),
    ...(params.source ? { source: params.source } : {}),
  }
}

async function createTermsToken(input: {
  userId: string
  userEmail: string
  expiresInMinutes: number
}) {
  const exp = Math.floor(Date.now() / 1000) + input.expiresInMinutes * 60
  const payload: TermsLinkTokenPayload = {
    userId: input.userId,
    userEmail: input.userEmail,
    exp,
    nonce: `${randomUUID()}_${randomBytes(16).toString('hex')}`,
  }

  return {
    token: signPayload(payload, getTermsLinkSecret()),
    exp,
  }
}

export async function createTermsAgreementLink(params: {
  userId: string
  userEmail: string
  createdBy: string
  createdByRole: string
  flowType: TermsFlowType
  expiresInMinutes?: number
}) {
  const expiresInMinutes = params.expiresInMinutes ?? 10080
  const appBaseUrl = process.env.NEXT_PUBLIC_ADMIN_APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const documents = getTermsDocuments()
  const { token, exp } = await createTermsToken({
    userId: params.userId,
    userEmail: params.userEmail,
    expiresInMinutes,
  })
  const expiresAt = new Date(exp * 1000)
  const tokenHash = sha256(token)

  const docRef = await adminFirestore().collection('termsLinks').add({
    userId: params.userId,
    userEmail: params.userEmail,
    tokenHash,
    expiresAt,
    createdAt: new Date(),
    createdBy: params.createdBy,
    createdByRole: params.createdByRole,
    usedAt: null,
    revokedAt: null,
    flowType: params.flowType,
    version: documents.version,
    privacyPolicyUrl: documents.privacyPolicyUrl,
    toolTermsUrl: documents.toolTermsUrl,
    memberSiteTermsUrl: documents.memberSiteTermsUrl,
  } satisfies TermsLinkDocument)

  return {
    linkId: docRef.id,
    agreementUrl: `${appBaseUrl}/terms/${encodeURIComponent(token)}`,
    expiresAt: expiresAt.toISOString(),
    ...documents,
  }
}

export async function resolveTermsToken(token: string): Promise<TermsConsentResolution | null> {
  const tokenHash = sha256(token)
  const snapshot = await adminFirestore().collection('termsLinks').where('tokenHash', '==', tokenHash).limit(1).get()
  if (snapshot.empty) {
    return null
  }

  const doc = snapshot.docs[0]
  const data = doc.data() as Partial<TermsLinkDocument>
  const expiresAt = toDateValue(data.expiresAt)
  if (!expiresAt) {
    return null
  }

  const now = Date.now()
  if (expiresAt.getTime() < now) {
    return null
  }

  if (data.revokedAt) {
    return null
  }

  return {
    userId: String(data.userId || ''),
    userEmail: String(data.userEmail || ''),
    version: String(data.version || getTermsDocuments().version),
    flowType: (data.flowType as TermsFlowType) || 'required',
    privacyPolicyUrl: String(data.privacyPolicyUrl || getTermsDocuments().privacyPolicyUrl),
    toolTermsUrl: String(data.toolTermsUrl || getTermsDocuments().toolTermsUrl),
    memberSiteTermsUrl: String(data.memberSiteTermsUrl || getTermsDocuments().memberSiteTermsUrl),
    linkId: doc.id,
    expiresAtIso: expiresAt.toISOString(),
    alreadyUsed: Boolean(data.usedAt),
  }
}
