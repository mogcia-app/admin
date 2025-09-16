'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AdminProfile } from '@/lib/settings'
import { User, Mail, Shield, Globe, Palette, Bell, Save } from 'lucide-react'

interface ProfileSettingsProps {
  profile: AdminProfile
  onUpdate: (updates: Partial<AdminProfile>) => Promise<void>
}

export function ProfileSettings({ profile, onUpdate }: ProfileSettingsProps) {
  const [formData, setFormData] = useState({
    name: profile.name,
    email: profile.email,
    preferences: { ...profile.preferences }
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    try {
      setSaving(true)
      await onUpdate(formData)
      alert('プロフィールを更新しました！')
    } catch (err) {
      alert('プロフィールの更新に失敗しました: ' + (err instanceof Error ? err.message : '不明なエラー'))
    } finally {
      setSaving(false)
    }
  }

  const handlePreferenceChange = (key: string, value: any) => {
    setFormData({
      ...formData,
      preferences: {
        ...formData.preferences,
        [key]: value
      }
    })
  }

  const handleNotificationChange = (key: string, value: boolean) => {
    setFormData({
      ...formData,
      preferences: {
        ...formData.preferences,
        notifications: {
          ...formData.preferences.notifications,
          [key]: value
        }
      }
    })
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-red-100 text-red-800'
      case 'admin': return 'bg-blue-100 text-blue-800'
      case 'moderator': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'super_admin': return 'スーパー管理者'
      case 'admin': return '管理者'
      case 'moderator': return 'モデレーター'
      default: return role
    }
  }

  return (
    <div className="space-y-6">
      {/* 基本情報 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            基本情報
          </CardTitle>
          <CardDescription>アカウントの基本情報を管理します</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">名前</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="名前を入力"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <Label>権限レベル</Label>
            </div>
            <span className={`px-3 py-1 text-sm font-medium rounded ${getRoleColor(profile.role)}`}>
              {getRoleLabel(profile.role)}
            </span>
          </div>
          
          <div className="grid gap-2 text-sm text-muted-foreground">
            <div>最終ログイン: {new Date(profile.lastLogin).toLocaleString('ja-JP')}</div>
            <div>アカウント作成: {new Date(profile.createdAt).toLocaleString('ja-JP')}</div>
          </div>
        </CardContent>
      </Card>

      {/* 表示設定 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            表示設定
          </CardTitle>
          <CardDescription>アプリケーションの表示をカスタマイズします</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>テーマ</Label>
              <Select 
                value={formData.preferences.theme} 
                onValueChange={(value: any) => handlePreferenceChange('theme', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">ライト</SelectItem>
                  <SelectItem value="dark">ダーク</SelectItem>
                  <SelectItem value="system">システム設定に従う</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>言語</Label>
              <Select 
                value={formData.preferences.language} 
                onValueChange={(value: any) => handlePreferenceChange('language', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ja">日本語</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              タイムゾーン
            </Label>
            <Select 
              value={formData.preferences.timezone} 
              onValueChange={(value) => handlePreferenceChange('timezone', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Asia/Tokyo">Asia/Tokyo (JST)</SelectItem>
                <SelectItem value="UTC">UTC</SelectItem>
                <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 通知設定 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            通知設定
          </CardTitle>
          <CardDescription>各種通知の受信設定を管理します</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>メール通知</Label>
                <p className="text-sm text-muted-foreground">重要な更新をメールで受信</p>
              </div>
              <Switch
                checked={formData.preferences.notifications.email}
                onCheckedChange={(checked) => handleNotificationChange('email', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label>ブラウザ通知</Label>
                <p className="text-sm text-muted-foreground">ブラウザでプッシュ通知を受信</p>
              </div>
              <Switch
                checked={formData.preferences.notifications.browser}
                onCheckedChange={(checked) => handleNotificationChange('browser', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Slack通知</Label>
                <p className="text-sm text-muted-foreground">Slackチャンネルに通知を送信</p>
              </div>
              <Switch
                checked={formData.preferences.notifications.slack}
                onCheckedChange={(checked) => handleNotificationChange('slack', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 保存ボタン */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? '保存中...' : 'プロフィールを保存'}
        </Button>
      </div>
    </div>
  )
}
