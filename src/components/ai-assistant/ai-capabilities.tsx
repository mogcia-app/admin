'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AICapability } from '@/types'
import { 
  BarChart3, 
  FileText, 
  Users, 
  Zap, 
  Brain,
  Sparkles
} from 'lucide-react'

interface AICapabilitiesProps {
  capabilities: AICapability[]
  loading: boolean
  onUseExample: (example: string) => void
}

export function AICapabilities({ capabilities, loading, onUseExample }: AICapabilitiesProps) {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'analytics': return BarChart3
      case 'reporting': return FileText
      case 'management': return Users
      case 'automation': return Zap
      default: return Brain
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'analytics': return 'bg-blue-100 text-blue-800'
      case 'reporting': return 'bg-green-100 text-green-800'
      case 'management': return 'bg-purple-100 text-purple-800'
      case 'automation': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'analytics': return 'データ分析'
      case 'reporting': return 'レポート生成'
      case 'management': return '管理サポート'
      case 'automation': return '自動化'
      default: return category
    }
  }

  // カテゴリ別にグループ化
  const groupedCapabilities = capabilities.reduce((acc, capability) => {
    if (!acc[capability.category]) {
      acc[capability.category] = []
    }
    acc[capability.category].push(capability)
    return acc
  }, {} as Record<string, AICapability[]>)

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-muted rounded"></div>
                <div className="h-3 bg-muted rounded w-5/6"></div>
                <div className="h-3 bg-muted rounded w-4/6"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* ヘッダー */}
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Sparkles className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold mb-2">AIアシスタント機能</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Signal Appの管理業務を効率化するAI機能をご紹介します。
          データ分析からレポート生成まで、様々な業務をサポートします。
        </p>
      </div>

      {/* 機能一覧 */}
      <div className="space-y-8">
        {Object.entries(groupedCapabilities).map(([category, categoryCapabilities]) => {
          const Icon = getCategoryIcon(category)
          
          return (
            <div key={category}>
              <div className="flex items-center gap-3 mb-4">
                <Icon className="h-6 w-6 text-primary" />
                <h3 className="text-xl font-semibold">{getCategoryLabel(category)}</h3>
                <Badge variant="outline" className={getCategoryColor(category)}>
                  {categoryCapabilities.length}個の機能
                </Badge>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                {categoryCapabilities.map((capability) => {
                  const CapabilityIcon = getCategoryIcon(capability.category)
                  
                  return (
                    <Card key={capability.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <CapabilityIcon className="h-5 w-5 text-primary" />
                              <CardTitle className="text-lg">{capability.name}</CardTitle>
                            </div>
                            <CardDescription>{capability.description}</CardDescription>
                          </div>
                          
                          <Badge variant="outline" className={getCategoryColor(capability.category)}>
                            {getCategoryLabel(capability.category)}
                          </Badge>
                        </div>
                      </CardHeader>
                      
                      <CardContent>
                        <div className="space-y-3">
                          <div>
                            <h4 className="text-sm font-medium mb-2">使用例：</h4>
                            <div className="space-y-2">
                              {capability.examples.map((example, index) => (
                                <div key={index} className="flex items-center justify-between">
                                  <span className="text-sm text-muted-foreground flex-1">
                                    「{example}」
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onUseExample(example)}
                                    className="text-xs"
                                  >
                                    試す
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* フッター */}
      <div className="text-center py-8 border-t border-border">
        <h3 className="text-lg font-semibold mb-2">その他のご質問</h3>
        <p className="text-muted-foreground mb-4">
          上記以外の管理業務についても、お気軽にAIアシスタントにお尋ねください。
        </p>
        <div className="flex flex-wrap justify-center gap-2 max-w-2xl mx-auto">
          {[
            'システムの稼働状況は？',
            'エラーログを確認して',
            'ユーザーの満足度は？',
            'セキュリティ状況を教えて',
            '今月の主要な変更点は？',
            'パフォーマンス改善の提案'
          ].map((question, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => onUseExample(question)}
              className="text-xs"
            >
              {question}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
