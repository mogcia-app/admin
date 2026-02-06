# 環境変数設定ガイド

## 📋 ローカル開発環境（`.env.local`）

プロジェクトルートに `.env.local` ファイルを作成または編集してください。

### 必須環境変数

```bash
# Signal.ツール連携
NEXT_PUBLIC_SIGNAL_TOOL_BASE_URL=https://signaltool.app
```

### 完全な設定例

```bash
# OpenAI API
OPENAI_API_KEY=your-openai-api-key-here

# Signal.ツール連携
NEXT_PUBLIC_SIGNAL_TOOL_BASE_URL=https://signaltool.app

# Firebase設定（クライアント側）
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCvX4cKWKtn_qnh3CV-d1UC4GEiVpdPB9w
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=signal-v1-fc481.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=signal-v1-fc481
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=signal-v1-fc481.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=913459926537
NEXT_PUBLIC_FIREBASE_APP_ID=1:913459926537:web:3f27082cdf1e913c444ad8

# Firebase Admin SDK（サーバー側のみ - 管理者クレーム設定に必要）
FIREBASE_ADMIN_PROJECT_ID=signal-v1-fc481
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@signal-v1-fc481.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

**重要**: Firebase Admin SDKの認証情報は、Firebase Console → プロジェクト設定 → サービスアカウントから取得できます。
1. [Firebase Console](https://console.firebase.google.com/) にアクセス
2. プロジェクトを選択（signal-v1-fc481）
3. プロジェクト設定（⚙️）→ サービスアカウントタブ
4. 「新しい秘密鍵の生成」をクリック
5. ダウンロードしたJSONファイルから以下の情報を取得：
   - `project_id` → `FIREBASE_ADMIN_PROJECT_ID`
   - `client_email` → `FIREBASE_ADMIN_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_ADMIN_PRIVATE_KEY`（そのままコピー、改行文字`\n`を含む）

## 🌐 Vercel本番環境

Vercel Dashboard で環境変数を設定してください。

### 設定手順

1. [Vercel Dashboard](https://vercel.com/dashboard) にアクセス
2. `admin` プロジェクトを選択
3. **Settings** → **Environment Variables** に移動
4. 以下の環境変数を追加：

```
名前: NEXT_PUBLIC_SIGNAL_TOOL_BASE_URL
値: https://signaltool.app
環境: Production, Preview, Development (全てチェック)
```

5. **Save** をクリック
6. デプロイを再実行（Redeploy）

詳細は `VERCEL_ENV_SETUP.md` を参照してください。

## 🔍 環境変数の確認方法

### ローカル環境

```bash
# .env.localファイルの内容を確認
cat .env.local
```

### コード内での使用

```typescript
// src/lib/firebase-admin.ts で使用
const signalToolBaseUrl = process.env.NEXT_PUBLIC_SIGNAL_TOOL_BASE_URL || 'https://signaltool.app'
```

**注意**: `NEXT_PUBLIC_` で始まる環境変数は、クライアント側（ブラウザ）でも利用可能になります。

## ✅ 設定後の確認

1. 開発サーバーを再起動
   ```bash
   npm run dev
   ```

2. ユーザー作成時に `signalToolAccessUrl` が正しく生成されるか確認
   - Adminサイトで新規ユーザーを作成
   - ユーザー詳細モーダルでURLが表示されることを確認

3. Firebase Admin SDKの認証が正しく動作するか確認
   - ログイン時にコンソールエラーが発生しないことを確認
   - `/api/auth/set-admin-claims` APIが正常に動作することを確認

## 📝 重要事項

- `.env.local` ファイルは **Gitにコミットしないでください**（`.gitignore` に含まれています）
- 本番環境では必ずVercel Dashboardで環境変数を設定してください
- 環境変数を変更したら、開発サーバーを再起動してください

