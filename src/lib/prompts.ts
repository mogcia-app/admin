import { PromptTemplate } from '@/types'
import { API_ENDPOINTS, apiGet, apiPost, apiPut, apiDelete } from './api-config'

// 後方互換性のために残しておく（Firestore直接アクセス用）
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
  Timestamp 
} from 'firebase/firestore'
import { db } from './firebase'

const COLLECTION_NAME = 'promptTemplates' // Cloud Functionsと同じコレクション名

// プロンプト一覧を取得 (Cloud Functions API使用)
export async function getPrompts(category?: string, search?: string, isActive?: boolean): Promise<PromptTemplate[]> {
  try {
    const params: Record<string, string> = {}
    if (category) params.category = category
    if (search) params.search = search
    if (isActive !== undefined) params.isActive = isActive.toString()

    const response = await apiGet(API_ENDPOINTS.prompts.list, params)
    return response.prompts || []
  } catch (error) {
    console.error('Error fetching prompts from API:', error)
    // フォールバック: Firestore直接アクセス
    return getPromptsFromFirestore()
  }
}

// Firestoreから直接取得（フォールバック用）
async function getPromptsFromFirestore(): Promise<PromptTemplate[]> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME), 
      orderBy('createdAt', 'desc')
    )
    const querySnapshot = await getDocs(q)
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt,
    })) as PromptTemplate[]
  } catch (error) {
    console.error('Error fetching prompts from Firestore:', error)
    throw error
  }
}

// 特定のプロンプトを取得
export async function getPrompt(id: string): Promise<PromptTemplate | null> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id)
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      const data = docSnap.data()
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
      } as PromptTemplate
    }
    
    return null
  } catch (error) {
    console.error('Error fetching prompt:', error)
    throw error
  }
}

// プロンプトを作成 (Cloud Functions API使用)
export async function createPrompt(promptData: Omit<PromptTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    const response = await apiPost(API_ENDPOINTS.prompts.create, {
      ...promptData,
      createdBy: promptData.createdBy || 'admin_user', // デフォルト値
    })
    
    console.log('Prompt created with ID:', response.id)
    return response.id
  } catch (error) {
    console.error('Error creating prompt via API:', error)
    // フォールバック: Firestore直接アクセス
    return createPromptInFirestore(promptData)
  }
}

// Firestoreに直接作成（フォールバック用）
async function createPromptInFirestore(promptData: Omit<PromptTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    const now = Timestamp.now()
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...promptData,
      createdAt: now,
      updatedAt: now,
      usageCount: 0
    })
    
    console.log('Prompt created with ID (Firestore):', docRef.id)
    return docRef.id
  } catch (error) {
    console.error('Error creating prompt in Firestore:', error)
    throw error
  }
}

// プロンプトを更新 (Cloud Functions API使用)
export async function updatePrompt(id: string, updates: Partial<PromptTemplate>): Promise<void> {
  try {
    const { id: _, createdAt, ...updateData } = updates
    const url = `${API_ENDPOINTS.prompts.update}?id=${id}`
    
    await apiPut(url, updateData)
    console.log('Prompt updated via API:', id)
  } catch (error) {
    console.error('Error updating prompt via API:', error)
    // フォールバック: Firestore直接アクセス
    return updatePromptInFirestore(id, updates)
  }
}

// Firestoreで直接更新（フォールバック用）
async function updatePromptInFirestore(id: string, updates: Partial<PromptTemplate>): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id)
    const { id: _, createdAt, ...updateData } = updates
    
    await updateDoc(docRef, {
      ...updateData,
      updatedAt: Timestamp.now()
    })
    
    console.log('Prompt updated (Firestore):', id)
  } catch (error) {
    console.error('Error updating prompt in Firestore:', error)
    throw error
  }
}

