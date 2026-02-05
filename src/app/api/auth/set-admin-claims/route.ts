import { NextRequest, NextResponse } from 'next/server'
import { setAdminClaims } from '@/lib/firebase-admin-server'
import { auth } from '@/lib/firebase'
import { getAuth } from 'firebase-admin/auth'
import { adminAuth } from '@/lib/firebase-admin-server'

export async function POST(request: NextRequest) {
  try {
    const { uid, email } = await request.json()

    if (!uid || !email) {
      return NextResponse.json(
        { error: 'UID and email are required' },
        { status: 400 }
      )
    }

    // 管理者クレームを設定
    await setAdminClaims(uid, email)

    return NextResponse.json({ 
      success: true,
      message: 'Admin claims set successfully' 
    })
  } catch (error) {
    console.error('Error setting admin claims:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to set admin claims' },
      { status: 500 }
    )
  }
}

