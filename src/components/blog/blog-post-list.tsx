'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Eye, 
  Calendar, 
  Tag, 
  Edit, 
  Trash2, 
  EyeOff,
  Archive,
  Clock,
  User
} from 'lucide-react'
import { BlogPost } from '@/types'
import Link from 'next/link'

interface BlogPostListProps {
  posts: BlogPost[]
  loading: boolean
  onEdit: (post: BlogPost) => void
  onDelete: (post: BlogPost) => void
  onPublish: (post: BlogPost) => void
  onArchive: (post: BlogPost) => void
}

export function BlogPostList({ 
  posts, 
  loading, 
  onEdit, 
  onDelete, 
  onPublish, 
  onArchive 
}: BlogPostListProps) {
  
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📝</div>
        <h3 className="text-lg font-semibold mb-2">ブログ記事がありません</h3>
        <p className="text-muted-foreground">新しいブログ記事を作成してください。</p>
      </div>
    )
  }

  const getStatusBadge = (status: BlogPost['status']) => {
    switch (status) {
      case 'published':
        return <Badge variant="default" className="bg-green-100 text-green-800">✅ 公開中</Badge>
      case 'draft':
        return <Badge variant="secondary">📝 下書き</Badge>
      case 'archived':
        return <Badge variant="outline">📦 アーカイブ</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <Card key={post.id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4 flex-1">
                {post.featuredImage && (
                  <img 
                    src={post.featuredImage} 
                    alt={post.title}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusBadge(post.status)}
                    {post.publishedAt && (
                      <Badge variant="outline" className="text-xs">
                        <Calendar className="w-3 h-3 mr-1" />
                        {formatDate(post.publishedAt)}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg mb-2 line-clamp-2">
                    {post.title}
                  </CardTitle>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {post.author}
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {post.viewCount}
                    </div>
                    {post.readingTime && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {post.readingTime}分
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(post)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                {post.status === 'draft' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onPublish(post)}
                    className="text-green-600 hover:text-green-700"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                )}
                {post.status === 'published' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onArchive(post)}
                    className="text-orange-600 hover:text-orange-700"
                  >
                    <Archive className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(post)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {post.excerpt && (
              <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
                {post.excerpt}
              </p>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs">
                {post.category}
              </Badge>
              {post.tags.map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  <Tag className="w-3 h-3 mr-1" />
                  {tag}
                </Badge>
              ))}
            </div>
            <div className="mt-3 text-xs text-muted-foreground">
              作成: {formatDate(post.createdAt)}
              {post.updatedAt !== post.createdAt && (
                <span> | 更新: {formatDate(post.updatedAt)}</span>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
