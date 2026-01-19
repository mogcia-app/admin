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

# Firebase設定（必要に応じて追加）
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

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

## 📝 重要事項

- `.env.local` ファイルは **Gitにコミットしないでください**（`.gitignore` に含まれています）
- 本番環境では必ずVercel Dashboardで環境変数を設定してください
- 環境変数を変更したら、開発サーバーを再起動してください

