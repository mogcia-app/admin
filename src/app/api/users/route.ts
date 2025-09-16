import { NextRequest, NextResponse } from 'next/server'

// サンプルデータ（本番環境ではデータベースから取得）
const mockUsers = [
  {
    id: '1',
    name: '田中太郎',
    email: 'tanaka@example.com',
    role: 'user',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
    isActive: true,
  },
  {
    id: '2',
    name: '佐藤花子',
    email: 'sato@example.com',
    role: 'admin',
    createdAt: '2024-01-10T14:20:00Z',
    updatedAt: '2024-01-20T09:15:00Z',
    isActive: true,
  },
  {
    id: '3',
    name: '鈴木一郎',
    email: 'suzuki@example.com',
    role: 'moderator',
    createdAt: '2024-01-12T16:45:00Z',
    updatedAt: '2024-01-18T11:30:00Z',
    isActive: false,
  },
]

export async function GET(request: NextRequest) {
  try {
    // クエリパラメータの取得
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''

    // フィルタリング
    let filteredUsers = mockUsers
    if (search) {
      filteredUsers = mockUsers.filter(user => 
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase())
      )
    }

    // ページネーション
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex)

    return NextResponse.json({
      users: paginatedUsers,
      pagination: {
        page,
        limit,
        total: filteredUsers.length,
        totalPages: Math.ceil(filteredUsers.length / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // バリデーション（簡易版）
    if (!body.name || !body.email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      )
    }

    // 新しいユーザーの作成（本番環境ではデータベースに保存）
    const newUser = {
      id: Date.now().toString(),
      name: body.name,
      email: body.email,
      role: body.role || 'user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
    }

    return NextResponse.json(newUser, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
