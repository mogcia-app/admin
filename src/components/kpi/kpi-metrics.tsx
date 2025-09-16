'use client'

import React from 'react'
import { TrendingUp, TrendingDown, Target, DollarSign, Users, Zap, RotateCcw } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { KPIMetric } from '@/types'

interface KPIMetricsProps {
  metrics: KPIMetric[]
  loading?: boolean
}

export function KPIMetrics({ metrics, loading }: KPIMetricsProps) {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'revenue':
        return DollarSign
      case 'users':
        return Users
      case 'engagement':
        return Zap
      case 'retention':
        return RotateCcw
      case 'conversion':
        return Target
      default:
        return Target
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'revenue':
        return 'text-green-600'
      case 'users':
        return 'text-blue-600'
      case 'engagement':
        return 'text-purple-600'
      case 'retention':
        return 'text-orange-600'
      case 'conversion':
        return 'text-indigo-600'
      default:
        return 'text-gray-600'
    }
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'revenue':
        return '売上'
      case 'users':
        return 'ユーザー'
      case 'engagement':
        return 'エンゲージメント'
      case 'retention':
        return 'リテンション'
      case 'conversion':
        return 'コンバージョン'
      default:
        return category
    }
  }

  const formatValue = (value: number, unit: string) => {
    if (unit === 'JPY') {
      return new Intl.NumberFormat('ja-JP', {
        style: 'currency',
        currency: 'JPY',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value)
    } else if (unit === '%') {
      return `${value.toFixed(1)}%`
    } else if (unit === 'users') {
      return `${value.toLocaleString()}人`
    } else {
      return `${value.toLocaleString()}${unit}`
    }
  }

  const getProgressPercentage = (value: number, target: number) => {
    if (target === 0) return 0
    return Math.min((value / target) * 100, 100)
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-green-500'
    if (percentage >= 80) return 'bg-yellow-500'
    if (percentage >= 60) return 'bg-orange-500'
    return 'bg-red-500'
  }

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-32"></div>
              <div className="h-3 bg-muted rounded w-48"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="h-8 bg-muted rounded w-24"></div>
                <div className="h-2 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded w-20"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // カテゴリ別にグループ化
  const groupedMetrics = metrics.reduce((acc, metric) => {
    if (!acc[metric.category]) {
      acc[metric.category] = []
    }
    acc[metric.category].push(metric)
    return acc
  }, {} as Record<string, KPIMetric[]>)

  return (
    <div className="space-y-6">
      {Object.entries(groupedMetrics).map(([category, categoryMetrics]) => (
        <div key={category}>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            {React.createElement(getCategoryIcon(category), { 
              className: `h-5 w-5 ${getCategoryColor(category)}` 
            })}
            {getCategoryLabel(category)}
          </h3>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {categoryMetrics.map((metric) => {
              const progressPercentage = getProgressPercentage(metric.value, metric.target)
              const progressColor = getProgressColor(progressPercentage)
              const isPositiveTrend = metric.trend === 'up'
              const TrendIcon = isPositiveTrend ? TrendingUp : TrendingDown
              
              return (
                <Card key={metric.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center justify-between">
                      {metric.name}
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        metric.category === 'revenue' ? 'bg-green-100 text-green-800' :
                        metric.category === 'users' ? 'bg-blue-100 text-blue-800' :
                        metric.category === 'engagement' ? 'bg-purple-100 text-purple-800' :
                        metric.category === 'retention' ? 'bg-orange-100 text-orange-800' :
                        'bg-indigo-100 text-indigo-800'
                      }`}>
                        {getCategoryLabel(metric.category)}
                      </span>
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {metric.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    <div className="flex items-baseline justify-between">
                      <div className="text-2xl font-bold">
                        {formatValue(metric.value, metric.unit)}
                      </div>
                      <div className={`flex items-center text-sm ${
                        isPositiveTrend ? 'text-green-600' : 'text-red-600'
                      }`}>
                        <TrendIcon className="h-3 w-3 mr-1" />
                        {Math.abs(metric.changePercent).toFixed(1)}%
                      </div>
                    </div>
                    
                    {/* 目標との進捗 */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>目標: {formatValue(metric.target, metric.unit)}</span>
                        <span>{progressPercentage.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${progressColor}`}
                          style={{ width: `${progressPercentage}%` }}
                        />
                      </div>
                    </div>
                    
                    <div className="text-xs text-muted-foreground">
                      更新: {new Date(metric.updatedAt).toLocaleDateString('ja-JP', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      ))}
      
      {metrics.length === 0 && (
        <div className="text-center py-12">
          <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">KPIメトリクスが設定されていません</p>
        </div>
      )}
    </div>
  )
}
