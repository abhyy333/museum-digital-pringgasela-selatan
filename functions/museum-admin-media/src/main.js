import { Client, Account, TablesDB, Storage, Teams, ID, Permission, Role, Query } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';

const ENDPOINT = process.env.APPWRITE_ENDPOINT || 'https://sgp.cloud.appwrite.io/v1';
const PROJECT_ID = process.env.APPWRITE_PROJECT_ID || '6affdaa0003c416ecdb0';
const DB_ID = process.env.DATABASE_ID || 'museum_digital';
const BUCKET_ID = process.env.STORAGE_BUCKET_ID || 'museum-media';
const TEAM_ID = process.env.ADMIN_TEAM_ID || 'museum-admins';

const MAX_FILE_BYTES = 50_000_000;
const MAX_CHUNK_BYTES = 5 * 1024 * 1024; // 5 MiB native Appwrite chunk ceiling

// Authoritative MIME -> allowed file extensions map matching museum-media bucket configuration
const ALLOWED_MIME_MAP = {
  'image/jpeg': new Set(['jpg', 'jpeg']),
  'image/png': new Set(['png']),
  'image/webp': new Set(['webp']),
  'image/svg+xml': new Set(['svg']),
  'image/avif': new Set(['avif']),
  'image/tiff': new Set(['tif', 'tiff']),
  'audio/mpeg': new Set(['mp3']),
  'audio/mp3': new Set(['mp3']),
  'audio/wav': new Set(['wav']),
  'audio/x-wav': new Set(['wav']),
  'audio/wave': new Set(['wav']),
  'audio/aac': new Set(['aac']),
  'audio/mp4': new Set(['aac']),
  'audio/ogg': new Set(['ogg']),
  'video/mp4': new Set(['mp4']),
  'video/webm': new Set(['webm']),
  'application/pdf': new Set(['pdf']),
  'application/zip': new Set(['zip']),
  'application/x-zip-compressed': new Set(['zip']),
};

const ALL_ALLOWED_EXTENSIONS = new Set([
  'jpg', 'jpeg', 'png', 'webp', 'svg', 'avif', 'tif', 'tiff',
  'mp3', 'wav', 'aac', 'ogg',
  'mp4', 'webm',
  'pdf', 'zip',
]);

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
    'X-Upload-File-Id',
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

function mapTeamRolesToAdminRole(roles) {
  if (!Array.isArray(roles) || roles.length === 0) return null;
  if (roles.includes('owner')) return 'super_admin';
  if (roles.includes('desa')) return 'admin_desa';
  if (roles.includes('kkn')) return 'admin_kkn';
  return 'admin_kkn';
}

async function authenticateAdmin(req, adminClient) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'] || '';
  const jwt = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!jwt) {
    const err = new Error('Autentikasi JWT wajib disertakan pada header Authorization.');
    err.status = 401;
    throw err;
  }

  let caller;
  try {
    const userClient = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setJWT(jwt);
    caller = await new Account(userClient).get();
  } catch {
    const err = new Error('Token JWT tidak valid atau telah kedaluwarsa.');
    err.status = 401;
    throw err;
  }

  // Strictly ignore any client-sent role or userId headers; verify live team membership via Server SDK
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

async function writeAuditLog(tablesDB, { actorUserId, action, entityType, entityId, changes }) {
  try {
    await tablesDB.createRow(DB_ID, 'audit_logs', ID.unique(), {
      actorUserId,
      action,
      entityType,
      entityId,
      changesJson: JSON.stringify(changes).slice(0, 4000),
    });
  } catch {
    // Non-blocking secondary safety
  }
}

function parseJsonBody(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    return req.body;
  }
  if (typeof req.bodyText === 'string' && req.bodyText.trim().startsWith('{')) {
    try {
      return JSON.parse(req.bodyText);
    } catch {
      return {};
    }
  }
  return {};
}

