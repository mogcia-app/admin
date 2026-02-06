# 🔥 Firestore ルール デプロイ手順

## 現在の状況

- ✅ ローカルの`firestore.rules`ファイルは正しい（admin claim対応済み）
- ❌ Firebase Consoleにデプロイされているルールが古い（期限切れ）

## 🚀 解決方法

### 方法1: Firebase CLIでデプロイ（推奨）

```bash
# Firestoreルールのみをデプロイ
firebase deploy --only firestore:rules
```

### 方法2: Firebase Consoleで手動設定

1. [Firebase Console](https://console.firebase.google.com/) にアクセス
2. プロジェクト `signal-v1-fc481` を選択
3. 左メニューから「Firestore Database」を選択
4. 「ルール」タブをクリック
5. **現在のルールを全て削除**
6. `firestore.rules` ファイルの内容をコピー＆ペースト
7. 「公開」ボタンをクリック

## ⚠️ 重要な注意事項

- ❌ **ルールを「追加」しない** - 既存のルールを完全に置き換える
- ❌ **`service cloud.firestore`を2つ書かない** - 1つだけ
- ✅ **既存のルールを全て削除してから、新しいルールを貼り付ける**

## 📋 デプロイ後の確認

1. **ブラウザを完全にリロード**（Ctrl+Shift+R / Cmd+Shift+R）
2. **コンソールでエラーが解消されているか確認**
3. **users/companiesデータが正常に取得できるか確認**

## 🔍 トラブルシューティング

### Firebase CLIがインストールされていない場合

```bash
npm install -g firebase-tools
firebase login
```

### プロジェクトが正しく設定されているか確認

```bash
firebase projects:list
firebase use signal-v1-fc481
```

### ルールの構文エラーを確認

```bash
firebase deploy --only firestore:rules --dry-run
```

