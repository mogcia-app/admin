'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { UserAcquisitionData } from '@/types'

interface UserAcquisitionChartProps {
  data: UserAcquisitionData[]
  loading?: boolean
}

export function UserAcquisitionChart({ data, loading }: UserAcquisitionChartProps) {
  // データを日付別に集計
  const dailyUsers = data.reduce((acc, item) => {
    const date = item.date
    acc[date] = (acc[date] || 0) + item.newUsers
    return acc
  }, {} as Record<string, number>)

  const chartData = Object.entries(dailyUsers)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-30) // 最近30日間

  const maxUsers = Math.max(...Object.values(dailyUsers))
  const totalNewUsers = data.reduce((sum, item) => sum + item.newUsers, 0)

  // ソース別集計
  const sourceBreakdown = data.reduce((acc, item) => {
    acc[item.source] = (acc[item.source] || 0) + item.newUsers
    return acc
  }, {} as Record<string, number>)

  const sourceColors = {
    organic: 'bg-green-500',
    paid: 'bg-blue-500',
    referral: 'bg-purple-500',
    social: 'bg-pink-500',
    direct: 'bg-gray-500'
  }

  const sourceLabels = {
    organic: 'オーガニック',
    paid: '有料広告',
    referral: '紹介',
    social: 'ソーシャル',
    direct: 'ダイレクト'
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>ユーザー獲得推移</CardTitle>
          <CardDescription>日別新規ユーザー獲得数</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">
              チャートを読み込み中...
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* ユーザー獲得推移チャート */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>ユーザー獲得推移</CardTitle>
          <CardDescription>
            日別新規ユーザー獲得数 (総計: {totalNewUsers.toLocaleString()}人)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            {chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                ユーザー獲得データがありません
              </div>
            ) : (
              <div className="h-full flex items-end space-x-1">
                {chartData.map(([date, users], index) => {
                  const height = maxUsers > 0 ? (users / maxUsers) * 100 : 0
                  
                  return (
                    <div
                      key={date}
                      className="flex-1 flex flex-col items-center group relative"
                    >
                      <div
                        className="w-full bg-indigo-500 rounded-t transition-all duration-300 hover:opacity-80"
                        style={{ height: `${height}%`, minHeight: users > 0 ? '2px' : '0px' }}
                      />
                      <div className="text-xs text-muted-foreground mt-2 transform -rotate-45 origin-left">
                        {new Date(date).toLocaleDateString('ja-JP', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                      
                      {/* ツールチップ */}
                      <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                        {new Date(date).toLocaleDateString('ja-JP')}
                        <br />
                        {users}人
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 獲得ソース別内訳 */}
      <Card>
        <CardHeader>
          <CardTitle>獲得ソース別内訳</CardTitle>
          <CardDescription>新規ユーザーの獲得元</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(sourceBreakdown)
              .sort(([, a], [, b]) => b - a)
              .map(([source, count]) => {
                const percentage = totalNewUsers > 0 ? (count / totalNewUsers) * 100 : 0
                const colorClass = sourceColors[source as keyof typeof sourceColors] || 'bg-gray-500'
                const label = sourceLabels[source as keyof typeof sourceLabels] || source
                
                return (
                  <div key={source} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${colorClass}`} />
                        <span className="font-medium">{label}</span>
                      </div>
                      <span className="text-muted-foreground">
                        {count}人 ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${colorClass}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
          </div>
          
          {Object.keys(sourceBreakdown).length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              獲得ソースデータがありません
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
