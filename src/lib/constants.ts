export const ADMIN_ROUTES = {
  DASHBOARD: '/dashboard',
  USERS: '/users',
  SETTINGS: '/settings',
  ANALYTICS: '/analytics',
  PROFILE: '/profile',
} as const

export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  MODERATOR: 'moderator',
} as const

export const API_ENDPOINTS = {
  USERS: '/api/users',
  AUTH: '/api/auth',
  DASHBOARD: '/api/dashboard',
} as const
