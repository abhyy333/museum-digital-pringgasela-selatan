import { account, client } from './client';
import { APPWRITE_CONFIG } from './config';
import { GatewayApiError } from './adminMediaApi';

const SESSION_STORAGE_KEY = 'museum_pringgasela_anon_sid';

export interface VisitorDailyPoint {
  dateKey: string;
  uniqueVisitors: number;
  pageViews: number;
  mobileViews: number;
  desktopViews: number;
}

export interface PopularContentItem {
  pageKey: string;
  contentType: string;
  slug: string | null;
  titleHint: string;
  pageViews: number;
  lastViewedAt: string;
  thumbnailFileId?: string | null;
}

export interface RecentActivityItem {
  path: string;
  pageTitle: string;
  deviceCategory: string;
  referrerCategory: string;
  lastSeenAt: string;
  isActive: boolean;
}

export interface AdminAnalyticsSummary {
  generatedAt: string;
  activeVisitors: number;
  todayUniqueVisitors: number;
  todayPageViews: number;
  totalPageViews: number;
  publishedContentCount: number;
  dailySeries: VisitorDailyPoint[];
  topPages: PopularContentItem[];
  popularContent: PopularContentItem[];
  recentActivity: RecentActivityItem[];
}

export function getOrCreateAnonymousSessionId(): string {
  try {
    const existing = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (existing && /^[a-zA-Z0-9_-]{12,64}$/.test(existing)) {
      return existing;
    }
    const fresh =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID().replace(/-/g, '')
        : `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 14)}`;
    sessionStorage.setItem(SESSION_STORAGE_KEY, fresh);
    return fresh;
  } catch {
    return `anon_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  }
}

export function detectDeviceCategory(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';
  const w = window.innerWidth;
  if (w < 640) return 'mobile';
  if (w < 1024) return 'tablet';
  return 'desktop';
}

export function detectReferrerCategory(): 'direct' | 'internal' | 'search' | 'social' | 'external' {
  if (typeof document === 'undefined' || !document.referrer) return 'direct';
  try {
    const refUrl = new URL(document.referrer);
    if (typeof window !== 'undefined' && refUrl.hostname === window.location.hostname) {
      return 'internal';
    }
    const host = refUrl.hostname.toLowerCase();
    if (/(google|bing|duckduckgo|yahoo|yandex|ecosia)\./.test(host)) {
      return 'search';
    }
    if (/(facebook|instagram|fb|l\.instagram|t\.co|twitter|x\.com|tiktok|youtube|whatsapp)/.test(host)) {
      return 'social';
    }
    return 'external';
  } catch {
    return 'direct';
  }
}

export async function sendPublicAnalyticsEvent(params: {
  eventType: 'pageview' | 'heartbeat';
  path: string;
  pageTitle?: string;
}): Promise<void> {
  if (!params.path || params.path === '/admin' || params.path.startsWith('/admin/')) {
    return;
  }

  try {
    const sessionId = getOrCreateAnonymousSessionId();
    const payload = {
      eventType: params.eventType,
      sessionId,
      path: params.path,
      pageTitle: (params.pageTitle || document.title || params.path).slice(0, 160),
      referrerCategory: detectReferrerCategory(),
      deviceCategory: detectDeviceCategory(),
    };

    const url = `${APPWRITE_CONFIG.endpoint}/functions/${APPWRITE_CONFIG.publicApiFunctionId}/executions`;
    await fetch(url, {
      method: 'POST',
      keepalive: true,
      headers: {
        'Content-Type': 'application/json',
        'X-Appwrite-Project': APPWRITE_CONFIG.projectId,
      },
      body: JSON.stringify({
        xpath: '/analytics/track',
        method: 'POST',
        body: JSON.stringify({
          path: '/analytics/track',
          method: 'POST',
          body: payload,
        }),
      }),
    });
  } catch {
    // Non-blocking: public browsing must never degrade on analytics errors
  }
}

export async function fetchAdminAnalyticsSummary(days: 7 | 30 = 30): Promise<AdminAnalyticsSummary> {
  let jwt = '';
  try {
    const jwtRes = await account.createJWT();
    jwt = jwtRes.jwt;
  } catch (err: any) {
    throw new GatewayApiError(
      err?.message || 'Sesi autentikasi berakhir. Masuk kembali untuk melihat analitik.',
      401
    );
  }

  const res = await fetch(`${APPWRITE_CONFIG.adminMediaGatewayUrl}/analytics/summary?days=${days}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${jwt}`,
      'X-Appwrite-Project': APPWRITE_CONFIG.projectId,
    },
  });

  const text = await res.text();
  let data: any = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { error: text || `HTTP ${res.status}` };
  }

  if (!res.ok) {
    throw new GatewayApiError(
      data?.error || data?.message || `Gagal memuat data analitik (HTTP ${res.status}).`,
      res.status
    );
  }

  return data as AdminAnalyticsSummary;
}

/**
 * Subscribes cleanly to Appwrite Cloud Realtime channels for visitor analytics tables
 * with debouncing so bursts trigger a single efficient summary refresh.
 */
export function subscribeToVisitorRealtime(
  onUpdate: () => void,
  onStatusChange?: (connected: boolean) => void
): () => void {
  const dbId = APPWRITE_CONFIG.databaseId;
  const channels = [
    `databases.${dbId}.tables.visitor_sessions.rows`,
    `databases.${dbId}.tables.visitor_daily_stats.rows`,
    `databases.${dbId}.collections.visitor_sessions.documents`,
    `databases.${dbId}.collections.visitor_daily_stats.documents`,
  ];

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let unsub: (() => void) | null = null;

  try {
    unsub = client.subscribe(channels, () => {
      onStatusChange?.(true);
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        onUpdate();
      }, 1500);
    });
    onStatusChange?.(true);
  } catch {
    onStatusChange?.(false);
  }

  return () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    if (typeof unsub === 'function') {
      try {
        unsub();
      } catch {}
    }
  };
}
