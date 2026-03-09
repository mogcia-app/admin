'use client'

import { useEffect, useState } from 'react'
import { getErrorMessage, parseJsonResponse } from '@/lib/http-response'

interface IntakeData {
  token: string
  status: string
  companyName: string
  contractStartDate: string
  contractEndDate?: string
  planTier: string
  email: string
  submittedData?: Record<string, unknown> | null
}

interface ProductRow {
  name: string
  details: string
  price: string
}

const INDUSTRY_OPTIONS = [
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
  'その他',
]

function calcEndDate(startDate: string): string {
  if (!startDate) return ''
  const date = new Date(startDate)
  if (Number.isNaN(date.getTime())) return ''
  date.setFullYear(date.getFullYear() + 1)
  return date.toISOString().slice(0, 10)
}

export default function IntakePage({ params }: { params: Promise<{ token: string }> }) {
  const fieldClassName =
    'mt-1 h-11 w-full border border-slate-300 px-3 bg-white focus:outline-none focus:ring-2 focus:ring-[#ff8a15]/25 focus:border-[#ff8a15]'
  const textAreaClassName =
    'mt-1 w-full border border-slate-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#ff8a15]/25 focus:border-[#ff8a15]'

  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showSubmittedPage, setShowSubmittedPage] = useState(false)
  const [invite, setInvite] = useState<IntakeData | null>(null)

  const [contractDate, setContractDate] = useState('')
  const [contractEndDate, setContractEndDate] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [snsPurpose, setSnsPurpose] = useState('')
  const [ngWords, setNgWords] = useState('')
  const [industry, setIndustry] = useState('')
  const [industryOther, setIndustryOther] = useState('')
  const [companySize, setCompanySize] = useState<'individual' | 'small' | 'medium' | 'large'>('small')
  const [businessType, setBusinessType] = useState<'b2c' | 'b2b' | 'both'>('b2c')
  const [businessDescription, setBusinessDescription] = useState('')
  const [targetMarket, setTargetMarket] = useState('')
  const [catchphrase, setCatchphrase] = useState('')
  const [initialFollowers, setInitialFollowers] = useState('0')
  const [products, setProducts] = useState<ProductRow[]>([{ name: '', details: '', price: '' }])

  useEffect(() => {
    params.then((resolved) => setToken(resolved.token))
  }, [params])

  useEffect(() => {
    if (!token) return

    const run = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch(`/api/intake/${token}`)
        const data = await parseJsonResponse<IntakeData & Record<string, unknown>>(response)
        if (!response.ok) {
          throw new Error(getErrorMessage(data, '申込情報の取得に失敗しました'))
        }

        setInvite(data)
        if (String(data.status || '') === 'submitted' || String(data.status || '') === 'confirmed') {
          setShowSubmittedPage(true)
        }
        const submitted = (data.submittedData || {}) as Record<string, unknown>
        setContractDate(String(submitted.contractDate || data.contractStartDate || '').slice(0, 10))
        setContractEndDate(calcEndDate(String(submitted.contractDate || data.contractStartDate || '').slice(0, 10)))
        setName(String(submitted.name || data.companyName || ''))
        setEmail(String(submitted.email || data.email || ''))
        setSnsPurpose(String(submitted.snsPurpose || ''))
        setNgWords(String(submitted.ngWords || ''))
        setIndustry(String(submitted.industry || ''))
        setIndustryOther(String(submitted.industryOther || ''))
        setCompanySize((String(submitted.companySize || 'small') as 'individual' | 'small' | 'medium' | 'large'))
        setBusinessType((String(submitted.businessType || 'b2c') as 'b2c' | 'b2b' | 'both'))
        setBusinessDescription(String(submitted.businessDescription || ''))
        setTargetMarket(String(submitted.targetMarket || ''))
        setCatchphrase(String(submitted.catchphrase || ''))
        setInitialFollowers(String(submitted.initialFollowers || 0))
        const loadedProducts = Array.isArray(submitted.products) ? (submitted.products as ProductRow[]) : []
        setProducts(loadedProducts.length > 0 ? loadedProducts : [{ name: '', details: '', price: '' }])
      } catch (err) {
        setError(err instanceof Error ? err.message : '申込情報の取得に失敗しました')
      } finally {
        setLoading(false)
      }
    }

    run()
  }, [token])

  useEffect(() => {
    setContractEndDate(calcEndDate(contractDate))
  }, [contractDate])

  const updateProduct = (index: number, key: keyof ProductRow, value: string) => {
    setProducts((prev) => prev.map((item, i) => (i === index ? { ...item, [key]: value } : item)))
  }

  const addProduct = () => {
    setProducts((prev) => [...prev, { name: '', details: '', price: '' }])
  }

  const removeProduct = (index: number) => {
    setProducts((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)))
  }

  const submit = async () => {
    if (!token) return
    if (!contractDate || !name.trim() || !email.trim()) {
      setError('契約日・名前・メールアドレスは必須です')
      return
    }

    try {
      setSubmitting(true)
      setError(null)
      setSuccess(null)

      const response = await fetch(`/api/intake/${token}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractDate,
          name: name.trim(),
          email: email.trim(),
          snsPurpose,
          ngWords,
          industry,
          industryOther,
          companySize,
          businessType,
          businessDescription,
          targetMarket,
          catchphrase,
          initialFollowers: Number(initialFollowers || 0),
          products,
        }),
      })

      const data = await parseJsonResponse(response)
      if (!response.ok) {
        throw new Error(getErrorMessage(data, '送信に失敗しました'))
      }

      setSuccess('送信が完了しました。管理者の確認をお待ちください。')
      setShowSubmittedPage(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : '送信に失敗しました')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">読み込み中...</div>
  }

  if (error && !invite) {
    return <div className="min-h-screen flex items-center justify-center text-red-600">{error}</div>
  }

  if (!invite) {
    return <div className="min-h-screen flex items-center justify-center">リンクが無効です</div>
  }

  if (showSubmittedPage) {
    return (
      <div className="min-h-screen bg-white px-4 py-10">
        <div className="max-w-xl mx-auto border border-[#ff8a15] bg-white p-8 text-center space-y-4">
          <p className="text-xs tracking-[0.18em] uppercase text-[#e56a10]">Signal Intake</p>
          <h1 className="text-3xl font-semibold text-slate-900">送信しました！</h1>
          <p className="text-sm text-slate-600">
            ヒアリングシートの送信を受け付けました。<br />
            ご記入いただきありがとうございました。
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="border border-[#ff8a15] bg-white">
          <div className="bg-[linear-gradient(90deg,#ff8a15_0%,#ff9d3c_100%)] px-6 py-3">
            <p className="text-[11px] tracking-[0.18em] uppercase text-white/90">Signal Intake Form</p>
          </div>
          <div className="p-6">
            <h1 className="text-[26px] font-semibold text-slate-900">ヒアリングシート入力</h1>
          <div className="mt-4 flex items-center gap-3 text-xs font-medium text-slate-500">
            <span className="text-slate-900">STEP 01</span>
            <span className="h-px w-10 bg-slate-300" />
            <span>STEP 02</span>
            <span className="h-px w-10 bg-slate-200" />
            <span>STEP 03</span>
          </div>
          </div>
        </div>

        {error && <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {success && <div className="border border-[#ff8a15] bg-white px-4 py-3 text-sm text-[#9a4b0f]">{success}</div>}

        <section className="border border-slate-200 bg-white p-6 space-y-4 shadow-[0_1px_0_0_rgba(0,0,0,0.03)]">
          <h2 className="inline-flex items-center px-3 py-1 text-sm font-semibold text-[#9a4b0f] bg-[#fff3e8] border border-[#ffd3ad]">1. 基本情報</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700">契約日（必須）</label>
              <input type="date" value={contractDate} onChange={(e) => setContractDate(e.target.value)} className={fieldClassName} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">終了日</label>
              <input type="date" value={contractEndDate} readOnly className={`${fieldClassName} bg-slate-50`} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">名前（必須）</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className={fieldClassName} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">メールアドレス（必須）</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={fieldClassName} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">契約SNS</label>
            <div className="mt-1 h-11 w-full border border-slate-300 px-3 flex items-center bg-slate-50">✓ Instagram</div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">SNS活用の目的</label>
            <textarea value={snsPurpose} onChange={(e) => setSnsPurpose(e.target.value)} rows={4} className={textAreaClassName} />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">NGワード設定</label>
            <textarea value={ngWords} onChange={(e) => setNgWords(e.target.value)} rows={3} className={textAreaClassName} />
          </div>
        </section>

        <section className="border border-slate-200 bg-white p-6 space-y-4 shadow-[0_1px_0_0_rgba(0,0,0,0.03)]">
          <h2 className="inline-flex items-center px-3 py-1 text-sm font-semibold text-[#9a4b0f] bg-[#fff3e8] border border-[#ffd3ad]">2. 事業情報</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700">業界</label>
              <select value={industry} onChange={(e) => setIndustry(e.target.value)} className={fieldClassName}>
                <option value="">選択してください</option>
                {INDUSTRY_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">会社規模</label>
              <select value={companySize} onChange={(e) => setCompanySize(e.target.value as 'individual' | 'small' | 'medium' | 'large')} className={fieldClassName}>
                <option value="individual">個人</option>
                <option value="small">小規模</option>
                <option value="medium">中規模</option>
                <option value="large">大規模</option>
              </select>
            </div>
            {industry === 'その他' && (
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-slate-700">業界（その他）</label>
                <input value={industryOther} onChange={(e) => setIndustryOther(e.target.value)} className={fieldClassName} />
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-slate-700">事業タイプ</label>
              <select value={businessType} onChange={(e) => setBusinessType(e.target.value as 'b2c' | 'b2b' | 'both')} className={fieldClassName}>
                <option value="b2c">B2C</option>
                <option value="b2b">B2B</option>
                <option value="both">両方</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">利用開始日時点のフォロワー数</label>
              <input type="number" min="0" value={initialFollowers} onChange={(e) => setInitialFollowers(e.target.value)} className={fieldClassName} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">事業内容</label>
            <textarea value={businessDescription} onChange={(e) => setBusinessDescription(e.target.value)} rows={4} className={textAreaClassName} />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">ターゲット市場</label>
            <textarea value={targetMarket} onChange={(e) => setTargetMarket(e.target.value)} rows={4} className={textAreaClassName} />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">キャッチコピー</label>
            <input value={catchphrase} onChange={(e) => setCatchphrase(e.target.value)} className={fieldClassName} />
          </div>
        </section>

        <section className="border border-slate-200 bg-white p-6 space-y-4 shadow-[0_1px_0_0_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between gap-3">
            <h2 className="inline-flex items-center px-3 py-1 text-sm font-semibold text-[#9a4b0f] bg-[#fff3e8] border border-[#ffd3ad]">3. 商品・サービス情報</h2>
            <button type="button" onClick={addProduct} className="text-sm text-[#e56a10] font-medium">+ 行追加</button>
          </div>
          <div className="space-y-3">
            {products.map((product, index) => (
              <div key={`product-${index}`} className="border border-slate-300 p-4 bg-slate-50/40">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-slate-700">商品・サービス名</label>
                    <input value={product.name} onChange={(e) => updateProduct(index, 'name', e.target.value)} className={fieldClassName} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">価格（税込）</label>
                    <input value={product.price} onChange={(e) => updateProduct(index, 'price', e.target.value)} className={fieldClassName} />
                  </div>
                </div>
                <div className="mt-3">
                  <label className="text-sm font-medium text-slate-700">詳細</label>
                  <textarea value={product.details} onChange={(e) => updateProduct(index, 'details', e.target.value)} rows={3} className={textAreaClassName} />
                </div>
                <div className="flex justify-end mt-2">
                  <button type="button" onClick={() => removeProduct(index)} className="text-xs text-red-600">この行を削除</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div>
          <div className="border border-[#ff8a15] bg-white p-4">
            <button
              type="button"
              onClick={submit}
              disabled={submitting}
              className="h-10 w-full bg-[linear-gradient(90deg,#e56a10_0%,#f08a2b_100%)] text-white font-medium disabled:opacity-50"
            >
              {submitting ? '送信中...' : '送信する'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
