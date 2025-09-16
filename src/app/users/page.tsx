'use client'

import React, { useState } from 'react'
import { Users, Plus, Search, MoreHorizontal, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useUsers } from '@/hooks/useFirebase'

export default function UsersPage() {
  const { users, loading, error, createUser } = useUsers()
  const [searchTerm, setSearchTerm] = useState('')

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCreateTestUser = async () => {
    try {
      await createUser({
        name: `テストユーザー ${Date.now()}`,
        email: `test${Date.now()}@example.com`,
        role: 'user',
        isActive: true
      })
    } catch (err) {
      console.error('Error creating test user:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">ユーザーデータを読み込み中...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ユーザー管理</h1>
          <p className="text-muted-foreground">
            登録ユーザーの管理と操作
            {error && <span className="text-destructive ml-2">({error})</span>}
          </p>
        </div>
        <Button onClick={handleCreateTestUser}>
          <Plus className="h-4 w-4 mr-2" />
          テストユーザー作成
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>ユーザー一覧</CardTitle>
              <CardDescription>
                {filteredUsers.length} 人のユーザーが見つかりました
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="search"
                placeholder="ユーザーを検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          {/* Users Table */}
          <div className="border rounded-lg">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr className="border-b">
                    <th className="text-left p-4 font-medium">ユーザー</th>
                    <th className="text-left p-4 font-medium">役割</th>
                    <th className="text-left p-4 font-medium">ステータス</th>
                    <th className="text-left p-4 font-medium">作成日</th>
                    <th className="text-right p-4 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center p-8 text-muted-foreground">
                        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        ユーザーが見つかりません
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="border-b hover:bg-muted/25">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-primary-foreground">
                                {user.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium">{user.name}</p>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            user.role === 'admin' 
                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                              : user.role === 'moderator'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                          }`}>
                            {user.role === 'admin' ? '管理者' : user.role === 'moderator' ? 'モデレーター' : 'ユーザー'}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            user.isActive 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                          }`}>
                            {user.isActive ? 'アクティブ' : '非アクティブ'}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {new Date(user.createdAt).toLocaleDateString('ja-JP')}
                        </td>
                        <td className="p-4 text-right">
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
