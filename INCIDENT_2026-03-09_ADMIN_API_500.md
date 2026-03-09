# インシデント記録: 本番 `/api/admin/*` の 500 エラー（2026-03-09）

## 概要
本番環境で管理画面の複数APIが `500 Internal Server Error` を返し、画面側では `Unexpected token '<'`（JSON想定なのにHTMLが返る）も発生した。

影響API（代表）:
- `/api/admin/intake-links?limit=200`
- `/api/admin/maintenance`
- `/api/admin/maintenance/audit-logs?limit=100`
- `/api/admin/ui-events/sidebar-clicks`
- `/api/admin/users/:uid/onboarding-meta`
- `/api/admin/users/:uid/ai-usage`

## 症状
- ブラウザコンソール: `Failed to load resource: the server responded with a status of 500`
- クライアント例外: `Expected JSON but received text/html ... Response starts with: <!DOCTYPE html>...`
- Vercelログ（重要）:
  - `Cannot find module './functions/parse'` (require stack: `semver` -> `jsonwebtoken` -> `firebase-admin`)
  - `認証ユーザー情報の取得に失敗しました: ... DECODER routines::unsupported`

## 根本原因
主因は2点。

1. **Firebase Admin秘密鍵の形式不正（最終的な致命点）**
- `FIREBASE_ADMIN_PRIVATE_KEY` の値が不正形式で、Admin SDK初期化/認証時にOpenSSLデコードエラー (`DECODER routines::unsupported`) を起こしていた。
- その結果、`adminFirestore()` 経由処理が失敗し、管理APIが500化。

2. **本番バンドル設定が依存ファイル解決を壊していた（副次要因）**
- `next.config.ts` の `outputFileTracingExcludes` により、実行時に `semver` の内部ファイル解決が壊れ、`Cannot find module './functions/parse'` が発生。
- `firebase-admin` 配下（jsonwebtoken/semver依存）が起動時に落ちる条件を作っていた。

## 実施した対応
### 1) エラー可視化強化
- クライアント側の `response.json()` 直呼びを安全パーサーに置換。
- HTMLレスポンス時に「どのURLが何を返したか」をメッセージ化。

追加:
- `src/lib/http-response.ts`

### 2) Admin API 実行環境の明示
- Firebase Admin利用APIを `runtime = 'nodejs'` に固定。

対象:
- `src/app/api/admin/intake-links/route.ts`
- `src/app/api/admin/maintenance/route.ts`
- `src/app/api/admin/maintenance/audit-logs/route.ts`
- `src/app/api/admin/ui-events/sidebar-clicks/route.ts`
- `src/app/api/admin/users/[uid]/onboarding-meta/route.ts`
- `src/app/api/admin/users/[uid]/ai-usage/route.ts`

### 3) Firebase Admin秘密鍵の頑健化
- `FIREBASE_ADMIN_PRIVATE_KEY` の前後引用符や `\n` を吸収する正規化を実装。
- 初期化失敗時のログ情報を強化。

対象:
- `src/lib/firebase-admin-server.ts`

### 4) トレース除外設定の削除
- 依存解決を壊す可能性のあった設定を削除。

対象:
- `next.config.ts`
- 削除: `output: 'standalone'`, `outputFileTracingExcludes`

### 5) 認証失敗の明示化
- `verifyIdToken` / ユーザー取得失敗を `認証...失敗` で返すよう改善。

対象:
- `src/lib/admin-api-auth.ts`

### 6) 本番環境変数の修正
- Firebaseサービスアカウント鍵を新規発行し、Vercelに再設定。

必須変数:
- `FIREBASE_ADMIN_PROJECT_ID`
- `FIREBASE_ADMIN_CLIENT_EMAIL`
- `FIREBASE_ADMIN_PRIVATE_KEY`
- `INVITE_LINK_SECRET`

## 最終的な解決
- `FIREBASE_ADMIN_PRIVATE_KEY` を正しい値で再設定（鍵再発行）し、再デプロイ。
- `/api/admin/*` の500は解消。

## 再発防止
1. Vercel env更新時に以下チェックを必須化
- `FIREBASE_ADMIN_*` 3点が同一サービスアカウントJSON由来であること
- `FIREBASE_ADMIN_PRIVATE_KEY` に `BEGIN/END PRIVATE KEY` が含まれること

2. 管理APIのランタイムは `nodejs` 明示を継続

3. `next.config.ts` で依存解決に影響する `outputFileTracingExcludes` の安易な追加を禁止

4. 監視運用
- `/api/admin/maintenance` をヘルスチェック対象に追加
- `MODULE_NOT_FOUND` / `DECODER routines::unsupported` をアラート条件化

## 参考ログ（要約）
- `Cannot find module './functions/parse'` (semver)
- `認証ユーザー情報の取得に失敗しました: ... DECODER routines::unsupported`

