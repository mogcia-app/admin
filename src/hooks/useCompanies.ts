'use client'

import { useState, useEffect } from 'react'
import { Company } from '@/types'
import * as companyService from '@/lib/companies'

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
      const companyData = await companyService.getCompanies()
      setCompanies(companyData)
    } catch (err) {
      console.error('Error fetching companies:', err)
      setError('企業データの取得に失敗しました。Firebase接続を確認してください。')
      setCompanies([])
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



