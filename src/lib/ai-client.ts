// クライアントサイド用のAI API呼び出し
import { AIMessage, AIResponse } from '@/types'

const API_BASE_URL = '/api/ai'

// クライアントサイドからサーバーサイドAPIを呼び出し
export async function sendChatMessage(
  messages: AIMessage[],
  options?: {
    model?: string
    maxTokens?: number
    temperature?: number
  }
): Promise<AIResponse> {
  try {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        ...options
      })
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('AI API Error:', error)
    throw new Error(`AI機能でエラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`)
  }
}

// AI機能の可用性チェック（サーバーサイドで管理）
export function isAIAvailable(): boolean {
  // サーバーサイドで管理されるため、常にtrueを返す
  // 実際の可用性はサーバーサイドでチェックされる
  return true
}

// AI使用量の推定
export function estimateTokenUsage(text: string): number {
  // 簡易的なトークン数推定（英語基準で約4文字=1トークン、日本語は約2文字=1トークン）
  const japaneseChars = (text.match(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g) || []).length
  const englishChars = text.length - japaneseChars
  return Math.ceil(englishChars / 4 + japaneseChars / 2)
}
