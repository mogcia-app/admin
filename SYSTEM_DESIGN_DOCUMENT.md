# Signal App Admin Panel - システム設計書

## 📋 目次
1. [システム概要](#システム概要)
2. [アーキテクチャ](#アーキテクチャ)
3. [認証・セキュリティ](#認証セキュリティ)
4. [ページ別機能詳細](#ページ別機能詳細)
5. [外部システム連携](#外部システム連携)
6. [データベース設計](#データベース設計)
7. [API仕様](#api仕様)
8. [デプロイメント](#デプロイメント)
9. [運用・監視](#運用監視)
10. [開発者向け詳細情報](#開発者向け詳細情報)
11. [トラブルシューティング](#トラブルシューティング)
12. [FAQ](#faq)

---

## システム概要

### 🎯 目的
Signal Appの管理者専用パネルとして、ユーザー管理、AI機能制御、システム管理を統合的に行うWebアプリケーション。

**現在実装済みの機能**:
- Signal Appの利用者（顧客）の管理・サポート ✅
- AI機能の制御・最適化 ✅
- 基本的なシステム監視 ✅
- ツール側メンテナンス制御 ✅

**未実装・開発中の機能**:
- ビジネス指標の監視・分析 🚧
- 高度なシステム監視・ログ管理 🚧
- 完全な認証システム 🚧

### 🏢 対象ユーザー
**管理者アカウント（固定3名のみ）**:
- **石田真梨奈** (super_admin) - スーパー管理者
  - 全機能へのアクセス権限
  - システム設定の変更権限
  - 他の管理者の管理権限
- **堂本寛人** (admin) - 管理者  
  - ユーザー管理・AI機能・KPI監視
  - 通知・プロンプト管理
  - エラー監視・アクセス制御
- **北村健太郎** (admin) - 管理者
  - ユーザー管理・AI機能・KPI監視
  - 通知・プロンプト管理
  - エラー監視・アクセス制御

### 🛠️ 技術スタック

#### フロントエンド
- **Next.js 15.5.3**: React フレームワーク（App Router使用）
- **React 18**: UI ライブラリ
- **TypeScript**: 型安全な開発
- **Tailwind CSS**: スタイリング
- **Lucide React**: アイコンライブラリ

#### バックエンド
- **Firebase Cloud Functions**: サーバーレス関数
- **Firestore**: NoSQL データベース
- **Firebase Authentication**: 認証システム
- **Firebase Storage**: ファイルストレージ

#### デプロイ・インフラ
- **Vercel**: フロントエンドデプロイ
- **Firebase Hosting**: 静的ファイル配信
- **Cloudflare**: CDN・セキュリティ

#### 外部連携
- **OpenAI API**: AI機能
- **ツール側プロジェクト**: メンテナンス制御・エラー監視

### 📊 システム規模
- **実装済みページ**: 6ページ（ユーザー管理、AIアシスタント、アクセス制御、エラー監視、通知管理、プロンプト管理）
- **開発中ページ**: 4ページ（KPI、プロフィール、設定、ガイド管理）
- **コンポーネント数**: 50+ コンポーネント
- **API エンドポイント**: 8+ エンドポイント（実装済み）
- **データベースコレクション**: 6+ コレクション（実装済み）
- **想定同時接続数**: 3名（管理者のみ）
- **データ量**: 小規模（数百レコード）
- **配信範囲**: 管理者3名限定（認証必須）
- **想定ユーザー数**: 顧客数百名程度

### 🚧 実装状況
- **完成度**: 約60%（基本機能は実装済み）
- **本番対応**: 部分対応（ユーザー管理、AI機能は本番対応済み）
- **未実装機能**: 認証システム、KPI分析、高度な監視機能

---

## アーキテクチャ

### 🏗️ システム構成図

#### 📱 ユーザー層（誰が使うか）
```
┌─────────────────────────────────────────────────────────────────┐
│                    👥 ユーザー層                                │
├─────────────────┬─────────────────┬─────────────────────────────┤
│  🛠️ 管理者      │  👤 顧客        │  🤖 外部AIサービス          │
│  (3名固定)      │  (Signal App    │                             │
│                 │   利用者)       │  ┌─────────────────────────┐ │
│  ┌─────────────┐│  ┌─────────────┐│  │  🧠 OpenAI API          │ │
│  │ 📊 ダッシュ  ││  │ 📱 顧客向け ││  │     (AI機能提供)        │ │
│  │    ボード   ││  │    アプリ   ││  └─────────────────────────┘ │
│  │ 👥 ユーザー  ││  │             ││  ┌─────────────────────────┐ │
│  │    管理     ││  │             ││  │  🔮 その他AIサービス    │ │
│  │ 🤖 AIチャット││  │             ││  │     (将来追加予定)      │ │
│  │ 📈 KPI監視  ││  │             ││  └─────────────────────────┘ │
│  │ 🔍 エラー    ││  │             ││                             │
│  │    監視     ││  │             ││                             │
│  └─────────────┘│  └─────────────┘│                             │
└─────────────────┴─────────────────┴─────────────────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
```

#### 🏢 処理層（どう動くか）
```
┌─────────────────────────────────────────────────────────────────┐
│                    ⚙️ 処理・データ層                            │
├─────────────────┬─────────────────┬─────────────────────────────┤
│  🔐 認証システム │  💾 データベース │  🚀 API処理サーバー         │
│  (ログイン管理) │  (情報保存)      │  (ビジネスロジック)          │
│                 │                 │                             │
│  ┌─────────────┐│  ┌─────────────┐│  ┌─────────────────────────┐ │
│  │ 👨‍💼 管理者   ││  │ 👥 ユーザー  ││  │  👥 ユーザー管理API      │ │
│  │    アカウント││  │    データ   ││  │  🤖 AI機能API           │ │
│  │   (3名固定) ││  │ 💬 チャット  ││  │  📊 KPI計算API          │ │
│  │             ││  │    履歴     ││  │  🔧 メンテナンスAPI      │ │
│  │             ││  │ 📝 ログ     ││  │  🔍 エラー監視API       │ │
│  └─────────────┘│  └─────────────┘│  └─────────────────────────┘ │
└─────────────────┴─────────────────┴─────────────────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
```

#### 🌐 配信層（物理的な配信経路）
```
┌─────────────────────────────────────────────────────────────────┐
│                    🚀 配信インフラ層                            │
├─────────────────┬─────────────────┬─────────────────────────────┤
│  🚀 Vercel      │  🔥 Firebase    │  🛡️ Cloudflare              │
│  (管理画面配信)  │  (ファイル配信)  │  (高速化・攻撃防御)          │
│                 │                 │                             │
│  📱 管理画面を   │  📄 静的ファイル │  🌏 世界中のサーバーから     │
│     配信        │     を配信      │     高速配信                │
│                 │                 │  🛡️ DDoS攻撃から保護         │
└─────────────────┴─────────────────┴─────────────────────────────┘
```

#### 🔐 アクセス制御層（誰が見られるか）
```
┌─────────────────────────────────────────────────────────────────┐
│                    🔒 アクセス制御・セキュリティ層              │
├─────────────────┬─────────────────┬─────────────────────────────┤
│  🔐 Firebase    │  👨‍💼 管理者権限  │  🛡️ セキュリティ保護        │
│  Authentication │  (3名固定)      │  (認証・権限管理)            │
│                 │                 │                             │
│  🔑 ログイン認証 │  👥 石田・堂本・ │  🚫 一般公開なし            │
│  🔐 トークン検証 │     北村のみ    │  🔒 管理者以外アクセス禁止   │
│  🛡️ セッション  │  📊 全機能利用   │  📝 アクセスログ記録         │
│     管理        │     可能        │  ⚠️ 不正アクセス検知         │
└─────────────────┴─────────────────┴─────────────────────────────┘
```

#### 🔄 配信とセキュリティの関係
```
📱 ユーザーアクセス
    ↓
🛡️ Cloudflare (DDoS防御・高速配信)
    ↓
🚀 Vercel (管理画面配信)
    ↓
🔐 Firebase Auth (認証チェック)
    ↓
👨‍💼 管理者権限確認 (3名のみ)
    ↓
📱 管理画面表示 (認証済みユーザーのみ)
```

#### 📋 概念の整理

| 概念 | 説明 | 責任範囲 |
|------|------|----------|
| **配信層** | Vercel / Firebase Hosting から管理画面を配信 | 物理的にデータを届ける経路 |
| **限定配信** | 管理者3名のみアクセス可能、一般公開なし | 誰が見られるかのアクセス制御 |
| **認証** | Firebase Auth + 管理者権限で厳格にアクセス制御 | ユーザー認証・権限管理 |
| **セキュリティ** | Cloudflare が外部攻撃やDDoSから保護 | インフラレベルの保護 |

#### 💡 重要なポイント

**🔹 配信とセキュリティの役割分担**
- **配信層（Vercel / Firebase Hosting / Cloudflare）** = 「物理的にデータを届ける経路」
- **限定配信・認証必須** = 「誰が見られるかのアクセス制御」
- この2つは役割が違うがセットで使うことで、安全かつ高速な管理画面配信になる

**🔹 Signal Admin の場合**
- 配信対象は管理者3名のみ
- 「限定配信」= 認証済みユーザーしかアクセスできない配信
- Cloudflare や CDN で全世界に公開しているわけではなく、認証チェック（Firebase Auth）を通過したユーザーだけがアクセス可能

**🔹 ポイント**
- CloudflareやVercelは配信のためのインフラ
- 管理者以外が見られないようにするのは認証・権限設定の責任

#### 🔄 データの流れ（矢印付き）
```
👨‍💼 管理者操作
    ↓
📱 管理画面
    ↓
🚀 Cloud Functions (権限チェック・ログ記録)
    ↓
💾 Firestore データベース
    ↓
📱 顧客アプリ (リアルタイム更新)
    ↓
👤 顧客が変更を確認

👤 顧客操作
    ↓
📱 顧客アプリ
    ↓
🚀 Cloud Functions (データ保存・ログ記録)
    ↓
💾 Firestore データベース
    ↓
📱 管理画面 (リアルタイム更新)
    ↓
👨‍💼 管理者が変更を確認

🤖 AI機能使用時
    ↓
📱 アプリ (質問入力)
    ↓
🚀 Cloud Functions (テンプレート回答チェック)
    ↓
🧠 OpenAI API (AI回答生成)
    ↓
💾 Firestore (チャット履歴保存)
    ↓
📱 アプリ (回答表示)
```

#### 📝 システム構成図の説明

**🔝 最上位レイヤー（ユーザーインターフェース）**
- **Admin Panel (Next.js)**: 管理者が使う管理画面
  - Dashboard: システム全体の概要を表示
  - Users: 顧客（Signal App利用者）の管理
  - AI Chat: AIアシスタントとの対話
  - KPI: ビジネス指標の監視
  - Monitor: エラー監視
- **Tool Project (Customer)**: 顧客が使うSignal App本体
  - Customer Interface: 顧客向けのメインアプリ
- **External Services**: 外部のAIサービス
  - OpenAI API: AI機能を提供する外部サービス
  - Other AI Services: 将来的に追加予定のAIサービス

**🔗 中間レイヤー（データ・API）**
- **Shared Firebase Backend**: 共通のバックエンドシステム
  - **Authentication**: ユーザー認証（ログイン管理）
    - Admin Users: 管理者3名のアカウント
  - **Firestore**: データベース
    - Users Data: 顧客データ
    - Chats: AIチャット履歴
    - Logs: システムログ
  - **Cloud Functions**: サーバー処理
    - User Management: ユーザー管理の処理
    - AI Assistant: AI機能の処理
    - KPI Calculation: 売上計算の処理
    - Maintenance Control: メンテナンス制御
    - Error Monitoring: エラー監視

**🌐 最下位レイヤー（配信・CDN）**
- **Vercel**: 管理画面の配信サーバー
- **Firebase Hosting**: 静的ファイルの配信
- **Cloudflare**: 高速配信とセキュリティ

#### 🔄 データの流れ（双方向通信）

**📤 管理者から顧客への流れ**
1. **管理者**が管理画面で操作（ユーザー作成、設定変更等）
2. **管理画面**がCloud Functions APIを呼び出し
3. **Cloud Functions**が権限チェック・ログ記録を実行
4. **Firestore**がデータベースを更新
5. **顧客アプリ**がリアルタイムでデータ変更を検知
6. **顧客アプリ**が新しい設定・情報を表示

**📥 顧客から管理者への流れ**
1. **顧客**がアプリで操作（AIチャット、エラー発生等）
2. **顧客アプリ**がCloud Functions APIを呼び出し
3. **Cloud Functions**がデータ保存・ログ記録を実行
4. **Firestore**がデータベースを更新
5. **管理画面**がリアルタイムでデータ変更を検知
6. **管理画面**が新しい情報・エラーを表示

#### 🤖 外部AIサービス呼び出しの経路と目的

**AI機能の呼び出しフロー**
```
管理者/顧客 → 管理画面/顧客アプリ → Cloud Functions → OpenAI API → 回答生成 → 元に戻る
```

**具体的な処理**:
1. **ユーザー**がAIチャットで質問を入力
2. **Cloud Functions**がテンプレート回答をチェック
3. **テンプレート回答がない場合**:
   - Cloud FunctionsがOpenAI APIを呼び出し
   - APIキー・認証情報を安全に管理
   - トークン使用量を記録・監視
4. **AI回答**をCloud Functionsが受信
5. **チャット履歴**をFirestoreに保存
6. **ユーザー**に回答を表示

**AI機能の目的**:
- **顧客サポート**: 24時間対応の自動回答
- **データ分析**: ユーザー行動の分析・レポート生成
- **コンテンツ生成**: SNS投稿の自動生成
- **コスト削減**: テンプレート回答でAIトークン使用量を削減

#### 🛡️ Cloud Functionsの役割（BFF + セキュリティ）

**BFF（Backend for Frontend）としての機能**:
- **API統合**: 複数の外部サービスを統合
- **データ変換**: フロントエンド用にデータを最適化
- **キャッシュ管理**: 頻繁にアクセスするデータをキャッシュ
- **エラーハンドリング**: 統一されたエラー処理

**セキュリティ・権限管理**:
```typescript
// Cloud Functions内での権限チェック例
export const createUser = functions.https.onRequest(async (req, res) => {
  try {
    // 1. 認証トークンを検証
    const token = req.headers.authorization?.replace('Bearer ', '')
    const decodedToken = await admin.auth().verifyIdToken(token)
    
    // 2. 管理者権限をチェック
    const adminUser = await getAdminUser(decodedToken.uid)
    if (!adminUser || adminUser.role !== 'admin') {
      res.status(403).json({ error: 'Access denied' })
      return
    }
    
    // 3. 操作ログを記録
    await logAdminAction(adminUser.id, 'createUser', req.body)
    
    // 4. ビジネスロジックを実行
    const result = await createUserInDatabase(req.body)
    
    // 5. 成功レスポンス
    res.status(200).json({ success: true, data: result })
  } catch (error) {
    // 6. エラーログを記録
    await logError('createUser', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})
```

**ログ管理・監査機能**:
- **エラーログ**: システムエラーの詳細記録 ✅ **実装済み**
  - レベル別分類 (info, warn, error, fatal)
  - ソース別分類 (client, server, api, database)
  - 解決状況管理、タグ機能
- **操作ログ**: 誰がいつ何をしたかを記録 ❌ **未実装**
- **アクセスログ**: API呼び出しの記録 ❌ **未実装**
- **セキュリティログ**: 不正アクセスの検知・記録 ❌ **未実装**

#### 🔐 セキュリティ・認証・配信保護のポイント

**認証・認可の多層防御**:
```
1. ブラウザレベル: Firebase Auth（JWT トークン）
2. APIレベル: Cloud Functions（トークン検証）
3. データベースレベル: Firestore Security Rules
4. ネットワークレベル: HTTPS + CORS設定
```

**データ保護**:
- **暗号化**: 通信時（HTTPS）と保存時（Firestore暗号化）
- **アクセス制御**: 管理者のみがアクセス可能
- **データ分離**: 各管理者のデータを完全分離
- **バックアップ**: 定期的なデータバックアップ

**配信・CDN保護**:
- **DDoS攻撃対策**: Cloudflareの保護機能
- **SSL証明書**: 自動更新される暗号化通信
- **キャッシュ制御**: 適切なキャッシュ設定
- **地理的分散**: 世界中のCDNサーバーで高速配信

**監視・アラート**:
- **リアルタイム監視**: システム状態の継続監視
- **異常検知**: 不正アクセス・エラーの自動検知
- **アラート通知**: 問題発生時の即座通知
- **ログ分析**: セキュリティインシデントの分析

#### 🔄 リアルタイム同期の仕組み

**Firestoreのリアルタイム機能**:
```typescript
// 管理者がユーザー情報を更新
const updateUser = async (userId: string, data: UserData) => {
  // 1. Cloud Functionsで更新処理
  await admin.firestore().collection('users').doc(userId).update(data)
  // 2. Firestoreが自動的に変更を検知
  // 3. 接続中の全クライアントに変更を通知
}

// 顧客アプリでリアルタイム監視
const unsubscribe = onSnapshot(
  doc(db, 'users', userId),
  (doc) => {
    // 4. データ変更を即座に受信
    const userData = doc.data()
    // 5. UIを自動更新
    setUser(userData)
  }
)
```

**双方向通信の利点**:
- **即座の反映**: 変更がリアルタイムで反映
- **データ整合性**: 全クライアントでデータが同期
- **ユーザー体験**: 待機時間なしのスムーズな操作
- **エラー防止**: 古いデータによる操作ミスを防止

### 📁 詳細ディレクトリ構造

```
admin/                                    # プロジェクトルート
├── src/                                 # ソースコード
│   ├── app/                            # Next.js App Router
│   │   ├── access-control/             # アクセス制御ページ
│   │   │   ├── layout.tsx              # レイアウト
│   │   │   └── page.tsx                # メインページ
│   │   ├── ai-assistant/               # AIアシスタントページ
│   │   │   ├── layout.tsx              # レイアウト
│   │   │   └── page.tsx                # メインページ
│   │   ├── analytics/                  # アナリティクスページ
│   │   ├── guides/                     # ガイド管理ページ
│   │   │   ├── [guideId]/              # 動的ルート
│   │   │   │   ├── delete/             # 削除ページ
│   │   │   │   └── edit/               # 編集ページ
│   │   │   ├── new/                    # 新規作成ページ
│   │   │   ├── GuideList.tsx           # ガイド一覧コンポーネント
│   │   │   ├── layout.tsx              # レイアウト
│   │   │   └── page.tsx                # メインページ
│   │   ├── kpi/                        # KPIダッシュボード
│   │   ├── monitoring/                 # エラー監視ページ
│   │   ├── notifications/              # 通知管理ページ
│   │   ├── prompts/                    # プロンプト管理ページ
│   │   ├── settings/                   # 設定ページ
│   │   ├── users/                      # ユーザー管理ページ
│   │   ├── api/                        # API ルート
│   │   │   ├── ai/                     # AI関連API
│   │   │   │   └── route.ts            # AI API エンドポイント
│   │   │   ├── dashboard/              # ダッシュボードAPI
│   │   │   └── users/                  # ユーザーAPI
│   │   │       └── route.ts            # ユーザーAPI エンドポイント
│   │   ├── globals.css                 # グローバルスタイル
│   │   ├── layout.tsx                  # ルートレイアウト
│   │   └── page.tsx                    # ホームページ
│   ├── components/                     # Reactコンポーネント
│   │   ├── access-control/             # アクセス制御関連
│   │   │   ├── feature-control-card.tsx
│   │   │   └── system-status-card.tsx
│   │   ├── ai-assistant/               # AIアシスタント関連
│   │   │   ├── ai-capabilities.tsx
│   │   │   ├── chat-interface.tsx
│   │   │   └── chat-sidebar.tsx
│   │   ├── auth/                       # 認証関連
│   │   │   ├── auth-guard.tsx
│   │   │   └── login-form.tsx
│   │   ├── blog/                       # ブログ関連
│   │   ├── charts/                     # チャート関連
│   │   ├── kpi/                        # KPI関連
│   │   ├── layout/                     # レイアウト関連
│   │   │   ├── admin-layout.tsx
│   │   │   ├── header.tsx
│   │   │   └── sidebar.tsx
│   │   ├── monitoring/                 # 監視関連
│   │   ├── notifications/              # 通知関連
│   │   ├── prompts/                    # プロンプト関連
│   │   ├── settings/                   # 設定関連
│   │   ├── users/                      # ユーザー関連
│   │   └── ui/                         # UI コンポーネント
│   │       ├── avatar.tsx
│   │       ├── badge.tsx
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── checkbox.tsx
│   │       ├── dialog.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       ├── progress.tsx
│   │       ├── select.tsx
│   │       ├── separator.tsx
│   │       ├── switch.tsx
│   │       └── textarea.tsx
│   ├── contexts/                       # React Context
│   │   └── auth-context.tsx            # 認証コンテキスト
│   ├── hooks/                          # カスタムフック
│   │   ├── useAccessControl.ts         # アクセス制御フック
│   │   ├── useAIAssistant.ts           # AIアシスタントフック
│   │   ├── useBlog.ts                  # ブログフック
│   │   ├── useFirebase.ts              # Firebaseフック
│   │   ├── useKPI.ts                   # KPIフック
│   │   ├── useMonitoring.ts            # 監視フック
│   │   ├── useNotifications.ts         # 通知フック
│   │   ├── usePrompts.ts               # プロンプトフック
│   │   ├── useSettings.ts              # 設定フック
│   │   └── useUsers.ts                 # ユーザーフック
│   ├── lib/                            # ライブラリ・ユーティリティ
│   │   ├── access-control.ts           # アクセス制御ロジック
│   │   ├── admin-users.ts              # 管理者ユーザー管理
│   │   ├── ai-assistant.ts             # AIアシスタントロジック
│   │   ├── ai-client.ts                # AI クライアント
│   │   ├── ai-service.ts               # AI サービス
│   │   ├── api-config.ts               # API設定
│   │   ├── api-dashboard.ts            # ダッシュボードAPI
│   │   ├── api-kpi.ts                  # KPI API
│   │   ├── api-notifications.ts        # 通知API
│   │   ├── blog.ts                     # ブログロジック
│   │   ├── charts.ts                   # チャートロジック
│   │   ├── comprehensive-templates.ts  # 包括的テンプレート
│   │   ├── constants.ts                # 定数定義
│   │   ├── firebase-admin.ts           # Firebase Admin SDK
│   │   ├── firebase-test.ts            # Firebase テスト
│   │   ├── firebase.ts                 # Firebase 設定
│   │   ├── kpi.ts                      # KPI ロジック
│   │   ├── monitoring.ts               # 監視ロジック
│   │   ├── notifications.ts            # 通知ロジック
│   │   ├── prompts.ts                  # プロンプトロジック
│   │   ├── settings.ts                 # 設定ロジック
│   │   ├── storage.ts                  # ストレージロジック
│   │   ├── template-responses.ts       # テンプレート回答
│   │   └── utils.ts                    # ユーティリティ関数
│   ├── pages/                          # Pages Router（レガシー）
│   │   └── api/                        # API ルート
│   │       └── guides.ts               # ガイドAPI
│   ├── types/                          # TypeScript型定義
│   │   └── index.ts                    # 型定義集
│   ├── utils/                          # ユーティリティ
│   ├── middleware.ts                   # Next.js ミドルウェア
│   └── globals.css                     # グローバルスタイル
├── functions/                          # Firebase Cloud Functions
│   ├── src/                            # ソースコード
│   │   └── index.ts                    # メイン関数
│   ├── lib/                            # コンパイル済みJS
│   ├── node_modules/                   # 依存関係
│   ├── package.json                    # パッケージ設定
│   ├── package-lock.json               # 依存関係ロック
│   └── tsconfig.json                   # TypeScript設定
├── public/                             # 静的ファイル
│   ├── file.svg                        # アイコンファイル
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
├── .env.local                          # 環境変数（ローカル）
├── .gitignore                          # Git除外設定
├── .vercelignore                       # Vercel除外設定
├── eslint.config.mjs                   # ESLint設定
├── firebase.json                       # Firebase設定
├── firestore.indexes.json              # Firestoreインデックス
├── firestore.rules                     # Firestoreセキュリティルール
├── next.config.ts                      # Next.js設定
├── next-env.d.ts                       # Next.js型定義
├── package.json                        # パッケージ設定
├── package-lock.json                   # 依存関係ロック
├── postcss.config.mjs                  # PostCSS設定
├── README.md                           # プロジェクト説明
├── storage.rules                       # Storageセキュリティルール
├── tsconfig.json                       # TypeScript設定
└── vercel.json                         # Vercel設定
```

### 🔄 データフロー

#### 1. ユーザー認証フロー
```
1. 管理者がログインページにアクセス
2. メールアドレス・パスワードを入力
3. Firebase Authentication で認証
4. 管理者権限をチェック（固定3名のみ）
5. 認証成功時：管理画面にリダイレクト
6. 認証失敗時：エラーメッセージ表示
```

#### 2. データ取得フロー
```
1. ページコンポーネントがマウント
2. カスタムフック（useUsers等）が実行
3. Firebase SDK で Firestore にクエリ
4. データを取得・変換
5. React State に保存
6. コンポーネントが再レンダリング
7. UI にデータを表示
```

#### 3. AI機能フロー
```
1. ユーザーがチャットで質問入力
2. テンプレート回答システムでキーワードチェック
3. テンプレート回答がある場合：即座に回答
4. テンプレート回答がない場合：OpenAI API に送信
5. AI が回答を生成
6. 回答をチャット履歴に保存
7. UI に回答を表示
```

### 🏛️ アーキテクチャパターン

#### 1. コンポーネント設計
- **Atomic Design**: 原子・分子・有機体・テンプレート・ページ
- **Container/Presentational**: ロジックと表示の分離
- **Custom Hooks**: ビジネスロジックの再利用

#### 2. 状態管理
- **React Context**: グローバル状態（認証情報）
- **Local State**: コンポーネント固有の状態
- **Server State**: Firebase からのデータ

#### 3. データ管理
- **Repository Pattern**: データアクセス層の抽象化
- **Service Layer**: ビジネスロジックの分離
- **Type Safety**: TypeScript による型安全性

---

## 認証・セキュリティ

### 🔐 認証システム

#### Firebase Authentication
- **認証方式**: メールアドレス + パスワード
- **管理者権限**: 固定3名のみアクセス可能
- **セッション管理**: 自動ログイン状態維持

#### 管理者アカウント
```typescript
const ADMIN_USERS = [
  {
    id: 'admin_001',
    email: 'marina.ishida@signalapp.jp',
    name: '石田真梨奈',
    role: 'super_admin'
  },
  {
    id: 'admin_002', 
    email: 'hiroto.domoto@signalapp.jp',
    name: '堂本寛人',
    role: 'admin'
  },
  {
    id: 'admin_003',
    email: 'kentarou.kitamura@signalapp.jp',
    name: '北村健太郎', 
    role: 'admin'
  }
]
```

#### セキュリティ機能
- **AuthGuard**: 全ページを保護
- **管理者権限チェック**: 固定管理者のみアクセス
- **ユーザー固有データ分離**: 各管理者のデータを完全分離
- **自動ログアウト**: セッション切れ時の自動リダイレクト

---

## ページ別機能詳細

### 1. 🏠 ダッシュボード (`/`)

#### 📋 概要
システム全体の概要と主要メトリクスを一覧表示するメインページ。管理者が最初にアクセスするページで、システムの健全性を素早く把握できる。

#### 🎯 主要機能

**1. 統計カード表示**
- **総ユーザー数**: Signal Appの登録ユーザー総数
- **アクティブユーザー数**: 過去30日以内にログインしたユーザー数
- **月間売上**: 年間契約ユーザーからの月間収益
- **成長率**: 前月比の成長率（ユーザー数・売上）

**2. リアルタイム監視**
- **システム状態**: 各機能の稼働状況
- **エラー数**: 過去24時間のエラー発生数
- **API応答時間**: 主要APIの平均応答時間

**3. 最近のアクティビティ**
- **新規ユーザー登録**: 最新の登録ユーザー
- **AIチャット**: 最近のチャット履歴
- **通知配信**: 最近配信された通知
- **エラー発生**: 最近発生したエラー

**4. クイックアクション**
- **新規ユーザー作成**: ユーザー管理ページへの直接リンク
- **通知作成**: 通知管理ページへの直接リンク
- **AIチャット開始**: AIアシスタントページへの直接リンク

#### 🔧 技術実装

**データ取得**:
```typescript
// ダッシュボード用のカスタムフック
const useDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>()
  const [activities, setActivities] = useState<Activity[]>()
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    // 複数のAPIを並列で呼び出し
    Promise.all([
      getDashboardStats(),
      getRecentActivities(),
      getSystemStatus()
    ]).then(([stats, activities, status]) => {
      setStats(stats)
      setActivities(activities)
      setSystemStatus(status)
      setLoading(false)
    })
  }, [])
  
  return { stats, activities, loading }
}
```

**リアルタイム更新**:
```typescript
// 30秒ごとにデータを更新
useEffect(() => {
  const interval = setInterval(() => {
    refreshDashboardData()
  }, 30000)
  
  return () => clearInterval(interval)
}, [])
```

#### 📊 表示データ

**統計カード**:
- 総ユーザー数: `users.length`
- アクティブユーザー数: `users.filter(u => u.lastLoginAt > 30日前).length`
- 月間売上: `users.filter(u => u.contractType === 'annual').reduce((sum, u) => sum + u.revenue, 0)`
- 成長率: `(今月の値 - 先月の値) / 先月の値 * 100`

**アクティビティフィード**:
- ユーザー登録: 最新5件
- AIチャット: 最新3件
- 通知配信: 最新3件
- エラー発生: 最新5件

#### 🎨 UI/UX

**レイアウト**:
- **ヘッダー**: ページタイトル、更新ボタン、通知
- **統計カード**: 4列のグリッドレイアウト
- **アクティビティ**: 2列のレイアウト（左：統計、右：アクティビティ）
- **フッター**: システム情報、最終更新時刻

**レスポンシブ対応**:
- デスクトップ: 4列グリッド
- タブレット: 2列グリッド
- モバイル: 1列スタック

#### 🔄 更新頻度

- **統計データ**: 30秒ごと
- **アクティビティ**: 1分ごと
- **システム状態**: 10秒ごと
- **手動更新**: ボタンクリックで即座に更新

### 2. 👥 ユーザー管理 (`/users`)

#### 📋 概要
Signal Appの利用者（顧客）を包括的に管理するページ。ユーザーの登録、編集、削除、検索、フィルタリング、契約管理など、顧客管理に必要な全ての機能を提供。

#### 🎯 主要機能

**1. ユーザー一覧表示**
- **テーブル形式**: ユーザー情報を一覧表示
- **ページネーション**: 大量データの効率的な表示
- **ソート機能**: 各カラムでの昇順・降順ソート
- **一括選択**: 複数ユーザーの一括操作

**2. 検索・フィルタリング**
- **テキスト検索**: 名前、メール、会社名での検索
- **ステータスフィルター**: アクティブ、非アクティブ、停止中
- **契約タイプフィルター**: 年間契約、お試し契約
- **利用形態フィルター**: チーム、個人
- **業種フィルター**: 美容・コスメ、IT・テクノロジー等
- **登録日フィルター**: 期間指定での絞り込み

**3. ユーザー詳細管理**
- **基本情報**: 名前、メール、電話番号、住所
- **契約情報**: 契約タイプ、期間、SNS数、料金
- **ビジネス情報**: 業種、会社規模、事業内容、目標
- **SNS設定**: Instagram、X、TikTokの個別設定
- **AI設定**: 各SNSのAI機能設定

**4. ユーザー操作**
- **新規作成**: ユーザーアカウントの作成
- **編集**: 既存ユーザー情報の更新
- **削除**: ユーザーアカウントの削除
- **ステータス変更**: アクティブ/非アクティブ/停止の切り替え
- **パスワードリセット**: ユーザーのパスワード再設定

#### 🔧 技術実装

**データ取得**:
```typescript
// ユーザー管理用のカスタムフック
const useUsers = () => {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<UserFilters>({})
  
  // ユーザーデータの取得
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true)
      try {
        const usersData = await getUsers()
        setUsers(usersData)
        setFilteredUsers(usersData)
      } catch (error) {
        console.error('ユーザー取得エラー:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchUsers()
  }, [])
  
  // 検索・フィルタリング
  useEffect(() => {
    let filtered = users
    
    // テキスト検索
    if (searchQuery) {
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.businessInfo?.industry?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    // ステータスフィルター
    if (filters.status) {
      filtered = filtered.filter(user => user.status === filters.status)
    }
    
    // 契約タイプフィルター
    if (filters.contractType) {
      filtered = filtered.filter(user => user.contractType === filters.contractType)
    }
    
    setFilteredUsers(filtered)
  }, [users, searchQuery, filters])
  
  return {
    users: filteredUsers,
    loading,
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
    createUser,
    updateUser,
    deleteUser
  }
}
```

**ユーザー作成**:
```typescript
const createUser = async (userData: CreateUserData) => {
  try {
    // Firebase Authでユーザー作成
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      userData.email, 
      userData.password
    )
    
    // Firestoreにユーザー情報を保存
    const userDoc = {
      id: userCredential.user.uid,
      name: userData.name,
      email: userData.email,
      role: 'user',
      usageType: userData.usageType,
      contractType: userData.contractType,
      contractSNS: userData.contractSNS,
      snsAISettings: userData.snsAISettings,
      businessInfo: userData.businessInfo,
      status: 'active',
      contractStartDate: new Date().toISOString(),
      contractEndDate: userData.contractEndDate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    await setDoc(doc(db, 'users', userCredential.user.uid), userDoc)
    
    // ローカル状態を更新
    setUsers(prev => [userDoc, ...prev])
    
    return userCredential.user.uid
  } catch (error) {
    console.error('ユーザー作成エラー:', error)
    throw error
  }
}
```

#### 📊 データ構造

**ユーザー基本情報**:
```typescript
interface User {
  id: string                    // Firebase Auth UID
  name: string                  // ユーザー名
  email: string                 // メールアドレス
  role: 'admin' | 'user' | 'moderator'
  usageType: 'team' | 'solo'   // 利用形態
  contractType: 'annual' | 'trial'  // 契約タイプ
  contractSNS: ('instagram' | 'x' | 'tiktok')[]  // 契約SNS
  status: 'active' | 'inactive' | 'suspended'  // ステータス
  contractStartDate: string     // 契約開始日
  contractEndDate: string       // 契約終了日
  createdAt: string            // 登録日
  updatedAt: string            // 最終更新日
}
```

**ビジネス情報**:
```typescript
interface BusinessInfo {
  industry: string              // 業種
  companySize: 'individual' | 'small' | 'medium' | 'large'  // 会社規模
  businessType: 'b2b' | 'b2c' | 'both'  // 事業タイプ
  description: string           // 事業内容
  snsMainGoals: string[]        // SNS活用目標
  brandMission: string          // ブランドミッション
  targetCustomer: string        // ターゲット顧客
  uniqueValue: string           // 独自価値
  brandVoice: string            // ブランドボイス
  kpiTargets: string[]          // KPI目標
  challenges: string[]          // 課題
}
```

**SNS AI設定**:
```typescript
interface SNSAISettings {
  [sns: string]: {
    contentDirection: string    // コンテンツの方向性
    postFrequency: string       // 投稿頻度
    targetAction: string        // ターゲットアクション
    tone: string               // トーン＆マナー
    focusMetrics: string[]      // 重視する指標
    strategyNotes?: string      // 戦略メモ
  }
}
```

#### 🎨 UI/UX

**レイアウト構成**:
- **ヘッダー**: ページタイトル、検索バー、新規作成ボタン
- **フィルター**: ステータス、契約タイプ、利用形態等のフィルター
- **テーブル**: ユーザー一覧（ソート可能）
- **ページネーション**: ページ切り替え
- **モーダル**: ユーザー詳細・編集・作成

**テーブルカラム**:
1. **選択**: チェックボックス
2. **名前**: ユーザー名、アバター
3. **メール**: メールアドレス
4. **ステータス**: バッジ表示
5. **契約タイプ**: 年間契約/お試し契約
6. **利用形態**: チーム/個人
7. **業種**: ビジネス情報から取得
8. **登録日**: 作成日時
9. **操作**: 編集・削除ボタン

**検索・フィルター**:
- **検索バー**: リアルタイム検索
- **フィルターボタン**: ドロップダウンメニュー
- **クリアボタン**: フィルターリセット
- **保存された検索**: よく使う検索条件の保存

#### 🔄 操作フロー

**ユーザー作成フロー**:
1. 「新規ユーザー」ボタンをクリック
2. ユーザー情報入力フォームを表示
3. 必須項目を入力（名前、メール、パスワード等）
4. 契約情報を設定（タイプ、SNS数、期間等）
5. ビジネス情報を入力（業種、目標等）
6. SNS AI設定を設定
7. 確認画面で内容を確認
8. 作成ボタンでユーザーを作成
9. 成功メッセージを表示
10. ユーザー一覧に追加

**ユーザー編集フロー**:
1. ユーザー行の「編集」ボタンをクリック
2. ユーザー詳細モーダルを表示
3. 編集可能な項目を修正
4. 保存ボタンで変更を保存
5. 成功メッセージを表示
6. テーブルを更新

**ユーザー削除フロー**:
1. ユーザー行の「削除」ボタンをクリック
2. 確認ダイアログを表示
3. 削除理由を入力（オプション）
4. 削除ボタンで削除実行
5. 成功メッセージを表示
6. テーブルから削除

#### 📈 パフォーマンス最適化

**仮想スクロール**:
- 大量のユーザーデータを効率的に表示
- 表示領域外のデータは非表示

**遅延読み込み**:
- 初期表示は基本情報のみ
- 詳細情報は必要時に読み込み

**キャッシュ戦略**:
- ユーザーデータをメモリにキャッシュ
- 変更時のみAPIを呼び出し

**検索最適化**:
- デバウンス機能でAPI呼び出しを制限
- インデックスを活用した高速検索

### 3. 🤖 AIアシスタント (`/ai-assistant`)
**概要**: AI機能を活用した顧客サポート・管理支援

**機能**:
- チャット形式でのAI対話
- 顧客検索・情報取得
- テンプレート回答システム
- チャット履歴管理
- 機能別カテゴリ分類

**AI機能**:
- 顧客データ検索・分析
- ツール機能に関する質問回答
- データクエリ・レポート生成
- 多言語対応（日本語メイン）

### 4. 📊 KPIダッシュボード (`/kpi`)
**概要**: ビジネス指標の監視・分析

**機能**:
- 売上メトリクス（年間契約のみカウント）
- ユーザー成長率・チャーン率
- コンバージョン率分析
- 月次・年次レポート
- 目標設定・進捗管理

**主要KPI**:
- 総売上・月次売上
- アクティブユーザー数
- 新規ユーザー獲得数
- チャーン率・リテンション率
- ARPU・LTV

### 5. 🔔 通知管理 (`/notifications`)
**概要**: システム通知・お知らせの管理

**機能**:
- 通知作成・編集・削除
- 通知配信・スケジューリング
- 通知テンプレート管理
- 配信履歴・効果測定
- 対象ユーザー指定

**通知タイプ**:
- システムメンテナンス
- 機能アップデート
- 重要なお知らせ
- マーケティング情報

### 6. 🎯 プロンプト管理 (`/prompts`)
**概要**: AI用プロンプトテンプレートの管理

**機能**:
- プロンプト作成・編集・削除
- カテゴリ別分類
- 使用頻度・効果測定
- テンプレート共有
- バージョン管理

**カテゴリ**:
- システム用プロンプト
- ユーザー向けプロンプト
- アシスタント用プロンプト
- カスタムプロンプト

### 7. 🛡️ アクセス制御 (`/access-control`)
**概要**: システム機能のアクセス制御・メンテナンス管理

**機能**:
- 機能別アクセス制御
- メンテナンスモード管理
- システム状態監視
- 権限管理
- **ツール側メンテナンス制御**（重要機能）

**ツール側メンテナンス制御**:
- ツール側プロジェクトのメンテナンスモード切り替え
- メンテナンスメッセージ設定
- スケジュール設定（開始・終了時刻）
- リアルタイム状態確認

### 8. 📈 エラー監視 (`/monitoring`)
**概要**: システムエラーの監視・管理

**機能**:
- エラーログの収集・表示
- エラーレベル別分類
- エラー解決状況管理
- リアルタイム監視
- エラー統計・分析

**監視対象**:
- ツール側プロジェクトのエラー
- 管理パネル内のエラー
- API接続エラー
- データベースエラー

### 9. 📚 ガイド管理 (`/guides`)
**概要**: ユーザー向けガイド・ドキュメント管理

**機能**:
- ガイド作成・編集・削除
- カテゴリ別分類
- 公開・非公開設定
- バージョン管理
- アクセス統計

### 10. ⚙️ 設定 (`/settings`)
**概要**: システム設定・プロフィール管理

**機能**:
- 管理者プロフィール管理
- システム設定
- 通知設定
- セキュリティ設定
- 環境設定

---

## 外部システム連携

### 🔗 ツール側プロジェクト連携

#### 1. Firebase共有
**目的**: データベース・認証の共有

**共有リソース**:
- Firestore データベース
- Firebase Authentication
- Cloud Functions

**データ同期**:
- ユーザー情報の同期
- エラーログの共有
- メンテナンス状態の共有

#### 2. メンテナンス制御API
**目的**: ツール側のメンテナンスモード制御

**エンドポイント**:
```
POST /setToolMaintenanceMode
GET  /getToolMaintenanceStatus
```

**リクエスト例**:
```javascript
// メンテナンスモード有効化
const response = await fetch('/api/setToolMaintenanceMode', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    enabled: true,
    message: 'システムメンテナンス中です。しばらくお待ちください。',
    scheduledStart: '2024-01-01T00:00:00Z',
    scheduledEnd: '2024-01-01T06:00:00Z',
    updatedBy: 'admin_001'
  })
})
```

**レスポンス例**:
```json
{
  "success": true,
  "message": "ツール側のメンテナンスモードを更新しました",
  "data": {
    "enabled": true,
    "message": "システムメンテナンス中です。しばらくお待ちください。",
    "scheduledStart": "2024-01-01T00:00:00Z",
    "scheduledEnd": "2024-01-01T06:00:00Z",
    "updatedBy": "admin_001",
    "updatedAt": "2024-01-01T12:00:00Z"
  }
}
```

#### 3. エラー監視API
**目的**: ツール側からのエラーログ受信

**エンドポイント**:
```
POST /reportError
```

**リクエスト例**:
```javascript
// エラーログ送信
const response = await fetch('/api/reportError', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    level: 'error',
    message: 'Database connection failed',
    source: 'tool-side',
    stack: 'Error: Connection timeout...',
    metadata: {
      userId: 'user_123',
      action: 'data_fetch',
      timestamp: '2024-01-01T12:00:00Z'
    }
  })
})
```

### 🤖 AIサービス連携

#### 1. AI API統合
**目的**: 外部AIサービスとの連携

**対応サービス**:
- OpenAI API
- その他AIプロバイダー

**機能**:
- チャット応答生成
- データ分析・要約
- 自然言語処理
- テンプレート回答システム

#### 2. テンプレート回答システム
**目的**: AIトークンコスト削減

**機能**:
- キーワードベース回答
- ページ別カテゴリ分類
- 動的データ取得
- カスタム回答生成

---

## データベース設計

### 🗄️ Firestore コレクション構造

#### 1. ユーザー管理
```typescript
// users コレクション
interface User {
  id: string                    // Firebase Auth UID
  name: string
  email: string
  role: 'admin' | 'user' | 'moderator'
  usageType: 'team' | 'solo'
  contractType: 'annual' | 'trial'
  contractSNS: ('instagram' | 'x' | 'tiktok')[]
  snsAISettings: SNSAISettings
  businessInfo: BusinessInfo
  status: 'active' | 'inactive' | 'suspended'
  contractStartDate: string
  contractEndDate: string
  billingInfo?: BillingInfo
  createdAt: string
  updatedAt: string
}
```

#### 2. AIチャット
```typescript
// aiChats コレクション
interface AdminAIChat {
  id: string
  title: string
  adminId: string              // 管理者ID（データ分離）
  messages: AIMessage[]
  createdAt: string
  updatedAt: string
}

interface AIMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  metadata?: {
    templateUsed?: string
    customerSearch?: boolean
    toolFunction?: boolean
    page?: string
    category?: string
    actionRequired?: boolean
  }
}
```

#### 3. 通知管理
```typescript
// notifications コレクション
interface Notification {
  id: string
  title: string
  content: string
  type: 'info' | 'warning' | 'error' | 'success'
  priority: 'low' | 'medium' | 'high'
  status: 'draft' | 'published' | 'archived'
  targetAudience: 'all' | 'active' | 'trial' | 'annual'
  createdBy: string            // 管理者ID
  tags: string[]
  isSticky: boolean
  scheduledAt?: string
  publishedAt?: string
  createdAt: string
  updatedAt: string
}
```

#### 4. システム設定
```typescript
// systemSettings コレクション
interface ToolMaintenanceSettings {
  enabled: boolean
  message: string
  scheduledStart?: string
  scheduledEnd?: string
  updatedBy: string
  updatedAt: string
}

// errorLogs コレクション
interface ErrorLog {
  id: string
  level: 'fatal' | 'error' | 'warn' | 'info'
  message: string
  source: string
  stack?: string
  metadata: Record<string, any>
  timestamp: string
  resolved: boolean
  resolvedBy?: string
  resolvedAt?: string
  count: number
}
```

---

## API仕様

### 🔌 Cloud Functions API

#### 1. ユーザー管理API
```typescript
// GET /api/users
// ユーザー一覧取得
Response: {
  users: User[],
  pagination: {
    page: number,
    limit: number,
    total: number,
    totalPages: number
  }
}

// POST /api/users
// ユーザー作成
Request: Partial<User>
Response: { success: boolean, id: string }
```

#### 2. メンテナンス制御API
```typescript
// POST /setToolMaintenanceMode
// ツール側メンテナンスモード設定
Request: {
  enabled: boolean,
  message: string,
  scheduledStart?: string,
  scheduledEnd?: string,
  updatedBy: string
}
Response: {
  success: boolean,
  message: string,
  data: ToolMaintenanceSettings
}

// GET /getToolMaintenanceStatus
// メンテナンス状態取得
Response: {
  success: boolean,
  data: ToolMaintenanceSettings
}
```

#### 3. エラー監視API
```typescript
// POST /reportError
// エラーログ送信
Request: {
  level: 'fatal' | 'error' | 'warn' | 'info',
  message: string,
  source: string,
  stack?: string,
  metadata?: Record<string, any>
}
Response: {
  success: boolean,
  id: string,
  message: string
}
```

---

## デプロイメント

### 🚀 Vercel デプロイメント

#### 環境設定
```bash
# 本番環境変数
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCvX4cKWKtn_qnh3CV-d1UC4GEiVpdPB9w
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=signal-v1-fc481.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=signal-v1-fc481
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=signal-v1-fc481.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=913459926537
NEXT_PUBLIC_FIREBASE_APP_ID=1:913459926537:web:3f27082cdf1e913c444ad8
NEXT_PUBLIC_FUNCTIONS_BASE_URL=https://us-central1-signal-v1-fc481.cloudfunctions.net
```

#### デプロイフロー
1. **コードプッシュ**: GitHub mainブランチにプッシュ
2. **自動ビルド**: Vercelが自動でビルド実行
3. **デプロイ**: 本番環境に自動デプロイ
4. **通知**: デプロイ完了通知

#### ドメイン設定
- **本番URL**: `https://admin.signalapp.jp`
- **管理URL**: Vercelダッシュボード
- **SSL証明書**: 自動更新

---

## 運用・監視

### 📊 監視項目

#### 1. システム監視
- **レスポンス時間**: ページ読み込み速度
- **エラー率**: 4xx/5xxエラーの発生率
- **稼働率**: システムの可用性
- **リソース使用率**: CPU・メモリ使用量

#### 2. ビジネス監視
- **ユーザー数**: アクティブユーザー・新規ユーザー
- **売上**: 月次売上・成長率
- **エラー**: システムエラーの発生状況
- **機能利用**: 各機能の利用頻度

#### 3. セキュリティ監視
- **認証**: ログイン試行・失敗
- **アクセス**: 不正アクセスの検知
- **データ**: データアクセスの監査ログ

### 🔧 メンテナンス

#### 定期メンテナンス
- **データベース最適化**: 月次
- **セキュリティ更新**: 月次
- **パフォーマンス監視**: 週次
- **バックアップ確認**: 日次

#### 緊急対応
- **障害対応**: 24時間以内
- **セキュリティインシデント**: 即座
- **データ復旧**: 4時間以内

---

## 連携先への送付用情報

### 🔗 ツール側プロジェクト連携ガイド

#### 1. メンテナンス制御の実装
```javascript
// ツール側での実装例
class MaintenanceController {
  constructor() {
    this.maintenanceStatus = null
    this.checkInterval = null
  }

  // メンテナンス状態をチェック
  async checkMaintenanceStatus() {
    try {
      const response = await fetch('https://us-central1-signal-v1-fc481.cloudfunctions.net/getToolMaintenanceStatus')
      const data = await response.json()
      
      if (data.success) {
        this.maintenanceStatus = data.data
        this.updateUI()
      }
    } catch (error) {
      console.error('メンテナンス状態の取得に失敗:', error)
    }
  }

  // UIを更新
  updateUI() {
    if (this.maintenanceStatus?.enabled) {
      this.showMaintenancePage()
    } else {
      this.hideMaintenancePage()
    }
  }

  // メンテナンスページを表示
  showMaintenancePage() {
    const maintenanceHTML = `
      <div class="maintenance-overlay">
        <div class="maintenance-content">
          <h1>システムメンテナンス中</h1>
          <p>${this.maintenanceStatus.message}</p>
          <p>予定終了時刻: ${this.maintenanceStatus.scheduledEnd || '未定'}</p>
        </div>
      </div>
    `
    document.body.innerHTML = maintenanceHTML
  }

  // 定期チェックを開始
  startMonitoring() {
    this.checkMaintenanceStatus()
    this.checkInterval = setInterval(() => {
      this.checkMaintenanceStatus()
    }, 30000) // 30秒ごとにチェック
  }

  // 監視を停止
  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
    }
  }
}

// 使用例
const maintenanceController = new MaintenanceController()
maintenanceController.startMonitoring()
```

#### 2. エラーログ送信の実装
```javascript
// エラーログ送信クラス
class ErrorReporter {
  constructor() {
    this.apiUrl = 'https://us-central1-signal-v1-fc481.cloudfunctions.net/reportError'
  }

  // エラーを送信
  async reportError(error, context = {}) {
    const errorData = {
      level: this.getErrorLevel(error),
      message: error.message || 'Unknown error',
      source: 'tool-side',
      stack: error.stack,
      metadata: {
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        ...context
      }
    }

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorData)
      })

      if (response.ok) {
        console.log('エラーログを送信しました')
      }
    } catch (reportError) {
      console.error('エラーログの送信に失敗:', reportError)
    }
  }

  // エラーレベルを判定
  getErrorLevel(error) {
    if (error.name === 'ChunkLoadError') return 'warn'
    if (error.name === 'TypeError') return 'error'
    if (error.name === 'ReferenceError') return 'error'
    return 'error'
  }

  // グローバルエラーハンドラーを設定
  setupGlobalErrorHandler() {
    window.addEventListener('error', (event) => {
      this.reportError(event.error, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      })
    })

    window.addEventListener('unhandledrejection', (event) => {
      this.reportError(new Error(event.reason), {
        type: 'unhandledrejection'
      })
    })
  }
}

// 使用例
const errorReporter = new ErrorReporter()
errorReporter.setupGlobalErrorHandler()
```

#### 3. 必要な環境変数
```bash
# ツール側プロジェクトで設定が必要な環境変数
ADMIN_API_BASE_URL=https://us-central1-signal-v1-fc481.cloudfunctions.net
MAINTENANCE_CHECK_INTERVAL=30000
ERROR_REPORTING_ENABLED=true
```

#### 4. 連携テスト用エンドポイント
```javascript
// テスト用のメンテナンス状態設定
const testMaintenance = async () => {
  const response = await fetch('https://us-central1-signal-v1-fc481.cloudfunctions.net/setToolMaintenanceMode', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      enabled: true,
      message: 'テスト用メンテナンスモード',
      updatedBy: 'test'
    })
  })
  console.log(await response.json())
}

// テスト用のエラーログ送信
const testErrorReport = async () => {
  const errorReporter = new ErrorReporter()
  await errorReporter.reportError(new Error('テストエラー'), {
    test: true
  })
}
```

---

## 📞 サポート・連絡先

### 技術サポート
- **開発者**: Signal App開発チーム
- **メール**: dev@signalapp.jp
- **緊急連絡**: 24時間対応

### ドキュメント
- **API仕様書**: 本ドキュメント
- **実装ガイド**: 上記連携ガイド
- **トラブルシューティング**: 別途提供

### 更新履歴
- **v1.0.0**: 初回リリース
- **v1.1.0**: メンテナンス制御機能追加
- **v1.2.0**: エラー監視機能追加
- **v1.3.0**: ユーザー分離・KPI計算修正

---

## 開発者向け詳細情報

### 🛠️ 開発環境セットアップ

#### 必要な環境
- **Node.js**: 18.0.0以上
- **npm**: 8.0.0以上
- **Firebase CLI**: 12.0.0以上
- **Git**: 2.30.0以上

#### セットアップ手順
```bash
# 1. リポジトリをクローン
git clone https://github.com/mogcia-app/admin.git
cd admin

# 2. 依存関係をインストール
npm install

# 3. 環境変数を設定
cp .env.example .env.local
# .env.localを編集してFirebase設定を追加

# 4. Firebase CLIでログイン
firebase login

# 5. 開発サーバーを起動
npm run dev

# 6. ブラウザで http://localhost:3000 を開く
```

#### 環境変数設定
```bash
# .env.local
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FUNCTIONS_BASE_URL=your_functions_url
```

### 🔧 開発ガイドライン

#### コーディング規約
- **TypeScript**: 厳密な型チェックを有効
- **ESLint**: コード品質の統一
- **Prettier**: コードフォーマットの統一
- **命名規則**: camelCase（変数・関数）、PascalCase（コンポーネント）

#### コンポーネント設計原則
```typescript
// 1. 単一責任の原則
interface UserCardProps {
  user: User
  onEdit: (user: User) => void
  onDelete: (userId: string) => void
}

// 2. プロップスの型定義
const UserCard: React.FC<UserCardProps> = ({ user, onEdit, onDelete }) => {
  // コンポーネント実装
}

// 3. カスタムフックの活用
const useUserManagement = () => {
  // ビジネスロジック
  return { users, createUser, updateUser, deleteUser }
}
```

#### 状態管理パターン
```typescript
// 1. ローカル状態（コンポーネント固有）
const [isOpen, setIsOpen] = useState(false)

// 2. グローバル状態（認証情報等）
const { user, adminUser } = useAuth()

// 3. サーバー状態（Firebase データ）
const { data: users, loading, error } = useUsers()
```

#### エラーハンドリング
```typescript
// 1. コンポーネントレベル
const UserList = () => {
  const [error, setError] = useState<string | null>(null)
  
  const handleError = (err: Error) => {
    setError(err.message)
    console.error('UserList Error:', err)
  }
  
  return (
    <div>
      {error && <ErrorMessage message={error} />}
      {/* コンポーネント内容 */}
    </div>
  )
}

// 2. カスタムフックレベル
const useUsers = () => {
  const [error, setError] = useState<string | null>(null)
  
  const fetchUsers = async () => {
    try {
      setError(null)
      const users = await getUsers()
      setUsers(users)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }
  
  return { users, error, fetchUsers }
}
```

### 🧪 テスト戦略

#### テスト種類
- **Unit Tests**: 個別関数・コンポーネントのテスト
- **Integration Tests**: 複数コンポーネントの連携テスト
- **E2E Tests**: ユーザー操作フローのテスト

#### テスト実装例
```typescript
// ユニットテスト例
import { render, screen, fireEvent } from '@testing-library/react'
import { UserCard } from './UserCard'

describe('UserCard', () => {
  const mockUser = {
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    status: 'active'
  }

  it('renders user information correctly', () => {
    render(<UserCard user={mockUser} onEdit={jest.fn()} onDelete={jest.fn()} />)
    
    expect(screen.getByText('Test User')).toBeInTheDocument()
    expect(screen.getByText('test@example.com')).toBeInTheDocument()
  })

  it('calls onEdit when edit button is clicked', () => {
    const onEdit = jest.fn()
    render(<UserCard user={mockUser} onEdit={onEdit} onDelete={jest.fn()} />)
    
    fireEvent.click(screen.getByText('編集'))
    expect(onEdit).toHaveBeenCalledWith(mockUser)
  })
})
```

### 📦 デプロイメント

#### 本番デプロイ手順
```bash
# 1. コードをコミット・プッシュ
git add .
git commit -m "feat: 新機能追加"
git push origin main

# 2. Vercelが自動デプロイを実行
# 3. デプロイ完了を確認
# 4. 本番環境でテスト実行
```

#### 環境別設定
- **開発環境**: localhost:3000
- **ステージング環境**: staging-admin.signalapp.jp
- **本番環境**: admin.signalapp.jp

### 🔍 デバッグ・ログ

#### ログレベル
- **DEBUG**: 開発時の詳細情報
- **INFO**: 一般的な情報
- **WARN**: 警告（処理は継続）
- **ERROR**: エラー（処理が停止）

#### ログ実装例
```typescript
// ログユーティリティ
const logger = {
  debug: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEBUG] ${message}`, data)
    }
  },
  info: (message: string, data?: any) => {
    console.info(`[INFO] ${message}`, data)
  },
  warn: (message: string, data?: any) => {
    console.warn(`[WARN] ${message}`, data)
  },
  error: (message: string, error?: Error) => {
    console.error(`[ERROR] ${message}`, error)
  }
}

// 使用例
logger.info('User created', { userId: '123', name: 'John' })
logger.error('Failed to create user', new Error('Validation failed'))
```

---

## トラブルシューティング

### 🚨 よくある問題と解決方法

#### 1. 認証エラー
**問題**: ログインできない、認証エラーが発生する
**原因**: Firebase設定の不備、管理者権限の問題
**解決方法**:
```bash
# 1. Firebase設定を確認
firebase projects:list

# 2. 環境変数を確認
echo $NEXT_PUBLIC_FIREBASE_PROJECT_ID

# 3. Firebase Auth設定を確認
firebase auth:export users.json
```

#### 2. データベース接続エラー
**問題**: Firestoreに接続できない、データが取得できない
**原因**: セキュリティルール、ネットワーク問題
**解決方法**:
```bash
# 1. Firestoreルールを確認
firebase firestore:rules:get

# 2. 接続テスト
firebase firestore:query users --limit 1

# 3. セキュリティルールを一時的に緩和
# firestore.rules で read: true, write: true に設定
```

#### 3. ビルドエラー
**問題**: npm run build でエラーが発生する
**原因**: TypeScript型エラー、依存関係の問題
**解決方法**:
```bash
# 1. 型チェックを実行
npx tsc --noEmit

# 2. 依存関係を再インストール
rm -rf node_modules package-lock.json
npm install

# 3. キャッシュをクリア
npm run build -- --no-cache
```

#### 4. デプロイエラー
**問題**: Vercelデプロイが失敗する
**原因**: 環境変数の不備、ビルドエラー
**解決方法**:
```bash
# 1. ローカルでビルドテスト
npm run build

# 2. Vercel環境変数を確認
vercel env ls

# 3. デプロイログを確認
vercel logs
```

### 🔧 パフォーマンス問題

#### 1. ページ読み込みが遅い
**原因**: 大量データの取得、非効率なクエリ
**解決方法**:
- ページネーションの実装
- データの遅延読み込み
- インデックスの最適化

#### 2. メモリ使用量が多い
**原因**: メモリリーク、大量データの保持
**解決方法**:
- useEffectのクリーンアップ
- 不要なデータの削除
- 仮想スクロールの実装

### 🛡️ セキュリティ問題

#### 1. 不正アクセス
**対策**:
- 管理者権限の厳格なチェック
- セッションタイムアウトの設定
- アクセスログの監視

#### 2. データ漏洩
**対策**:
- Firestoreセキュリティルールの設定
- 機密データの暗号化
- アクセス制御の実装

---

## FAQ

### ❓ よくある質問

#### Q1: 新しい管理者を追加したい場合はどうすればいいですか？
**A**: 現在は固定3名の管理者のみサポートしています。新しい管理者を追加する場合は、`src/lib/admin-users.ts`の`ADMIN_USERS`配列を編集し、Firebase Authenticationでアカウントを作成する必要があります。

#### Q2: ユーザーデータのバックアップはどうなっていますか？
**A**: Firestoreの自動バックアップ機能を使用しています。また、定期的にデータをエクスポートして別途保存することを推奨します。

#### Q3: AI機能が動作しない場合はどうすればいいですか？
**A**: 以下の手順で確認してください：
1. APIキーが正しく設定されているか確認
2. ネットワーク接続を確認
3. OpenAI APIの利用制限を確認
4. ブラウザのコンソールでエラーログを確認

#### Q4: システムの負荷が高い場合はどうすればいいですか？
**A**: 以下の対策を実施してください：
1. ページネーションの設定を調整
2. 不要なデータの削除
3. キャッシュ機能の活用
4. データベースのインデックス最適化

#### Q5: 他システムとの連携で問題が発生した場合は？
**A**: 以下の手順で確認してください：
1. APIエンドポイントの接続確認
2. 認証情報の確認
3. ネットワーク設定の確認
4. ログファイルでエラー詳細を確認

#### Q6: データベースの容量制限に達した場合は？
**A**: 以下の対策を実施してください：
1. 古いデータのアーカイブ
2. 不要なデータの削除
3. Firestoreの容量プランをアップグレード
4. データの圧縮・最適化

#### Q7: セキュリティアップデートはどう管理しますか？
**A**: 以下の手順で管理しています：
1. 依存関係の定期更新
2. セキュリティパッチの適用
3. 脆弱性スキャンの実行
4. アクセスログの監視

#### Q8: システムの監視はどのように行っていますか？
**A**: 以下の方法で監視しています：
1. Vercelの監視機能
2. Firebaseの監視機能
3. カスタムエラーログ
4. パフォーマンスメトリクス

### 📞 サポート・連絡先

#### 技術サポート
- **開発チーム**: Signal App開発チーム
- **メール**: dev@signalapp.jp
- **緊急連絡**: 24時間対応
- **通常サポート**: 平日 9:00-18:00

#### ドキュメント
- **API仕様書**: 本ドキュメント
- **実装ガイド**: 上記連携ガイド
- **トラブルシューティング**: 本セクション
- **更新履歴**: 別途提供

#### 更新履歴
- **v1.0.0**: 初回リリース（2024年1月）
- **v1.1.0**: メンテナンス制御機能追加（2024年3月）
- **v1.2.0**: エラー監視機能追加（2024年6月）
- **v1.3.0**: ユーザー分離・KPI計算修正（2024年10月）

---

*このドキュメントは Signal App Admin Panel v1.3.0 に基づいて作成されています。*
*最終更新: 2024年10月19日*
*次回更新予定: 2024年11月19日*
