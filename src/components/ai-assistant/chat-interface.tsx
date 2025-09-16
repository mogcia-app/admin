'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { AdminAIChat, AIMessage } from '@/types'
import { adminAI, isAIAvailable } from '@/lib/ai-service'
import { 
  Send, 
  Bot, 
  User, 
  Loader2, 
  Copy, 
  ThumbsUp, 
  ThumbsDown,
  RotateCcw,
  Sparkles,
  AlertTriangle
} from 'lucide-react'

interface ChatInterfaceProps {
  chat: AdminAIChat | null
  loading: boolean
  sendingMessage: boolean
  onSendMessage: (message: string) => void
  onClearChat?: () => void
}

export function ChatInterface({ 
  chat, 
  loading, 
  sendingMessage, 
  onSendMessage, 
  onClearChat 
}: ChatInterfaceProps) {
  const [message, setMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [chat?.messages])

  const handleSend = () => {
    if (message.trim() && !sendingMessage) {
      onSendMessage(message.trim())
      setMessage('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content)
    // Toast notification could be added here
  }

  const formatMessage = (content: string) => {
    // 簡単なマークダウン風フォーマット
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-sm">$1</code>')
      .replace(/\n/g, '<br>')
  }

  const getMessageIcon = (role: string) => {
    return role === 'user' ? (
      <User className="h-5 w-5 text-blue-600" />
    ) : (
      <Bot className="h-5 w-5 text-purple-600" />
    )
  }

  const getMessageBgColor = (role: string) => {
    return role === 'user' 
      ? 'bg-blue-50 border-blue-200' 
      : 'bg-purple-50 border-purple-200'
  }

  const quickPrompts = [
    '今月の売上状況を教えて',
    'ユーザーの利用傾向を分析して',
    'システムの稼働状況を確認',
    'KPIの達成状況はどう？',
    '新規ユーザーの獲得状況',
    'チャーンレートの推移'
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">チャットを読み込み中...</p>
        </div>
      </div>
    )
  }

  if (!chat) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Bot className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">AIアシスタント</h3>
          <p className="text-muted-foreground">チャットを選択して会話を開始してください</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* チャットヘッダー */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold">{chat.title}</h2>
            <p className="text-sm text-muted-foreground">Signal App AIアシスタント</p>
          </div>
        </div>
        
        {onClearChat && (
          <Button variant="ghost" size="sm" onClick={onClearChat}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* メッセージエリア */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chat.messages.length === 0 ? (
          <div className="text-center py-8">
            <Bot className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">会話を始めましょう</h3>
            <p className="text-muted-foreground mb-6">
              Signal Appの管理業務について何でもお聞きください
            </p>
            
            {/* クイックプロンプト */}
            <div className="grid gap-2 max-w-md mx-auto">
              <p className="text-sm font-medium text-muted-foreground mb-2">よく使われる質問：</p>
              {quickPrompts.slice(0, 3).map((prompt, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => setMessage(prompt)}
                  className="text-left justify-start"
                >
                  {prompt}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {chat.messages.map((msg) => (
              <div key={msg.id} className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-background border flex items-center justify-center">
                  {getMessageIcon(msg.role)}
                </div>
                
                <Card className={`flex-1 ${getMessageBgColor(msg.role)}`}>
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">
                            {msg.role === 'user' ? 'あなた' : 'AIアシスタント'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(msg.timestamp).toLocaleTimeString('ja-JP', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <div 
                          className="text-sm leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
                        />
                        
                        {/* メタデータ表示 */}
                        {msg.metadata && (
                          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                            {msg.metadata.dataQuery && (
                              <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                データ分析
                              </span>
                            )}
                            {msg.metadata.chartGenerated && (
                              <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                チャート生成
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1 ml-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyMessage(msg.content)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        
                        {msg.role === 'assistant' && (
                          <>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <ThumbsUp className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <ThumbsDown className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
            
            {sendingMessage && (
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-background border flex items-center justify-center">
                  <Bot className="h-5 w-5 text-purple-600" />
                </div>
                <Card className="flex-1 bg-purple-50 border-purple-200">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">AIが回答を生成中...</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* 入力エリア */}
      <div className="border-t border-border p-4">
        <div className="flex gap-2">
          <div className="flex-1">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="メッセージを入力してください..."
              className="min-h-[60px] max-h-[120px] resize-none"
              disabled={sendingMessage}
            />
          </div>
          <Button
            onClick={handleSend}
            disabled={!message.trim() || sendingMessage}
            className="self-end"
          >
            {sendingMessage ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        {/* クイックプロンプト（メッセージがある場合） */}
        {chat.messages.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {quickPrompts.slice(0, 3).map((prompt, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => setMessage(prompt)}
                className="text-xs"
              >
                {prompt}
              </Button>
            ))}
          </div>
        )}
        
        <p className="text-xs text-muted-foreground mt-2 text-center">
          AIアシスタントは管理業務をサポートします。データ分析、レポート生成、システム監視などお気軽にご相談ください。
        </p>
      </div>
    </div>
  )
}
