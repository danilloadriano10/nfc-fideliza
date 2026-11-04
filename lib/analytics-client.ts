'use client'

import { AnalyticsEventType } from '@/types/platform'

// Session storage key to avoid duplicate PAGE_VIEW events on immediate page refreshes
const PAGE_VIEW_SESSION_KEY = 'diretolink_last_pageview_'

/**
 * Tracks public page interaction events asynchronously.
 * Uses navigator.sendBeacon when available so clicks navigating away (e.g. WhatsApp, Maps)
 * complete reliably without blocking or slowing the user down.
 */
export function trackPublicEvent(
  companyId: string,
  eventType: AnalyticsEventType,
  metadata?: Record<string, unknown>
): void {
  if (!companyId || typeof window === 'undefined') return

  // Deduplicate rapid consecutive PAGE_VIEW events for the same company in the same tab session (within 5 minutes)
  if (eventType === 'PAGE_VIEW') {
    try {
      const sessionKey = `${PAGE_VIEW_SESSION_KEY}${companyId}`
      const lastRecorded = sessionStorage.getItem(sessionKey)
      const now = Date.now()
      if (lastRecorded && now - Number(lastRecorded) < 5 * 60 * 1000) {
        return
      }
      sessionStorage.setItem(sessionKey, String(now))
    } catch {
      // sessionStorage unavailable
    }
  }

  const payload = JSON.stringify({
    companyId: companyId.trim(),
    eventType,
    metadata,
    timestamp: new Date().toISOString(),
  })

  try {
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([payload], { type: 'application/json' })
      const sent = navigator.sendBeacon('/api/analytics/track', blob)
      if (sent) return
    }
  } catch {
    // fallback to fetch
  }

  try {
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    }).catch(() => {
      // silent
    })
  } catch {
    // silent
  }
}
