// テンプレート回答システム
import { getUsers } from './users'

export interface TemplateResponse {
  type: 'template' | 'ai'
  content: string
  metadata?: {
    dataQuery?: boolean
    customerSearch?: boolean
    toolFunction?: boolean
    templateUsed?: string
  }
}

// テンプレート回答の種類
export type TemplateType = 
  | 'customer_search'
  | 'tool_function_question'
  | 'system_status'
  | 'kpi_summary'
  | 'user_management'
  | 'error_handling'

// キーワードベースのテンプレート判定
export function detectTemplateType(message: string): TemplateType | null {
  const lowerMessage = message.toLowerCase()
  
  // 顧客検索関連
  if (lowerMessage.includes('顧客') || lowerMessage.includes('ユーザー') || 
      lowerMessage.includes('検索') || lowerMessage.includes('探す') ||
      lowerMessage.includes('customer') || lowerMessage.includes('user')) {
    return 'customer_search'
  }
  
  // ツール機能に関する質問
  if (lowerMessage.includes('ツール') || lowerMessage.includes('機能') ||
      lowerMessage.includes('使い方') || lowerMessage.includes('方法') ||
      lowerMessage.includes('tool') || lowerMessage.includes('function') ||
      lowerMessage.includes('how to') || lowerMessage.includes('使い方')) {
    return 'tool_function_question'
  }
  
  // システム状況
  if (lowerMessage.includes('システム') || lowerMessage.includes('状況') ||
      lowerMessage.includes('稼働') || lowerMessage.includes('status') ||
      lowerMessage.includes('system')) {
    return 'system_status'
  }
  
  // KPIサマリー
  if (lowerMessage.includes('kpi') || lowerMessage.includes('売上') ||
      lowerMessage.includes('収益') || lowerMessage.includes('指標') ||
      lowerMessage.includes('revenue') || lowerMessage.includes('metrics')) {
    return 'kpi_summary'
  }
  
  // ユーザー管理
  if (lowerMessage.includes('管理') || lowerMessage.includes('追加') ||
      lowerMessage.includes('削除') || lowerMessage.includes('更新') ||
      lowerMessage.includes('management') || lowerMessage.includes('admin')) {
    return 'user_management'
  }
  
  // エラーハンドリング
  if (lowerMessage.includes('エラー') || lowerMessage.includes('問題') ||
      lowerMessage.includes('error') || lowerMessage.includes('issue') ||
      lowerMessage.includes('bug') || lowerMessage.includes('障害')) {
    return 'error_handling'
  }
  
  return null
}

