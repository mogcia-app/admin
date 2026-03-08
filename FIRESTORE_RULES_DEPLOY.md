# 🔥 Firestore セキュリティルール デプロイガイド

## 問題の状況

- ✅ Admin claimは正しく設定されている（`admin: true`）
- ✅ トークンも正しく取得できている
- ❌ Firestoreのセキュリティルールで権限エラーが発生

**原因**: ローカルの`firestore.rules`ファイルは正しいが、Firebaseにデプロイされていない可能性が高い

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
5. `firestore.rules` ファイルの内容をコピー＆ペースト
6. 「公開」ボタンをクリック

## 📋 現在のルール内容（確認用）

現在の`firestore.rules`ファイルは以下のように設定されています：

```javascript
function isAdminEmail() {
  return request.auth != null && (
    // カスタムクレームで管理者フラグを確認（優先）
    request.auth.token.admin == true ||
    // メールアドレスで管理者を確認（フォールバック）
    (request.auth.token.email != null && (
      request.auth.token.email == 'marina.ishida@signalapp.jp' ||
      request.auth.token.email == 'hiroto.domoto@signalapp.jp' ||
      request.auth.token.email == 'kentarou.kitamura@signalapp.jp'
    ))
  );
}

// companiesコレクション
match /companies/{companyId} {
  allow get, list, write: if isAuthenticated() && isAdminEmail();
}

// usersコレクション
match /users/{userId} {
  allow get: if isAuthenticated() && request.auth.uid == userId;
  allow get, list, write: if isAuthenticated() && isAdminEmail();
}
```

## ✅ デプロイ後の確認

デプロイ後、以下を確認してください：

1. **ブラウザをリロード**（Firestoreが新しいルールを使用するように）
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

## 📝 注意事項

- ルールを変更したら、必ずデプロイしてください
- デプロイ後、数秒〜数分かかることがあります
- 本番環境のルールを変更する際は、十分にテストしてください



