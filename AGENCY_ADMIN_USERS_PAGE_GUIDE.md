# Agency Admin 向け `/users` 実装引き継ぎガイド

この資料は、既存の親管理 `src/app/users/page.tsx` をベースに、`agency-admin` 側で安全に実装するための引き継ぎ用です。

## 1. 目的

- 代理店管理者が「自社配下ユーザー」だけを管理できる `/users` 画面を提供する
- 親管理と同じ操作感を維持しつつ、`agencyId` 境界を強制する
- 役割を明確に分離する
  - 親管理 `/users`: signaltool.app エンドユーザー管理（本部運用）
  - 親管理 `/agencies`: 代理店管理者（`agency_admin`）の付与
  - 子管理 `agency-admin /users`: 代理店がエンドユーザーを直接付与

## 2. 参照元（親管理実装）

- [src/app/users/page.tsx](/Users/marina/Desktop/admin/src/app/users/page.tsx)
- [src/components/users/user-modal.tsx](/Users/marina/Desktop/admin/src/components/users/user-modal.tsx)
- [src/hooks/useUsers.ts](/Users/marina/Desktop/admin/src/hooks/useUsers.ts)
- [src/lib/firebase-admin.ts](/Users/marina/Desktop/admin/src/lib/firebase-admin.ts)

## 3. agency-admin での必須差分

### 3-1. データ境界

- 一覧取得時に必ず `where('agencyId', '==', currentAgencyId)` を適用
- 作成時に `agencyId=currentAgencyId` を固定注入
- 更新時に `agencyId` 変更を禁止
- 削除/停止は自社 `agencyId` 対象のみ

### 3-2. ロール制限

- 作成可能ロールは原則 `user` のみ
- `agency_admin` / `hq_admin` への昇格UIは出さない
- 作成時に `role='user'` を固定（入力させない）

### 3-3. 表示制限

- 他社データ件数、他社 `agencyId`、全社横断集計は非表示
- 親管理専用項目（全社向け統計等）は削除

## 4. 画面仕様（推奨）

### 4-1. 一覧テーブル列

- 名前
- メール
- プラン階層
- 操作（... メニュー: 詳細/編集/削除）

### 4-2. フィルタ

- タブ: `すべて / 稼働中 / 停止中`
- 検索: 名前・メール

### 4-3. 行動線

- 新規ユーザー追加
- 編集
- 停止/再開
- 削除

## 5. 作成フォーム仕様

- 必須: 名前、メール、初期パスワード（8文字以上）、プラン階層
- 作成時に以下を自動セット
  - `agencyId = currentAgencyId`
  - `role = 'user'`
  - `status = 'active'`
- `agencyId` と `role` はフォームから編集不可（システム固定値）

## 6. 親管理 `/users` との住み分け

### 6-1. 表示対象

- 親管理 `/users` は `role='user'` のみ表示
- `agency_admin` は表示しない（`/agencies` 管理対象）

### 6-2. 直販ユーザーの区分（推奨）

将来的な運用混在を避けるため、`users` に区分フィールドを追加する。

推奨例:
- `salesChannel: 'direct' | 'agency'`

運用ルール:
- 親管理で直接付与するユーザー: `salesChannel='direct'`, `agencyId` なし
- 代理店経由で付与するユーザー: `salesChannel='agency'`, `agencyId` 必須

表示ルール例:
- 親管理 `/users`: `role='user'` を基本に、必要なら `salesChannel` フィルタを提供
- 子管理 `/users`: `role='user'` かつ `agencyId=currentAgencyId` 固定

## 7. 監査ログ（必須）

以下を `auditLogs` へ追記:

- `user.create`
- `user.update`
- `user.suspend`
- `user.activate`
- `user.delete`

推奨 payload:
- `tenantType: 'agency'`
- `agencyId: currentAgencyId`
- `actor`
- `target`
- `changes`

## 8. 実装チェックリスト

- [ ] ログインユーザーの `role==='agency_admin'` を確認
- [ ] `currentAgencyId` が取得できない場合は画面表示しない
- [ ] 一覧クエリに `agencyId` フィルタがある
- [ ] 作成時に `agencyId` を固定注入している
- [ ] 作成時に `role='user'` を固定注入している
- [ ] 更新時に `agencyId` 書き換え不可
- [ ] 操作ごとに `auditLogs` が記録される
- [ ] 他社ユーザーが1件も表示されない（手動検証）

## 9. 最低限の受け入れ基準

1. 代理店A管理者でログインし、代理店Bユーザーが見えない
2. 代理店Aでユーザー作成すると `agencyId=A` で保存される
3. 編集/削除/停止の各操作が `auditLogs` に記録される
4. URL直叩きでも他社データは取得不可（Rulesでブロック）
