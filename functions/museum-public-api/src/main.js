import crypto from 'node:crypto';
import { Client, TablesDB, Storage, Query, ID } from 'node-appwrite';

const DB_ID = process.env.DATABASE_ID || 'museum_digital';
const BUCKET_ID = process.env.STORAGE_BUCKET_ID || 'museum-media';
const ENDPOINT = process.env.APPWRITE_ENDPOINT || 'https://sgp.cloud.appwrite.io/v1';
const PROJECT_ID = process.env.APPWRITE_PROJECT_ID || '6affdaa0003c416ecdb0';

const ALLOWED_ANALYTICS_ROOTS = new Set(['', 'motifs', 'crafts', 'cultures', 'curatorial', 'history', 'about']);
const ALLOWED_REFERRERS = new Set(['direct', 'internal', 'search', 'social', 'other']);
const ALLOWED_DEVICES = new Set(['desktop', 'tablet', 'mobile']);
const analyticsRateBuckets = new Map();
const recentPageviewCache = new Map();
const SESSION_RATE_SALT = crypto.randomBytes(16).toString('hex');

function getWitaDateKey(nowMs = Date.now()) {
  const wita = new Date(nowMs + 8 * 60 * 60 * 1000);
  return wita.toISOString().slice(0, 10);
}

function consumeAnalyticsRate(key, maxHits, windowMs = 60_000, nowMs = Date.now()) {
  if (analyticsRateBuckets.size > 3000) {
    for (const [k, stamps] of analyticsRateBuckets.entries()) {
      if (stamps.length === 0 || nowMs - stamps[stamps.length - 1] > windowMs) {
        analyticsRateBuckets.delete(k);
      }
    }
  }
  const cutoff = nowMs - windowMs;
  const active = (analyticsRateBuckets.get(key) || []).filter((t) => t > cutoff);
  if (active.length >= maxHits) {
    analyticsRateBuckets.set(key, active);
    return false;
  }
  active.push(nowMs);
  analyticsRateBuckets.set(key, active);
  return true;
}

