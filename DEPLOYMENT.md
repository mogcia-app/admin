# デプロイメントガイド

## 本番環境でのAPIキー設定

### Vercel（推奨設定）

1. **Vercelダッシュボードにログイン**
2. **プロジェクトを選択**
3. **Settings > Environment Variables**
4. **以下の環境変数を追加：**
   - **Name**: `OPENAI_API_KEY` (サーバーサイド用 - 推奨)
   - **Value**: `YOUR_OPENAI_API_KEY_HERE` (実際のAPIキーを入力してください)
   - **Environment**: Production, Preview, Development
   
   **または**
   
   - **Name**: `NEXT_PUBLIC_OPENAI_API_KEY` (クライアントサイド用)
   - **Value**: `YOUR_OPENAI_API_KEY_HERE` (実際のAPIキーを入力してください)
   - **Environment**: Production, Preview, Development

### Netlify

1. **Netlifyダッシュボードにログイン**
2. **Site settings > Environment variables**
3. **以下の環境変数を追加：**
   - **Key**: `OPENAI_API_KEY`
   - **Value**: `YOUR_OPENAI_API_KEY_HERE` (実際のAPIキーを入力してください)

### その他のホスティング

**Railway, Render, Heroku等の場合：**

1. **ホスティングサービスの環境変数設定**
2. **以下の環境変数を追加：**
   - **Key**: `OPENAI_API_KEY`
   - **Value**: `YOUR_OPENAI_API_KEY_HERE` (実際のAPIキーを入力してください)

## デプロイ手順

### Vercel

```bash
# Vercel CLIをインストール
npm i -g vercel

# デプロイ
vercel

# 本番環境にデプロイ
vercel --prod
```

### Netlify

```bash
# Netlify CLIをインストール
npm i -g netlify-cli

# ビルド
npm run build

# デプロイ
netlify deploy --prod --dir=out
```

## セキュリティ注意事項

- ✅ APIキーは環境変数として設定
- ✅ コードに直接記述しない
- ✅ 本番環境では適切な権限設定
- ✅ 定期的なAPIキーのローテーション

## トラブルシューティング

### AI機能が動作しない場合

1. **環境変数が正しく設定されているか確認**
2. **APIキーが有効か確認**
3. **ブラウザのコンソールでエラーを確認**
4. **ネットワーク接続を確認**