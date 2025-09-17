# 利用者側アプリ開発 引き継ぎ事項

## 🔗 Admin Panel との連携仕様

### 📊 **ユーザー管理連携**
- **管理側**: `/users` でユーザー登録・管理（メール・パスワード設定）
- **利用者側**: 登録済みメールアドレス・パスワードでログイン
- **UID連携**: Firebase AuthのUIDで利用者情報を紐付け
- **データ同期**: Firestoreの`users`コレクションを共有

#### **📝 ユーザー作成フロー**
1. **Admin Panel** → 新規利用者追加
2. **メール・パスワード入力** → Firebase Authアカウント作成
3. **UID取得** → Firestoreに詳細情報保存
4. **利用者側** → 同じメール・パスワードでログイン可能

### 📢 **通知システム連携**
- **管理側**: `/notifications` でお知らせ作成・配信
- **利用者側**: リアルタイムで通知受信・表示
- **データ同期**: Firestoreの`notifications`コレクションを共有
- **配信対象**: `targetUsers`配列でユーザー指定可能

---

## 🏗️ **技術構成（同一）**

### **フロントエンド**
- **Framework**: Next.js 15 + TypeScript
- **UI Library**: Tailwind CSS + Shadcn/ui
- **State Management**: React Hooks + Context API

### **バックエンド**
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Functions**: Firebase Cloud Functions
- **Hosting**: Vercel (推奨)

### **共有リソース**
- **Firebase Project**: 同一プロジェクト使用
- **API Endpoints**: 同じCloud Functions利用可能
- **Database Collections**: 共有（権限分離）

---

## 📋 **データベース設計**

### **Users Collection** (`users/{uid}`)
```typescript
interface User {
  id: string                    // Firebase Auth UID
  email: string                 // ログイン用メールアドレス（Firebase Auth管理）
  name: string                  // 表示名
  role: 'user' | 'admin'        // 権限（利用者は'user'）
  isActive: boolean             // アクティブ状態
  snsCount: number              // SNS契約数（1-4）
  usageType: 'team' | 'solo'    // 利用形態
  contractType: 'annual' | 'trial' // 契約タイプ
  contractSNS: string[]         // 契約SNS配列
  snsAISettings: object         // SNS AI設定
  businessInfo: {               // ビジネス情報
    industry: string
    companySize: string
    businessType: string
    description: string
    targetMarket: string
    goals: string[]
    challenges: string[]
  }
  status: 'active' | 'inactive' | 'suspended'
  contractStartDate: string     // 契約開始日
  contractEndDate: string       // 契約終了日
  billingInfo?: object          // 課金情報
  notes?: string                // 管理者メモ
  createdAt: string
  updatedAt: string
  // パスワードはFirebase Authが管理（Firestoreには保存されない）
}
```

### **Notifications Collection** (`notifications/{id}`)
```typescript
interface Notification {
  id: string
  title: string                 // 通知タイトル
  message: string               // 通知内容
  type: 'info' | 'warning' | 'success' | 'error'
  priority: 'low' | 'medium' | 'high'
  targetUsers: string[]         // 配信対象UID配列（空=全員）
  status: 'draft' | 'published' | 'archived'
  scheduledAt?: string          // 予約配信日時
  expiresAt?: string           // 有効期限
  createdAt: string
  updatedAt: string
  createdBy: string            // 作成者UID
}
```

---

## 🔐 **認証・権限設計**

### **Firebase Auth設定**
- **管理者**: `@signalapp.jp` ドメインのみ
- **利用者**: 管理側で登録されたメールアドレス
- **UID**: 両アプリで共通使用

### **Firestore Security Rules**
```javascript
// Users: 自分の情報のみ読み書き可能
match /users/{userId} {
  allow read, write: if request.auth.uid == userId;
  allow read: if isAdmin(); // 管理者は全ユーザー閲覧可能
}

// Notifications: 利用者は読み取りのみ
match /notifications/{notificationId} {
  allow read: if request.auth != null;
  allow write: if isAdmin();
}
```

---

## 🚀 **開発開始手順**

### **1. プロジェクト作成**
```bash
# Next.js プロジェクト作成
npx create-next-app@latest signal-user-app --typescript --tailwind --eslint --app

# 必要なパッケージインストール
npm install firebase @types/node lucide-react
npm install @radix-ui/react-dialog @radix-ui/react-select @radix-ui/react-tabs
```

### **2. Firebase設定**
- **同じFirebaseプロジェクト**を使用
- **環境変数**をコピー（`.env.local`）
- **Firebase Config**をコピー（`src/lib/firebase.ts`）

### **3. 認証システム**
- **AuthContext**: Admin Panelの`src/contexts/auth-context.tsx`を参考
- **AuthGuard**: 利用者専用にカスタマイズ
- **Login/Signup**: 利用者向けUI

### **4. 通知システム**
- **リアルタイム購読**: Firestoreリアルタイムリスナー
- **プッシュ通知**: Firebase Cloud Messaging（オプション）

---

## 📱 **利用者側 主要機能**

### **必須機能**
- [ ] ユーザーログイン・認証
- [ ] ダッシュボード（個人用）
- [ ] 通知受信・表示
- [ ] プロフィール編集
- [ ] SNS設定管理

### **オプション機能**
- [ ] AIアシスタント（同じAPI使用可能）
- [ ] 分析・レポート機能
- [ ] チャット・サポート機能
- [ ] ファイルアップロード機能

---

## 🔧 **開発時の注意点**

### **セキュリティ**
- **API Keys**: サーバーサイドのみ使用
- **Firestore Rules**: 適切な権限設定
- **環境変数**: `.gitignore`で保護

### **パフォーマンス**
- **リアルタイム購読**: 必要な部分のみ
- **画像最適化**: Next.js Image コンポーネント使用
- **コード分割**: 動的インポート活用

### **UI/UX**
- **レスポンシブ**: モバイルファースト
- **アクセシビリティ**: ARIA属性、キーボード操作
- **ローディング状態**: 適切なスケルトン表示

---

## 📞 **サポート・質問**

開発中に不明な点があれば：
1. **Admin Panel**のコードを参考
2. **Firebase Console**で実際のデータ確認
3. **Cloud Functions**のログ確認（必要に応じて）

---

*最終更新: 2024年9月17日*
*Admin Panel Version: v1.0.0*
