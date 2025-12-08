'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { EmergencySecurityMode, SecurityPreset } from '@/types'
import { 
  Shield, 
  AlertTriangle, 
  Lock, 
  Unlock,
  Clock,
  User,
  Save,
  X,
  Zap
} from 'lucide-react'

interface EmergencySecurityCardProps {
  currentMode: EmergencySecurityMode | null
  presets: SecurityPreset[]
  onActivate: (mode: Omit<EmergencySecurityMode, 'id' | 'isActive' | 'startedAt' | 'startedBy'>) => Promise<void>
  onDeactivate: (modeId: string) => Promise<void>
  loading?: boolean
}

export function EmergencySecurityCard({
  currentMode,
  presets,
  onActivate,
  onDeactivate,
  loading = false
}: EmergencySecurityCardProps) {
  const [showForm, setShowForm] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState<string>('')
  const [formData, setFormData] = useState({
    mode: 'vulnerability_response' as EmergencySecurityMode['mode'],
    reason: '',
    description: '',
    maintenanceMessage: 'セキュリティ上の理由により、一時的にサービスを制限しています。',
    affectedFeatures: [] as string[],
    blockedUserGroups: [] as EmergencySecurityMode['blockedUserGroups'],
    blockedActions: [] as EmergencySecurityMode['blockedActions'],
    estimatedResolution: '',
    autoDisableAt: '',
    notes: ''
  })

  const handlePresetSelect = (presetId: string) => {
    const preset = presets.find(p => p.id === presetId)
    if (preset) {
      setFormData({
        mode: preset.mode,
        reason: `${preset.name}による緊急対応`,
        description: preset.description,
        maintenanceMessage: preset.maintenanceMessage,
        affectedFeatures: preset.affectedFeatures,
        blockedUserGroups: preset.blockedUserGroups,
        blockedActions: preset.blockedActions,
        estimatedResolution: '',
        autoDisableAt: '',
        notes: preset.recommendedActions.join('\n')
      })
    }
    setSelectedPreset(presetId)
  }

  const handleSubmit = async () => {
    await onActivate({
      ...formData,
      estimatedResolution: formData.estimatedResolution || undefined,
      autoDisableAt: formData.autoDisableAt || undefined,
      notes: formData.notes || undefined
    })
    setShowForm(false)
    setFormData({
      mode: 'vulnerability_response',
      reason: '',
      description: '',
      maintenanceMessage: 'セキュリティ上の理由により、一時的にサービスを制限しています。',
      affectedFeatures: [],
      blockedUserGroups: [],
      blockedActions: [],
      estimatedResolution: '',
      autoDisableAt: '',
      notes: ''
    })
    setSelectedPreset('')
  }

  const availableFeatures = [
    'ai_assistant',
    'prompt_management',
    'user_profiles',
    'sns_integration',
    'advanced_analytics',
    'api_access',
    'file_upload',
    'data_export'
  ]

  const userGroups: { value: EmergencySecurityMode['blockedUserGroups'][0], label: string }[] = [
    { value: 'new_users', label: '新規ユーザー' },
    { value: 'trial_users', label: 'トライアルユーザー' },
    { value: 'free_users', label: '無料ユーザー' },
    { value: 'all', label: '全ユーザー' }
  ]

  const actions: { value: EmergencySecurityMode['blockedActions'][0], label: string }[] = [
    { value: 'login', label: 'ログイン' },
    { value: 'registration', label: '新規登録' },
    { value: 'file_upload', label: 'ファイルアップロード' },
    { value: 'api_access', label: 'APIアクセス' },
    { value: 'ai_features', label: 'AI機能' },
    { value: 'data_export', label: 'データエクスポート' }
  ]

  return (
    <div className="space-y-4">
      {/* 現在の状態 */}
      {currentMode && (
        <Card className="border-red-200 bg-red-50/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <CardTitle className="flex items-center gap-2 text-red-800">
                  <AlertTriangle className="h-5 w-5" />
                  緊急セキュリティモード: アクティブ
                </CardTitle>
                <CardDescription className="text-red-700">
                  {currentMode.reason}
                </CardDescription>
              </div>
              <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
                <Lock className="h-3 w-3 mr-1" />
                {currentMode.mode === 'full_block' ? '全ブロック' :
                 currentMode.mode === 'partial_block' ? '部分ブロック' :
                 '脆弱性対応'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-1">説明:</p>
              <p className="text-sm text-muted-foreground">{currentMode.description}</p>
            </div>
            
            {currentMode.affectedFeatures.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-1">影響を受ける機能:</p>
                <div className="flex flex-wrap gap-1">
                  {currentMode.affectedFeatures.map(feature => (
                    <Badge key={feature} variant="outline" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {currentMode.blockedUserGroups.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-1">ブロック対象ユーザー:</p>
                <div className="flex flex-wrap gap-1">
                  {currentMode.blockedUserGroups.map(group => (
                    <Badge key={group} variant="outline" className="text-xs bg-orange-50">
                      {group === 'new_users' ? '新規ユーザー' :
                       group === 'trial_users' ? 'トライアル' :
                       group === 'free_users' ? '無料ユーザー' :
                       '全ユーザー'}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>開始: {new Date(currentMode.startedAt).toLocaleString('ja-JP')}</span>
              {currentMode.estimatedResolution && (
                <>
                  <span>•</span>
                  <span>予定解決: {new Date(currentMode.estimatedResolution).toLocaleString('ja-JP')}</span>
                </>
              )}
            </div>
            
            <Button
              onClick={() => onDeactivate(currentMode.id)}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              <Unlock className="h-4 w-4 mr-2" />
              緊急モード解除
            </Button>
          </CardContent>
        </Card>
      )}

      {/* フォーム */}
      {!currentMode && (
        <>
          {!showForm ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-red-600" />
                  緊急セキュリティモード
                </CardTitle>
                <CardDescription>
                  脆弱性発見時など、緊急時にユーザーアクセスを制限します
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => setShowForm(true)} className="bg-red-600 hover:bg-red-700">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  緊急モードを有効化
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>緊急セキュリティモード設定</CardTitle>
                    <CardDescription>
                      脆弱性対応時のアクセス制御を設定します
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* プリセット選択 */}
                {presets.length > 0 && (
                  <div className="space-y-2">
                    <Label>プリセットから選択（推奨）</Label>
                    <Select value={selectedPreset} onValueChange={handlePresetSelect}>
                      <SelectTrigger>
                        <SelectValue placeholder="プリセットを選択..." />
                      </SelectTrigger>
                      <SelectContent>
                        {presets.map(preset => (
                          <SelectItem key={preset.id} value={preset.id}>
                            {preset.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* モード選択 */}
                <div className="space-y-2">
                  <Label>モード</Label>
                  <Select 
                    value={formData.mode} 
                    onValueChange={(value) => 
                      setFormData(prev => ({ ...prev, mode: value as EmergencySecurityMode['mode'] }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full_block">全ブロック（ログイン不可）</SelectItem>
                      <SelectItem value="partial_block">部分ブロック（機能制限）</SelectItem>
                      <SelectItem value="vulnerability_response">脆弱性対応モード</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 理由 */}
                <div className="space-y-2">
                  <Label>理由（必須）</Label>
                  <Input
                    value={formData.reason}
                    onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="例: React Server Components 脆弱性対応"
                  />
                </div>

                {/* 説明 */}
                <div className="space-y-2">
                  <Label>詳細説明</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="緊急モードの理由と対応内容を記述"
                    rows={3}
                  />
                </div>

                {/* メンテナンスメッセージ */}
                <div className="space-y-2">
                  <Label>ユーザーへのメッセージ</Label>
                  <Textarea
                    value={formData.maintenanceMessage}
                    onChange={(e) => setFormData(prev => ({ ...prev, maintenanceMessage: e.target.value }))}
                    rows={2}
                  />
                </div>

                {/* 影響を受ける機能（部分ブロック時） */}
                {formData.mode !== 'full_block' && (
                  <div className="space-y-2">
                    <Label>影響を受ける機能</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {availableFeatures.map(feature => (
                        <div key={feature} className="flex items-center space-x-2">
                          <Checkbox
                            id={feature}
                            checked={formData.affectedFeatures.includes(feature)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setFormData(prev => ({
                                  ...prev,
                                  affectedFeatures: [...prev.affectedFeatures, feature]
                                }))
                              } else {
                                setFormData(prev => ({
                                  ...prev,
                                  affectedFeatures: prev.affectedFeatures.filter(f => f !== feature)
                                }))
                              }
                            }}
                          />
                          <label
                            htmlFor={feature}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {feature}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ブロック対象ユーザーグループ */}
                {formData.mode !== 'full_block' && (
                  <div className="space-y-2">
                    <Label>ブロック対象ユーザーグループ</Label>
                    <div className="space-y-2">
                      {userGroups.map(group => (
                        <div key={group.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={group.value}
                            checked={formData.blockedUserGroups.includes(group.value)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setFormData(prev => ({
                                  ...prev,
                                  blockedUserGroups: [...prev.blockedUserGroups, group.value]
                                }))
                              } else {
                                setFormData(prev => ({
                                  ...prev,
                                  blockedUserGroups: prev.blockedUserGroups.filter(g => g !== group.value)
                                }))
                              }
                            }}
                          />
                          <label htmlFor={group.value} className="text-sm">
                            {group.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ブロック対象アクション */}
                {formData.mode !== 'full_block' && (
                  <div className="space-y-2">
                    <Label>ブロック対象アクション</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {actions.map(action => (
                        <div key={action.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={action.value}
                            checked={formData.blockedActions.includes(action.value)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setFormData(prev => ({
                                  ...prev,
                                  blockedActions: [...prev.blockedActions, action.value]
                                }))
                              } else {
                                setFormData(prev => ({
                                  ...prev,
                                  blockedActions: prev.blockedActions.filter(a => a !== action.value)
                                }))
                              }
                            }}
                          />
                          <label htmlFor={action.value} className="text-sm">
                            {action.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 予定解決時間 */}
                <div className="space-y-2">
                  <Label>予定解決時間（任意）</Label>
                  <Input
                    type="datetime-local"
                    value={formData.estimatedResolution}
                    onChange={(e) => setFormData(prev => ({ ...prev, estimatedResolution: e.target.value }))}
                  />
                </div>

                {/* 備考 */}
                <div className="space-y-2">
                  <Label>備考</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="追加情報や推奨事項"
                    rows={2}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleSubmit}
                    disabled={loading || !formData.reason}
                    className="bg-red-600 hover:bg-red-700 flex-1"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    緊急モードを有効化
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowForm(false)}
                  >
                    キャンセル
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}

