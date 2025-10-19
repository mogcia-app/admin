"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNotificationStats = exports.deleteNotification = exports.updateNotification = exports.createNotification = exports.getNotifications = exports.getConversionFunnel = exports.getRetentionMetrics = exports.getEngagementMetrics = exports.getUserAcquisitionData = exports.getRevenueData = exports.getKPIMetrics = exports.incrementPromptUsage = exports.deletePrompt = exports.updatePrompt = exports.createPrompt = exports.getPrompts = exports.reportError = exports.getToolMaintenanceStatus = exports.setToolMaintenanceMode = exports.getDashboardData = exports.createUser = exports.getUsers = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const cors_1 = __importDefault(require("cors"));
// Firebase Admin SDKの初期化
admin.initializeApp();
const corsHandler = (0, cors_1.default)({ origin: true });
// ユーザー管理関数
exports.getUsers = functions.https.onRequest(async (req, res) => {
    try {
        // CORSヘッダーの設定
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
        res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        if (req.method === 'OPTIONS') {
            res.status(204).send('');
            return;
        }
        if (req.method !== 'GET') {
            res.status(405).json({ error: 'Method not allowed' });
            return;
        }
        // Firestoreからユーザー一覧を取得
        const usersSnapshot = await admin.firestore().collection('users').get();
        const users = usersSnapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
        res.status(200).json({ users });
    }
    catch (error) {
        console.error('Error getting users:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// ユーザー作成関数
exports.createUser = functions.https.onRequest(async (req, res) => {
    try {
        // CORSヘッダーの設定
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
        res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        if (req.method === 'OPTIONS') {
            res.status(204).send('');
            return;
        }
        if (req.method !== 'POST') {
            res.status(405).json({ error: 'Method not allowed' });
            return;
        }
        const { name, email, role = 'user' } = req.body;
        if (!name || !email) {
            res.status(400).json({ error: 'Name and email are required' });
            return;
        }
        // Firestoreにユーザーを作成
        const userRef = await admin.firestore().collection('users').add({
            name,
            email,
            role,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            isActive: true
        });
        const newUser = await userRef.get();
        res.status(201).json(Object.assign({ id: newUser.id }, newUser.data()));
    }
    catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// ダッシュボードデータ取得関数
exports.getDashboardData = functions.https.onRequest(async (req, res) => {
    try {
        // CORSヘッダーの設定
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
        res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        if (req.method === 'OPTIONS') {
            res.status(204).send('');
            return;
        }
        if (req.method !== 'GET') {
            res.status(405).json({ error: 'Method not allowed' });
            return;
        }
        // 統計情報の取得
        const usersSnapshot = await admin.firestore().collection('users').get();
        const totalUsers = usersSnapshot.size;
        const activeUsersSnapshot = await admin.firestore()
            .collection('users')
            .where('isActive', '==', true)
            .get();
        const activeUsers = activeUsersSnapshot.size;
        const dashboardData = {
            stats: {
                totalUsers,
                activeUsers,
                totalRevenue: 2340000, // 実際のアプリではデータベースから取得
                monthlyGrowth: 23.1
            },
            recentActivity: [
                {
                    id: '1',
                    type: 'user_registration',
                    message: '新規ユーザー登録',
                    timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
                },
                {
                    id: '2',
                    type: 'system_update',
                    message: 'システム更新完了',
                    timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
                }
            ]
        };
        res.status(200).json(dashboardData);
    }
    catch (error) {
        console.error('Error getting dashboard data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// =============================================================================
// ツール側メンテナンス制御API
// =============================================================================
exports.setToolMaintenanceMode = functions.https.onRequest(async (req, res) => {
    try {
        // CORSヘッダーの設定
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
        res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        if (req.method === 'OPTIONS') {
            res.status(204).send('');
            return;
        }
        if (req.method !== 'POST') {
            res.status(405).json({ error: 'Method not allowed' });
            return;
        }
        const { enabled, message, scheduledStart, scheduledEnd, updatedBy } = req.body;
        // メンテナンス設定をFirestoreに保存
        const maintenanceData = {
            enabled: enabled || false,
            message: message || 'システムメンテナンス中です。しばらくお待ちください。',
            scheduledStart: scheduledStart ? admin.firestore.Timestamp.fromDate(new Date(scheduledStart)) : null,
            scheduledEnd: scheduledEnd ? admin.firestore.Timestamp.fromDate(new Date(scheduledEnd)) : null,
            updatedBy: updatedBy || 'admin',
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        // メンテナンス設定を更新（ドキュメントIDを固定）
        const maintenanceRef = admin.firestore().collection('systemSettings').doc('toolMaintenance');
        await maintenanceRef.set(maintenanceData, { merge: true });
        console.log('Tool maintenance mode updated:', maintenanceData);
        res.status(200).json({
            success: true,
            message: 'ツール側のメンテナンスモードを更新しました',
            data: maintenanceData
        });
    }
    catch (error) {
        console.error('Error setting tool maintenance mode:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.getToolMaintenanceStatus = functions.https.onRequest(async (req, res) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    try {
        // CORSヘッダーの設定
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
        res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        if (req.method === 'OPTIONS') {
            res.status(204).send('');
            return;
        }
        if (req.method !== 'GET') {
            res.status(405).json({ error: 'Method not allowed' });
            return;
        }
        // メンテナンス設定を取得
        const maintenanceRef = admin.firestore().collection('systemSettings').doc('toolMaintenance');
        const maintenanceDoc = await maintenanceRef.get();
        if (!maintenanceDoc.exists) {
            res.status(200).json({
                success: true,
                data: {
                    enabled: false,
                    message: '',
                    scheduledStart: null,
                    scheduledEnd: null,
                    updatedBy: '',
                    updatedAt: null
                }
            });
            return;
        }
        const data = maintenanceDoc.data();
        res.status(200).json({
            success: true,
            data: {
                enabled: (data === null || data === void 0 ? void 0 : data.enabled) || false,
                message: (data === null || data === void 0 ? void 0 : data.message) || '',
                scheduledStart: ((_c = (_b = (_a = data === null || data === void 0 ? void 0 : data.scheduledStart) === null || _a === void 0 ? void 0 : _a.toDate) === null || _b === void 0 ? void 0 : _b.call(_a)) === null || _c === void 0 ? void 0 : _c.toISOString()) || null,
                scheduledEnd: ((_f = (_e = (_d = data === null || data === void 0 ? void 0 : data.scheduledEnd) === null || _d === void 0 ? void 0 : _d.toDate) === null || _e === void 0 ? void 0 : _e.call(_d)) === null || _f === void 0 ? void 0 : _f.toISOString()) || null,
                updatedBy: (data === null || data === void 0 ? void 0 : data.updatedBy) || '',
                updatedAt: ((_j = (_h = (_g = data === null || data === void 0 ? void 0 : data.updatedAt) === null || _g === void 0 ? void 0 : _g.toDate) === null || _h === void 0 ? void 0 : _h.call(_g)) === null || _j === void 0 ? void 0 : _j.toISOString()) || null
            }
        });
    }
    catch (error) {
        console.error('Error getting tool maintenance status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// =============================================================================
// エラー監視API
// =============================================================================
exports.reportError = functions.https.onRequest(async (req, res) => {
    try {
        // CORSヘッダーの設定
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
        res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        if (req.method === 'OPTIONS') {
            res.status(204).send('');
            return;
        }
        if (req.method !== 'POST') {
            res.status(405).json({ error: 'Method not allowed' });
            return;
        }
        const { level, message, source, stack, metadata } = req.body;
        // 必須フィールドの検証
        if (!level || !message || !source) {
            res.status(400).json({
                error: 'Missing required fields: level, message, source are required'
            });
            return;
        }
        // エラーレベルの検証
        const validLevels = ['fatal', 'error', 'warn', 'info'];
        if (!validLevels.includes(level)) {
            res.status(400).json({
                error: 'Invalid level. Must be one of: fatal, error, warn, info'
            });
            return;
        }
        // Firestoreにエラーログを保存
        const errorLog = {
            level,
            message,
            source,
            stack: stack || null,
            metadata: metadata || {},
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            resolved: false,
            count: 1
        };
        const docRef = await admin.firestore().collection('errorLogs').add(errorLog);
        console.log('Error reported:', {
            id: docRef.id,
            level,
            message,
            source
        });
        res.status(201).json({
            success: true,
            id: docRef.id,
            message: 'Error reported successfully'
        });
    }
    catch (error) {
        console.error('Error reporting error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// =============================================================================
// プロンプト管理API
// =============================================================================
// プロンプト一覧取得
exports.getPrompts = functions.https.onRequest((req, res) => {
    corsHandler(req, res, async () => {
        try {
            // クエリパラメータの取得
            const category = req.query.category;
            const search = req.query.search;
            const isActive = req.query.isActive;
            let queryRef = admin.firestore().collection('promptTemplates');
            // フィルター適用
            if (category && category !== 'all') {
                queryRef = queryRef.where('category', '==', category);
            }
            if (isActive !== undefined) {
                queryRef = queryRef.where('isActive', '==', isActive === 'true');
            }
            const snapshot = await queryRef.orderBy('createdAt', 'desc').get();
            let prompts = snapshot.docs.map((doc) => (Object.assign({ id: doc.id }, doc.data())));
            // 検索フィルター（クライアントサイド）
            if (search) {
                const searchLower = search.toLowerCase();
                prompts = prompts.filter((prompt) => {
                    var _a, _b, _c;
                    return ((_a = prompt.name) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes(searchLower)) ||
                        ((_b = prompt.description) === null || _b === void 0 ? void 0 : _b.toLowerCase().includes(searchLower)) ||
                        ((_c = prompt.tags) === null || _c === void 0 ? void 0 : _c.some((tag) => tag.toLowerCase().includes(searchLower)));
                });
            }
            res.status(200).json({ prompts });
        }
        catch (error) {
            console.error('Error getting prompts:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });
});
// プロンプト作成
exports.createPrompt = functions.https.onRequest(async (req, res) => {
    try {
        // CORSヘッダーの設定
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
        res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        if (req.method === 'OPTIONS') {
            res.status(204).send('');
            return;
        }
        if (req.method !== 'POST') {
            res.status(405).json({ error: 'Method not allowed' });
            return;
        }
        const { name, description, category, prompt, variables, tags, isActive, createdBy } = req.body;
        // バリデーション
        if (!name || !prompt || !createdBy) {
            res.status(400).json({ error: 'Name, prompt, and createdBy are required' });
            return;
        }
        // Firestoreにプロンプトを作成
        const promptRef = await admin.firestore().collection('promptTemplates').add({
            name,
            description: description || '',
            category: category || 'custom',
            prompt,
            variables: variables || [],
            tags: tags || [],
            isActive: isActive !== undefined ? isActive : true,
            usageCount: 0,
            createdBy,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        const newPrompt = await promptRef.get();
        res.status(201).json(Object.assign({ id: newPrompt.id }, newPrompt.data()));
    }
    catch (error) {
        console.error('Error creating prompt:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// プロンプト更新
exports.updatePrompt = functions.https.onRequest(async (req, res) => {
    try {
        // CORSヘッダーの設定
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
        res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        if (req.method === 'OPTIONS') {
            res.status(204).send('');
            return;
        }
        if (req.method !== 'PUT') {
            res.status(405).json({ error: 'Method not allowed' });
            return;
        }
        const promptId = req.query.id;
        if (!promptId) {
            res.status(400).json({ error: 'Prompt ID is required' });
            return;
        }
        const updateData = Object.assign({}, req.body);
        delete updateData.id; // IDは更新しない
        updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();
        await admin.firestore().collection('promptTemplates').doc(promptId).update(updateData);
        const updatedPrompt = await admin.firestore().collection('promptTemplates').doc(promptId).get();
        res.status(200).json(Object.assign({ id: updatedPrompt.id }, updatedPrompt.data()));
    }
    catch (error) {
        console.error('Error updating prompt:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// プロンプト削除
exports.deletePrompt = functions.https.onRequest(async (req, res) => {
    try {
        // CORSヘッダーの設定
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
        res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        if (req.method === 'OPTIONS') {
            res.status(204).send('');
            return;
        }
        if (req.method !== 'DELETE') {
            res.status(405).json({ error: 'Method not allowed' });
            return;
        }
        const promptId = req.query.id;
        if (!promptId) {
            res.status(400).json({ error: 'Prompt ID is required' });
            return;
        }
        await admin.firestore().collection('promptTemplates').doc(promptId).delete();
        res.status(200).json({ message: 'Prompt deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting prompt:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// プロンプト使用回数増加
exports.incrementPromptUsage = functions.https.onRequest(async (req, res) => {
    try {
        // CORSヘッダーの設定
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
        res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        if (req.method === 'OPTIONS') {
            res.status(204).send('');
            return;
        }
        if (req.method !== 'POST') {
            res.status(405).json({ error: 'Method not allowed' });
            return;
        }
        const promptId = req.query.id;
        if (!promptId) {
            res.status(400).json({ error: 'Prompt ID is required' });
            return;
        }
        await admin.firestore().collection('promptTemplates').doc(promptId).update({
            usageCount: admin.firestore.FieldValue.increment(1),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        res.status(200).json({ message: 'Usage count incremented successfully' });
    }
    catch (error) {
        console.error('Error incrementing prompt usage:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// =============================================================================
// KPI・分析データAPI
// =============================================================================
// KPIメトリクス取得
exports.getKPIMetrics = functions.https.onRequest(async (req, res) => {
    try {
        // CORSヘッダーの設定
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
        res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        if (req.method === 'OPTIONS') {
            res.status(204).send('');
            return;
        }
        if (req.method !== 'GET') {
            res.status(405).json({ error: 'Method not allowed' });
            return;
        }
        const category = req.query.category;
        let queryRef = admin.firestore().collection('kpiMetrics');
        if (category) {
            queryRef = queryRef.where('category', '==', category);
        }
        const snapshot = await queryRef.orderBy('date', 'desc').limit(100).get();
        const metrics = snapshot.docs.map((doc) => (Object.assign({ id: doc.id }, doc.data())));
        res.status(200).json({ metrics });
    }
    catch (error) {
        console.error('Error getting KPI metrics:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// 売上データ取得
exports.getRevenueData = functions.https.onRequest(async (req, res) => {
    try {
        // CORSヘッダーの設定
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
        res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        if (req.method === 'OPTIONS') {
            res.status(204).send('');
            return;
        }
        if (req.method !== 'GET') {
            res.status(405).json({ error: 'Method not allowed' });
            return;
        }
        const startDate = req.query.startDate;
        const endDate = req.query.endDate;
        let queryRef = admin.firestore().collection('revenueData');
        if (startDate && endDate) {
            queryRef = queryRef.where('date', '>=', startDate).where('date', '<=', endDate);
        }
        const snapshot = await queryRef.orderBy('date', 'asc').get();
        const revenueData = snapshot.docs.map((doc) => (Object.assign({ id: doc.id }, doc.data())));
        res.status(200).json({ revenueData });
    }
    catch (error) {
        console.error('Error getting revenue data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// ユーザー獲得データ取得
exports.getUserAcquisitionData = functions.https.onRequest(async (req, res) => {
    try {
        // CORSヘッダーの設定
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
        res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        if (req.method === 'OPTIONS') {
            res.status(204).send('');
            return;
        }
        if (req.method !== 'GET') {
            res.status(405).json({ error: 'Method not allowed' });
            return;
        }
        const period = req.query.period || '30';
        const snapshot = await admin.firestore()
            .collection('userAcquisition')
            .orderBy('date', 'desc')
            .limit(parseInt(period))
            .get();
        const userAcquisitionData = snapshot.docs.map((doc) => (Object.assign({ id: doc.id }, doc.data()))).reverse(); // 日付順にソート
        res.status(200).json({ userAcquisitionData });
    }
    catch (error) {
        console.error('Error getting user acquisition data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// エンゲージメントメトリクス取得
exports.getEngagementMetrics = functions.https.onRequest(async (req, res) => {
    try {
        // CORSヘッダーの設定
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
        res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        if (req.method === 'OPTIONS') {
            res.status(204).send('');
            return;
        }
        if (req.method !== 'GET') {
            res.status(405).json({ error: 'Method not allowed' });
            return;
        }
        const snapshot = await admin.firestore()
            .collection('engagementMetrics')
            .orderBy('date', 'desc')
            .limit(30)
            .get();
        const engagementMetrics = snapshot.docs.map((doc) => (Object.assign({ id: doc.id }, doc.data())));
        res.status(200).json({ engagementMetrics });
    }
    catch (error) {
        console.error('Error getting engagement metrics:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// リテンションメトリクス取得
exports.getRetentionMetrics = functions.https.onRequest(async (req, res) => {
    try {
        // CORSヘッダーの設定
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
        res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        if (req.method === 'OPTIONS') {
            res.status(204).send('');
            return;
        }
        if (req.method !== 'GET') {
            res.status(405).json({ error: 'Method not allowed' });
            return;
        }
        const snapshot = await admin.firestore()
            .collection('retentionMetrics')
            .orderBy('cohort', 'desc')
            .limit(12)
            .get();
        const retentionMetrics = snapshot.docs.map((doc) => (Object.assign({ id: doc.id }, doc.data())));
        res.status(200).json({ retentionMetrics });
    }
    catch (error) {
        console.error('Error getting retention metrics:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// コンバージョンファネル取得
exports.getConversionFunnel = functions.https.onRequest(async (req, res) => {
    try {
        // CORSヘッダーの設定
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
        res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        if (req.method === 'OPTIONS') {
            res.status(204).send('');
            return;
        }
        if (req.method !== 'GET') {
            res.status(405).json({ error: 'Method not allowed' });
            return;
        }
        const snapshot = await admin.firestore()
            .collection('conversionFunnels')
            .orderBy('updatedAt', 'desc')
            .limit(1)
            .get();
        const conversionFunnel = snapshot.docs.map((doc) => (Object.assign({ id: doc.id }, doc.data())))[0] || null;
        res.status(200).json({ conversionFunnel });
    }
    catch (error) {
        console.error('Error getting conversion funnel:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// =============================================================================
// 通知管理API
// =============================================================================
// 通知一覧取得
exports.getNotifications = functions.https.onRequest(async (req, res) => {
    try {
        // CORSヘッダーの設定
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
        res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        if (req.method === 'OPTIONS') {
            res.status(204).send('');
            return;
        }
        if (req.method !== 'GET') {
            res.status(405).json({ error: 'Method not allowed' });
            return;
        }
        const type = req.query.type;
        const status = req.query.status;
        const limit = parseInt(req.query.limit) || 50;
        let queryRef = admin.firestore().collection('notifications');
        if (type) {
            queryRef = queryRef.where('type', '==', type);
        }
        if (status) {
            queryRef = queryRef.where('status', '==', status);
        }
        const snapshot = await queryRef.orderBy('createdAt', 'desc').limit(limit).get();
        const notifications = snapshot.docs.map((doc) => (Object.assign({ id: doc.id }, doc.data())));
        res.status(200).json({ notifications });
    }
    catch (error) {
        console.error('Error getting notifications:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// 通知作成
exports.createNotification = functions.https.onRequest(async (req, res) => {
    try {
        // CORSヘッダーの設定
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
        res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        if (req.method === 'OPTIONS') {
            res.status(204).send('');
            return;
        }
        if (req.method !== 'POST') {
            res.status(405).json({ error: 'Method not allowed' });
            return;
        }
        const { title, message, type, targetUsers, scheduledAt, priority, createdBy } = req.body;
        // バリデーション
        if (!title || !message || !createdBy) {
            res.status(400).json({ error: 'Title, message, and createdBy are required' });
            return;
        }
        // Firestoreに通知を作成
        const notificationRef = await admin.firestore().collection('notifications').add({
            title,
            message,
            type: type || 'info',
            targetUsers: targetUsers || 'all',
            priority: priority || 'medium',
            status: scheduledAt ? 'scheduled' : 'sent',
            scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
            sentAt: scheduledAt ? null : admin.firestore.FieldValue.serverTimestamp(),
            readCount: 0,
            totalTargets: 0, // 実際の送信時に計算
            createdBy,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        const newNotification = await notificationRef.get();
        res.status(201).json(Object.assign({ id: newNotification.id }, newNotification.data()));
    }
    catch (error) {
        console.error('Error creating notification:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// 通知更新
exports.updateNotification = functions.https.onRequest(async (req, res) => {
    try {
        // CORSヘッダーの設定
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
        res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        if (req.method === 'OPTIONS') {
            res.status(204).send('');
            return;
        }
        if (req.method !== 'PUT') {
            res.status(405).json({ error: 'Method not allowed' });
            return;
        }
        const notificationId = req.query.id;
        if (!notificationId) {
            res.status(400).json({ error: 'Notification ID is required' });
            return;
        }
        const updateData = Object.assign({}, req.body);
        delete updateData.id;
        updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();
        await admin.firestore().collection('notifications').doc(notificationId).update(updateData);
        const updatedNotification = await admin.firestore().collection('notifications').doc(notificationId).get();
        res.status(200).json(Object.assign({ id: updatedNotification.id }, updatedNotification.data()));
    }
    catch (error) {
        console.error('Error updating notification:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// 通知削除
exports.deleteNotification = functions.https.onRequest(async (req, res) => {
    try {
        // CORSヘッダーの設定
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
        res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        if (req.method === 'OPTIONS') {
            res.status(204).send('');
            return;
        }
        if (req.method !== 'DELETE') {
            res.status(405).json({ error: 'Method not allowed' });
            return;
        }
        const notificationId = req.query.id;
        if (!notificationId) {
            res.status(400).json({ error: 'Notification ID is required' });
            return;
        }
        await admin.firestore().collection('notifications').doc(notificationId).delete();
        res.status(200).json({ message: 'Notification deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// 通知統計取得
exports.getNotificationStats = functions.https.onRequest(async (req, res) => {
    try {
        // CORSヘッダーの設定
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
        res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        if (req.method === 'OPTIONS') {
            res.status(204).send('');
            return;
        }
        if (req.method !== 'GET') {
            res.status(405).json({ error: 'Method not allowed' });
            return;
        }
        // 各ステータスの通知数を取得
        const [totalSnapshot, sentSnapshot, scheduledSnapshot, draftSnapshot] = await Promise.all([
            admin.firestore().collection('notifications').get(),
            admin.firestore().collection('notifications').where('status', '==', 'sent').get(),
            admin.firestore().collection('notifications').where('status', '==', 'scheduled').get(),
            admin.firestore().collection('notifications').where('status', '==', 'draft').get()
        ]);
        const stats = {
            total: totalSnapshot.size,
            sent: sentSnapshot.size,
            scheduled: scheduledSnapshot.size,
            draft: draftSnapshot.size,
            totalReads: 0, // 実際の実装では集計が必要
            avgReadRate: 0
        };
        res.status(200).json({ stats });
    }
    catch (error) {
        console.error('Error getting notification stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
//# sourceMappingURL=index.js.map