export default async ({ req, res, log, error }) => {
  if (req.method === 'OPTIONS') {
    return res.text('', 200, CORS_HEADERS);
  }

  const cleanPath = (req.path || '/').trim().replace(/\/+$/, '') || '/';
  const method = (req.method || 'GET').toUpperCase();
  const serverKey = req.headers['x-appwrite-key'] || process.env.APPWRITE_API_KEY;

  // Minimal public liveness probe (zero internal metadata or configuration leaked)
  if ((cleanPath === '/' || cleanPath === '/health') && method === 'GET') {
    return res.json({ status: 'ok', service: 'Museum Admin Media Gateway', version: '2.0.0' }, 200, CORS_HEADERS);
  }

  if (!serverKey) {
    error('[Admin Media Gateway] Missing server key scope');
    return res.json({ error: 'Konfigurasi server gateway tidak lengkap.' }, 500, CORS_HEADERS);
  }

  const adminClient = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(serverKey);
  const tablesDB = new TablesDB(adminClient);
  const storage = new Storage(adminClient);

  // Every administrative & upload operation MUST pass live JWT + Team Membership check
  let authCtx;
  try {
    authCtx = await authenticateAdmin(req, adminClient);
  } catch (authErr) {
    return res.json({ error: authErr.message }, authErr.status || 401, CORS_HEADERS);
  }

  const { user, role } = authCtx;
  const canPublish = role === 'super_admin' || role === 'admin_desa';
  const canDelete = role === 'super_admin';

  try {
    // ------------------------------------------------------------------------
    // 1. SERVER-AUTHORITATIVE CHUNKED / BINARY UPLOAD
    // POST /upload-chunk (supports single upload <= 5MB AND 5MB chunks up to 50MB)
    // ------------------------------------------------------------------------
    if (cleanPath === '/upload-chunk' && method === 'POST') {
      // Explicitly reject KKN attempts to request public permissions via headers or parameters
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

      if (!ext || !ALL_ALLOWED_EXTENSIONS.has(ext)) {
        return res.json(
          { error: `Ekstensi berkas '.${ext || '(kosong)'}' tidak diizinkan pada bucket museum-media.` },
          400,
          CORS_HEADERS
        );
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
          { error: `Ukuran potongan (${buf.length} bytes) melebihi batas chunk maksimum ${MAX_CHUNK_BYTES} bytes.` },
          413,
          CORS_HEADERS
        );
      }

      // Parse & verify Content-Range if provided, otherwise treat as single-chunk complete upload
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

      const incomingUploadId = (req.headers['x-upload-file-id'] || '').trim();
      if (rangeStart > 0 && !incomingUploadId) {
        return res.json({ error: 'X-Upload-File-Id wajib disertakan untuk lanjutan potongan chunk.' }, 400, CORS_HEADERS);
      }

      const isFinalChunk = rangeEnd + 1 === rangeTotal;
      // SERVER-AUTHORITATIVE PERMISSIONS: Always private on upload; never accept permissions from client!
      const serverPrivatePerms = buildPrivatePerms();

      let storageFile;
      if (rangeStart === 0 && isFinalChunk) {
        // Clean single-shot SDK call when entire file fits within 5 MiB
        const generatedId = ID.unique();
        storageFile = await storage.createFile(
          BUCKET_ID,
          generatedId,
          InputFile.fromBuffer(buf, safeFileName),
          serverPrivatePerms
        );
      } else {
        // Multi-chunk streaming via Appwrite Storage Content-Range REST API (0 client bypass, ~5MB RAM)
        const form = new FormData();
        form.append('fileId', incomingUploadId || ID.unique());
        form.append('file', new Blob([buf], { type: mimeType }), safeFileName);
        for (const p of serverPrivatePerms) {
          form.append('permissions[]', p);
        }

        const storageHeaders = {
          'X-Appwrite-Project': PROJECT_ID,
          'X-Appwrite-Key': serverKey,
          'content-range': `bytes ${rangeStart}-${rangeEnd}/${rangeTotal}`,
        };
        if (incomingUploadId) {
          storageHeaders['x-appwrite-id'] = incomingUploadId;
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

      const completed =
        isFinalChunk &&
        (typeof storageFile.chunksTotal !== 'number' ||
          storageFile.chunksUploaded >= storageFile.chunksTotal);

      if (!completed) {
        return res.json(
          {
            completed: false,
            uploadId: storageFile.$id,
            chunksUploaded: storageFile.chunksUploaded || 1,
            chunksTotal: storageFile.chunksTotal || Math.ceil(totalSize / MAX_CHUNK_BYTES),
          },
          202,
          CORS_HEADERS
        );
      }

      // Defensive verify: ensure server-stored file strictly holds NO public read("any") permission
      if (isPublicPerms(storageFile.$permissions)) {
        await storage.updateFile(BUCKET_ID, storageFile.$id, undefined, serverPrivatePerms);
      }

      const captionId = decodeHeaderText(req.headers['x-caption-id']) || safeFileName;
      const captionEn = decodeHeaderText(req.headers['x-caption-en']) || captionId;
      const photographer = decodeHeaderText(req.headers['x-photographer']) || user.name || 'Staf Museum';

      // Atomic metadata creation with rollback on failure so orphan files cannot occur
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
          action: 'create',
          entityType: 'media_assets',
          entityId: assetRow.$id,
          changes: {
            via: 'server-gateway',
            role,
            fileId: storageFile.$id,
            mimeType,
            size: assetRow.fileSizeBytes,
            isPublic: false,
            permissions: storageFile.$permissions,
          },
        });

        log(`[Admin Media Gateway] Uploaded private file ${storageFile.$id} by ${user.$id} (${role})`);

        return res.json(
          {
            completed: true,
            asset: assetRow,
            storagePermissions: storageFile.$permissions || serverPrivatePerms,
            isPublic: false,
          },
          201,
          CORS_HEADERS
        );
      } catch (metaErr) {
        // Rollback Storage file cleanly so failed metadata leaves ZERO orphan/broken assets
        await storage.deleteFile(BUCKET_ID, storageFile.$id).catch(() => {});
        return res.json(
          { error: `Metadata gagal disimpan sehingga upload dibatalkan: ${metaErr.message}` },
          500,
          CORS_HEADERS
        );
      }
    }

    // ------------------------------------------------------------------------
    // 2. EXPLICIT AUTHORIZED PUBLISH / UNPUBLISH
    // POST /media/:fileId/publish | /media/:fileId/unpublish
    // ------------------------------------------------------------------------
    const mediaActionMatch = /^\/media\/([^/]+)\/(publish|unpublish)$/.exec(cleanPath);
    if (mediaActionMatch && method === 'POST') {
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

      // Refuse publishing orphan Storage files that lack media_assets registration
      if (makePublic) {
        try {
          await tablesDB.getRow(DB_ID, 'media_assets', targetFileId);
        } catch {
          return res.json(
            { error: 'Berkas tidak memiliki baris metadata terdaftar pada media_assets sehingga tidak dapat diterbitkan.' },
            404,
            CORS_HEADERS
          );
        }
      }

      const targetPerms = makePublic ? buildPublicPerms() : buildPrivatePerms();
      const updatedFile = await storage.updateFile(BUCKET_ID, targetFileId, undefined, targetPerms);
      const verifiedPublic = isPublicPerms(updatedFile.$permissions);

      if (verifiedPublic !== makePublic) {
        return res.json(
          { error: 'Verifikasi permission Appwrite Storage gagal sinkron sesudah update.' },
          500,
          CORS_HEADERS
        );
      }

      await writeAuditLog(tablesDB, {
        actorUserId: user.$id,
        action: makePublic ? 'publish' : 'unpublish',
        entityType: 'media_assets',
        entityId: targetFileId,
        changes: {
          via: 'server-gateway',
          role,
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
      const targetFileId = deleteMatch[1];
      if (!canDelete) {
        return res.json(
          { error: 'Akses ditolak: hanya Super Admin (owner) yang berwenang menghapus media secara permanen.' },
          403,
          CORS_HEADERS
        );
      }

      // Clean junction references first
      for (const tbl of ['motif_media', 'craft_media', 'culture_media']) {
        const links = await tablesDB.listRows(DB_ID, tbl, [
          Query.equal('mediaAssetId', targetFileId),
          Query.limit(100),
        ]);
        for (const l of links.rows || []) {
          await tablesDB.deleteRow(DB_ID, tbl, l.$id);
        }
      }

      await storage.deleteFile(BUCKET_ID, targetFileId).catch(() => {});
      await tablesDB.deleteRow(DB_ID, 'media_assets', targetFileId).catch(() => {});

      await writeAuditLog(tablesDB, {
        actorUserId: user.$id,
        action: 'delete',
        entityType: 'media_assets',
        entityId: targetFileId,
        changes: { via: 'server-gateway', role, fileId: targetFileId },
      });

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
    error(`[Admin Media Gateway Error] ${err.message}`);
    return res.json({ error: err.message || 'Kesalahan server internal.' }, err.code || 500, CORS_HEADERS);
  }
};
