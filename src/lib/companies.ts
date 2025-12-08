import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, getDoc, query, where, Timestamp } from 'firebase/firestore'
import { db } from './firebase'
import { Company } from '@/types'

const COLLECTIONS = {
  COMPANIES: 'companies',
  USERS: 'users'
}

// 企業一覧の取得
export async function getCompanies(): Promise<Company[]> {
  try {
    const q = query(collection(db, COLLECTIONS.COMPANIES))
    const querySnapshot = await getDocs(q)
    
    const companies = await Promise.all(querySnapshot.docs.map(async (docSnapshot) => {
      const data = docSnapshot.data()
      const companyId = docSnapshot.id
      
      // この企業に所属するユーザー数を取得
      const usersQuery = query(
        collection(db, COLLECTIONS.USERS),
        where('companyId', '==', companyId)
      )
      const usersSnapshot = await getDocs(usersQuery)
      const userCount = usersSnapshot.size
      const activeUserCount = usersSnapshot.docs.filter(
        doc => doc.data().isActive === true
      ).length
      
      return {
        id: docSnapshot.id,
        ...data,
        userCount,
        activeUserCount,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
        contractStartDate: data.contractStartDate?.toDate?.()?.toISOString() || data.contractStartDate,
        contractEndDate: data.contractEndDate?.toDate?.()?.toISOString() || data.contractEndDate,
      } as Company
    }))
    
    return companies
  } catch (error) {
    console.error('Error fetching companies:', error)
    throw error
  }
}

// 企業の取得（ID指定）
export async function getCompanyById(companyId: string): Promise<Company | null> {
  try {
    const docRef = doc(db, COLLECTIONS.COMPANIES, companyId)
    const docSnap = await getDoc(docRef)
    
    if (!docSnap.exists()) {
      return null
    }
    
    const data = docSnap.data()
    
    // この企業に所属するユーザー数を取得
    const usersQuery = query(
      collection(db, COLLECTIONS.USERS),
      where('companyId', '==', companyId)
    )
    const usersSnapshot = await getDocs(usersQuery)
    const userCount = usersSnapshot.size
    const activeUserCount = usersSnapshot.docs.filter(
      doc => doc.data().isActive === true
    ).length
    
    return {
      id: docSnap.id,
      ...data,
      userCount,
      activeUserCount,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
      contractStartDate: data.contractStartDate?.toDate?.()?.toISOString() || data.contractStartDate,
      contractEndDate: data.contractEndDate?.toDate?.()?.toISOString() || data.contractEndDate,
    } as Company
  } catch (error) {
    console.error('Error fetching company:', error)
    throw error
  }
}

// 企業の作成
export async function createCompany(
  companyData: Omit<Company, 'id' | 'createdAt' | 'updatedAt' | 'userCount' | 'activeUserCount'>,
  createdBy: string
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.COMPANIES), {
      ...companyData,
      userCount: 0,
      activeUserCount: 0,
      createdBy,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      contractStartDate: companyData.contractStartDate ? Timestamp.fromDate(new Date(companyData.contractStartDate)) : null,
      contractEndDate: companyData.contractEndDate ? Timestamp.fromDate(new Date(companyData.contractEndDate)) : null,
    })
    
    return docRef.id
  } catch (error) {
    console.error('Error creating company:', error)
    throw error
  }
}

// 企業の更新
export async function updateCompany(
  companyId: string,
  updates: Partial<Omit<Company, 'id' | 'createdAt' | 'updatedAt' | 'userCount' | 'activeUserCount'>>
): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.COMPANIES, companyId)
    
    const updateData: any = {
      ...updates,
      updatedAt: Timestamp.now(),
    }
    
    // 日付フィールドの変換
    if (updates.contractStartDate) {
      updateData.contractStartDate = Timestamp.fromDate(new Date(updates.contractStartDate))
    }
    if (updates.contractEndDate) {
      updateData.contractEndDate = Timestamp.fromDate(new Date(updates.contractEndDate))
    }
    
    await updateDoc(docRef, updateData)
  } catch (error) {
    console.error('Error updating company:', error)
    throw error
  }
}

// 企業の削除
export async function deleteCompany(companyId: string): Promise<void> {
  try {
    // この企業に所属するユーザーがいるか確認
    const usersQuery = query(
      collection(db, COLLECTIONS.USERS),
      where('companyId', '==', companyId)
    )
    const usersSnapshot = await getDocs(usersQuery)
    
    if (usersSnapshot.size > 0) {
      throw new Error('この企業に所属するユーザーが存在するため、削除できません。先にユーザーの企業紐付けを解除してください。')
    }
    
    await deleteDoc(doc(db, COLLECTIONS.COMPANIES, companyId))
  } catch (error) {
    console.error('Error deleting company:', error)
    throw error
  }
}

// 企業に所属するユーザー一覧の取得
export async function getUsersByCompany(companyId: string) {
  try {
    const q = query(
      collection(db, COLLECTIONS.USERS),
      where('companyId', '==', companyId)
    )
    const querySnapshot = await getDocs(q)
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  } catch (error) {
    console.error('Error fetching users by company:', error)
    throw error
  }
}

