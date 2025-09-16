'use client'

import React, { useState, useEffect } from 'react'
import { Users, UserCheck, TrendingUp, DollarSign, Loader2, Wifi } from 'lucide-react'
import { StatsCard } from '@/components/dashboard/stats-card'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useDashboardData } from '@/hooks/useFirebase'
import { testFirebaseConnection } from '@/lib/firebase-test'

export default function DashboardPage() {
  const { stats, loading, error, refresh } = useDashboardData()
  const [testing, setTesting] = useState(false)

  // 定期的にダッシュボードデータを更新
  useEffect(() => {
    const interval = setInterval(() => {
      refresh()
    }, 5000) // 5秒ごとに更新

    return () => clearInterval(interval)
  }, [refresh])

  const handleTestConnection = async () => {
    try {
      setTesting(true)
      const result = await testFirebaseConnection()
      if (result.success) {
        alert('✅ Firebase接続テスト成功！\n' + result.message)
      } else {
        alert('❌ Firebase接続テスト失敗\n' + result.message)
      }
    } catch (err) {
      console.error('Error testing connection:', err)
      alert('接続テスト中にエラーが発生しました。')
    } finally {
      setTesting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">ダッシュボードデータを読み込み中...</span>
      </div>
    )
  }

  const statsCards = [
    {
      title: '総ユーザー数',
      value: stats.totalUsers.toLocaleString(),
      description: '登録済みユーザー',
      icon: Users
    },
    {
      title: 'アクティブユーザー',
      value: stats.activeUsers.toLocaleString(),
      description: '過去30日間',
      icon: UserCheck
    },
    {
      title: '月間成長率',
      value: `${stats.monthlyGrowth}%`,
      description: 'ユーザー増加率',
      icon: TrendingUp
    },
    {
      title: '月間売上',
      value: `¥${stats.totalRevenue.toLocaleString()}`,
      description: '今月の売上',
      icon: DollarSign
    }
  ]

  return (
        <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">ダッシュボード</h1>
            <p className="text-muted-foreground">
              システムの概要と主要な指標を確認できます
              {error && <span className="text-destructive ml-2">(エラー: {error})</span>}
              {!error && !loading && <span className="text-green-600 ml-2">(実際のデータを表示中)</span>}
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleTestConnection} 
              disabled={testing}
              variant="outline"
            >
              {testing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  テスト中...
                </>
              ) : (
                <>
                  <Wifi className="h-4 w-4 mr-2" />
                  Firebase接続テスト
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statsCards.map((stat, index) => (
            <StatsCard key={index} {...stat} />
          ))}
        </div>

        {/* Charts and Tables */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>概要</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                チャートコンポーネントをここに配置
              </div>
            </CardContent>
          </Card>
          
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>最近のアクティビティ</CardTitle>
              <CardDescription>
                直近の重要な活動
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">新規ユーザー登録</p>
                    <p className="text-xs text-muted-foreground">2分前</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">システム更新完了</p>
                    <p className="text-xs text-muted-foreground">1時間前</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">メンテナンス予定</p>
                    <p className="text-xs text-muted-foreground">明日 2:00 AM</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
  )
}
