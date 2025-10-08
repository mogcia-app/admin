'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { 
  X, 
  Plus, 
  Image as ImageIcon, 
  Eye, 
  Save, 
  Calendar,
  Tag,
  FileText,
  Settings,
  Upload,
  Trash2
} from 'lucide-react'
import { BlogPost } from '@/types'
import { uploadBlogThumbnail, getImagePreviewUrl } from '@/lib/storage'

interface BlogPostModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (postData: Partial<BlogPost>) => Promise<void>
  post?: BlogPost | null
  categories: string[]
  tags: string[]
}

export function BlogPostModal({ 
  isOpen, 
  onClose, 
  onSave, 
  post,
  categories,
  tags
}: BlogPostModalProps) {
  const [formData, setFormData] = useState<{
    title: string
    excerpt: string
    content: string
    category: string
    tags: string[]
    status: 'draft' | 'published' | 'archived'
    featuredImage: string
    author: string
  }>({
    title: '',
    excerpt: '',
    content: '',
    category: '',
    tags: [],
    status: 'draft',
    featuredImage: '',
    author: 'Admin'
  })
  
  const [newTag, setNewTag] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('')
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  useEffect(() => {
    if (post) {
      setFormData({
        title: post.title || '',
        excerpt: post.excerpt || '',
        content: post.content || '',
        category: post.category || '',
        tags: post.tags || [],
        status: post.status || 'draft',
        featuredImage: post.featuredImage || '',
        author: post.author || 'Admin'
      })
      setThumbnailPreview(post.featuredImage || '')
      setThumbnailFile(null)
    } else {
      setFormData({
        title: '',
        excerpt: '',
        content: '',
        category: '',
        tags: [],
        status: 'draft',
        featuredImage: '',
        author: 'Admin'
      })
      setThumbnailPreview('')
      setThumbnailFile(null)
    }
  }, [post, isOpen])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }))
      setNewTag('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const handleThumbnailChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // ファイルサイズチェック (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('画像サイズは5MB以下にしてください')
      return
    }

    // ファイルタイプチェック
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      alert('対応している画像形式: JPEG, PNG, GIF, WebP')
      return
    }

    setThumbnailFile(file)
    
    // プレビュー生成
    try {
      const previewUrl = await getImagePreviewUrl(file)
      setThumbnailPreview(previewUrl)
    } catch (error) {
      console.error('Error generating preview:', error)
      alert('プレビューの生成に失敗しました')
    }
  }

  const handleRemoveThumbnail = () => {
    setThumbnailFile(null)
    setThumbnailPreview('')
    handleInputChange('featuredImage', '')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      alert('タイトルを入力してください')
      return
    }

    if (!formData.content.trim()) {
      alert('本文を入力してください')
      return
    }

    setIsLoading(true)
    try {
      let featuredImageUrl = formData.featuredImage

      // サムネイル画像がアップロードされている場合
      if (thumbnailFile) {
        setIsUploadingImage(true)
        try {
          featuredImageUrl = await uploadBlogThumbnail(thumbnailFile, post?.id)
        } catch (error) {
          console.error('Error uploading thumbnail:', error)
          alert('画像のアップロードに失敗しました')
          setIsLoading(false)
          setIsUploadingImage(false)
          return
        }
        setIsUploadingImage(false)
      }

      await onSave({
        ...formData,
        featuredImage: featuredImageUrl
      })
      onClose()
    } catch (error) {
      console.error('Error saving blog post:', error)
      alert('保存に失敗しました')
    } finally {
      setIsLoading(false)
      setIsUploadingImage(false)
    }
  }

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  const tabs = [
    { id: 'content', label: 'コンテンツ', icon: FileText }
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {post ? 'ブログ記事を編集' : '新しいブログ記事を作成'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* コンテンツ */}
          <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-4">
                  <div>
                    <Label htmlFor="title">タイトル *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      placeholder="ブログ記事のタイトルを入力"
                      className="mt-1"
                    />
                    {formData.title && (
                      <p className="text-xs text-muted-foreground mt-1">
                        URL: /blog/{generateSlug(formData.title)}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="featuredImage">サムネイル画像</Label>
                    <div className="mt-1 space-y-2">
                      {!thumbnailPreview ? (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                          <input
                            type="file"
                            id="featuredImage"
                            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                            onChange={handleThumbnailChange}
                            className="hidden"
                          />
                          <label 
                            htmlFor="featuredImage" 
                            className="cursor-pointer flex flex-col items-center gap-2"
                          >
                            <Upload className="w-8 h-8 text-gray-400" />
                            <div className="text-sm text-gray-600">
                              <span className="font-semibold text-primary">ファイルを選択</span>
                              <span> またはドラッグ&ドロップ</span>
                            </div>
                            <p className="text-xs text-gray-500">
                              JPEG, PNG, GIF, WebP (最大5MB)
                            </p>
                          </label>
                        </div>
                      ) : (
                        <div className="relative">
                          <img 
                            src={thumbnailPreview} 
                            alt="サムネイルプレビュー"
                            className="w-full h-48 object-cover rounded-lg border"
                          />
                          <div className="absolute top-2 right-2 flex gap-2">
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={handleRemoveThumbnail}
                              className="shadow-lg"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              削除
                            </Button>
                          </div>
                          {thumbnailFile && (
                            <div className="mt-2 text-xs text-muted-foreground">
                              📎 {thumbnailFile.name} ({(thumbnailFile.size / 1024).toFixed(1)} KB)
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="excerpt">抜粋文</Label>
                    <Textarea
                      id="excerpt"
                      value={formData.excerpt}
                      onChange={(e) => handleInputChange('excerpt', e.target.value)}
                      placeholder="記事の要約や抜粋を入力（省略可）"
                      rows={3}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="content">本文 *</Label>
                    <Textarea
                      id="content"
                      value={formData.content}
                      onChange={(e) => handleInputChange('content', e.target.value)}
                      placeholder="記事の本文を入力（Markdown対応）"
                      rows={12}
                      className="mt-1 font-mono text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">公開設定</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label htmlFor="status">ステータス</Label>
                        <Select 
                          value={formData.status} 
                          onValueChange={(value) => handleInputChange('status', value)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">📝 下書き</SelectItem>
                            <SelectItem value="published">✅ 公開中</SelectItem>
                            <SelectItem value="archived">📦 アーカイブ</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formData.status === 'draft' && '下書きとして保存されます'}
                          {formData.status === 'published' && '公開状態で保存されます'}
                          {formData.status === 'archived' && 'アーカイブされます'}
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="category">カテゴリ</Label>
                        <Select 
                          value={formData.category} 
                          onValueChange={(value) => handleInputChange('category', value)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="カテゴリを選択" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">タグ</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex gap-2">
                        <Input
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          placeholder="新しいタグ"
                          className="flex-1"
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                        />
                        <Button type="button" onClick={handleAddTag} size="sm">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="flex flex-wrap gap-1">
                        {formData.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            <Tag className="w-3 h-3 mr-1" />
                            {tag}
                            <button
                              type="button"
                              onClick={() => handleRemoveTag(tag)}
                              className="ml-1 hover:text-red-500"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>

                      {tags.length > 0 && (
                        <>
                          <Separator />
                          <div>
                            <Label className="text-xs text-muted-foreground">既存のタグ</Label>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {tags.filter(tag => !formData.tags.includes(tag)).slice(0, 5).map((tag) => (
                                <button
                                  key={tag}
                                  type="button"
                                  onClick={() => {
                                    if (!formData.tags.includes(tag)) {
                                      handleInputChange('tags', [...formData.tags, tag])
                                    }
                                  }}
                                  className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                                >
                                  {tag}
                                </button>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>

          {/* アクションボタン */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {post ? '記事を編集して更新します' : '新しいブログ記事を作成します'}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                キャンセル
              </Button>
              <Button type="submit" disabled={isLoading || isUploadingImage} className="min-w-[100px]">
                {isUploadingImage ? (
                  <>
                    <Upload className="w-4 h-4 mr-2 animate-pulse" />
                    画像アップロード中...
                  </>
                ) : isLoading ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    保存中...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {post ? '更新する' : '作成する'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
