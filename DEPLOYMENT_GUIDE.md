# 🚀 Admin Panel デプロイガイド

## Vercel デプロイ手順

### 1. Vercel Web UI でデプロイ

1. [Vercel](https://vercel.com) にアクセス
2. GitHubアカウントでサインイン
3. 「New Project」をクリック
4. `mogcia-app/admin` リポジトリを選択
5. 「Deploy」をクリック

### 2. 環境変数の設定

Vercelダッシュボード → Settings → Environment Variables で以下を設定：

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCvX4cKWKtn_qnh3CV-d1UC4GEiVpdPB9w
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=signal-v1-fc481.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=signal-v1-fc481
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=signal-v1-fc481.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=913459926537
NEXT_PUBLIC_FIREBASE_APP_ID=1:913459926537:web:3f27082cdf1e913c444ad8
NODE_ENV=production
```

### 3. 自動デプロイの確認

- GitHubにプッシュするたびに自動デプロイされます
- デプロイ状況はVercelダッシュボードで確認可能

## Firebase Hosting デプロイ（代替案）

### 1. ビルド設定

```bash
npm run build
npm run export  # 静的エクスポート用（必要に応じて）
```

### 2. Firebase Hosting 設定

```bash
firebase init hosting
firebase deploy --only hosting
```

## CI/CD パイプライン（GitHub Actions）

`.github/workflows/deploy.yml` を作成して自動デプロイを設定可能

## トラブルシューティング

### よくある問題

1. **Firebase接続エラー**
   - 環境変数が正しく設定されているか確認
   - Firestore ルールが適切か確認

2. **ビルドエラー**
   - `npm run build` でローカルビルドテスト
   - TypeScriptエラーの確認

3. **API ルートエラー**
   - Next.js API Routes の設定確認
   - Vercel の Serverless Functions 制限確認

### サポートリンク

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Firebase Hosting](https://firebase.google.com/docs/hosting)
