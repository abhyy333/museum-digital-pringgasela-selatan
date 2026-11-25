import { Client, TablesDB, Storage, Query } from 'node-appwrite';

const DB_ID = process.env.DATABASE_ID || 'museum_digital';
const BUCKET_ID = process.env.STORAGE_BUCKET_ID || 'museum-media';
const ENDPOINT = process.env.APPWRITE_ENDPOINT || 'https://sgp.cloud.appwrite.io/v1';
const PROJECT_ID = process.env.APPWRITE_PROJECT_ID || '6affdaa0003c416ecdb0';

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

function isPublicStorageFile(fileMeta) {
  const perms = fileMeta?.$permissions || [];
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
  let query = req.query || {};

  if (req.body && typeof req.body === 'object') {
    if (req.body.path) path = req.body.path;
    if (req.body.method) method = (req.body.method || method).toUpperCase();
    if (req.body.query) query = { ...query, ...req.body.query };
  } else if (typeof req.body === 'string' && req.body.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(req.body);
      if (parsed.path) path = parsed.path;
      if (parsed.method) method = (parsed.method || method).toUpperCase();
      if (parsed.query) query = { ...query, ...parsed.query };
    } catch (e) {
      // ignore JSON parse error on body
    }
  }

  const cleanPath = path.replace(/^\/+|\/+$/g, '');
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
        version: '1.2.0',
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
        ],
      }, 200, CORS_HEADERS);
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
      message: err.message,
    }, 500, CORS_HEADERS);
  }
};
