import crypto from 'node:crypto';
import { Client, Account, TablesDB, Storage, Teams, ID, Permission, Role, Query } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';
import {
  ALL_ALLOWED_EXTENSIONS,
  ALLOWED_MIME_MAP,
  ANTIVIRUS_SCAN_CEILING,
  MAX_CHUNK_BYTES,
  MAX_FILE_BYTES,
  SESSION_TTL_MS,
  SlidingWindowRateLimiter,
  getQuarantineReason,
  mapTeamRolesToAdminRole,
  reconcileMediaInventory,
  sanitizeErrorForClient,
  signUploadSession,
  validateChunkIntegrity,
  verifyUploadSession,
} from './security.js';

const ENDPOINT = process.env.APPWRITE_ENDPOINT || 'https://sgp.cloud.appwrite.io/v1';
const PROJECT_ID = process.env.APPWRITE_PROJECT_ID || '6affdaa0003c416ecdb0';
const DB_ID = process.env.DATABASE_ID || 'museum_digital';
const BUCKET_ID = process.env.STORAGE_BUCKET_ID || 'museum-media';
const TEAM_ID = process.env.ADMIN_TEAM_ID || 'museum-admins';

const rateLimiter = new SlidingWindowRateLimiter();
const activeSessionLocks = new Set();

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': [
    'Content-Type',
    'Content-Range',
    'Authorization',
    'X-Appwrite-Project',
    'X-File-Name',
    'X-File-Mime',
    'X-File-Size',
    'X-File-Md5',
    'X-File-Sha256',
    'X-Upload-File-Id',
    'X-Upload-Session-Token',
    'X-Caption-Id',
    'X-Caption-En',
    'X-Photographer',
    'X-Is-Public',
    'X-Requested-Role',
  ].join(', '),
  'Content-Type': 'application/json',
};

function decodeHeaderText(val) {
  if (!val || typeof val !== 'string') return '';
  try {
    return decodeURIComponent(val).trim();
  } catch {
    return val.trim();
  }
}

function determineMediaType(mime) {
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  return 'document';
}

function isPublicPerms(perms) {
  return Array.isArray(perms) && perms.some((p) => typeof p === 'string' && p.trim() === 'read("any")');
}

function buildPrivatePerms() {
  return [Permission.read(Role.team(TEAM_ID))];
}

function buildPublicPerms() {
  return [Permission.read(Role.any()), Permission.read(Role.team(TEAM_ID))];
}

async function authenticateAdmin(req, adminClient) {
  const clientIp =
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.headers['x-appwrite-client-ip'] ||
    'unknown-ip';

  const authHeader = req.headers['authorization'] || req.headers['Authorization'] || '';
  const jwt = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!jwt) {
    const authLimit = rateLimiter.consume(`authfail:${clientIp}`, 20, 60_000);
    if (!authLimit.allowed) {
      const err = new Error('Terlalu banyak percobaan autentikasi gagal. Coba lagi nanti.');
      err.status = 429;
      err.retryAfter = authLimit.retryAfterSec;
      throw err;
    }
    const err = new Error('Autentikasi JWT wajib disertakan pada header Authorization.');
    err.status = 401;
    throw err;
  }

  let caller;
  try {
    const userClient = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setJWT(jwt);
    caller = await new Account(userClient).get();
  } catch {
    const authLimit = rateLimiter.consume(`authfail:${clientIp}`, 20, 60_000);
    if (!authLimit.allowed) {
      const err = new Error('Terlalu banyak percobaan token tidak sah. Coba lagi nanti.');
      err.status = 429;
      err.retryAfter = authLimit.retryAfterSec;
      throw err;
    }
    const err = new Error('Token JWT tidak valid atau telah kedaluwarsa.');
    err.status = 401;
    throw err;
  }

  // Verify live active team membership directly via Server SDK; never trust client headers
  const teams = new Teams(adminClient);
  const memRes = await teams.listMemberships(TEAM_ID, [Query.equal('userId', caller.$id)]);
  const activeMembership = (memRes.memberships || []).find(
    (m) => m.userId === caller.$id && m.confirm === true
  );

  if (!activeMembership) {
    const err = new Error('Akses ditolak: akun bukan anggota aktif tim museum-admins.');
    err.status = 403;
    throw err;
  }

  const role = mapTeamRolesToAdminRole(activeMembership.roles);
  if (!role) {
    const err = new Error('Akses ditolak: keanggotaan tim tidak memiliki peran valid.');
    err.status = 403;
    throw err;
  }

  return { user: caller, role, teamRoles: activeMembership.roles || [] };
}

async function writeAuditLog(tablesDB, { actorUserId, role, action, entityType, entityId, changes }) {
  try {
    await tablesDB.createRow(DB_ID, 'audit_logs', ID.unique(), {
      actorUserId,
      action,
      entityType,
      entityId,
      changesJson: JSON.stringify({
        via: 'server-gateway',
        role,
        timestamp: new Date().toISOString(),
        status: 'success',
        ...changes,
      }).slice(0, 4000),
    });
  } catch {
    // Non-blocking audit persistence
  }
}

async function listAllStorageFiles(storage) {
  const all = [];
  let offset = 0;
  const limit = 100;
  while (true) {
    const page = await storage.listFiles(BUCKET_ID, [Query.limit(limit), Query.offset(offset), Query.orderDesc('$createdAt')]);
    const files = page.files || [];
    all.push(...files);
    if (files.length < limit || all.length >= 1000) break;
    offset += limit;
  }
  return all;
}

