// 包括的なテンプレート回答システム
import { userService } from './firebase-admin'

export interface ComprehensiveTemplateResponse {
  type: 'template' | 'ai'
  content: string
  metadata?: {
    page?: string
    category?: string
    templateUsed?: string
    dataQuery?: boolean
    customerSearch?: boolean
    toolFunction?: boolean
    actionRequired?: boolean
  }
}

// ページ別のテンプレート回答
export const PAGE_TEMPLATES = {
  // ユーザー管理ページ
  users: {
    search: {
      keywords: ['ユーザー', '顧客', '利用者', '検索', '探す', 'user', 'customer', 'search', '一覧', 'リスト', '表示', 'show', 'list'],
      responses: {
        general: async (message: string) => {
          const users = await userService.getUsers()
          const searchTerms = extractSearchTerms(message)
          const lowerMessage = message.toLowerCase()
          
          // ステータス別の検索
          const statusKeywords = {
            'アクティブ': 'active',
            '非アクティブ': 'inactive', 
            '停止中': 'suspended',
            'active': 'active',
            'inactive': 'inactive',
            'suspended': 'suspended'
          }
          
          // 契約タイプ別の検索
          const contractKeywords = {
            '年間契約': 'annual',
            'お試し契約': 'trial',
            'annual': 'annual',
            'trial': 'trial'
          }
          
          // 利用形態別の検索
          const usageKeywords = {
            'チーム': 'team',
            'ソロ': 'solo',
            'team': 'team',
            'solo': 'solo'
          }
          
          let filteredUsers = users
          
          // ステータスフィルター
          const statusFilter = Object.keys(statusKeywords).find(keyword => 
            lowerMessage.includes(keyword)
          )
          if (statusFilter) {
            filteredUsers = filteredUsers.filter(user => user.status === statusKeywords[statusFilter as keyof typeof statusKeywords])
          }
          
          // 契約タイプフィルター
          const contractFilter = Object.keys(contractKeywords).find(keyword => 
            lowerMessage.includes(keyword)
          )
          if (contractFilter) {
            filteredUsers = filteredUsers.filter(user => user.contractType === contractKeywords[contractFilter as keyof typeof contractKeywords])
          }
          
          // 利用形態フィルター
          const usageFilter = Object.keys(usageKeywords).find(keyword => 
            lowerMessage.includes(keyword)
          )
          if (usageFilter) {
            filteredUsers = filteredUsers.filter(user => user.usageType === usageKeywords[usageFilter as keyof typeof usageKeywords])
          }
          
          // テキスト検索
          if (searchTerms.length > 0) {
            filteredUsers = filteredUsers.filter(user => {
              const searchText = `${user.name} ${user.email} ${user.role || ''} ${user.businessInfo?.industry || ''} ${user.businessInfo?.description || ''}`.toLowerCase()
              return searchTerms.some(term => searchText.includes(term.toLowerCase()))
            })
          }
          
          if (filteredUsers.length === 0) {
            return `🔍 **ユーザー検索結果**\n\n検索条件に一致するユーザーが見つかりませんでした。\n\n**検索のヒント:**\n• 名前、メールアドレス、業界で検索\n• ステータス: アクティブ、非アクティブ、停止中\n• 契約タイプ: 年間契約、お試し契約\n• 利用形態: チーム、ソロ\n• 部分一致でも検索可能`
          }
          
          const userList = filteredUsers.slice(0, 10).map(user => 
            `**${user.name}**\n` +
            `📧 ${user.email}\n` +
            `👤 ${user.role || 'user'}\n` +
            `📅 登録日: ${new Date(user.createdAt).toLocaleDateString('ja-JP')}\n` +
            `🟢 ステータス: ${user.isActive ? 'アクティブ' : '非アクティブ'}\n` +
            `📋 契約: ${user.contractType === 'annual' ? '年間契約' : 'お試し契約'}\n` +
            `👥 形態: ${user.usageType === 'team' ? 'チーム' : 'ソロ'}\n` +
            `${user.businessInfo?.industry ? `🏢 業界: ${user.businessInfo.industry}\n` : ''}` +
            `${user.businessInfo?.description ? `📝 事業内容: ${user.businessInfo.description.substring(0, 50)}...\n` : ''}`
          ).join('\n---\n')
          
          const searchInfo = []
          if (statusFilter) searchInfo.push(`ステータス: ${statusFilter}`)
          if (contractFilter) searchInfo.push(`契約: ${contractFilter}`)
          if (usageFilter) searchInfo.push(`形態: ${usageFilter}`)
          if (searchTerms.length > 0) searchInfo.push(`キーワード: "${searchTerms.join(' ')}"`)
          
          return `🔍 **ユーザー検索結果** (${filteredUsers.length}件)\n\n${searchInfo.length > 0 ? `**検索条件:** ${searchInfo.join(', ')}\n\n` : ''}${userList}\n\n${filteredUsers.length > 10 ? `\n*他に${filteredUsers.length - 10}件の結果があります*` : ''}\n\n**詳細検索:**\n• ユーザー管理ページでより詳細な検索が可能\n• フィルター機能で絞り込み検索\n• ソート機能で並び替え`
        }
      }
    },
    management: {
      keywords: ['追加', '作成', '削除', '編集', '更新', 'add', 'create', 'delete', 'edit', 'update'],
      responses: {
        add: `👤 **ユーザー追加方法**\n\n**手順:**\n1. ユーザー管理ページに移動\n2. 「新規ユーザー追加」ボタンをクリック\n3. 必要事項を入力:\n   • 名前（必須）\n   • メールアドレス（必須）\n   • パスワード（必須）\n   • 役職（admin/user/moderator）\n   • ビジネス情報\n4. 「作成」ボタンをクリック\n\n**注意事項:**\n• メールアドレスは一意である必要があります\n• パスワードは8文字以上で設定してください\n• 作成後、ユーザーにログイン情報を通知してください`,
        edit: `✏️ **ユーザー情報編集方法**\n\n**手順:**\n1. ユーザー管理ページで対象ユーザーを選択\n2. 「編集」ボタンをクリック\n3. 変更したい項目を修正\n4. 「保存」ボタンをクリック\n\n**編集可能な項目:**\n• 基本情報（名前、メール、役職）\n• ビジネス情報（業界、会社規模など）\n• 契約情報（SNS数、契約タイプなど）\n• ステータス（アクティブ/非アクティブ）`,
        delete: `🗑️ **ユーザー削除方法**\n\n**手順:**\n1. ユーザー管理ページで対象ユーザーを選択\n2. 「削除」ボタンをクリック\n3. 確認ダイアログで「削除」を選択\n\n**注意事項:**\n• 削除は取り消せません\n• 関連データも同時に削除されます\n• 重要なユーザーの場合は無効化を推奨`
      }
    },
    stats: {
      keywords: ['統計', '数', '件数', '合計', 'stats', 'count', 'total'],
      responses: {
        general: async () => {
          const users = await userService.getUsers()
          const activeUsers = users.filter(user => user.isActive).length
          const trialUsers = users.filter(user => user.contractType === 'trial').length
          const annualUsers = users.filter(user => user.contractType === 'annual').length
          
          return `📊 **ユーザー統計情報**\n\n**基本統計:**\n• 総ユーザー数: ${users.length}件\n• アクティブユーザー: ${activeUsers}件\n• 非アクティブユーザー: ${users.length - activeUsers}件\n\n**契約タイプ別:**\n• トライアル: ${trialUsers}件\n• 年間契約: ${annualUsers}件\n\n**最新の登録:**\n${users.slice(0, 3).map(user => 
            `• ${user.name} (${new Date(user.createdAt).toLocaleDateString('ja-JP')})`
          ).join('\n')}`
        }
      }
    }
  },

  // プロンプト管理ページ
  prompts: {
    search: {
      keywords: ['プロンプト', '検索', '探す', 'prompt', 'search'],
      responses: {
        general: `🔍 **プロンプト検索方法**\n\n**検索オプション:**\n• 名前で検索\n• カテゴリで絞り込み\n• タグで検索\n• 作成者で絞り込み\n\n**検索のヒント:**\n• 部分一致でも検索可能\n• 複数の条件を組み合わせ可能\n• よく使われるプロンプトから表示`
      }
    },
    management: {
      keywords: ['作成', '追加', '編集', '削除', 'create', 'add', 'edit', 'delete'],
      responses: {
        create: `📝 **プロンプト作成方法**\n\n**手順:**\n1. プロンプト管理ページに移動\n2. 「新規プロンプト作成」ボタンをクリック\n3. 基本情報を入力:\n   • 名前（必須）\n   • 説明\n   • カテゴリ（system/user/assistant/custom）\n   • タグ\n4. プロンプト内容を入力\n5. 変数を設定（必要に応じて）\n6. 「作成」ボタンをクリック\n\n**変数の設定:**\n• テキスト、数値、真偽値、選択肢から選択\n• 必須/任意を設定\n• デフォルト値を設定可能`,
        edit: `✏️ **プロンプト編集方法**\n\n**手順:**\n1. プロンプト一覧から対象を選択\n2. 「編集」ボタンをクリック\n3. 内容を修正\n4. 「保存」ボタンをクリック\n\n**編集可能な項目:**\n• 基本情報（名前、説明、カテゴリ）\n• プロンプト内容\n• 変数設定\n• アクティブ状態`
      }
    },
    usage: {
      keywords: ['使用', '利用', '実行', 'usage', 'use', 'execute'],
      responses: {
        general: `🚀 **プロンプト使用方法**\n\n**基本的な使い方:**\n1. プロンプト一覧から選択\n2. 「使用」ボタンをクリック\n3. 変数がある場合は入力\n4. 「実行」ボタンをクリック\n\n**AIアシスタントでの使用:**\n• プロンプト名をメンション\n• 変数を指定して実行\n• 結果をチャットで確認`
      }
    }
  },

  // お知らせ管理ページ
  notifications: {
    search: {
      keywords: ['お知らせ', '通知', '検索', 'notification', 'search'],
      responses: {
        general: `🔔 **お知らせ検索方法**\n\n**検索オプション:**\n• タイトルで検索\n• 内容で検索\n• タグで絞り込み\n• 日付範囲で絞り込み\n• ステータスで絞り込み\n\n**フィルター:**\n• 未読/既読\n• 重要度（高/中/低）\n• カテゴリ別`
      }
    },
    management: {
      keywords: ['作成', '追加', '編集', '削除', '送信', 'create', 'add', 'edit', 'delete', 'send'],
      responses: {
        create: `📢 **お知らせ作成方法**\n\n**手順:**\n1. お知らせ管理ページに移動\n2. 「新規お知らせ作成」ボタンをクリック\n3. 基本情報を入力:\n   • タイトル（必須）\n   • 内容（必須）\n   • 重要度（高/中/低）\n   • カテゴリ\n   • タグ\n4. 配信設定を選択:\n   • 即座に配信\n   • スケジュール配信\n   • 下書き保存\n5. 「作成」ボタンをクリック`,
        send: `📤 **お知らせ配信方法**\n\n**即座配信:**\n1. お知らせ作成時に「即座に配信」を選択\n2. 対象ユーザーを選択\n3. 「配信」ボタンをクリック\n\n**スケジュール配信:**\n1. 配信日時を設定\n2. 対象ユーザーを選択\n3. 「スケジュール設定」をクリック\n\n**配信先選択:**\n• 全ユーザー\n• 特定の役職\n• カスタムリスト`
      }
    }
  },

  // ガイド管理ページ
  guides: {
    search: {
      keywords: ['ガイド', '検索', '探す', 'guide', 'search'],
      responses: {
        general: `📚 **ガイド検索方法**\n\n**検索オプション:**\n• タイトルで検索\n• 内容で検索\n• カテゴリで絞り込み\n• タグで検索\n• 作成者で絞り込み\n\n**並び順:**\n• 作成日順\n• 更新日順\n• 人気順\n• アルファベット順`
      }
    },
    management: {
      keywords: ['作成', '追加', '編集', '削除', 'create', 'add', 'edit', 'delete'],
      responses: {
        create: `📖 **ガイド作成方法**\n\n**手順:**\n1. ガイド管理ページに移動\n2. 「新規ガイド作成」ボタンをクリック\n3. 基本情報を入力:\n   • タイトル（必須）\n   • 説明\n   • カテゴリ\n   • タグ\n4. ガイド内容を入力（Markdown対応）\n5. 画像やファイルを添付（任意）\n6. 「作成」ボタンをクリック\n\n**Markdown記法:**\n• 見出し: # ## ###\n• リスト: - 1.\n• リンク: [テキスト](URL)\n• 画像: ![alt](URL)`,
        edit: `✏️ **ガイド編集方法**\n\n**手順:**\n1. ガイド一覧から対象を選択\n2. 「編集」ボタンをクリック\n3. 内容を修正\n4. 「保存」ボタンをクリック\n\n**編集可能な項目:**\n• 基本情報（タイトル、説明、カテゴリ）\n• ガイド内容\n• 添付ファイル\n• 公開状態`
      }
    }
  },

  // アクセス制御ページ
  access_control: {
    features: {
      keywords: ['機能', '制御', '有効', '無効', 'feature', 'control', 'enable', 'disable'],
      responses: {
        general: `⚙️ **機能制御について**\n\n**制御可能な機能:**\n• ユーザー管理機能\n• プロンプト管理機能\n• お知らせ機能\n• ガイド機能\n• AIアシスタント機能\n• エラー監視機能\n\n**制御方法:**\n1. アクセス制御ページに移動\n2. 対象機能を選択\n3. 有効/無効を切り替え\n4. メンテナンスモードを設定（任意）\n\n**メンテナンスモード:**\n• 機能を一時的に無効化\n• メッセージを表示可能\n• 管理者のみアクセス可能`
      }
    },
    maintenance: {
      keywords: ['メンテナンス', 'maintenance', 'ツール', 'tool'],
      responses: {
        tool_maintenance: `🔧 **ツール側メンテナンス制御**\n\n**制御方法:**\n1. アクセス制御ページの「ツール側メンテナンス」タブを選択\n2. 「メンテナンス開始」ボタンでツール側のログインを無効化\n3. 「メンテナンス終了」ボタンでログインを有効化\n\n**機能:**\n• ボタン一つで即座に切り替え\n• メンテナンス状態の確認\n• スケジュール設定（将来実装予定）\n\n**注意事項:**\n• メンテナンス中はツール側にログインできません\n• 緊急時は即座に終了可能`
      }
    }
  },

  // エラー監視ページ
  monitoring: {
    errors: {
      keywords: ['エラー', '監視', '問題', 'error', 'monitor', 'issue'],
      responses: {
        general: `🚨 **エラー監視について**\n\n**監視対象:**\n• アプリケーションエラー\n• システムエラー\n• 外部APIエラー\n• データベースエラー\n\n**監視機能:**\n• リアルタイム監視\n• エラーログの記録\n• アラート通知\n• エラー統計の表示\n\n**エラーレベル:**\n• Fatal: 致命的なエラー\n• Error: 一般的なエラー\n• Warn: 警告\n• Info: 情報`,
        api: `🔌 **エラー報告API**\n\n**エンドポイント:**\n\`POST /reportError\`\n\n**リクエスト例:**\n\`\`\`javascript\nfetch('/api/reportError', {\n  method: 'POST',\n  headers: { 'Content-Type': 'application/json' },\n  body: JSON.stringify({\n    level: 'error',\n    message: 'エラーメッセージ',\n    source: 'frontend',\n    stack: 'エラースタック',\n    metadata: { userId: '123' }\n  })\n})\n\`\`\`\n\n**必須フィールド:**\n• level: エラーレベル\n• message: エラーメッセージ\n• source: エラーソース`
      }
    }
  }
}

