# 契約期間管理機能

## 概要

Signal Appの利用者契約期間を自動管理し、契約期間外のユーザーはログインできないようにする機能を実装しました。

## 実装内容

### 1. 契約期間のチェック機能

#### `src/lib/firebase-admin.ts`

```typescript
// 契約が有効かチェック
async isContractActive(userId: string): Promise<boolean>

// 契約期間を延長
async extendContract(userId: string, months: number): Promise<void>

// 契約を再開（期限切れユーザー用）
async reactivateContract(userId: string, newEndDate: string): Promise<void>
```

### 2. 管理画面での契約管理

#### 利用者詳細モーダル

- **契約期間内**: 
  - 「契約期間+1年」ボタンで延長
  - 「途中解約（ログイン停止）」ボタンで即座にログイン停止
- **契約期間切れ**: 「契約を再開（1年間）」ボタンで1年間再開

利用者の詳細表示画面から：
1. 期間切れユーザー → 「契約を再開（1年間）」ボタンで1年間再開
2. 有効ユーザー → 「契約期間+1年」で1年延長、「途中解約」で即座に停止

### 3. Firestoreルールでの制御

#### `firestore.rules`

契約期間チェック機能を追加：

```javascript
function isContractActive() {
  let userData = get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
  let now = request.time;
  let contractEndDate = userData.contractEndDate;
  let status = userData.status;
  
  return status == 'active' && 
         contractEndDate != null && 
         contractEndDate.toDate() > now;
}
```

### 4. 別プロジェクト（Signal App）での制御

別プロジェクト（Signal App）でFirebase Authを使ってログインする際は、以下の方法で契約期間をチェックできます：

#### 方法1: カスタムクレームを使用（推奨）

Firebase Admin SDKを使用してカスタムクレームを設定：

```javascript
// Firebase Admin SDKでの設定例
const admin = require('firebase-admin');

async function setUserClaims(uid, contractData) {
  const customClaims = {
    contractActive: contractData.status === 'active' && 
                     new Date(contractData.contractEndDate) > new Date(),
    contractEndDate: contractData.contractEndDate
  };
  
  await admin.auth().setCustomUserClaims(uid, customClaims);
}
```

Signal App側でのチェック：

```javascript
import { onAuthStateChanged } from 'firebase/auth';

onAuthStateChanged(auth, async (user) => {
  if (user) {
    const tokenResult = await user.getIdTokenResult();
    
    if (!tokenResult.claims.contractActive) {
      // 契約期間が切れています
      alert('契約期間が終了しました。管理者にご連絡ください。');
      await signOut(auth);
      return;
    }
    
    // 正常な処理
  }
});
```

#### 方法2: Firestoreデータを直接チェック

Signal Appのログイン時にユーザーデータを確認：

```javascript
import { doc, getDoc } from 'firebase/firestore';

async function checkContract(user) {
  const userRef = doc(db, 'users', user.uid);
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) {
    throw new Error('ユーザーデータが見つかりません');
  }
  
  const userData = userDoc.data();
  const now = new Date();
  const endDate = new Date(userData.contractEndDate);
  
  if (userData.status !== 'active' || endDate <= now) {
    // 契約期間が切れています
    await signOut(auth);
    throw new Error('契約期間が終了しています');
  }
  
  return userData;
}
```

## 使用方法

### 契約期間の延長

1. 管理画面のユーザー一覧から、対象ユーザーを選択
2. 「詳細表示」ボタンをクリック
3. 契約管理セクションから「契約期間+1年」ボタンをクリック
4. 確認ダイアログで「OK」をクリック

**契約期間は常に1年単位で更新されます。**

### 途中解約（ログイン停止）

1. 管理画面のユーザー一覧から、対象ユーザーを選択
2. 「詳細表示」ボタンをクリック
3. 「途中解約（ログイン停止）」ボタンをクリック
4. 確認ダイアログで「OK」をクリック

これにより：
- ユーザーのステータスが「suspended」（停止）になる
- 契約終了日が現在の日付に設定される
- isActiveがfalseになる
- Signal Appにログインできなくなる

### 契約期間切れユーザーの再開

1. 管理画面のユーザー一覧から、期間切れユーザーを選択
2. 「詳細表示」ボタンをクリック
3. 「契約を再開（1年間）」ボタンをクリック
4. 確認ダイアログで「OK」をクリック

**再開時は常に1年間の契約として再開されます。**

## データ構造

### User型

```typescript
interface User {
  id: string
  name: string
  email: string
  status: 'active' | 'inactive' | 'suspended'
  contractType: 'annual' | 'trial'
  contractStartDate: string // ISO 8601形式
  contractEndDate: string // ISO 8601形式
  // ... その他のフィールド
}
```

## 契約の自動更新について

### 基本フロー

1. **お試し期間**: 1ヶ月間（無料）
2. **本契約**: お試し期間終了後、1年間の有料契約
3. **自動更新**: 1年ごとに自動的に契約期間が延長される（管理者が延長ボタンをクリック）

### 契約管理パターン

```
お試し登録 → 1ヶ月（無料） → 本契約 → 1年後 → 延長 → 1年後 → ...
```

- 管理者は契約延長・解約を管理画面から操作
- 途中解約は「途中解約」ボタンで即座に停止可能
- ユーザーデータ（SNS設定など）は全て保持され、再開時に引き継がれる

## 注意事項

1. **Firestoreルールの設定**: `firestore.rules`を本番環境にデプロイする前に、開発用の広範囲なアクセス許可を削除してください。

2. **別プロジェクトでの実装**: Signal App側で契約期間チェックを実装する必要があります。上記の方法1（カスタムクレーム）を推奨します。

3. **自動ログアウト**: 契約期間が切れたユーザーまたは途中解約されたユーザーは、Signal App側で自動的にログアウトされます。

4. **再開時のデータ**: 契約期間が切れてもユーザーデータ（SNS設定、事業情報など）は削除されず、再開時に引き継がれます。

5. **契約期間**: 基本的に1年単位での管理となります。月単位での延長はありません。

## トラブルシューティング

### ルールが効かない場合

1. Firestoreルールがデプロイされているか確認
2. 開発用の広範囲なアクセス許可（`allow read, write: if true;`）が残っていないか確認

### 契約延長が反映されない場合

1. ブラウザのリロードを実行
2. Firestoreのデータを直接確認
3. ブラウザコンソールでエラーログを確認

## 関連ファイル

- `src/lib/firebase-admin.ts` - 契約管理機能
- `src/app/users/page.tsx` - 管理画面UI
- `firestore.rules` - Firestoreセキュリティルール
- `src/types/index.ts` - 型定義
