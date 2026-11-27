import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { sendPublicAnalyticsEvent } from '../appwrite/analyticsApi';

const HEARTBEAT_INTERVAL_MS = 45_000;
const SAME_PATH_DEDUPE_MS = 15_000;

/**
 * Lightweight privacy-safe visitor tracker strictly for public routes.
 * Sends deduplicated pageview pings and 45s visibility-aware heartbeats
 * through museum-public-api (never writes directly to TablesDB).
 */
export function useVisitorTracker(): void {
  const location = useLocation();
  const lastTrackedRef = useRef<{ path: string; ts: number }>({ path: '', ts: 0 });
  const currentPathRef = useRef<string>(location.pathname);
  currentPathRef.current = location.pathname;

  useEffect(() => {
    const pathname = location.pathname;
    if (!pathname || pathname === '/admin' || pathname.startsWith('/admin/')) {
      return;
    }

    const now = Date.now();
    if (
      lastTrackedRef.current.path === pathname &&
      now - lastTrackedRef.current.ts < SAME_PATH_DEDUPE_MS
    ) {
      return;
    }

    // Brief 350ms delay so route useDocumentTitle settles cleanly before recording pageTitle
    const timer = setTimeout(() => {
      lastTrackedRef.current = { path: pathname, ts: Date.now() };
      void sendPublicAnalyticsEvent({
        eventType: 'pageview',
        path: pathname,
        pageTitle: document.title,
      });
    }, 350);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  useEffect(() => {
    const interval = setInterval(() => {
      const path = currentPathRef.current;
      if (
        document.visibilityState === 'visible' &&
        path &&
        path !== '/admin' &&
        !path.startsWith('/admin/')
      ) {
        void sendPublicAnalyticsEvent({
          eventType: 'heartbeat',
          path,
          pageTitle: document.title,
        });
      }
    }, HEARTBEAT_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);
}