// プロンプトを削除 (Cloud Functions API使用)
export async function deletePrompt(id: string): Promise<void> {
  try {
    const url = `${API_ENDPOINTS.prompts.delete}?id=${id}`
    await apiDelete(url)
    console.log('Prompt deleted via API:', id)
  } catch (error) {
    console.error('Error deleting prompt via API:', error)
    // フォールバック: Firestore直接アクセス
    return deletePromptFromFirestore(id)
  }
}

// Firestoreから直接削除（フォールバック用）
async function deletePromptFromFirestore(id: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id)
    await deleteDoc(docRef)
    
    console.log('Prompt deleted (Firestore):', id)
  } catch (error) {
    console.error('Error deleting prompt from Firestore:', error)
    throw error
  }
}

// カテゴリ別プロンプトを取得
export async function getPromptsByCategory(category: string): Promise<PromptTemplate[]> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME), 
      where('category', '==', category),
      orderBy('createdAt', 'desc')
    )
    const querySnapshot = await getDocs(q)
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt,
    })) as PromptTemplate[]
  } catch (error) {
    console.error('Error fetching prompts by category:', error)
    throw error
  }
}

// アクティブなプロンプトのみ取得
export async function getActivePrompts(): Promise<PromptTemplate[]> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME), 
      where('isActive', '==', true),
      orderBy('createdAt', 'desc')
    )
    const querySnapshot = await getDocs(q)
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt,
    })) as PromptTemplate[]
  } catch (error) {
    console.error('Error fetching active prompts:', error)
    throw error
  }
}

// プロンプト使用回数を増加 (Cloud Functions API使用)
export async function incrementPromptUsage(id: string): Promise<void> {
  try {
    const url = `${API_ENDPOINTS.prompts.incrementUsage}?id=${id}`
    await apiPost(url, {})
    console.log('Prompt usage incremented via API:', id)
  } catch (error) {
    console.error('Error incrementing prompt usage via API:', error)
    // フォールバック: Firestore直接アクセス
    return incrementPromptUsageInFirestore(id)
  }
}

// Firestoreで直接使用回数増加（フォールバック用）
async function incrementPromptUsageInFirestore(id: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id)
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      const currentUsage = docSnap.data().usageCount || 0
      await updateDoc(docRef, {
        usageCount: currentUsage + 1,
        updatedAt: Timestamp.now()
      })
    }
  } catch (error) {
    console.error('Error incrementing prompt usage in Firestore:', error)
    throw error
  }
}

// リアルタイムプロンプト監視
export function subscribeToPrompts(callback: (prompts: PromptTemplate[]) => void) {
  const q = query(
    collection(db, COLLECTION_NAME), 
    orderBy('createdAt', 'desc')
  )
  
  return onSnapshot(q, (querySnapshot) => {
    const prompts = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt,
    })) as PromptTemplate[]
    
    callback(prompts)
  }, (error) => {
    console.error('Error in prompts subscription:', error)
  })
}

// プロンプトテンプレートの変数を置換
export function replacePromptVariables(
  prompt: string, 
  variables: Record<string, any>
): string {
  let result = prompt
  
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g')
    result = result.replace(regex, String(value))
  })
  
  return result
}

// プロンプトの検証
export function validatePrompt(prompt: PromptTemplate): string[] {
  const errors: string[] = []
  
  if (!prompt.name?.trim()) {
    errors.push('プロンプト名は必須です')
  }
  
  if (!prompt.prompt?.trim()) {
    errors.push('プロンプト内容は必須です')
  }
  
  if (!prompt.category) {
    errors.push('カテゴリは必須です')
  }
  
  // 変数の検証
  if (prompt.variables) {
    prompt.variables.forEach((variable, index) => {
      if (!variable.name?.trim()) {
        errors.push(`変数${index + 1}: 変数名は必須です`)
      }
      if (!variable.description?.trim()) {
        errors.push(`変数${index + 1}: 説明は必須です`)
      }
    })
  }
  
  return errors
}

