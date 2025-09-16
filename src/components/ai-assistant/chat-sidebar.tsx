'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { AdminAIChat } from '@/types'
import { 
  Plus, 
  MessageSquare, 
  Edit3, 
  Trash2, 
  Search,
  Bot,
  Clock
} from 'lucide-react'

interface ChatSidebarProps {
  chats: AdminAIChat[]
  selectedChatId: string | null
  loading: boolean
  onSelectChat: (chatId: string) => void
  onCreateChat: (title: string) => void
  onUpdateTitle: (chatId: string, title: string) => void
  onDeleteChat: (chatId: string) => void
}

export function ChatSidebar({
  chats,
  selectedChatId,
  loading,
  onSelectChat,
  onCreateChat,
  onUpdateTitle,
  onDeleteChat
}: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [newChatTitle, setNewChatTitle] = useState('')
  const [showNewChatForm, setShowNewChatForm] = useState(false)

  const filteredChats = chats.filter(chat =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleCreateChat = () => {
    if (newChatTitle.trim()) {
      onCreateChat(newChatTitle.trim())
      setNewChatTitle('')
      setShowNewChatForm(false)
    }
  }

  const handleStartEdit = (chat: AdminAIChat) => {
    setEditingId(chat.id)
    setEditTitle(chat.title)
  }

  const handleSaveEdit = () => {
    if (editingId && editTitle.trim()) {
      onUpdateTitle(editingId, editTitle.trim())
      setEditingId(null)
      setEditTitle('')
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditTitle('')
  }

  const handleDeleteChat = (chatId: string, title: string) => {
    if (confirm(`「${title}」を削除しますか？この操作は取り消せません。`)) {
      onDeleteChat(chatId)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) {
      return '今日'
    } else if (diffDays === 2) {
      return '昨日'
    } else if (diffDays <= 7) {
      return `${diffDays - 1}日前`
    } else {
      return date.toLocaleDateString('ja-JP', {
        month: 'short',
        day: 'numeric'
      })
    }
  }

  const getLastMessage = (chat: AdminAIChat) => {
    if (chat.messages.length === 0) return '新しいチャット'
    const lastMessage = chat.messages[chat.messages.length - 1]
    const content = lastMessage.content.length > 50 
      ? lastMessage.content.substring(0, 50) + '...' 
      : lastMessage.content
    return content
  }

  return (
    <div className="w-80 border-r border-border bg-muted/30 flex flex-col h-full">
      {/* ヘッダー */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="font-semibold">AIアシスタント</h2>
            <p className="text-xs text-muted-foreground">管理業務サポート</p>
          </div>
        </div>
        
        {/* 新規チャット作成 */}
        {showNewChatForm ? (
          <div className="space-y-2">
            <Input
              value={newChatTitle}
              onChange={(e) => setNewChatTitle(e.target.value)}
              placeholder="チャットのタイトルを入力"
              onKeyDown={(e) => e.key === 'Enter' && handleCreateChat()}
              autoFocus
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleCreateChat} disabled={!newChatTitle.trim()}>
                作成
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowNewChatForm(false)}>
                キャンセル
              </Button>
            </div>
          </div>
        ) : (
          <Button
            onClick={() => setShowNewChatForm(true)}
            className="w-full"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            新しいチャット
          </Button>
        )}
      </div>

      {/* 検索 */}
      <div className="p-4 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="チャットを検索..."
            className="pl-10"
          />
        </div>
      </div>

      {/* チャット一覧 */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-3">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="p-4 text-center">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {searchQuery ? 'チャットが見つかりません' : 'まだチャットがありません'}
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {filteredChats.map((chat) => (
              <Card
                key={chat.id}
                className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                  selectedChatId === chat.id ? 'bg-primary/10 border-primary/20' : ''
                }`}
                onClick={() => !editingId && onSelectChat(chat.id)}
              >
                <CardContent className="p-3">
                  {editingId === chat.id ? (
                    <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit()
                          if (e.key === 'Escape') handleCancelEdit()
                        }}
                        autoFocus
                        className="text-sm"
                      />
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={handleSaveEdit}>
                          保存
                        </Button>
                        <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                          キャンセル
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate mb-1">
                            {chat.title}
                          </h4>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {getLastMessage(chat)}
                          </p>
                          <div className="flex items-center gap-1 mt-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {formatDate(chat.updatedAt)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              • {chat.messages.length}件
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleStartEdit(chat)
                            }}
                          >
                            <Edit3 className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteChat(chat.id, chat.title)
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* フッター */}
      <div className="p-4 border-t border-border">
        <p className="text-xs text-muted-foreground text-center">
          AIアシスタントがあなたの管理業務をサポートします
        </p>
      </div>
    </div>
  )
}
