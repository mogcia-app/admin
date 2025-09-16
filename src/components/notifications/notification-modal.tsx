'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Notification } from '@/types'
import { Plus, X, Calendar, Users, Tag, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface NotificationModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (notification: Partial<Notification>) => void
  notification?: Notification | null
}

export function NotificationModal({ isOpen, onClose, onSave, notification }: NotificationModalProps) {
  const [formData, setFormData] = useState<Partial<Notification>>({
    title: '',
    content: '',
    type: 'info',
    priority: 'medium',
    status: 'draft',
    targetAudience: 'all',
    tags: [],
    isSticky: false
  })
  const [newTag, setNewTag] = useState('')

  useEffect(() => {
    if (notification) {
      setFormData({
        title: notification.title,
        content: notification.content,
        type: notification.type,
        priority: notification.priority,
        status: notification.status,
        targetAudience: notification.targetAudience,
        scheduledAt: notification.scheduledAt,
        expiresAt: notification.expiresAt,
        tags: notification.tags,
        isSticky: notification.isSticky
      })
    } else {
      setFormData({
        title: '',
        content: '',
        type: 'info',
        priority: 'medium',
        status: 'draft',
        targetAudience: 'all',
        tags: [],
        isSticky: false
      })
    }
    setNewTag('')
  }, [notification, isOpen])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value, type, checked } = e.target as HTMLInputElement
    setFormData(prev => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSelectChange = (field: keyof Notification, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const addTag = () => {
    if (newTag.trim() && !(formData.tags || []).includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), newTag.trim()]
      }))
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: (prev.tags || []).filter(tag => tag !== tagToRemove)
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      ...formData,
      createdBy: 'admin_001' // 実際は認証されたユーザーのID
    })
    onClose()
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'info': return 'text-blue-600 bg-blue-50'
      case 'success': return 'text-green-600 bg-green-50'
      case 'warning': return 'text-yellow-600 bg-yellow-50'
      case 'error': return 'text-red-600 bg-red-50'
      case 'maintenance': return 'text-purple-600 bg-purple-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50'
      case 'high': return 'text-orange-600 bg-orange-50'
      case 'medium': return 'text-blue-600 bg-blue-50'
      case 'low': return 'text-gray-600 bg-gray-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{notification ? 'お知らせを編集' : '新規お知らせを作成'}</DialogTitle>
          <DialogDescription>
            ユーザー向けのお知らせを作成または編集します。公開前に内容をよくご確認ください。
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-6 py-4">
          {/* 基本情報 */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">
              タイトル
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={handleChange}
              className="col-span-3"
              placeholder="お知らせのタイトルを入力"
              required
            />
          </div>

          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="content" className="text-right pt-2">
              内容
            </Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={handleChange}
              className="col-span-3 min-h-[120px]"
              placeholder="お知らせの詳細内容を入力してください..."
              required
            />
          </div>

          {/* 分類・設定 */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">種別</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => handleSelectChange('type', value as Notification['type'])}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="お知らせの種別を選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="info">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    情報
                  </div>
                </SelectItem>
                <SelectItem value="success">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    成功・完了
                  </div>
                </SelectItem>
                <SelectItem value="warning">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    警告・注意
                  </div>
                </SelectItem>
                <SelectItem value="error">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    エラー・障害
                  </div>
                </SelectItem>
                <SelectItem value="maintenance">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                    メンテナンス
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">優先度</Label>
            <Select
              value={formData.priority}
              onValueChange={(value) => handleSelectChange('priority', value as Notification['priority'])}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="優先度を選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="urgent">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    緊急
                  </div>
                </SelectItem>
                <SelectItem value="high">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                    高
                  </div>
                </SelectItem>
                <SelectItem value="medium">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-blue-500" />
                    中
                  </div>
                </SelectItem>
                <SelectItem value="low">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-gray-500" />
                    低
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">対象ユーザー</Label>
            <Select
              value={formData.targetAudience}
              onValueChange={(value) => handleSelectChange('targetAudience', value as Notification['targetAudience'])}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="対象ユーザーを選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    全ユーザー
                  </div>
                </SelectItem>
                <SelectItem value="trial">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-500" />
                    トライアルユーザー
                  </div>
                </SelectItem>
                <SelectItem value="paid">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-green-500" />
                    有料ユーザー
                  </div>
                </SelectItem>
                <SelectItem value="admin">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-500" />
                    管理者のみ
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">ステータス</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleSelectChange('status', value as Notification['status'])}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="ステータスを選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">下書き</SelectItem>
                <SelectItem value="published">公開中</SelectItem>
                <SelectItem value="archived">アーカイブ</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 日時設定 */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="scheduledAt" className="text-right">
              公開予定日時
            </Label>
            <Input
              id="scheduledAt"
              type="datetime-local"
              value={formData.scheduledAt ? new Date(formData.scheduledAt).toISOString().slice(0, 16) : ''}
              onChange={handleChange}
              className="col-span-3"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="expiresAt" className="text-right">
              有効期限
            </Label>
            <Input
              id="expiresAt"
              type="datetime-local"
              value={formData.expiresAt ? new Date(formData.expiresAt).toISOString().slice(0, 16) : ''}
              onChange={handleChange}
              className="col-span-3"
            />
          </div>

          {/* タグ設定 */}
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="tags" className="text-right pt-2">
              タグ
            </Label>
            <div className="col-span-3 space-y-2">
              <div className="flex gap-2">
                <Input
                  id="newTag"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="新しいタグを追加"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <Button type="button" variant="outline" onClick={addTag}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(formData.tags || []).map((tag, index) => (
                  <span key={index} className="flex items-center gap-1 bg-muted px-2 py-1 rounded-md text-sm">
                    <Tag className="h-3 w-3" />
                    {tag}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4"
                      onClick={() => removeTag(tag)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* オプション設定 */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="isSticky" className="text-right">
              固定表示
            </Label>
            <div className="col-span-3 flex items-center space-x-2">
              <Checkbox
                id="isSticky"
                checked={formData.isSticky}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isSticky: checked }))}
              />
              <Label htmlFor="isSticky" className="text-sm text-muted-foreground">
                重要なお知らせとして上部に固定表示する
              </Label>
            </div>
          </div>

          {/* プレビュー */}
          <div className="col-span-4">
            <h3 className="text-lg font-semibold mb-3">プレビュー</h3>
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{formData.title || 'タイトルなし'}</CardTitle>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(formData.type || 'info')}`}>
                        {formData.type === 'info' ? '情報' :
                         formData.type === 'success' ? '成功' :
                         formData.type === 'warning' ? '警告' :
                         formData.type === 'error' ? 'エラー' :
                         formData.type === 'maintenance' ? 'メンテナンス' : formData.type}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(formData.priority || 'medium')}`}>
                        {formData.priority === 'urgent' ? '緊急' :
                         formData.priority === 'high' ? '高' :
                         formData.priority === 'medium' ? '中' :
                         formData.priority === 'low' ? '低' : formData.priority}
                      </span>
                      {formData.isSticky && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          固定
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {(formData.tags || []).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded flex items-center gap-1"
                        >
                          <Tag className="h-3 w-3" />
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">
                  {formData.content || 'お知らせ内容が入力されていません'}
                </p>
                <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                  <span>対象: {
                    formData.targetAudience === 'all' ? '全ユーザー' :
                    formData.targetAudience === 'trial' ? 'トライアルユーザー' :
                    formData.targetAudience === 'paid' ? '有料ユーザー' :
                    formData.targetAudience === 'admin' ? '管理者のみ' : formData.targetAudience
                  }</span>
                  {formData.expiresAt && (
                    <span>期限: {new Date(formData.expiresAt).toLocaleDateString('ja-JP')}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* アクションボタン */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              キャンセル
            </Button>
            <Button type="submit">
              {notification ? '更新' : '作成'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
