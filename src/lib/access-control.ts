import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  Timestamp,
  limit
} from 'firebase/firestore'
import { db } from './firebase'
import { 
  AppAccessControl, 
  SystemStatus, 
  SystemIncident,
  EmergencySecurityMode,
  SecurityPreset
} from '@/types'

// コレクション名
const COLLECTIONS = {
  ACCESS_CONTROL: 'accessControl',
  SYSTEM_STATUS: 'systemStatus',
  SYSTEM_INCIDENTS: 'systemIncidents',
  EMERGENCY_SECURITY: 'emergencySecurityMode',
  SECURITY_PRESETS: 'securityPresets'
}

// アクセス制御設定の取得
export async function getAccessControlSettings(): Promise<AppAccessControl[]> {
  try {
    const q = query(
      collection(db, COLLECTIONS.ACCESS_CONTROL),
      orderBy('feature')
    )
    const querySnapshot = await getDocs(q)
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt,
    })) as AppAccessControl[]
  } catch (error) {
    console.error('Error fetching access control settings:', error)
    throw error
  }
}

// 特定機能のアクセス制御設定を取得
export async function getAccessControlByFeature(feature: string): Promise<AppAccessControl | null> {
  try {
    const q = query(
      collection(db, COLLECTIONS.ACCESS_CONTROL),
      where('feature', '==', feature),
      limit(1)
    )
    const querySnapshot = await getDocs(q)
    
    if (querySnapshot.empty) return null
    
    const doc = querySnapshot.docs[0]
    return {
      id: doc.id,
      ...doc.data(),
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt,
    } as AppAccessControl
  } catch (error) {
    console.error('Error fetching access control by feature:', error)
    throw error
  }
}

// アクセス制御設定の作成
export async function createAccessControl(controlData: Omit<AppAccessControl, 'id' | 'updatedAt'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.ACCESS_CONTROL), {
      ...controlData,
      updatedAt: Timestamp.now()
    })
    
    console.log('Access control created with ID:', docRef.id)
    return docRef.id
  } catch (error) {
    console.error('Error creating access control:', error)
    throw error
  }
}

// アクセス制御設定の更新
export async function updateAccessControl(id: string, updates: Partial<AppAccessControl>): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.ACCESS_CONTROL, id)
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now()
    })
    
    console.log('Access control updated:', id)
  } catch (error) {
    console.error('Error updating access control:', error)
    throw error
  }
}

// 機能の有効/無効切り替え
export async function toggleFeature(feature: string, isEnabled: boolean, updatedBy: string): Promise<void> {
  try {
    const existingControl = await getAccessControlByFeature(feature)
    
    if (existingControl) {
      await updateAccessControl(existingControl.id, {
        isEnabled,
        updatedBy
      })
    } else {
      await createAccessControl({
        feature,
        isEnabled,
        description: `${feature}機能の制御設定`,
        allowedRoles: ['admin', 'user'],
        maintenanceMode: false,
        updatedBy
      })
    }
    
    console.log(`Feature ${feature} ${isEnabled ? 'enabled' : 'disabled'}`)
  } catch (error) {
    console.error('Error toggling feature:', error)
    throw error
  }
}

// メンテナンスモードの切り替え
export async function toggleMaintenanceMode(
  feature: string, 
  maintenanceMode: boolean, 
  maintenanceMessage: string | undefined,
  updatedBy: string
): Promise<void> {
  try {
    const existingControl = await getAccessControlByFeature(feature)
    
    if (existingControl) {
      await updateAccessControl(existingControl.id, {
        maintenanceMode,
        maintenanceMessage,
        updatedBy
      })
    } else {
      await createAccessControl({
        feature,
        isEnabled: !maintenanceMode,
        description: `${feature}のメンテナンス制御`,
        allowedRoles: ['admin'],
        maintenanceMode,
        maintenanceMessage,
        updatedBy
      })
    }
    
    console.log(`Maintenance mode for ${feature} ${maintenanceMode ? 'enabled' : 'disabled'}`)
  } catch (error) {
    console.error('Error toggling maintenance mode:', error)
    throw error
  }
}

// システムステータスの取得
export async function getSystemStatus(): Promise<SystemStatus[]> {
  try {
    const q = query(
      collection(db, COLLECTIONS.SYSTEM_STATUS),
      orderBy('service')
    )
    const querySnapshot = await getDocs(q)
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      lastChecked: doc.data().lastChecked?.toDate?.()?.toISOString() || doc.data().lastChecked,
      incidents: doc.data().incidents || []
    })) as SystemStatus[]
  } catch (error) {
    console.error('Error fetching system status:', error)
    throw error
  }
}

