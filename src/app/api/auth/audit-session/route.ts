import { FieldValue } from 'firebase-admin/firestore'
import { NextRequest, NextResponse } from 'next/server'
import { adminFirestore } from '@/lib/firebase-admin-server'
import { authenticateAdminApiRequest } from '@/lib/admin-api-auth'

interface Body {
  action?: 'auth.login' | 'auth.logout'
}

export async function POST(request: NextRequest) {
  try {
    const actor = await authenticateAdminApiRequest(request)
    const body = (await request.json().catch(() => ({}))) as Body
    const action = body.action

    if (action !== 'auth.login' && action !== 'auth.logout') {
      return NextResponse.json({ error: 'action は auth.login / auth.logout のみ指定できます' }, { status: 400 })
    }

    await adminFirestore().collection('auditLogs').add({
      event: action,
      action,
      tenantType: 'hq',
      actor: {
        uid: actor.uid,
        email: actor.email,
        role: actor.role,
      },
      target: {
        type: 'system',
      },
      metadata: {
        source: 'admin.auth',
      },
      createdAt: FieldValue.serverTimestamp(),
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof Error && error.message.includes('認証')) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    console.error('[POST /api/auth/audit-session] error', error)
    return NextResponse.json({ error: '認証ログの保存に失敗しました' }, { status: 500 })
  }
}

