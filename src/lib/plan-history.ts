import { PlanHistory } from '@/types'
import { db } from './firebase'
import { collection, addDoc, query, where, orderBy, getDocs } from 'firebase/firestore'

/**
 * プラン変更履歴を記録
 */
export async function recordPlanHistory(
  userId: string,
  from: 'ume' | 'take' | 'matsu' | null,
  to: 'ume' | 'take' | 'matsu',
  changedBy: string,
  reason?: string
): Promise<string> {
  try {
    const historyRef = collection(db, 'users', userId, 'planHistory')
    const docRef = await addDoc(historyRef, {
      userId,
      from,
      to,
      changedBy,
      reason: reason || null,
      changedAt: new Date().toISOString(),
    })
    return docRef.id
  } catch (error) {
    console.error('Error recording plan history:', error)
    throw new Error('プラン変更履歴の記録に失敗しました')
  }
}

/**
 * ユーザーのプラン変更履歴を取得
 */
export async function getUserPlanHistory(userId: string): Promise<PlanHistory[]> {
  try {
    const historyRef = collection(db, 'users', userId, 'planHistory')
    const q = query(historyRef, orderBy('changedAt', 'desc'))
    const snapshot = await getDocs(q)
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as PlanHistory))
  } catch (error) {
    console.error('Error fetching plan history:', error)
    return []
  }
}


