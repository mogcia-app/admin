'use client'

import React from 'react'
import { TrendingUp, TrendingDown, Users, DollarSign, Target, Zap } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { KPIDashboardData } from '@/types'

interface KPIOverviewProps {
  data: KPIDashboardData['overview']
  loading?: boolean
}

export function KPIOverview({ data, loading }: KPIOverviewProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ja-JP').format(num)
  }

  const formatPercent = (num: number) => {
    return `${num.toFixed(1)}%`
  }

  const overviewCards = [
    {
      title: '総売上',
      value: formatCurrency(data.totalRevenue),
      description: '今月の総売上',
      icon: DollarSign,
      trend: data.totalRevenue > 0 ? 'up' : 'neutral',
      color: 'text-green-600'
    },
    {
      title: 'MRR',
      value: formatCurrency(data.monthlyRecurringRevenue),
      description: '月間経常収益',
      icon: TrendingUp,
      trend: 'up',
      color: 'text-blue-600'
    },
    {
      title: '総ユーザー数',
      value: formatNumber(data.totalUsers),
      description: '登録済みユーザー',
      icon: Users,
      trend: 'up',
      color: 'text-purple-600'
    },
    {
      title: 'アクティブユーザー',
      value: formatNumber(data.activeUsers),
      description: '今月のアクティブユーザー',
      icon: Zap,
      trend: 'up',
      color: 'text-orange-600'
    },
    {
      title: '新規ユーザー',
      value: formatNumber(data.newUsersThisMonth),
      description: '今月の新規ユーザー',
      icon: Users,
      trend: 'up',
      color: 'text-indigo-600'
    },
    {
      title: 'ARPU',
      value: formatCurrency(data.averageRevenuePerUser),
      description: 'ユーザー当たり平均売上',
      icon: Target,
      trend: 'up',
      color: 'text-teal-600'
    },
    {
      title: 'LTV',
      value: formatCurrency(data.customerLifetimeValue),
      description: '顧客生涯価値',
      icon: TrendingUp,
      trend: 'up',
      color: 'text-emerald-600'
    },
    {
      title: 'チャーンレート',
      value: formatPercent(data.churnRate),
      description: '月間解約率',
      icon: TrendingDown,
      trend: 'down',
      color: 'text-red-600'
    }
  ]

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-muted rounded w-24"></div>
              <div className="h-4 w-4 bg-muted rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-32 mb-2"></div>
              <div className="h-3 bg-muted rounded w-40"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {overviewCards.map((card, index) => {
        const Icon = card.icon
        const isPositiveTrend = card.trend === 'up'
        const TrendIcon = isPositiveTrend ? TrendingUp : TrendingDown
        
        return (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                <TrendIcon 
                  className={`h-3 w-3 mr-1 ${
                    isPositiveTrend ? 'text-green-500' : 'text-red-500'
                  }`} 
                />
                <span>{card.description}</span>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
