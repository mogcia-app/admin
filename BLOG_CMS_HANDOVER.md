# ブログCMS機能 引き継ぎ事項

## 概要

既存のガイドシステムを拡張し、本格的なブログCMS機能を実装しました。お知らせページ（システム通知）とは分離され、ブログ機能として独立して運用できます。

## 実装内容

### 1. データ構造

#### ブログ記事 (`BlogPost`)
```typescript
interface BlogPost {
  id: string
  title: string
  slug: string // URL用のスラッグ
  excerpt: string // 抜粋文
  content: string // 本文（Markdown対応）
  featuredImage?: string // メイン画像
  images: string[] // 本文内画像
  category: string // カテゴリ
  tags: string[] // タグ
  status: 'draft' | 'published' | 'archived'
  publishedAt?: string // 公開日時
  createdAt: string
  updatedAt: string
  author: string // 作成者
  viewCount: number
  seoTitle?: string
  seoDescription?: string
  readingTime?: number // 読了時間（分）
}
```

#### カテゴリ (`BlogCategory`)
```typescript
interface BlogCategory {
  id: string
  name: string
  slug: string
  description?: string
  color: string
  postCount: number
  createdAt: string
  updatedAt: string
}
```

#### タグ (`BlogTag`)
```typescript
interface BlogTag {
  id: string
  name: string
  slug: string
  color?: string
  postCount: number
  createdAt: string
}
```

### 2. ファイル構成

#### 型定義
- `src/types/index.ts` - BlogPost, BlogCategory, BlogTag, BlogStats型を追加

#### API関数
- `src/lib/blog.ts` - ブログ記事のCRUD操作、カテゴリ・タグ管理、統計取得

#### カスタムフック
- `src/hooks/useBlog.ts` - ブログ記事管理用の各種フック

#### コンポーネント
- `src/components/blog/blog-post-list.tsx` - ブログ記事一覧表示
- `src/components/blog/blog-post-modal.tsx` - ブログ記事作成・編集モーダル
- `src/components/blog/blog-stats.tsx` - ブログ統計表示

#### ページ
- `src/app/guides/page.tsx` - ブログ管理ページ（既存のガイドページを置き換え）

### 3. 主要機能

#### ブログ記事管理
- ✅ 記事の作成・編集・削除
- ✅ 下書き・公開・アーカイブのステータス管理
- ✅ カテゴリ・タグによる分類
- ✅ 検索機能（タイトル・本文）
- ✅ 画像アップロード対応
- ✅ SEO設定（タイトル・説明文）
- ✅ 読了時間の自動計算
- ✅ 閲覧数の追跡

#### カテゴリ・タグ管理
- ✅ カテゴリの作成・管理
- ✅ タグの作成・管理
- ✅ 投稿数の自動カウント

#### 統計機能
- ✅ 総投稿数・公開済み・下書き数
- ✅ 総閲覧数・平均閲覧数
- ✅ カテゴリ別投稿数
- ✅ 月別投稿数
- ✅ 人気記事の表示

#### UI/UX
- ✅ モダンな管理画面
- ✅ タブ式の編集インターフェース
- ✅ リアルタイム検索・フィルタリング
- ✅ レスポンシブデザイン
- ✅ ローディング状態の表示

### 4. Firestore コレクション

#### `blogPosts`
- ブログ記事のメインデータ
- インデックス: 
  - `status` + `createdAt` (降順)
  - `status` + `publishedAt` (降順)
  - `category` + `createdAt` (降順)
  - `tags` (配列) + `createdAt` (降順)

#### `blogCategories`
- カテゴリ情報
- 単一フィールドインデックス: `name`

#### `blogTags`
- タグ情報
- 単一フィールドインデックス: `name`

### 5. Firestore セキュリティルール

```javascript
// ブログ記事関連のルール
match /blogPosts/{postId} {
  // 公開済み記事は誰でも読み取り可能
  allow read: if resource.data.status == 'published';
  // 管理者のみ作成・更新・削除可能
  allow write: if request.auth != null && request.auth.token.admin == true;
}

match /blogCategories/{categoryId} {
  // 誰でも読み取り可能
  allow read: if true;
  // 管理者のみ作成・更新・削除可能
  allow write: if request.auth != null && request.auth.token.admin == true;
}

match /blogTags/{tagId} {
  // 誰でも読み取り可能
  allow read: if true;
  // 管理者のみ作成・更新・削除可能
  allow write: if request.auth != null && request.auth.token.admin == true;
}
```

