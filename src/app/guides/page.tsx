'use client'

import React, { useState } from 'react'
import { Plus, Search, Filter, BarChart3, Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BlogPostModal } from '@/components/blog/blog-post-modal'
import { BlogPostList } from '@/components/blog/blog-post-list'
import { BlogStatsComponent } from '@/components/blog/blog-stats'
import { BlogPost } from '@/types'
import { useBlogPosts, useBlogCategories, useBlogTags, useBlogStats } from '@/hooks/useBlog'

export default function BlogPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedTag, setSelectedTag] = useState<string>('all')
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showStats, setShowStats] = useState(false)

  const { 
    posts, 
    loading, 
    error, 
    addPost, 
    editPost, 
    removePost,
    publishPost,
    archivePost,
    refreshPosts
  } = useBlogPosts(
    selectedStatus === 'all' ? undefined : selectedStatus as any,
    selectedCategory === 'all' ? undefined : selectedCategory,
    selectedTag === 'all' ? undefined : selectedTag,
    searchQuery || undefined
  )

  const { categories, loading: categoriesLoading } = useBlogCategories()
  const { tags, loading: tagsLoading } = useBlogTags()
  const { stats, loading: statsLoading } = useBlogStats()

  // デフォルトカテゴリ
  const defaultCategories = ['Signal.', 'Instagram', 'X', 'TikTok', 'その他']
  
  // カテゴリがない場合はデフォルトを使用、ある場合はマージ
  const categoryNames = categories.length > 0 
    ? [...new Set([...defaultCategories, ...categories.map(cat => cat.name)])]
    : defaultCategories

  const handleCreatePost = async (postData: Partial<BlogPost>) => {
    await addPost(postData as any)
    setShowCreateModal(false)
  }

  const handleEditPost = async (postData: Partial<BlogPost>) => {
    if (selectedPost) {
      await editPost(selectedPost.id, postData)
      setShowEditModal(false)
      setSelectedPost(null)
    }
  }

  const handleDeletePost = async (post: BlogPost) => {
    if (confirm(`「${post.title}」を削除しますか？この操作は取り消せません。`)) {
      await removePost(post.id)
    }
  }

  const handlePublishPost = async (post: BlogPost) => {
    await publishPost(post.id)
  }

  const handleArchivePost = async (post: BlogPost) => {
    await archivePost(post.id)
  }

  const tagNames = tags.map(tag => tag.name)

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">ブログ管理</h1>
          <p className="text-muted-foreground">
            HPのブログ機能を管理します
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowStats(!showStats)}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            統計
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            新規作成
          </Button>
        </div>
      </div>

      {/* 統計表示 */}
      {showStats && (
        <Card>
          <CardHeader>
            <CardTitle>ブログ統計</CardTitle>
            <CardDescription>
              ブログの投稿数、閲覧数、カテゴリ別統計などを表示します
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BlogStatsComponent stats={stats!} loading={statsLoading} />
          </CardContent>
        </Card>
      )}

      {/* フィルターと検索 */}
      <Card>
        <CardHeader>
          <CardTitle>フィルター</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">検索</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="タイトル、本文で検索..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">ステータス</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  <SelectItem value="published">✅ 公開中</SelectItem>
                  <SelectItem value="draft">📝 下書き</SelectItem>
                  <SelectItem value="archived">📦 アーカイブ</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">カテゴリ</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  {categoryNames.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">タグ</label>
              <Select value={selectedTag} onValueChange={setSelectedTag}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  {tagNames.map((tag) => (
                    <SelectItem key={tag} value={tag}>
                      {tag}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-muted-foreground">
              {loading ? '読み込み中...' : `${posts.length}件の記事が見つかりました`}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshPosts}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              更新
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* エラー表示 */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="text-red-600">
              <strong>エラー:</strong> {error}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ブログ記事一覧 */}
      <BlogPostList
        posts={posts}
        loading={loading}
        onEdit={(post) => {
          setSelectedPost(post)
          setShowEditModal(true)
        }}
        onDelete={handleDeletePost}
        onPublish={handlePublishPost}
        onArchive={handleArchivePost}
      />

      {/* 作成モーダル */}
      <BlogPostModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={handleCreatePost}
        categories={categoryNames}
        tags={tagNames}
      />

      {/* 編集モーダル */}
      <BlogPostModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setSelectedPost(null)
        }}
        onSave={handleEditPost}
        post={selectedPost}
        categories={categoryNames}
        tags={tagNames}
      />
    </div>
  )
}
