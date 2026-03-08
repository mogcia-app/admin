import { randomBytes } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { adminAuth, adminFirestore } from '@/lib/firebase-admin-server'
import { authenticateAdminApiRequest, assertRoleAllowed } from '@/lib/admin-api-auth'

function buildRandomPassword(): string {
  const bytes = randomBytes(12).toString('base64url')
  return `Sg!${bytes}9a`
}

export async function POST(request: NextRequest, context: { params: Promise<{ uid: string }> }) {
  try {
    const actor = await authenticateAdminApiRequest(request)
    assertRoleAllowed(actor, ['super_admin', 'billing_admin', 'admin', 'hq_admin'])

    const { uid } = await context.params
    if (!uid) {
      return NextResponse.json({ error: 'uid は必須です' }, { status: 400 })
    }

    const userRef = adminFirestore().collection('users').doc(uid)
    const userSnap = await userRef.get()
    if (!userSnap.exists) {
      return NextResponse.json({ error: '対象ユーザーが存在しません' }, { status: 404 })
    }

    const password = buildRandomPassword()
    await adminAuth().updateUser(uid, {
      password,
      disabled: false,
    })

    await Promise.all([
      userRef.set(
        {
          onboardingInitialPassword: password,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      ),
      adminFirestore().collection('auditLogs').add({
        event: 'admin.user.initialPassword.regenerate',
        action: 'admin.user.initialPassword.regenerate',
        tenantType: 'hq',
        actor: {
          uid: actor.uid,
          email: actor.email,
          role: actor.role,
        },
        target: {
          type: 'user',
          id: uid,
        },
        createdAt: FieldValue.serverTimestamp(),
      }),
    ])

    return NextResponse.json({
      ok: true,
      password,
    })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('認証')) {
        return NextResponse.json({ error: error.message }, { status: 401 })
      }
      if (error.message.includes('権限')) {
        return NextResponse.json({ error: error.message }, { status: 403 })
      }
    }

    console.error('[POST /api/admin/users/:uid/onboarding-password] error', error)
    return NextResponse.json({ error: '初期パスワードの再発行に失敗しました' }, { status: 500 })
  }
}

