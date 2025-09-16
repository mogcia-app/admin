import { collection, getDocs, addDoc } from 'firebase/firestore'
import { db } from './firebase'

// Firebase接続テスト
export async function testFirebaseConnection() {
  try {
    console.log('Testing Firebase connection...')
    
    // テスト用のコレクションに接続を試みる
    const testCollection = collection(db, 'connection_test')
    
    // 簡単なドキュメントを作成してテスト
    const testDoc = await addDoc(testCollection, {
      message: 'Connection test',
      timestamp: new Date().toISOString(),
      test: true
    })
    
    console.log('✅ Firebase connection successful! Test document ID:', testDoc.id)
    
    // テストドキュメントを読み取り
    const snapshot = await getDocs(testCollection)
    console.log('📊 Test collection size:', snapshot.size)
    
    return {
      success: true,
      message: 'Firebase connection is working',
      testDocId: testDoc.id
    }
    
  } catch (error) {
    console.error('❌ Firebase connection failed:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      error
    }
  }
}