async function listAllRows(tablesDB, tableId) {
  const all = [];
  let offset = 0;
  const limit = 100;
  while (true) {
    const page = await tablesDB.listRows(DB_ID, tableId, [Query.limit(limit), Query.offset(offset)]);
    const rows = page.rows || [];
    all.push(...rows);
    if (rows.length < limit || all.length >= 1000) break;
    offset += limit;
  }
  return all;
}

export default async ({ req, res, log, error }) => {
  if (req.method === 'OPTIONS') {
    return res.text('', 200, CORS_HEADERS);
  }

  const cleanPath = (req.path || '/').trim().replace(/\/+$/, '') || '/';
  const method = (req.method || 'GET').toUpperCase();
  const serverKey = req.headers['x-appwrite-key'] || process.env.APPWRITE_API_KEY;
  const sessionSecret = process.env.UPLOAD_SESSION_SECRET || '';

  // Minimal public liveness probe (zero secrets or internal config exposed)
  if ((cleanPath === '/' || cleanPath === '/health') && method === 'GET') {
    return res.json({ status: 'ok', service: 'Museum Admin Media Gateway', version: '4.1.0' }, 200, CORS_HEADERS);
  }

  if (!serverKey || !sessionSecret || sessionSecret.length < 16) {
    error('[Admin Media Gateway] Missing required server key or UPLOAD_SESSION_SECRET');
    return res.json({ error: 'Konfigurasi keamanan server gateway belum lengkap.' }, 500, CORS_HEADERS);
  }

  const adminClient = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(serverKey);
  const tablesDB = new TablesDB(adminClient);
  const storage = new Storage(adminClient);

  let authCtx;
  try {
    authCtx = await authenticateAdmin(req, adminClient);
  } catch (authErr) {
    const extraHeaders = authErr.retryAfter
      ? { ...CORS_HEADERS, 'Retry-After': String(authErr.retryAfter) }
      : CORS_HEADERS;
    return res.json({ error: authErr.message }, authErr.status || 401, extraHeaders);
  }

  const { user, role } = authCtx;
  const canPublish = role === 'super_admin' || role === 'admin_desa';
  const canDelete = role === 'super_admin';

  try {
    // ------------------------------------------------------------------------
    // 0. ADMIN VISITOR ANALYTICS SUMMARY (All verified museum-admins roles)
    // GET /analytics/summary?days=30
    // ------------------------------------------------------------------------
    if (cleanPath === '/analytics/summary' && method === 'GET') {
      const rl = rateLimiter.consume(`analytics:${user.$id}`, 60, 60_000);
      if (!rl.allowed) {
        return res.json(
          { error: 'Terlalu banyak permintaan pembaruan analitik.' },
          429,
          { ...CORS_HEADERS, 'Retry-After': String(rl.retryAfterSec) }
        );
      }

      const rawDays = Number.parseInt(String(req.query?.days || '30'), 10);
      const daysWindow = Number.isFinite(rawDays) ? Math.min(Math.max(rawDays, 7), 30) : 30;
      const nowMs = Date.now();
      const activeCutoffIso = new Date(nowMs - 2 * 60 * 1000).toISOString();
      const todayKey = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Makassar' }).format(new Date(nowMs));

      const [
        activeSessionsRes,
        recentSessionsRes,
        dailyStatsRes,
        pageStatsRes,
        pubMotifsRes,
        pubCraftsRes,
        pubCulturesRes,
        pubHistoryRes,
      ] = await Promise.all([
        tablesDB.listRows(DB_ID, 'visitor_sessions', [
          Query.greaterThanEqual('lastSeenAt', activeCutoffIso),
          Query.orderDesc('lastSeenAt'),
          Query.limit(100),
        ]),
        tablesDB.listRows(DB_ID, 'visitor_sessions', [
          Query.orderDesc('lastSeenAt'),
          Query.limit(12),
        ]),
        tablesDB.listRows(DB_ID, 'visitor_daily_stats', [
          Query.orderDesc('dateKey'),
          Query.limit(90),
        ]),
        tablesDB.listRows(DB_ID, 'visitor_page_stats', [
          Query.orderDesc('pageViews'),
          Query.limit(25),
        ]),
        tablesDB.listRows(DB_ID, 'weaving_motifs', [Query.equal('status', 'published'), Query.limit(1)]),
        tablesDB.listRows(DB_ID, 'crafts', [Query.equal('status', 'published'), Query.limit(1)]),
        tablesDB.listRows(DB_ID, 'cultures', [Query.equal('status', 'published'), Query.limit(1)]),
        tablesDB.listRows(DB_ID, 'village_history', [Query.equal('status', 'published'), Query.limit(1)]),
      ]);

      const dailyMap = new Map();
      let totalPageViews = 0;
      for (const row of dailyStatsRes.rows || []) {
        dailyMap.set(row.dateKey, row);
        totalPageViews += Number(row.pageViews || 0);
      }

      const dailySeries = [];
      for (let i = daysWindow - 1; i >= 0; i -= 1) {
        const d = new Date(nowMs - i * 24 * 60 * 60 * 1000);
        const key = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Makassar' }).format(d);
        const row = dailyMap.get(key);
        dailySeries.push({
          dateKey: key,
          uniqueVisitors: Number(row?.uniqueVisitors || 0),
          pageViews: Number(row?.pageViews || 0),
          mobileViews: Number(row?.mobileViews || 0),
          desktopViews: Number(row?.desktopViews || 0),
        });
      }

      const todayRow = dailyMap.get(todayKey);
      const publishedContentCount =
        Number(pubMotifsRes.total || 0) +
        Number(pubCraftsRes.total || 0) +
        Number(pubCulturesRes.total || 0) +
        Number(pubHistoryRes.total || 0);

      // Strip any PII (no sessionId, no IP, no user identifiers)
      const recentActivity = (recentSessionsRes.rows || []).map((s) => ({
        path: s.currentPath,
        pageTitle: s.pageTitle || s.currentPath,
        deviceCategory: s.deviceCategory || 'desktop',
        referrerCategory: s.referrerCategory || 'direct',
        lastSeenAt: s.lastSeenAt,
        isActive: Date.parse(s.lastSeenAt || '') >= nowMs - 2 * 60 * 1000,
      }));

      const topPages = (pageStatsRes.rows || []).map((p) => ({
        pageKey: p.pageKey,
        contentType: p.contentType,
        slug: p.slug || null,
        titleHint: p.titleHint || p.pageKey,
        pageViews: Number(p.pageViews || 0),
        lastViewedAt: p.lastViewedAt,
      }));

      const rawPopular = topPages.filter((p) => Boolean(p.slug)).slice(0, 6);
      const popularContent = await Promise.all(
        rawPopular.map(async (item) => {
          let thumbnailFileId = null;
          try {
            const cfg =
              item.contentType === 'motif'
                ? { tbl: 'weaving_motifs', med: 'motif_media', fk: 'motifId' }
                : item.contentType === 'craft'
                ? { tbl: 'crafts', med: 'craft_media', fk: 'craftId' }
                : item.contentType === 'culture'
                ? { tbl: 'cultures', med: 'culture_media', fk: 'cultureId' }
                : null;
            if (cfg && item.slug) {
              const rowRes = await tablesDB.listRows(DB_ID, cfg.tbl, [
                Query.equal('slug', item.slug),
                Query.equal('status', 'published'),
                Query.limit(1),
              ]);
              const entityId = rowRes.rows?.[0]?.$id;
              if (entityId) {
                const medRes = await tablesDB.listRows(DB_ID, cfg.med, [
                  Query.equal(cfg.fk, entityId),
                  Query.orderAsc('sortOrder'),
                  Query.limit(1),
                ]);
                const assetId = medRes.rows?.[0]?.mediaAssetId;
                if (assetId) {
                  const fileMeta = await storage.getFile(BUCKET_ID, assetId);
                  const isPub =
                    Array.isArray(fileMeta.$permissions) &&
                    fileMeta.$permissions.some((p) => typeof p === 'string' && p.trim() === 'read("any")') &&
                    !getQuarantineReason({
                      mimeType: fileMeta.mimeType,
                      fileSizeBytes: fileMeta.sizeOriginal,
                      chunksUploaded: fileMeta.chunksUploaded,
                      chunksTotal: fileMeta.chunksTotal,
                    });
                  if (isPub && String(fileMeta.mimeType || '').startsWith('image/')) {
                    thumbnailFileId = fileMeta.$id;
                  }
                }
              }
            }
          } catch {}
          return { ...item, thumbnailFileId };
        })
      );

      return res.json(
        {
          generatedAt: new Date(nowMs).toISOString(),
          activeVisitors: Number(activeSessionsRes.total || activeSessionsRes.rows?.length || 0),
          todayUniqueVisitors: Number(todayRow?.uniqueVisitors || 0),
          todayPageViews: Number(todayRow?.pageViews || 0),
          totalPageViews,
          publishedContentCount,
          dailySeries,
          topPages: topPages.slice(0, 6),
          popularContent,
          recentActivity,
        },
        200,
        CORS_HEADERS
      );
    }

    // ------------------------------------------------------------------------
    // 0A. RECONCILIATION REPORT (Desa / Super Admin non-destructive audit)
    // GET /media/reconcile
    // ------------------------------------------------------------------------
    if (cleanPath === '/media/reconcile' && method === 'GET') {
      if (!canPublish) {
        return res.json({ error: 'Akses ditolak: hanya Admin Desa atau Super Admin dapat menjalankan rekonsiliasi.' }, 403, CORS_HEADERS);
      }
      const rl = rateLimiter.consume(`reconcile:${user.$id}`, 20, 60_000);
      if (!rl.allowed) {
        return res.json({ error: 'Terlalu banyak permintaan rekonsiliasi.' }, 429, { ...CORS_HEADERS, 'Retry-After': String(rl.retryAfterSec) });
      }
      const [storageFiles, assetRows, auditRows] = await Promise.all([
        listAllStorageFiles(storage),
        listAllRows(tablesDB, 'media_assets'),
        listAllRows(tablesDB, 'audit_logs'),
      ]);
      const report = reconcileMediaInventory({ storageFiles, assetRows, auditRows });
      return res.json(report, 200, CORS_HEADERS);
    }

    // ------------------------------------------------------------------------
    // 0B. SAFE CLEANUP OF STALE INCOMPLETE UPLOADS ONLY (Super Admin exclusive)
    // POST /media/cleanup-incomplete
    // ------------------------------------------------------------------------
    if (cleanPath === '/media/cleanup-incomplete' && method === 'POST') {
      if (!canDelete) {
        return res.json({ error: 'Akses ditolak: hanya Super Admin berwenang membersihkan upload tak selesai.' }, 403, CORS_HEADERS);
      }
      const files = await listAllStorageFiles(storage);
      const now = Date.now();
      const staleRemoved = [];
      for (const f of files) {
        const incomplete =
          typeof f.chunksTotal === 'number' &&
          typeof f.chunksUploaded === 'number' &&
          f.chunksUploaded < f.chunksTotal;
        if (!incomplete) continue;
        // Never touch seeded sample files even if modified; strictly incomplete temp uploads past TTL
        if (f.$id === 'public-motif-sample' || f.$id === 'private-kkn-archive') continue;
        const createdMs = Date.parse(f.$createdAt || '');
        if (Number.isFinite(createdMs) && now - createdMs < SESSION_TTL_MS) continue;
        await storage.deleteFile(BUCKET_ID, f.$id).catch(() => {});
        staleRemoved.push(f.$id);
      }
      if (staleRemoved.length > 0) {
        await writeAuditLog(tablesDB, {
          actorUserId: user.$id,
          role,
          action: 'delete',
          entityType: 'media_assets',
          entityId: staleRemoved[0],
          changes: { cleanupType: 'stale-incomplete-uploads', count: staleRemoved.length, fileIds: staleRemoved },
        });
      }
      return res.json({ cleanedCount: staleRemoved.length, cleanedFileIds: staleRemoved }, 200, CORS_HEADERS);
    }

    // ------------------------------------------------------------------------
    // 0C. SAFE STAFF MEDIA INVENTORY LISTING
    // GET /media
    // ------------------------------------------------------------------------
    if (cleanPath === '/media' && method === 'GET') {
      const rl = rateLimiter.consume(`list:${user.$id}`, 60, 60_000);
      if (!rl.allowed) {
        return res.json({ error: 'Batas laju daftar media tercapai. Tunggu sebentar.' }, 429, { ...CORS_HEADERS, 'Retry-After': String(rl.retryAfterSec) });
      }
      const filesRes = await storage.listFiles(BUCKET_ID, [
        Query.limit(100),
        Query.orderDesc('$createdAt'),
      ]);
      const files = (filesRes.files || []).map((f) => {
        const quarantineReason = getQuarantineReason({
          mimeType: f.mimeType,
          fileSizeBytes: f.sizeOriginal,
          chunksUploaded: f.chunksUploaded,
          chunksTotal: f.chunksTotal,
        });
        return {
          $id: f.$id,
          name: f.name,
          mimeType: f.mimeType,
          sizeOriginal: f.sizeOriginal,
          $createdAt: f.$createdAt,
          $updatedAt: f.$updatedAt,
          $permissions: f.$permissions || [],
          isPublic: isPublicPerms(f.$permissions),
          quarantined: Boolean(quarantineReason),
          quarantineReason,
        };
      });
      return res.json({ total: filesRes.total || files.length, files }, 200, CORS_HEADERS);
    }

    // ------------------------------------------------------------------------
    // 1. SERVER-AUTHORITATIVE SESSION-BOUND CHUNKED UPLOAD & FINALIZATION
    // POST /upload-chunk
    // ------------------------------------------------------------------------
    if (cleanPath === '/upload-chunk' && method === 'POST') {
      const rl = rateLimiter.consume(`upload:${user.$id}`, 80, 60_000);
      if (!rl.allowed) {
        return res.json(
          { error: 'Terlalu banyak permintaan unggahan berturut-turut. Coba lagi sebentar.' },
          429,
          { ...CORS_HEADERS, 'Retry-After': String(rl.retryAfterSec) }
        );
      }

      const requestedPublic = String(req.headers['x-is-public'] || '').toLowerCase() === 'true';
      if (requestedPublic && !canPublish) {
        return res.json(
          { error: 'Pelanggaran otorisasi: akun Admin KKN dilarang meminta akses publik pada unggahan media.' },
          403,
          CORS_HEADERS
        );
      }

      const rawFileName = decodeHeaderText(req.headers['x-file-name']);
      const safeFileName = (rawFileName || 'upload.bin').replace(/[^a-zA-Z0-9._-]/g, '_');
      const ext = safeFileName.split('.').pop()?.toLowerCase() || '';
      const mimeType = (req.headers['x-file-mime'] || '').split(';')[0].trim().toLowerCase();
      const totalSize = Number.parseInt(String(req.headers['x-file-size'] || '0'), 10);
      const expectedMd5Header = String(req.headers['x-file-md5'] || '').trim().toLowerCase();
      const expectedSha256Header = String(req.headers['x-file-sha256'] || '').trim().toLowerCase();

      if (!ext || !ALL_ALLOWED_EXTENSIONS.has(ext)) {
        return res.json({ error: `Ekstensi berkas '.${ext || '(kosong)'}' tidak diizinkan.` }, 400, CORS_HEADERS);
      }
      const allowedExtsForMime = ALLOWED_MIME_MAP[mimeType];
      if (!mimeType || !allowedExtsForMime || !allowedExtsForMime.has(ext)) {
        return res.json(
          { error: `Tipe MIME '${mimeType || 'unknown'}' tidak diizinkan atau tidak cocok dengan ekstensi '.${ext}'.` },
          400,
          CORS_HEADERS
        );
      }
      if (!Number.isFinite(totalSize) || totalSize <= 0 || totalSize > MAX_FILE_BYTES) {
        return res.json(
          { error: `Ukuran berkas (${totalSize} bytes) tidak valid atau melebihi batas maksimum ${MAX_FILE_BYTES} bytes.` },
          413,
          CORS_HEADERS
        );
      }

      const buf = req.bodyBinary;
      if (!buf || buf.length === 0) {
        return res.json({ error: 'Payload biner berkas kosong.' }, 400, CORS_HEADERS);
      }
      if (buf.length > MAX_CHUNK_BYTES) {
        return res.json(
          { error: `Ukuran potongan (${buf.length} bytes) melebihi batas chunk 5 MiB (${MAX_CHUNK_BYTES} bytes).` },
          413,
          CORS_HEADERS
        );
      }

      const contentRange = req.headers['content-range'];
      let rangeStart = 0;
      let rangeEnd = buf.length - 1;
      let rangeTotal = totalSize;

      if (contentRange) {
        const m = /^bytes\s+(\d+)-(\d+)\/(\d+)$/i.exec(String(contentRange).trim());
        if (!m) {
          return res.json({ error: 'Format header Content-Range tidak valid.' }, 400, CORS_HEADERS);
        }
        rangeStart = Number.parseInt(m[1], 10);
        rangeEnd = Number.parseInt(m[2], 10);
        rangeTotal = Number.parseInt(m[3], 10);
        if (
          rangeTotal !== totalSize ||
          rangeStart < 0 ||
          rangeEnd < rangeStart ||
          rangeEnd >= totalSize ||
          rangeEnd - rangeStart + 1 !== buf.length
        ) {
          return res.json({ error: 'Rentang byte Content-Range tidak konsisten dengan panjang data.' }, 400, CORS_HEADERS);
        }
      } else if (buf.length !== totalSize) {
        return res.json({ error: 'Ukuran biner tidak sama dengan X-File-Size.' }, 400, CORS_HEADERS);
      }

      // Enforce aligned 5 MiB boundaries for multi-chunk continuity
      if (rangeStart % MAX_CHUNK_BYTES !== 0) {
        return res.json(
          { error: `Offset byte awal (${rangeStart}) wajib merupakan kelipatan exact 5 MiB (${MAX_CHUNK_BYTES}).` },
          400,
          CORS_HEADERS
        );
      }

      const isFinalChunk = rangeEnd + 1 === rangeTotal;
      if (!isFinalChunk && buf.length !== MAX_CHUNK_BYTES) {
        return res.json(
          { error: `Ukuran chunk non-akhir harus tepat 5 MiB (${MAX_CHUNK_BYTES} bytes).` },
          400,
          CORS_HEADERS
        );
      }

      const incomingSessionToken = String(req.headers['x-upload-session-token'] || '').trim();
      const incomingUploadId = String(req.headers['x-upload-file-id'] || '').trim();
      const chunkIndex = Math.floor(rangeStart / MAX_CHUNK_BYTES);

      let activeFileId;
      let integrityMethod = 'chunked-continuation';
      let boundSession = null;
      let lockKey = null;

      if (rangeStart === 0) {
        if (incomingSessionToken || incomingUploadId) {
          return res.json(
            { error: 'Chunk awal (rangeStart=0) tidak boleh memakai session token atau file ID lama.' },
            400,
            CORS_HEADERS
          );
        }
        // Single-chunk SHA-256 verification when client supplies X-File-Sha256
        if (isFinalChunk && expectedSha256Header) {
          const actualSha = crypto.createHash('sha256').update(buf).digest('hex');
          if (actualSha !== expectedSha256Header) {
            return res.json({ error: 'Checksum SHA-256 berkas tidak sesuai dengan payload yang diterima.' }, 422, CORS_HEADERS);
          }
        }
        const integrity = validateChunkIntegrity(ext, mimeType, buf, totalSize, isFinalChunk);
        if (!integrity.ok) {
          return res.json({ error: integrity.error }, integrity.status || 400, CORS_HEADERS);
        }
        integrityMethod = integrity.method;
        activeFileId = ID.unique();
      } else {
        // Every continuation chunk MUST present a valid HMAC-signed server session token
        const verified = verifyUploadSession(incomingSessionToken, sessionSecret);
        if (!verified.ok) {
          if (verified.expired && verified.session?.fileId) {
            // Opportunistically purge expired incomplete temp file (ignore errors)
            try {
              const maybeFile = await storage.getFile(BUCKET_ID, verified.session.fileId);
              if (
                typeof maybeFile.chunksTotal === 'number' &&
                maybeFile.chunksUploaded < maybeFile.chunksTotal
              ) {
                await storage.deleteFile(BUCKET_ID, verified.session.fileId);
              }
            } catch {}
          }
          return res.json({ error: verified.error }, verified.status, CORS_HEADERS);
        }
        boundSession = verified.session;

        // Cross-user isolation: ONLY the user who initiated chunk 0 may continue this session!
        if (boundSession.ownerUserId !== user.$id) {
          return res.json(
            { error: 'Pelanggaran kepemilikan sesi: Anda tidak berwenang melanjutkan unggahan pengguna lain.' },
            403,
            CORS_HEADERS
          );
        }

        // Reject metadata tampering mid-upload compared against HMAC-bound session
        if (incomingUploadId && incomingUploadId !== boundSession.fileId) {
          return res.json({ error: 'X-Upload-File-Id tidak cocok dengan token sesi.' }, 409, CORS_HEADERS);
        }
        if (
          boundSession.totalSize !== totalSize ||
          boundSession.mimeType !== mimeType ||
          boundSession.safeFileName !== safeFileName
        ) {
          return res.json(
            { error: 'Perubahan metadata (ukuran, tipe MIME, atau nama file) di tengah upload dilarang.' },
            409,
            CORS_HEADERS
          );
        }

        activeFileId = boundSession.fileId;
        lockKey = boundSession.sessionId;
        if (activeSessionLocks.has(lockKey)) {
          return res.json(
            { error: 'Konflik paralel: upload session sedang memproses potongan chunk lain secara bersamaan.' },
            409,
            CORS_HEADERS
          );
        }
        activeSessionLocks.add(lockKey);
      }

      const serverPrivatePerms = buildPrivatePerms();
      let storageFile;

      try {
        if (rangeStart > 0) {
          let existingUpload;
          try {
            existingUpload = await storage.getFile(BUCKET_ID, activeFileId);
          } catch {
            return res.json({ error: 'Berkas sementara sesi upload tidak ditemukan di Storage.' }, 404, CORS_HEADERS);
          }
          if (
            typeof existingUpload.chunksTotal === 'number' &&
            existingUpload.chunksUploaded >= existingUpload.chunksTotal
          ) {
            return res.json({ error: 'Upload sesi ini sudah selesai dan tidak dapat digunakan ulang.' }, 409, CORS_HEADERS);
          }
          if (existingUpload.sizeOriginal && existingUpload.sizeOriginal !== boundSession.totalSize) {
            return res.json({ error: 'Ukuran total berkas di Storage tidak cocok dengan sesi terotorisasi.' }, 409, CORS_HEADERS);
          }
          // Reject duplicate chunk replay AND out-of-order chunk skipping!
          if (typeof existingUpload.chunksUploaded === 'number') {
            if (chunkIndex < existingUpload.chunksUploaded) {
              return res.json(
                { error: `Chunk duplikat #${chunkIndex} ditolak (sudah diterima ${existingUpload.chunksUploaded} chunk).` },
                409,
                CORS_HEADERS
              );
            }
            if (chunkIndex > existingUpload.chunksUploaded) {
              return res.json(
                { error: `Urutan chunk tidak valid: mengharapkan chunk #${existingUpload.chunksUploaded}, diterima #${chunkIndex}.` },
                409,
                CORS_HEADERS
              );
            }
          }
          integrityMethod = boundSession.integrityMethod || 'chunked-continuation';
        }

        if (rangeStart === 0 && isFinalChunk) {
          storageFile = await storage.createFile(
            BUCKET_ID,
            activeFileId,
            InputFile.fromBuffer(buf, safeFileName),
            serverPrivatePerms
          );
        } else {
          const form = new FormData();
          form.append('fileId', activeFileId);
          form.append('file', new Blob([buf], { type: mimeType }), safeFileName);
          for (const p of serverPrivatePerms) {
            form.append('permissions[]', p);
          }

          const storageHeaders = {
            'X-Appwrite-Project': PROJECT_ID,
            'X-Appwrite-Key': serverKey,
            'content-range': `bytes ${rangeStart}-${rangeEnd}/${rangeTotal}`,
          };
          if (rangeStart > 0) {
            storageHeaders['x-appwrite-id'] = activeFileId;
          }

          const upRes = await fetch(`${ENDPOINT}/storage/buckets/${BUCKET_ID}/files`, {
            method: 'POST',
            headers: storageHeaders,
            body: form,
          });
          const upText = await upRes.text();
          let upJson;
          try {
            upJson = JSON.parse(upText);
          } catch {
            upJson = { message: upText };
          }
          if (!upRes.ok) {
            return res.json(
              { error: upJson.message || 'Gagal mengunggah potongan berkas ke Storage.' },
              upRes.status >= 400 ? upRes.status : 500,
              CORS_HEADERS
            );
          }
          storageFile = upJson;
        }
      } finally {
        if (lockKey) activeSessionLocks.delete(lockKey);
      }

      const expectedTotalChunks = Math.ceil(totalSize / MAX_CHUNK_BYTES);
      const completed =
        isFinalChunk &&
        (typeof storageFile.chunksTotal !== 'number' ||
          (storageFile.chunksUploaded >= storageFile.chunksTotal && storageFile.chunksTotal === expectedTotalChunks));

      if (!completed) {
        // Issue or re-issue bound session token for remaining chunks
        const sessionToken =
          incomingSessionToken ||
          signUploadSession(
            {
              sessionId: ID.unique(),
              ownerUserId: user.$id,
              fileId: storageFile.$id,
              safeFileName,
              mimeType,
              totalSize,
              expectedMd5: expectedMd5Header || '',
              integrityMethod,
              issuedAt: Date.now(),
              expiresAt: Date.now() + SESSION_TTL_MS,
            },
            sessionSecret
          );

        return res.json(
          {
            completed: false,
            uploadId: storageFile.$id,
            sessionToken,
            chunksUploaded: storageFile.chunksUploaded || chunkIndex + 1,
            chunksTotal: storageFile.chunksTotal || expectedTotalChunks,
          },
          202,
          CORS_HEADERS
        );
      }

      // Final assembly integrity checks (sizeOriginal & optional end-to-end MD5 signature!)
      const finalMd5Expected = boundSession?.expectedMd5 || expectedMd5Header;
      if (
        (typeof storageFile.sizeOriginal === 'number' && storageFile.sizeOriginal !== totalSize) ||
        (finalMd5Expected && storageFile.signature && storageFile.signature.toLowerCase() !== finalMd5Expected)
      ) {
        await storage.deleteFile(BUCKET_ID, storageFile.$id).catch(() => {});
        return res.json(
          { error: 'Verifikasi ukuran atau checksum MD5 berkas rakitan gagal; berkas dibatalkan.' },
          422,
          CORS_HEADERS
        );
      }

      // Defensive verify: ensure strictly ['read("team:museum-admins")']
      const exactPerms = Array.isArray(storageFile.$permissions) ? storageFile.$permissions : [];
      if (exactPerms.length !== 1 || exactPerms[0] !== `read("team:${TEAM_ID}")`) {
        storageFile = await storage.updateFile(BUCKET_ID, storageFile.$id, undefined, serverPrivatePerms);
      }

      const captionId = decodeHeaderText(req.headers['x-caption-id']) || safeFileName;
      const captionEn = decodeHeaderText(req.headers['x-caption-en']) || captionId;
      const photographer = decodeHeaderText(req.headers['x-photographer']) || user.name || 'Staf Museum';
      const quarantineReason = getQuarantineReason({
        mimeType,
        fileSizeBytes: storageFile.sizeOriginal || totalSize,
        chunksUploaded: storageFile.chunksUploaded,
        chunksTotal: storageFile.chunksTotal,
      });
      const antivirusCoverage =
        totalSize <= ANTIVIRUS_SCAN_CEILING ? 'appwrite-av-eligible' : 'over-20mb-unscanned-private-quarantine';

      try {
        const assetRow = await tablesDB.createRow(
          DB_ID,
          'media_assets',
          storageFile.$id,
          {
            fileId: storageFile.$id,
            bucketId: BUCKET_ID,
            mediaType: determineMediaType(mimeType),
            mimeType,
            fileSizeBytes: storageFile.sizeOriginal || totalSize,
            altTextId: captionId,
            altTextEn: captionEn,
            captionId,
            captionEn,
            photographer,
            createdById: user.$id,
          },
          [
            Permission.read(Role.team(TEAM_ID)),
            Permission.update(Role.user(user.$id)),
          ]
        );

        await writeAuditLog(tablesDB, {
          actorUserId: user.$id,
          role,
          action: 'create',
          entityType: 'media_assets',
          entityId: assetRow.$id,
          changes: {
            fileId: storageFile.$id,
            mimeType,
            size: assetRow.fileSizeBytes,
            signature: storageFile.signature || null,
            isPublic: false,
            permissions: storageFile.$permissions,
            integrityCheck: integrityMethod,
            antivirusCoverage,
            quarantined: Boolean(quarantineReason),
            quarantineReason,
          },
        });

        log(`[Admin Media Gateway] Uploaded private file ${storageFile.$id} by ${user.$id} (${role})`);

        return res.json(
          {
            completed: true,
            asset: assetRow,
            storagePermissions: storageFile.$permissions || serverPrivatePerms,
            isPublic: false,
            integrityCheck: integrityMethod,
            antivirusCoverage,
            quarantined: Boolean(quarantineReason),
            quarantineReason,
          },
          201,
          CORS_HEADERS
        );
      } catch (metaErr) {
        // Compensating rollback of Storage file if metadata persistence fails
        await storage.deleteFile(BUCKET_ID, storageFile.$id).catch(() => {});
        return res.json(
          { error: 'Metadata gagal disimpan sehingga upload dibatalkan secara aman.' },
          500,
          CORS_HEADERS
        );
      }
    }

    // ------------------------------------------------------------------------
    // 2. EXPLICIT AUTHORIZED PUBLISH / UNPUBLISH WITH QUARANTINE ENFORCEMENT
    // POST /media/:fileId/publish | /media/:fileId/unpublish
    // ------------------------------------------------------------------------
    const mediaActionMatch = /^\/media\/([^/]+)\/(publish|unpublish)$/.exec(cleanPath);
    if (mediaActionMatch && method === 'POST') {
      const rl = rateLimiter.consume(`mutate:${user.$id}`, 40, 60_000);
      if (!rl.allowed) {
        return res.json({ error: 'Terlalu banyak operasi publikasi.' }, 429, { ...CORS_HEADERS, 'Retry-After': String(rl.retryAfterSec) });
      }

      const targetFileId = mediaActionMatch[1];
      const action = mediaActionMatch[2];
      const makePublic = action === 'publish';

      if (!canPublish) {
        return res.json(
          { error: 'Akses ditolak: hanya Admin Desa atau Super Admin yang dapat menerbitkan atau mencabut publikasi media.' },
          403,
          CORS_HEADERS
        );
      }

      let fileMeta;
      try {
        fileMeta = await storage.getFile(BUCKET_ID, targetFileId);
      } catch {
        return res.json({ error: 'Berkas target tidak ditemukan di Storage.' }, 404, CORS_HEADERS);
      }

      let assetMeta = null;
      if (makePublic) {
        try {
          assetMeta = await tablesDB.getRow(DB_ID, 'media_assets', targetFileId);
        } catch {
          return res.json(
            { error: 'Berkas tidak memiliki baris metadata terdaftar pada media_assets sehingga tidak dapat diterbitkan.' },
            404,
            CORS_HEADERS
          );
        }

        // Enforce strict quarantine block: unscanned (>20MB), incomplete, SVG, and ZIP cannot be made public
        const fileQuarantine = getQuarantineReason({
          mimeType: fileMeta.mimeType,
          fileSizeBytes: fileMeta.sizeOriginal,
          chunksUploaded: fileMeta.chunksUploaded,
          chunksTotal: fileMeta.chunksTotal,
        });
        const metaQuarantine = getQuarantineReason({
          mimeType: assetMeta.mimeType,
          fileSizeBytes: assetMeta.fileSizeBytes,
        });
        const blockedReason = fileQuarantine || metaQuarantine;
        if (blockedReason) {
          return res.json(
            {
              error: `Publikasi ditolak: berkas berstatus karantina (${blockedReason}) dan harus tetap privat.`,
              quarantineReason: blockedReason,
            },
            422,
            CORS_HEADERS
          );
        }
      }

      const targetPerms = makePublic ? buildPublicPerms() : buildPrivatePerms();
      const updatedFile = await storage.updateFile(BUCKET_ID, targetFileId, undefined, targetPerms);
      const verifiedPublic = isPublicPerms(updatedFile.$permissions);

      if (verifiedPublic !== makePublic) {
        // Compensate back to private if state mismatch occurred
        await storage.updateFile(BUCKET_ID, targetFileId, undefined, buildPrivatePerms()).catch(() => {});
        return res.json(
          { error: 'Verifikasi permission Appwrite Storage gagal sinkron sesudah update.' },
          500,
          CORS_HEADERS
        );
      }

      await writeAuditLog(tablesDB, {
        actorUserId: user.$id,
        role,
        action: makePublic ? 'publish' : 'unpublish',
        entityType: 'media_assets',
        entityId: targetFileId,
        changes: {
          fileId: targetFileId,
          isPublic: verifiedPublic,
          permissions: updatedFile.$permissions,
        },
      });

      return res.json(
        {
          fileId: updatedFile.$id,
          isPublic: verifiedPublic,
          permissions: updatedFile.$permissions,
        },
        200,
        CORS_HEADERS
      );
    }

    // ------------------------------------------------------------------------
    // 3. SUPER ADMIN SAFE CASCADE DELETE
    // DELETE /media/:fileId
    // ------------------------------------------------------------------------
    const deleteMatch = /^\/media\/([^/]+)$/.exec(cleanPath);
    if (deleteMatch && method === 'DELETE') {
      const rl = rateLimiter.consume(`delete:${user.$id}`, 30, 60_000);
      if (!rl.allowed) {
        return res.json({ error: 'Terlalu banyak permintaan penghapusan.' }, 429, { ...CORS_HEADERS, 'Retry-After': String(rl.retryAfterSec) });
      }

      const targetFileId = deleteMatch[1];
      if (!canDelete) {
        return res.json(
          { error: 'Akses ditolak: hanya Super Admin (owner) yang berwenang menghapus media secara permanen.' },
          403,
          CORS_HEADERS
        );
      }

      // Guard sample files unless explicitly deleted via console; wait — allow normal test/media deletion cleanly
      for (const tbl of ['motif_media', 'craft_media', 'culture_media']) {
        const links = await tablesDB.listRows(DB_ID, tbl, [
          Query.equal('mediaAssetId', targetFileId),
          Query.limit(100),
        ]);
        for (const l of links.rows || []) {
          await tablesDB.deleteRow(DB_ID, tbl, l.$id);
        }
      }

      let storageDeleted = true;
      let metadataDeleted = true;
      try {
        await storage.deleteFile(BUCKET_ID, targetFileId);
      } catch (e) {
        if (e?.code !== 404) storageDeleted = false;
      }
      try {
        await tablesDB.deleteRow(DB_ID, 'media_assets', targetFileId);
      } catch (e) {
        if (e?.code !== 404) metadataDeleted = false;
      }

      await writeAuditLog(tablesDB, {
        actorUserId: user.$id,
        role,
        action: 'delete',
        entityType: 'media_assets',
        entityId: targetFileId,
        changes: { fileId: targetFileId, storageDeleted, metadataDeleted },
      });

      if (!storageDeleted || !metadataDeleted) {
        return res.json(
          { error: 'Penghapusan tidak sepenuhnya konsisten; periksa laporan rekonsiliasi.', fileId: targetFileId },
          500,
          CORS_HEADERS
        );
      }

      return res.json({ deleted: true, fileId: targetFileId }, 200, CORS_HEADERS);
    }

    // ------------------------------------------------------------------------
    // 4. WHOAMI / GATEWAY RBAC CHECK
    // GET /me
    // ------------------------------------------------------------------------
    if (cleanPath === '/me' && method === 'GET') {
      return res.json({ userId: user.$id, role, canPublish, canDelete }, 200, CORS_HEADERS);
    }

    return res.json({ error: `Endpoint admin '${cleanPath}' tidak ditemukan.` }, 404, CORS_HEADERS);
  } catch (err) {
    error(`[Admin Media Gateway Error] ${err?.code || 500}: ${err?.message || 'unknown'}`);
    const safeErr = sanitizeErrorForClient(err);
    return res.json({ error: safeErr.message }, safeErr.status, CORS_HEADERS);
  }
};
