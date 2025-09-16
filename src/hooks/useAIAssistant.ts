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

      // AI応答を生成
      const aiResponse = await generateAIResponse(content, {
        chatHistory: chat.messages,
        adminId: chat.adminId
      })

      // AI応答メッセージを追加
      const assistantMessage: Omit<AIMessage, 'id' | 'timestamp'> = {
        role: 'assistant',
        content: aiResponse,
        metadata: {
          dataQuery: content.toLowerCase().includes('データ') || content.toLowerCase().includes('分析'),
          chartGenerated: false,
          actionTaken: 'response_generated'
        }
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
