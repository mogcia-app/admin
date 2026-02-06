'use client'

import { useState, useEffect } from 'react'
import { Company } from '@/types'
import * as companyService from '@/lib/companies'
import { retryOnPermissionError, refreshAuthToken } from '@/lib/firebase-utils'

export function useCompanies() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCompanies()
  }, [])

  const fetchCompanies = async () => {
    try {
      setLoading(true)
      setError(null)
      const companyData = await retryOnPermissionError(() => companyService.getCompanies())
      setCompanies(companyData)
    } catch (err: any) {
      console.error('Error fetching companies:', err)
      
      // 権限エラーの場合、トークンを再取得してリトライ
      if (
        err?.code === 'permission-denied' ||
        err?.message?.includes('Missing or insufficient permissions')
      ) {
        try {
          await refreshAuthToken()
          // トークン更新後、再試行
          setTimeout(async () => {
            try {
              const retryData = await companyService.getCompanies()
              setCompanies(retryData)
              setError(null)
            } catch (retryErr) {
              setError('企業データの取得に失敗しました。ページをリロードしてください。')
              setCompanies([])
            }
          }, 1000)
        } catch (refreshError) {
          console.error('Failed to refresh token:', refreshError)
          setError('企業データの取得に失敗しました。Firebase接続を確認してください。')
          setCompanies([])
        }
      } else {
        setError('企業データの取得に失敗しました。Firebase接続を確認してください。')
        setCompanies([])
      }
    } finally {
      setLoading(false)
    }
  }

  const addCompany = async (
    companyData: Omit<Company, 'id' | 'createdAt' | 'updatedAt' | 'userCount' | 'activeUserCount'>,
    createdBy: string = 'admin'
  ) => {
    try {
      setError(null)
      const id = await companyService.createCompany(companyData, createdBy)
      const newCompany: Company = {
        ...companyData,
        id,
        userCount: 0,
        activeUserCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      setCompanies(prev => [newCompany, ...prev])
      return id
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '企業の作成に失敗しました'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const editCompany = async (id: string, updates: Partial<Company>) => {
    try {
      setError(null)
      await companyService.updateCompany(id, updates)
      setCompanies(prev => prev.map(company => 
        company.id === id 
          ? { ...company, ...updates, updatedAt: new Date().toISOString() }
          : company
      ))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '企業情報の更新に失敗しました'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const removeCompany = async (id: string) => {
    try {
      setError(null)
      await companyService.deleteCompany(id)
      setCompanies(prev => prev.filter(company => company.id !== id))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '企業の削除に失敗しました'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  return {
    companies,
    loading,
    error,
    addCompany,
    editCompany,
    removeCompany,
    refreshCompanies: fetchCompanies
  }
}









