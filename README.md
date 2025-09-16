# Admin Panel

Next.js + React + TypeScript + Tailwind CSS + Cloud Functions で構築されたモダンな管理画面アプリケーションです。

## 🚀 技術スタック

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **UI Components**: Headless UI
- **Backend**: Firebase Cloud Functions
- **Database**: Firestore (推奨)
- **Hosting**: Firebase Hosting / Vercel

## 📁 プロジェクト構造

```
admin/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API Routes
│   │   ├── dashboard/         # ダッシュボードページ
│   │   ├── globals.css        # グローバルスタイル
│   │   ├── layout.tsx         # ルートレイアウト
│   │   └── page.tsx          # ホームページ
│   ├── components/            # Reactコンポーネント
│   │   ├── ui/               # 基本UIコンポーネント
│   │   ├── layout/           # レイアウトコンポーネント
│   │   └── dashboard/        # ダッシュボード専用コンポーネント
│   ├── lib/                  # ユーティリティ関数
│   ├── types/                # TypeScript型定義
│   ├── hooks/                # カスタムフック
│   └── utils/                # ヘルパー関数
├── functions/                # Cloud Functions
│   ├── src/
│   │   └── index.ts         # Cloud Functions エントリーポイント
│   ├── package.json
│   └── tsconfig.json
├── public/                   # 静的ファイル
├── firebase.json            # Firebase設定
├── package.json
└── tailwind.config.ts      # Tailwind CSS設定
```

## 🛠️ セットアップ

### 1. 依存関係のインストール

```bash
# メインプロジェクトの依存関係
npm install

# Cloud Functions の依存関係
cd functions
npm install
cd ..
```

### 2. 環境変数の設定

```bash
cp .env.local.example .env.local
```

`.env.local` ファイルを編集して、Firebase の設定情報を入力してください。

### 3. Firebase プロジェクトの設定

```bash
# Firebase CLI のインストール（未インストールの場合）
npm install -g firebase-tools

# Firebase にログイン
firebase login

# Firebase プロジェクトの初期化
firebase init
```

### 4. 開発サーバーの起動

```bash
# Next.js 開発サーバー
npm run dev

# Firebase エミュレーター（別ターミナル）
firebase emulators:start
```

## 🎯 主な機能

### ✅ 実装済み機能

- **レスポンシブデザイン**: モバイル・タブレット・デスクトップ対応
- **ダッシュボード**: 統計情報とアクティビティ表示
- **サイドバーナビゲーション**: 折りたたみ可能なメニュー
- **ダークモード対応**: システム設定に従った自動切り替え
- **API ルート**: Next.js API Routes による基本的な CRUD 操作
- **Cloud Functions**: Firebase Functions の基本設定

### 🚧 今後の実装予定

- **認証システム**: Firebase Auth による ログイン・ログアウト
- **ユーザー管理**: CRUD 操作、権限管理
- **データ可視化**: チャート・グラフ表示
- **検索・フィルター機能**: 高度な検索とソート
- **ファイルアップロード**: Firebase Storage 連携
- **通知システム**: リアルタイム通知

## 🎨 デザインシステム

### カラーパレット

- **Primary**: Slate系（#0f172a）
- **Secondary**: Gray系（#f1f5f9）
- **Accent**: Blue系
- **Success**: Green系
- **Warning**: Yellow系
- **Danger**: Red系

### コンポーネント

- **Button**: 複数のバリアント（default, outline, ghost など）
- **Card**: 情報表示用のカードコンポーネント
- **Layout**: サイドバー、ヘッダー、メインコンテンツエリア

## 📚 開発ガイド

### コンポーネントの作成

```typescript
// src/components/ui/example.tsx
import React from 'react'
import { cn } from '@/lib/utils'

interface ExampleProps {
  className?: string
  children: React.ReactNode
}

export function Example({ className, children }: ExampleProps) {
  return (
    <div className={cn('base-styles', className)}>
      {children}
    </div>
  )
}
```

### API ルートの作成

```typescript
// src/app/api/example/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // ロジックを実装
    return NextResponse.json({ data: 'example' })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
```

### Cloud Functions の追加

```typescript
// functions/src/index.ts
export const newFunction = functions.https.onRequest(async (req, res) => {
  // 関数のロジックを実装
})
```

## 🚀 デプロイ

### Vercel へのデプロイ

```bash
# Vercel CLI のインストール
npm install -g vercel

# デプロイ
vercel
```

### Firebase Hosting へのデプロイ

```bash
# ビルド
npm run build

# デプロイ
firebase deploy
```

## 🔧 スクリプト

```bash
# 開発サーバー起動
npm run dev

# プロダクションビルド
npm run build

# プロダクションサーバー起動
npm start

# リンター実行
npm run lint

# Cloud Functions のビルド
cd functions && npm run build

# Cloud Functions のデプロイ
cd functions && npm run deploy
```

## 🤝 コントリビューション

1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📝 ライセンス

このプロジェクトは MIT ライセンスの下で公開されています。

## 📞 サポート

質問や問題がある場合は、GitHub Issues でお知らせください。

---

**Happy Coding! 🎉**