// システムステータスの更新
export async function updateSystemStatus(
  service: string, 
  status: SystemStatus['status'], 
  description: string,
  responseTime?: number
): Promise<void> {
  try {
    const q = query(
      collection(db, COLLECTIONS.SYSTEM_STATUS),
      where('service', '==', service),
      limit(1)
    )
    const querySnapshot = await getDocs(q)
    
    const statusData = {
      service,
      status,
      description,
      lastChecked: Timestamp.now(),
      responseTime: responseTime || null,
      uptime: status === 'operational' ? 99.9 : status === 'degraded' ? 95.0 : 0,
      incidents: []
    }
    
    if (!querySnapshot.empty) {
      const docRef = doc(db, COLLECTIONS.SYSTEM_STATUS, querySnapshot.docs[0].id)
      await updateDoc(docRef, statusData)
    } else {
      await addDoc(collection(db, COLLECTIONS.SYSTEM_STATUS), statusData)
    }
    
    console.log(`System status updated for ${service}: ${status}`)
  } catch (error) {
    console.error('Error updating system status:', error)
    throw error
  }
}

// インシデントの作成
export async function createSystemIncident(incidentData: Omit<SystemIncident, 'id' | 'updates'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.SYSTEM_INCIDENTS), {
      ...incidentData,
      updates: [],
      startTime: Timestamp.now()
    })
    
    console.log('System incident created with ID:', docRef.id)
    return docRef.id
  } catch (error) {
    console.error('Error creating system incident:', error)
    throw error
  }
}

// 緊急セキュリティモードの取得
export async function getEmergencySecurityMode(): Promise<EmergencySecurityMode | null> {
  try {
    const q = query(
      collection(db, COLLECTIONS.EMERGENCY_SECURITY),
      where('isActive', '==', true),
      limit(1)
    )
    const querySnapshot = await getDocs(q)
    
    if (querySnapshot.empty) return null
    
    const doc = querySnapshot.docs[0]
    return {
      id: doc.id,
      ...doc.data(),
      startedAt: doc.data().startedAt?.toDate?.()?.toISOString() || doc.data().startedAt,
      estimatedResolution: doc.data().estimatedResolution?.toDate?.()?.toISOString() || doc.data().estimatedResolution,
      autoDisableAt: doc.data().autoDisableAt?.toDate?.()?.toISOString() || doc.data().autoDisableAt,
    } as EmergencySecurityMode
  } catch (error) {
    console.error('Error fetching emergency security mode:', error)
    throw error
  }
}

// 緊急セキュリティモードの有効化
export async function activateEmergencySecurityMode(
  modeData: Omit<EmergencySecurityMode, 'id' | 'isActive' | 'startedAt' | 'startedBy'>,
  startedBy: string
): Promise<string> {
  try {
    // 既存のアクティブなモードを無効化
    const existingMode = await getEmergencySecurityMode()
    if (existingMode) {
      await updateDoc(doc(db, COLLECTIONS.EMERGENCY_SECURITY, existingMode.id), {
        isActive: false
      })
    }
    
    // 新しいモードを有効化
    const docRef = await addDoc(collection(db, COLLECTIONS.EMERGENCY_SECURITY), {
      ...modeData,
      isActive: true,
      startedBy,
      startedAt: Timestamp.now()
    })
    
    // 影響を受ける機能を自動的にメンテナンスモードに
    if (modeData.affectedFeatures && modeData.affectedFeatures.length > 0) {
      for (const feature of modeData.affectedFeatures) {
        await toggleMaintenanceMode(
          feature,
          true,
          modeData.maintenanceMessage,
          startedBy
        )
      }
    }
    
    console.log('Emergency security mode activated:', docRef.id)
    return docRef.id
  } catch (error) {
    console.error('Error activating emergency security mode:', error)
    throw error
  }
}

// 緊急セキュリティモードの無効化
export async function deactivateEmergencySecurityMode(
  modeId: string,
  deactivatedBy: string
): Promise<void> {
  try {
    const modeDoc = await getDoc(doc(db, COLLECTIONS.EMERGENCY_SECURITY, modeId))
    if (!modeDoc.exists()) {
      throw new Error('Emergency security mode not found')
    }
    
    const modeData = modeDoc.data() as EmergencySecurityMode
    
    // モードを無効化
    await updateDoc(doc(db, COLLECTIONS.EMERGENCY_SECURITY, modeId), {
      isActive: false
    })
    
    // 影響を受けた機能のメンテナンスモードを解除（オプション）
    // 注意: 自動解除は危険な場合があるため、手動確認を推奨
    
    console.log('Emergency security mode deactivated:', modeId)
  } catch (error) {
    console.error('Error deactivating emergency security mode:', error)
    throw error
  }
}

