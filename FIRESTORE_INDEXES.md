# Firebase Firestore インデックス設定ガイド

## 🔥 インデックスエラーの解決方法

KPIダッシュボードを使用する際に、以下のようなFirebaseインデックスエラーが発生する場合があります：

```
FirebaseError: The query requires an index. You can create it here: https://console.firebase.google.com/...
```

## 🚀 解決方法

### 方法1: 自動インデックス作成（推奨）

1. **エラーメッセージのリンクをクリック**
   - コンソールに表示されるFirebase Console のリンクをクリック
   - 自動的にインデックス作成ページに移動します

2. **インデックスを作成**
   - 「インデックスを作成」ボタンをクリック
   - 数分でインデックスが作成されます

### 方法2: Firebase CLI でインデックスをデプロイ

```bash
# Firebase CLI でインデックスをデプロイ
firebase deploy --only firestore:indexes
```

### 方法3: 手動でインデックスを作成

Firebase Console で以下のインデックスを手動作成：

#### KPIメトリクス用インデックス
- **コレクション**: `kpiMetrics`
- **フィールド**:
  - `isActive` (昇順)
  - `category` (昇順)  
  - `name` (昇順)

#### リテンションメトリクス用インデックス
- **コレクション**: `retentionMetrics`
- **フィールド**:
  - `cohort` (降順)
  - `period` (昇順)

## 🛠️ 現在の対策

コードを修正して、複合インデックスが不要なクエリに変更しました：

### 修正内容

1. **KPIメトリクス取得**
   ```typescript
   // 修正前（複合インデックス必要）
   const q = query(
     collection(db, 'kpiMetrics'), 
     where('isActive', '==', true),
     orderBy('category'),
     orderBy('name')
   )

   // 修正後（シンプルクエリ + クライアントサイドソート）
   const q = query(
     collection(db, 'kpiMetrics'), 
     where('isActive', '==', true)
   )
   // クライアントサイドでソート処理
   ```

2. **リテンションメトリクス取得**
   ```typescript
   // 修正前（複合インデックス必要）
   const q = query(
     collection(db, 'retentionMetrics'),
     orderBy('cohort', 'desc'),
     orderBy('period')
   )

   // 修正後（シンプルクエリ + クライアントサイドソート）
   const q = query(
     collection(db, 'retentionMetrics'),
     orderBy('cohort', 'desc')
   )
   // クライアントサイドでソート処理
   ```

## 📊 インデックス設定ファイル

`firestore.indexes.json` ファイルに将来必要になる可能性のあるインデックスを定義済み：

- KPIメトリクス複合インデックス
- リテンションメトリクス複合インデックス
- 売上データ日付インデックス
- ユーザー獲得データ日付インデックス
- エンゲージメントデータ日付インデックス

## ⚡ パフォーマンス最適化

### クライアントサイドソートの利点
- インデックス作成不要
- 即座に動作
- 小規模データセットでは高速

### 注意点
- データ量が多い場合はサーバーサイドソートが推奨
- 1000件以上のデータでは Firebase インデックスを使用

## 🔧 今後の改善案

データ量が増加した場合：

1. **Firebase インデックスの作成**
2. **ページネーション実装**
3. **データキャッシング**
4. **リアルタイム更新の最適化**

---

## 💡 Tips

- Firebase Console でクエリパフォーマンスを監視
- 大量データの場合は事前にインデックス作成
- 開発環境では Firestore Emulator を活用
