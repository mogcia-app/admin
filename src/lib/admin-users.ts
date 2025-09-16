// 固定管理者情報
export interface AdminUser {
  id: string
  email: string
  name: string
  role: 'super_admin' | 'admin'
  createdAt: string
}

// Signal App 管理者3名（固定）
export const ADMIN_USERS: AdminUser[] = [
  {
    id: 'admin_001',
    email: 'marina.ishida@signalapp.jp',
    name: '石田真梨奈',
    role: 'super_admin',
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'admin_002', 
    email: 'hiroto.domoto@signalapp.jp',
    name: '堂本寛人',
    role: 'admin',
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'admin_003',
    email: 'kentarou.kitamura@signalapp.jp',
    name: '北村健太郎', 
    role: 'admin',
    createdAt: '2024-01-01T00:00:00Z'
  }
]

// 管理者かどうかチェック
export function isAdminUser(email: string): boolean {
  return ADMIN_USERS.some(admin => admin.email === email)
}

// 管理者情報取得
export function getAdminUser(email: string): AdminUser | null {
  return ADMIN_USERS.find(admin => admin.email === email) || null
}

// 管理者一覧取得
export function getAllAdminUsers(): AdminUser[] {
  return ADMIN_USERS
}