function sanitizeTrackingPayload(raw) {
  if (!raw || typeof raw !== 'object') return { ok: false, error: 'Payload analytics tidak valid.' };
  const sessionId = String(raw.sessionId || '').trim();
  if (!/^[a-zA-Z0-9_-]{12,64}$/.test(sessionId)) {
    return { ok: false, error: 'Identifier sesi anonim tidak valid.' };
  }
  const eventType = raw.eventType === 'heartbeat' ? 'heartbeat' : raw.eventType === 'pageview' ? 'pageview' : null;
  if (!eventType) {
    return { ok: false, error: 'Jenis event analytics harus pageview atau heartbeat.' };
  }

  let rawPath = String(raw.path || '/').split('?')[0].split('#')[0].trim();
  if (!rawPath.startsWith('/')) rawPath = `/${rawPath}`;
  if (rawPath.length > 1) rawPath = rawPath.replace(/\/+$/, '');
  if (rawPath.length > 180 || /[<>"{}\\]/.test(rawPath)) {
    return { ok: false, error: 'Path halaman tidak valid.' };
  }

  const segs = rawPath.replace(/^\/+/, '').split('/').filter(Boolean);
  const rootSeg = segs[0] || '';
  if (!ALLOWED_ANALYTICS_ROOTS.has(rootSeg)) {
    return { ok: false, error: 'Path tidak termasuk rute publik museum yang dilacak.' };
  }
  const slug = segs[1] && /^[a-zA-Z0-9_-]{1,128}$/.test(segs[1]) ? segs[1] : null;
  const contentTypeMap = {
    '': 'home',
    motifs: slug ? 'motif' : 'catalog',
    crafts: slug ? 'craft' : 'catalog',
    cultures: slug ? 'culture' : 'catalog',
    curatorial: 'curatorial',
    history: 'history',
    about: 'about',
  };
  const contentType = contentTypeMap[rootSeg] || 'catalog';

  const referrerCategory = ALLOWED_REFERRERS.has(raw.referrerCategory) ? raw.referrerCategory : 'direct';
  const deviceCategory = ALLOWED_DEVICES.has(raw.deviceCategory) ? raw.deviceCategory : 'desktop';
  const titleHint = String(raw.titleHint || '').replace(/[<>\r\n\t]/g, ' ').trim().slice(0, 140) || null;

  return {
    ok: true,
    data: {
      sessionId,
      eventType,
      path: rawPath || '/',
      contentType,
      slug,
      titleHint,
      referrerCategory,
      deviceCategory,
    },
  };
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Appwrite-Project',
  'Content-Type': 'application/json',
};

// Response Field Whitelists — Never expose createdById, reviewedById, audit notes
const WHITELISTS = {
  craft: ['$id', '$createdAt', '$updatedAt', 'slug', 'categoryId', 'craftType', 'isFeatured', 'contributorId'],
  craft_translation: ['craftId', 'locale', 'title', 'summary', 'technique', 'materials', 'description', 'culturalMeaning'],
  motif: ['$id', '$createdAt', '$updatedAt', 'slug', 'codeName', 'categoryId', 'isFeatured', 'contributorId', 'primaryCraftId'],
  motif_translation: ['motifId', 'locale', 'name', 'visualDescription', 'philosophy', 'technique', 'historicalUsage', 'originStory'],
  culture: ['$id', '$createdAt', '$updatedAt', 'slug', 'categoryId', 'periodicity', 'isFeatured', 'contributorId'],
  culture_translation: ['cultureId', 'locale', 'title', 'summary', 'description', 'ritualProcedure', 'spiritualValue'],
  history: ['$id', '$createdAt', '$updatedAt', 'slug', 'startYear', 'endYear', 'sortOrder'],
  history_translation: ['historyId', 'locale', 'eraTitle', 'narrative', 'keyFigures', 'legacyToday'],
  category: ['$id', 'slug', 'type', 'nameId', 'nameEn', 'parentId', 'sortOrder'],
  contributor: ['$id', 'slug', 'name', 'type', 'dusun', 'experienceYears', 'photoFileId', 'bioId', 'bioEn'],
  media_asset: ['$id', 'fileId', 'bucketId', 'mediaType', 'mimeType', 'fileSizeBytes', 'width', 'height', 'durationSeconds', 'altTextId', 'altTextEn', 'captionId', 'captionEn', 'photographer'],
  setting: ['settingKey', 'settingValue', 'description'],
};

function filterObject(obj, allowedKeys) {
  if (!obj || typeof obj !== 'object') return {};
  const filtered = {};
  for (const k of allowedKeys) {
    if (obj[k] !== undefined) {
      filtered[k] = obj[k];
    }
  }
  return filtered;
}

const QUARANTINED_PUBLIC_MIMES = new Set([
  'application/zip',
  'application/x-zip-compressed',
  'image/svg+xml',
]);
const ANTIVIRUS_SCAN_CEILING = 20_000_000;

function isPublicStorageFile(fileMeta) {
  if (!fileMeta) return false;
  if (typeof fileMeta.sizeOriginal === 'number' && fileMeta.sizeOriginal > ANTIVIRUS_SCAN_CEILING) {
    return false;
  }
  if (
    typeof fileMeta.chunksTotal === 'number' &&
    typeof fileMeta.chunksUploaded === 'number' &&
    fileMeta.chunksUploaded < fileMeta.chunksTotal
  ) {
    return false;
  }
  const mime = String(fileMeta.mimeType || '').split(';')[0].trim().toLowerCase();
  if (QUARANTINED_PUBLIC_MIMES.has(mime)) return false;

  const perms = fileMeta.$permissions || [];
  return perms.some((p) => typeof p === 'string' && p.trim() === 'read("any")');
}

/**
 * Resolves junction media rows to safe public media objects, strictly filtering out
 * private files, orphan Storage files without media_assets metadata, and missing files.
 */
async function resolvePublicMedia(tablesDB, storage, junctionRows, extraMapper) {
  const resolved = [];
  for (const rel of junctionRows || []) {
    try {
      const asset = await tablesDB.getRow(DB_ID, 'media_assets', rel.mediaAssetId);
      if (asset.bucketId && asset.bucketId !== BUCKET_ID) continue;
      const storageId = asset.fileId || rel.mediaAssetId;

      // Verify file exists in Storage AND has explicit read("any") permission
      const fileMeta = await storage.getFile(BUCKET_ID, storageId);
      if (!isPublicStorageFile(fileMeta)) continue;

      const cleanAsset = filterObject(asset, WHITELISTS.media_asset);
      resolved.push({
        ...cleanAsset,
        mediaAssetId: rel.mediaAssetId,
        fileId: storageId,
        sortOrder: rel.sortOrder ?? 0,
        ...extraMapper(rel),
      });
    } catch (e) {
      // Omit missing metadata, deleted storage files, or private media without failing API response
    }
  }
  return resolved;
}

/**
 * Sanitizes contributor record and ensures photoFileId is ONLY exposed if it has
 * valid media_assets metadata AND explicit public read("any") in Storage.
 */
async function sanitizeContributor(tablesDB, storage, rawContrib) {
  if (!rawContrib) return null;
  const clean = filterObject(rawContrib, WHITELISTS.contributor);
  if (clean.photoFileId) {
    try {
      let hasMetadata = false;
      try {
        await tablesDB.getRow(DB_ID, 'media_assets', clean.photoFileId);
        hasMetadata = true;
      } catch {
        const match = await tablesDB.listRows(DB_ID, 'media_assets', [
          Query.equal('fileId', clean.photoFileId),
          Query.limit(1),
        ]);
        hasMetadata = Boolean(match.rows && match.rows.length > 0);
      }
      if (!hasMetadata) {
        clean.photoFileId = null;
      } else {
        const fileMeta = await storage.getFile(BUCKET_ID, clean.photoFileId);
        if (!isPublicStorageFile(fileMeta)) {
          clean.photoFileId = null;
        }
      }
    } catch {
      clean.photoFileId = null;
    }
  }
  return clean;
}

export default async ({ req, res, log, error }) => {
  if (req.method === 'OPTIONS') {
    return res.text('', 200, CORS_HEADERS);
  }

  let path = (req.path || '/').trim();
  let method = (req.method || 'GET').toUpperCase();
  let query = { ...(req.query || {}) };
  let rawBodyObj = null;

  try {
    if (req.body && typeof req.body === 'object') {
      rawBodyObj = req.body;
    } else if (typeof req.body === 'string' && req.body.trim().startsWith('{')) {
      rawBodyObj = JSON.parse(req.body);
    }
  } catch {
    rawBodyObj = null;
  }

  if (rawBodyObj) {
    // Only treat rawBodyObj.path / rawBodyObj.method as RPC routing overrides when NOT an analytics event payload
    if (typeof rawBodyObj.sessionId !== 'string') {
      if (typeof rawBodyObj.path === 'string' && rawBodyObj.path) path = rawBodyObj.path;
      if (typeof rawBodyObj.method === 'string' && rawBodyObj.method) method = rawBodyObj.method.toUpperCase();
      if (rawBodyObj.query && typeof rawBodyObj.query === 'object') {
        query = { ...query, ...rawBodyObj.query };
      }
    }
    // Appwrite /executions forwards inner JSON body string if present
    if (typeof rawBodyObj.body === 'string' && rawBodyObj.body.trim().startsWith('{')) {
      try {
        const inner = JSON.parse(rawBodyObj.body);
        if (inner && typeof inner === 'object') rawBodyObj = inner;
      } catch {}
    }
  }

  const [rawPathname, rawQs] = path.split('?');
  if (rawQs) {
    const qsParams = new URLSearchParams(rawQs);
    for (const [k, v] of qsParams.entries()) {
      if (query[k] === undefined) query[k] = v;
    }
  }
  const cleanPath = rawPathname.replace(/^\/+|\/+$/g, '');
  const segments = cleanPath ? cleanPath.split('/') : [];
  const root = segments[0] || 'health';
  const param = segments[1] || null;

  log(`[Public API] ${method} /${cleanPath} (root=${root}, param=${param})`);

  const client = new Client()
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID);

  const apiKey = req.headers['x-appwrite-key'] || process.env.APPWRITE_API_KEY;
  if (apiKey) {
    client.setKey(apiKey);
  }

  const tablesDB = new TablesDB(client);
  const storage = new Storage(client);

  try {
    // ------------------------------------------------------------------------
    // HEALTH CHECK & API ROOT
    // ------------------------------------------------------------------------
    if (root === 'health' || root === '') {
      return res.json({
        status: 'ok',
        service: 'Museum Digital Pringgasela Selatan Public Content API',
        version: '1.4.0',
        environment: 'production',
        timestamp: new Date().toISOString(),
        endpoints: [
          '/crafts',
          '/crafts/:slug',
          '/motifs',
          '/motifs/:slug',
          '/cultures',
          '/cultures/:slug',
          '/history',
          '/categories',
          '/contributors',
          '/settings',
          'POST /analytics/track',
        ],
      }, 200, CORS_HEADERS);
    }

    // ------------------------------------------------------------------------
    // 0. PRIVACY-FIRST ANONYMOUS ANALYTICS INGESTION (WRITE-ONLY FROM PUBLIC)
    // ------------------------------------------------------------------------
    if (root === 'analytics') {
      if (param !== 'track' || method !== 'POST') {
        return res.json(
          { error: 'Data analitik bersifat privat dan hanya dapat dibaca kurator terotentikasi.' },
          403,
          CORS_HEADERS
        );
      }

      const analyticsInput =
        rawBodyObj && typeof rawBodyObj.sessionId === 'string'
          ? rawBodyObj
          : query;
      const validated = sanitizeTrackingPayload(analyticsInput);
      if (!validated.ok) {
        return res.json({ error: validated.error }, 400, CORS_HEADERS);
      }

      const ev = validated.data;
      const clientIp =
        String(req.headers['x-forwarded-for'] || req.headers['cf-connecting-ip'] || '')
          .split(',')[0]
          .trim() || 'unknown';
      const transientIpKey = crypto.createHash('sha256').update(`${SESSION_RATE_SALT}:${clientIp}`).digest('hex').slice(0, 16);

      if (
        !consumeAnalyticsRate(`sess:${ev.sessionId}`, 25, 60_000) ||
        !consumeAnalyticsRate(`ip:${transientIpKey}`, 90, 60_000)
      ) {
        return res.json({ error: 'Terlalu banyak event analitik dari sesi ini.' }, 429, CORS_HEADERS);
      }

      const nowMs = Date.now();
      const nowIso = new Date(nowMs).toISOString();
      const todayKey = getWitaDateKey(nowMs);

      let isDedupedPageview = false;
      if (ev.eventType === 'pageview') {
        const dedupeKey = `${ev.sessionId}:${ev.path}`;
        const prevMs = recentPageviewCache.get(dedupeKey) || 0;
        if (nowMs - prevMs < 45_000) {
          isDedupedPageview = true;
        } else {
          if (recentPageviewCache.size > 4000) {
            for (const [k, ts] of recentPageviewCache.entries()) {
              if (nowMs - ts > 60_000) recentPageviewCache.delete(k);
            }
          }
          recentPageviewCache.set(dedupeKey, nowMs);
        }
      }

      const shouldCountPageview = ev.eventType === 'pageview' && !isDedupedPageview;
      let isNewUniqueToday = false;

      const existingSess = await tablesDB.listRows(DB_ID, 'visitor_sessions', [
        Query.equal('sessionId', ev.sessionId),
        Query.limit(1),
      ]);
      const sessRow = existingSess.rows?.[0];

      if (!sessRow) {
        isNewUniqueToday = true;
        await tablesDB.createRow(DB_ID, 'visitor_sessions', ID.unique(), {
          sessionId: ev.sessionId,
          currentPath: ev.path,
          pageTitle: ev.titleHint,
          referrerCategory: ev.referrerCategory,
          deviceCategory: ev.deviceCategory,
          lastSeenAt: nowIso,
          startedDate: todayKey,
          pageViewsCount: shouldCountPageview ? 1 : 0,
        });
      } else {
        if (sessRow.startedDate !== todayKey) {
          isNewUniqueToday = true;
        }
        await tablesDB.updateRow(DB_ID, 'visitor_sessions', sessRow.$id, {
          currentPath: ev.path,
          ...(ev.titleHint ? { pageTitle: ev.titleHint } : {}),
          deviceCategory: ev.deviceCategory,
          referrerCategory: ev.referrerCategory,
          lastSeenAt: nowIso,
          startedDate: todayKey,
          pageViewsCount: (sessRow.pageViewsCount || 0) + (shouldCountPageview ? 1 : 0),
        });
      }

      if (isNewUniqueToday || shouldCountPageview) {
        const dailyRes = await tablesDB.listRows(DB_ID, 'visitor_daily_stats', [
          Query.equal('dateKey', todayKey),
          Query.limit(1),
        ]);
        const dailyRow = dailyRes.rows?.[0];
        const mobileInc = shouldCountPageview && ev.deviceCategory === 'mobile' ? 1 : 0;
        const desktopInc = shouldCountPageview && ev.deviceCategory !== 'mobile' ? 1 : 0;

        if (!dailyRow) {
          await tablesDB.createRow(DB_ID, 'visitor_daily_stats', ID.unique(), {
            dateKey: todayKey,
            uniqueVisitors: isNewUniqueToday ? 1 : 0,
            pageViews: shouldCountPageview ? 1 : 0,
            mobileViews: mobileInc,
            desktopViews: desktopInc,
          });
        } else {
          await tablesDB.updateRow(DB_ID, 'visitor_daily_stats', dailyRow.$id, {
            uniqueVisitors: (dailyRow.uniqueVisitors || 0) + (isNewUniqueToday ? 1 : 0),
            pageViews: (dailyRow.pageViews || 0) + (shouldCountPageview ? 1 : 0),
            mobileViews: (dailyRow.mobileViews || 0) + mobileInc,
            desktopViews: (dailyRow.desktopViews || 0) + desktopInc,
          });
        }
      }

      if (shouldCountPageview) {
        const pageRes = await tablesDB.listRows(DB_ID, 'visitor_page_stats', [
          Query.equal('pageKey', ev.path),
          Query.limit(1),
        ]);
        const pageRow = pageRes.rows?.[0];
        if (!pageRow) {
          await tablesDB.createRow(DB_ID, 'visitor_page_stats', ID.unique(), {
            pageKey: ev.path,
            contentType: ev.contentType,
            slug: ev.slug,
            titleHint: ev.titleHint,
            pageViews: 1,
            lastViewedAt: nowIso,
          });
        } else {
          await tablesDB.updateRow(DB_ID, 'visitor_page_stats', pageRow.$id, {
            pageViews: (pageRow.pageViews || 0) + 1,
            lastViewedAt: nowIso,
            ...(ev.titleHint ? { titleHint: ev.titleHint } : {}),
          });
        }

        // Bounded session retention cleanup (~5% opportunistic pass for sessions stale > 48 hours)
        if (Math.random() < 0.05) {
          const cutoffIso = new Date(nowMs - 48 * 60 * 60 * 1000).toISOString();
          const stale = await tablesDB.listRows(DB_ID, 'visitor_sessions', [
            Query.lessThan('lastSeenAt', cutoffIso),
            Query.limit(15),
          ]).catch(() => ({ rows: [] }));
          for (const oldRow of stale.rows || []) {
            await tablesDB.deleteRow(DB_ID, 'visitor_sessions', oldRow.$id).catch(() => {});
          }
        }
      }

      return res.json(
        { ok: true, counted: shouldCountPageview, deduped: isDedupedPageview },
        isDedupedPageview ? 202 : 200,
        CORS_HEADERS
      );
    }

    // ------------------------------------------------------------------------
    // 1. CRAFTS
    // ------------------------------------------------------------------------
    if (root === 'crafts') {
      if (param) {
        const craftRes = await tablesDB.listRows(DB_ID, 'crafts', [
          Query.equal('slug', param),
          Query.equal('status', 'published'),
          Query.limit(1),
        ]);

        if (!craftRes.rows || craftRes.rows.length === 0) {
          return res.json({ error: 'Craft not found or not published' }, 404, CORS_HEADERS);
        }

        const craft = filterObject(craftRes.rows[0], WHITELISTS.craft);

        const transRes = await tablesDB.listRows(DB_ID, 'craft_translations', [
          Query.equal('craftId', craft.$id),
        ]);
        craft.translations = (transRes.rows || []).map((r) => filterObject(r, WHITELISTS.craft_translation));

        if (craft.contributorId) {
          try {
            const contribRes = await tablesDB.getRow(DB_ID, 'contributors', craft.contributorId);
            craft.contributor = await sanitizeContributor(tablesDB, storage, contribRes);
          } catch (e) {
            craft.contributor = null;
          }
        }

        const mediaRelRes = await tablesDB.listRows(DB_ID, 'craft_media', [
          Query.equal('craftId', craft.$id),
          Query.orderAsc('sortOrder'),
        ]);
        craft.media = await resolvePublicMedia(tablesDB, storage, mediaRelRes.rows, (r) => ({ role: r.role }));

        return res.json({ craft }, 200, CORS_HEADERS);
      } else {
        const limit = Math.min(Math.max(parseInt(query.limit) || 20, 1), 50);
        const offset = Math.max(parseInt(query.offset) || 0, 0);

        const queries = [
          Query.equal('status', 'published'),
          Query.limit(limit),
          Query.offset(offset),
          Query.orderDesc('$createdAt'),
        ];

        if (query.category) queries.push(Query.equal('categoryId', query.category));
        if (query.craftType) queries.push(Query.equal('craftType', query.craftType));

        const listRes = await tablesDB.listRows(DB_ID, 'crafts', queries);
        const crafts = [];

        for (const row of listRes.rows || []) {
          const item = filterObject(row, WHITELISTS.craft);
          const [trans, mediaRel] = await Promise.all([
            tablesDB.listRows(DB_ID, 'craft_translations', [Query.equal('craftId', item.$id)]),
            tablesDB.listRows(DB_ID, 'craft_media', [Query.equal('craftId', item.$id), Query.orderAsc('sortOrder'), Query.limit(20)]),
          ]);
          item.translations = (trans.rows || []).map((t) => filterObject(t, WHITELISTS.craft_translation));
          item.media = await resolvePublicMedia(tablesDB, storage, mediaRel.rows, (r) => ({ role: r.role }));
          crafts.push(item);
        }

        return res.json({
          total: listRes.total,
          limit,
          offset,
          items: crafts,
        }, 200, CORS_HEADERS);
      }
    }

    // ------------------------------------------------------------------------
    // 2. WEAVING MOTIFS
    // ------------------------------------------------------------------------
    if (root === 'motifs') {
      if (param) {
        const motifRes = await tablesDB.listRows(DB_ID, 'weaving_motifs', [
          Query.equal('slug', param),
          Query.equal('status', 'published'),
          Query.limit(1),
        ]);

        if (!motifRes.rows || motifRes.rows.length === 0) {
          return res.json({ error: 'Motif not found or not published' }, 404, CORS_HEADERS);
        }

        const motif = filterObject(motifRes.rows[0], WHITELISTS.motif);

        const transRes = await tablesDB.listRows(DB_ID, 'motif_translations', [
          Query.equal('motifId', motif.$id),
        ]);
        motif.translations = (transRes.rows || []).map((r) => filterObject(r, WHITELISTS.motif_translation));

        if (motif.contributorId) {
          try {
            const contribRes = await tablesDB.getRow(DB_ID, 'contributors', motif.contributorId);
            motif.contributor = await sanitizeContributor(tablesDB, storage, contribRes);
          } catch (e) {
            motif.contributor = null;
          }
        }

        const mediaRel = await tablesDB.listRows(DB_ID, 'motif_media', [
          Query.equal('motifId', motif.$id),
          Query.orderAsc('sortOrder'),
        ]);
        motif.media = await resolvePublicMedia(tablesDB, storage, mediaRel.rows, (r) => ({ isPatternDiagram: r.isPatternDiagram }));

        return res.json({ motif }, 200, CORS_HEADERS);
      } else {
        const limit = Math.min(Math.max(parseInt(query.limit) || 20, 1), 50);
        const offset = Math.max(parseInt(query.offset) || 0, 0);

        const queries = [
          Query.equal('status', 'published'),
          Query.limit(limit),
          Query.offset(offset),
          Query.orderDesc('$createdAt'),
        ];

        if (query.category) queries.push(Query.equal('categoryId', query.category));

        const listRes = await tablesDB.listRows(DB_ID, 'weaving_motifs', queries);
        const motifs = [];

        for (const row of listRes.rows || []) {
          const item = filterObject(row, WHITELISTS.motif);
          const [trans, mediaRel] = await Promise.all([
            tablesDB.listRows(DB_ID, 'motif_translations', [Query.equal('motifId', item.$id)]),
            tablesDB.listRows(DB_ID, 'motif_media', [Query.equal('motifId', item.$id), Query.orderAsc('sortOrder'), Query.limit(20)]),
          ]);
          item.translations = (trans.rows || []).map((t) => filterObject(t, WHITELISTS.motif_translation));
          item.media = await resolvePublicMedia(tablesDB, storage, mediaRel.rows, (r) => ({ isPatternDiagram: r.isPatternDiagram }));
          motifs.push(item);
        }

        return res.json({
          total: listRes.total,
          limit,
          offset,
          items: motifs,
        }, 200, CORS_HEADERS);
      }
    }

    // ------------------------------------------------------------------------
    // 3. CULTURES
    // ------------------------------------------------------------------------
    if (root === 'cultures') {
      if (param) {
        const cultRes = await tablesDB.listRows(DB_ID, 'cultures', [
          Query.equal('slug', param),
          Query.equal('status', 'published'),
          Query.limit(1),
        ]);

        if (!cultRes.rows || cultRes.rows.length === 0) {
          return res.json({ error: 'Cultural heritage item not found or not published' }, 404, CORS_HEADERS);
        }

        const culture = filterObject(cultRes.rows[0], WHITELISTS.culture);

        const transRes = await tablesDB.listRows(DB_ID, 'culture_translations', [
          Query.equal('cultureId', culture.$id),
        ]);
        culture.translations = (transRes.rows || []).map((r) => filterObject(r, WHITELISTS.culture_translation));

        if (culture.contributorId) {
          try {
            const contribRes = await tablesDB.getRow(DB_ID, 'contributors', culture.contributorId);
            culture.contributor = await sanitizeContributor(tablesDB, storage, contribRes);
          } catch (e) {
            culture.contributor = null;
          }
        }

        const mediaRel = await tablesDB.listRows(DB_ID, 'culture_media', [
          Query.equal('cultureId', culture.$id),
          Query.orderAsc('sortOrder'),
        ]);
        culture.media = await resolvePublicMedia(tablesDB, storage, mediaRel.rows, (r) => ({ isAudioChant: r.isAudioChant }));

        return res.json({ culture }, 200, CORS_HEADERS);
      } else {
        const limit = Math.min(Math.max(parseInt(query.limit) || 20, 1), 50);
        const offset = Math.max(parseInt(query.offset) || 0, 0);

        const queries = [
          Query.equal('status', 'published'),
          Query.limit(limit),
          Query.offset(offset),
          Query.orderDesc('$createdAt'),
        ];

        const listRes = await tablesDB.listRows(DB_ID, 'cultures', queries);
        const cultures = [];

        for (const row of listRes.rows || []) {
          const item = filterObject(row, WHITELISTS.culture);
          const [trans, mediaRel] = await Promise.all([
            tablesDB.listRows(DB_ID, 'culture_translations', [Query.equal('cultureId', item.$id)]),
            tablesDB.listRows(DB_ID, 'culture_media', [Query.equal('cultureId', item.$id), Query.orderAsc('sortOrder'), Query.limit(20)]),
          ]);
          item.translations = (trans.rows || []).map((t) => filterObject(t, WHITELISTS.culture_translation));
          item.media = await resolvePublicMedia(tablesDB, storage, mediaRel.rows, (r) => ({ isAudioChant: r.isAudioChant }));
          cultures.push(item);
        }

        return res.json({
          total: listRes.total,
          limit,
          offset,
          items: cultures,
        }, 200, CORS_HEADERS);
      }
    }

    // ------------------------------------------------------------------------
    // 4. VILLAGE HISTORY
    // ------------------------------------------------------------------------
    if (root === 'history') {
      const listRes = await tablesDB.listRows(DB_ID, 'village_history', [
        Query.equal('status', 'published'),
        Query.orderAsc('sortOrder'),
        Query.limit(50),
      ]);

      const eras = [];
      for (const row of listRes.rows || []) {
        const item = filterObject(row, WHITELISTS.history);
        const trans = await tablesDB.listRows(DB_ID, 'history_translations', [
          Query.equal('historyId', item.$id),
        ]);
        item.translations = (trans.rows || []).map((t) => filterObject(t, WHITELISTS.history_translation));
        eras.push(item);
      }

      return res.json({
        total: listRes.total,
        eras,
      }, 200, CORS_HEADERS);
    }

    // ------------------------------------------------------------------------
    // 5. CATEGORIES
    // ------------------------------------------------------------------------
    if (root === 'categories') {
      const queries = [Query.orderAsc('sortOrder'), Query.limit(100)];
      if (query.type) {
        queries.push(Query.equal('type', query.type));
      }
      const listRes = await tablesDB.listRows(DB_ID, 'categories', queries);
      const items = (listRes.rows || []).map((r) => filterObject(r, WHITELISTS.category));

      return res.json({
        total: listRes.total,
        categories: items,
      }, 200, CORS_HEADERS);
    }

    // ------------------------------------------------------------------------
    // 6. CONTRIBUTORS
    // ------------------------------------------------------------------------
    if (root === 'contributors') {
      const queries = [Query.limit(50), Query.orderAsc('name')];
      if (query.type) {
        queries.push(Query.equal('type', query.type));
      }
      const listRes = await tablesDB.listRows(DB_ID, 'contributors', queries);
      const items = await Promise.all(
        (listRes.rows || []).map((r) => sanitizeContributor(tablesDB, storage, r))
      );

      return res.json({
        total: listRes.total,
        contributors: items,
      }, 200, CORS_HEADERS);
    }

    // ------------------------------------------------------------------------
    // 7. MUSEUM SETTINGS (PUBLIC KEYS WHITELIST ONLY)
    // ------------------------------------------------------------------------
    if (root === 'settings') {
      const listRes = await tablesDB.listRows(DB_ID, 'museum_settings', [
        Query.limit(50),
      ]);

      const publicKeys = [
        'museum_name',
        'museum_description_id',
        'museum_description_en',
        'village_address',
        'contact_email',
        'contact_phone',
        'opening_hours',
        'social_media',
        'featured_motifs',
      ];

      const settings = {};
      for (const row of listRes.rows || []) {
        if (publicKeys.includes(row.settingKey)) {
          settings[row.settingKey] = row.settingValue;
        }
      }

      return res.json({ settings }, 200, CORS_HEADERS);
    }

    return res.json({
      error: `Endpoint '/${cleanPath}' not found on Museum Public API`,
      availableEndpoints: ['/crafts', '/motifs', '/cultures', '/history', '/categories', '/contributors', '/settings'],
    }, 404, CORS_HEADERS);

  } catch (err) {
    error(`[Public API Exception] ${err.message}`);
    return res.json({
      error: 'Internal Server Error',
    }, 500, CORS_HEADERS);
  }
};
