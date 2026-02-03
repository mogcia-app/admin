# Signal.ツール側：アクセス制御機能実装ガイド

## 📋 概要

このガイドでは、Admin Panelの「アクセス制御」ページから制御される、Signal.ツール側のメンテナンスモード機能を実装する手順を説明します。

Admin Panelから、Signal.ツール側のメンテナンスモードを有効化・無効化できるようにします。

---

## 🎯 実装する機能

1. **メンテナンスモード状態の取得API** - Admin Panelが現在の状態を確認
2. **メンテナンスモードの設定API** - Admin Panelがメンテナンスモードを有効化・無効化
3. **ログイン時のメンテナンスチェック** - メンテナンス中はログインをブロック
4. **メンテナンス画面の表示** - メンテナンス中に表示する画面

---

## 📦 前提条件

- Firebase Cloud Functions が利用可能であること
- CORS設定が可能であること
- Firestore または Realtime Database でメンテナンス状態を保存できること

---

## 📁 実装手順

### ステップ1: データ構造の定義

メンテナンスモードの状態を保存するデータ構造を定義します。

**Firestore コレクション: `toolMaintenance`**

```typescript
interface ToolMaintenance {
  enabled: boolean
  message: string // メンテナンスメッセージ
  scheduledStart?: string // ISO 8601形式の開始予定日時
  scheduledEnd?: string // ISO 8601形式の終了予定日時
  updatedBy: string // 更新者（Admin PanelのユーザーIDなど）
  updatedAt: string // ISO 8601形式の更新日時
}
```

**または、Realtime Database の場合:**

```json
{
  "toolMaintenance": {
    "enabled": false,
    "message": "",
    "scheduledStart": null,
    "scheduledEnd": null,
    "updatedBy": "",
    "updatedAt": null
  }
}
```

---

### ステップ2: Cloud Functions の実装

**ファイル: `functions/src/tool-maintenance.ts`** （新規作成）

#### 2-1. メンテナンス状態の取得API

```typescript
import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import { Request, Response } from 'express'

// CORS設定のヘルパー関数
function setCorsHeaders(res: Response) {
  res.set('Access-Control-Allow-Origin', '*')
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
}

// メンテナンス状態の取得
export const getToolMaintenanceStatus = functions.https.onRequest(
  async (req: Request, res: Response) => {
    setCorsHeaders(res)

    if (req.method === 'OPTIONS') {
      res.status(204).send('')
      return
    }

    if (req.method !== 'GET') {
      res.status(405).json({ success: false, error: 'Method not allowed' })
      return
    }

    try {
      // Firestoreからメンテナンス状態を取得
      const maintenanceDoc = await admin
        .firestore()
        .collection('toolMaintenance')
        .doc('current')
        .get()

      if (!maintenanceDoc.exists) {
        // デフォルト値（メンテナンス無効）
        res.status(200).json({
          success: true,
          data: {
            enabled: false,
            message: '',
            scheduledStart: null,
            scheduledEnd: null,
            updatedBy: '',
            updatedAt: null
          }
        })
        return
      }

      const data = maintenanceDoc.data()
      res.status(200).json({
        success: true,
        data: {
          enabled: data?.enabled || false,
          message: data?.message || '',
          scheduledStart: data?.scheduledStart || null,
          scheduledEnd: data?.scheduledEnd || null,
          updatedBy: data?.updatedBy || '',
          updatedAt: data?.updatedAt || null
        }
      })
    } catch (error) {
      console.error('Error fetching tool maintenance status:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to fetch maintenance status'
      })
    }
  }
)
```

#### 2-2. メンテナンスモードの設定API

