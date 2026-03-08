'use client'

import React, { useState } from 'react'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { AppAccessControl } from '@/types'
import { 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Wrench,
  Edit,
  Save,
  X
} from 'lucide-react'

interface FeatureControlCardProps {
  accessControl: AppAccessControl
  onToggleFeature: (feature: string, isEnabled: boolean) => void
  onToggleMaintenance: (feature: string, maintenanceMode: boolean, message?: string) => void
  onUpdate: (id: string, updates: Partial<AppAccessControl>) => void
}

export function FeatureControlCard({ 
  accessControl, 
  onToggleFeature, 
  onToggleMaintenance, 
  onUpdate 
}: FeatureControlCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    description: accessControl.description,
    maintenanceMessage: accessControl.maintenanceMessage || ''
  })

  const getFeatureIcon = (feature: string) => {
    switch (feature) {
      case 'ai_assistant': return '🤖'
      case 'prompt_management': return '📝'
      case 'user_profiles': return '👤'
      case 'sns_integration': return '🔗'
      case 'advanced_analytics': return '📊'
      case 'api_access': return '🔌'
      default: return '⚙️'
    }
  }

  const getFeatureName = (feature: string) => {
    switch (feature) {
      case 'ai_assistant': return 'AIアシスタント'
      case 'prompt_management': return 'プロンプト管理'
      case 'user_profiles': return 'ユーザープロフィール'
      case 'sns_integration': return 'SNS連携'
      case 'advanced_analytics': return '高度な分析'
      case 'api_access': return 'API アクセス'
      default: return feature
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800'
      case 'user': return 'bg-blue-100 text-blue-800'
      case 'trial': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return '管理者'
      case 'user': return 'ユーザー'
      case 'trial': return 'トライアル'
      default: return role
    }
  }

  const handleSaveEdit = () => {
    onUpdate(accessControl.id, {
      description: editData.description,
      maintenanceMessage: editData.maintenanceMessage || undefined
    })
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setEditData({
      description: accessControl.description,
      maintenanceMessage: accessControl.maintenanceMessage || ''
    })
    setIsEditing(false)
  }

  return (
    <Card className={`rounded-none border-slate-200 shadow-sm hover:shadow-md transition-shadow ${
      accessControl.maintenanceMode ? 'border-orange-200 bg-orange-50/50' : 
      !accessControl.isEnabled ? 'border-red-200 bg-red-50/50' : 
      'border-green-200 bg-green-50/50'
    }`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{getFeatureIcon(accessControl.feature)}</span>
              <CardTitle className="text-lg">{getFeatureName(accessControl.feature)}</CardTitle>
              
              {/* ステータスバッジ */}
              {accessControl.maintenanceMode ? (
                <Badge variant="outline" className="rounded-none bg-orange-100 text-orange-800 border-orange-200">
                  <Wrench className="h-3 w-3 mr-1" />
                  メンテナンス中
                </Badge>
              ) : accessControl.isEnabled ? (
                <Badge variant="outline" className="rounded-none bg-green-100 text-green-800 border-green-200">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  有効
                </Badge>
              ) : (
                <Badge variant="outline" className="rounded-none bg-red-100 text-red-800 border-red-200">
                  <XCircle className="h-3 w-3 mr-1" />
                  無効
                </Badge>
              )}
            </div>
            
            {isEditing ? (
              <div className="space-y-2">
                <div>
                  <Label htmlFor="description">説明</Label>
                  <Input
                    id="description"
                    value={editData.description}
                    onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="機能の説明を入力"
                  />
                </div>
                {accessControl.maintenanceMode && (
                  <div>
                    <Label htmlFor="maintenanceMessage">メンテナンスメッセージ</Label>
                    <Textarea
                      id="maintenanceMessage"
                      value={editData.maintenanceMessage}
                      onChange={(e) => setEditData(prev => ({ ...prev, maintenanceMessage: e.target.value }))}
                      placeholder="メンテナンス中に表示するメッセージ"
                      rows={2}
                    />
                  </div>
                )}
              </div>
            ) : (
              <CardDescription>{accessControl.description}</CardDescription>
            )}
            
            {/* 許可されたロール */}
            <div className="flex flex-wrap gap-1">
              <Users className="h-4 w-4 text-muted-foreground" />
              {accessControl.allowedRoles.map((role) => (
                <Badge key={role} variant="outline" className={`rounded-none ${getRoleColor(role)}`}>
                  {getRoleLabel(role)}
                </Badge>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Button variant="ghost" size="sm" onClick={handleSaveEdit}>
                  <Save className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                  <X className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* メンテナンスメッセージ */}
        {accessControl.maintenanceMode && accessControl.maintenanceMessage && !isEditing && (
          <div className="p-3 bg-orange-100 border border-orange-200 rounded-none">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5" />
              <p className="text-sm text-orange-800">{accessControl.maintenanceMessage}</p>
            </div>
          </div>
        )}
        
        {/* 制御スイッチ */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">機能有効化</Label>
              <p className="text-xs text-muted-foreground">
                この機能へのアクセスを制御します
              </p>
            </div>
            <Switch
              checked={accessControl.isEnabled}
              onCheckedChange={(checked) => onToggleFeature(accessControl.feature, checked)}
              disabled={accessControl.maintenanceMode}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">メンテナンスモード</Label>
              <p className="text-xs text-muted-foreground">
                メンテナンス中は管理者のみアクセス可能
              </p>
            </div>
            <Switch
              checked={accessControl.maintenanceMode}
              onCheckedChange={(checked) => onToggleMaintenance(
                accessControl.feature, 
                checked, 
                checked ? editData.maintenanceMessage : undefined
              )}
            />
          </div>
        </div>
        
        {/* 更新情報 */}
        <div className="pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground">
            最終更新: {new Date(accessControl.updatedAt).toLocaleDateString('ja-JP', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })} by {accessControl.updatedBy}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
