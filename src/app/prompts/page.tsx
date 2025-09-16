'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Search, Edit, Trash2, Play, Copy, Eye, Loader2, Database } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PromptModal } from '@/components/prompts/prompt-modal'
import { PromptTemplate } from '@/types'
import { usePrompts, usePromptStats } from '@/hooks/usePrompts'
import { seedPromptData } from '@/lib/prompts'


export default function PromptsPage() {
  const { prompts, loading, error, addPrompt, editPrompt, removePrompt } = usePrompts()
  const { stats } = usePromptStats()
  const [filteredPrompts, setFilteredPrompts] = useState<PromptTemplate[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedPrompt, setSelectedPrompt] = useState<PromptTemplate | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [seeding, setSeeding] = useState(false)

  // 検索とフィルタリング
  useEffect(() => {
    let filtered = prompts

    // カテゴリフィルター
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(prompt => prompt.category === selectedCategory)
    }

    // 検索クエリフィルター
    if (searchQuery) {
      filtered = filtered.filter(prompt =>
        prompt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prompt.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prompt.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    setFilteredPrompts(filtered)
  }, [prompts, searchQuery, selectedCategory])

  const getCategoryColor = (category: string) => {
    const colors = {
      system: 'bg-blue-100 text-blue-800',
      user: 'bg-green-100 text-green-800',
      assistant: 'bg-purple-100 text-purple-800',
      custom: 'bg-orange-100 text-orange-800'
    }
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getCategoryLabel = (category: string) => {
    const labels = {
      system: 'システム',
      user: 'ユーザー',
      assistant: 'アシスタント',
      custom: 'カスタム'
    }
    return labels[category as keyof typeof labels] || category
  }

  const handleCreatePrompt = async (promptData: Partial<PromptTemplate>) => {
    try {
      await addPrompt({
        name: promptData.name || '',
        description: promptData.description || '',
        category: promptData.category || 'custom',
        prompt: promptData.prompt || '',
        variables: promptData.variables || [],
        isActive: promptData.isActive ?? true,
        createdBy: 'admin_001', // 実際は認証されたユーザーのID
        tags: promptData.tags || []
      })
      alert('プロンプトを作成しました！')
    } catch (err) {
      alert('プロンプトの作成に失敗しました: ' + (err instanceof Error ? err.message : '不明なエラー'))
    }
  }

  const handleEditPrompt = async (promptData: Partial<PromptTemplate>) => {
    if (!selectedPrompt) return
    
    try {
      await editPrompt(selectedPrompt.id, promptData)
      setSelectedPrompt(null)
      alert('プロンプトを更新しました！')
    } catch (err) {
      alert('プロンプトの更新に失敗しました: ' + (err instanceof Error ? err.message : '不明なエラー'))
    }
  }

  const handleDeletePrompt = async (promptId: string) => {
    if (confirm('このプロンプトを削除しますか？')) {
      try {
        await removePrompt(promptId)
        alert('プロンプトを削除しました')
      } catch (err) {
        alert('プロンプトの削除に失敗しました: ' + (err instanceof Error ? err.message : '不明なエラー'))
      }
    }
  }

  const handleSeedData = async () => {
    try {
      setSeeding(true)
      await seedPromptData()
      alert('サンプルプロンプトデータを作成しました！')
    } catch (err) {
      alert('データの作成中にエラーが発生しました: ' + (err instanceof Error ? err.message : '不明なエラー'))
    } finally {
      setSeeding(false)
    }
  }

  const handleCopyPrompt = (prompt: PromptTemplate) => {
    navigator.clipboard.writeText(prompt.prompt)
    alert('プロンプトをクリップボードにコピーしました')
  }

  const openEditModal = (prompt: PromptTemplate) => {
    setSelectedPrompt(prompt)
    setShowEditModal(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">プロンプトデータを読み込み中...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">プロンプト管理</h1>
          <p className="text-muted-foreground">
            AIプロンプトの作成、編集、管理を行います
            {error && <span className="text-destructive ml-2">({error})</span>}
          </p>
        </div>
        <div className="flex gap-2">
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
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            新規作成
          </Button>
        </div>
      </div>

      {/* 検索・フィルター */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="プロンプトを検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 w-full bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">すべてのカテゴリ</option>
          <option value="system">システム</option>
          <option value="user">ユーザー</option>
          <option value="assistant">アシスタント</option>
          <option value="custom">カスタム</option>
        </select>
      </div>

      {/* 統計情報 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総プロンプト数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPrompts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">アクティブ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activePrompts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総使用回数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsage.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均使用回数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageUsage}</div>
          </CardContent>
        </Card>
      </div>

      {/* プロンプト一覧 */}
      <div className="grid gap-4">
        {filteredPrompts.map((prompt) => (
          <Card key={prompt.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">{prompt.name}</CardTitle>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(prompt.category)}`}>
                      {getCategoryLabel(prompt.category)}
                    </span>
                    {!prompt.isActive && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        無効
                      </span>
                    )}
                  </div>
                  <CardDescription>{prompt.description}</CardDescription>
                  <div className="flex flex-wrap gap-1">
                    {prompt.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleCopyPrompt(prompt)}
                    title="プロンプトをコピー"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    title="プロンプトを実行"
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => openEditModal(prompt)}
                    title="編集"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleDeletePrompt(prompt.id)}
                    title="削除"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  使用回数: {prompt.usageCount.toLocaleString()}回 | 
                  作成日: {new Date(prompt.createdAt).toLocaleDateString('ja-JP')} | 
                  更新日: {new Date(prompt.updatedAt).toLocaleDateString('ja-JP')}
                </div>
                <div className="bg-muted p-3 rounded-md">
                  <p className="text-sm font-mono whitespace-pre-wrap line-clamp-3">
                    {prompt.prompt}
                  </p>
                </div>
                {prompt.variables.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">変数:</p>
                    <div className="flex flex-wrap gap-2">
                      {prompt.variables.map((variable) => (
                        <span
                          key={variable.name}
                          className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded border"
                        >
                          {variable.name} ({variable.type})
                          {variable.required && <span className="text-red-500">*</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPrompts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">該当するプロンプトが見つかりませんでした。</p>
        </div>
      )}

      {/* モーダル */}
      <PromptModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={handleCreatePrompt}
      />
      
      <PromptModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setSelectedPrompt(null)
        }}
        prompt={selectedPrompt}
        onSave={handleEditPrompt}
      />
    </div>
  )
}