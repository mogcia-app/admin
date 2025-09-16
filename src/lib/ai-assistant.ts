import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  Timestamp,
  limit
} from 'firebase/firestore'
import { db } from './firebase'
import { 
  AdminAIChat, 
  AIMessage, 
  AICapability 
} from '@/types'

// コレクション名
const COLLECTIONS = {
  AI_CHATS: 'aiChats',
  AI_CAPABILITIES: 'aiCapabilities'
}

// AIチャット一覧の取得
export async function getAIChats(adminId: string): Promise<AdminAIChat[]> {
  try {
    const q = query(
      collection(db, COLLECTIONS.AI_CHATS),
      where('adminId', '==', adminId),
      orderBy('updatedAt', 'desc'),
      limit(50)
    )
    const querySnapshot = await getDocs(q)
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt,
    })) as AdminAIChat[]
  } catch (error) {
    console.error('Error fetching AI chats:', error)
    throw error
  }
}

// 特定のAIチャットを取得
export async function getAIChat(chatId: string): Promise<AdminAIChat | null> {
  try {
    const docRef = doc(db, COLLECTIONS.AI_CHATS, chatId)
    const docSnap = await getDoc(docRef)
    
    if (!docSnap.exists()) return null
    
    return {
      id: docSnap.id,
      ...docSnap.data(),
      createdAt: docSnap.data().createdAt?.toDate?.()?.toISOString() || docSnap.data().createdAt,
      updatedAt: docSnap.data().updatedAt?.toDate?.()?.toISOString() || docSnap.data().updatedAt,
    } as AdminAIChat
  } catch (error) {
    console.error('Error fetching AI chat:', error)
    throw error
  }
}

// 新しいAIチャットの作成
export async function createAIChat(title: string, adminId: string): Promise<string> {
  try {
    const chatData = {
      title,
      adminId,
      messages: [],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    }
    
    const docRef = await addDoc(collection(db, COLLECTIONS.AI_CHATS), chatData)
    
    console.log('AI chat created with ID:', docRef.id)
    return docRef.id
  } catch (error) {
    console.error('Error creating AI chat:', error)
    throw error
  }
}

// AIチャットにメッセージを追加
export async function addMessageToChat(chatId: string, message: Omit<AIMessage, 'id' | 'timestamp'>): Promise<void> {
  try {
    const chatRef = doc(db, COLLECTIONS.AI_CHATS, chatId)
    const chatDoc = await getDoc(chatRef)
    
    if (!chatDoc.exists()) {
      throw new Error('Chat not found')
    }
    
    const chatData = chatDoc.data() as AdminAIChat
    const newMessage: AIMessage = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    }
    
    const updatedMessages = [...(chatData.messages || []), newMessage]
    
    await updateDoc(chatRef, {
      messages: updatedMessages,
      updatedAt: Timestamp.now()
    })
    
    console.log('Message added to chat:', chatId)
  } catch (error) {
    console.error('Error adding message to chat:', error)
    throw error
  }
}

// AIチャットのタイトルを更新
export async function updateChatTitle(chatId: string, title: string): Promise<void> {
  try {
    const chatRef = doc(db, COLLECTIONS.AI_CHATS, chatId)
    await updateDoc(chatRef, {
      title,
      updatedAt: Timestamp.now()
    })
    
    console.log('Chat title updated:', chatId)
  } catch (error) {
    console.error('Error updating chat title:', error)
    throw error
  }
}

// AIチャットを削除
export async function deleteAIChat(chatId: string): Promise<void> {
  try {
    const chatRef = doc(db, COLLECTIONS.AI_CHATS, chatId)
    await deleteDoc(chatRef)
    
    console.log('AI chat deleted:', chatId)
  } catch (error) {
    console.error('Error deleting AI chat:', error)
    throw error
  }
}

// AI機能一覧の取得
export async function getAICapabilities(): Promise<AICapability[]> {
  try {
    const q = query(
      collection(db, COLLECTIONS.AI_CAPABILITIES),
      where('isEnabled', '==', true),
      orderBy('category'),
      orderBy('name')
    )
    const querySnapshot = await getDocs(q)
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as AICapability[]
  } catch (error) {
    console.error('Error fetching AI capabilities:', error)
    throw error
  }
}

// AI応答の生成（モック実装）
export async function generateAIResponse(message: string, context?: any): Promise<string> {
  try {
    // 実際のAI APIを呼び出す代わりに、モック応答を生成
    // 本番環境では OpenAI API や Claude API などを使用
    
    const responses = getContextualResponse(message, context)
    
    // レスポンス時間をシミュレート
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))
    
    return responses[Math.floor(Math.random() * responses.length)]
  } catch (error) {
    console.error('Error generating AI response:', error)
    throw error
  }
}