```typescript
// メンテナンスモードの設定
export const setToolMaintenanceMode = functions.https.onRequest(
  async (req: Request, res: Response) => {
    setCorsHeaders(res)

    if (req.method === 'OPTIONS') {
      res.status(204).send('')
      return
    }

    if (req.method !== 'POST') {
      res.status(405).json({ success: false, error: 'Method not allowed' })
      return
    }

    try {
      const { enabled, message, scheduledStart, scheduledEnd, updatedBy } = req.body

      // バリデーション
      if (typeof enabled !== 'boolean') {
        res.status(400).json({
          success: false,
          error: 'enabled must be a boolean'
        })
        return
      }

      // Firestoreに保存
      const maintenanceRef = admin
        .firestore()
        .collection('toolMaintenance')
        .doc('current')

      const updateData: any = {
        enabled,
        message: message || (enabled ? 'システムメンテナンス中です。しばらくお待ちください。' : ''),
        updatedBy: updatedBy || 'admin',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }

      if (scheduledStart) {
        updateData.scheduledStart = scheduledStart
      }

      if (scheduledEnd) {
        updateData.scheduledEnd = scheduledEnd
      }

      await maintenanceRef.set(updateData, { merge: true })

      // 更新後のデータを取得して返す
      const updatedDoc = await maintenanceRef.get()
      const data = updatedDoc.data()

      res.status(200).json({
        success: true,
        data: {
          enabled: data?.enabled || false,
          message: data?.message || '',
          scheduledStart: data?.scheduledStart || null,
          scheduledEnd: data?.scheduledEnd || null,
          updatedBy: data?.updatedBy || '',
          updatedAt: data?.updatedAt?.toDate?.()?.toISOString() || data?.updatedAt || null
        }
      })
    } catch (error) {
      console.error('Error setting tool maintenance mode:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to set maintenance mode'
      })
    }
  }
)
```

#### 2-3. Functions のエクスポート

**ファイル: `functions/src/index.ts`** （既存ファイルに追加）

```typescript
import { getToolMaintenanceStatus, setToolMaintenanceMode } from './tool-maintenance'

export { getToolMaintenanceStatus, setToolMaintenanceMode }
```

---

### ステップ3: フロントエンド側の実装

#### 3-1. メンテナンス状態を取得する関数

**ファイル: `src/lib/tool-maintenance.ts`** （新規作成）

```typescript
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'

const MAINTENANCE_DOC_PATH = 'toolMaintenance/current'

export interface ToolMaintenance {
  enabled: boolean
  message: string
  scheduledStart?: string | null
  scheduledEnd?: string | null
  updatedBy: string
  updatedAt: string | null
}

/**
 * メンテナンス状態を取得
 */
export async function getToolMaintenanceStatus(): Promise<ToolMaintenance> {
  try {
    const docRef = doc(db, MAINTENANCE_DOC_PATH)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      return {
        enabled: false,
        message: '',
        scheduledStart: null,
        scheduledEnd: null,
        updatedBy: '',
        updatedAt: null
      }
    }

    const data = docSnap.data()
    return {
      enabled: data.enabled || false,
      message: data.message || '',
      scheduledStart: data.scheduledStart || null,
      scheduledEnd: data.scheduledEnd || null,
      updatedBy: data.updatedBy || '',
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt || null
    }
  } catch (error) {
    console.error('Error fetching tool maintenance status:', error)
    // エラー時はメンテナンス無効として扱う
    return {
      enabled: false,
      message: '',
      scheduledStart: null,
      scheduledEnd: null,
      updatedBy: '',
      updatedAt: null
    }
  }
}

/**
 * メンテナンスモードを設定（Admin Panelからのみ使用）
 */
export async function setToolMaintenanceMode(
  enabled: boolean,
  message?: string,
  scheduledStart?: string,
  scheduledEnd?: string,
  updatedBy: string = 'admin'
): Promise<ToolMaintenance> {
  try {
    const docRef = doc(db, MAINTENANCE_DOC_PATH)
    
    const updateData: any = {
      enabled,
      message: message || (enabled ? 'システムメンテナンス中です。しばらくお待ちください。' : ''),
      updatedBy,
      updatedAt: serverTimestamp()
    }

    if (scheduledStart) {
      updateData.scheduledStart = scheduledStart
    }

    if (scheduledEnd) {
      updateData.scheduledEnd = scheduledEnd
    }

    await setDoc(docRef, updateData, { merge: true })

    // 更新後のデータを取得
    return await getToolMaintenanceStatus()
  } catch (error) {
    console.error('Error setting tool maintenance mode:', error)
    throw error
  }
}
```

#### 3-2. ログイン時のメンテナンスチェック

**ファイル: `src/app/login/page.tsx`** （既存ファイルを編集）

ログイン処理の前に、メンテナンスモードをチェックします。

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getToolMaintenanceStatus } from '@/lib/tool-maintenance'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/lib/firebase'

