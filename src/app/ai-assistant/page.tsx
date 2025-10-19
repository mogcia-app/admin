'use client'

import React, { useState } from 'react'
import { Bot, Loader2, RefreshCw, MessageSquare, Sparkles, Key, CheckCircle, XCircle, Database } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ChatSidebar } from '@/components/ai-assistant/chat-sidebar'
import { ChatInterface } from '@/components/ai-assistant/chat-interface'
import { AICapabilities } from '@/components/ai-assistant/ai-capabilities'
import { useAIChats, useAIChat, useAICapabilities } from '@/hooks/useAIAssistant'
import { sendChatMessage, isAIAvailable } from '@/lib/ai-client'
import { useAuth } from '@/contexts/auth-context'

export default function AIAssistantPage() {
  const { adminUser } = useAuth()
  const adminId = adminUser?.id || 'unknown'
  
  const { 
    chats, 
    loading: chatsLoading, 
    error: chatsError, 
    createNewChat, 
    updateTitle, 
    removeChat, 
    refreshChats 
  } = useAIChats(adminId)
  
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  
  const { 
    chat, 
    loading: chatLoading, 
    error: chatError, 
    sendingMessage, 
    sendMessage, 
    clearMessages 
  } = useAIChat(selectedChatId)
  
  const { 
    capabilities, 
    loading: capabilitiesLoading, 
    error: capabilitiesError 
  } = useAICapabilities()
  
  const [activeView, setActiveView] = useState<'chat' | 'capabilities'>('chat')
  const [aiAvailable, setAiAvailable] = useState(isAIAvailable())
  const [apiKey, setApiKey] = useState('')
  const [showApiKeyInput, setShowApiKeyInput] = useState(!aiAvailable)

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newApiKey = e.target.value
    setApiKey(newApiKey)
    
    // 動的にAPIキーを設定（サーバーサイドでは不要）
    if (newApiKey) {
      setAiAvailable(true)
      setShowApiKeyInput(false)
    } else {
      setAiAvailable(false)
    }
  }


  const handleRefresh = () => {
    refreshChats()
  }

  const handleCreateChat = async (title: string) => {
    try {
      const chatId = await createNewChat(title)
      setSelectedChatId(chatId)
      setActiveView('chat')
    } catch (err) {
      console.error('Error creating chat:', err)
    }
  }

  const handleSelectChat = (chatId: string) => {
    setSelectedChatId(chatId)
    setActiveView('chat')
  }

  const handleUseExample = (example: string) => {
    // 新しいチャットを作成するか、既存のチャットを使用
    if (!selectedChatId) {
      handleCreateChat('新しい質問').then(() => {
        // チャット作成後にメッセージを送信
        setTimeout(() => {
          sendMessage(example)
        }, 100)
      })
    } else {
      setActiveView('chat')
      sendMessage(example)
    }
  }

  const stats = {
    totalChats: chats.length,
    totalMessages: chats.reduce((sum, chat) => sum + chat.messages.length, 0),
    availableCapabilities: capabilities.length,
    activeCapabilities: capabilities.filter(c => c.isEnabled).length
  }

  return (
    <div className="h-screen flex bg-gray-50 dark:bg-gray-900">
      {/* サイドバー */}
      <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <ChatSidebar
          chats={chats}
          selectedChatId={selectedChatId}
          loading={chatsLoading}
          onSelectChat={handleSelectChat}
          onCreateChat={handleCreateChat}
          onUpdateTitle={updateTitle}
          onDeleteChat={removeChat}
        />
      </div>

      {/* メインコンテンツ */}
      <div className="flex-1 flex flex-col">
        {/* ヘッダー */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  AIアシスタント
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Signal App管理業務の効率化をAIがサポートします
                  {(chatsError || chatError || capabilitiesError) && (
                    <span className="text-red-500 ml-2">
                      ({chatsError || chatError || capabilitiesError})
                    </span>
                  )}
                </p>
              </div>
            </div>
          
            {/* AI機能ステータスとAPIキー設定 */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700">
                {aiAvailable ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                <span className={`text-sm font-medium ${aiAvailable ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                  {aiAvailable ? 'AI利用可能' : 'AI利用不可'}
                </span>
              </div>
              
              {showApiKeyInput && (
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-gray-500" />
                  <Input
                    type="password"
                    placeholder="OpenAI APIキーを入力"
                    value={apiKey}
                    onChange={handleApiKeyChange}
                    className="w-64"
                  />
                </div>
              )}
              
              {!showApiKeyInput && !aiAvailable && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowApiKeyInput(true)}
                  className="bg-white dark:bg-gray-700"
                >
                  <Key className="h-4 w-4 mr-2" />
                  APIキー設定
                </Button>
              )}
            </div>
          </div>
          
          {/* アクションボタン */}
          <div className="flex items-center gap-3 mt-4">
            <Button
              onClick={() => setActiveView(activeView === 'chat' ? 'capabilities' : 'chat')}
              variant={activeView === 'chat' ? 'default' : 'outline'}
              size="sm"
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {activeView === 'chat' ? (
                <>
                  <Database className="h-4 w-4 mr-2" />
                  機能一覧
                </>
              ) : (
                <>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  チャット
                </>
              )}
            </Button>
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              disabled={chatsLoading}
              className="bg-white dark:bg-gray-700"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${chatsLoading ? 'animate-spin' : ''}`} />
              更新
            </Button>
          </div>
        </div>

        {/* 統計情報 */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">総チャット数</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalChats}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">総メッセージ数</CardTitle>
                <Bot className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalMessages}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">利用可能機能</CardTitle>
                <Sparkles className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.availableCapabilities}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">アクティブ機能</CardTitle>
                <Sparkles className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeCapabilities}</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* メインコンテンツエリア */}
        <div className="flex-1 overflow-hidden bg-gray-50 dark:bg-gray-900">
          {activeView === 'chat' ? (
            <ChatInterface
              chat={chat}
              loading={chatLoading}
              sendingMessage={sendingMessage}
              onSendMessage={sendMessage}
              onClearChat={clearMessages}
            />
          ) : (
            <div className="h-full overflow-y-auto p-6 bg-white dark:bg-gray-800 m-4 rounded-lg shadow-sm">
              <AICapabilities
                capabilities={capabilities}
                loading={capabilitiesLoading}
                onUseExample={handleUseExample}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
