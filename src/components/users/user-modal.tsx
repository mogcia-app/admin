'use client'

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Save, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { User, SNSAISettings, BusinessInfo, BillingInfo, Company, AIInitialSettings, ProductOrService } from '@/types'
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
  '小売',
  'その他'
]

export function UserModal({ isOpen, onClose, user, onSave, preselectedCompanyId }: UserModalProps) {
  const { companies } = useCompanies()
  const [formData, setFormData] = useState<Partial<User>>({
    name: '',
    email: '',
    password: '', // 新規作成時のパスワード
    usageType: 'solo',
    contractType: 'annual',
    contractSNS: [],
    snsCount: 1, // デフォルトは1SNS
    snsAISettings: {},
    companyId: undefined, // 企業ID（オプション）
    businessInfo: {
      industry: '',
      companySize: 'individual',
      businessType: 'b2c',
      description: '',
      targetMarket: [],
      catchphrase: '',
      initialFollowers: 0,
      productsOrServices: [],
      snsMainGoals: [],
      brandMission: '',
      targetCustomer: '',
      uniqueValue: '',
      brandVoice: '',
      kpiTargets: [],
      challenges: []
    },
    goals: [],
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

  const [newFocusMetric, setNewFocusMetric] = useState('')
  const [newTargetMarket, setNewTargetMarket] = useState('')
  // 目標は記述式（改行区切り）で管理
  const [goalsText, setGoalsText] = useState('')
  const [editingProductIndex, setEditingProductIndex] = useState<number | null>(null)
  const [editingProduct, setEditingProduct] = useState<Partial<ProductOrService>>({ name: '', details: '', price: '' })
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    sns: false,
    goals: false,
    business: false,
    billing: false,
    notes: false
  })

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const createBaseSNSSetting = () => ({
    enabled: true,
    whyThisSNS: '',
    snsGoal: '',
    contentDirection: '',
    postFrequency: '',
    targetAction: '',
    tone: '',
    focusMetrics: [] as string[],
    strategyNotes: ''
  })

  const createInstagramSNSSetting = () => ({
    ...createBaseSNSSetting(),
    manner: '',
    cautions: '',
    goals: '',
    motivation: '',
    additionalInfo: ''
  })

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
      // 目標をテキスト形式で初期化（改行区切り）
      setGoalsText((user.businessInfo?.goals || user.goals || []).join('\n'))
    } else {
      // 事前選択された企業IDを設定
      if (preselectedCompanyId) {
        setFormData(prev => ({ ...prev, companyId: preselectedCompanyId }))
      }
      // 新規作成時のデフォルト値
      const now = new Date()
      const endDate = new Date(now)
      endDate.setFullYear(endDate.getFullYear() + 1) // 年間契約のデフォルト

      setFormData({
        name: '',
        email: '',
        password: '', // 新規作成時のパスワード
        usageType: 'solo',
        contractType: 'annual',
        contractSNS: [],
        snsAISettings: {},
        businessInfo: {
          industry: '',
          companySize: 'individual',
          businessType: 'b2c',
          description: '',
          targetMarket: [],
          catchphrase: '',
          initialFollowers: 0,
          productsOrServices: [],
          snsMainGoals: [],
          brandMission: '',
          targetCustomer: '',
          uniqueValue: '',
          brandVoice: '',
          kpiTargets: [],
          challenges: [],
          goals: []
        },
        goals: [],
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
      // Instagram専用フィールド
      if (sns === 'instagram') {
        updatedSettings[sns as keyof SNSAISettings] = createInstagramSNSSetting()
      } else {
        updatedSettings[sns as keyof SNSAISettings] = createBaseSNSSetting()
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

  const handleAddTargetMarket = () => {
    if (!newTargetMarket.trim()) return
    setFormData({
      ...formData,
      businessInfo: {
        ...formData.businessInfo!,
        targetMarket: [...(formData.businessInfo?.targetMarket || []), newTargetMarket.trim()]
      }
    })
    setNewTargetMarket('')
  }

  const handleRemoveTargetMarket = (index: number) => {
    setFormData({
      ...formData,
      businessInfo: {
        ...formData.businessInfo!,
        targetMarket: formData.businessInfo!.targetMarket?.filter((_, i) => i !== index) || []
      }
    })
  }

  // 目標テキストを配列に変換して保存
  const handleGoalsChange = (text: string) => {
    setGoalsText(text)
    const goalsArray = text.split('\n').filter(line => line.trim() !== '')
    setFormData({
      ...formData,
      businessInfo: {
        ...formData.businessInfo!,
        goals: goalsArray
      }
    })
  }


  const handleAddProduct = () => {
    if (!editingProduct.name?.trim()) return
    const newProduct: ProductOrService = {
      id: Date.now().toString(),
      name: editingProduct.name.trim(),
      details: editingProduct.details || '',
      price: editingProduct.price
    }
    setFormData({
      ...formData,
      businessInfo: {
        ...formData.businessInfo!,
        productsOrServices: [...(formData.businessInfo?.productsOrServices || []), newProduct]
      }
    })
    setEditingProduct({ name: '', details: '', price: '' })
    setEditingProductIndex(null)
  }

  const handleEditProduct = (index: number) => {
    const product = formData.businessInfo?.productsOrServices?.[index]
    if (product) {
      setEditingProduct(product)
      setEditingProductIndex(index)
    }
  }

  const handleUpdateProduct = () => {
    if (editingProductIndex === null || !editingProduct.name?.trim()) return
    const updatedProducts = [...(formData.businessInfo?.productsOrServices || [])]
    updatedProducts[editingProductIndex] = {
      id: updatedProducts[editingProductIndex].id,
      name: editingProduct.name.trim(),
      details: editingProduct.details || '',
      price: editingProduct.price
    }
    setFormData({
      ...formData,
      businessInfo: {
        ...formData.businessInfo!,
        productsOrServices: updatedProducts
      }
    })
    setEditingProduct({ name: '', details: '', price: '' })
    setEditingProductIndex(null)
  }

  const handleRemoveProduct = (index: number) => {
    setFormData({
      ...formData,
      businessInfo: {
        ...formData.businessInfo!,
        productsOrServices: formData.businessInfo!.productsOrServices?.filter((_, i) => i !== index) || []
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

    // 目標テキストを配列に変換して保存
    const goalsArray = goalsText.split('\n').filter(line => line.trim() !== '')

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
      businessInfo: {
        ...formData.businessInfo!,
        goals: goalsArray
        // challengesは月次計画ページで設定するため、ここでは空配列のまま
      },
      updatedAt: new Date().toISOString()
    })
    onClose()
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-background z-10">
          <div>
            <h2 className="text-2xl font-bold">
              {user ? '利用者情報編集' : '新規利用者追加'}
            </h2>
            {!user && (
              <p className="text-sm text-muted-foreground mt-1">
                必須項目（名前、メール、パスワード、プラン階層）を入力して保存してください
              </p>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* 必須情報 - 最初に表示 */}
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg">必須情報</CardTitle>
              <CardDescription>新規利用者追加に必要な基本情報を入力してください</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    名前 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="利用者名を入力"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    メールアドレス <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="email@example.com"
                    required
                  />
                </div>
              </div>

              {/* パスワード設定（新規作成時のみ） */}
              {!user && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    初期パスワード <span className="text-red-500">*</span>
                    <span className="text-xs text-muted-foreground ml-2 font-normal">
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
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    このパスワードで利用者側アプリにログインできます。利用者は後で変更可能です。
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* プラン階層選択（会員サイト向け） */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    プラン階層 <span className="text-red-500">*</span>
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

          {/* オプション情報 - 折りたたみ可能にする */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">オプション情報</CardTitle>
              <CardDescription>必要に応じて設定してください</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 企業選択（B2B向け） */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  所属企業（オプション）
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
              </div>
            </CardContent>
          </Card>

          {/* 契約SNS選択 */}
          <Card>
            <CardHeader 
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => toggleSection('sns')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">契約SNS</CardTitle>
                  <CardDescription>利用するSNSプラットフォームを選択してください（最大3つまで）</CardDescription>
                </div>
                {expandedSections.sns ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </CardHeader>
            {expandedSections.sns && (
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
            )}
          </Card>

          {/* 目標・課題（Userレベル） */}
          <Card>
            <CardHeader 
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => toggleSection('goals')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">SNS活用の目的（Why SNS?）</CardTitle>
                  <CardDescription>
                    この目的は、あなたのビジネスがSNSで何を実現したいかを表す基本方針です。数ヶ月〜数年変わらない、ビジネスの根幹となる目的を設定してください。月ごとに変わる具体的な目標は、運用計画ページ（/instagram/plan）で設定できます。
                  </CardDescription>
                </div>
                {expandedSections.goals ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </CardHeader>
            {expandedSections.goals && (
            <CardContent className="space-y-4">
              {/* 基本方針・長期目標 */}
              <div>
                <label className="block text-sm font-medium mb-2">SNS活用の目的</label>
                <p className="text-xs text-muted-foreground mb-2">
                  複数の目的がある場合は、1行に1つずつ入力してください（改行区切り）
                  <br />
                  <span className="text-amber-600">※ 数ヶ月〜数年変わらない、ビジネスの根幹となる目的を設定してください</span>
                </p>
                <textarea
                  value={goalsText}
                  onChange={(e) => handleGoalsChange(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  rows={5}
                  placeholder="例: ブランド認知度の向上
例: 顧客との長期的な関係構築
例: 業界での専門性・信頼性の確立
例: 地域No.1の認知度獲得

※ 月ごとに変わる具体的な目標（例: 「今月は新商品の認知度向上」）は運用計画ページで設定してください"
                />
              </div>

              {(formData.contractSNS?.includes('instagram') || !!formData.snsAISettings?.instagram) && (
                <div className="border border-amber-200 bg-amber-50/50 rounded-md p-4">
                  <label className="block text-sm font-medium mb-2">Instagram 注意事項・NGワード</label>
                  <p className="text-xs text-muted-foreground mb-2">
                    AI生成時に最優先で参照されるため、禁止事項や避けるべき表現を具体的に記載してください。
                  </p>
                  <textarea
                    value={formData.snsAISettings?.instagram?.cautions || ''}
                    onChange={(e) => handleSNSSettingChange(
                      'instagram',
                      'cautions',
                      e.target.value
                    )}
                    onFocus={() => {
                      if (!formData.snsAISettings?.instagram) {
                        setFormData({
                          ...formData,
                          snsAISettings: {
                            ...formData.snsAISettings,
                            instagram: createInstagramSNSSetting()
                          }
                        })
                      }
                    }}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    rows={4}
                    placeholder="例: 誇大表現NG / 医療効果の断定NG / 他社批判NG など"
                  />
                </div>
              )}
            </CardContent>
            )}
          </Card>

          {/* 事業情報 */}
          <Card>
            <CardHeader 
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => toggleSection('business')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">事業情報</CardTitle>
                  <CardDescription>
                    SNSを使って何を達成したいのか？事業の核となる情報を入力してください
                  </CardDescription>
                </div>
                {expandedSections.business ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </CardHeader>
            {expandedSections.business && (
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

              {/* ターゲット市場 */}
              <div>
                <label className="block text-sm font-medium mb-2">ターゲット市場</label>
                <p className="text-xs text-muted-foreground mb-2">
                  複数のターゲット市場を追加できます
                </p>
                {formData.businessInfo?.targetMarket && formData.businessInfo.targetMarket.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {formData.businessInfo.targetMarket.map((market, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                        <span className="flex-1">{market}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveTargetMarket(index)}
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
                    value={newTargetMarket}
                    onChange={(e) => setNewTargetMarket(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTargetMarket()}
                    className="flex-1 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="ターゲット市場を入力"
                  />
                  <Button onClick={handleAddTargetMarket} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* キャッチコピー */}
              <div>
                <label className="block text-sm font-medium mb-2">キャッチコピー</label>
                <input
                  type="text"
                  value={formData.businessInfo?.catchphrase || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    businessInfo: { ...formData.businessInfo!, catchphrase: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="キャッチコピーを入力"
                />
              </div>

              {/* 利用開始日時点のフォロワー数 */}
              <div>
                <label className="block text-sm font-medium mb-2">利用開始日時点のフォロワー数</label>
                <input
                  type="number"
                  value={formData.businessInfo?.initialFollowers || 0}
                  onChange={(e) => setFormData({
                    ...formData,
                    businessInfo: { ...formData.businessInfo!, initialFollowers: parseInt(e.target.value) || 0 }
                  })}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="0"
                  min="0"
                />
              </div>

              {/* 商品・サービス情報 */}
              <div className="border-2 border-primary/20 rounded-lg p-4 bg-primary/5">
                <label className="block text-sm font-medium mb-2">
                  商品・サービス情報
                  <span className="text-xs text-muted-foreground ml-2">
                    （会員サイト側でユーザーが編集可能）
                  </span>
                </label>
                {formData.businessInfo?.productsOrServices && formData.businessInfo.productsOrServices.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {formData.businessInfo.productsOrServices.map((product, index) => (
                      <div key={product.id} className="flex items-start gap-2 p-3 bg-background rounded border">
                        <div className="flex-1">
                          <div className="font-medium">{product.name}</div>
                          {product.details && (
                            <div className="text-sm text-muted-foreground mt-1">{product.details}</div>
                          )}
                          {product.price && (
                            <div className="text-sm font-semibold mt-1">¥{product.price}</div>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditProduct(index)}
                          >
                            編集
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveProduct(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {editingProductIndex === null ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editingProduct.name || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="商品・サービス名"
                    />
                    <textarea
                      value={editingProduct.details || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, details: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                      rows={2}
                      placeholder="詳細"
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editingProduct.price || ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value })}
                        className="flex-1 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="価格（税込）例: 1,000円"
                      />
                      <Button onClick={handleAddProduct} size="sm">
                        <Plus className="h-4 w-4 mr-1" />
                        追加
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editingProduct.name || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="商品・サービス名"
                    />
                    <textarea
                      value={editingProduct.details || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, details: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                      rows={2}
                      placeholder="詳細"
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editingProduct.price || ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value })}
                        className="flex-1 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="価格（税込）例: 1,000円"
                      />
                      <Button onClick={handleUpdateProduct} size="sm">
                        更新
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditingProduct({ name: '', details: '', price: '' })
                          setEditingProductIndex(null)
                        }}
                        size="sm"
                      >
                        キャンセル
                      </Button>
                    </div>
                  </div>
                )}
              </div>

            </CardContent>
            )}
          </Card>

          {/* 契約・課金情報 */}
          <Card>
            <CardHeader 
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => toggleSection('billing')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">契約・課金情報</CardTitle>
                </div>
                {expandedSections.billing ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </CardHeader>
            {expandedSections.billing && (
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
            )}
          </Card>

          {/* メモ */}
          <Card>
            <CardHeader 
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => toggleSection('notes')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">メモ</CardTitle>
                </div>
                {expandedSections.notes ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </CardHeader>
            {expandedSections.notes && (
            <CardContent>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                rows={3}
                placeholder="管理者用メモ..."
              />
            </CardContent>
            )}
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
