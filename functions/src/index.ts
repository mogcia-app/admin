import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import cors from 'cors'

// Firebase Admin SDKの初期化
admin.initializeApp()
const corsHandler = cors({ origin: true })

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

// =============================================================================
// プロンプト管理API
// =============================================================================

// プロンプト一覧取得
export const getPrompts = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    try {
      // クエリパラメータの取得
      const category = req.query.category as string
      const search = req.query.search as string
      const isActive = req.query.isActive as string

      let queryRef: any = admin.firestore().collection('promptTemplates')

      // フィルター適用
      if (category && category !== 'all') {
        queryRef = queryRef.where('category', '==', category)
      }
      if (isActive !== undefined) {
        queryRef = queryRef.where('isActive', '==', isActive === 'true')
      }

      const snapshot = await queryRef.orderBy('createdAt', 'desc').get()
      let prompts = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      }))

      // 検索フィルター（クライアントサイド）
      if (search) {
        const searchLower = search.toLowerCase()
        prompts = prompts.filter((prompt: any) => 
          prompt.name?.toLowerCase().includes(searchLower) ||
          prompt.description?.toLowerCase().includes(searchLower) ||
          prompt.tags?.some((tag: string) => tag.toLowerCase().includes(searchLower))
        )
      }

      res.status(200).json({ prompts })
    } catch (error) {
      console.error('Error getting prompts:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  })
})

