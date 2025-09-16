import OpenAI from 'openai'

// OpenAI クライアントの初期化（動的APIキー対応）
const getOpenAIClient = (apiKey?: string) => {
  const key = apiKey || process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY
  
  if (!key) {
    throw new Error('OpenAI APIキーが設定されていません')
  }
  
  return new OpenAI({
    apiKey: key,
    dangerouslyAllowBrowser: true // クライアントサイドでの使用を許可
  })
}

// AI設定
const AI_CONFIG = {
  model: process.env.AI_MODEL_NAME || 'gpt-4o-mini', // コスト効率の良いモデル
  maxTokens: parseInt(process.env.AI_MAX_TOKENS || '2000'),
  temperature: parseFloat(process.env.AI_TEMPERATURE || '0.7')
}

// AIメッセージの型定義
export interface AIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface AIResponse {
  message: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  model: string
}

// AI チャット機能
export async function sendChatMessage(
  messages: AIMessage[],
  options?: {
    model?: string
    maxTokens?: number
    temperature?: number
    apiKey?: string
  }
): Promise<AIResponse> {
  try {
    const openai = getOpenAIClient(options?.apiKey)
    const response = await openai.chat.completions.create({
      model: options?.model || AI_CONFIG.model,
      messages: messages,
      max_tokens: options?.maxTokens || AI_CONFIG.maxTokens,
      temperature: options?.temperature || AI_CONFIG.temperature,
    })

    const choice = response.choices[0]
    if (!choice?.message?.content) {
      throw new Error('AIからの応答が空です')
    }

    return {
      message: choice.message.content,
      usage: response.usage ? {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens
      } : undefined,
      model: response.model
    }
  } catch (error) {
    console.error('AI API Error:', error)
    if (error instanceof Error) {
      throw new Error(`AI API エラー: ${error.message}`)
    }
    throw new Error('AI API でエラーが発生しました')
  }
}

// 管理画面用のAIアシスタント機能
export class AdminAIAssistant {
  private systemPrompt: string

  constructor() {
    this.systemPrompt = `あなたは Signal Admin Panel の専門AIアシスタントです。

主な役割:
1. 管理画面の操作支援
2. データ分析の支援  
3. プロンプト作成の支援
4. KPI・メトリクス分析
5. 通知管理の支援
6. システム運用のアドバイス

回答の特徴:
- 簡潔で実用的
- 具体的なアクションを提案
- 日本語で回答
- 管理者向けの専門的な内容

現在のシステム機能:
- プロンプト管理システム
- KPIダッシュボード
- 通知管理システム
- ユーザー管理
- データ可視化
- エラー監視`
  }

  // 一般的な質問への回答
  async askQuestion(question: string, apiKey?: string): Promise<AIResponse> {
    const messages: AIMessage[] = [
      { role: 'system', content: this.systemPrompt },
      { role: 'user', content: question }
    ]

    return sendChatMessage(messages, { apiKey })
  }

  // プロンプト作成支援
  async generatePrompt(
    purpose: string,
    context: string,
    requirements: string[],
    apiKey?: string
  ): Promise<AIResponse> {
    const prompt = `以下の条件でプロンプトテンプレートを作成してください:

目的: ${purpose}
コンテキスト: ${context}
要件: ${requirements.join(', ')}

以下の形式で回答してください:
1. プロンプトテンプレート（変数は {{variable_name}} 形式）
2. 変数の説明
3. 使用例`

    return this.askQuestion(prompt, apiKey)
  }

  // データ分析支援
  async analyzeKPIData(
    metrics: any[],
    question: string,
    apiKey?: string
  ): Promise<AIResponse> {
    const dataContext = `KPIデータ:
${JSON.stringify(metrics, null, 2)}

質問: ${question}

このデータを分析して、具体的なインサイトとアクションアイテムを提案してください。`

    return this.askQuestion(dataContext, apiKey)
  }

  // 通知文作成支援
  async generateNotification(
    type: string,
    target: string,
    purpose: string,
    apiKey?: string
  ): Promise<AIResponse> {
    const prompt = `以下の条件で通知文を作成してください:

通知タイプ: ${type}
対象ユーザー: ${target}  
目的: ${purpose}

以下を含めて回答してください:
1. タイトル（簡潔で分かりやすい）
2. 本文（適切な敬語で丁寧に）
3. アクションボタンのテキスト（必要に応じて）`

    return this.askQuestion(prompt, apiKey)
  }

  // システム運用支援
  async getOperationAdvice(
    situation: string,
    currentMetrics?: any,
    apiKey?: string
  ): Promise<AIResponse> {
    let prompt = `システム運用の相談:
状況: ${situation}`

    if (currentMetrics) {
      prompt += `
現在のメトリクス: ${JSON.stringify(currentMetrics, null, 2)}`
    }

    prompt += `

具体的な改善案とアクションプランを提案してください。`

    return this.askQuestion(prompt, apiKey)
  }
}

// AIアシスタントのインスタンス
export const adminAI = new AdminAIAssistant()

// AI機能の可用性チェック
export function isAIAvailable(): boolean {
  return !!(process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY || (typeof window !== 'undefined' && (window as any).OPENAI_API_KEY))
}

// AI使用量の推定
export function estimateTokenUsage(text: string): number {
  // 簡易的なトークン数推定（英語基準で約4文字=1トークン、日本語は約2文字=1トークン）
  const japaneseChars = (text.match(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g) || []).length
  const otherChars = text.length - japaneseChars
  
  return Math.ceil(japaneseChars / 2 + otherChars / 4)
}
