'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SystemStatus } from '@/types'
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Activity, 
  Clock, 
  Zap,
  RefreshCw
} from 'lucide-react'

interface SystemStatusCardProps {
  systemStatus: SystemStatus[]
  onRefresh: () => void
  onUpdateStatus: (service: string, status: SystemStatus['status'], description: string) => void
}

export function SystemStatusCard({ systemStatus, onRefresh, onUpdateStatus }: SystemStatusCardProps) {
  const getServiceIcon = (service: string) => {
    switch (service) {
      case 'web_application': return '🌐'
      case 'api_server': return '🔌'
      case 'database': return '🗄️'
      case 'ai_service': return '🤖'
      case 'file_storage': return '📁'
      default: return '⚙️'
    }
  }

  const getServiceName = (service: string) => {
    switch (service) {
      case 'web_application': return 'Webアプリケーション'
      case 'api_server': return 'APIサーバー'
      case 'database': return 'データベース'
      case 'ai_service': return 'AIサービス'
      case 'file_storage': return 'ファイルストレージ'
      default: return service
    }
  }

  const getStatusIcon = (status: SystemStatus['status']) => {
    switch (status) {
      case 'operational': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'degraded': return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'partial_outage': return <AlertTriangle className="h-4 w-4 text-orange-600" />
      case 'major_outage': return <XCircle className="h-4 w-4 text-red-600" />
      case 'maintenance': return <Activity className="h-4 w-4 text-blue-600" />
      default: return <XCircle className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: SystemStatus['status']) => {
    switch (status) {
      case 'operational': return 'bg-green-100 text-green-800 border-green-200'
      case 'degraded': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'partial_outage': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'major_outage': return 'bg-red-100 text-red-800 border-red-200'
      case 'maintenance': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusLabel = (status: SystemStatus['status']) => {
    switch (status) {
      case 'operational': return '正常'
      case 'degraded': return '低下'
      case 'partial_outage': return '部分障害'
      case 'major_outage': return '全面障害'
      case 'maintenance': return 'メンテナンス'
      default: return status
    }
  }

  const getUptimeColor = (uptime: number) => {
    if (uptime >= 99.5) return 'text-green-600'
    if (uptime >= 95.0) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getResponseTimeColor = (responseTime?: number) => {
    if (!responseTime) return 'text-gray-600'
    if (responseTime <= 200) return 'text-green-600'
    if (responseTime <= 1000) return 'text-yellow-600'
    return 'text-red-600'
  }

  const overallStatus = systemStatus.length > 0 ? (
    systemStatus.every(s => s.status === 'operational') ? 'operational' :
    systemStatus.some(s => s.status === 'major_outage') ? 'major_outage' :
    systemStatus.some(s => s.status === 'partial_outage') ? 'partial_outage' :
    systemStatus.some(s => s.status === 'degraded') ? 'degraded' : 'maintenance'
  ) : 'operational'

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              システムステータス
            </CardTitle>
            <CardDescription>
              各サービスの稼働状況をリアルタイムで監視
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {getStatusIcon(overallStatus)}
              <Badge variant="outline" className={getStatusColor(overallStatus)}>
                全体: {getStatusLabel(overallStatus)}
              </Badge>
            </div>
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {systemStatus.map((service) => (
            <div key={service.id} className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{getServiceIcon(service.service)}</span>
                  <div>
                    <h4 className="font-medium">{getServiceName(service.service)}</h4>
                    <p className="text-sm text-muted-foreground">{service.description}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {getStatusIcon(service.status)}
                  <Badge variant="outline" className={getStatusColor(service.status)}>
                    {getStatusLabel(service.status)}
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">稼働率:</span>
                  <span className={`font-medium ${getUptimeColor(service.uptime)}`}>
                    {service.uptime.toFixed(1)}%
                  </span>
                </div>
                
                {service.responseTime && (
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">応答時間:</span>
                    <span className={`font-medium ${getResponseTimeColor(service.responseTime)}`}>
                      {service.responseTime}ms
                    </span>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">最終確認:</span>
                  <span className="font-medium">
                    {new Date(service.lastChecked).toLocaleTimeString('ja-JP', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
              
              {/* インシデント情報（あれば表示） */}
              {service.incidents && service.incidents.length > 0 && (
                <div className="mt-3 p-2 bg-orange-50 border border-orange-200 rounded">
                  <p className="text-sm text-orange-800">
                    <AlertTriangle className="h-3 w-3 inline mr-1" />
                    {service.incidents.length}件のインシデントが進行中
                  </p>
                </div>
              )}
            </div>
          ))}
          
          {systemStatus.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              システムステータス情報がありません
            </div>
          )}
        </div>
        
        <div className="mt-6 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            ステータスは30秒ごとに自動更新されます
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