// コンテキストに基づく応答生成
function getContextualResponse(message: string, context?: any): string[] {
  const lowerMessage = message.toLowerCase()
  
  // データ分析関連
  if (lowerMessage.includes('売上') || lowerMessage.includes('revenue') || lowerMessage.includes('売り上げ')) {
    return [
      '📊 売上分析を確認しました。今月の売上は前月比15%増の285万円です。特にプロフェッショナルプランの契約が好調で、全体の60%を占めています。',
      '💰 売上データを分析すると、ユーザー獲得コストが下がっている一方で、平均契約価値が上昇しています。これは良い傾向ですね！',
      '📈 売上トレンドを見ると、SNS連携機能のリリース後からコンバージョン率が25%向上しています。マーケティング戦略が効果的に働いているようです。'
    ]
  }
  
  // ユーザー管理関連
  if (lowerMessage.includes('ユーザー') || lowerMessage.includes('user') || lowerMessage.includes('利用者')) {
    return [
      '👥 現在のユーザー状況を確認しました。総ユーザー数1,234名、アクティブユーザー867名です。チャーンレートは3.2%と良好な水準を維持しています。',
      '🔍 ユーザー分析結果：トライアルから有料転換率は25.5%、平均利用期間は8.3ヶ月です。SNS連携機能を使うユーザーの継続率が特に高いことが分かりました。',
      '📱 ユーザーの利用パターンを見ると、平日の午前中とお昼休みの利用が多く、AIアシスタント機能が最も人気です。'
    ]
  }
  
  // KPI・指標関連
  if (lowerMessage.includes('kpi') || lowerMessage.includes('指標') || lowerMessage.includes('目標')) {
    return [
      '🎯 KPI達成状況：月間売上目標95%達成、新規ユーザー獲得目標78%達成、チャーンレート目標を大幅にクリアしています。',
      '📊 主要指標の推移：MRR（月間経常収益）は順調に成長中、ARPU（ユーザー当たり平均売上）も向上しています。LTV/CAC比率は3.2と健全です。',
      '⚡ パフォーマンス指標：システム稼働率99.9%、平均応答時間120ms、ユーザー満足度スコア4.2/5.0と優秀な結果です。'
    ]
  }
  
  // システム・技術関連
  if (lowerMessage.includes('システム') || lowerMessage.includes('エラー') || lowerMessage.includes('障害')) {
    return [
      '🔧 システム状況：全サービスが正常稼働中です。APIサーバーの応答時間85ms、データベースの稼働率99.95%と良好です。',
      '⚠️ 過去24時間のエラーログを確認しました。軽微なエラーが3件発生していますが、いずれも自動復旧済みです。詳細な調査をお勧めします。',
      '🛡️ セキュリティ監視：異常なアクセスパターンは検出されていません。全ての認証ログが正常で、不正アクセスの試行もありません。'
    ]
  }
  
  // お知らせ・通知関連
  if (lowerMessage.includes('お知らせ') || lowerMessage.includes('通知') || lowerMessage.includes('アナウンス')) {
    return [
      '📢 お知らせ管理状況：現在3件の公開中お知らせがあります。メンテナンス予告の閲覧数が特に多く、ユーザーの関心が高いようです。',
      '🔔 通知効果分析：最新のお知らせの開封率は68%、クリック率は12%でした。過去平均と比較して良好な結果です。',
      '📝 推奨事項：新機能リリースのお知らせを準備することをお勧めします。ユーザーエンゲージメント向上に効果的です。'
    ]
  }
  
  // 一般的な質問
  if (lowerMessage.includes('どう') || lowerMessage.includes('方法') || lowerMessage.includes('やり方')) {
    return [
      '💡 お手伝いします！具体的にどのような作業をサポートしましょうか？データ分析、レポート生成、ユーザー管理など、様々な業務をお手伝いできます。',
      '🤖 私はSignal Appの管理業務全般をサポートできます。売上分析、ユーザー動向調査、システム監視、KPI追跡など、何でもお聞きください。',
      '📋 管理業務を効率化するために、以下のような作業が可能です：データの可視化、トレンド分析、レポート自動生成、アラート設定など。'
    ]
  }
  
  // あいさつ・一般的な会話
  if (lowerMessage.includes('こんにち') || lowerMessage.includes('はじめ') || lowerMessage.includes('hello')) {
    return [
      '👋 こんにちは！Signal App管理AIアシスタントです。今日はどのような業務をお手伝いしましょうか？',
      '✨ お疲れ様です！管理業務のサポートを行います。データ分析、ユーザー管理、システム監視など、何でもお聞きください。',
      '🚀 Signal App管理パネルへようこそ！効率的な管理業務のために、AIアシスタントが全力でサポートいたします。'
    ]
  }
  
  // デフォルト応答
  return [
    '🤔 申し訳ございませんが、その内容についてはもう少し詳しく教えていただけますか？Signal Appの管理業務に関することでしたら、喜んでお手伝いします。',
    '💭 ご質問の内容を理解するために、もう少し具体的な情報をいただけますでしょうか？データ分析、ユーザー管理、システム監視など、どの分野についてお知りになりたいですか？',
    '📚 Signal Appの管理業務について、以下のようなサポートが可能です：\n• 売上・KPI分析\n• ユーザー動向調査\n• システム稼働監視\n• お知らせ管理\n• レポート生成\n\nどちらについてお聞きになりたいですか？',
    '🔍 詳細な情報を提供するために、以下の点について教えてください：\n• 何について知りたいですか？\n• どのような作業をサポートしましょうか？\n• 特定のデータや指標に興味がありますか？'
  ]
}

