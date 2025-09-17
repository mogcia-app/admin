'use client'

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Save, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { User, SNSAISettings, BusinessInfo, BillingInfo } from '@/types'

interface UserModalProps {
  isOpen: boolean
  onClose: () => void
  user?: User | null
  onSave: (user: Partial<User>) => void
}

const snsOptions = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'x', label: 'X (Twitter)' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'tiktok', label: 'TikTok' }
]

const industryOptions = [
  '美容・コスメ',
  '料理・グルメ',
  'IT・テクノロジー',
  'ファッション',
  '健康・フィットネス',
  '教育・学習',
  'エンターテイメント',
  'ビジネス・金融',
  '旅行・観光',
  'ライフスタイル',
  'その他'
]

export function UserModal({ isOpen, onClose, user, onSave }: UserModalProps) {
  const [formData, setFormData] = useState<Partial<User>>({
    name: '',
    email: '',
    usageType: 'solo',
    contractType: 'trial',
    contractSNS: [],
    snsCount: 1, // デフォルトは1SNS
    snsAISettings: {},
    businessInfo: {
      industry: '',
      companySize: 'individual',
      businessType: 'b2c',
      description: '',
      targetMarket: '',
      goals: [],
      challenges: [],
      currentSNSStrategy: ''
    },
    status: 'active',
    contractStartDate: new Date().toISOString().split('T')[0] + 'T00:00:00Z',
    contractEndDate: '',
    billingInfo: {
      plan: 'trial',
      monthlyFee: 0,
      currency: 'JPY',
      paymentMethod: 'credit_card',
      nextBillingDate: '',
      paymentStatus: 'paid'
    },
    notes: ''
  })

  const [newGoal, setNewGoal] = useState('')
  const [newChallenge, setNewChallenge] = useState('')
  const [newKeyword, setNewKeyword] = useState('')

  // ユーザー編集時の初期化
  useEffect(() => {
    if (user) {
      setFormData({
        ...user,
        contractStartDate: user.contractStartDate.split('T')[0] + 'T00:00:00Z',
        contractEndDate: user.contractEndDate.split('T')[0] + 'T00:00:00Z'
      })
    } else {
      // 新規作成時のデフォルト値
      const now = new Date()
      const endDate = new Date(now)
      if (formData.contractType === 'trial') {
        endDate.setMonth(endDate.getMonth() + 1)
      } else {
        endDate.setFullYear(endDate.getFullYear() + 1)
      }

      setFormData({
        name: '',
        email: '',
        usageType: 'solo',
        contractType: 'trial',
        contractSNS: [],
        snsAISettings: {},
        businessInfo: {
          industry: '',
          companySize: 'individual',
          businessType: 'b2c',
          description: '',
          targetMarket: '',
          goals: [],
          challenges: [],
          currentSNSStrategy: ''
        },
        status: 'active',
        contractStartDate: now.toISOString(),
        contractEndDate: endDate.toISOString(),
        billingInfo: {
          plan: 'trial',
          monthlyFee: 0,
          currency: 'JPY',
          paymentMethod: 'credit_card',
          nextBillingDate: endDate.toISOString(),
          paymentStatus: 'paid'
        },
        notes: ''
      })
    }
  }, [user])

  // 契約タイプ変更時の終了日自動設定
  useEffect(() => {
    if (formData.contractStartDate) {
      const startDate = new Date(formData.contractStartDate)
      const endDate = new Date(startDate)
      
      if (formData.contractType === 'trial') {
        endDate.setMonth(endDate.getMonth() + 1)
        setFormData(prev => ({
          ...prev,
          contractEndDate: endDate.toISOString(),
          billingInfo: {
            ...prev.billingInfo!,
            plan: 'trial',
            monthlyFee: 0
          }
        }))
      } else {
        endDate.setFullYear(endDate.getFullYear() + 1)
        setFormData(prev => ({
          ...prev,
          contractEndDate: endDate.toISOString(),
          billingInfo: {
            ...prev.billingInfo!,
            plan: 'basic',
            monthlyFee: 9800
          }
        }))
      }
    }
  }, [formData.contractType, formData.contractStartDate])

  if (!isOpen) return null

  const handleSNSChange = (sns: string, checked: boolean) => {
    const updatedSNS = checked 
      ? [...(formData.contractSNS || []), sns]
      : (formData.contractSNS || []).filter(s => s !== sns)

    const updatedSettings = { ...formData.snsAISettings }
    
    if (checked) {
      updatedSettings[sns as keyof SNSAISettings] = {
        enabled: true,
        tone: 'friendly',
        language: 'japanese',
        postFrequency: 'medium',
        targetAudience: '',
        brandVoice: '',
        keywords: [],
        autoPost: false,
        contentTypes: ['text']
      }
    } else {
      delete updatedSettings[sns as keyof SNSAISettings]
    }

    setFormData({
      ...formData,
      contractSNS: updatedSNS as any,
      snsAISettings: updatedSettings
    })
  }

  const handleSNSSettingChange = (sns: string, field: string, value: any) => {
    setFormData({
      ...formData,
      snsAISettings: {
        ...formData.snsAISettings,
        [sns]: {
          ...formData.snsAISettings![sns as keyof SNSAISettings],
          [field]: value
        }
      }
    })
  }

  const handleAddGoal = () => {
    if (!newGoal.trim()) return
    setFormData({
      ...formData,
      businessInfo: {
        ...formData.businessInfo!,
        goals: [...(formData.businessInfo?.goals || []), newGoal.trim()]
      }
    })
    setNewGoal('')
  }

  const handleRemoveGoal = (index: number) => {
    setFormData({
      ...formData,
      businessInfo: {
        ...formData.businessInfo!,
        goals: formData.businessInfo!.goals.filter((_, i) => i !== index)
      }
    })
  }

  const handleAddChallenge = () => {
    if (!newChallenge.trim()) return
    setFormData({
      ...formData,
      businessInfo: {
        ...formData.businessInfo!,
        challenges: [...(formData.businessInfo?.challenges || []), newChallenge.trim()]
      }
    })
    setNewChallenge('')
  }

  const handleRemoveChallenge = (index: number) => {
    setFormData({
      ...formData,
      businessInfo: {
        ...formData.businessInfo!,
        challenges: formData.businessInfo!.challenges.filter((_, i) => i !== index)
      }
    })
  }

  const handleSave = () => {
    if (!formData.name?.trim() || !formData.email?.trim()) {
      alert('名前とメールアドレスは必須項目です。')
      return
    }

    // 新規作成時はパスワードも必須
    if (!user && (!formData.password || formData.password.length < 8)) {
      alert('初期パスワードは8文字以上で入力してください。')
      return
    }

    onSave({
      ...formData,
      updatedAt: new Date().toISOString()
    })
    onClose()
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto relative">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold">
            {user ? '利用者情報編集' : '新規利用者追加'}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* 基本情報 */}
          <Card>
            <CardHeader>
              <CardTitle>基本情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">名前 *</label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="利用者名を入力"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">メールアドレス *</label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="email@example.com"
                  />
                </div>
              </div>

              {/* パスワード設定（新規作成時のみ） */}
              {!user && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    初期パスワード *
                    <span className="text-xs text-muted-foreground ml-2">
                      （利用者がログインで使用するパスワード）
                    </span>
                  </label>
                  <input
                    type="password"
                    value={formData.password || ''}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="8文字以上のパスワードを入力"
                    minLength={8}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    このパスワードで利用者側アプリにログインできます。利用者は後で変更可能です。
                  </p>
                </div>
              )}

              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">利用形態</label>
                  <select
                    value={formData.usageType || 'solo'}
                    onChange={(e) => setFormData({ ...formData, usageType: e.target.value as any })}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="solo">ソロ利用</option>
                    <option value="team">チーム利用</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">契約タイプ</label>
                  <select
                    value={formData.contractType || 'trial'}
                    onChange={(e) => setFormData({ ...formData, contractType: e.target.value as any })}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="trial">お試し1ヶ月契約</option>
                    <option value="annual">年間契約</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">SNS契約数</label>
                  <select
                    value={formData.snsCount || 1}
                    onChange={(e) => setFormData({ ...formData, snsCount: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value={1}>1SNS (60,000円)</option>
                    <option value={2}>2SNS (80,000円)</option>
                    <option value={3}>3SNS (100,000円)</option>
                    <option value={4}>4SNS (120,000円)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">ステータス</label>
                  <select
                    value={formData.status || 'active'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="active">アクティブ</option>
                    <option value="inactive">非アクティブ</option>
                    <option value="suspended">停止中</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 契約SNS選択 */}
          <Card>
            <CardHeader>
              <CardTitle>契約SNS</CardTitle>
              <CardDescription>利用するSNSプラットフォームを選択してください</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {snsOptions.map((sns) => (
                  <label key={sns.value} className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={formData.contractSNS?.includes(sns.value as any) || false}
                      onChange={(e) => handleSNSChange(sns.value, e.target.checked)}
                      className="rounded border-border"
                    />
                    <span className="font-medium">{sns.label}</span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* SNS AI設定 */}
          {formData.contractSNS && formData.contractSNS.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>SNS AI設定</CardTitle>
                <CardDescription>各SNSプラットフォームのAI設定を行います</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {formData.contractSNS.map((sns) => {
                  const setting = formData.snsAISettings![sns as keyof SNSAISettings]
                  if (!setting) return null

                  return (
                    <div key={sns} className="border rounded-lg p-4 space-y-4">
                      <h4 className="font-medium text-lg">{snsOptions.find(s => s.value === sns)?.label}</h4>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">トーン</label>
                          <select
                            value={setting.tone}
                            onChange={(e) => handleSNSSettingChange(sns, 'tone', e.target.value)}
                            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                          >
                            <option value="casual">カジュアル</option>
                            <option value="professional">プロフェッショナル</option>
                            <option value="friendly">親しみやすい</option>
                            <option value="energetic">エネルギッシュ</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">言語</label>
                          <select
                            value={setting.language}
                            onChange={(e) => handleSNSSettingChange(sns, 'language', e.target.value)}
                            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                          >
                            <option value="japanese">日本語</option>
                            <option value="english">英語</option>
                            <option value="mixed">日英混合</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">投稿頻度</label>
                          <select
                            value={setting.postFrequency}
                            onChange={(e) => handleSNSSettingChange(sns, 'postFrequency', e.target.value)}
                            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                          >
                            <option value="low">低頻度</option>
                            <option value="medium">中頻度</option>
                            <option value="high">高頻度</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">ターゲット層</label>
                          <input
                            type="text"
                            value={setting.targetAudience}
                            onChange={(e) => handleSNSSettingChange(sns, 'targetAudience', e.target.value)}
                            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                            placeholder="例: 20-30代女性"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">ブランドボイス</label>
                          <input
                            type="text"
                            value={setting.brandVoice}
                            onChange={(e) => handleSNSSettingChange(sns, 'brandVoice', e.target.value)}
                            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                            placeholder="例: 親しみやすく信頼感のある"
                          />
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`autoPost-${sns}`}
                          checked={setting.autoPost}
                          onChange={(e) => handleSNSSettingChange(sns, 'autoPost', e.target.checked)}
                          className="rounded border-border"
                        />
                        <label htmlFor={`autoPost-${sns}`} className="text-sm font-medium">
                          自動投稿を有効にする
                        </label>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )}

          {/* 事業情報 */}
          <Card>
            <CardHeader>
              <CardTitle>事業情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">業界</label>
                  <select
                    value={formData.businessInfo?.industry || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      businessInfo: { ...formData.businessInfo!, industry: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">選択してください</option>
                    {industryOptions.map(industry => (
                      <option key={industry} value={industry}>{industry}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">会社規模</label>
                  <select
                    value={formData.businessInfo?.companySize || 'individual'}
                    onChange={(e) => setFormData({
                      ...formData,
                      businessInfo: { ...formData.businessInfo!, companySize: e.target.value as any }
                    })}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="individual">個人</option>
                    <option value="small">小規模 (1-10人)</option>
                    <option value="medium">中規模 (11-100人)</option>
                    <option value="large">大規模 (100人以上)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">事業タイプ</label>
                  <select
                    value={formData.businessInfo?.businessType || 'b2c'}
                    onChange={(e) => setFormData({
                      ...formData,
                      businessInfo: { ...formData.businessInfo!, businessType: e.target.value as any }
                    })}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="b2c">B2C</option>
                    <option value="b2b">B2B</option>
                    <option value="both">両方</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">事業内容</label>
                <textarea
                  value={formData.businessInfo?.description || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    businessInfo: { ...formData.businessInfo!, description: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  rows={3}
                  placeholder="事業の詳細を入力してください"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">ターゲット市場</label>
                <input
                  type="text"
                  value={formData.businessInfo?.targetMarket || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    businessInfo: { ...formData.businessInfo!, targetMarket: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="例: 20-40代の美容意識の高い女性"
                />
              </div>

              {/* 目標 */}
              <div>
                <label className="block text-sm font-medium mb-2">目標</label>
                {formData.businessInfo?.goals && formData.businessInfo.goals.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {formData.businessInfo.goals.map((goal, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                        <span className="flex-1">{goal}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveGoal(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newGoal}
                    onChange={(e) => setNewGoal(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddGoal()}
                    className="flex-1 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="目標を入力"
                  />
                  <Button onClick={handleAddGoal} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* 課題 */}
              <div>
                <label className="block text-sm font-medium mb-2">課題</label>
                {formData.businessInfo?.challenges && formData.businessInfo.challenges.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {formData.businessInfo.challenges.map((challenge, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                        <span className="flex-1">{challenge}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveChallenge(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newChallenge}
                    onChange={(e) => setNewChallenge(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddChallenge()}
                    className="flex-1 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="課題を入力"
                  />
                  <Button onClick={handleAddChallenge} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 契約・課金情報 */}
          <Card>
            <CardHeader>
              <CardTitle>契約・課金情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">契約開始日</label>
                  <input
                    type="date"
                    value={formData.contractStartDate?.split('T')[0] || ''}
                    onChange={(e) => setFormData({ ...formData, contractStartDate: e.target.value + 'T00:00:00Z' })}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">契約終了日</label>
                  <input
                    type="date"
                    value={formData.contractEndDate?.split('T')[0] || ''}
                    onChange={(e) => setFormData({ ...formData, contractEndDate: e.target.value + 'T00:00:00Z' })}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">月額料金</label>
                  <input
                    type="number"
                    value={formData.billingInfo?.monthlyFee || 0}
                    onChange={(e) => setFormData({
                      ...formData,
                      billingInfo: { ...formData.billingInfo!, monthlyFee: parseInt(e.target.value) || 0 }
                    })}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">支払い方法</label>
                  <select
                    value={formData.billingInfo?.paymentMethod || 'credit_card'}
                    onChange={(e) => setFormData({
                      ...formData,
                      billingInfo: { ...formData.billingInfo!, paymentMethod: e.target.value as any }
                    })}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="credit_card">クレジットカード</option>
                    <option value="bank_transfer">銀行振込</option>
                    <option value="invoice">請求書</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">支払いステータス</label>
                  <select
                    value={formData.billingInfo?.paymentStatus || 'paid'}
                    onChange={(e) => setFormData({
                      ...formData,
                      billingInfo: { ...formData.billingInfo!, paymentStatus: e.target.value as any }
                    })}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="paid">支払い済み</option>
                    <option value="pending">支払い待ち</option>
                    <option value="overdue">延滞</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* メモ */}
          <Card>
            <CardHeader>
              <CardTitle>メモ</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                rows={3}
                placeholder="管理者用メモ..."
              />
            </CardContent>
          </Card>
        </div>

        {/* フッター */}
        <div className="flex items-center justify-end gap-3 p-6 border-t">
          <Button variant="outline" onClick={onClose}>
            キャンセル
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            保存
          </Button>
        </div>
      </div>
    </div>,
    document.body
  )
}
