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
import { PromptTemplate } from '@/types'

const COLLECTION_NAME = 'prompts'

// プロンプト一覧を取得
export async function getPrompts(): Promise<PromptTemplate[]> {
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
    console.error('Error fetching prompts:', error)
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

// プロンプトを作成
export async function createPrompt(promptData: Omit<PromptTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    const now = Timestamp.now()
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...promptData,
      createdAt: now,
      updatedAt: now,
      usageCount: 0
    })
    
    console.log('Prompt created with ID:', docRef.id)
    return docRef.id
  } catch (error) {
    console.error('Error creating prompt:', error)
    throw error
  }
}

// プロンプトを更新
export async function updatePrompt(id: string, updates: Partial<PromptTemplate>): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id)
    const { id: _, createdAt, ...updateData } = updates
    
    await updateDoc(docRef, {
      ...updateData,
      updatedAt: Timestamp.now()
    })
    
    console.log('Prompt updated:', id)
  } catch (error) {
    console.error('Error updating prompt:', error)
    throw error
  }
}

// プロンプトを削除
export async function deletePrompt(id: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id)
    await deleteDoc(docRef)
    
    console.log('Prompt deleted:', id)
  } catch (error) {
    console.error('Error deleting prompt:', error)
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

// プロンプト使用回数を増加
export async function incrementPromptUsage(id: string): Promise<void> {
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
    console.error('Error incrementing prompt usage:', error)
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

// サンプルプロンプトデータを作成
export async function seedPromptData(): Promise<void> {
  try {
    const samplePrompts = [
      {
        name: 'ユーザーサポート応答',
        description: 'ユーザーからの問い合わせに対する丁寧な応答を生成',
        category: 'system' as const,
        prompt: 'あなたは親切なカスタマーサポート担当です。以下の問い合わせに対して、丁寧で分かりやすい回答をしてください。\n\n問い合わせ内容: {{inquiry}}\nユーザー名: {{userName}}',
        variables: [
          { name: 'inquiry', type: 'text' as const, description: '問い合わせ内容', required: true },
          { name: 'userName', type: 'text' as const, description: 'ユーザー名', required: false, defaultValue: 'お客様' }
        ],
        isActive: true,
        createdBy: 'admin_001',
        tags: ['サポート', '顧客対応', '問い合わせ'],
        usageCount: 0
      },
      {
        name: 'コンテンツ要約',
        description: '長いテキストを簡潔に要約',
        category: 'assistant' as const,
        prompt: '以下のテキストを{{length}}文字程度で要約してください。重要なポイントを漏らさず、分かりやすくまとめてください。\n\nテキスト:\n{{content}}',
        variables: [
          { name: 'content', type: 'text' as const, description: '要約するテキスト', required: true },
          { name: 'length', type: 'select' as const, description: '要約の長さ', required: true, defaultValue: '200', options: ['100', '200', '300', '500'] }
        ],
        isActive: true,
        createdBy: 'admin_002',
        tags: ['要約', 'コンテンツ', 'テキスト処理'],
        usageCount: 0
      },
      {
        name: 'マーケティングコピー生成',
        description: '商品やサービスの魅力的なキャッチコピーを生成',
        category: 'custom' as const,
        prompt: '以下の商品・サービスについて、{{tone}}な雰囲気で魅力的なキャッチコピーを{{count}}個生成してください。\n\n商品・サービス名: {{productName}}\n特徴: {{features}}\nターゲット: {{target}}',
        variables: [
          { name: 'productName', type: 'text' as const, description: '商品・サービス名', required: true },
          { name: 'features', type: 'text' as const, description: '主な特徴', required: true },
          { name: 'target', type: 'text' as const, description: 'ターゲット層', required: true },
          { name: 'tone', type: 'select' as const, description: '雰囲気', required: true, defaultValue: '親しみやすい', options: ['親しみやすい', 'プロフェッショナル', 'エネルギッシュ', 'エレガント'] },
          { name: 'count', type: 'select' as const, description: '生成数', required: true, defaultValue: '3', options: ['3', '5', '10'] }
        ],
        isActive: true,
        createdBy: 'admin_003',
        tags: ['マーケティング', 'コピー', '広告'],
        usageCount: 0
      }
    ]

    for (const promptData of samplePrompts) {
      await createPrompt(promptData)
    }

    console.log('✅ Sample prompt data seeded successfully!')
  } catch (error) {
    console.error('❌ Error seeding prompt data:', error)
    throw error
  }
}
