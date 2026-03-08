// Firebase Admin SDK for server-side operations
import { initializeApp, getApps, cert, App } from 'firebase-admin/app'
import { getAuth, Auth } from 'firebase-admin/auth'
import { getFirestore, Firestore } from 'firebase-admin/firestore'
import { isAdminUser } from './admin-users'

let adminApp: App | null = null
let adminAuth: Auth | null = null
let adminDb: Firestore | null = null

// Firebase Admin SDKの初期化
function initializeAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0]
  }

  // 環境変数から認証情報を取得
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n')

  // 環境変数のチェック
  if (!projectId) {
    console.warn('⚠️ FIREBASE_ADMIN_PROJECT_ID or NEXT_PUBLIC_FIREBASE_PROJECT_ID is not set')
  }
  if (!clientEmail) {
    console.warn('⚠️ FIREBASE_ADMIN_CLIENT_EMAIL is not set')
  }
  if (!privateKey) {
    console.warn('⚠️ FIREBASE_ADMIN_PRIVATE_KEY is not set')
  }

  if (projectId && clientEmail && privateKey) {
    try {
      return initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      })
    } catch (error) {
      console.error('❌ Failed to initialize Firebase Admin with credentials:', error)
      throw new Error('Firebase Admin SDK initialization failed. Please check your environment variables.')
    }
  } else {
    // 環境変数が設定されていない場合
    console.warn('⚠️ Firebase Admin SDK credentials not found. Attempting to use default credentials...')
    try {
      return initializeApp()
    } catch (error) {
      console.error('❌ Failed to initialize Firebase Admin with default credentials:', error)
      throw new Error(
        'Firebase Admin SDK initialization failed. ' +
        'Please set FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, and FIREBASE_ADMIN_PRIVATE_KEY in your .env.local file. ' +
        'See ENV_SETUP_GUIDE.md for details.'
      )
    }
  }
}

// 遅延初期化（必要になったときに初期化）
function getAdminApp(): App {
  if (!adminApp) {
    adminApp = initializeAdminApp()
  }
  return adminApp
}

function getAdminAuth(): Auth {
  if (!adminAuth) {
    adminAuth = getAuth(getAdminApp())
  }
  return adminAuth
}

function getAdminDb(): Firestore {
  if (!adminDb) {
    adminDb = getFirestore(getAdminApp())
  }
  return adminDb
}

// 管理者ユーザーにカスタムクレームを設定
export async function setAdminClaims(uid: string, email: string): Promise<void> {
  try {
    // 管理者メールアドレスかどうかを確認
    if (!isAdminUser(email)) {
      throw new Error('User is not an admin')
    }

    // Admin Authを取得（必要に応じて初期化）
    const auth = getAdminAuth()

    // カスタムクレームを設定
    await auth.setCustomUserClaims(uid, {
      admin: true,
      email: email,
    })

    console.log(`✅ Admin claims set for user: ${uid} (${email})`)
  } catch (error) {
    console.error('❌ Error setting admin claims:', error)
    if (error instanceof Error) {
      // より詳細なエラーメッセージを提供
      if (error.message.includes('Credential implementation')) {
        throw new Error(
          'Firebase Admin SDK認証エラー: 環境変数が正しく設定されていません。' +
          '.env.localファイルにFIREBASE_ADMIN_PROJECT_ID、FIREBASE_ADMIN_CLIENT_EMAIL、FIREBASE_ADMIN_PRIVATE_KEYを設定してください。'
        )
      }
    }
    throw error
  }
}

// カスタムクレームを削除
export async function removeAdminClaims(uid: string): Promise<void> {
  try {
    const auth = getAdminAuth()
    await auth.setCustomUserClaims(uid, null)
    console.log(`Admin claims removed for user: ${uid}`)
  } catch (error) {
    console.error('Error removing admin claims:', error)
    throw error
  }
}

// 後方互換性のため、既存のコードで使用されている可能性があるためエクスポート
export { getAdminApp as adminApp, getAdminAuth as adminAuth }
export { getAdminDb as adminFirestore }

