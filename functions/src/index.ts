import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

// Firebase Admin SDKの初期化
admin.initializeApp()

// ユーザー管理関数
export const getUsers = functions.https.onRequest(async (req, res) => {
  try {
    // CORSヘッダーの設定
    res.set('Access-Control-Allow-Origin', '*')
    res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE')
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    if (req.method === 'OPTIONS') {
      res.status(204).send('')
      return
    }

    if (req.method !== 'GET') {
      res.status(405).json({ error: 'Method not allowed' })
      return
    }

    // Firestoreからユーザー一覧を取得
    const usersSnapshot = await admin.firestore().collection('users').get()
    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    res.status(200).json({ users })
  } catch (error) {
    console.error('Error getting users:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ユーザー作成関数
export const createUser = functions.https.onRequest(async (req, res) => {
  try {
    // CORSヘッダーの設定
    res.set('Access-Control-Allow-Origin', '*')
    res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE')
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    if (req.method === 'OPTIONS') {
      res.status(204).send('')
      return
    }

    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' })
      return
    }

    const { name, email, role = 'user' } = req.body

    if (!name || !email) {
      res.status(400).json({ error: 'Name and email are required' })
      return
    }

    // Firestoreにユーザーを作成
    const userRef = await admin.firestore().collection('users').add({
      name,
      email,
      role,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      isActive: true
    })

    const newUser = await userRef.get()
    res.status(201).json({ id: newUser.id, ...newUser.data() })
  } catch (error) {
    console.error('Error creating user:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ダッシュボードデータ取得関数
export const getDashboardData = functions.https.onRequest(async (req, res) => {
  try {
    // CORSヘッダーの設定
    res.set('Access-Control-Allow-Origin', '*')
    res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE')
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    if (req.method === 'OPTIONS') {
      res.status(204).send('')
      return
    }

    if (req.method !== 'GET') {
      res.status(405).json({ error: 'Method not allowed' })
      return
    }

    // 統計情報の取得
    const usersSnapshot = await admin.firestore().collection('users').get()
    const totalUsers = usersSnapshot.size
    
    const activeUsersSnapshot = await admin.firestore()
      .collection('users')
      .where('isActive', '==', true)
      .get()
    const activeUsers = activeUsersSnapshot.size

    const dashboardData = {
      stats: {
        totalUsers,
        activeUsers,
        totalRevenue: 2340000, // 実際のアプリではデータベースから取得
        monthlyGrowth: 23.1
      },
      recentActivity: [
        {
          id: '1',
          type: 'user_registration',
          message: '新規ユーザー登録',
          timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
        },
        {
          id: '2',
          type: 'system_update',
          message: 'システム更新完了',
          timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        }
      ]
    }

    res.status(200).json(dashboardData)
  } catch (error) {
    console.error('Error getting dashboard data:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})