// プロンプト作成
export const createPrompt = functions.https.onRequest(async (req, res) => {
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

    const { name, description, category, prompt, variables, tags, isActive, createdBy } = req.body

    // バリデーション
    if (!name || !prompt || !createdBy) {
      res.status(400).json({ error: 'Name, prompt, and createdBy are required' })
      return
    }

    // Firestoreにプロンプトを作成
    const promptRef = await admin.firestore().collection('promptTemplates').add({
      name,
      description: description || '',
      category: category || 'custom',
      prompt,
      variables: variables || [],
      tags: tags || [],
      isActive: isActive !== undefined ? isActive : true,
      usageCount: 0,
      createdBy,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    })

    const newPrompt = await promptRef.get()
    res.status(201).json({ id: newPrompt.id, ...newPrompt.data() })
  } catch (error) {
    console.error('Error creating prompt:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// プロンプト更新
export const updatePrompt = functions.https.onRequest(async (req, res) => {
  try {
    // CORSヘッダーの設定
    res.set('Access-Control-Allow-Origin', '*')
    res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE')
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    if (req.method === 'OPTIONS') {
      res.status(204).send('')
      return
    }

    if (req.method !== 'PUT') {
      res.status(405).json({ error: 'Method not allowed' })
      return
    }

    const promptId = req.query.id as string
    if (!promptId) {
      res.status(400).json({ error: 'Prompt ID is required' })
      return
    }

    const updateData = { ...req.body }
    delete updateData.id // IDは更新しない
    updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp()

    await admin.firestore().collection('promptTemplates').doc(promptId).update(updateData)

    const updatedPrompt = await admin.firestore().collection('promptTemplates').doc(promptId).get()
    res.status(200).json({ id: updatedPrompt.id, ...updatedPrompt.data() })
  } catch (error) {
    console.error('Error updating prompt:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// プロンプト削除
export const deletePrompt = functions.https.onRequest(async (req, res) => {
  try {
    // CORSヘッダーの設定
    res.set('Access-Control-Allow-Origin', '*')
    res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE')
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    if (req.method === 'OPTIONS') {
      res.status(204).send('')
      return
    }

    if (req.method !== 'DELETE') {
      res.status(405).json({ error: 'Method not allowed' })
      return
    }

    const promptId = req.query.id as string
    if (!promptId) {
      res.status(400).json({ error: 'Prompt ID is required' })
      return
    }

    await admin.firestore().collection('promptTemplates').doc(promptId).delete()
    res.status(200).json({ message: 'Prompt deleted successfully' })
  } catch (error) {
    console.error('Error deleting prompt:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// プロンプト使用回数増加
export const incrementPromptUsage = functions.https.onRequest(async (req, res) => {
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

    const promptId = req.query.id as string
    if (!promptId) {
      res.status(400).json({ error: 'Prompt ID is required' })
      return
    }

    await admin.firestore().collection('promptTemplates').doc(promptId).update({
      usageCount: admin.firestore.FieldValue.increment(1),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    })

    res.status(200).json({ message: 'Usage count incremented successfully' })
  } catch (error) {
    console.error('Error incrementing prompt usage:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// =============================================================================
// KPI・分析データAPI
// =============================================================================

// KPIメトリクス取得
export const getKPIMetrics = functions.https.onRequest(async (req, res) => {
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

    const category = req.query.category as string

    let queryRef: any = admin.firestore().collection('kpiMetrics')

    if (category) {
      queryRef = queryRef.where('category', '==', category)
    }

    const snapshot = await queryRef.orderBy('date', 'desc').limit(100).get()
    const metrics = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    }))

    res.status(200).json({ metrics })
  } catch (error) {
    console.error('Error getting KPI metrics:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// 売上データ取得
export const getRevenueData = functions.https.onRequest(async (req, res) => {
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

    const startDate = req.query.startDate as string
    const endDate = req.query.endDate as string

    let queryRef: any = admin.firestore().collection('revenueData')

    if (startDate && endDate) {
      queryRef = queryRef.where('date', '>=', startDate).where('date', '<=', endDate)
    }

    const snapshot = await queryRef.orderBy('date', 'asc').get()
    const revenueData = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    }))

    res.status(200).json({ revenueData })
  } catch (error) {
    console.error('Error getting revenue data:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ユーザー獲得データ取得
export const getUserAcquisitionData = functions.https.onRequest(async (req, res) => {
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

    const period = req.query.period as string || '30'

    const snapshot = await admin.firestore()
      .collection('userAcquisition')
      .orderBy('date', 'desc')
      .limit(parseInt(period))
      .get()

    const userAcquisitionData = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    })).reverse() // 日付順にソート

    res.status(200).json({ userAcquisitionData })
  } catch (error) {
    console.error('Error getting user acquisition data:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// エンゲージメントメトリクス取得
export const getEngagementMetrics = functions.https.onRequest(async (req, res) => {
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

    const snapshot = await admin.firestore()
      .collection('engagementMetrics')
      .orderBy('date', 'desc')
      .limit(30)
      .get()

    const engagementMetrics = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    }))

    res.status(200).json({ engagementMetrics })
  } catch (error) {
    console.error('Error getting engagement metrics:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// リテンションメトリクス取得
export const getRetentionMetrics = functions.https.onRequest(async (req, res) => {
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

    const snapshot = await admin.firestore()
      .collection('retentionMetrics')
      .orderBy('cohort', 'desc')
      .limit(12)
      .get()

    const retentionMetrics = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    }))

    res.status(200).json({ retentionMetrics })
  } catch (error) {
    console.error('Error getting retention metrics:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// コンバージョンファネル取得
export const getConversionFunnel = functions.https.onRequest(async (req, res) => {
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

    const snapshot = await admin.firestore()
      .collection('conversionFunnels')
      .orderBy('updatedAt', 'desc')
      .limit(1)
      .get()

    const conversionFunnel = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    }))[0] || null

    res.status(200).json({ conversionFunnel })
  } catch (error) {
    console.error('Error getting conversion funnel:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// =============================================================================
// 通知管理API
// =============================================================================

// 通知一覧取得
export const getNotifications = functions.https.onRequest(async (req, res) => {
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

    const type = req.query.type as string
    const status = req.query.status as string
    const limit = parseInt(req.query.limit as string) || 50

    let queryRef: any = admin.firestore().collection('notifications')

    if (type) {
      queryRef = queryRef.where('type', '==', type)
    }
    if (status) {
      queryRef = queryRef.where('status', '==', status)
    }

    const snapshot = await queryRef.orderBy('createdAt', 'desc').limit(limit).get()
    const notifications = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    }))

    res.status(200).json({ notifications })
  } catch (error) {
    console.error('Error getting notifications:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// 通知作成
export const createNotification = functions.https.onRequest(async (req, res) => {
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

    const { title, message, type, targetUsers, scheduledAt, priority, createdBy } = req.body

    // バリデーション
    if (!title || !message || !createdBy) {
      res.status(400).json({ error: 'Title, message, and createdBy are required' })
      return
    }

    // Firestoreに通知を作成
    const notificationRef = await admin.firestore().collection('notifications').add({
      title,
      message,
      type: type || 'info',
      targetUsers: targetUsers || 'all',
      priority: priority || 'medium',
      status: scheduledAt ? 'scheduled' : 'sent',
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      sentAt: scheduledAt ? null : admin.firestore.FieldValue.serverTimestamp(),
      readCount: 0,
      totalTargets: 0, // 実際の送信時に計算
      createdBy,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    })

    const newNotification = await notificationRef.get()
    res.status(201).json({ id: newNotification.id, ...newNotification.data() })
  } catch (error) {
    console.error('Error creating notification:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// 通知更新
export const updateNotification = functions.https.onRequest(async (req, res) => {
  try {
    // CORSヘッダーの設定
    res.set('Access-Control-Allow-Origin', '*')
    res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE')
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    if (req.method === 'OPTIONS') {
      res.status(204).send('')
      return
    }

    if (req.method !== 'PUT') {
      res.status(405).json({ error: 'Method not allowed' })
      return
    }

    const notificationId = req.query.id as string
    if (!notificationId) {
      res.status(400).json({ error: 'Notification ID is required' })
      return
    }

    const updateData = { ...req.body }
    delete updateData.id
    updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp()

    await admin.firestore().collection('notifications').doc(notificationId).update(updateData)

    const updatedNotification = await admin.firestore().collection('notifications').doc(notificationId).get()
    res.status(200).json({ id: updatedNotification.id, ...updatedNotification.data() })
  } catch (error) {
    console.error('Error updating notification:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// 通知削除
export const deleteNotification = functions.https.onRequest(async (req, res) => {
  try {
    // CORSヘッダーの設定
    res.set('Access-Control-Allow-Origin', '*')
    res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE')
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    if (req.method === 'OPTIONS') {
      res.status(204).send('')
      return
    }

    if (req.method !== 'DELETE') {
      res.status(405).json({ error: 'Method not allowed' })
      return
    }

    const notificationId = req.query.id as string
    if (!notificationId) {
      res.status(400).json({ error: 'Notification ID is required' })
      return
    }

    await admin.firestore().collection('notifications').doc(notificationId).delete()
    res.status(200).json({ message: 'Notification deleted successfully' })
  } catch (error) {
    console.error('Error deleting notification:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// 通知統計取得
export const getNotificationStats = functions.https.onRequest(async (req, res) => {
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

    // 各ステータスの通知数を取得
    const [totalSnapshot, sentSnapshot, scheduledSnapshot, draftSnapshot] = await Promise.all([
      admin.firestore().collection('notifications').get(),
      admin.firestore().collection('notifications').where('status', '==', 'sent').get(),
      admin.firestore().collection('notifications').where('status', '==', 'scheduled').get(),
      admin.firestore().collection('notifications').where('status', '==', 'draft').get()
    ])

    const stats = {
      total: totalSnapshot.size,
      sent: sentSnapshot.size,
      scheduled: scheduledSnapshot.size,
      draft: draftSnapshot.size,
      totalReads: 0, // 実際の実装では集計が必要
      avgReadRate: 0
    }

    res.status(200).json({ stats })
  } catch (error) {
    console.error('Error getting notification stats:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})
