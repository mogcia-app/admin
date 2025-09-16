'use client'

import { useState, useEffect } from 'react'
import { 
  SystemSettings, 
  AdminProfile 
} from '@/lib/settings'
import { 
  getSystemSettings,
  updateSystemSetting,
  getAdminProfile,
  updateAdminProfile
} from '@/lib/settings'

export function useSystemSettings(category?: string) {
  const [settings, setSettings] = useState<SystemSettings[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSettings = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getSystemSettings(category)
      setSettings(data)
    } catch (err) {
      console.error('Error fetching system settings:', err)
      setError(err instanceof Error ? err.message : 'システム設定の読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [category])

  const updateSetting = async (id: string, value: any, updatedBy: string) => {
    try {
      setError(null)
      await updateSystemSetting(id, value, updatedBy)
      
      // ローカル状態を更新
      setSettings(settings.map(setting =>
        setting.id === id 
          ? { ...setting, value, updatedBy, updatedAt: new Date().toISOString() }
          : setting
      ))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '設定の更新に失敗しました'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const getSettingByKey = (key: string): SystemSettings | undefined => {
    return settings.find(setting => setting.key === key)
  }

  const getSettingValue = (key: string): any => {
    const setting = getSettingByKey(key)
    return setting?.value
  }

  return {
    settings,
    loading,
    error,
    updateSetting,
    getSettingByKey,
    getSettingValue,
    refreshSettings: fetchSettings
  }
}

export function useAdminProfile(adminId: string) {
  const [profile, setProfile] = useState<AdminProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getAdminProfile(adminId)
      setProfile(data)
    } catch (err) {
      console.error('Error fetching admin profile:', err)
      setError(err instanceof Error ? err.message : 'プロフィールの読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (adminId) {
      fetchProfile()
    }
  }, [adminId])

  const updateProfile = async (updates: Partial<AdminProfile>) => {
    try {
      setError(null)
      await updateAdminProfile(adminId, updates)
      
      // ローカル状態を更新
      setProfile(prev => prev ? {
        ...prev,
        ...updates,
        updatedAt: new Date().toISOString()
      } : null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'プロフィールの更新に失敗しました'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  return {
    profile,
    loading,
    error,
    updateProfile,
    refreshProfile: fetchProfile
  }
}

export function useSettingsStats() {
  const { settings } = useSystemSettings()
  
  const stats = {
    totalSettings: settings.length,
    editableSettings: settings.filter(s => s.isEditable).length,
    settingsByCategory: settings.reduce((acc, setting) => {
      acc[setting.category] = (acc[setting.category] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }

  return stats
}
