// Firebase権限エラー時のリトライユーティリティ
import { auth } from './firebase'
import { User } from 'firebase/auth'

/**
 * 権限エラーが発生した場合にトークンを再取得してリトライする
 * @param operation 実行する操作（関数）
 * @param maxRetries 最大リトライ回数（デフォルト: 1）
 * @returns 操作の結果
 */
export async function retryOnPermissionError<T>(
  operation: () => Promise<T>,
  maxRetries: number = 1
): Promise<T> {
  let lastError: Error | null = null
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error: any) {
      lastError = error
      
      // 権限エラーの場合のみリトライ
      if (
        error?.code === 'permission-denied' ||
        error?.message?.includes('Missing or insufficient permissions') ||
        error?.message?.includes('permission-denied')
      ) {
        if (attempt < maxRetries) {
          console.log(`Permission error detected, refreshing token and retrying (attempt ${attempt + 1}/${maxRetries + 1})...`)
          
          // 現在のユーザーのトークンを強制的に再取得
          const currentUser = auth.currentUser
          if (currentUser) {
            try {
              // トークンを再取得
              await currentUser.getIdToken(true)
              // トークンの内容を確認（デバッグ用）
              const tokenResult = await currentUser.getIdTokenResult(true)
              console.log('Token refreshed, claims:', {
                admin: tokenResult.claims.admin,
                email: tokenResult.claims.email
              })
              console.log('Token refreshed, retrying operation...')
              // Firestoreが新しいトークンを使用するように、少し待つ
              await new Promise(resolve => setTimeout(resolve, 1000))
              continue
            } catch (tokenError) {
              console.error('Failed to refresh token:', tokenError)
              throw error
            }
          } else {
            console.error('No authenticated user found')
            throw error
          }
        } else {
          console.error('Max retries reached for permission error')
          throw error
        }
      } else {
        // 権限エラー以外の場合は即座にエラーを投げる
        throw error
      }
    }
  }
  
  throw lastError || new Error('Unknown error occurred')
}

/**
 * 現在のユーザーのトークンを強制的に再取得
 */
export async function refreshAuthToken(): Promise<void> {
  const currentUser = auth.currentUser
  if (currentUser) {
    await currentUser.getIdToken(true)
    const tokenResult = await currentUser.getIdTokenResult(true)
    console.log('Auth token refreshed, claims:', {
      admin: tokenResult.claims.admin,
      email: tokenResult.claims.email
    })
    // Firestoreが新しいトークンを使用するように、少し待つ
    await new Promise(resolve => setTimeout(resolve, 500))
  } else {
    console.warn('No authenticated user to refresh token')
  }
}

