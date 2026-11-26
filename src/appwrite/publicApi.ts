import { APPWRITE_CONFIG } from './config';
import {
  CraftsResponse,
  CraftDetailResponse,
  MotifsResponse,
  MotifDetailResponse,
  CulturesResponse,
  CultureDetailResponse,
  HistoryResponse,
  CategoriesResponse,
  ContributorsResponse,
  SettingsResponse,
} from '../types/api';

async function invokePublicApi<T>(path: string, query: Record<string, any> = {}): Promise<T> {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query || {})) {
    if (v !== undefined && v !== null && v !== '') {
      params.set(k, String(v));
    }
  }
  const qs = params.toString();
  const fullPath = qs ? `${path}${path.includes('?') ? '&' : '?'}${qs}` : path;

  const url = `${APPWRITE_CONFIG.endpoint}/functions/${APPWRITE_CONFIG.publicApiFunctionId}/executions`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Appwrite-Project': APPWRITE_CONFIG.projectId,
    },
    body: JSON.stringify({
      path: fullPath,
      method: 'GET',
      body: JSON.stringify({ path: fullPath, method: 'GET', query }),
    }),
  });

  if (!res.ok) {
    throw new Error(`Gateway network error: HTTP ${res.status}`);
  }

  const exec = await res.json();
  if (exec.status === 'failed') {
    throw new Error(exec.errors || 'Function execution failed');
  }

  if (exec.responseStatusCode >= 400) {
    let msg = `HTTP ${exec.responseStatusCode}`;
    try {
      const parsed = JSON.parse(exec.responseBody || '{}');
      if (parsed.error) msg = parsed.error;
    } catch (e) {}
    throw new Error(msg);
  }

  try {
    return JSON.parse(exec.responseBody || '{}') as T;
  } catch (err) {
    throw new Error('Failed to parse API gateway response');
  }
}

export const publicApi = {
  // Weaving Motifs
  getMotifs: (params: { category?: string; limit?: number; offset?: number } = {}) =>
    invokePublicApi<MotifsResponse>('/motifs', params),

  getMotifBySlug: (slug: string) =>
    invokePublicApi<MotifDetailResponse>(`/motifs/${slug}`),

  // Crafts & Textiles
  getCrafts: (params: { category?: string; craftType?: string; limit?: number; offset?: number } = {}) =>
    invokePublicApi<CraftsResponse>('/crafts', params),

  getCraftBySlug: (slug: string) =>
    invokePublicApi<CraftDetailResponse>(`/crafts/${slug}`),

  // Cultures & Traditions
  getCultures: (params: { limit?: number; offset?: number } = {}) =>
    invokePublicApi<CulturesResponse>('/cultures', params),

  getCultureBySlug: (slug: string) =>
    invokePublicApi<CultureDetailResponse>(`/cultures/${slug}`),

  // Village History
  getHistory: () =>
    invokePublicApi<HistoryResponse>('/history'),

  // Taxonomies & Contributors
  getCategories: (type?: string) =>
    invokePublicApi<CategoriesResponse>('/categories', type ? { type } : {}),

  getContributors: (type?: string) =>
    invokePublicApi<ContributorsResponse>('/contributors', type ? { type } : {}),

  // Public Settings
  getSettings: () =>
    invokePublicApi<SettingsResponse>('/settings'),
};