// 顧客検索のテンプレート回答を生成
export async function generateCustomerSearchResponse(message: string): Promise<TemplateResponse> {
  try {
    // ユーザー一覧を取得
    const users = await getUsers()
    
    // 検索キーワードを抽出（簡易的な実装）
    const searchTerms = message
      .replace(/[^\w\s\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g, '')
      .split(/\s+/)
      .filter(term => term.length > 1)
    
    // ユーザーを検索
    const filteredUsers = users.filter(user => {
      const searchText = `${user.name} ${user.email} ${user.role}`.toLowerCase()
      return searchTerms.some(term => searchText.includes(term.toLowerCase()))
    })
    
    if (filteredUsers.length === 0) {
      return {
        type: 'template',
        content: `🔍 **顧客検索結果**\n\n検索条件に一致する顧客が見つかりませんでした。\n\n**検索のヒント:**\n• 名前、メールアドレス、役職で検索できます\n• 部分一致でも検索可能です\n• より具体的なキーワードをお試しください`,
        metadata: {
          customerSearch: true,
          templateUsed: 'customer_search_no_results'
        }
      }
    }
    
    // 検索結果をフォーマット
    const userList = filteredUsers.slice(0, 10).map(user => 
      `**${user.name}**\n` +
      `📧 ${user.email}\n` +
      `👤 ${user.role}\n` +
      `📅 登録日: ${new Date(user.createdAt).toLocaleDateString('ja-JP')}\n` +
      `🟢 ステータス: ${user.isActive ? 'アクティブ' : '非アクティブ'}\n`
    ).join('\n---\n')
    
    const content = `🔍 **顧客検索結果** (${filteredUsers.length}件)\n\n${userList}\n\n${filteredUsers.length > 10 ? `\n*他に${filteredUsers.length - 10}件の結果があります*` : ''}`
    
    return {
      type: 'template',
      content,
      metadata: {
        customerSearch: true,
        templateUsed: 'customer_search_results'
      }
    }
  } catch (error) {
    return {
      type: 'template',
      content: `❌ **顧客検索エラー**\n\n顧客データの取得中にエラーが発生しました。\n\n**エラー詳細:** ${error instanceof Error ? error.message : '不明なエラー'}\n\nしばらく時間をおいてから再度お試しください。`,
      metadata: {
        customerSearch: true,
        templateUsed: 'customer_search_error'
      }
    }
  }
}

// ツール機能の質問に対するテンプレート回答
export function generateToolFunctionResponse(message: string): TemplateResponse {
  const lowerMessage = message.toLowerCase()
  
  // よくあるツール機能の質問と回答
  const toolResponses = {
    'login': {
      content: `🔐 **ログイン機能について**\n\n**ログイン方法:**\n1. メールアドレスとパスワードを入力\n2. 「ログイン」ボタンをクリック\n3. 2段階認証が有効な場合は認証コードを入力\n\n**トラブルシューティング:**\n• パスワードを忘れた場合: 「パスワードを忘れた方」をクリック\n• アカウントがロックされた場合: 管理者に連絡\n• 2段階認証の設定: プロフィール設定から変更可能`,
      templateUsed: 'tool_login'
    },
    'dashboard': {
      content: `📊 **ダッシュボード機能について**\n\n**主要機能:**\n• 売上データの表示\n• ユーザー統計の確認\n• システム状況の監視\n• KPI指標の表示\n\n**カスタマイズ:**\n• ウィジェットの配置変更\n• 表示期間の設定\n• データの更新頻度設定\n\n**データ更新:**\n• 自動更新: 5分間隔\n• 手動更新: 更新ボタンをクリック`,
      templateUsed: 'tool_dashboard'
    },
    'user_management': {
      content: `👥 **ユーザー管理機能について**\n\n**ユーザー一覧:**\n• 全ユーザーの表示と検索\n• フィルタリング（役職、ステータス）\n• ソート機能（名前、登録日）\n\n**ユーザー操作:**\n• 新規ユーザー追加\n• ユーザー情報編集\n• アカウントの有効/無効化\n• ユーザー削除\n\n**権限管理:**\n• 役職による権限制御\n• アクセス権限の設定\n• セキュリティ設定`,
      templateUsed: 'tool_user_management'
    },
    'analytics': {
      content: `📈 **分析機能について**\n\n**利用可能な分析:**\n• 売上トレンド分析\n• ユーザー行動分析\n• コンバージョン分析\n• 地域別分析\n\n**レポート生成:**\n• 日次/週次/月次レポート\n• カスタム期間設定\n• PDF/Excel出力\n• 自動レポート配信\n\n**データ可視化:**\n• グラフとチャート\n• インタラクティブなダッシュボード\n• リアルタイムデータ表示`,
      templateUsed: 'tool_analytics'
    },
    'settings': {
      content: `⚙️ **設定機能について**\n\n**システム設定:**\n• アプリケーション設定\n• データベース設定\n• セキュリティ設定\n\n**ユーザー設定:**\n• プロフィール情報\n• 通知設定\n• 言語・タイムゾーン\n• テーマ設定\n\n**API設定:**\n• APIキー管理\n• 外部連携設定\n• レート制限設定`,
      templateUsed: 'tool_settings'
    }
  }
  
  // キーワードマッチング
  for (const [keyword, response] of Object.entries(toolResponses)) {
    if (lowerMessage.includes(keyword)) {
      return {
        type: 'template',
        content: response.content,
        metadata: {
          toolFunction: true,
          templateUsed: response.templateUsed
        }
      }
    }
  }
  
  // デフォルトのツール機能回答
  return {
    type: 'template',
    content: `🛠️ **ツール機能について**\n\n**利用可能な機能:**\n• ログイン・認証\n• ダッシュボード\n• ユーザー管理\n• データ分析\n• 設定管理\n\n**ヘルプの取得方法:**\n• 各ページのヘルプアイコンをクリック\n• 管理者に直接お問い合わせ\n• ドキュメントを参照\n\n**具体的な質問:**\nより具体的な機能名を教えていただければ、詳細な説明を提供します。`,
    metadata: {
      toolFunction: true,
      templateUsed: 'tool_general'
    }
  }
}

// システム状況のテンプレート回答
export function generateSystemStatusResponse(): TemplateResponse {
  return {
    type: 'template',
    content: `🖥️ **システム状況**\n\n**現在の状況:**\n• システム: 正常稼働中\n• データベース: 接続良好\n• API: 応答正常\n• ストレージ: 利用可能\n\n**パフォーマンス:**\n• 応答時間: 平均 200ms\n• 稼働率: 99.9%\n• 最後のメンテナンス: 1週間前\n\n**監視項目:**\n• CPU使用率: 正常\n• メモリ使用率: 正常\n• ディスク使用率: 正常\n• ネットワーク: 正常`,
    metadata: {
      templateUsed: 'system_status'
    }
  }
}

// KPIサマリーのテンプレート回答
export function generateKPISummaryResponse(): TemplateResponse {
  return {
    type: 'template',
    content: `📊 **KPIサマリー**\n\n**今月の主要指標:**\n• 総売上: 計算中...\n• 新規ユーザー: 計算中...\n• アクティブユーザー: 計算中...\n• コンバージョン率: 計算中...\n\n**前月比較:**\n• 売上成長率: 計算中...\n• ユーザー成長率: 計算中...\n\n**詳細なKPIデータ:**\nKPIダッシュボードページで詳細なデータとグラフを確認できます。\n\n**注意:** リアルタイムデータのため、正確な数値はKPIページでご確認ください。`,
    metadata: {
      templateUsed: 'kpi_summary'
    }
  }
}

// エラーハンドリングのテンプレート回答
export function generateErrorHandlingResponse(message: string): TemplateResponse {
  return {
    type: 'template',
    content: `🚨 **エラーハンドリング**\n\n**一般的な解決方法:**\n\n1. **ページの再読み込み**\n   • ブラウザを更新（F5キー）\n   • キャッシュをクリア\n\n2. **ログインの確認**\n   • セッションが切れていないか確認\n   • 再ログインを試行\n\n3. **権限の確認**\n   • 必要な権限があるか確認\n   • 管理者に権限の確認を依頼\n\n4. **システム状況の確認**\n   • メンテナンス中でないか確認\n   • システム状況ページで確認\n\n**それでも解決しない場合:**\n• エラーメッセージの詳細を記録\n• 管理者に連絡\n• 問題報告フォームから報告`,
    metadata: {
      templateUsed: 'error_handling'
    }
  }
}

// メインのテンプレート回答生成関数
export async function generateTemplateResponse(message: string): Promise<TemplateResponse | null> {
  const templateType = detectTemplateType(message)
  
  if (!templateType) {
    return null
  }
  
  switch (templateType) {
    case 'customer_search':
      return await generateCustomerSearchResponse(message)
    
    case 'tool_function_question':
      return generateToolFunctionResponse(message)
    
    case 'system_status':
      return generateSystemStatusResponse()
    
    case 'kpi_summary':
      return generateKPISummaryResponse()
    
    case 'user_management':
      return generateToolFunctionResponse(message)
    
    case 'error_handling':
      return generateErrorHandlingResponse(message)
    
    default:
      return null
  }
}
