'use client'

import React, { useState } from 'react'
import { Building2, Plus, Search, Edit, Trash2, Eye, Loader2, Users as UsersIcon, UserPlus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Company } from '@/types'
import { useCompanies } from '@/hooks/useCompanies'
import { getUsersByCompany } from '@/lib/companies'

export default function CompaniesPage() {
  const { companies, loading, error, addCompany, editCompany, removeCompany } = useCompanies()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showUsersModal, setShowUsersModal] = useState(false)
  const [companyUsers, setCompanyUsers] = useState<any[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)

  // 検索とフィルタリング
  const filteredCompanies = companies.filter(company => {
    const matchesSearch = !searchQuery || 
      company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.industry?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = selectedStatus === 'all' || company.status === selectedStatus
    
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      suspended: 'bg-red-100 text-red-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getStatusLabel = (status: string) => {
    const labels = {
      active: 'アクティブ',
      inactive: '非アクティブ',
      suspended: '停止中'
    }
    return labels[status as keyof typeof labels] || status
  }

  const handleCreateCompany = async (companyData: Partial<Company>) => {
    try {
      await addCompany({
        name: companyData.name || '',
        description: companyData.description,
        industry: companyData.industry,
        website: companyData.website,
        contactEmail: companyData.contactEmail,
        contactName: companyData.contactName,
        contactPhone: companyData.contactPhone,
        address: companyData.address,
        status: (companyData.status as 'active' | 'inactive' | 'suspended') || 'active',
        contractStartDate: companyData.contractStartDate,
        contractEndDate: companyData.contractEndDate,
        billingInfo: companyData.billingInfo,
        notes: companyData.notes,
        createdBy: 'admin'
      })
      alert('企業を作成しました！')
      setShowCreateModal(false)
    } catch (err) {
      alert('企業の作成に失敗しました: ' + (err instanceof Error ? err.message : '不明なエラー'))
    }
  }

  const handleEditCompany = async (companyData: Partial<Company>) => {
    if (!selectedCompany) return
    
    try {
      await editCompany(selectedCompany.id, companyData)
      setSelectedCompany(null)
      alert('企業情報を更新しました！')
      setShowEditModal(false)
    } catch (err) {
      alert('企業情報の更新に失敗しました: ' + (err instanceof Error ? err.message : '不明なエラー'))
    }
  }

  const handleDeleteCompany = async (companyId: string) => {
    if (confirm('この企業を削除しますか？所属ユーザーがいる場合は削除できません。')) {
      try {
        await removeCompany(companyId)
        alert('企業を削除しました')
      } catch (err) {
        alert('企業の削除に失敗しました: ' + (err instanceof Error ? err.message : '不明なエラー'))
      }
    }
  }

  const openDetailModal = (company: Company) => {
    setSelectedCompany(company)
    setShowDetailModal(true)
  }

  const openEditModal = (company: Company) => {
    setSelectedCompany(company)
    setShowEditModal(true)
  }

  const openUsersModal = async (company: Company) => {
    setSelectedCompany(company)
    setLoadingUsers(true)
    setShowUsersModal(true)
    try {
      const users = await getUsersByCompany(company.id)
      setCompanyUsers(users)
    } catch (err) {
      console.error('Error fetching company users:', err)
      setCompanyUsers([])
    } finally {
      setLoadingUsers(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">企業データを読み込み中...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">企業管理</h1>
          <p className="text-muted-foreground">
            企業アカウントの管理とユーザー発行を行います
            {error && <span className="text-destructive ml-2">({error})</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            新規企業追加
          </Button>
        </div>
      </div>

      {/* 検索・フィルター */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="企業名、業界、説明で検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 w-full bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">すべてのステータス</option>
          <option value="active">アクティブ</option>
          <option value="inactive">非アクティブ</option>
          <option value="suspended">停止中</option>
        </select>
      </div>

      {/* 企業一覧 - テーブル形式 */}
      <div>
        <div className="mb-4">
          <h2 className="text-xl font-semibold">企業一覧</h2>
          <p className="text-sm text-muted-foreground">
            {filteredCompanies.length} 社の企業が見つかりました
          </p>
        </div>
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto max-h-[calc(100vh-400px)]">
              <table className="w-full border-collapse">
                <thead className="sticky top-0 z-10">
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left text-sm font-medium sticky left-0 bg-muted/50 z-10 min-w-[200px]">企業名</th>
                    <th className="px-4 py-3 text-left text-sm font-medium min-w-[150px]">業界</th>
                    <th className="px-4 py-3 text-left text-sm font-medium min-w-[100px]">ステータス</th>
                    <th className="px-4 py-3 text-left text-sm font-medium min-w-[100px]">ユーザー数</th>
                    <th className="px-4 py-3 text-left text-sm font-medium min-w-[120px]">契約終了日</th>
                    <th className="px-4 py-3 text-left text-sm font-medium min-w-[200px]">連絡先</th>
                    <th className="px-4 py-3 text-right text-sm font-medium sticky right-0 bg-muted/50 z-10 min-w-[200px]">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCompanies.map((company, index) => (
                    <tr 
                      key={company.id} 
                      className={`border-b hover:bg-muted/50 transition-colors ${index % 2 === 0 ? 'bg-background' : 'bg-muted/10'}`}
                    >
                      <td className="px-4 py-3 sticky left-0 bg-inherit z-0">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                          <div>
                            <span className="font-medium whitespace-nowrap">{company.name}</span>
                            {company.description && (
                              <p className="text-xs text-muted-foreground line-clamp-1">{company.description}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                        {company.industry || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(company.status)}`}>
                            {getStatusLabel(company.status)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <UsersIcon className="h-4 w-4 text-muted-foreground" />
                          <span>{company.userCount}人</span>
                          {company.activeUserCount > 0 && (
                            <span className="text-xs text-green-600">({company.activeUserCount}アクティブ)</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                        {company.contractEndDate 
                          ? new Date(company.contractEndDate).toLocaleDateString('ja-JP', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })
                          : '-'
                        }
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        <div className="space-y-1">
                          {company.contactName && (
                            <div className="whitespace-nowrap">{company.contactName}</div>
                          )}
                          {company.contactEmail && (
                            <div className="text-xs whitespace-nowrap">{company.contactEmail}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 sticky right-0 bg-inherit z-0">
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => openUsersModal(company)}
                            title="ユーザー一覧"
                            className="h-8 w-8 p-0"
                          >
                            <UsersIcon className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => openDetailModal(company)}
                            title="詳細表示"
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => openEditModal(company)}
                            title="編集"
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteCompany(company.id)}
                            title="削除"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredCompanies.length === 0 && (
                <div className="text-center py-12">
                  <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">該当する企業が見つかりませんでした。</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 詳細モーダル */}
      {showDetailModal && selectedCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-background rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-bold">{selectedCompany.name} - 詳細情報</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowDetailModal(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium mb-2">基本情報</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">企業名:</span> {selectedCompany.name}</p>
                    {selectedCompany.description && (
                      <p><span className="font-medium">説明:</span> {selectedCompany.description}</p>
                    )}
                    {selectedCompany.industry && (
                      <p><span className="font-medium">業界:</span> {selectedCompany.industry}</p>
                    )}
                    {selectedCompany.website && (
                      <p><span className="font-medium">Webサイト:</span> <a href={selectedCompany.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{selectedCompany.website}</a></p>
                    )}
                    <p><span className="font-medium">ステータス:</span> {getStatusLabel(selectedCompany.status)}</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium mb-2">連絡先情報</h3>
                  <div className="space-y-2 text-sm">
                    {selectedCompany.contactName && (
                      <p><span className="font-medium">担当者:</span> {selectedCompany.contactName}</p>
                    )}
                    {selectedCompany.contactEmail && (
                      <p><span className="font-medium">メール:</span> {selectedCompany.contactEmail}</p>
                    )}
                    {selectedCompany.contactPhone && (
                      <p><span className="font-medium">電話:</span> {selectedCompany.contactPhone}</p>
                    )}
                    {selectedCompany.address && (
                      <p><span className="font-medium">住所:</span> {selectedCompany.address}</p>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-medium mb-2">契約情報</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">ユーザー数:</span> {selectedCompany.userCount}人（アクティブ: {selectedCompany.activeUserCount}人）</p>
                  {selectedCompany.contractStartDate && (
                    <p><span className="font-medium">契約開始日:</span> {new Date(selectedCompany.contractStartDate).toLocaleDateString('ja-JP')}</p>
                  )}
                  {selectedCompany.contractEndDate && (
                    <p><span className="font-medium">契約終了日:</span> {new Date(selectedCompany.contractEndDate).toLocaleDateString('ja-JP')}</p>
                  )}
                </div>
              </div>
              {selectedCompany.notes && (
                <div>
                  <h3 className="font-medium mb-2">備考</h3>
                  <p className="text-sm text-muted-foreground">{selectedCompany.notes}</p>
                </div>
              )}
              <div className="flex gap-2 pt-4 border-t">
                <Button onClick={() => { setShowDetailModal(false); openUsersModal(selectedCompany); }}>
                  <UsersIcon className="h-4 w-4 mr-2" />
                  ユーザー一覧を見る
                </Button>
                <Button variant="outline" onClick={() => { setShowDetailModal(false); openEditModal(selectedCompany); }}>
                  <Edit className="h-4 w-4 mr-2" />
                  編集
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ユーザー一覧モーダル */}
      {showUsersModal && selectedCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-background rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-bold">{selectedCompany.name} - 所属ユーザー一覧</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowUsersModal(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="p-6">
              {loadingUsers ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="ml-2">ユーザーを読み込み中...</span>
                </div>
              ) : companyUsers.length === 0 ? (
                <div className="text-center py-12">
                  <UsersIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground mb-4">この企業に所属するユーザーはいません。</p>
                  <Button onClick={() => { setShowUsersModal(false); window.location.href = `/users?companyId=${selectedCompany.id}`; }}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    ユーザーを発行する
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-muted-foreground">
                      {companyUsers.length}人のユーザーが所属しています
                    </p>
                    <Button onClick={() => { setShowUsersModal(false); window.location.href = `/users?companyId=${selectedCompany.id}`; }}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      ユーザーを追加
                    </Button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="px-4 py-2 text-left text-sm font-medium">名前</th>
                          <th className="px-4 py-2 text-left text-sm font-medium">メール</th>
                          <th className="px-4 py-2 text-left text-sm font-medium">ステータス</th>
                        </tr>
                      </thead>
                      <tbody>
                        {companyUsers.map((user: any, index: number) => (
                          <tr key={user.id} className={`border-b ${index % 2 === 0 ? 'bg-background' : 'bg-muted/10'}`}>
                            <td className="px-4 py-2 text-sm">{user.name}</td>
                            <td className="px-4 py-2 text-sm text-muted-foreground">{user.email}</td>
                            <td className="px-4 py-2 text-sm">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                {user.isActive ? 'アクティブ' : '非アクティブ'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 作成モーダル（簡易版） */}
      {showCreateModal && (
        <CompanyModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSave={handleCreateCompany}
        />
      )}

      {/* 編集モーダル（簡易版） */}
      {showEditModal && selectedCompany && (
        <CompanyModal
          isOpen={showEditModal}
          onClose={() => { setShowEditModal(false); setSelectedCompany(null); }}
          company={selectedCompany}
          onSave={handleEditCompany}
        />
      )}
    </div>
  )
}

// 簡易的な企業モーダルコンポーネント
function CompanyModal({ 
  isOpen, 
  onClose, 
  company, 
  onSave 
}: { 
  isOpen: boolean
  onClose: () => void
  company?: Company | null
  onSave: (data: Partial<Company>) => void
}) {
  const [formData, setFormData] = useState<Partial<Company>>({
    name: company?.name || '',
    description: company?.description || '',
    industry: company?.industry || '',
    website: company?.website || '',
    contactEmail: company?.contactEmail || '',
    contactName: company?.contactName || '',
    contactPhone: company?.contactPhone || '',
    address: company?.address || '',
    status: company?.status || 'active' as 'active' | 'inactive' | 'suspended',
    contractStartDate: company?.contractStartDate || '',
    contractEndDate: company?.contractEndDate || '',
    notes: company?.notes || '',
  })

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold">{company ? '企業編集' : '新規企業追加'}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">企業名 *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-md"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">説明</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-md"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">業界</label>
              <input
                type="text"
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">ステータス</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' | 'suspended' })}
                className="w-full px-3 py-2 border border-border rounded-md"
              >
                <option value="active">アクティブ</option>
                <option value="inactive">非アクティブ</option>
                <option value="suspended">停止中</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Webサイト</label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-md"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">担当者名</label>
              <input
                type="text"
                value={formData.contactName}
                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">担当者メール</label>
              <input
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">電話番号</label>
            <input
              type="tel"
              value={formData.contactPhone}
              onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">住所</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-md"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">契約開始日</label>
              <input
                type="date"
                value={formData.contractStartDate ? formData.contractStartDate.split('T')[0] : ''}
                onChange={(e) => setFormData({ ...formData, contractStartDate: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">契約終了日</label>
              <input
                type="date"
                value={formData.contractEndDate ? formData.contractEndDate.split('T')[0] : ''}
                onChange={(e) => setFormData({ ...formData, contractEndDate: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">備考</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-md"
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>キャンセル</Button>
            <Button onClick={() => onSave(formData)} disabled={!formData.name}>
              保存
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

