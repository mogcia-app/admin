'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RevenueData } from '@/types'

interface RevenueChartProps {
  data: RevenueData[]
  loading?: boolean
}

export function RevenueChart({ data, loading }: RevenueChartProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // データを日付別に集計
  const dailyRevenue = data.reduce((acc, item) => {
    const date = item.date
    acc[date] = (acc[date] || 0) + item.amount
    return acc
  }, {} as Record<string, number>)

  const chartData = Object.entries(dailyRevenue)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-30) // 最近30日間

  const maxRevenue = Math.max(...Object.values(dailyRevenue))
  const totalRevenue = data.reduce((sum, item) => sum + item.amount, 0)

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>売上推移</CardTitle>
          <CardDescription>日別売上の推移</CardDescription>
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
    <Card>
      <CardHeader>
        <CardTitle>売上推移</CardTitle>
        <CardDescription>
          日別売上の推移 (総額: {formatCurrency(totalRevenue)})
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          {chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              売上データがありません
            </div>
          ) : (
            <div className="h-full flex items-end space-x-2">
              {chartData.map(([date, amount], index) => {
                const height = (amount / maxRevenue) * 100
                const isWeekend = new Date(date).getDay() === 0 || new Date(date).getDay() === 6
                
                return (
                  <div
                    key={date}
                    className="flex-1 flex flex-col items-center group relative"
                  >
                    <div
                      className={`w-full rounded-t transition-all duration-300 hover:opacity-80 ${
                        isWeekend ? 'bg-blue-400' : 'bg-blue-500'
                      }`}
                      style={{ height: `${height}%`, minHeight: '2px' }}
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
                      {formatCurrency(amount)}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
