# セキュリティガイドライン

## APIキー管理

### 開発環境
- `.env.local` ファイルにAPIキーを保存
- このファイルは `.gitignore` に含まれており、Gitにコミットされません
- ローカル開発時のみ使用してください

### 本番環境
- 環境変数として設定してください
- 以下のプラットフォームでの設定方法：

#### Vercel（推奨設定）
1. プロジェクト設定 > Environment Variables
2. `OPENAI_API_KEY` を追加（NEXT_PUBLIC_プレフィックスなし）
3. 本番環境に値を設定

#### セキュリティレベル
- **高**: `OPENAI_API_KEY` - サーバーサイドのみ
- **中**: `NEXT_PUBLIC_OPENAI_API_KEY` - クライアントサイドでもアクセス可能

#### Netlify
1. Site settings > Environment variables
2. `NEXT_PUBLIC_OPENAI_API_KEY` を追加
3. 本番環境に値を設定

#### その他のホスティング
- 環境変数として `NEXT_PUBLIC_OPENAI_API_KEY` を設定

## セキュリティチェックリスト

- [ ] `.env.local` が `.gitignore` に含まれている
- [ ] APIキーがGit履歴に含まれていない
- [ ] 本番環境で環境変数を使用している
- [ ] APIキーをコードに直接記述していない
- [ ] 不要なAPIキーは無効化している

## 緊急時の対応

APIキーが漏洩した場合：
1. 即座にAPIキーを無効化
2. 新しいAPIキーを生成
3. 全ての環境で新しいキーに更新
4. 漏洩の原因を調査・修正

## 連絡先

セキュリティに関する問題を発見した場合：
- プロジェクト管理者に連絡
- 詳細な情報を提供してください
