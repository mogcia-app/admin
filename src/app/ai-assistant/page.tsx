'use client'

import React, { useState } from 'react'
import { Bot, Database, Loader2, RefreshCw, MessageSquare, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChatSidebar } from '@/components/ai-assistant/chat-sidebar'
import { ChatInterface } from '@/components/ai-assistant/chat-interface'
import { AICapabilities } from '@/components/ai-assistant/ai-capabilities'
import { useAIChats, useAIChat, useAICapabilities } from '@/hooks/useAIAssistant'
import { seedAIData } from '@/lib/ai-assistant'

export default function AIAssistantPage() {
  const adminId = 'admin_001' // 実際は認証されたユーザーのID
  
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
  
  const [seeding, setSeeding] = useState(false)
  const [activeView, setActiveView] = useState<'chat' | 'capabilities'>('chat')

  const handleSeedData = async () => {
    try {
      setSeeding(true)
      await seedAIData()
      alert('サンプルAIデータを作成しました！')
      refreshChats()
    } catch (err) {
      alert('データの作成中にエラーが発生しました: ' + (err instanceof Error ? err.message : '不明なエラー'))
    } finally {
      setSeeding(false)
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
    <div className="h-[calc(100vh-4rem)] flex">
      {/* サイドバー */}
      <ChatSidebar
        chats={chats}
        selectedChatId={selectedChatId}
        loading={chatsLoading}
        onSelectChat={handleSelectChat}
        onCreateChat={handleCreateChat}
        onUpdateTitle={updateTitle}
        onDeleteChat={removeChat}
      />

      {/* メインコンテンツ */}
      <div className="flex-1 flex flex-col">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
                <Bot className="h-5 w-5 text-white" />
              </div>
              AIアシスタント
            </h1>
            <p className="text-muted-foreground">
              Signal App管理業務の効率化をAIがサポートします
              {(chatsError || chatError || capabilitiesError) && (
                <span className="text-destructive ml-2">
                  ({chatsError || chatError || capabilitiesError})
                </span>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setActiveView(activeView === 'chat' ? 'capabilities' : 'chat')}
              variant="outline"
            >
              {activeView === 'chat' ? (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  機能紹介
                </>
              ) : (
                <>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  チャット
                </>
              )}
            </Button>
            <Button
              onClick={handleSeedData}
              disabled={seeding}
              variant="outline"
            >
              {seeding ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  作成中...
                </>
              ) : (
                <>
                  <Database className="h-4 w-4 mr-2" />
                  サンプルデータ作成
                </>
              )}
            </Button>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              更新
            </Button>
          </div>
        </div>

        {/* 統計情報 */}
        <div className="p-6 border-b border-border">
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
        <div className="flex-1 overflow-hidden">
          {activeView === 'chat' ? (
            <ChatInterface
              chat={chat}
              loading={chatLoading}
              sendingMessage={sendingMessage}
              onSendMessage={sendMessage}
              onClearChat={clearMessages}
            />
          ) : (
            <div className="h-full overflow-y-auto p-6">
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
