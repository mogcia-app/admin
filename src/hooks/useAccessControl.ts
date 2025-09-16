'use client'

import { useState, useEffect } from 'react'
import { 
  AppAccessControl, 
  SystemStatus 
} from '@/types'
import { 
  getAccessControlSettings, 
  getAccessControlByFeature,
  createAccessControl, 
  updateAccessControl, 
  toggleFeature,
  toggleMaintenanceMode,
  getSystemStatus,
  updateSystemStatus
} from '@/lib/access-control'

export function useAccessControl() {
  const [accessControls, setAccessControls] = useState<AppAccessControl[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAccessControls = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getAccessControlSettings()
      setAccessControls(data)
    } catch (err) {
      console.error('Error fetching access controls:', err)
      setError(err instanceof Error ? err.message : 'アクセス制御設定の読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAccessControls()
  }, [])

  const addAccessControl = async (controlData: Omit<AppAccessControl, 'id' | 'updatedAt'>) => {
    try {
      setError(null)
      const id = await createAccessControl(controlData)
      
      // ローカル状態を更新
      const newControl: AppAccessControl = {
        ...controlData,
        id,
        updatedAt: new Date().toISOString()
      }
      setAccessControls([...accessControls, newControl])
      
      return id
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'アクセス制御設定の作成に失敗しました'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const editAccessControl = async (id: string, updates: Partial<AppAccessControl>) => {
    try {
      setError(null)
      await updateAccessControl(id, updates)
      
      // ローカル状態を更新
      setAccessControls(accessControls.map(control =>
        control.id === id
          ? { ...control, ...updates, updatedAt: new Date().toISOString() }
          : control
      ))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'アクセス制御設定の更新に失敗しました'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const toggleFeatureAccess = async (feature: string, isEnabled: boolean) => {
    try {
      setError(null)
      await toggleFeature(feature, isEnabled, 'admin_001') // 実際は認証されたユーザーのID
      
      // ローカル状態を更新
      const existingControlIndex = accessControls.findIndex(c => c.feature === feature)
      if (existingControlIndex >= 0) {
        const updatedControls = [...accessControls]
        updatedControls[existingControlIndex] = {
          ...updatedControls[existingControlIndex],
          isEnabled,
          updatedAt: new Date().toISOString()
        }
        setAccessControls(updatedControls)
      } else {
        // 新しい制御設定を追加
        const newControl: AppAccessControl = {
          id: `temp_${Date.now()}`,
          feature,
          isEnabled,
          description: `${feature}機能の制御設定`,
          allowedRoles: ['admin', 'user'],
          maintenanceMode: false,
          updatedBy: 'admin_001',
          updatedAt: new Date().toISOString()
        }
        setAccessControls([...accessControls, newControl])
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '機能の切り替えに失敗しました'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const toggleMaintenanceModeForFeature = async (
    feature: string, 
    maintenanceMode: boolean, 
    maintenanceMessage?: string
  ) => {
    try {
      setError(null)
      await toggleMaintenanceMode(feature, maintenanceMode, maintenanceMessage, 'admin_001')
      
      // ローカル状態を更新
      const existingControlIndex = accessControls.findIndex(c => c.feature === feature)
      if (existingControlIndex >= 0) {
        const updatedControls = [...accessControls]
        updatedControls[existingControlIndex] = {
          ...updatedControls[existingControlIndex],
          maintenanceMode,
          maintenanceMessage,
          updatedAt: new Date().toISOString()
        }
        setAccessControls(updatedControls)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'メンテナンスモードの切り替えに失敗しました'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  return {
    accessControls,
    loading,
    error,
    addAccessControl,
    editAccessControl,
    toggleFeatureAccess,
    toggleMaintenanceModeForFeature,
    refreshAccessControls: fetchAccessControls
  }
}

export function useSystemStatus() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSystemStatus = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getSystemStatus()
      setSystemStatus(data)
    } catch (err) {
      console.error('Error fetching system status:', err)
      setError(err instanceof Error ? err.message : 'システムステータスの読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSystemStatus()
    
    // 30秒ごとにステータスを更新
    const interval = setInterval(fetchSystemStatus, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const updateServiceStatus = async (
    service: string, 
    status: SystemStatus['status'], 
    description: string,
    responseTime?: number
  ) => {
    try {
      setError(null)
      await updateSystemStatus(service, status, description, responseTime)
      
      // ローカル状態を更新
      setSystemStatus(prevStatus =>
        prevStatus.map(s =>
          s.service === service
            ? {
                ...s,
                status,
                description,
                lastChecked: new Date().toISOString(),
                responseTime: responseTime || s.responseTime,
                uptime: status === 'operational' ? 99.9 : status === 'degraded' ? 95.0 : 0
              }
            : s
        )
      )
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'システムステータスの更新に失敗しました'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  return {
    systemStatus,
    loading,
    error,
    updateServiceStatus,
    refreshSystemStatus: fetchSystemStatus
  }
}

export function useFeatureAccess(feature: string) {
  const [accessControl, setAccessControl] = useState<AppAccessControl | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchFeatureAccess = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getAccessControlByFeature(feature)
        setAccessControl(data)
      } catch (err) {
        console.error('Error fetching feature access:', err)
        setError(err instanceof Error ? err.message : '機能アクセス情報の読み込みに失敗しました')
      } finally {
        setLoading(false)
      }
    }

    if (feature) {
      fetchFeatureAccess()
    }
  }, [feature])

  const isFeatureEnabled = accessControl?.isEnabled ?? true
  const isInMaintenance = accessControl?.maintenanceMode ?? false
  const maintenanceMessage = accessControl?.maintenanceMessage

  return {
    accessControl,
    loading,
    error,
    isFeatureEnabled,
    isInMaintenance,
    maintenanceMessage
  }
}