// セキュリティプリセットの取得
export async function getSecurityPresets(): Promise<SecurityPreset[]> {
  try {
    const q = query(
      collection(db, COLLECTIONS.SECURITY_PRESETS),
      orderBy('name')
    )
    const querySnapshot = await getDocs(q)
    
    // プリセットが存在しない場合はデフォルトプリセットを作成
    if (querySnapshot.empty) {
      try {
        await initializeDefaultPresets()
        // 再取得
        const retrySnapshot = await getDocs(q)
        return retrySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as SecurityPreset[]
      } catch (initError) {
        console.error('Error initializing default presets:', initError)
        // 初期化に失敗した場合は空配列を返す
        return []
      }
    }
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as SecurityPreset[]
  } catch (error) {
    console.error('Error fetching security presets:', error)
    // エラーが発生した場合は空配列を返す（フォールバック）
    return []
  }
}

// デフォルトセキュリティプリセットの初期化
export async function initializeDefaultPresets(): Promise<void> {
  try {
    const defaultPresets: Omit<SecurityPreset, 'id'>[] = [
      {
        name: 'React Server Components 脆弱性対応',
        description: 'RSC脆弱性（CVE-2025-55182等）対応時の緊急モード',
        mode: 'vulnerability_response',
        affectedFeatures: ['ai_assistant', 'api_access'],
        blockedUserGroups: ['new_users'],
        blockedActions: ['api_access', 'ai_features'],
        maintenanceMessage: 'セキュリティ上の理由により、一部機能を一時的に制限しています。パッチ適用後、順次復旧いたします。',
        recommendedActions: [
          'React 19.1.2 以上、Next.js 15.5.7 以上に即座にアップグレード',
          '影響を受ける機能のみ部分ブロック',
          '新規ユーザー登録を一時停止',
          '既存ユーザーには影響を最小限に'
        ]
      },
      {
        name: '緊急全ブロック',
        description: '重大な脆弱性発見時、全ユーザーのログインをブロック',
        mode: 'full_block',
        affectedFeatures: [],
        blockedUserGroups: ['all'],
        blockedActions: ['login', 'registration'],
        maintenanceMessage: '重大なセキュリティ問題が発見されたため、サービスを一時的に停止しています。',
        recommendedActions: [
          '全ログインをブロック',
          '新規登録を停止',
          'セキュリティパッチの適用',
          '影響範囲の確認完了後に復旧'
        ]
      },
      {
        name: '部分ブロック（新規ユーザー制限）',
        description: '新規ユーザーの登録とログインのみをブロック',
        mode: 'partial_block',
        affectedFeatures: [],
        blockedUserGroups: ['new_users'],
        blockedActions: ['registration'],
        maintenanceMessage: '現在、新規ユーザー登録を一時的に停止しています。既存ユーザーは通常通りご利用いただけます。',
        recommendedActions: [
          '新規ユーザー登録のみブロック',
          '既存ユーザーは通常利用可能',
          '問題解決後に登録を再開'
        ]
      },
      {
        name: 'ファイルアップロード制限',
        description: 'ファイルアップロード機能に脆弱性が発見された場合',
        mode: 'partial_block',
        affectedFeatures: ['file_upload'],
        blockedUserGroups: ['all'],
        blockedActions: ['file_upload'],
        maintenanceMessage: 'ファイルアップロード機能を一時的に停止しています。',
        recommendedActions: [
          'ファイルアップロード機能のみ無効化',
          '他の機能は通常通り利用可能',
          'セキュリティパッチ適用後に復旧'
        ]
      },
      {
        name: 'AI機能制限',
        description: 'AI関連機能に脆弱性が発見された場合',
        mode: 'partial_block',
        affectedFeatures: ['ai_assistant', 'prompt_management'],
        blockedUserGroups: ['all'],
        blockedActions: ['ai_features'],
        maintenanceMessage: 'AI関連機能を一時的に停止しています。',
        recommendedActions: [
          'AI機能のみ無効化',
          'その他の機能は利用可能',
          'セキュリティパッチ適用後に復旧'
        ]
      }
    ]

    // 各プリセットを作成（重複チェック付き）
    for (const preset of defaultPresets) {
      const q = query(
        collection(db, COLLECTIONS.SECURITY_PRESETS),
        where('name', '==', preset.name),
        limit(1)
      )
      const existing = await getDocs(q)
      
      if (existing.empty) {
        await addDoc(collection(db, COLLECTIONS.SECURITY_PRESETS), preset)
      }
    }

    console.log('Default security presets initialized')
  } catch (error) {
    console.error('Error initializing default presets:', error)
    throw error
  }
}

// サンプルアクセス制御データの作成
