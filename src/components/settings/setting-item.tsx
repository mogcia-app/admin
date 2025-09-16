'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { SystemSettings } from '@/lib/settings'
import { Edit, Save, X, Lock } from 'lucide-react'

interface SettingItemProps {
  setting: SystemSettings
  onUpdate: (id: string, value: any) => Promise<void>
}

export function SettingItem({ setting, onUpdate }: SettingItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(setting.value)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    try {
      setSaving(true)
      let processedValue = editValue

      // JSON型の場合は文字列をパースして検証
      if (setting.type === 'json' && typeof editValue === 'string') {
        try {
          JSON.parse(editValue)
        } catch (e) {
          alert('無効なJSON形式です')
          return
        }
      }

      // 数値型の場合は数値に変換
      if (setting.type === 'number' && typeof editValue === 'string') {
        processedValue = parseFloat(editValue)
        if (isNaN(processedValue)) {
          alert('無効な数値です')
          return
        }
      }

      await onUpdate(setting.id, processedValue)
      setIsEditing(false)
    } catch (err) {
      alert('設定の更新に失敗しました: ' + (err instanceof Error ? err.message : '不明なエラー'))
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditValue(setting.value)
    setIsEditing(false)
  }

  const renderValueInput = () => {
    if (!isEditing) {
      return (
        <div className="text-sm">
          {setting.type === 'boolean' ? (
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              setting.value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {setting.value ? '有効' : '無効'}
            </span>
          ) : setting.type === 'json' ? (
            <code className="bg-muted p-2 rounded text-xs block overflow-x-auto">
              {JSON.stringify(setting.value, null, 2)}
            </code>
          ) : (
            <span className="font-mono">{String(setting.value)}</span>
          )}
        </div>
      )
    }

    switch (setting.type) {
      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Switch
              checked={Boolean(editValue)}
              onCheckedChange={setEditValue}
            />
            <Label>{Boolean(editValue) ? '有効' : '無効'}</Label>
          </div>
        )

      case 'number':
        return (
          <Input
            type="number"
            value={String(editValue)}
            onChange={(e) => setEditValue(e.target.value)}
            className="max-w-xs"
          />
        )

      case 'select':
        return (
          <Select value={String(editValue)} onValueChange={setEditValue}>
            <SelectTrigger className="max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {setting.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case 'json':
        return (
          <Textarea
            value={String(editValue)}
            onChange={(e) => setEditValue(e.target.value)}
            className="font-mono text-xs"
            rows={6}
            placeholder="有効なJSON形式で入力してください"
          />
        )

      default:
        return (
          <Input
            type="text"
            value={String(editValue)}
            onChange={(e) => setEditValue(e.target.value)}
            className="max-w-md"
          />
        )
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'general': return 'bg-blue-100 text-blue-800'
      case 'security': return 'bg-red-100 text-red-800'
      case 'notification': return 'bg-yellow-100 text-yellow-800'
      case 'integration': return 'bg-green-100 text-green-800'
      case 'backup': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'general': return '一般'
      case 'security': return 'セキュリティ'
      case 'notification': return '通知'
      case 'integration': return '統合'
      case 'backup': return 'バックアップ'
      default: return category
    }
  }

  return (
    <Card className={`${!setting.isEditable ? 'opacity-75' : ''}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">{setting.key}</CardTitle>
              <span className={`px-2 py-1 text-xs font-medium rounded ${getCategoryColor(setting.category)}`}>
                {getCategoryLabel(setting.category)}
              </span>
              {!setting.isEditable && (
                <Lock className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            <CardDescription>{setting.description}</CardDescription>
          </div>
          
          {setting.isEditable && (
            <div className="flex items-center gap-2 ml-4">
              {isEditing ? (
                <>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Save className="h-4 w-4 mr-1" />
                    {saving ? '保存中...' : '保存'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={saving}
                  >
                    <X className="h-4 w-4 mr-1" />
                    キャンセル
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  編集
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          <div>
            <Label className="text-sm font-medium text-muted-foreground">現在の値</Label>
            {renderValueInput()}
          </div>
          
          <div className="text-xs text-muted-foreground">
            <div>型: {setting.type}</div>
            <div>最終更新者: {setting.updatedBy}</div>
            <div>更新日時: {new Date(setting.updatedAt).toLocaleString('ja-JP')}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
