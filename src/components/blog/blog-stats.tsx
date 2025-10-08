'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  BarChart3, 
  Eye, 
  FileText, 
  TrendingUp, 
  Calendar,
  Tag,
  Folder,
  Clock
} from 'lucide-react'
import { BlogStats } from '@/types'

interface BlogStatsProps {
  stats: BlogStats
  loading: boolean
}

export function BlogStatsComponent({ stats, loading }: BlogStatsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  const getTopCategories = () => {
    return Object.entries(stats.postsByCategory)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
  }

  const getRecentMonths = () => {
    return Object.entries(stats.postsByMonth)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 6)
  }

  return (
    <div className="space-y-6">
      {/* 基本統計 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総記事数</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPosts}</div>
            <p className="text-xs text-muted-foreground">
              公開済み: {stats.publishedPosts} | 下書き: {stats.draftPosts}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総閲覧数</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.totalViews)}</div>
            <p className="text-xs text-muted-foreground">
              平均: {stats.averageViewsPerPost}/記事
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">カテゴリ数</CardTitle>
            <Folder className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCategories}</div>
            <p className="text-xs text-muted-foreground">
              タグ数: {stats.totalTags}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">人気記事</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.mostPopularPost ? formatNumber(stats.mostPopularPost.viewCount) : '0'}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {stats.mostPopularPost?.title || 'なし'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* カテゴリ別投稿数 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">カテゴリ別投稿数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {getTopCategories().map(([category, count]) => (
                <div key={category} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Folder className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{category}</span>
                  </div>
                  <Badge variant="secondary">{count}</Badge>
                </div>
              ))}
              {getTopCategories().length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  カテゴリデータがありません
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 月別投稿数 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">月別投稿数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {getRecentMonths().map(([month, count]) => (
                <div key={month} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {new Date(month + '-01').toLocaleDateString('ja-JP', {
                        year: 'numeric',
                        month: 'short'
                      })}
                    </span>
                  </div>
                  <Badge variant="outline">{count}</Badge>
                </div>
              ))}
              {getRecentMonths().length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  投稿データがありません
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
