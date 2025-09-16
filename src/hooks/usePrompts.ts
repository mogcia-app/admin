'use client'

import { useState, useEffect } from 'react'
import { PromptTemplate } from '@/types'
import { 
  getPrompts, 
  createPrompt, 
  updatePrompt, 
  deletePrompt, 
  subscribeToPrompts,
  incrementPromptUsage,
  getPromptsByCategory,
  getActivePrompts
} from '@/lib/prompts'

export function usePrompts() {
  const [prompts, setPrompts] = useState<PromptTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined

    const initializePrompts = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // 初回読み込み
        const fetchedPrompts = await getPrompts()
        setPrompts(fetchedPrompts)
        setLoading(false)
        
        // 定期的な更新（30秒間隔）
        intervalId = setInterval(async () => {
          try {
            const updatedPrompts = await getPrompts()
            setPrompts(updatedPrompts)
          } catch (err) {
            console.error('Error refreshing prompts:', err)
          }
        }, 30000)
        
      } catch (err) {
        console.error('Error initializing prompts:', err)
        setError(err instanceof Error ? err.message : 'プロンプトの読み込みに失敗しました')
        setLoading(false)
      }
    }

    initializePrompts()

    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [])

  const addPrompt = async (promptData: Omit<PromptTemplate, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setError(null)
      const id = await createPrompt(promptData)
      return id
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'プロンプトの作成に失敗しました'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const editPrompt = async (id: string, updates: Partial<PromptTemplate>) => {
    try {
      setError(null)
      await updatePrompt(id, updates)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'プロンプトの更新に失敗しました'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const removePrompt = async (id: string) => {
    try {
      setError(null)
      await deletePrompt(id)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'プロンプトの削除に失敗しました'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const usePrompt = async (id: string) => {
    try {
      await incrementPromptUsage(id)
    } catch (err) {
      console.error('Error incrementing prompt usage:', err)
    }
  }

  return {
    prompts,
    loading,
    error,
    addPrompt,
    editPrompt,
    removePrompt,
    usePrompt,
    refreshPrompts: async () => {
      setLoading(true)
      try {
        const fetchedPrompts = await getPrompts()
        setPrompts(fetchedPrompts)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'プロンプトの読み込みに失敗しました')
      } finally {
        setLoading(false)
      }
    }
  }
}

export function usePromptsByCategory(category?: string) {
  const [prompts, setPrompts] = useState<PromptTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPrompts = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const fetchedPrompts = category 
          ? await getPromptsByCategory(category)
          : await getActivePrompts()
        
        setPrompts(fetchedPrompts)
      } catch (err) {
        console.error('Error fetching prompts by category:', err)
        setError(err instanceof Error ? err.message : 'プロンプトの読み込みに失敗しました')
      } finally {
        setLoading(false)
      }
    }

    fetchPrompts()
  }, [category])

  return { prompts, loading, error }
}

export function usePromptStats() {
  const { prompts, loading, error } = usePrompts()
  
  const stats = {
    totalPrompts: prompts.length,
    activePrompts: prompts.filter(p => p.isActive).length,
    inactivePrompts: prompts.filter(p => !p.isActive).length,
    totalUsage: prompts.reduce((sum, p) => sum + (p.usageCount || 0), 0),
    averageUsage: prompts.length > 0 
      ? Math.round(prompts.reduce((sum, p) => sum + (p.usageCount || 0), 0) / prompts.length)
      : 0,
    categoryStats: prompts.reduce((acc, prompt) => {
      acc[prompt.category] = (acc[prompt.category] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    mostUsedPrompt: prompts.length > 0 
      ? prompts.reduce((prev, current) => 
          (current.usageCount || 0) > (prev.usageCount || 0) ? current : prev
        )
      : null,
    recentPrompts: prompts
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
  }

  return { stats, loading, error }
}
