# Agency Admin `/users` 実装指示書（実装用）

この指示書は、`agency-admin` 側で `/users` を実装するための具体的な手順です。

## 0. 先に結論

親管理 `/users` をそのまま流用しないこと。

理由:
- 親実装は `onSnapshot + 全件取得` 前提の箇所がある
- 代理店側は `agencyId` 境界を **取得時点** で強制する必要がある

## 1. 要件（必須）

1. 一覧は `role='user'` かつ `agencyId=currentAgencyId` のみ
2. 作成時は `role='user'` と `agencyId=currentAgencyId` をサーバー側で固定
3. 更新時に `agencyId` 変更禁止
4. 削除/停止は自社ユーザーのみ
5. 操作ごとに `auditLogs` へ追記

## 2. 画面構成（流用OK）

親 `/users` から以下は流用可:
- テーブルUI
- 検索UI
- `すべて / 稼働中 / 停止中` タブ
- 行の `...` メニュー
- ユーザーモーダルのレイアウト

## 3. データアクセス層（ここは新規で作る）

### 3-1. 追加ファイル

- `src/hooks/useAgencyUsers.ts`
- `src/lib/agency-users.ts`

### 3-2. 取得クエリ

必ず Firestore クエリで絞る:

```ts
query(
  collection(db, 'users'),
  where('agencyId', '==', currentAgencyId),
  where('role', '==', 'user'),
  orderBy('createdAt', 'desc')
)
```

### 3-3. 作成

入力値から `role` と `agencyId` を受け取らない。

```ts
const payload = {
  ...formInput,
  role: 'user',
  agencyId: currentAgencyId,
}
```

サーバー/API側でも再上書きして固定する（クライアント値を信用しない）。

### 3-4. 更新

更新前に対象ユーザーの `agencyId` を取得し、違えば即拒否。

```ts
if (target.agencyId !== currentAgencyId) throw new Error('Forbidden')
```

さらに更新 payload から `agencyId` を除外。

### 3-5. 削除/停止

`agencyId` 一致確認後のみ実行。

## 4. 認可ガード

### 4-1. ページ表示

- ログインユーザーが `agency_admin` でない場合は 404/拒否
- `currentAgencyId` が取れない場合は画面を表示しない

### 4-2. Firestore Rules

Rules側でも以下を強制:
- `request.auth != null`
- `currentUser.role == 'agency_admin'`
- `resource.data.agencyId == currentUser.agencyId`

## 5. 監査ログ

### 5-1. 必須イベント

- `user.create`
- `user.update`
- `user.suspend`
- `user.activate`
- `user.delete`

### 5-2. payload

```ts
{
  tenantType: 'agency',
  agencyId: currentAgencyId,
  action: 'user.create',
  actor: { uid, email, role: 'agency_admin' },
  target: { type: 'user', id, name },
  changes: { ... }
}
```

## 6. 禁止事項

1. `collection('users')` の全件取得
2. 画面側フィルタだけで他社データを除外
3. `role`/`agencyId` をフォーム編集可能にする
4. Rules なしで「URL分離だけ」で安全と判断する

## 7. 受け入れテスト

1. 代理店A管理者でログイン
2. 代理店Aユーザーのみ表示される
3. 代理店Bユーザーは0件
4. 作成時に `role='user'` と `agencyId='A'` で保存される
5. 編集で `agencyId` 変更ができない
6. 各操作が `auditLogs` に記録される

## 8. 実装完了条件

- [ ] `useAgencyUsers` が `agencyId + role` 条件で購読
- [ ] 作成APIで `role/user` と `agencyId` を固定
- [ ] 更新/削除に agency 境界チェックあり
- [ ] 監査ログ記録あり
- [ ] Rules で越境ブロック確認済み
