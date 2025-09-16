# 🔧 Vercel 環境変数設定ガイド

## 📋 手順（画像付き説明）

### Step 1: Vercel Dashboard にアクセス
1. ブラウザで [https://vercel.com/dashboard](https://vercel.com/dashboard) を開く
2. GitHubアカウントでログイン（既にログイン済みのはず）

### Step 2: プロジェクトを選択
1. ダッシュボードで `admin` プロジェクトをクリック
   - プロジェクト名: `ishida-marinas-projects/admin`
   - または直接: [https://vercel.com/ishida-marinas-projects/admin](https://vercel.com/ishida-marinas-projects/admin)

### Step 3: Settings に移動
1. プロジェクトページの上部タブで **「Settings」** をクリック
2. 左サイドバーで **「Environment Variables」** をクリック

### Step 4: 環境変数を追加
以下の環境変数を **1つずつ** 追加してください：

#### 🔑 追加する環境変数（コピペ用）

**1. NEXT_PUBLIC_FIREBASE_API_KEY**
```
名前: NEXT_PUBLIC_FIREBASE_API_KEY
値: AIzaSyCvX4cKWKtn_qnh3CV-d1UC4GEiVpdPB9w
環境: Production, Preview, Development (全てチェック)
```

**2. NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN**
```
名前: NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
値: signal-v1-fc481.firebaseapp.com
環境: Production, Preview, Development (全てチェック)
```

**3. NEXT_PUBLIC_FIREBASE_PROJECT_ID**
```
名前: NEXT_PUBLIC_FIREBASE_PROJECT_ID
値: signal-v1-fc481
環境: Production, Preview, Development (全てチェック)
```

**4. NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET**
```
名前: NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
値: signal-v1-fc481.firebasestorage.app
環境: Production, Preview, Development (全てチェック)
```

**5. NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID**
```
名前: NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
値: 913459926537
環境: Production, Preview, Development (全てチェック)
```

**6. NEXT_PUBLIC_FIREBASE_APP_ID**
```
名前: NEXT_PUBLIC_FIREBASE_APP_ID
値: 1:913459926537:web:3f27082cdf1e913c444ad8
環境: Production, Preview, Development (全てチェック)
```

**7. NODE_ENV**
```
名前: NODE_ENV
値: production
環境: Production のみチェック
```

### Step 5: 各環境変数の追加方法

1. **「Add New」** ボタンをクリック
2. **「Name」** フィールドに変数名を入力
3. **「Value」** フィールドに値を入力
4. **環境を選択**:
   - Production ✅
   - Preview ✅  
   - Development ✅
   （NODE_ENVのみProductionだけ）
5. **「Save」** ボタンをクリック

### Step 6: 設定完了後の確認

全ての環境変数を追加したら：

1. **「Deployments」** タブに移動
2. **「Redeploy」** をクリック（最新のデプロイを再実行）
3. または新しいデプロイが自動実行されるのを待つ

## 🎯 設定後のテスト

### 1. サイトアクセス
- 本番URL: `https://admin-dbfprnp08-ishida-marinas-projects.vercel.app`
- ダッシュボードが正常に表示されるか確認

### 2. Firebase接続テスト
- ダッシュボードの **「接続テスト」** ボタンをクリック
- 「✅ Firebase接続テスト成功！」が表示されればOK

### 3. サンプルデータ作成
- **「サンプルデータ作成」** ボタンをクリック
- Firestoreにデータが正常に作成されるか確認

## ❗ よくある問題

### 問題1: 環境変数が反映されない
**解決法**: 
1. 環境変数追加後に **Redeploy** を実行
2. ブラウザのキャッシュクリア（Ctrl+F5 / Cmd+Shift+R）

### 問題2: Firebase接続エラー
**確認点**:
- 環境変数名のスペルミス
- 値のコピペミス
- 環境（Production/Preview/Development）の選択ミス

### 問題3: 設定画面が見つからない
**手順**:
1. [vercel.com/dashboard](https://vercel.com/dashboard)
2. `admin` プロジェクトをクリック
3. 上部の「Settings」タブ
4. 左側の「Environment Variables」

## 📞 サポート

設定でわからないことがあれば：
1. スクリーンショットを撮って質問
2. エラーメッセージをコピペして報告
3. どの手順でつまづいているか教えてください

## ✅ 設定完了チェックリスト

- [ ] Vercel Dashboard にアクセス
- [ ] admin プロジェクトを選択
- [ ] Settings → Environment Variables に移動
- [ ] 7つの環境変数を追加
- [ ] Redeploy 実行
- [ ] サイトで接続テスト成功
- [ ] サンプルデータ作成成功

全てチェックできたら設定完了です！🎉
