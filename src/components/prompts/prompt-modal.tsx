'use client'

import React, { useState, useEffect } from 'react'
import { X, Plus, Trash2, Save, TestTube } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PromptTemplate, PromptVariable } from '@/types'

interface PromptModalProps {
  isOpen: boolean
  onClose: () => void
  prompt?: PromptTemplate | null
  onSave: (prompt: Partial<PromptTemplate>) => void
}

export function PromptModal({ isOpen, onClose, prompt, onSave }: PromptModalProps) {
  const [formData, setFormData] = useState<Partial<PromptTemplate>>({
    name: '',
    description: '',
    category: 'custom',
    prompt: '',
    variables: [],
    isActive: true,
    tags: []
  })

  const [newVariable, setNewVariable] = useState<PromptVariable>({
    name: '',
    type: 'text',
    description: '',
    required: false,
    defaultValue: ''
  })

  const [newTag, setNewTag] = useState('')
  const [testVariables, setTestVariables] = useState<Record<string, any>>({})

  // プロンプト編集時の初期化
  useEffect(() => {
    if (prompt) {
      setFormData({
        ...prompt,
        tags: [...prompt.tags]
      })
      // テスト変数の初期化
      const testVars: Record<string, any> = {}
      prompt.variables.forEach(variable => {
        testVars[variable.name] = variable.defaultValue || ''
      })
      setTestVariables(testVars)
    } else {
      setFormData({
        name: '',
        description: '',
        category: 'custom',
        prompt: '',
        variables: [],
        isActive: true,
        tags: []
      })
      setTestVariables({})
    }
  }, [prompt])

  if (!isOpen) return null

  const handleAddVariable = () => {
    if (!newVariable.name.trim()) return

    const updatedVariables = [...(formData.variables || []), { ...newVariable }]
    setFormData({ ...formData, variables: updatedVariables })
    
    // テスト変数に追加
    setTestVariables({
      ...testVariables,
      [newVariable.name]: newVariable.defaultValue || ''
    })

    // リセット
    setNewVariable({
      name: '',
      type: 'text',
      description: '',
      required: false,
      defaultValue: ''
    })
  }

  const handleRemoveVariable = (index: number) => {
    const variable = formData.variables?.[index]
    if (variable) {
      const updatedVariables = formData.variables?.filter((_, i) => i !== index) || []
      setFormData({ ...formData, variables: updatedVariables })
      
      // テスト変数からも削除
      const updatedTestVariables = { ...testVariables }
      delete updatedTestVariables[variable.name]
      setTestVariables(updatedTestVariables)
    }
  }

  const handleAddTag = () => {
    if (!newTag.trim() || formData.tags?.includes(newTag.trim())) return

    setFormData({
      ...formData,
      tags: [...(formData.tags || []), newTag.trim()]
    })
    setNewTag('')
  }

  const handleRemoveTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter(t => t !== tag) || []
    })
  }

  const handleTestPrompt = () => {
    let testPrompt = formData.prompt || ''
    
    // 変数を置換
    Object.entries(testVariables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g')
      testPrompt = testPrompt.replace(regex, String(value))
    })

    alert(`テスト結果:\n\n${testPrompt}`)
  }

  const handleSave = () => {
    if (!formData.name?.trim() || !formData.prompt?.trim()) {
      alert('名前とプロンプトは必須項目です。')
      return
    }

    onSave({
      ...formData,
      updatedAt: new Date().toISOString()
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold">
            {prompt ? 'プロンプト編集' : '新規プロンプト作成'}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* 基本情報 */}
          <Card>
            <CardHeader>
              <CardTitle>基本情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">名前 *</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="プロンプト名を入力"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">説明</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  rows={3}
                  placeholder="プロンプトの説明を入力"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">カテゴリ</label>
                  <select
                    value={formData.category || 'custom'}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="system">システム</option>
                    <option value="user">ユーザー</option>
                    <option value="assistant">アシスタント</option>
                    <option value="custom">カスタム</option>
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive || false}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded border-border"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium">
                    アクティブ
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* プロンプト内容 */}
          <Card>
            <CardHeader>
              <CardTitle>プロンプト内容</CardTitle>
              <CardDescription>
                変数は {'{'}{'{'} variable_name {'}'}{'}'}の形式で記述してください
              </CardDescription>
            </CardHeader>
            <CardContent>
              <textarea
                value={formData.prompt || ''}
                onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring font-mono"
                rows={8}
                placeholder="プロンプトを入力..."
              />
            </CardContent>
          </Card>

          {/* 変数設定 */}
          <Card>
            <CardHeader>
              <CardTitle>変数設定</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 既存の変数一覧 */}
              {formData.variables && formData.variables.length > 0 && (
                <div className="space-y-2">
                  {formData.variables.map((variable, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 bg-muted rounded-md">
                      <div className="flex-1">
                        <div className="font-medium">{variable.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {variable.description} ({variable.type})
                          {variable.required && <span className="text-red-500"> *必須</span>}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveVariable(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* 新しい変数追加 */}
              <div className="border border-border rounded-md p-4 space-y-3">
                <h4 className="font-medium">新しい変数を追加</h4>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={newVariable.name}
                    onChange={(e) => setNewVariable({ ...newVariable, name: e.target.value })}
                    className="px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="変数名"
                  />
                  <select
                    value={newVariable.type}
                    onChange={(e) => setNewVariable({ ...newVariable, type: e.target.value as any })}
                    className="px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="text">テキスト</option>
                    <option value="number">数値</option>
                    <option value="boolean">真偽値</option>
                    <option value="select">選択肢</option>
                  </select>
                </div>
                <input
                  type="text"
                  value={newVariable.description}
                  onChange={(e) => setNewVariable({ ...newVariable, description: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="説明"
                />
                <div className="flex items-center gap-4">
                  <input
                    type="text"
                    value={newVariable.defaultValue}
                    onChange={(e) => setNewVariable({ ...newVariable, defaultValue: e.target.value })}
                    className="flex-1 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="デフォルト値"
                  />
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={newVariable.required}
                      onChange={(e) => setNewVariable({ ...newVariable, required: e.target.checked })}
                      className="rounded border-border"
                    />
                    <span className="text-sm">必須</span>
                  </label>
                </div>
                <Button onClick={handleAddVariable} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  変数を追加
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* タグ設定 */}
          <Card>
            <CardHeader>
              <CardTitle>タグ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.tags && formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-primary text-primary-foreground text-sm rounded flex items-center gap-1"
                    >
                      #{tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:bg-primary-foreground hover:text-primary rounded"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                  className="flex-1 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="タグを入力"
                />
                <Button onClick={handleAddTag} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  追加
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* プロンプトテスト */}
          {formData.variables && formData.variables.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>プロンプトテスト</CardTitle>
                <CardDescription>
                  変数に値を入力してプロンプトをテストできます
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.variables.map((variable) => (
                  <div key={variable.name}>
                    <label className="block text-sm font-medium mb-2">
                      {variable.name} ({variable.description})
                      {variable.required && <span className="text-red-500"> *</span>}
                    </label>
                    {variable.type === 'select' ? (
                      <select
                        value={testVariables[variable.name] || ''}
                        onChange={(e) => setTestVariables({ ...testVariables, [variable.name]: e.target.value })}
                        className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        {variable.options?.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={variable.type === 'number' ? 'number' : 'text'}
                        value={testVariables[variable.name] || ''}
                        onChange={(e) => setTestVariables({ ...testVariables, [variable.name]: e.target.value })}
                        className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder={variable.defaultValue}
                      />
                    )}
                  </div>
                ))}
                <Button onClick={handleTestPrompt} variant="outline">
                  <TestTube className="h-4 w-4 mr-2" />
                  プロンプトをテスト
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* フッター */}
        <div className="flex items-center justify-end gap-3 p-6 border-t">
          <Button variant="outline" onClick={onClose}>
            キャンセル
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            保存
          </Button>
        </div>
      </div>
    </div>
  )
}