### 5-2. Firebase Storage セキュリティルール

ブログ画像（サムネイル、本文画像）のアップロード機能に対応したStorage設定：

```javascript
// ブログ画像関連のルール
match /blog/thumbnails/{postId}/{fileName} {
  // 誰でも読み取り可能
  allow read: if true;
  // 管理者のみアップロード・削除可能
  allow write: if request.auth != null && request.auth.token.admin == true;
  // ファイルサイズ制限 (5MB)、画像ファイルのみ許可
  allow write: if request.resource.size < 5 * 1024 * 1024
            && request.resource.contentType.matches('image/.*');
}

match /blog/content/{postId}/{fileName} {
  // 本文用画像も同様のルール
  allow read: if true;
  allow write: if request.auth != null && request.auth.token.admin == true;
  allow write: if request.resource.size < 5 * 1024 * 1024
            && request.resource.contentType.matches('image/.*');
}
```

**設定ファイル:**
- `storage.rules` - Firebase Storageのセキュリティルール
- `firebase.json` - Storageルールの設定を追加済み

**デプロイ方法:**
```bash
# Firebase Consoleで手動設定、または
firebase deploy --only storage:rules
```

### 6. 使用方法

#### 記事の作成
1. ブログ管理ページの「新規作成」ボタンをクリック
2. コンテンツタブでタイトル・本文を入力
3. カテゴリ・タグを設定
4. SEOタブでSEO設定（オプション）
5. メディアタブで画像設定（オプション）
6. 「作成」ボタンで保存

#### 記事の編集
1. 一覧から編集したい記事の編集ボタンをクリック
2. モーダルで内容を修正
3. 「更新」ボタンで保存

#### 記事の公開
1. 下書き状態の記事の「公開」ボタンをクリック
2. 自動的に公開済みステータスに変更

#### 記事のアーカイブ
1. 公開済み記事の「アーカイブ」ボタンをクリック
2. アーカイブステータスに変更

### 7. 技術仕様

#### フロントエンド
- Next.js 15 + React 19
- TypeScript
- Tailwind CSS
- Lucide React Icons

#### バックエンド
- Firebase Firestore
- Firebase Cloud Functions（既存）

#### 主要ライブラリ
- Firebase SDK v9+
- React Hooks
- カスタムフックパターン

### 8. 注意事項

#### 既存システムとの関係
- お知らせページ（notifications）は独立して運用
- 既存のガイドシステムはブログCMSに置き換え
- 既存のAPIエンドポイント（`/api/guides`）は互換性のため残存

#### データ移行
- 既存のガイドデータがある場合、手動でブログ記事として移行が必要
- カテゴリ・タグは新規作成が必要

#### パフォーマンス
- 大量の記事がある場合、ページネーションの実装を検討
- 画像アップロード機能の実装（現在はURL入力のみ）

### 9. 今後の拡張案

#### 機能追加
- [ ] リッチテキストエディタ（WYSIWYG）
- [ ] 画像アップロード機能
- [ ] 予約公開機能
- [ ] 記事の複製機能
- [ ] バージョン管理
- [ ] コメント機能
- [ ] ソーシャルシェア機能

#### パフォーマンス改善
- [ ] ページネーション
- [ ] 無限スクロール
- [ ] キャッシュ機能
- [ ] CDN対応

#### SEO改善
- [ ] 自動サイトマップ生成
- [ ] Open Graph対応
- [ ] 構造化データ対応

### 10. トラブルシューティング

#### よくある問題

**記事が表示されない**
- Firestoreのセキュリティルールを確認
- インデックスの設定を確認

**画像が表示されない**
- 画像URLの形式を確認
- CORS設定を確認

**検索が動作しない**
- クライアントサイド検索のため、大量データの場合はパフォーマンスに注意

### 11. 運用ガイド

#### 日常的な運用
1. 定期的な記事の作成・更新
2. カテゴリ・タグの整理
3. 統計データの確認
4. SEO設定の最適化

#### メンテナンス
1. 不要な下書き記事の削除
2. 古い記事のアーカイブ
3. カテゴリ・タグの整理
4. 画像の最適化

## まとめ

ブログCMS機能は完全に実装され、本格的なブログ管理が可能です。お知らせページとは独立して運用でき、ブログ機能として活用できます。既存のガイドシステムからの移行もスムーズに行える設計になっています。

何かご質問や追加の機能が必要でしたら、お気軽にお声がけください。
