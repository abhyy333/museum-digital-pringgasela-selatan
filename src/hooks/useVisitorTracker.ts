import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPublicVisitorEvent } from '../appwrite/analyticsApi';

const HEARTBEAT_INTERVAL_MS = 40_000;

/**
 * Tracks public museum pageviews and lightweight visibility-gated heartbeats.
 * Never tracks /admin routes and stores zero personal data or IP addresses.
 */
export function useVisitorTracker(): void {
  const location = useLocation();
  const lastHeartbeatAtRef = useRef<number>(0);

  useEffect(() => {
    const cleanPath = location.pathname || '/';
    if (cleanPath.startsWith('/admin')) return;

    const timer = setTimeout(() => {
      lastHeartbeatAtRef.current = Date.now();
      trackPublicVisitorEvent({
        path: cleanPath,
        titleHint: document.title,
        eventType: 'pageview',
      });
    }, 350);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  useEffect(() => {
    const cleanPath = location.pathname || '/';
    if (cleanPath.startsWith('/admin')) return;

    const sendHeartbeat = () => {
      if (document.visibilityState !== 'visible') return;
      const now = Date.now();
      if (now - lastHeartbeatAtRef.current < 25_000) return;
      lastHeartbeatAtRef.current = now;
      trackPublicVisitorEvent({
        path: cleanPath,
        titleHint: document.title,
        eventType: 'heartbeat',
      });
    };

    const interval = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        sendHeartbeat();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [location.pathname]);
}
