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
  SystemIncident 
} from '@/types'

// コレクション名
const COLLECTIONS = {
  ACCESS_CONTROL: 'accessControl',
  SYSTEM_STATUS: 'systemStatus',
  SYSTEM_INCIDENTS: 'systemIncidents'
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

// サンプルアクセス制御データの作成
