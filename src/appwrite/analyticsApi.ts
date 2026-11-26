import { Channel, Realtime } from 'appwrite';
import { account, client } from './client';
import { APPWRITE_CONFIG } from './config';

export type VisitorEventType = 'pageview' | 'heartbeat';
export type ReferrerCategory = 'direct' | 'internal' | 'search' | 'social' | 'other';
export type DeviceCategory = 'desktop' | 'tablet' | 'mobile';

export interface AnalyticsTrendPoint {
  dateKey: string;
  label: string;
  uniqueVisitors: number;
  pageViews: number;
  mobileViews: number;
  desktopViews: number;
}

export interface AnalyticsRecentActivityItem {
  path: string;
  titleHint: string;
  deviceCategory: DeviceCategory | string;
  referrerCategory: ReferrerCategory | string;
  lastSeenAt: string;
  pageViewsCount: number;
  isActive: boolean;
}

export interface AnalyticsPopularItem {
  pageKey: string;
  contentType: string;
  slug: string | null;
  title: string;
  pageViews: number;
  lastViewedAt: string;
  thumbnailFileId: string | null;
}

export interface AdminAnalyticsSummary {
  activeVisitors: number;
  uniqueVisitorsToday: number;
  pageViewsToday: number;
  totalPageViews: number;
  publishedCounts: {
    motifs: number;
    crafts: number;
    cultures: number;
    history: number;
    total: number;
  };
  deviceBreakdown: {
    desktop: number;
    tablet: number;
    mobile: number;
  };
  trends: AnalyticsTrendPoint[];
  recentActivity: AnalyticsRecentActivityItem[];
  popularContent: AnalyticsPopularItem[];
  lastUpdatedAt: string;
}

const SESSION_KEY = 'mdps_anon_session_v1';

export function getOrCreateAnonymousSessionId(): string {
  try {
    const existing = window.sessionStorage.getItem(SESSION_KEY);
    if (existing && /^[a-zA-Z0-9_-]{12,64}$/.test(existing)) {
      return existing;
    }
    const generated =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID().replace(/-/g, '')
        : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 14)}`;
    window.sessionStorage.setItem(SESSION_KEY, generated);
    return generated;
  } catch {
    return `ephem_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  }
}

export function detectDeviceCategory(): DeviceCategory {
  if (typeof window === 'undefined') return 'desktop';
  const w = window.innerWidth;
  if (w < 768) return 'mobile';
  if (w < 1024) return 'tablet';
  return 'desktop';
}

export function detectReferrerCategory(): ReferrerCategory {
  if (typeof document === 'undefined' || !document.referrer) return 'direct';
  try {
    const refUrl = new URL(document.referrer);
    if (refUrl.host === window.location.host) return 'internal';
    const host = refUrl.hostname.toLowerCase();
    if (/(google\.|bing\.com|duckduckgo\.com|yahoo\.com|ecosia\.org|yandex\.)/.test(host)) {
      return 'search';
    }
    if (/(instagram\.com|facebook\.com|fb\.com|tiktok\.com|twitter\.com|x\.com|t\.co|youtube\.com|wa\.me|whatsapp\.com|linkedin\.com)/.test(host)) {
      return 'social';
    }
    return 'other';
  } catch {
    return 'direct';
  }
}

export async function trackPublicVisitorEvent(params: {
  path: string;
  titleHint?: string;
  eventType: VisitorEventType;
}): Promise<void> {
  const cleanPath = (params.path || '/').split('?')[0].split('#')[0];
  if (cleanPath.startsWith('/admin')) return;

  const sessionId = getOrCreateAnonymousSessionId();
  const payload = {
    sessionId,
    eventType: params.eventType,
    path: cleanPath || '/',
    titleHint: (params.titleHint || '').slice(0, 140),
    referrerCategory: detectReferrerCategory(),
    deviceCategory: detectDeviceCategory(),
  };

  try {
    await fetch(
      `${APPWRITE_CONFIG.endpoint}/functions/${APPWRITE_CONFIG.publicApiFunctionId}/executions`,
      {
        method: 'POST',
        keepalive: true,
        headers: {
          'Content-Type': 'application/json',
          'X-Appwrite-Project': APPWRITE_CONFIG.projectId,
        },
        body: JSON.stringify({
          path: '/analytics/track',
          method: 'POST',
          body: JSON.stringify(payload),
        }),
      }
    );
  } catch {
    // Non-blocking visitor analytics: never interrupt browsing UX
  }
}

export async function fetchAdminAnalyticsSummary(range: 7 | 30 = 30): Promise<AdminAnalyticsSummary> {
  const jwtRes = await account.createJWT();
  if (!jwtRes?.jwt) {
    throw new Error('Sesi kurator tidak aktif. Silakan masuk kembali.');
  }

  const res = await fetch(
    `${APPWRITE_CONFIG.adminMediaGatewayUrl}/analytics/summary?range=${range}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${jwtRes.jwt}`,
        'X-Appwrite-Project': APPWRITE_CONFIG.projectId,
      },
    }
  );

  const text = await res.text();
  let data: any = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { error: text };
  }

  if (!res.ok) {
    throw Object.assign(
      new Error(data?.error || `Gagal memuat analitik pengunjung (HTTP ${res.status}).`),
      { code: res.status }
    );
  }

  return data as AdminAnalyticsSummary;
}

/**
 * Subscribe to Appwrite Realtime changes on analytics TablesDB channels (restricted to team:museum-admins).
 * Returns safe cleanup handle; degrades seamlessly to periodic polling if WebSocket is unavailable.
 */
export function subscribeAnalyticsRealtime(onChange: () => void): () => void {
  let active = true;
  let realtimeInstance: Realtime | null = null;
  let subscription: { close?: () => Promise<void>; unsubscribe?: () => Promise<void> } | null = null;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  const triggerDebounced = () => {
    if (!active) return;
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      if (active) onChange();
    }, 800);
  };

  (async () => {
    try {
      realtimeInstance = new Realtime(client);
      const dbId = APPWRITE_CONFIG.databaseId;
      const channels = [
        Channel.tablesdb(dbId).table('visitor_sessions').row().toString(),
        Channel.tablesdb(dbId).table('visitor_daily_stats').row().toString(),
        Channel.tablesdb(dbId).table('visitor_page_stats').row().toString(),
      ];
      subscription = await realtimeInstance.subscribe(channels, () => {
        triggerDebounced();
      });
    } catch {
      // Fallback polling remains active in AdminDashboardPage
    }
  })();

  return () => {
    active = false;
    if (debounceTimer) clearTimeout(debounceTimer);
    if (subscription?.unsubscribe) {
      subscription.unsubscribe().catch(() => {});
    } else if (subscription?.close) {
      subscription.close().catch(() => {});
    }
  };
}