export default function LoginPage() {
  const router = useRouter()
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [maintenanceMessage, setMaintenanceMessage] = useState('')
  const [checkingMaintenance, setCheckingMaintenance] = useState(true)

  // メンテナンス状態をチェック
  useEffect(() => {
    const checkMaintenance = async () => {
      try {
        const status = await getToolMaintenanceStatus()
        setMaintenanceMode(status.enabled)
        setMaintenanceMessage(status.message)
        
        // スケジュールされたメンテナンスのチェック
        if (status.scheduledStart && status.scheduledEnd) {
          const now = new Date()
          const start = new Date(status.scheduledStart)
          const end = new Date(status.scheduledEnd)
          
          if (now >= start && now <= end) {
            setMaintenanceMode(true)
            if (!status.message) {
              setMaintenanceMessage('システムメンテナンス中です。しばらくお待ちください。')
            }
          }
        }
      } catch (error) {
        console.error('Error checking maintenance status:', error)
        // エラー時はメンテナンス無効として扱う
        setMaintenanceMode(false)
      } finally {
        setCheckingMaintenance(false)
      }
    }

    checkMaintenance()
    
    // リアルタイムでメンテナンス状態を監視（オプション）
    const interval = setInterval(checkMaintenance, 30000) // 30秒ごとにチェック
    
    return () => clearInterval(interval)
  }, [])

  const handleLogin = async (email: string, password: string) => {
    // メンテナンス中はログインをブロック
    if (maintenanceMode) {
      alert('現在メンテナンス中です。しばらくお待ちください。')
      return
    }

    try {
      await signInWithEmailAndPassword(auth, email, password)
      router.push('/dashboard')
    } catch (error) {
      console.error('Login error:', error)
      alert('ログインに失敗しました')
    }
  }

  if (checkingMaintenance) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (maintenanceMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">🔧</div>
          <h1 className="text-2xl font-bold mb-4">メンテナンス中</h1>
          <p className="text-gray-600 mb-6 whitespace-pre-wrap">
            {maintenanceMessage || 'システムメンテナンス中です。しばらくお待ちください。'}
          </p>
          <div className="text-sm text-gray-500">
            メンテナンスが完了次第、サービスを再開いたします。
          </div>
        </div>
      </div>
    )
  }

  // 通常のログインフォームを表示
  return (
    <div className="min-h-screen flex items-center justify-center">
      {/* ログインフォーム */}
    </div>
  )
}
```

#### 3-3. 認証ガードでのメンテナンスチェック（オプション）

既にログインしているユーザーがメンテナンス開始後にアクセスした場合の処理。

**ファイル: `src/components/auth/auth-guard.tsx`** （既存ファイルを編集）

```typescript
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '@/lib/firebase'
import { getToolMaintenanceStatus } from '@/lib/tool-maintenance'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [user, loading] = useAuthState(auth)
  const router = useRouter()
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [checkingMaintenance, setCheckingMaintenance] = useState(true)

  useEffect(() => {
    const checkMaintenance = async () => {
      try {
        const status = await getToolMaintenanceStatus()
        setMaintenanceMode(status.enabled)
        
        if (status.enabled) {
          // メンテナンス中はログアウトしてメンテナンス画面にリダイレクト
          await auth.signOut()
          router.push('/maintenance')
        }
      } catch (error) {
        console.error('Error checking maintenance:', error)
      } finally {
        setCheckingMaintenance(false)
      }
    }

    if (user) {
      checkMaintenance()
      // 定期的にチェック
      const interval = setInterval(checkMaintenance, 60000) // 1分ごと
      return () => clearInterval(interval)
    } else {
      setCheckingMaintenance(false)
    }
  }, [user, router])

  if (checkingMaintenance) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (maintenanceMode) {
    return null // メンテナンス画面にリダイレクト中
  }

  return <>{children}</>
}
```

#### 3-4. メンテナンス画面ページ

**ファイル: `src/app/maintenance/page.tsx`** （新規作成）

```typescript
'use client'

import { useEffect, useState } from 'react'
import { getToolMaintenanceStatus } from '@/lib/tool-maintenance'
import { useRouter } from 'next/navigation'

