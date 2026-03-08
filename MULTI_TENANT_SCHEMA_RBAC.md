# マルチテナント設計: `agencies` / `users` / `auditLogs`

このドキュメントは、親管理（運営本部）と子管理（営業代理店）を分離した運用のための最小構成を定義します。

## 1. コレクション設計

### 1-1. `agencies/{agencyId}`
代理店テナント本体。

必須フィールド:
- `id: string`
- `name: string`
- `code: string`（一意。表示・外部連携に利用）
- `status: 'active' | 'inactive' | 'suspended'`
- `createdAt: string (ISO8601)`
- `updatedAt: string (ISO8601)`
- `createdBy: string`（親管理の uid or email）

任意フィールド:
- `contactName: string`
- `contactEmail: string`
- `contactPhone: string`
- `note: string`

インデックス推奨:
- `status ASC, createdAt DESC`
- `code ASC`（一意チェック用途）

### 1-2. `users/{userId}`
既存 `users` を継続利用。代理店配下かどうかを `agencyId` で識別。

必須追加フィールド（新運用）:
- `agencyId?: string`（代理店配下は必須。本部アカウントは未設定可）
- `role: 'hq_admin' | 'agency_admin' | 'user' | (互換: 'admin' | 'moderator')`

運用ルール:
- `role='agency_admin'` の場合は `agencyId` 必須
- `role='user'` かつ代理店配下運用なら `agencyId` 必須
- 親管理者 `hq_admin` は `agencyId` 未設定を許容

インデックス推奨:
- `agencyId ASC, status ASC, createdAt DESC`
- `agencyId ASC, role ASC`
- `email ASC`

### 1-3. `auditLogs/{logId}`
全操作の監査ログ。親管理画面の監視に利用。

必須フィールド:
- `id: string`
- `tenantType: 'hq' | 'agency'`
- `action: string`（例: `user.create`, `user.suspend`, `agency.create`）
- `actor.uid: string`
- `actor.role: string`
- `createdAt: string (ISO8601)`

条件付き必須:
- `tenantType='agency'` の場合 `agencyId` 必須

任意フィールド:
- `actor.email: string`
- `target.type: 'agency' | 'user' | 'system'`
- `target.id: string`
- `changes: object`（変更差分）
- `metadata: object`（IP, userAgent, requestId など）

インデックス推奨:
- `agencyId ASC, createdAt DESC`
- `action ASC, createdAt DESC`
- `actor.uid ASC, createdAt DESC`

## 2. 権限マトリクス

ロール定義:
- `hq_admin`: 運営本部（親管理）
- `agency_admin`: 代理店管理者（子管理）
- `user`: 利用者

### 2-1. `agencies`
| 操作 | hq_admin | agency_admin | user |
|---|---|---|---|
| 一覧閲覧 | 可 | 不可 | 不可 |
| 詳細閲覧 | 可 | 自社のみ可（任意） | 不可 |
| 作成 | 可 | 不可 | 不可 |
| 更新 | 可 | 不可（または自社の連絡先のみ可） | 不可 |
| 停止/再開 | 可 | 不可 | 不可 |

### 2-2. `users`
| 操作 | hq_admin | agency_admin | user |
|---|---|---|---|
| 一覧閲覧 | 全件可 | 自社 `agencyId` のみ可 | 不可 |
| 詳細閲覧 | 全件可 | 自社のみ可 | 自分のみ可 |
| 作成 | 全件可 | 自社のみ可 | 不可 |
| 更新 | 全件可 | 自社のみ可（role昇格不可） | 自分の限定項目のみ |
| 停止/再開 | 全件可 | 自社のみ可 | 不可 |
| 削除 | 全件可 | 原則不可（必要時のみ可） | 不可 |
| role変更 | 可 | 不可（または自社内の限定変更のみ） | 不可 |

### 2-3. `auditLogs`
| 操作 | hq_admin | agency_admin | user |
|---|---|---|---|
| 一覧閲覧 | 全件可 | 自社 `agencyId` のみ可 | 不可 |
| 詳細閲覧 | 全件可 | 自社のみ可 | 不可 |
| 作成 | システム経由で可 | システム経由で可 | 不可 |
| 更新/削除 | 不可（監査保全） | 不可 | 不可 |

## 3. セキュリティ境界（必須）

- Firestore Rules で `agencyId` 境界を強制する
- クライアント側のフィルタだけに依存しない
- `auditLogs` は追記専用（append-only）
- `hq_admin` 付与は本部のみ実行可能

## 4. 最小導入順

1. `agencies` コレクション導入
2. `users.agencyId` と `role` 拡張
3. `auditLogs` 追記実装（create/update/suspend/delete の全操作）
4. Firestore Rules に `hq_admin / agency_admin` 境界追加
5. 親管理画面に代理店監視ダッシュボード追加
