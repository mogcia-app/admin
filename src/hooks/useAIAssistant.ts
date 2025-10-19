'use client'

import { useState, useEffect } from 'react'
import { 
  AdminAIChat, 
  AIMessage, 
  AICapability 
} from '@/types'
import { 
  getAIChats, 
  getAIChat,
  createAIChat, 
  addMessageToChat, 
  updateChatTitle,
  deleteAIChat,
  getAICapabilities,
  generateAIResponse
} from '@/lib/ai-assistant'
import { adminAI, isAIAvailable, AIMessage as AIServiceMessage } from '@/lib/ai-service'
import { generateComprehensiveTemplateResponse, ComprehensiveTemplateResponse } from '@/lib/comprehensive-templates'

export function useAIChats(adminId: string) {
  const [chats, setChats] = useState<AdminAIChat[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchChats = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getAIChats(adminId)
      setChats(data)
    } catch (err) {
      console.error('Error fetching AI chats:', err)
      setError(err instanceof Error ? err.message : 'AIチャットの読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (adminId) {
      fetchChats()
    }
  }, [adminId])

  const createNewChat = async (title: string) => {
    try {
      setError(null)
      const chatId = await createAIChat(title, adminId)
      
      // ローカル状態を更新
      const newChat: AdminAIChat = {
        id: chatId,
        title,
        adminId,
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      setChats([newChat, ...chats])
      
      return chatId
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'チャットの作成に失敗しました'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const updateTitle = async (chatId: string, title: string) => {
    try {
      setError(null)
      await updateChatTitle(chatId, title)
      
      // ローカル状態を更新
      setChats(chats.map(chat =>
        chat.id === chatId
          ? { ...chat, title, updatedAt: new Date().toISOString() }
          : chat
      ))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'タイトルの更新に失敗しました'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const removeChat = async (chatId: string) => {
    try {
      setError(null)
      await deleteAIChat(chatId)
      
      // ローカル状態を更新
      setChats(chats.filter(chat => chat.id !== chatId))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'チャットの削除に失敗しました'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  return {
    chats,
    loading,
    error,
    createNewChat,
    updateTitle,
    removeChat,
    refreshChats: fetchChats
  }
}

export function useAIChat(chatId: string | null) {
  const [chat, setChat] = useState<AdminAIChat | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sendingMessage, setSendingMessage] = useState(false)

  const fetchChat = async () => {
    if (!chatId) {
      setChat(null)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const data = await getAIChat(chatId)
      setChat(data)
    } catch (err) {
      console.error('Error fetching AI chat:', err)
      setError(err instanceof Error ? err.message : 'チャットの読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchChat()
  }, [chatId])

  const sendMessage = async (content: string) => {
    if (!chatId || !chat || sendingMessage) return

    try {
      setSendingMessage(true)
      setError(null)

      // ユーザーメッセージを追加
      const userMessage: Omit<AIMessage, 'id' | 'timestamp'> = {
        role: 'user',
        content
      }

      await addMessageToChat(chatId, userMessage)

      // ローカル状態を即座に更新
      const newUserMessage: AIMessage = {
        ...userMessage,
        id: `msg_${Date.now()}_user`,
        timestamp: new Date().toISOString()
      }

      setChat(prev => prev ? {
        ...prev,
        messages: [...prev.messages, newUserMessage],
        updatedAt: new Date().toISOString()
      } : null)

      // まず包括的テンプレート回答をチェック
      let templateResponse: ComprehensiveTemplateResponse | null = null
      try {
        templateResponse = await generateComprehensiveTemplateResponse(content)
      } catch (error) {
        console.error('Template response error:', error)
      }

      let aiResponseContent: string
      let aiMetadata: any = {
        dataQuery: content.toLowerCase().includes('データ') || content.toLowerCase().includes('分析'),
        chartGenerated: false,
        actionTaken: 'response_generated'
      }

      if (templateResponse) {
        // 包括的テンプレート回答を使用
        aiResponseContent = templateResponse.content
        aiMetadata = {
          ...aiMetadata,
          ...templateResponse.metadata,
          actionTaken: 'template_response',
          templateUsed: templateResponse.metadata?.templateUsed,
          page: templateResponse.metadata?.page,
          category: templateResponse.metadata?.category
        }
        console.log('Using comprehensive template response:', templateResponse.metadata?.templateUsed)
      } else if (isAIAvailable()) {
        try {
          // 実際のAI APIを使用して応答を生成
          const aiResponse = await adminAI.askQuestion(content)
          aiResponseContent = aiResponse.message
          aiMetadata.usage = aiResponse.usage
          aiMetadata.actionTaken = 'ai_response'
        } catch (aiError) {
          console.error('AI API Error:', aiError)
          aiResponseContent = `申し訳ございません。AI機能でエラーが発生しました。\n\n${aiError instanceof Error ? aiError.message : 'AI APIに接続できませんでした。'}\n\nAPIキーが正しく設定されているか確認してください。`
          aiMetadata.actionTaken = 'error_response'
        }
      } else {
        // フォールバック: AI機能が無効な場合
        aiResponseContent = '申し訳ございません。現在AI機能が利用できません。APIキーを設定してください。'
        aiMetadata.actionTaken = 'fallback_response'
      }

      // aiResponseContentが未定義の場合のフォールバック
      if (!aiResponseContent) {
        aiResponseContent = '申し訳ございません。応答を生成できませんでした。'
        aiMetadata.actionTaken = 'error_response'
      }

      // AI応答メッセージを追加
      const assistantMessage: Omit<AIMessage, 'id' | 'timestamp'> = {
        role: 'assistant',
        content: aiResponseContent,
        metadata: aiMetadata
      }

      await addMessageToChat(chatId, assistantMessage)

      // ローカル状態を更新
      const newAssistantMessage: AIMessage = {
        ...assistantMessage,
        id: `msg_${Date.now()}_assistant`,
        timestamp: new Date().toISOString()
      }

      setChat(prev => prev ? {
        ...prev,
        messages: [...prev.messages, newAssistantMessage],
        updatedAt: new Date().toISOString()
      } : null)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'メッセージの送信に失敗しました'
      setError(errorMessage)
      console.error('Error sending message:', err)
    } finally {
      setSendingMessage(false)
    }
  }

  const clearMessages = async () => {
    if (!chatId) return

    try {
      setError(null)
      // チャットのメッセージをクリア（実装は簡略化）
      setChat(prev => prev ? { ...prev, messages: [] } : null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'メッセージのクリアに失敗しました'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  return {
    chat,
    loading,
    error,
    sendingMessage,
    sendMessage,
    clearMessages,
    refreshChat: fetchChat
  }
}

export function useAICapabilities() {
  const [capabilities, setCapabilities] = useState<AICapability[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCapabilities = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getAICapabilities()
        setCapabilities(data)
      } catch (err) {
        console.error('Error fetching AI capabilities:', err)
        setError(err instanceof Error ? err.message : 'AI機能の読み込みに失敗しました')
      } finally {
        setLoading(false)
      }
    }

    fetchCapabilities()
  }, [])

  const getCapabilitiesByCategory = (category: string) => {
    return capabilities.filter(cap => cap.category === category)
  }

  const getRandomExamples = (count: number = 3) => {
    const allExamples = capabilities.flatMap(cap => cap.examples)
    const shuffled = allExamples.sort(() => 0.5 - Math.random())
    return shuffled.slice(0, count)
  }

  return {
    capabilities,
    loading,
    error,
    getCapabilitiesByCategory,
    getRandomExamples
  }
}
