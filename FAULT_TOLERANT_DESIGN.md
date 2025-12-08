# フォールトレラント設計 - 提案書

## 📊 現状分析

### 現在の問題点
1. **単一障害点（SPOF）**: Firestoreが失敗するとアクセス制御が機能しない
2. **フォールバックなし**: アクセス制御システムが失敗した場合のデフォルト動作が不明確
3. **オールオアナッシング**: 完全ブロックか完全開放の二択のみ
4. **自動復旧なし**: システム復旧後の自動的な機能再開がない

## 🎯 商用的メリット

### 1. **サービス可用性の向上**
- アクセス制御システムが失敗しても、基本機能は継続利用可能
- ユーザー離脱リスクの低減
- 収益損失の最小化

### 2. **リスク管理**
- セキュリティと可用性のバランス
- 段階的な制限により、過度なブロックを防止
- 法的リスク（サービス停止による契約違反など）の回避

### 3. **運用の柔軟性**
- 緊急時の判断ミスの影響を軽減
- 自動復旧により、24時間監視不要
- 段階的な制限により、影響範囲を最小化

## 🏗️ 推奨設計アーキテクチャ

### 1. **多層防御アーキテクチャ**

```
┌─────────────────────────────────────────┐
│ Layer 1: 緊急セキュリティモード         │  ← 最優先（手動）
│ - 完全ブロック / 部分ブロック           │
│ - 即座に有効化可能                      │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ Layer 2: アクセス制御システム           │  ← 機能制御
│ - 機能別の有効/無効                     │
│ - ユーザーグループ別制限                │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ Layer 3: Firestore フォールバック       │  ← データ層
│ - ローカルキャッシュ                    │
│ - デフォルト動作（フォールセーフ）      │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ Layer 4: アプリケーションレベル         │  ← 最終防衛
│ - グレースフルデグラデーション          │
│ - エラーハンドリング                    │
└─────────────────────────────────────────┘
```

### 2. **フォールバック戦略**

#### 2.1. Firestore接続失敗時
```typescript
// 優先順位
1. Firestoreから取得（最新の設定）
2. LocalStorageキャッシュ（30分以内のデータ）
3. メモリキャッシュ（セッション中）
4. デフォルト動作（すべて許可、または設定で制御）
```

#### 2.2. アクセス制御システム失敗時
```typescript
// デフォルト動作（設定可能）
- オプションA: すべて許可（可用性優先）
- オプションB: すべてブロック（セキュリティ優先）
- オプションC: 最後の既知の状態を維持
```

### 3. **段階的制限システム**

#### 3.1. 制限レベル定義
```
Level 0: 通常運用（制限なし）
Level 1: 軽度制限（新規ユーザー登録のみブロック）
Level 2: 中度制限（一部機能のみ利用可能）
Level 3: 高度制限（読み取り専用モード）
Level 4: 緊急ブロック（全ブロック）
```

#### 3.2. 自動段階的制限
- システム負荷が高い場合、自動的にレベル1→2と段階的に制限
- セキュリティイベント検知時、自動的にレベルを上げる
- 正常化後、自動的にレベルを下げる

### 4. **自動復旧機能**

#### 4.1. 健康チェック
```typescript
- Firestore接続状態の監視
- アクセス制御システムの状態確認
- 外部依存サービスの可用性確認
```

#### 4.2. 自動復旧フロー
```
1. 障害検知
2. フォールバックモードに切り替え
3. 健康チェックを開始（30秒間隔）
4. 正常化を確認（3回連続成功）
5. 自動的に通常モードに復旧
6. 管理者に通知
```

## 🔧 実装フェーズ

### Phase 1: 基盤構築（必須）
- [ ] ローカルキャッシュ機構の実装
- [ ] フォールバック動作の設定
- [ ] エラーハンドリングの強化
- [ ] 健康チェックの実装

### Phase 2: 自動化（推奨）
- [ ] 自動復旧機能
- [ ] 段階的制限システム
- [ ] 監視とアラート

### Phase 3: 高度な機能（将来）
- [ ] マルチリージョン冗長性
- [ ] レプリケーション機能
- [ ] AIベースの異常検知

## 💡 具体的な実装例

### 1. キャッシュ付きアクセス制御

