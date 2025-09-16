import { collection, addDoc, doc, setDoc } from 'firebase/firestore'
import { db } from './firebase'

// テスト用のサンプルデータを作成する関数
export async function seedFirestoreData() {
  try {
    console.log('Seeding Firestore with sample data...')

    // サンプルユーザーデータ
    const sampleUsers = [
      {
        name: '田中太郎',
        email: 'tanaka@example.com',
        role: 'admin',
        isActive: true,
        createdAt: new Date('2024-01-15T10:30:00Z').toISOString(),
        updatedAt: new Date('2024-01-15T10:30:00Z').toISOString(),
      },
      {
        name: '佐藤花子',
        email: 'sato@example.com',
        role: 'user',
        isActive: true,
        createdAt: new Date('2024-01-20T14:20:00Z').toISOString(),
        updatedAt: new Date('2024-01-25T09:15:00Z').toISOString(),
      },
      {
        name: '鈴木一郎',
        email: 'suzuki@example.com',
        role: 'moderator',
        isActive: false,
        createdAt: new Date('2024-01-12T16:45:00Z').toISOString(),
        updatedAt: new Date('2024-01-18T11:30:00Z').toISOString(),
      },
      {
        name: '山田美咲',
        email: 'yamada@example.com',
        role: 'user',
        isActive: true,
        createdAt: new Date('2024-02-01T12:00:00Z').toISOString(),
        updatedAt: new Date('2024-02-01T12:00:00Z').toISOString(),
      },
      {
        name: '高橋健太',
        email: 'takahashi@example.com',
        role: 'user',
        isActive: true,
        createdAt: new Date('2024-02-05T08:30:00Z').toISOString(),
        updatedAt: new Date('2024-02-05T08:30:00Z').toISOString(),
      },
      {
        name: '伊藤さくら',
        email: 'ito@example.com',
        role: 'user',
        isActive: true,
        createdAt: new Date('2024-02-10T15:45:00Z').toISOString(),
        updatedAt: new Date('2024-02-10T15:45:00Z').toISOString(),
      }
    ]

    // ユーザーデータを追加
    const usersCollection = collection(db, 'users')
    for (const user of sampleUsers) {
      await addDoc(usersCollection, user)
      console.log(`Added user: ${user.name}`)
    }

    // ダッシュボード統計データを追加
    const dashboardStatsDoc = doc(db, 'dashboard', 'stats')
    await setDoc(dashboardStatsDoc, {
      totalUsers: 1247,
      activeUsers: 892,
      totalRevenue: 2340000,
      monthlyGrowth: 23.1,
      lastUpdated: new Date().toISOString()
    })

    // 管理ログデータを追加
    const adminLogsCollection = collection(db, 'admin_logs')
    const sampleLogs = [
      {
        action: 'user_created',
        details: { userId: 'user_123', name: '田中太郎' },
        timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
        adminId: 'admin_001'
      },
      {
        action: 'system_update',
        details: { version: '1.2.0', features: ['dashboard', 'user-management'] },
        timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        adminId: 'admin_001'
      }
    ]

    for (const log of sampleLogs) {
      await addDoc(adminLogsCollection, log)
      console.log(`Added log: ${log.action}`)
    }

    console.log('✅ Sample data seeding completed successfully!')
    return true

  } catch (error) {
    console.error('❌ Error seeding data:', error)
    throw error
  }
}
