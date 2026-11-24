import { Client, TablesDB, Query } from 'node-appwrite';

const DB_ID = process.env.DATABASE_ID || 'museum_digital';
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

export default async ({ req, res, log, error }) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.text('', 200, CORS_HEADERS);
  }

  // Parse path, method, and query parameters
  let path = (req.path || '/').trim();
  let method = (req.method || 'GET').toUpperCase();
  let query = req.query || {};

  // Support invocation payload via function execution endpoint
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

  // Normalize path segments: /crafts/subahnale -> ['crafts', 'subahnale']
  const cleanPath = path.replace(/^\/+|\/+$/g, '');
  const segments = cleanPath ? cleanPath.split('/') : [];
  const root = segments[0] || 'health';
  const param = segments[1] || null;

  log(`[Public API] ${method} /${cleanPath} (root=${root}, param=${param})`);

  // Initialize Appwrite Client with Server SDK
  const client = new Client()
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID);

  const apiKey = req.headers['x-appwrite-key'] || process.env.APPWRITE_API_KEY;
  if (apiKey) {
    client.setKey(apiKey);
  }

  const tablesDB = new TablesDB(client);

  try {
    // ------------------------------------------------------------------------
    // HEALTH CHECK & API ROOT
    // ------------------------------------------------------------------------
    if (root === 'health' || root === '') {
      return res.json({
        status: 'ok',
        service: 'Museum Digital Pringgasela Selatan Public Content API',
        version: '1.0.0',
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
    // 1. CRAFTS (KERAJINAN TRADISIONAL / TENUN / BATIK)
    // ------------------------------------------------------------------------
    if (root === 'crafts') {
      if (param) {
        // Detail by slug
        const craftRes = await tablesDB.listRows(DB_ID, 'crafts', [
          Query.equal('slug', param),
          Query.equal('status', 'published'),
          Query.limit(1),
        ]);

        if (!craftRes.rows || craftRes.rows.length === 0) {
          return res.json({ error: 'Craft not found or not published' }, 404, CORS_HEADERS);
        }

        const craft = filterObject(craftRes.rows[0], WHITELISTS.craft);

        // Fetch translations
        const transRes = await tablesDB.listRows(DB_ID, 'craft_translations', [
          Query.equal('craftId', craft.$id),
        ]);
        craft.translations = (transRes.rows || []).map(r => filterObject(r, WHITELISTS.craft_translation));

        // Fetch contributor if linked
        if (craft.contributorId) {
          try {
            const contribRes = await tablesDB.getRow(DB_ID, 'contributors', craft.contributorId);
            craft.contributor = filterObject(contribRes, WHITELISTS.contributor);
          } catch (e) {
            craft.contributor = null;
          }
        }

        // Fetch media relations
        const mediaRelRes = await tablesDB.listRows(DB_ID, 'craft_media', [
          Query.equal('craftId', craft.$id),
          Query.orderAsc('sortOrder'),
        ]);
        craft.media = (mediaRelRes.rows || []).map(r => ({
          role: r.role,
          sortOrder: r.sortOrder,
          mediaAssetId: r.mediaAssetId,
        }));

        return res.json({ craft }, 200, CORS_HEADERS);
      } else {
        // List published crafts
        const limit = Math.min(Math.max(parseInt(query.limit) || 20, 1), 50);
        const offset = Math.max(parseInt(query.offset) || 0, 0);

        const queries = [
          Query.equal('status', 'published'),
          Query.limit(limit),
          Query.offset(offset),
          Query.orderDesc('$createdAt'),
        ];

        if (query.category) {
          queries.push(Query.equal('categoryId', query.category));
        }
        if (query.craftType) {
          queries.push(Query.equal('craftType', query.craftType));
        }

        const listRes = await tablesDB.listRows(DB_ID, 'crafts', queries);
        const crafts = [];

        for (const row of listRes.rows || []) {
          const item = filterObject(row, WHITELISTS.craft);
          // Attach translations
          const trans = await tablesDB.listRows(DB_ID, 'craft_translations', [
            Query.equal('craftId', item.$id),
          ]);
          item.translations = (trans.rows || []).map(t => filterObject(t, WHITELISTS.craft_translation));
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
    // 2. WEAVING MOTIFS (ENSIKLOPEDIA MOTIF TENUN PRINGGASELA)
    // ------------------------------------------------------------------------
    if (root === 'motifs') {
      if (param) {
        // Detail motif by slug
        const motifRes = await tablesDB.listRows(DB_ID, 'weaving_motifs', [
          Query.equal('slug', param),
          Query.equal('status', 'published'),
          Query.limit(1),
        ]);

        if (!motifRes.rows || motifRes.rows.length === 0) {
          return res.json({ error: 'Motif not found or not published' }, 404, CORS_HEADERS);
        }

        const motif = filterObject(motifRes.rows[0], WHITELISTS.motif);

        // Fetch translations (philosophical meaning, visual description, technique, origin)
        const transRes = await tablesDB.listRows(DB_ID, 'motif_translations', [
          Query.equal('motifId', motif.$id),
        ]);
        motif.translations = (transRes.rows || []).map(r => filterObject(r, WHITELISTS.motif_translation));

        // Fetch informant / artisan attribution
        if (motif.contributorId) {
          try {
            const contribRes = await tablesDB.getRow(DB_ID, 'contributors', motif.contributorId);
            motif.contributor = filterObject(contribRes, WHITELISTS.contributor);
          } catch (e) {
            motif.contributor = null;
          }
        }

        // Fetch motif media (pattern diagrams, photographs)
        const mediaRel = await tablesDB.listRows(DB_ID, 'motif_media', [
          Query.equal('motifId', motif.$id),
          Query.orderAsc('sortOrder'),
        ]);
        motif.media = (mediaRel.rows || []).map(r => ({
          isPatternDiagram: r.isPatternDiagram,
          sortOrder: r.sortOrder,
          mediaAssetId: r.mediaAssetId,
        }));

        return res.json({ motif }, 200, CORS_HEADERS);
      } else {
        // List published motifs
        const limit = Math.min(Math.max(parseInt(query.limit) || 20, 1), 50);
        const offset = Math.max(parseInt(query.offset) || 0, 0);

        const queries = [
          Query.equal('status', 'published'),
          Query.limit(limit),
          Query.offset(offset),
          Query.orderDesc('$createdAt'),
        ];

        if (query.category) {
          queries.push(Query.equal('categoryId', query.category));
        }

        const listRes = await tablesDB.listRows(DB_ID, 'weaving_motifs', queries);
        const motifs = [];

        for (const row of listRes.rows || []) {
          const item = filterObject(row, WHITELISTS.motif);
          const trans = await tablesDB.listRows(DB_ID, 'motif_translations', [
            Query.equal('motifId', item.$id),
          ]);
          item.translations = (trans.rows || []).map(t => filterObject(t, WHITELISTS.motif_translation));
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
    // 3. CULTURES (TRADISI BUDAYA, DZIKIR SAMAN, RITUAL DESA)
    // ------------------------------------------------------------------------
    if (root === 'cultures') {
      if (param) {
        // Detail culture by slug
        const cultRes = await tablesDB.listRows(DB_ID, 'cultures', [
          Query.equal('slug', param),
          Query.equal('status', 'published'),
          Query.limit(1),
        ]);

        if (!cultRes.rows || cultRes.rows.length === 0) {
          return res.json({ error: 'Cultural heritage item not found or not published' }, 404, CORS_HEADERS);
        }

        const culture = filterObject(cultRes.rows[0], WHITELISTS.culture);

        // Fetch translations (ritual procedure, spiritual value, description)
        const transRes = await tablesDB.listRows(DB_ID, 'culture_translations', [
          Query.equal('cultureId', culture.$id),
        ]);
        culture.translations = (transRes.rows || []).map(r => filterObject(r, WHITELISTS.culture_translation));

        // Fetch media (chants, audio, photos)
        const mediaRel = await tablesDB.listRows(DB_ID, 'culture_media', [
          Query.equal('cultureId', culture.$id),
          Query.orderAsc('sortOrder'),
        ]);
        culture.media = (mediaRel.rows || []).map(r => ({
          isAudioChant: r.isAudioChant,
          sortOrder: r.sortOrder,
          mediaAssetId: r.mediaAssetId,
        }));

        return res.json({ culture }, 200, CORS_HEADERS);
      } else {
        // List published cultures
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
          const trans = await tablesDB.listRows(DB_ID, 'culture_translations', [
            Query.equal('cultureId', item.$id),
          ]);
          item.translations = (trans.rows || []).map(t => filterObject(t, WHITELISTS.culture_translation));
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
    // 4. VILLAGE HISTORY (SEJARAH DESA PRINGGASELA SELATAN)
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
        item.translations = (trans.rows || []).map(t => filterObject(t, WHITELISTS.history_translation));
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
      const items = (listRes.rows || []).map(r => filterObject(r, WHITELISTS.category));

      return res.json({
        total: listRes.total,
        categories: items,
      }, 200, CORS_HEADERS);
    }

    // ------------------------------------------------------------------------
    // 6. CONTRIBUTORS (PENGRAJIN / TETUA ADAT / TOKOH BUDAYA)
    // ------------------------------------------------------------------------
    if (root === 'contributors') {
      const queries = [Query.limit(50), Query.orderAsc('name')];
      if (query.type) {
        queries.push(Query.equal('type', query.type));
      }
      const listRes = await tablesDB.listRows(DB_ID, 'contributors', queries);
      const items = (listRes.rows || []).map(r => filterObject(r, WHITELISTS.contributor));

      return res.json({
        total: listRes.total,
        contributors: items,
      }, 200, CORS_HEADERS);
    }

    // ------------------------------------------------------------------------
    // 7. MUSEUM SETTINGS (PUBLIC CONFIGURATION ONLY)
    // ------------------------------------------------------------------------
    if (root === 'settings') {
      const listRes = await tablesDB.listRows(DB_ID, 'museum_settings', [
        Query.limit(50),
      ]);

      // Public settings keys whitelist
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

    // Fallback 404 for unknown routes
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
