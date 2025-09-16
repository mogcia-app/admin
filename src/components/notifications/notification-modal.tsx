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
import { Plus, X, Calendar, Users, Tag } from 'lucide-react'

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
      createdBy: 'admin_001',
      createdAt: notification?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            {notification ? 'お知らせを編集' : '新規お知らせを作成'}
          </DialogTitle>
          <DialogDescription>
            ユーザー向けのお知らせを作成または編集します
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 基本情報 */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title" className="text-sm font-medium">
                タイトル *
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="お知らせのタイトルを入力"
                className="mt-1"
                required
              />
            </div>

            <div>
              <Label htmlFor="content" className="text-sm font-medium">
                内容 *
              </Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={handleChange}
                placeholder="お知らせの内容を入力"
                className="mt-1 min-h-[120px]"
                required
              />
            </div>
          </div>

          {/* 設定 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">種類</Label>
              <Select value={formData.type} onValueChange={(value) => handleSelectChange('type', value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">情報</SelectItem>
                  <SelectItem value="success">成功</SelectItem>
                  <SelectItem value="warning">警告</SelectItem>
                  <SelectItem value="error">エラー</SelectItem>
                  <SelectItem value="maintenance">メンテナンス</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium">優先度</Label>
              <Select value={formData.priority} onValueChange={(value) => handleSelectChange('priority', value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">低</SelectItem>
                  <SelectItem value="medium">中</SelectItem>
                  <SelectItem value="high">高</SelectItem>
                  <SelectItem value="urgent">緊急</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 対象ユーザー */}
          <div>
            <Label className="text-sm font-medium">対象ユーザー</Label>
            <Select value={formData.targetAudience} onValueChange={(value) => handleSelectChange('targetAudience', value)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全ユーザー</SelectItem>
                <SelectItem value="trial">トライアルユーザー</SelectItem>
                <SelectItem value="paid">有料ユーザー</SelectItem>
                <SelectItem value="admin">管理者のみ</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* タグ */}
          <div>
            <Label className="text-sm font-medium">タグ</Label>
            <div className="mt-1 space-y-2">
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="タグを入力"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <Button type="button" onClick={addTag} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {(formData.tags || []).length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {(formData.tags || []).map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-muted text-muted-foreground text-xs rounded"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* オプション */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isSticky"
                checked={formData.isSticky}
                onChange={handleChange}
              />
              <Label htmlFor="isSticky" className="text-sm">
                固定表示（常に上部に表示）
              </Label>
            </div>
          </div>

          {/* 日時設定 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="scheduledAt" className="text-sm font-medium">
                公開日時（任意）
              </Label>
              <Input
                id="scheduledAt"
                type="datetime-local"
                value={formData.scheduledAt ? new Date(formData.scheduledAt).toISOString().slice(0, 16) : ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  scheduledAt: e.target.value ? new Date(e.target.value).toISOString() : undefined
                }))}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="expiresAt" className="text-sm font-medium">
                期限（任意）
              </Label>
              <Input
                id="expiresAt"
                type="datetime-local"
                value={formData.expiresAt ? new Date(formData.expiresAt).toISOString().slice(0, 16) : ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  expiresAt: e.target.value ? new Date(e.target.value).toISOString() : undefined
                }))}
                className="mt-1"
              />
            </div>
          </div>

          {/* プレビュー */}
          {formData.title && (
            <div className="border rounded-lg p-4 bg-muted/50">
              <h4 className="text-sm font-medium text-muted-foreground mb-2">プレビュー</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
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
                <h3 className="font-medium">{formData.title}</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {formData.content || '内容が入力されていません'}
                </p>
              </div>
            </div>
          )}

          {/* アクションボタン */}
          <div className="flex justify-end gap-2 pt-4 border-t">
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