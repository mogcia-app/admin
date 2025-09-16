import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // サンプルダッシュボードデータ（本番環境ではデータベースから取得）
    const dashboardData = {
      stats: {
        totalUsers: 1234,
        activeUsers: 892,
        totalRevenue: 2340000,
        monthlyGrowth: 23.1,
      },
      recentActivity: [
        {
          id: '1',
          type: 'user_registration',
          message: '新規ユーザー登録',
          timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2分前
          user: '田中太郎',
        },
        {
          id: '2',
          type: 'system_update',
          message: 'システム更新完了',
          timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1時間前
        },
        {
          id: '3',
          type: 'maintenance_scheduled',
          message: 'メンテナンス予定',
          timestamp: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 明日
        },
      ],
      chartData: {
        userGrowth: [
          { month: '1月', users: 400 },
          { month: '2月', users: 500 },
          { month: '3月', users: 600 },
          { month: '4月', users: 750 },
          { month: '5月', users: 900 },
          { month: '6月', users: 1234 },
        ],
        revenue: [
          { month: '1月', amount: 1500000 },
          { month: '2月', amount: 1800000 },
          { month: '3月', amount: 2100000 },
          { month: '4月', amount: 2200000 },
          { month: '5月', amount: 2300000 },
          { month: '6月', amount: 2340000 },
        ],
      },
    }

    return NextResponse.json(dashboardData)
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
