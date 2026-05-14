'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

interface TermsPayload {
  userName: string
  userEmail: string
  flowType: string
  version: string
  privacyPolicyUrl: string
  toolTermsUrl: string
  memberSiteTermsUrl: string
  expiresAt: string
  alreadyUsed: boolean
}

export default function TermsAgreementPage({ params }: { params: Promise<{ token: string }> }) {
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [payload, setPayload] = useState<TermsPayload | null>(null)
  const [acceptedPrivacyPolicy, setAcceptedPrivacyPolicy] = useState(false)
  const [acceptedToolTerms, setAcceptedToolTerms] = useState(false)
  const [acceptedMemberSiteTerms, setAcceptedMemberSiteTerms] = useState(false)

  useEffect(() => {
    params.then((value) => setToken(value.token)).catch(() => setError('token の取得に失敗しました'))
  }, [params])

  useEffect(() => {
    if (!token) return

    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch(`/api/terms/${token}`)
        const data = await response.json().catch(() => ({}))
        if (!response.ok) {
          throw new Error(String(data.error || '規約情報の取得に失敗しました'))
        }
        setPayload(data as TermsPayload)
      } catch (err) {
        setError(err instanceof Error ? err.message : '規約情報の取得に失敗しました')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [token])

  const submit = async () => {
    if (!token) return
    try {
      setSaving(true)
      setError(null)
      const response = await fetch(`/api/terms/${token}/consent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          acceptedPrivacyPolicy,
          acceptedToolTerms,
          acceptedMemberSiteTerms,
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(String(data.error || '同意の保存に失敗しました'))
      }
      setSuccess('同意を受け付けました。管理者に連携されます。')
    } catch (err) {
      setError(err instanceof Error ? err.message : '同意の保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 text-slate-900 flex items-center justify-center">
        <div className="flex items-center gap-2 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          読み込み中...
        </div>
      </div>
    )
  }

  if (error && !payload) {
    return (
      <div className="min-h-screen bg-slate-100 text-slate-900 flex items-center justify-center p-6">
        <div className="w-full max-w-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold mb-2">規約URLを確認できません</h1>
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 py-10 px-4">
      <div className="mx-auto max-w-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5">
          <h1 className="text-2xl font-semibold">利用規約・ポリシー同意</h1>
          <p className="mt-2 text-sm text-slate-600">
            {payload?.userName || payload?.userEmail} 様向けの確認ページです。内容を確認のうえ、3つすべてに同意してください。
          </p>
        </div>

        <div className="space-y-5 px-6 py-6">
          <div className="grid gap-2 text-sm text-slate-700">
            <p>対象メール: {payload?.userEmail || '-'}</p>
            <p>規約バージョン: {payload?.version || '-'}</p>
            <p>有効期限: {payload?.expiresAt ? new Date(payload.expiresAt).toLocaleString('ja-JP') : '-'}</p>
          </div>

          {payload?.alreadyUsed && !success && (
            <div className="border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              このURLではすでに同意済みです。再手続きが必要な場合は管理者へ連絡してください。
            </div>
          )}

          <div className="space-y-4">
            <div className="border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-medium">プライバシーポリシー</h2>
                  <p className="text-sm text-slate-600 mt-1">個人情報の取り扱いに関する内容です。</p>
                </div>
                <a className="text-sm underline" href={payload?.privacyPolicyUrl || '#'} target="_blank" rel="noreferrer">
                  本文を開く
                </a>
              </div>
              <label className="mt-3 flex items-start gap-2 text-sm">
                <input type="checkbox" checked={acceptedPrivacyPolicy} onChange={(event) => setAcceptedPrivacyPolicy(event.target.checked)} />
                <span>プライバシーポリシーを確認し、同意します。</span>
              </label>
            </div>

            <div className="border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-medium">ツール利用規約</h2>
                  <p className="text-sm text-slate-600 mt-1">ツール利用時の条件と禁止事項を含みます。</p>
                </div>
                <a className="text-sm underline" href={payload?.toolTermsUrl || '#'} target="_blank" rel="noreferrer">
                  本文を開く
                </a>
              </div>
              <label className="mt-3 flex items-start gap-2 text-sm">
                <input type="checkbox" checked={acceptedToolTerms} onChange={(event) => setAcceptedToolTerms(event.target.checked)} />
                <span>ツール利用規約を確認し、同意します。</span>
              </label>
            </div>

            <div className="border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-medium">会員サイト利用規約</h2>
                  <p className="text-sm text-slate-600 mt-1">会員サイト利用時の条件に関する内容です。</p>
                </div>
                <a className="text-sm underline" href={payload?.memberSiteTermsUrl || '#'} target="_blank" rel="noreferrer">
                  本文を開く
                </a>
              </div>
              <label className="mt-3 flex items-start gap-2 text-sm">
                <input type="checkbox" checked={acceptedMemberSiteTerms} onChange={(event) => setAcceptedMemberSiteTerms(event.target.checked)} />
                <span>会員サイト利用規約を確認し、同意します。</span>
              </label>
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-green-700">{success}</p>}

          <button
            type="button"
            onClick={submit}
            disabled={
              saving ||
              Boolean(success) ||
              Boolean(payload?.alreadyUsed) ||
              !acceptedPrivacyPolicy ||
              !acceptedToolTerms ||
              !acceptedMemberSiteTerms
            }
            className="h-11 w-full bg-slate-900 text-white disabled:bg-slate-300"
          >
            {saving ? '送信中...' : success ? '送信済み' : '同意して送信'}
          </button>
        </div>
      </div>
    </div>
  )
}