```typescript
// lib/access-control-fault-tolerant.ts
interface CacheEntry {
  data: AppAccessControl[]
  timestamp: number
  ttl: number // Time to live (30分)
}

class FaultTolerantAccessControl {
  private cache: CacheEntry | null = null
  private memoryCache: AppAccessControl[] | null = null
  
  async getAccessControls(): Promise<AppAccessControl[]> {
    try {
      // 1. Firestoreから取得を試みる
      const data = await getAccessControlSettings()
      
      // 成功したらキャッシュを更新
      this.updateCache(data)
      return data
    } catch (error) {
      console.warn('Firestore access failed, using fallback:', error)
      
      // 2. ローカルキャッシュをチェック
      const cached = this.getCachedData()
      if (cached) {
        return cached
      }
      
      // 3. メモリキャッシュをチェック
      if (this.memoryCache) {
        return this.memoryCache
      }
      
      // 4. デフォルト動作（すべて許可、または設定による）
      return this.getDefaultAccessControls()
    }
  }
  
  private updateCache(data: AppAccessControl[]): void {
    // LocalStorageに保存
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessControlCache', JSON.stringify({
        data,
        timestamp: Date.now(),
        ttl: 30 * 60 * 1000 // 30分
      }))
    }
    
    // メモリキャッシュも更新
    this.memoryCache = data
  }
  
  private getCachedData(): AppAccessControl[] | null {
    if (typeof window === 'undefined') return null
    
    try {
      const cached = localStorage.getItem('accessControlCache')
      if (!cached) return null
      
      const entry: CacheEntry = JSON.parse(cached)
      const now = Date.now()
      
      // TTLチェック
      if (now - entry.timestamp > entry.ttl) {
        localStorage.removeItem('accessControlCache')
        return null
      }
      
      return entry.data
    } catch {
      return null
    }
  }
  
  private getDefaultAccessControls(): AppAccessControl[] {
    // 設定ファイルから読み込む、またはデフォルト値
    // セキュリティ優先: すべてブロック
    // 可用性優先: すべて許可（現在の状態）
    const defaultMode = process.env.NEXT_PUBLIC_DEFAULT_ACCESS_MODE || 'allow'
    
    if (defaultMode === 'deny') {
      // セキュリティ優先：すべてブロック
      return []
    }
    
    // 可用性優先：すべて許可（既存の動作を維持）
    return []
  }
}
```

### 2. 段階的制限システム

```typescript
// lib/gradual-restriction.ts
export enum RestrictionLevel {
  NONE = 0,        // 制限なし
  LIGHT = 1,       // 軽度制限
  MODERATE = 2,    // 中度制限
  HIGH = 3,        // 高度制限
  EMERGENCY = 4    // 緊急ブロック
}

export class GradualRestrictionManager {
  private currentLevel: RestrictionLevel = RestrictionLevel.NONE
  
  getRestrictionsForLevel(level: RestrictionLevel): {
    blockedUserGroups: string[]
    blockedActions: string[]
    blockedFeatures: string[]
  } {
    switch (level) {
      case RestrictionLevel.NONE:
        return {
          blockedUserGroups: [],
          blockedActions: [],
          blockedFeatures: []
        }
      
      case RestrictionLevel.LIGHT:
        return {
          blockedUserGroups: ['new_users'],
          blockedActions: ['registration'],
          blockedFeatures: []
        }
      
      case RestrictionLevel.MODERATE:
        return {
          blockedUserGroups: ['new_users', 'trial_users'],
          blockedActions: ['registration', 'file_upload'],
          blockedFeatures: ['ai_assistant']
        }
      
      case RestrictionLevel.HIGH:
        return {
          blockedUserGroups: ['new_users', 'trial_users', 'free_users'],
          blockedActions: ['registration', 'file_upload', 'data_export', 'api_access'],
          blockedFeatures: ['ai_assistant', 'advanced_analytics']
        }
      
      case RestrictionLevel.EMERGENCY:
        return {
          blockedUserGroups: ['all'],
          blockedActions: ['login', 'registration'],
          blockedFeatures: ['all']
        }
      
      default:
        return this.getRestrictionsForLevel(RestrictionLevel.NONE)
    }
  }
  
  async escalateLevel(reason: string): Promise<void> {
    if (this.currentLevel < RestrictionLevel.EMERGENCY) {
      this.currentLevel++
      await this.applyRestrictions(reason)
    }
  }
  
  async deescalateLevel(reason: string): Promise<void> {
    if (this.currentLevel > RestrictionLevel.NONE) {
      this.currentLevel--
      await this.applyRestrictions(reason)
    }
  }
  
  private async applyRestrictions(reason: string): Promise<void> {
    const restrictions = this.getRestrictionsForLevel(this.currentLevel)
    
    // 緊急セキュリティモードを更新
    // またはアクセス制御設定を更新
  }
}
```