export default function MaintenancePage() {
  const router = useRouter()
  const [maintenanceMessage, setMaintenanceMessage] = useState('')
  const [scheduledEnd, setScheduledEnd] = useState<string | null>(null)

  useEffect(() => {
    const checkMaintenance = async () => {
      try {
        const status = await getToolMaintenanceStatus()
        
        if (!status.enabled) {
          // メンテナンスが終了したらホームにリダイレクト
          router.push('/')
          return
        }

        setMaintenanceMessage(status.message || 'システムメンテナンス中です。しばらくお待ちください。')
        setScheduledEnd(status.scheduledEnd || null)
      } catch (error) {
        console.error('Error checking maintenance:', error)
      }
    }

    checkMaintenance()
    
    // 定期的にメンテナンス状態をチェック
    const interval = setInterval(checkMaintenance, 30000) // 30秒ごと
    
    return () => clearInterval(interval)
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="text-6xl mb-4">🔧</div>
        <h1 className="text-2xl font-bold mb-4">メンテナンス中</h1>
        <p className="text-gray-600 mb-6 whitespace-pre-wrap">
          {maintenanceMessage}
        </p>
        {scheduledEnd && (
          <div className="text-sm text-gray-500 mb-4">
            予定終了時刻: {new Date(scheduledEnd).toLocaleString('ja-JP')}
          </div>
        )}
        <div className="text-sm text-gray-500">
          メンテナンスが完了次第、サービスを再開いたします。
        </div>
      </div>
    </div>
  )
}
```

---

### ステップ4: Firestore セキュリティルール

**ファイル: `firestore.rules`** （既存ファイルに追加）

```javascript
match /toolMaintenance/{document} {
  // 読み取り: 認証済みユーザーは誰でも読み取り可能
  allow read: if request.auth != null;
  
  // 書き込み: Admin Panelからのみ（認証済みかつ管理者）
  allow write: if request.auth != null && 
    request.auth.token.admin === true;
}
```

---

### ステップ5: API エンドポイントの設定

Admin Panel側のAPI設定を確認し、Signal.ツール側のFunctions URLを設定します。

**Admin Panel側の設定: `src/lib/api-config.ts`**

```typescript
export const API_ENDPOINTS = {
  toolMaintenance: {
    getStatus: 'https://YOUR-REGION-YOUR-PROJECT.cloudfunctions.net/getToolMaintenanceStatus',
    setMode: 'https://YOUR-REGION-YOUR-PROJECT.cloudfunctions.net/setToolMaintenanceMode'
  }
}
```

**注意:** `YOUR-REGION` と `YOUR-PROJECT` を実際の値に置き換えてください。

---

## 🔍 動作確認

### 1. Functions のデプロイ

```bash
cd functions
npm run deploy
```

### 2. テスト手順

1. Admin Panelの「アクセス制御」→「ツール側メンテナンス」タブを開く
2. 「メンテナンス開始」ボタンをクリック
3. Signal.ツール側でログインページにアクセス
4. メンテナンス画面が表示されることを確認
5. Admin Panelで「メンテナンス終了」をクリック
6. Signal.ツール側でログインできることを確認

### 3. トラブルシューティング

**CORSエラーが発生する場合:**
- Functions の CORS ヘッダー設定を確認
- Admin Panel側のAPIエンドポイントURLが正しいか確認

**メンテナンス状態が取得できない場合:**
- Firestore のセキュリティルールを確認
- Functions のログを確認（`firebase functions:log`）

**メンテナンス画面が表示されない場合:**
- `getToolMaintenanceStatus` 関数が正しく実装されているか確認
- ログイン処理の前にメンテナンスチェックが実行されているか確認

---

## 📝 補足事項

### スケジュールされたメンテナンス

`scheduledStart` と `scheduledEnd` が設定されている場合、指定された時間帯のみメンテナンスモードが有効になります。

### リアルタイム更新

メンテナンス状態をリアルタイムで監視する場合は、Firestore の `onSnapshot` を使用できます：

```typescript
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from './firebase'

const maintenanceRef = doc(db, 'toolMaintenance/current')

onSnapshot(maintenanceRef, (doc) => {
  const data = doc.data()
  if (data?.enabled) {
    // メンテナンスモードに切り替え
  }
})
```

---

## 完了

これで、Admin PanelからSignal.ツール側のメンテナンスモードを制御できるようになりました！

Admin Panelで「メンテナンス開始」をクリックすると、Signal.ツール側のログインがブロックされ、メンテナンス画面が表示されます。

