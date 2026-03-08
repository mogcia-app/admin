export const UI_EVENT_TYPE = {
  SIDEBAR_CLICK: 'sidebar.click',
  PAGE_BUTTON_CLICK: 'page.button.click',
} as const

export type UiEventType = (typeof UI_EVENT_TYPE)[keyof typeof UI_EVENT_TYPE]

export interface UiEventLog {
  eventType: UiEventType
  actorUid: string
  actorEmail: string
  buttonId: string
  label: string
  pagePath?: string
  currentPath: string
  href?: string
  sessionId: string
  clickedAtClient: string
  createdAt: unknown
}

export interface UiEventAggregateItem {
  key: string
  label: string
  count: number
  uniqueUsers: number
}

export interface UiEventAggregateResponse {
  totalClicks: number
  uniqueUsers: number
  eventType: string
  from: string | null
  to: string | null
  buttonBreakdown: UiEventAggregateItem[]
  userBreakdown: UiEventAggregateItem[]
  recentLogs: Array<Record<string, unknown>>
}