### 3. 自動復旧システム

```typescript
// lib/auto-recovery.ts
export class AutoRecoveryManager {
  private healthCheckInterval: NodeJS.Timeout | null = null
  private consecutiveSuccessCount = 0
  private readonly requiredSuccessCount = 3
  
  startHealthCheck(): void {
    this.healthCheckInterval = setInterval(async () => {
      const isHealthy = await this.performHealthCheck()
      
      if (isHealthy) {
        this.consecutiveSuccessCount++
        
        // 3回連続で成功したら復旧
        if (this.consecutiveSuccessCount >= this.requiredSuccessCount) {
          await this.attemptRecovery()
          this.consecutiveSuccessCount = 0
        }
      } else {
        this.consecutiveSuccessCount = 0
      }
    }, 30000) // 30秒ごとにチェック
  }
  
  private async performHealthCheck(): Promise<boolean> {
    try {
      // Firestore接続チェック
      await getAccessControlSettings()
      
      // その他の依存サービスのチェック
      // ...
      
      return true
    } catch {
      return false
    }
  }
  
  private async attemptRecovery(): Promise<void> {
    try {
      // キャッシュをクリア
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessControlCache')
      }
      
      // アクセス制御設定を再取得
      await getAccessControlSettings()
      
      // 管理者に通知
      console.log('System recovered from fault-tolerant mode')
      
      // 必要に応じて通知を送信
    } catch (error) {
      console.error('Recovery attempt failed:', error)
    }
  }
  
  stopHealthCheck(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
      this.healthCheckInterval = null
    }
  }
}
```

## 📝 設定オプション

### 環境変数による設定

```env
# フォールバック動作
NEXT_PUBLIC_DEFAULT_ACCESS_MODE=allow  # allow | deny | last_known

# キャッシュTTL（分）
NEXT_PUBLIC_ACCESS_CONTROL_CACHE_TTL=30

# 自動復旧を有効にするか
NEXT_PUBLIC_AUTO_RECOVERY_ENABLED=true

# 健康チェック間隔（秒）
NEXT_PUBLIC_HEALTH_CHECK_INTERVAL=30
```

## 🎯 判断フロー（分岐設計）

### アクセス制御の決定フロー

```
ユーザーリクエスト
    ↓
[1] 緊急セキュリティモード確認
    ├─ アクティブ → 緊急モードのルールを適用 → 結果
    └─ 非アクティブ → [2]へ
         ↓
[2] Firestore接続試行
    ├─ 成功 → Firestoreの設定を適用 → 結果
    └─ 失敗 → [3]へ
         ↓
[3] キャッシュ確認
    ├─ 有効なキャッシュあり → キャッシュデータを適用 → 結果
    └─ キャッシュなし → [4]へ
         ↓
[4] デフォルト動作
    ├─ MODE=allow → すべて許可 → 結果
    ├─ MODE=deny → すべてブロック → 結果
    └─ MODE=last_known → 最後の既知の状態 → 結果
```

## ⚠️ 注意事項

1. **セキュリティ vs 可用性のトレードオフ**
   - フォールバックが「すべて許可」の場合、セキュリティリスク
   - フォールバックが「すべてブロック」の場合、可用性リスク
   - **推奨**: 環境変数で設定可能にし、デフォルトは「最後の既知の状態」を維持

2. **キャッシュの有効期限**
   - 長すぎると、古い設定が適用される
   - 短すぎると、フォールバックの意味がない
   - **推奨**: 30分（設定可能）

3. **自動復旧の安全性**
   - 自動復旧が誤動作すると、意図しない開放
   - **推奨**: 管理者に通知し、手動確認も可能にする

## 📊 ROI（投資対効果）

### 実装コスト
- Phase 1: 1-2週間（基盤構築）
- Phase 2: 1週間（自動化）
- Phase 3: 2-3週間（高度な機能）

### 期待される効果
- **ダウンタイム削減**: 50-70%削減見込み
- **収益損失削減**: 障害時の損失を最小化
- **運用コスト削減**: 24時間監視の必要性を低減
- **ユーザー満足度向上**: サービス継続により離脱率低下

## 🔄 段階的導入推奨

1. **まずPhase 1を実装**（キャッシュとフォールバック）
2. **運用して問題点を把握**
3. **必要に応じてPhase 2を追加**
4. **規模が大きくなったらPhase 3を検討**

現在の段階では、**Phase 1の実装を強く推奨**します。

