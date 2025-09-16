'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { adminAI, isAIAvailable, sendChatMessage, AIMessage } from '@/lib/ai-service'
import { Bot, User, Loader2, AlertTriangle, CheckCircle, Settings } from 'lucide-react'

export default function AITestPage() {
  const [apiKey, setApiKey] = useState('')
  const [question, setQuestion] = useState('')
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [aiAvailable, setAiAvailable] = useState(isAIAvailable())

  const testAI = async () => {
    if (!question.trim()) {
      setError('質問を入力してください')
      return
    }

    setLoading(true)
    setError('')
    setResponse('')

    try {
      // 環境変数を一時的に設定（テスト用）
      if (apiKey) {
        (window as any).OPENAI_API_KEY = apiKey
      }

      const result = await adminAI.askQuestion(question)
      setResponse(result.message)
      
    } catch (err) {
      console.error('AI Test Error:', err)
      setError(err instanceof Error ? err.message : 'AI機能でエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const testQuestions = [
    "Signal Admin Panelの主な機能について教えてください",
    "プロンプト管理システムの使い方を説明してください",
    "KPIダッシュボードでどんな分析ができますか？",
    "効果的な通知文の作成方法を教えてください",
    "システムのパフォーマンス向上のアドバイスをください"
  ]

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Bot className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">AI機能テスト</h1>
          <p className="text-gray-600">AIアシスタント機能の動作確認とテスト</p>
        </div>
      </div>

      {/* API設定 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            API設定
          </CardTitle>
          <CardDescription>
            OpenAI APIキーを設定してAI機能をテストします
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">OpenAI API Key</Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="sk-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <p className="text-sm text-gray-500">
              APIキーは一時的にブラウザメモリに保存されます。本番環境では環境変数で設定してください。
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {aiAvailable ? (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">AI機能が利用可能です</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-orange-600">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm">APIキーを設定してください</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* テスト質問 */}
      <Card>
        <CardHeader>
          <CardTitle>テスト質問</CardTitle>
          <CardDescription>
            以下のサンプル質問をクリックして試してみてください
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            {testQuestions.map((q, index) => (
              <Button
                key={index}
                variant="outline"
                className="text-left justify-start h-auto p-3"
                onClick={() => setQuestion(q)}
              >
                {q}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* チャットテスト */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            AI チャットテスト
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="question">質問</Label>
            <Textarea
              id="question"
              placeholder="AIに質問してみてください..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={3}
            />
          </div>

          <Button 
            onClick={testAI} 
            disabled={loading || !question.trim()}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                AI応答生成中...
              </>
            ) : (
              <>
                <Bot className="mr-2 h-4 w-4" />
                AIに質問する
              </>
            )}
          </Button>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">エラー</span>
              </div>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          )}

          {response && (
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-blue-700 text-lg">
                  <Bot className="h-5 w-5" />
                  AI応答
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-wrap text-blue-900">
                  {response}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
