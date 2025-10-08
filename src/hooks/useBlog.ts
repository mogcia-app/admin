'use client'

import { useState, useEffect } from 'react'
import { 
  BlogPost, 
  BlogCategory, 
  BlogTag, 
  BlogStats 
} from '@/types'
import { 
  getBlogPosts, 
  getPublishedBlogPosts,
  getBlogPost,
  getBlogPostBySlug,
  createBlogPost, 
  updateBlogPost, 
  deleteBlogPost,
  publishBlogPost,
  archiveBlogPost,
  incrementViewCount,
  getBlogCategories,
  createBlogCategory,
  getBlogTags,
  createBlogTag,
  getBlogStats,
  subscribeToBlogPosts
} from '@/lib/blog'

// ブログ記事管理用フック
export function useBlogPosts(
  status?: 'draft' | 'published' | 'archived',
  category?: string,
  tag?: string,
  search?: string
) {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPosts = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getBlogPosts(status, category, tag, search)
      setPosts(data)
    } catch (err) {
      console.error('Error fetching blog posts:', err)
      setError(err instanceof Error ? err.message : 'ブログ記事の読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [status, category, tag, search])

  const addPost = async (postData: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt' | 'viewCount'>) => {
    try {
      setError(null)
      
      // undefinedの値を除外
      const cleanData = Object.fromEntries(
        Object.entries(postData).filter(([_, value]) => value !== undefined)
      ) as Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt' | 'viewCount'>
      
      const id = await createBlogPost(cleanData)
      
      // ローカル状態を更新
      const newPost: BlogPost = {
        ...postData,
        id,
        viewCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      setPosts([newPost, ...posts])
      
      return id
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ブログ記事の作成に失敗しました'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const editPost = async (id: string, postData: Partial<BlogPost>) => {
    try {
      setError(null)
      await updateBlogPost(id, postData)
      
      // ローカル状態を更新
      setPosts(posts.map(post => 
        post.id === id 
          ? { ...post, ...postData, updatedAt: new Date().toISOString() }
          : post
      ))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ブログ記事の更新に失敗しました'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const removePost = async (id: string) => {
    try {
      setError(null)
      await deleteBlogPost(id)
      
      // ローカル状態から削除
      setPosts(posts.filter(post => post.id !== id))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ブログ記事の削除に失敗しました'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const publishPost = async (id: string) => {
    try {
      setError(null)
      await publishBlogPost(id)
      
      // ローカル状態を更新
      setPosts(posts.map(post => 
        post.id === id 
          ? { 
              ...post, 
              status: 'published' as const,
              publishedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          : post
      ))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ブログ記事の公開に失敗しました'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const archivePost = async (id: string) => {
    try {
      setError(null)
      await archiveBlogPost(id)
      
      // ローカル状態を更新
      setPosts(posts.map(post => 
        post.id === id 
          ? { 
              ...post, 
              status: 'archived' as const,
              updatedAt: new Date().toISOString()
            }
          : post
      ))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ブログ記事のアーカイブに失敗しました'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const refreshPosts = () => {
    fetchPosts()
  }

  return {
    posts,
    loading,
    error,
    addPost,
    editPost,
    removePost,
    publishPost,
    archivePost,
    refreshPosts
  }
}

// 公開済みブログ記事用フック
export function usePublishedBlogPosts(category?: string, tag?: string) {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPosts = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getPublishedBlogPosts(category, tag)
      setPosts(data)
    } catch (err) {
      console.error('Error fetching published blog posts:', err)
      setError(err instanceof Error ? err.message : '公開済みブログ記事の読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [category, tag])

  const viewPost = async (id: string) => {
    try {
      await incrementViewCount(id)
      // ローカル状態の閲覧数を更新
      setPosts(posts.map(post => 
        post.id === id 
          ? { ...post, viewCount: post.viewCount + 1 }
          : post
      ))
    } catch (err) {
      console.error('Error incrementing view count:', err)
    }
  }

  return {
    posts,
    loading,
    error,
    viewPost,
    refreshPosts: fetchPosts
  }
}

// 単一ブログ記事用フック
export function useBlogPost(id: string) {
  const [post, setPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPost = async () => {
      if (!id) return
      
      try {
        setLoading(true)
        setError(null)
        const data = await getBlogPost(id)
        setPost(data)
      } catch (err) {
        console.error('Error fetching blog post:', err)
        setError(err instanceof Error ? err.message : 'ブログ記事の読み込みに失敗しました')
      } finally {
        setLoading(false)
      }
    }

    fetchPost()
  }, [id])

  const updatePost = async (postData: Partial<BlogPost>) => {
    if (!id) return
    
    try {
      setError(null)
      await updateBlogPost(id, postData)
      
      // ローカル状態を更新
      setPost(prev => prev ? { ...prev, ...postData, updatedAt: new Date().toISOString() } : null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ブログ記事の更新に失敗しました'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  return {
    post,
    loading,
    error,
    updatePost
  }
}

// スラッグでブログ記事を取得するフック
export function useBlogPostBySlug(slug: string) {
  const [post, setPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPost = async () => {
      if (!slug) return
      
      try {
        setLoading(true)
        setError(null)
        const data = await getBlogPostBySlug(slug)
        setPost(data)
      } catch (err) {
        console.error('Error fetching blog post by slug:', err)
        setError(err instanceof Error ? err.message : 'ブログ記事の読み込みに失敗しました')
      } finally {
        setLoading(false)
      }
    }

    fetchPost()
  }, [slug])

  const viewPost = async () => {
    if (!post?.id) return
    
    try {
      await incrementViewCount(post.id)
      setPost(prev => prev ? { ...prev, viewCount: prev.viewCount + 1 } : null)
    } catch (err) {
      console.error('Error incrementing view count:', err)
    }
  }

  return {
    post,
    loading,
    error,
    viewPost
  }
}

// カテゴリ管理用フック
export function useBlogCategories() {
  const [categories, setCategories] = useState<BlogCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCategories = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getBlogCategories()
      setCategories(data)
    } catch (err) {
      console.error('Error fetching blog categories:', err)
      setError(err instanceof Error ? err.message : 'カテゴリの読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const addCategory = async (categoryData: Omit<BlogCategory, 'id' | 'createdAt' | 'updatedAt' | 'postCount'>) => {
    try {
      setError(null)
      const id = await createBlogCategory(categoryData)
      
      const newCategory: BlogCategory = {
        ...categoryData,
        id,
        postCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      setCategories([...categories, newCategory])
      
      return id
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'カテゴリの作成に失敗しました'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  return {
    categories,
    loading,
    error,
    addCategory,
    refreshCategories: fetchCategories
  }
}

// タグ管理用フック
export function useBlogTags() {
  const [tags, setTags] = useState<BlogTag[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTags = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getBlogTags()
      setTags(data)
    } catch (err) {
      console.error('Error fetching blog tags:', err)
      setError(err instanceof Error ? err.message : 'タグの読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTags()
  }, [])

  const addTag = async (tagData: Omit<BlogTag, 'id' | 'createdAt' | 'postCount'>) => {
    try {
      setError(null)
      const id = await createBlogTag(tagData)
      
      const newTag: BlogTag = {
        ...tagData,
        id,
        postCount: 0,
        createdAt: new Date().toISOString()
      }
      setTags([...tags, newTag])
      
      return id
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'タグの作成に失敗しました'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  return {
    tags,
    loading,
    error,
    addTag,
    refreshTags: fetchTags
  }
}

// ブログ統計用フック
export function useBlogStats() {
  const [stats, setStats] = useState<BlogStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getBlogStats()
      setStats(data)
    } catch (err) {
      console.error('Error fetching blog stats:', err)
      setError(err instanceof Error ? err.message : 'ブログ統計の読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  return {
    stats,
    loading,
    error,
    refreshStats: fetchStats
  }
}

// リアルタイム更新用フック
export function useBlogPostsSubscription() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = subscribeToBlogPosts((updatedPosts) => {
      setPosts(updatedPosts)
      setLoading(false)
      setError(null)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  return {
    posts,
    loading,
    error
  }
}
