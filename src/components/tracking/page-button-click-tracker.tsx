'use client'

import { useEffect, useRef } from 'react'
import { User as FirebaseUser } from 'firebase/auth'

interface PageButtonClickTrackerProps {
  user: FirebaseUser | null
  mainSelector?: string
}

function getSessionId(): string {
  if (typeof window === 'undefined') return ''
  const key = 'ui-event-session-id'
  const existing = window.sessionStorage.getItem(key)
  if (existing) return existing
  const next = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  window.sessionStorage.setItem(key, next)
  return next
}

function normalizeLabel(element: HTMLElement): string {
  const ariaLabel = element.getAttribute('aria-label')
  const text = element.textContent?.trim()
  const value = (element as HTMLInputElement).value
  const title = element.getAttribute('title')

  return ariaLabel || text || value || title || 'label-unknown'
}

function normalizeButtonId(element: HTMLElement, label: string): string {
  const dataId = element.getAttribute('data-button-id')
  const id = element.id
  const name = element.getAttribute('name')

  if (dataId) return dataId
  if (id) return id
  if (name) return name

  const tag = element.tagName.toLowerCase()
  const compactLabel = label.replace(/\s+/g, '_').slice(0, 40)
  return `${tag}:${compactLabel || 'unknown'}`
}

function isTrackTarget(element: HTMLElement): boolean {
  const matchesButton = element.matches('button, [role="button"], input[type="button"], input[type="submit"]')
  if (!matchesButton) return false

  if (element.closest('[data-track-ignore="true"]')) return false
  if (element.closest('[data-ui-region="sidebar"]')) return false

  return true
}

export function PageButtonClickTracker({ user, mainSelector = '[data-ui-region="main"]' }: PageButtonClickTrackerProps) {
  const mountedRef = useRef(false)

  useEffect(() => {
    if (!user) return
    const mainElement = document.querySelector(mainSelector)
    if (!mainElement) return

    mountedRef.current = true

    const onClick: EventListener = (event) => {
      const target = event.target as HTMLElement | null
      if (!target) return

      const clickable = target.closest('button, [role="button"], input[type="button"], input[type="submit"]') as HTMLElement | null
      if (!clickable || !isTrackTarget(clickable)) return
      if (!mountedRef.current) return

      const label = normalizeLabel(clickable)
      const buttonId = normalizeButtonId(clickable, label)
      const pagePath = window.location.pathname
      const currentPath = `${window.location.pathname}${window.location.search}`

      void (async () => {
        try {
          const idToken = await user.getIdToken()
          await fetch('/api/ui-events/page-button-click', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify({
              buttonId,
              label,
              pagePath,
              currentPath,
              sessionId: getSessionId(),
              clickedAtClient: new Date().toISOString(),
            }),
            keepalive: true,
          })
        } catch {
          // ログ記録失敗はUI操作に影響させない
        }
      })()
    }

    mainElement.addEventListener('click', onClick)

    return () => {
      mountedRef.current = false
      mainElement.removeEventListener('click', onClick)
    }
  }, [user, mainSelector])

  return null
}
