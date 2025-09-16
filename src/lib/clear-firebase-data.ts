import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore'
import { db } from './firebase'

// Firebaseの全データをクリアする関数
export async function clearAllFirebaseData() {
  try {
    console.log('Clearing all Firebase data...')
    
    // ユーザーコレクションをクリア
    const usersCollection = collection(db, 'users')
    const usersSnapshot = await getDocs(usersCollection)
    for (const userDoc of usersSnapshot.docs) {
      await deleteDoc(doc(db, 'users', userDoc.id))
      console.log(`Deleted user: ${userDoc.id}`)
    }
    
    // 管理ログコレクションをクリア
    const adminLogsCollection = collection(db, 'admin_logs')
    const adminLogsSnapshot = await getDocs(adminLogsCollection)
    for (const logDoc of adminLogsSnapshot.docs) {
      await deleteDoc(doc(db, 'admin_logs', logDoc.id))
      console.log(`Deleted log: ${logDoc.id}`)
    }
    
    // ダッシュボード統計をクリア
    const dashboardStatsDoc = doc(db, 'dashboard', 'stats')
    try {
      await deleteDoc(dashboardStatsDoc)
      console.log('Deleted dashboard stats')
    } catch (err) {
      // ドキュメントが存在しない場合は無視
      console.log('Dashboard stats document not found')
    }
    
    console.log('✅ All Firebase data cleared successfully!')
    return true
    
  } catch (error) {
    console.error('❌ Error clearing Firebase data:', error)
    throw error
  }
}