// サンプルAIデータの作成
export async function seedAIData(): Promise<void> {
  try {
    const sampleCapabilities: Omit<AICapability, 'id'>[] = [
      {
        name: 'データ分析',
        description: '売上、ユーザー、KPI等のデータを分析して洞察を提供',
        category: 'analytics',
        isEnabled: true,
        examples: [
          '今月の売上トレンドを分析して',
          'ユーザーの利用パターンを教えて',
          'KPIの達成状況はどう？'
        ]
      },
      {
        name: 'レポート生成',
        description: '定期レポートや分析レポートを自動生成',
        category: 'reporting',
        isEnabled: true,
        examples: [
          '月次売上レポートを作成して',
          'ユーザー分析レポートが欲しい',
          'KPIダッシュボードをまとめて'
        ]
      },
      {
        name: 'ユーザー管理支援',
        description: 'ユーザー情報の管理や分析をサポート',
        category: 'management',
        isEnabled: true,
        examples: [
          'チャーンリスクの高いユーザーは？',
          'プレミアムユーザーの特徴を分析',
          'ユーザーセグメント別の利用状況'
        ]
      },
      {
        name: 'システム監視',
        description: 'システムの稼働状況や異常を監視・通知',
        category: 'automation',
        isEnabled: true,
        examples: [
          'システムの稼働状況を確認',
          'エラーログを分析して',
          'パフォーマンス指標の推移は？'
        ]
      },
      {
        name: '予測分析',
        description: 'トレンド予測や将来の数値を予測',
        category: 'analytics',
        isEnabled: true,
        examples: [
          '来月の売上を予測して',
          'ユーザー成長率の予測は？',
          'チャーンレートの将来予測'
        ]
      },
      {
        name: 'タスク自動化',
        description: '定期的な管理タスクの自動化を支援',
        category: 'automation',
        isEnabled: true,
        examples: [
          '週次レポートを自動化したい',
          'アラート設定を最適化して',
          '定期メンテナンスのスケジューリング'
        ]
      }
    ]

    const sampleChats: Omit<AdminAIChat, 'id'>[] = [
      {
        title: '売上分析について',
        adminId: 'admin_001',
        messages: [
          {
            id: 'msg_1',
            role: 'user',
            content: '今月の売上状況を教えてください',
            timestamp: new Date(Date.now() - 60000).toISOString()
          },
          {
            id: 'msg_2',
            role: 'assistant',
            content: '📊 今月の売上分析をお伝えします。\n\n**売上概況：**\n• 総売上: ¥2,850,000（前月比+15%）\n• MRR: ¥2,650,000\n• 新規売上: ¥200,000\n\n**プラン別内訳：**\n• プロフェッショナル: 60%\n• ベーシック: 30%\n• エンタープライズ: 10%\n\n特にプロフェッショナルプランの成長が顕著で、SNS連携機能が好評です。',
            timestamp: new Date(Date.now() - 30000).toISOString()
          }
        ],
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        updatedAt: new Date(Date.now() - 30000).toISOString()
      },
      {
        title: 'ユーザー分析レポート',
        adminId: 'admin_001',
        messages: [
          {
            id: 'msg_3',
            role: 'user',
            content: 'ユーザーの利用傾向を分析してください',
            timestamp: new Date(Date.now() - 7200000).toISOString()
          },
          {
            id: 'msg_4',
            role: 'assistant',
            content: '👥 ユーザー利用傾向分析結果：\n\n**基本指標：**\n• 総ユーザー数: 1,234名\n• 月間アクティブ: 867名（70%）\n• 平均セッション時間: 25分\n\n**利用パターン：**\n• ピーク時間: 10-12時、13-14時\n• 人気機能: AIアシスタント（85%）、プロンプト管理（78%）\n• デバイス: PC 65%、モバイル 35%\n\n**コンバージョン：**\n• トライアル→有料: 25.5%\n• 平均継続期間: 8.3ヶ月',
            timestamp: new Date(Date.now() - 7000000).toISOString()
          }
        ],
        createdAt: new Date(Date.now() - 7200000).toISOString(),
        updatedAt: new Date(Date.now() - 7000000).toISOString()
      }
    ]

    // 並列でデータを作成
    const promises = [
      ...sampleCapabilities.map(capability => 
        addDoc(collection(db, COLLECTIONS.AI_CAPABILITIES), capability)
      ),
      ...sampleChats.map(chat => 
        addDoc(collection(db, COLLECTIONS.AI_CHATS), {
          ...chat,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        })
      )
    ]

    await Promise.all(promises)

    console.log('✅ Sample AI assistant data seeded successfully!')
  } catch (error) {
    console.error('❌ Error seeding AI assistant data:', error)
    throw error
  }
}
