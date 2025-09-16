'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { SalesProgress, Deal } from '@/types'
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  DollarSign, 
  Calendar,
  User,
  Briefcase,
  Plus,
  Edit,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react'

interface SalesTrackerProps {
  salesProgress: SalesProgress[]
  deals: Deal[]
  loading: boolean
  onUpdateProgress: (id: string, updates: Partial<SalesProgress>) => void
  onUpdateDeal: (id: string, updates: Partial<Deal>) => void
}

export function SalesTracker({ 
  salesProgress, 
  deals, 
  loading, 
  onUpdateProgress, 
  onUpdateDeal 
}: SalesTrackerProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('')

  // 現在の期間の進捗を取得
  const currentPeriod = new Date().toISOString().slice(0, 7) // YYYY-MM
  const currentProgress = salesProgress.find(p => p.period === currentPeriod)
  
  // 全体統計の計算
  const totalTarget = salesProgress.reduce((sum, p) => sum + p.target, 0)
  const totalAchieved = salesProgress.reduce((sum, p) => sum + p.achieved, 0)
  const overallProgress = totalTarget > 0 ? (totalAchieved / totalTarget) * 100 : 0

  // 案件統計
  const totalDeals = deals.length
  const closedWonDeals = deals.filter(d => d.stage === 'closed_won').length
  const totalDealValue = deals.reduce((sum, deal) => sum + deal.amount, 0)
  const closedDealValue = deals
    .filter(d => d.stage === 'closed_won')
    .reduce((sum, deal) => sum + deal.amount, 0)

  const getProgressColor = (achieved: number, target: number) => {
    const percentage = (achieved / target) * 100
    if (percentage >= 100) return 'text-green-600'
    if (percentage >= 80) return 'text-blue-600'
    if (percentage >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getProgressIcon = (achieved: number, target: number) => {
    const percentage = (achieved / target) * 100
    if (percentage >= 100) return <TrendingUp className="h-4 w-4 text-green-600" />
    if (percentage >= 80) return <TrendingUp className="h-4 w-4 text-blue-600" />
    return <TrendingDown className="h-4 w-4 text-red-600" />
  }

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'lead':
        return 'bg-gray-100 text-gray-800'
      case 'qualified':
        return 'bg-blue-100 text-blue-800'
      case 'proposal':
        return 'bg-yellow-100 text-yellow-800'
      case 'negotiation':
        return 'bg-orange-100 text-orange-800'
      case 'closed_won':
        return 'bg-green-100 text-green-800'
      case 'closed_lost':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'closed_won':
        return <CheckCircle className="h-3 w-3" />
      case 'closed_lost':
        return <AlertCircle className="h-3 w-3" />
      case 'negotiation':
        return <Clock className="h-3 w-3" />
      default:
        return <Briefcase className="h-3 w-3" />
    }
  }

  const getStageName = (stage: string) => {
    switch (stage) {
      case 'lead': return 'リード'
      case 'qualified': return '見込み客'
      case 'proposal': return '提案'
      case 'negotiation': return '交渉'
      case 'closed_won': return '受注'
      case 'closed_lost': return '失注'
      default: return stage
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 全体統計 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総売上目標</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalTarget)}</div>
            <p className="text-xs text-muted-foreground">
              達成率 {overallProgress.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">実績売上</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalAchieved)}</div>
            <p className="text-xs text-muted-foreground">
              目標との差額 {formatCurrency(totalAchieved - totalTarget)}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総案件数</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDeals}</div>
            <p className="text-xs text-muted-foreground">
              受注 {closedWonDeals}件 ({((closedWonDeals / totalDeals) * 100).toFixed(1)}%)
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">案件総額</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalDealValue)}</div>
            <p className="text-xs text-muted-foreground">
              受注額 {formatCurrency(closedDealValue)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 月次進捗 */}
      <Card>
        <CardHeader>
          <CardTitle>月次営業進捗</CardTitle>
          <CardDescription>各月の目標達成状況と実績</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {salesProgress.map((progress) => {
              const achievementRate = (progress.achieved / progress.target) * 100
              
              return (
                <div key={progress.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <h4 className="font-medium text-lg">
                          {new Date(progress.period).toLocaleDateString('ja-JP', {
                            year: 'numeric',
                            month: 'long'
                          })}
                        </h4>
                        {getProgressIcon(progress.achieved, progress.target)}
                        <Badge variant="outline" className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {progress.salesRep}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>目標: {formatCurrency(progress.target)}</span>
                        <span className={getProgressColor(progress.achieved, progress.target)}>
                          実績: {formatCurrency(progress.achieved)}
                        </span>
                        <span>達成率: {achievementRate.toFixed(1)}%</span>
                      </div>
                    </div>
                    
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-1" />
                      編集
                    </Button>
                  </div>
                  
                  <Progress value={Math.min(achievementRate, 100)} className="h-2" />
                  
                  {progress.notes && (
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                      {progress.notes}
                    </p>
                  )}
                  
                  {/* 関連案件 */}
                  {progress.deals && progress.deals.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="font-medium text-sm">関連案件:</h5>
                      <div className="grid gap-2 md:grid-cols-2">
                        {progress.deals.map((deal, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 border rounded"
                          >
                            <div className="space-y-1">
                              <div className="font-medium text-sm">{deal.customerName}</div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className={`${getStageColor(deal.stage)} text-xs`}>
                                  {getStageIcon(deal.stage)}
                                  {getStageName(deal.stage)}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {formatCurrency(deal.amount)}
                                </span>
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {deal.actualCloseDate ? 
                                formatDate(deal.actualCloseDate) : 
                                formatDate(deal.expectedCloseDate)
                              }
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* 案件パイプライン */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>案件パイプライン</CardTitle>
              <CardDescription>現在進行中の営業案件一覧</CardDescription>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              新規案件
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {deals.map((deal) => (
              <div
                key={deal.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    <h4 className="font-medium">{deal.customerName}</h4>
                    <Badge variant="outline" className={getStageColor(deal.stage)}>
                      {getStageIcon(deal.stage)}
                      {getStageName(deal.stage)}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      確度 {deal.probability}%
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      {formatCurrency(deal.amount)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(deal.expectedCloseDate)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Briefcase className="h-3 w-3" />
                      {deal.source}
                    </span>
                  </div>
                  
                  {deal.notes && (
                    <p className="text-sm text-muted-foreground">{deal.notes}</p>
                  )}
                </div>
                
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-1" />
                  編集
                </Button>
              </div>
            ))}
            
            {deals.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Briefcase className="h-8 w-8 mx-auto mb-2" />
                <p>案件がありません</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
