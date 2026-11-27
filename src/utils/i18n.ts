import { useEffect } from 'react';
import { Locale } from '../types/schema';

/**
 * Selects the best available translation record cleanly:
 * active locale -> Indonesian fallback -> first available entry.
 */
export function pickTranslation<T extends { locale?: string }>(
  translations: T[] | undefined | null,
  locale: Locale
): T | undefined {
  if (!Array.isArray(translations) || translations.length === 0) return undefined;
  return (
    translations.find((tr) => tr.locale === locale) ||
    translations.find((tr) => tr.locale === 'id') ||
    translations[0]
  );
}

/**
 * Updates document <title>, meta description, and optional robots directive cleanly per route.
 */
export function useDocumentTitle(
  title: string,
  options?: { description?: string; noindex?: boolean }
) {
  const description = options?.description;
  const noindex = Boolean(options?.noindex);

  useEffect(() => {
    document.title = title;

    if (description) {
      const descEl = document.querySelector('meta[name="description"]');
      if (descEl) descEl.setAttribute('content', description);
    }

    let robotsEl = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    if (noindex) {
      if (!robotsEl) {
        robotsEl = document.createElement('meta');
        robotsEl.name = 'robots';
        document.head.appendChild(robotsEl);
      }
      robotsEl.content = 'noindex, nofollow';
    } else if (robotsEl) {
      robotsEl.content = 'index, follow';
    }
  }, [title, description, noindex]);
}
