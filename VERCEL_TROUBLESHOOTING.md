# 🚀 Vercel デプロイ トラブルシューティング

## ✅ 修正済み問題

### 1. ビルドエラー修正
- **問題**: ESLint エラーでビルド失敗
- **解決**: 未使用import削除、型定義修正
- **確認**: `npm run build` 成功 ✅

### 2. Next.js設定最適化
- **追加**: `next.config.ts` でVercel最適化
- **設定**: 環境変数、画像最適化、ESLint設定
- **出力**: `standalone` モード

### 3. Vercel設定改善
- **更新**: `vercel.json` でAPI Routes設定
- **追加**: Node.js 18.x ランタイム指定
- **設定**: リライトルール

## 🔧 Vercel デプロイ手順

### Step 1: Vercel Dashboard
1. [Vercel Dashboard](https://vercel.com/dashboard) にアクセス
2. 「New Project」をクリック
3. `mogcia-app/admin` リポジトリを選択
4. 「Deploy」をクリック

### Step 2: 環境変数設定
Vercel Dashboard → Project → Settings → Environment Variables

**必須環境変数:**
```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCvX4cKWKtn_qnh3CV-d1UC4GEiVpdPB9w
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=signal-v1-fc481.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=signal-v1-fc481
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=signal-v1-fc481.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=913459926537
NEXT_PUBLIC_FIREBASE_APP_ID=1:913459926537:web:3f27082cdf1e913c444ad8
NODE_ENV=production
```

### Step 3: デプロイ確認
- Build Logs を確認
- Function Logs を確認
- Preview URL でテスト

## 🐛 よくある問題と解決法

### 問題 1: ビルドエラー
**症状**: Build failed with exit code 1
**原因**: ESLint エラー、TypeScript エラー
**解決**: 
```bash
npm run build  # ローカルでテスト
npm run lint   # ESLint実行
```

### 問題 2: 環境変数エラー
**症状**: Firebase connection failed
**原因**: 環境変数未設定
**解決**: Vercel Dashboard で環境変数設定

### 問題 3: API Routes エラー
**症状**: API endpoints return 404
**原因**: Vercel Functions 設定
**解決**: `vercel.json` で functions 設定済み

### 問題 4: 静的生成エラー
**症状**: Static generation failed
**原因**: Firebase接続エラー
**解決**: 環境変数確認、Firestore Rules確認

## 📊 デプロイ後の確認項目

### ✅ チェックリスト
- [ ] サイトが正常に表示される
- [ ] ダッシュボードが読み込まれる
- [ ] Firebase接続テストが成功する
- [ ] ユーザー管理ページが動作する
- [ ] API Routes が応答する
- [ ] レスポンシブデザインが正常

### 🔍 デバッグ方法

**1. Vercel Function Logs**
```
Vercel Dashboard → Functions → View Function Logs
```

**2. Build Logs**
```
Vercel Dashboard → Deployments → Build Logs
```

**3. ローカルテスト**
```bash
npm run dev      # 開発サーバー
npm run build    # プロダクションビルド
npm run start    # プロダクションサーバー
```

**4. ブラウザ開発者ツール**
- Console でエラー確認
- Network で API リクエスト確認
- Application で環境変数確認

## 🚀 デプロイ成功後

### 自動デプロイ設定
- GitHub push → 自動デプロイ
- Preview deployments for PRs
- Production deployments for main

### パフォーマンス最適化
- Edge Functions 活用
- Image Optimization
- Static Site Generation

### モニタリング
- Vercel Analytics
- Function metrics
- Error tracking

## 📞 サポート

デプロイに問題がある場合：
1. このガイドの手順を確認
2. Vercel Dashboard のログを確認
3. GitHub Issues で報告
4. [Vercel Documentation](https://vercel.com/docs) を参照
