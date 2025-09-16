'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ErrorLog } from '@/types'
import { 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  CheckCircle, 
  X, 
  User,
  Clock,
  Code,
  Monitor,
  Database,
  Server,
  Globe,
  Filter
} from 'lucide-react'

interface ErrorMonitorProps {
  errors: ErrorLog[]
  loading: boolean
  onResolveError: (id: string, assignedTo?: string) => void
  onUpdateError: (id: string, updates: Partial<ErrorLog>) => void
}

export function ErrorMonitor({ errors, loading, onResolveError, onUpdateError }: ErrorMonitorProps) {
  const [selectedLevel, setSelectedLevel] = useState<string>('all')
  const [selectedSource, setSelectedSource] = useState<string>('all')
  const [showResolved, setShowResolved] = useState(false)

  // フィルタリング
  const filteredErrors = errors.filter(error => {
    if (selectedLevel !== 'all' && error.level !== selectedLevel) return false
    if (selectedSource !== 'all' && error.source !== selectedSource) return false
    if (!showResolved && error.resolved) return false
    return true
  })

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'fatal':
        return <X className="h-4 w-4 text-red-600" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'warn':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />
      default:
        return <Info className="h-4 w-4 text-gray-500" />
    }
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'fatal':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'error':
        return 'bg-red-50 text-red-700 border-red-100'
      case 'warn':
        return 'bg-yellow-50 text-yellow-700 border-yellow-100'
      case 'info':
        return 'bg-blue-50 text-blue-700 border-blue-100'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-100'
    }
  }

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'client':
        return <Globe className="h-4 w-4" />
      case 'server':
        return <Server className="h-4 w-4" />
      case 'api':
        return <Code className="h-4 w-4" />
      case 'database':
        return <Database className="h-4 w-4" />
      default:
        return <Monitor className="h-4 w-4" />
    }
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTimeAgo = (timestamp: string) => {
    const now = new Date()
    const errorTime = new Date(timestamp)
    const diffMs = now.getTime() - errorTime.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 60) {
      return `${diffMins}分前`
    } else if (diffHours < 24) {
      return `${diffHours}時間前`
    } else {
      return `${diffDays}日前`
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-3 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* フィルターコントロール */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            エラーフィルター
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">レベル</label>
              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  <SelectItem value="fatal">致命的</SelectItem>
                  <SelectItem value="error">エラー</SelectItem>
                  <SelectItem value="warn">警告</SelectItem>
                  <SelectItem value="info">情報</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">ソース</label>
              <Select value={selectedSource} onValueChange={setSelectedSource}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  <SelectItem value="client">クライアント</SelectItem>
                  <SelectItem value="server">サーバー</SelectItem>
                  <SelectItem value="api">API</SelectItem>
                  <SelectItem value="database">データベース</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">表示オプション</label>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="showResolved"
                  checked={showResolved}
                  onChange={(e) => setShowResolved(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="showResolved" className="text-sm">
                  解決済みを表示
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">結果</label>
              <div className="text-sm text-muted-foreground">
                {filteredErrors.length}件のエラー
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* エラー一覧 */}
      <div className="space-y-4">
        {filteredErrors.map((error) => (
          <Card key={error.id} className={`${error.resolved ? 'opacity-75' : ''}`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {getLevelIcon(error.level)}
                    <Badge variant="outline" className={getLevelColor(error.level)}>
                      {error.level.toUpperCase()}
                    </Badge>
                    
                    <Badge variant="outline" className="flex items-center gap-1">
                      {getSourceIcon(error.source)}
                      {error.source}
                    </Badge>
                    
                    {error.resolved && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        解決済み
                      </Badge>
                    )}
                    
                    {error.count > 1 && (
                      <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                        {error.count}回発生
                      </Badge>
                    )}
                  </div>
                  
                  <h4 className="font-medium text-lg">{error.message}</h4>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTimestamp(error.timestamp)} ({getTimeAgo(error.timestamp)})
                    </span>
                    
                    {error.url && (
                      <span className="flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        {error.url}
                      </span>
                    )}
                    
                    {error.userId && (
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {error.userId}
                      </span>
                    )}
                    
                    {error.assignedTo && (
                      <span className="flex items-center gap-1 text-blue-600">
                        <User className="h-3 w-3" />
                        担当: {error.assignedTo}
                      </span>
                    )}
                  </div>
                  
                  {/* タグ */}
                  {error.tags && error.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {error.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  {!error.resolved && (
                    <Button
                      size="sm"
                      onClick={() => onResolveError(error.id, 'admin_001')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      解決
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            
            {error.stack && (
              <CardContent>
                <div className="space-y-2">
                  <h5 className="font-medium text-sm">スタックトレース:</h5>
                  <pre className="text-xs bg-muted p-3 rounded overflow-x-auto whitespace-pre-wrap">
                    {error.stack}
                  </pre>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
        
        {filteredErrors.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-32">
              <CheckCircle className="h-8 w-8 text-green-600 mb-2" />
              <p className="text-muted-foreground">
                {showResolved ? 'エラーがありません' : '未解決のエラーはありません'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
