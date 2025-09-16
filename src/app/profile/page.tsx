'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Shield, 
  Settings, 
  Save, 
  Edit3,
  Camera,
  Key,
  Bell,
  Globe
} from 'lucide-react'

interface AdminProfile {
  id: string
  name: string
  email: string
  role: 'admin' | 'super_admin' | 'moderator'
  avatar?: string
  phone?: string
  location?: string
  bio?: string
  department?: string
  joinDate: string
  lastLogin: string
  preferences: {
    language: string
    timezone: string
    notifications: {
      email: boolean
      push: boolean
      sms: boolean
    }
    theme: 'light' | 'dark' | 'system'
  }
  security: {
    twoFactorEnabled: boolean
    lastPasswordChange: string
    loginAttempts: number
  }
}

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false)
  const [profile, setProfile] = useState<AdminProfile>({
    id: 'admin_001',
    name: '管理者 太郎',
    email: 'admin@mogcia-app.com',
    role: 'admin',
    avatar: '',
    phone: '+81-90-1234-5678',
    location: '東京都渋谷区',
    bio: 'Mogciaアプリの管理者として、ユーザーサポートとシステム管理を担当しています。',
    department: 'システム管理部',
    joinDate: '2024-01-15',
    lastLogin: '2024-09-17T00:30:00Z',
    preferences: {
      language: 'ja',
      timezone: 'Asia/Tokyo',
      notifications: {
        email: true,
        push: true,
        sms: false
      },
      theme: 'system'
    },
    security: {
      twoFactorEnabled: false,
      lastPasswordChange: '2024-08-15',
      loginAttempts: 0
    }
  })

  const [formData, setFormData] = useState(profile)

  const handleEdit = () => {
    setFormData(profile)
    setIsEditing(true)
  }

  const handleSave = () => {
    setProfile(formData)
    setIsEditing(false)
    // ここでAPIに保存
    console.log('Profile updated:', formData)
  }

  const handleCancel = () => {
    setFormData(profile)
    setIsEditing(false)
  }

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handlePreferenceChange = (category: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [category]: {
          ...prev.preferences[category as keyof typeof prev.preferences],
          [field]: value
        }
      }
    }))
  }

  const getRoleBadgeColor = (role: string) => {
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
    <div className="container mx-auto p-6 space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">プロフィール</h1>
          <p className="text-muted-foreground">管理者アカウントの設定と情報を管理します</p>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button onClick={handleSave} className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                保存
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                キャンセル
              </Button>
            </>
          ) : (
            <Button onClick={handleEdit} className="flex items-center gap-2">
              <Edit3 className="h-4 w-4" />
              編集
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左側: 基本情報 */}
        <div className="lg:col-span-1 space-y-6">
          {/* プロフィールカード */}
          <Card>
            <CardHeader className="text-center">
              <div className="flex flex-col items-center space-y-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage 
                    src={isEditing ? formData.avatar : profile.avatar} 
                    alt={`${isEditing ? formData.name : profile.name}のアバター`}
                  />
                  <AvatarFallback className="text-2xl">
                    {isEditing ? formData.name.charAt(0) : profile.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    写真を変更
                  </Button>
                )}
                <div>
                  <h3 className="text-xl font-semibold">
                    {isEditing ? formData.name : profile.name}
                  </h3>
                  <Badge className={getRoleBadgeColor(isEditing ? formData.role : profile.role)}>
                    {getRoleLabel(isEditing ? formData.role : profile.role)}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{isEditing ? formData.email : profile.email}</span>
              </div>
              {isEditing ? formData.phone : profile.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{isEditing ? formData.phone : profile.phone}</span>
                </div>
              )}
              {isEditing ? formData.location : profile.location && (
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{isEditing ? formData.location : profile.location}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>参加日: {new Date(isEditing ? formData.joinDate : profile.joinDate).toLocaleDateString('ja-JP')}</span>
              </div>
            </CardContent>
          </Card>

          {/* セキュリティ情報 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                セキュリティ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">2段階認証</span>
                <Badge variant={isEditing ? formData.security.twoFactorEnabled : profile.security.twoFactorEnabled ? "default" : "secondary"}>
                  {isEditing ? formData.security.twoFactorEnabled : profile.security.twoFactorEnabled ? "有効" : "無効"}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                最終パスワード変更: {new Date(isEditing ? formData.security.lastPasswordChange : profile.security.lastPasswordChange).toLocaleDateString('ja-JP')}
              </div>
              <div className="text-sm text-muted-foreground">
                ログイン試行回数: {isEditing ? formData.security.loginAttempts : profile.security.loginAttempts}
              </div>
              <Button variant="outline" size="sm" className="w-full flex items-center gap-2">
                <Key className="h-4 w-4" />
                パスワードを変更
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* 右側: 詳細情報 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 基本情報 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                基本情報
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">名前</Label>
                  <Input
                    id="name"
                    value={isEditing ? formData.name : profile.name}
                    onChange={(e) => isEditing && handleChange('name', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="email">メールアドレス</Label>
                  <Input
                    id="email"
                    type="email"
                    value={isEditing ? formData.email : profile.email}
                    onChange={(e) => isEditing && handleChange('email', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">電話番号</Label>
                  <Input
                    id="phone"
                    value={isEditing ? formData.phone : profile.phone}
                    onChange={(e) => isEditing && handleChange('phone', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="location">所在地</Label>
                  <Input
                    id="location"
                    value={isEditing ? formData.location : profile.location}
                    onChange={(e) => isEditing && handleChange('location', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="department">部署</Label>
                  <Input
                    id="department"
                    value={isEditing ? formData.department : profile.department}
                    onChange={(e) => isEditing && handleChange('department', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="role">役職</Label>
                  <Select
                    value={isEditing ? formData.role : profile.role}
                    onValueChange={(value) => isEditing && handleChange('role', value)}
                    disabled={!isEditing}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="moderator">モデレーター</SelectItem>
                      <SelectItem value="admin">管理者</SelectItem>
                      <SelectItem value="super_admin">スーパー管理者</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="bio">自己紹介</Label>
                <Textarea
                  id="bio"
                  value={isEditing ? formData.bio : profile.bio}
                  onChange={(e) => isEditing && handleChange('bio', e.target.value)}
                  disabled={!isEditing}
                  className="min-h-[100px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* 設定 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                設定
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="language">言語</Label>
                  <Select
                    value={isEditing ? formData.preferences.language : profile.preferences.language}
                    onValueChange={(value) => isEditing && handlePreferenceChange('language', 'language', value)}
                    disabled={!isEditing}
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
                <div>
                  <Label htmlFor="timezone">タイムゾーン</Label>
                  <Select
                    value={isEditing ? formData.preferences.timezone : profile.preferences.timezone}
                    onValueChange={(value) => isEditing && handlePreferenceChange('timezone', 'timezone', value)}
                    disabled={!isEditing}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Tokyo">Asia/Tokyo</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">America/New_York</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="theme">テーマ</Label>
                  <Select
                    value={isEditing ? formData.preferences.theme : profile.preferences.theme}
                    onValueChange={(value) => isEditing && handlePreferenceChange('theme', 'theme', value)}
                    disabled={!isEditing}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">ライト</SelectItem>
                      <SelectItem value="dark">ダーク</SelectItem>
                      <SelectItem value="system">システム</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  通知設定
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">メール通知</span>
                    <input
                      type="checkbox"
                      checked={isEditing ? formData.preferences.notifications.email : profile.preferences.notifications.email}
                      onChange={(e) => isEditing && handlePreferenceChange('notifications', 'email', e.target.checked)}
                      disabled={!isEditing}
                      className="rounded"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">プッシュ通知</span>
                    <input
                      type="checkbox"
                      checked={isEditing ? formData.preferences.notifications.push : profile.preferences.notifications.push}
                      onChange={(e) => isEditing && handlePreferenceChange('notifications', 'push', e.target.checked)}
                      disabled={!isEditing}
                      className="rounded"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">SMS通知</span>
                    <input
                      type="checkbox"
                      checked={isEditing ? formData.preferences.notifications.sms : profile.preferences.notifications.sms}
                      onChange={(e) => isEditing && handlePreferenceChange('notifications', 'sms', e.target.checked)}
                      disabled={!isEditing}
                      className="rounded"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
