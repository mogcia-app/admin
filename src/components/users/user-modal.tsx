'use client'

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Save, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { User, SNSAISettings, BusinessInfo, BillingInfo, Company, AIInitialSettings } from '@/types'
import { useCompanies } from '@/hooks/useCompanies'
import { getPlanList, getPlanName, getUserPlanTier, planTierToBillingPlan } from '@/lib/plan-access'

interface UserModalProps {
  isOpen: boolean
  onClose: () => void
  user?: User | null
  onSave: (user: Partial<User>) => void
  preselectedCompanyId?: string // 事前選択された企業ID（企業ページから遷移した場合など）
}

const snsOptions = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'x', label: 'X (Twitter)' },
  // { value: 'youtube', label: 'YouTube' }, // 将来的に必要になる可能性あり
  { value: 'tiktok', label: 'TikTok' }
]

// SNS数別の月額料金
const snsPricing: Record<number, number> = {
  1: 60000,
  2: 80000,
  3: 100000,
  // 4: 120000 // 将来的に必要になる可能性あり
}

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

export function UserModal({ isOpen, onClose, user, onSave, preselectedCompanyId }: UserModalProps) {
  const { companies } = useCompanies()
  const [formData, setFormData] = useState<Partial<User>>({
    name: '',
    email: '',
    password: '', // 新規作成時のパスワード
    usageType: 'solo',
    contractType: 'trial',
    contractSNS: [],
    snsCount: 1, // デフォルトは1SNS
    snsAISettings: {},
    companyId: undefined, // 企業ID（オプション）
    businessInfo: {
      industry: '',
      companySize: 'individual',
      businessType: 'b2c',
      description: '',
      snsMainGoals: [],
      brandMission: '',
      targetCustomer: '',
      uniqueValue: '',
      brandVoice: '',
      kpiTargets: [],
      challenges: []
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
      paymentStatus: 'paid',
      requiresStripeSetup: false
    },
    planTier: 'ume', // デフォルトは梅プラン
    aiInitialSettings: {
      defaultTone: 'professional',
      defaultLanguage: 'ja',
      contentPreferences: {
        preferredLength: 'medium',
        hashtagStrategy: 'moderate',
        emojiUsage: 'moderate'
      },
      enabledFeatures: []
    },
    notes: ''
  })

  const [newSNSMainGoal, setNewSNSMainGoal] = useState('')
  const [newKPITarget, setNewKPITarget] = useState('')
  const [newChallenge, setNewChallenge] = useState('')
  const [newFocusMetric, setNewFocusMetric] = useState('')

  // ユーザー編集時の初期化
  useEffect(() => {
    if (user) {
      // planTierからbillingInfo.planを自動設定（既存ユーザーの場合）
      const planTier = user.planTier || 'ume'
      const billingPlan = planTierToBillingPlan(planTier)
      const billingInfo = user.billingInfo || {
        plan: billingPlan,
        monthlyFee: planTier === 'ume' ? 15000 : planTier === 'take' ? 30000 : 60000,
        currency: 'JPY' as const,
        paymentMethod: 'credit_card' as const,
        nextBillingDate: '',
        paymentStatus: 'paid' as const
      }
      
      // billingInfo.planが設定されていない場合はplanTierから設定
      if (!billingInfo.plan || (billingInfo.plan !== 'light' && billingInfo.plan !== 'standard' && billingInfo.plan !== 'professional')) {
        billingInfo.plan = billingPlan
      }
      
      setFormData({
        ...user,
        billingInfo,
        contractStartDate: user.contractStartDate.split('T')[0] + 'T00:00:00Z',
        contractEndDate: user.contractEndDate.split('T')[0] + 'T00:00:00Z'
      })
    } else {
      // 事前選択された企業IDを設定
      if (preselectedCompanyId) {
        setFormData(prev => ({ ...prev, companyId: preselectedCompanyId }))
      }
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
        password: '', // 新規作成時のパスワード
        usageType: 'solo',
        contractType: 'trial',
        contractSNS: [],
        snsAISettings: {},
        businessInfo: {
          industry: '',
          companySize: 'individual',
          businessType: 'b2c',
          description: '',
          snsMainGoals: [],
          brandMission: '',
          targetCustomer: '',
          uniqueValue: '',
          brandVoice: '',
          kpiTargets: [],
          challenges: []
        },
        status: 'active',
        contractStartDate: now.toISOString(),
        contractEndDate: endDate.toISOString(),
        billingInfo: {
          plan: 'light', // デフォルトはライトプラン
          monthlyFee: 15000, // デフォルトはライトプラン
          currency: 'JPY',
          paymentMethod: 'credit_card',
          nextBillingDate: endDate.toISOString(),
          paymentStatus: 'paid',
          requiresStripeSetup: true
        },
        planTier: 'ume', // デフォルトはライトプラン（後方互換性のためumeを保持）
        aiInitialSettings: {
          defaultTone: 'professional',
          defaultLanguage: 'ja',
          contentPreferences: {
            preferredLength: 'medium',
            hashtagStrategy: 'moderate',
            emojiUsage: 'moderate'
          },
          enabledFeatures: []
        },
        notes: '',
        companyId: preselectedCompanyId || undefined
      })
    }
  }, [user, preselectedCompanyId])

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

  // SNS契約数に応じて月額料金を自動更新
  useEffect(() => {
    const snsCount = formData.snsCount || 1
    const monthlyFee = snsPricing[snsCount] || 60000
    
    setFormData(prev => ({
      ...prev,
      billingInfo: {
        ...prev.billingInfo!,
        monthlyFee
      }
    }))
  }, [formData.snsCount])

  if (!isOpen) return null

  const handleSNSChange = (sns: string, checked: boolean) => {
    // SNS選択数の制限（最大3つまで）
    if (checked && (formData.contractSNS || []).length >= 3) {
      alert('SNSは最大3つまで選択できます')
      return
    }

    const updatedSNS = checked 
      ? [...(formData.contractSNS || []), sns]
      : (formData.contractSNS || []).filter(s => s !== sns)

    const updatedSettings = { ...formData.snsAISettings }
    
    if (checked) {
      updatedSettings[sns as keyof SNSAISettings] = {
        enabled: true,
        whyThisSNS: '',
        snsGoal: '',
        contentDirection: '',
        postFrequency: '',
        targetAction: '',
        tone: '',
        focusMetrics: [],
        strategyNotes: ''
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

  const handleAddSNSMainGoal = () => {
    if (!newSNSMainGoal.trim()) return
    setFormData({
      ...formData,
      businessInfo: {
        ...formData.businessInfo!,
        snsMainGoals: [...(formData.businessInfo?.snsMainGoals || []), newSNSMainGoal.trim()]
      }
    })
    setNewSNSMainGoal('')
  }

  const handleRemoveSNSMainGoal = (index: number) => {
    setFormData({
      ...formData,
      businessInfo: {
        ...formData.businessInfo!,
        snsMainGoals: formData.businessInfo!.snsMainGoals.filter((_, i) => i !== index)
      }
    })
  }

  const handleAddKPITarget = () => {
    if (!newKPITarget.trim()) return
    setFormData({
      ...formData,
      businessInfo: {
        ...formData.businessInfo!,
        kpiTargets: [...(formData.businessInfo?.kpiTargets || []), newKPITarget.trim()]
      }
    })
    setNewKPITarget('')
  }

  const handleRemoveKPITarget = (index: number) => {
    setFormData({
      ...formData,
      businessInfo: {
        ...formData.businessInfo!,
        kpiTargets: formData.businessInfo!.kpiTargets.filter((_, i) => i !== index)
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

  const handleAddFocusMetric = (sns: string) => {
    if (!newFocusMetric.trim()) return
    
    const updatedSettings = { ...formData.snsAISettings }
    const currentSetting = updatedSettings[sns as keyof SNSAISettings]
    
    if (currentSetting) {
      updatedSettings[sns as keyof SNSAISettings] = {
        ...currentSetting,
        focusMetrics: [...(currentSetting.focusMetrics || []), newFocusMetric.trim()]
      }
    }
    
    setFormData({
      ...formData,
      snsAISettings: updatedSettings
    })
    setNewFocusMetric('')
  }

  const handleRemoveFocusMetric = (sns: string, index: number) => {
    const updatedSettings = { ...formData.snsAISettings }
    const currentSetting = updatedSettings[sns as keyof SNSAISettings]
    
    if (currentSetting) {
      updatedSettings[sns as keyof SNSAISettings] = {
        ...currentSetting,
        focusMetrics: currentSetting.focusMetrics.filter((_, i) => i !== index)
      }
    }
    
    setFormData({
      ...formData,
      snsAISettings: updatedSettings
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

    // デバッグ用：送信データを確認
    console.log('Saving user data:', {
      ...formData,
      password: formData.password ? `[${formData.password.length} chars]` : '[NOT SET]' // パスワード長のみ表示
    })

    // パスワードが設定されていることを確認
    if (!user && !formData.password) {
      console.error('Password is missing for new user creation')
      alert('パスワードが設定されていません。')
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

              {/* 企業選択（B2B向け） */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  所属企業（オプション）
                  <span className="text-xs text-muted-foreground ml-2">
                    企業向け販売の場合、ユーザーを企業に紐付けます
                  </span>
                </label>
                <select
                  value={formData.companyId || ''}
                  onChange={(e) => setFormData({ ...formData, companyId: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">企業を選択しない（個人利用者）</option>
                  {companies
                    .filter(company => company.status === 'active')
                    .map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name} {company.industry ? `(${company.industry})` : ''}
                      </option>
                    ))}
                </select>
                {formData.companyId && (
                  <p className="text-xs text-muted-foreground mt-1">
                    選択中の企業: {companies.find(c => c.id === formData.companyId)?.name}
                  </p>
                )}
              </div>

              {/* プラン階層選択（会員サイト向け） */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  プラン階層 *
                  <span className="text-xs text-muted-foreground ml-2">
                    会員サイトでの機能アクセスを制御します
                  </span>
                </label>
                <select
                  value={formData.planTier || 'ume'}
                  onChange={(e) => {
                    const selectedTier = e.target.value as 'ume' | 'take' | 'matsu'
                    const billingPlan = planTierToBillingPlan(selectedTier)
                    setFormData({ 
                      ...formData, 
                      planTier: selectedTier,
                      billingInfo: {
                        ...formData.billingInfo!,
                        plan: billingPlan,
                        monthlyFee: selectedTier === 'ume' ? 15000 : selectedTier === 'take' ? 30000 : 60000
                      }
                    })
                  }}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {getPlanList().map((plan) => (
                    <option key={plan.value} value={plan.value}>
                      {plan.label} (¥{plan.price.toLocaleString()}/月)
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  現在選択: {getPlanName(formData.planTier || 'ume')}
                </p>
              </div>

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
                    {/* <option value={4}>4SNS (120,000円)</option> */} {/* 将来的に必要になる可能性あり */}
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
              <CardDescription>利用するSNSプラットフォームを選択してください（最大3つまで）</CardDescription>
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
                <CardTitle>各SNS AI設定</CardTitle>
                <CardDescription>
                  なぜそのSNSを選んだのか？そのSNSで何を達成するのか？を明確にしてください
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {formData.contractSNS.map((sns) => {
                  const setting = formData.snsAISettings![sns as keyof SNSAISettings]
                  if (!setting) return null

                  return (
                    <div key={sns} className="border-2 border-gray-200 rounded-lg p-4 space-y-4 bg-white">
                      <h4 className="font-medium text-lg flex items-center gap-2">
                        🎯 {snsOptions.find(s => s.value === sns)?.label}
                      </h4>
                      
                      {/* Why THIS SNS? */}
                      <div className="border-l-4 border-yellow-500 pl-3 py-2">
                        <label className="block text-sm font-medium mb-2">
                          ❓ なぜこのSNSを選んだのか？
                        </label>
                        <textarea
                          value={setting.whyThisSNS}
                          onChange={(e) => handleSNSSettingChange(sns, 'whyThisSNS', e.target.value)}
                          className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                          rows={2}
                          placeholder={
                            sns === 'instagram' ? '例: 高級感・ビジュアルでブランド価値を伝えやすい' :
                            sns === 'x' ? '例: リアルタイムな対話とコミュニティ形成に最適' :
                            sns === 'tiktok' ? '例: 若年層へのリーチと動画コンテンツの拡散力' :
                            'このSNSを選んだ理由を入力'
                          }
                        />
                      </div>

                      {/* このSNSでの目標 */}
                      <div>
                        <label className="block text-sm font-medium mb-2">このSNSでの目標・期待する成果</label>
                        <textarea
                          value={setting.snsGoal}
                          onChange={(e) => handleSNSSettingChange(sns, 'snsGoal', e.target.value)}
                          className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                          rows={2}
                          placeholder={
                            sns === 'instagram' ? '例: フォロワー1万人達成、プロフィールからEC誘導月100件' :
                            sns === 'x' ? '例: エンゲージメント率5%以上、コミュニティ形成' :
                            sns === 'tiktok' ? '例: バズ動画で月間100万再生、若年層認知拡大' :
                            'このSNSで達成したいことを入力'
                          }
                        />
                      </div>

                      {/* コンテンツの方向性 */}
                      <div>
                        <label className="block text-sm font-medium mb-2">コンテンツの方向性</label>
                        <textarea
                          value={setting.contentDirection}
                          onChange={(e) => handleSNSSettingChange(sns, 'contentDirection', e.target.value)}
                          className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                          rows={3}
                          placeholder={
                            sns === 'instagram' ? '例: フィード（商品写真、店舗の雰囲気）、リール（淹れ方動画）、ストーリーズ（日常）' :
                            sns === 'x' ? '例: 新商品告知、お客様の声紹介、業界トレンド解説' :
                            sns === 'tiktok' ? '例: 15-30秒の短尺動画、トレンド音源活用、チャレンジ参加' :
                            'どんなコンテンツを投稿するか'
                          }
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">投稿頻度の目安</label>
                          <input
                            type="text"
                            value={setting.postFrequency}
                            onChange={(e) => handleSNSSettingChange(sns, 'postFrequency', e.target.value)}
                            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                            placeholder="例: 週3投稿、毎日ストーリーズ"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">ターゲットとするアクション</label>
                          <input
                            type="text"
                            value={setting.targetAction}
                            onChange={(e) => handleSNSSettingChange(sns, 'targetAction', e.target.value)}
                            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                            placeholder="例: プロフィールからEC誘導"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">トーン＆マナー</label>
                        <input
                          type="text"
                          value={setting.tone}
                          onChange={(e) => handleSNSSettingChange(sns, 'tone', e.target.value)}
                          className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                          placeholder="例: 温かみがあり、専門性を感じさせる"
                        />
                      </div>

                      {/* 重視する指標 */}
                      <div>
                        <label className="block text-sm font-medium mb-2">重視する指標</label>
                        <p className="text-xs text-muted-foreground mb-2">
                          例: 「保存数」「シェア数」「エンゲージメント率」「プロフィールクリック数」
                        </p>
                        {setting.focusMetrics && setting.focusMetrics.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {setting.focusMetrics.map((metric, index) => (
                              <div key={index} className="flex items-center gap-1 px-2 py-1 bg-white rounded border">
                                <span className="text-sm">{metric}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveFocusMetric(sns, index)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newFocusMetric}
                            onChange={(e) => setNewFocusMetric(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFocusMetric(sns))}
                            className="flex-1 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                            placeholder="重視する指標を入力"
                          />
                          <Button type="button" onClick={() => handleAddFocusMetric(sns)} size="sm">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* その他の戦略メモ */}
                      <div>
                        <label className="block text-sm font-medium mb-2">その他の戦略メモ（任意）</label>
                        <textarea
                          value={setting.strategyNotes || ''}
                          onChange={(e) => handleSNSSettingChange(sns, 'strategyNotes', e.target.value)}
                          className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                          rows={2}
                          placeholder="その他、AIに伝えたい戦略や注意点"
                        />
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
              <CardDescription>
                SNSを使って何を達成したいのか？事業の核となる情報を入力してください
              </CardDescription>
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

              {/* SNS活用の大目標 */}
              <div className="border-l-4 border-primary pl-4 p-4 rounded bg-white">
                <label className="block text-sm font-medium mb-2 text-primary">
                  💡 SNS活用の大目標（Why SNS?）
                </label>
                <p className="text-xs text-muted-foreground mb-3">
                  例: 「認知拡大で月間新規顧客100人獲得」「EC売上30%UP」「ブランド世界観の確立」
                </p>
                {formData.businessInfo?.snsMainGoals && formData.businessInfo.snsMainGoals.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {formData.businessInfo.snsMainGoals.map((goal, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-white rounded">
                        <span className="flex-1">{goal}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveSNSMainGoal(index)}
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
                    value={newSNSMainGoal}
                    onChange={(e) => setNewSNSMainGoal(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddSNSMainGoal()}
                    className="flex-1 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="SNS活用の大目標を入力"
                  />
                  <Button onClick={handleAddSNSMainGoal} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* ブランドの核 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">ブランドミッション・理念</label>
                  <textarea
                    value={formData.businessInfo?.brandMission || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      businessInfo: { ...formData.businessInfo!, brandMission: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    rows={2}
                    placeholder="例: 毎日のコーヒーを特別な体験に"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">ターゲット顧客</label>
                  <textarea
                    value={formData.businessInfo?.targetCustomer || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      businessInfo: { ...formData.businessInfo!, targetCustomer: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    rows={2}
                    placeholder="例: 30-40代、コーヒーにこだわりたい層"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">独自の価値・差別化ポイント</label>
                  <textarea
                    value={formData.businessInfo?.uniqueValue || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      businessInfo: { ...formData.businessInfo!, uniqueValue: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    rows={2}
                    placeholder="例: 産地直送の高品質豆、丁寧な焙煎"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">ブランドボイス・トーン</label>
                  <textarea
                    value={formData.businessInfo?.brandVoice || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      businessInfo: { ...formData.businessInfo!, brandVoice: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    rows={2}
                    placeholder="例: 温かみがあり、専門性を感じさせる"
                  />
                </div>
              </div>

              {/* 測定したいKPI */}
              <div>
                <label className="block text-sm font-medium mb-2">測定したいKPI</label>
                <p className="text-xs text-muted-foreground mb-2">
                  例: 「月間新規顧客100人」「リピート率50%」「地域No.1の認知度」
                </p>
                {formData.businessInfo?.kpiTargets && formData.businessInfo.kpiTargets.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {formData.businessInfo.kpiTargets.map((kpi, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                        <span className="flex-1">{kpi}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveKPITarget(index)}
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
                    value={newKPITarget}
                    onChange={(e) => setNewKPITarget(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddKPITarget()}
                    className="flex-1 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="KPI目標を入力"
                  />
                  <Button onClick={handleAddKPITarget} size="sm">
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
                  <div className="relative">
                    <input
                      type="text"
                      value={`¥${(formData.billingInfo?.monthlyFee || 0).toLocaleString()}`}
                      readOnly
                      className="w-full px-3 py-2 border border-border rounded-md bg-gray-50 text-gray-700 cursor-not-allowed"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      自動計算
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    プラン階層に応じて自動設定されます（会員サイト）
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">支払い方法</label>
                  <select
                    value={formData.billingInfo?.paymentMethod || 'credit_card'}
                    onChange={(e) => {
                      const paymentMethod = e.target.value as 'credit_card' | 'bank_transfer' | 'invoice'
                      setFormData({
                        ...formData,
                        billingInfo: { 
                          ...formData.billingInfo!, 
                          paymentMethod,
                          requiresStripeSetup: paymentMethod === 'credit_card' && !formData.billingInfo?.stripeCustomerId
                        }
                      })
                    }}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="credit_card">クレジットカード（Stripe）</option>
                    <option value="bank_transfer">銀行振込</option>
                    <option value="invoice">請求書</option>
                  </select>
                  {formData.billingInfo?.paymentMethod === 'credit_card' && (
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <p className="text-sm font-medium text-blue-900 mb-1">Stripe決済設定</p>
                      {formData.billingInfo.stripeCustomerId ? (
                        <div className="space-y-1 text-xs text-blue-800">
                          <p>✓ 顧客ID: {formData.billingInfo.stripeCustomerId}</p>
                          {formData.billingInfo.stripePaymentMethodId && (
                            <p>✓ 支払い方法ID: {formData.billingInfo.stripePaymentMethodId}</p>
                          )}
                          {formData.billingInfo.requiresStripeSetup && (
                            <p className="text-orange-600">⚠ 会員サイト側で初期決済設定が必要です</p>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-1 text-xs text-blue-800">
                          <p className="text-orange-600 font-medium">
                            ⚠ 会員サイト側でStripe初期決済設定が必要です
                          </p>
                          <p className="text-xs text-muted-foreground">
                            ログイン後、支払い設定ページでStripe決済を設定できます
                          </p>
                          <label className="flex items-center gap-2 mt-2">
                            <input
                              type="checkbox"
                              checked={formData.billingInfo.requiresStripeSetup || false}
                              onChange={(e) => setFormData({
                                ...formData,
                                billingInfo: { 
                                  ...formData.billingInfo!, 
                                  requiresStripeSetup: e.target.checked
                                }
                              })}
                              className="rounded border-border"
                            />
                            <span className="text-xs">初期設定が必要であることをマーク</span>
                          </label>
                        </div>
                      )}
                    </div>
                  )}
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

          {/* AI初期設定（会員サイト向け） */}
          <Card>
            <CardHeader>
              <CardTitle>AI初期設定</CardTitle>
              <CardDescription>
                会員サイトでのAI機能のデフォルト設定を行います
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">デフォルトトーン</label>
                  <select
                    value={formData.aiInitialSettings?.defaultTone || 'professional'}
                    onChange={(e) => setFormData({
                      ...formData,
                      aiInitialSettings: {
                        ...formData.aiInitialSettings!,
                        defaultTone: e.target.value
                      }
                    })}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="professional">プロフェッショナル</option>
                    <option value="casual">カジュアル</option>
                    <option value="friendly">フレンドリー</option>
                    <option value="formal">フォーマル</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">デフォルト言語</label>
                  <select
                    value={formData.aiInitialSettings?.defaultLanguage || 'ja'}
                    onChange={(e) => setFormData({
                      ...formData,
                      aiInitialSettings: {
                        ...formData.aiInitialSettings!,
                        defaultLanguage: e.target.value as 'ja' | 'en'
                      }
                    })}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="ja">日本語</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">推奨コンテンツ長</label>
                  <select
                    value={formData.aiInitialSettings?.contentPreferences?.preferredLength || 'medium'}
                    onChange={(e) => setFormData({
                      ...formData,
                      aiInitialSettings: {
                        ...formData.aiInitialSettings!,
                        contentPreferences: {
                          ...formData.aiInitialSettings?.contentPreferences,
                          preferredLength: e.target.value as 'short' | 'medium' | 'long'
                        }
                      }
                    })}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="short">短め</option>
                    <option value="medium">中程度</option>
                    <option value="long">長め</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">ハッシュタグ戦略</label>
                  <select
                    value={formData.aiInitialSettings?.contentPreferences?.hashtagStrategy || 'moderate'}
                    onChange={(e) => setFormData({
                      ...formData,
                      aiInitialSettings: {
                        ...formData.aiInitialSettings!,
                        contentPreferences: {
                          ...formData.aiInitialSettings?.contentPreferences,
                          hashtagStrategy: e.target.value as 'minimal' | 'moderate' | 'aggressive'
                        }
                      }
                    })}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="minimal">最小限</option>
                    <option value="moderate">適度</option>
                    <option value="aggressive">積極的</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">絵文字使用頻度</label>
                  <select
                    value={formData.aiInitialSettings?.contentPreferences?.emojiUsage || 'moderate'}
                    onChange={(e) => setFormData({
                      ...formData,
                      aiInitialSettings: {
                        ...formData.aiInitialSettings!,
                        contentPreferences: {
                          ...formData.aiInitialSettings?.contentPreferences,
                          emojiUsage: e.target.value as 'none' | 'minimal' | 'moderate' | 'frequent'
                        }
                      }
                    })}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="none">なし</option>
                    <option value="minimal">最小限</option>
                    <option value="moderate">適度</option>
                    <option value="frequent">頻繁</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">有効化された機能</label>
                <div className="space-y-2">
                  {['auto-hashtag', 'schedule-optimization', 'content-suggestion', 'analytics-insight'].map((feature) => (
                    <label key={feature} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.aiInitialSettings?.enabledFeatures?.includes(feature) || false}
                        onChange={(e) => {
                          const currentFeatures = formData.aiInitialSettings?.enabledFeatures || []
                          const newFeatures = e.target.checked
                            ? [...currentFeatures, feature]
                            : currentFeatures.filter(f => f !== feature)
                          setFormData({
                            ...formData,
                            aiInitialSettings: {
                              ...formData.aiInitialSettings!,
                              enabledFeatures: newFeatures
                            }
                          })
                        }}
                        className="rounded border-border"
                      />
                      <span className="text-sm">
                        {feature === 'auto-hashtag' && '自動ハッシュタグ生成'}
                        {feature === 'schedule-optimization' && '投稿スケジュール最適化'}
                        {feature === 'content-suggestion' && 'コンテンツ提案'}
                        {feature === 'analytics-insight' && '分析インサイト'}
                      </span>
                    </label>
                  ))}
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