// 検索キーワードを抽出する関数
function extractSearchTerms(message: string): string[] {
  return message
    .replace(/[^\w\s\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g, '')
    .split(/\s+/)
    .filter(term => term.length > 0)
}

// メインの包括的テンプレート回答生成関数
export async function generateComprehensiveTemplateResponse(message: string): Promise<ComprehensiveTemplateResponse | null> {
  const lowerMessage = message.toLowerCase()
  
  // 各ページのテンプレートをチェック
  for (const [pageKey, pageTemplates] of Object.entries(PAGE_TEMPLATES)) {
    for (const [categoryKey, categoryTemplates] of Object.entries(pageTemplates)) {
      for (const [templateKey, templateData] of Object.entries(categoryTemplates)) {
        const typedTemplateData = templateData as any
        if (typedTemplateData.keywords?.some((keyword: string) => lowerMessage.includes(keyword))) {
          // 非同期関数の場合は実行
          if (typeof typedTemplateData.responses.general === 'function') {
            try {
              const content = await typedTemplateData.responses.general(message)
              return {
                type: 'template',
                content,
                metadata: {
                  page: pageKey,
                  category: categoryKey,
                  templateUsed: `${pageKey}_${categoryKey}_${templateKey}`,
                  dataQuery: categoryKey === 'search' || categoryKey === 'stats',
                  actionRequired: categoryKey === 'management'
                }
              }
            } catch (error) {
              console.error('Template response error:', error)
              return {
                type: 'template',
                content: `❌ **エラーが発生しました**\n\n${error instanceof Error ? error.message : '不明なエラーが発生しました。'}\n\nしばらく時間をおいてから再度お試しください。`,
                metadata: {
                  page: pageKey,
                  category: categoryKey,
                  templateUsed: `${pageKey}_${categoryKey}_error`
                }
              }
            }
          } else {
            // 同期関数の場合
            const responseKey = Object.keys(typedTemplateData.responses)[0]
            const content = typedTemplateData.responses[responseKey as keyof typeof typedTemplateData.responses]
            
            if (typeof content === 'string') {
              return {
                type: 'template',
                content,
                metadata: {
                  page: pageKey,
                  category: categoryKey,
                  templateUsed: `${pageKey}_${categoryKey}_${responseKey}`,
                  actionRequired: categoryKey === 'management'
                }
              }
            }
          }
        }
      }
    }
  }
  
  return null
}
