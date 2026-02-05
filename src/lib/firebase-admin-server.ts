// Firebase Admin SDK for server-side operations
import { initializeApp, getApps, cert, App } from 'firebase-admin/app'
import { getAuth, Auth } from 'firebase-admin/auth'
import { isAdminUser } from './admin-users'

let adminApp: App
let adminAuth: Auth

// Firebase Admin SDKの初期化
if (getApps().length === 0) {
  // 環境変数から認証情報を取得
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (projectId && clientEmail && privateKey) {
    adminApp = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    })
  } else {
    // 環境変数が設定されていない場合は、デフォルトの認証情報を使用
    // （Firebase Functions環境では自動的に認証情報が設定される）
    adminApp = initializeApp()
  }
} else {
  adminApp = getApps()[0]
}

adminAuth = getAuth(adminApp)

// 管理者ユーザーにカスタムクレームを設定
export async function setAdminClaims(uid: string, email: string): Promise<void> {
  try {
    // 管理者メールアドレスかどうかを確認
    if (!isAdminUser(email)) {
      throw new Error('User is not an admin')
    }

    // カスタムクレームを設定
    await adminAuth.setCustomUserClaims(uid, {
      admin: true,
      email: email,
    })

    console.log(`Admin claims set for user: ${uid} (${email})`)
  } catch (error) {
    console.error('Error setting admin claims:', error)
    throw error
  }
}

// カスタムクレームを削除
export async function removeAdminClaims(uid: string): Promise<void> {
  try {
    await adminAuth.setCustomUserClaims(uid, null)
    console.log(`Admin claims removed for user: ${uid}`)
  } catch (error) {
    console.error('Error removing admin claims:', error)
    throw error
  }
}

export { adminApp, adminAuth }

