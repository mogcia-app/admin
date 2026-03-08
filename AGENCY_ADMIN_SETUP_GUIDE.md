# Agency Admin 初期設定 手順書

この手順書は、運営本部用 `hq-admin` とは別に、営業代理店向け `agency-admin` アプリを安全に立ち上げるためのガイドです。

## 0. 前提

- 既存の親管理アプリ（このリポジトリ）が稼働中であること
- Firebase プロジェクトは **親管理と同じ** プロジェクトを使用すること
- Firestore Rules は `agencyId` 境界を含む最新版が反映済みであること

## 1. 全体方針（重要）

1. データベースは共通（同一 Firebase Project）
2. Web アプリは分離（`hq-admin` と `agency-admin` は別 App / 別 URL）
3. 認可は必ずサーバー/Rules 側で強制（UI だけに依存しない）

## 2. Firebase 側の設定

### 2-1. 同一 Firebase Project を利用

- 例: `signal-v1-fc481`

### 2-2. Web App を新規追加（agency-admin用）

Firebase Console > Project Settings > Your apps から Web App を追加。

- 既存 `hq-admin` 用 App とは別 App にする
- 発行される Firebase config を `agency-admin` 側 `.env` に設定

### 2-3. 認証ドメイン許可

Authentication > Settings > Authorized domains で以下を追加。

- `agency-admin.example.com`（本番）
- `localhost`（開発）

## 3. デプロイ構成

### 3-1. URL分離

- 親管理: `hq-admin.example.com`
- 子管理: `agency-admin.example.com`

### 3-2. 環境変数分離

`agency-admin` 側には専用 `.env` を用意。

最低限:
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

## 4. ロール・データ境界

### 4-1. ロール

- `hq_admin`: 運営本部（全代理店可）
- `agency_admin`: 代理店管理者（自社のみ）
- `user`: 一般利用者

### 4-2. 必須フィールド

`users/{uid}` に以下を保持:

- `role`
- `agencyId`（`agency_admin` と代理店配下ユーザーは必須）

### 4-3. 代理店管理者の作成元

- 代理店管理者アカウントは **親管理 `/agencies` からのみ** 付与する
- 作成時に `role=agency_admin` + `agencyId` を必ず設定する

## 5. agency-admin 側で最初に実装すべき制御

1. ログイン後に `role === 'agency_admin'` をチェック
2. 一致しない場合は 404 またはアクセス拒否
3. すべてのクエリに `where('agencyId', '==', currentAgencyId)` を入れる
4. Firestore Rules でも同一条件を強制

## 6. 監査ログ

`auditLogs` に以下を必ず記録:

- `user.create`
- `user.update`
- `user.suspend`
- `user.activate`
- `user.delete`

推奨項目:
- `tenantType: 'agency'`
- `agencyId`
- `actor.uid / actor.email / actor.role`
- `target`
- `changes`
- `metadata`（IP/UA/requestId）

## 7. 初期テスト手順（必須）

1. 親管理で代理店を1件作成
2. 親管理で代理店管理者を1件付与
3. `agency-admin` からその管理者でログイン
4. 自社 `agencyId` のユーザーのみ表示されることを確認
5. 他社 `agencyId` のユーザーが 1件も表示/取得できないことを確認
6. 操作ログが `/audit-logs` に記録されることを確認

## 8. リリース前チェックリスト

- [ ] Firestore Rules 最新版デプロイ済み
- [ ] Firestore Indexes デプロイ済み
- [ ] `agency-admin` ドメインが Authorized domains に登録済み
- [ ] 代理店管理者以外のログイン拒否を確認
- [ ] 他社データ参照不可を確認（UI + Rules 両方）
- [ ] 主要操作の `auditLogs` 記録を確認

## 9. 運用ルール（推奨）

- 代理店管理者アカウント発行/停止は親管理のみで実施
- 代理店側での権限変更は原則禁止（必要時のみ親管理で実施）
- 監査ログは更新/削除せず追記専用で保持
