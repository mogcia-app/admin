# 🔄 Git ワークフロー

## 現在の状態

✅ **Git連携は正常に動作しています**

- リポジトリ: `https://github.com/mogcia-app/admin`
- ブランチ: `main`
- 最新コミット: `573d386` (デプロイ設定追加)
- リモート同期: 完了

## 基本的なGitワークフロー

### 1. 変更の確認
```bash
git status
git diff
```

### 2. ファイルの追加
```bash
git add .                # 全てのファイル
git add src/app/page.tsx # 特定のファイル
```

### 3. コミット
```bash
git commit -m "機能: 新機能の追加"
```

### 4. プッシュ
```bash
git push origin main
```

## コミットメッセージの規則

```
🚀 新機能: 機能の説明
🔧 修正: バグ修正の説明
📝 ドキュメント: ドキュメント更新
🎨 スタイル: UI/UX改善
♻️ リファクタリング: コード改善
⚡ パフォーマンス: 性能改善
✅ テスト: テスト追加・修正
🔒 セキュリティ: セキュリティ関連
```

## ブランチ戦略（必要に応じて）

### 機能開発
```bash
git checkout -b feature/new-feature
# 開発作業
git push origin feature/new-feature
# GitHubでPull Request作成
```

### ホットフィックス
```bash
git checkout -b hotfix/bug-fix
# バグ修正
git push origin hotfix/bug-fix
```

## 自動デプロイ

- `main` ブランチにプッシュ → Vercel自動デプロイ
- GitHub Actions でビルドテスト実行
- エラーがあれば通知

## トラブルシューティング

### よくある問題

1. **プッシュできない**
```bash
git pull origin main
git push origin main
```

2. **コンフリクト解決**
```bash
git status
# ファイルを手動編集
git add .
git commit -m "コンフリクト解決"
```

3. **コミット取り消し**
```bash
git reset HEAD~1  # 最新コミットを取り消し
git reset --hard HEAD~1  # 変更も破棄
```

## 現在の状態確認コマンド

```bash
# 基本情報
git status
git log --oneline -5
git remote -v

# ブランチ情報
git branch -a
git ls-remote origin

# 差分確認
git diff HEAD~1
```
