import { NextRequest, NextResponse } from 'next/server'
import { setAdminClaims } from '@/lib/firebase-admin-server'

// CORSプリフライトリクエストに対応
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

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
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    console.error('Error setting admin claims:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to set admin claims' },
      { status: 500 }
    )
  }
}


