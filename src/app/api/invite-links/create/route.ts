import { NextRequest, NextResponse } from 'next/server'
import { createHash, createHmac, randomBytes, randomUUID } from 'crypto'
import { adminAuth, adminFirestore } from '@/lib/firebase-admin-server'
import { isAdminUser } from '@/lib/admin-users'
import { User } from '@/types'

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

async function validateAdminRequest(request: NextRequest) {
  const authHeader = request.headers.get('authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    throw new Error('認証トークンが必要です')
  }

  const decoded = await adminAuth().verifyIdToken(token)
  const email = decoded.email || ''
  const userDoc = await adminFirestore().collection('users').doc(decoded.uid).get()
  const userData = userDoc.exists ? (userDoc.data() as Record<string, unknown>) : {}
  const role = (userData.role as User['role']) || (decoded.admin === true || isAdminUser(email) ? 'hq_admin' : 'user')
  const agencyId = typeof userData.agencyId === 'string' ? userData.agencyId : undefined

  const isAllowed =
    decoded.admin === true ||
    isAdminUser(email) ||
    role === 'hq_admin' ||
    role === 'admin' ||
    role === 'agency_admin'

  if (!isAllowed) {
    throw new Error('管理者権限がありません')
  }

  return {
    uid: decoded.uid,
    email,
    role,
    agencyId,
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await validateAdminRequest(request)
    const body = await request.json()

    const userId = String(body.userId || '')
    const userEmail = String(body.userEmail || '')
    const expiresInMinutes = Number(body.expiresInMinutes || 1440)

    if (!userId || !userEmail) {
      return NextResponse.json({ error: 'userId と userEmail は必須です' }, { status: 400 })
    }

    if (!Number.isFinite(expiresInMinutes) || expiresInMinutes < 1 || expiresInMinutes > 1440) {
      return NextResponse.json({ error: 'expiresInMinutes は 1-1440 の範囲で指定してください' }, { status: 400 })
    }

    const targetUserDoc = await adminFirestore().collection('users').doc(userId).get()
    if (!targetUserDoc.exists) {
      return NextResponse.json({ error: '対象ユーザーが存在しません' }, { status: 404 })
    }

    // agency_admin は自社ユーザーに対してのみ招待リンク発行可能
    if (actor.role === 'agency_admin') {
      if (!actor.agencyId) {
        return NextResponse.json({ error: 'agencyId が設定されていません' }, { status: 403 })
      }

      const targetData = targetUserDoc.data() as Record<string, unknown>
      const targetAgencyId = typeof targetData.agencyId === 'string' ? targetData.agencyId : null
      if (targetAgencyId !== actor.agencyId) {
        return NextResponse.json({ error: '他代理店ユーザーへの招待リンク発行はできません' }, { status: 403 })
      }
    }

    const secret = process.env.INVITE_LINK_SECRET
    if (!secret) {
      return NextResponse.json({ error: 'INVITE_LINK_SECRET が設定されていません' }, { status: 500 })
    }

    const signalToolBaseUrl = process.env.NEXT_PUBLIC_SIGNAL_TOOL_BASE_URL || 'https://signaltool.app'
    const now = Date.now()
    const exp = now + expiresInMinutes * 60 * 1000

    const payload: InvitePayload = {
      uid: userId,
      email: userEmail,
      exp,
      nonce: `${randomUUID()}_${randomBytes(16).toString('hex')}`,
    }

    const token = signPayload(payload, secret)
    const tokenHash = sha256(token)

    const inviteTenantType = actor.role === 'agency_admin' ? 'agency' : 'hq'
    const inviteAgencyId = inviteTenantType === 'agency' ? actor.agencyId : null

    const inviteDoc = await adminFirestore().collection('inviteLinks').add({
      userId,
      userEmail,
      tenantType: inviteTenantType,
      agencyId: inviteAgencyId,
      tokenHash,
      expiresAt: new Date(exp),
      used: false,
      usedAt: null,
      createdAt: new Date(now),
      createdBy: actor.email || actor.uid,
      createdByRole: actor.role,
    })

    const inviteUrl = `${signalToolBaseUrl}/invite?token=${encodeURIComponent(token)}`

    return NextResponse.json({
      success: true,
      inviteId: inviteDoc.id,
      inviteUrl,
      expiresAt: new Date(exp).toISOString(),
      note: 'このURLは短命かつワンタイム運用を想定しています。通常ログインはメール/パスワードを利用してください。',
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : '招待リンクの作成に失敗しました'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}
