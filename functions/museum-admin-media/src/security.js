import crypto from 'node:crypto';

export const MAX_FILE_BYTES = 50_000_000;
export const MAX_CHUNK_BYTES = 5 * 1024 * 1024; // 5 MiB native Appwrite chunk ceiling (5,242,880 B)
export const MAX_SVG_BYTES = 1 * 1024 * 1024; // 1 MiB ceiling so 100% of SVG XML is parsed in 1 chunk
export const MAX_ZIP_BYTES = 5 * 1024 * 1024; // 5 MiB ceiling so 100% of ZIP central directory is inspected
export const MAX_ZIP_ENTRIES = 250;
export const MAX_ZIP_UNCOMPRESSED_BYTES = 50_000_000;
export const MAX_ZIP_COMPRESSION_RATIO = 50;
export const ANTIVIRUS_SCAN_CEILING = 20_000_000; // Appwrite Cloud skips AV scanning for files > 20 MB
export const SESSION_TTL_MS = 20 * 60 * 1000; // 20 minutes per chunked upload session

export const ALLOWED_MIME_MAP = {
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

export const ALL_ALLOWED_EXTENSIONS = new Set([
  'jpg', 'jpeg', 'png', 'webp', 'svg', 'avif', 'tif', 'tiff',
  'mp3', 'wav', 'aac', 'ogg',
  'mp4', 'webm',
  'pdf', 'zip',
]);

export const QUARANTINED_PUBLIC_MIMES = new Set([
  'application/zip',
  'application/x-zip-compressed',
  'image/svg+xml',
]);

const DANGEROUS_ARCHIVE_ENTRY_PATTERN =
  /\.(?:exe|dll|bat|cmd|ps1|sh|bash|zsh|vbs|vbe|js|mjs|cjs|msi|msp|scr|pif|hta|jar|php|phtml|html|htm|svg|com|cpl)\b/i;

const NESTED_ARCHIVE_PATTERN = /\.(?:zip|tar|gz|tgz|rar|7z|bz2|xz|cab|iso)$/i;

const SVG_ALLOWED_TAGS = new Set([
  'svg', 'g', 'path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon',
  'defs', 'lineargradient', 'radialgradient', 'stop', 'title', 'desc', 'clippath', 'mask',
]);

export function startsWithBytes(buf, bytes, offset = 0) {
  if (!buf || buf.length < offset + bytes.length) return false;
  for (let i = 0; i < bytes.length; i += 1) {
    if (buf[offset + i] !== bytes[i]) return false;
  }
  return true;
}

export function startsWithAscii(buf, text, offset = 0) {
  if (!buf || buf.length < offset + text.length) return false;
  return buf.subarray(offset, offset + text.length).toString('ascii') === text;
}

export function mapTeamRolesToAdminRole(roles) {
  if (!Array.isArray(roles) || roles.length === 0) return null;
  if (roles.includes('owner')) return 'super_admin';
  if (roles.includes('desa')) return 'admin_desa';
  if (roles.includes('kkn')) return 'admin_kkn';
  return 'admin_kkn';
}

export function getQuarantineReason({ mimeType, fileSizeBytes, chunksUploaded, chunksTotal }) {
  if (
    typeof chunksTotal === 'number' &&
    typeof chunksUploaded === 'number' &&
    chunksUploaded < chunksTotal
  ) {
    return 'incomplete-chunked-upload';
  }
  if (typeof fileSizeBytes === 'number' && fileSizeBytes > ANTIVIRUS_SCAN_CEILING) {
    return 'over-20mb-unscanned-private-quarantine';
  }
  const normalizedMime = String(mimeType || '').split(';')[0].trim().toLowerCase();
  if (QUARANTINED_PUBLIC_MIMES.has(normalizedMime)) {
    return 'high-risk-active-format-quarantine';
  }
  return null;
}

/**
 * Structural XML tag-walker for SVG files (never rely solely on regex patterns).
 * Keeps strict safe geometry tags only and bans DOCTYPE/ENTITY/CDATA/scripts/event handlers/URIs.
 */
export function validateSvgXml(buf, totalSize) {
  if (totalSize > MAX_SVG_BYTES) {
    return {
      ok: false,
      status: 413,
      error: `Berkas SVG melebihi batas inspeksi aman ${MAX_SVG_BYTES} bytes.`,
    };
  }
  if (buf.includes(0x00)) {
    return { ok: false, status: 400, error: 'Berkas SVG mengandung null-byte tidak valid.' };
  }

  const xml = buf.toString('utf8');
  if (/<!(?:doctype|entity)\b|<!\[cdata\[/i.test(xml)) {
    return { ok: false, status: 400, error: 'Berkas SVG dilarang memuat DOCTYPE, ENTITY, maupun CDATA.' };
  }
  if (/(?:javascript|vbscript)\s*:|data\s*:\s*(?:text\/html|image\/svg\+xml)/i.test(xml)) {
    return { ok: false, status: 400, error: 'Berkas SVG mengandung skema URI aktif berisiko XSS.' };
  }

  let hasSvgRoot = false;
  const tagRegex = /<\s*\/?\s*([a-zA-Z_][\w:.-]*)([^>]*)>/g;
  let match;
  while ((match = tagRegex.exec(xml)) !== null) {
    const tagRaw = match[1].toLowerCase();
    const localTag = tagRaw.includes(':') ? tagRaw.split(':').pop() : tagRaw;
    const attrs = match[2] || '';

    if (localTag === 'svg') hasSvgRoot = true;
    if (!SVG_ALLOWED_TAGS.has(localTag)) {
      return {
        ok: false,
        status: 400,
        error: `Elemen SVG '<${tagRaw}>' tidak termasuk whitelist vektor konservasi museum.`,
      };
    }

    // Inspect attribute names/values against event handlers or external href references
    if (/\bon[a-z0-9_-]+\s*=/i.test(attrs)) {
      return {
        ok: false,
        status: 400,
        error: 'Berkas SVG ditolak: terdeteksi event handler JavaScript inline.',
      };
    }
    if (/\b(?:href|xlink:href)\s*=\s*['"]?\s*(?:https?:|\/\/|data:|javascript:|vbscript:)/i.test(attrs)) {
      return {
        ok: false,
        status: 400,
        error: 'Berkas SVG ditolak: referensi tautan eksternal/aktif pada atribut SVG tidak diizinkan.',
      };
    }
  }

  if (!hasSvgRoot) {
    return { ok: false, status: 400, error: 'Berkas SVG harus memiliki elemen root <svg> yang valid.' };
  }
  return { ok: true, method: 'xml-whitelist-parser:svg-quarantined' };
}

/**
 * Inspect ZIP local file headers & central directory entries against traversal, bombs, nested archives, and executables.
 */
export function validateZipArchive(buf, totalSize) {
  if (totalSize > MAX_ZIP_BYTES) {
    return {
      ok: false,
      status: 413,
      error: `Arsip ZIP dibatasi maks ${MAX_ZIP_BYTES} bytes agar seluruh struktur direktori dapat diaudit server.`,
    };
  }
  const zipNormal = startsWithBytes(buf, [0x50, 0x4b, 0x03, 0x04]);
  const zipEmpty = startsWithBytes(buf, [0x50, 0x4b, 0x05, 0x06]);
  if (!zipNormal && !zipEmpty) {
    return { ok: false, status: 400, error: 'Signature arsip ZIP (PK\\x03\\x04) tidak valid.' };
  }

  const checkEntryMeta = (entryName, compSize, uncompSize) => {
    if (!entryName) return null;
    if (
      entryName.includes('..') ||
      entryName.startsWith('/') ||
      entryName.startsWith('\\') ||
      /^[a-zA-Z]:/.test(entryName)
    ) {
      return `Arsip ZIP ditolak: path traversal terdeteksi pada entri '${entryName}'.`;
    }
    if (NESTED_ARCHIVE_PATTERN.test(entryName)) {
      return `Arsip ZIP ditolak: arsip bersarang (nested archive) '${entryName}' tidak diizinkan.`;
    }
    if (DANGEROUS_ARCHIVE_ENTRY_PATTERN.test(entryName)) {
      return `Arsip ZIP ditolak: entri '${entryName}' memiliki ekstensi eksekusi/skrip berbahaya.`;
    }
    if (uncompSize > MAX_ZIP_UNCOMPRESSED_BYTES) {
      return `Arsip ZIP ditolak: ukuran tak terkompresi '${entryName}' melebihi batas aman.`;
    }
    if (compSize > 0 && uncompSize / compSize > MAX_ZIP_COMPRESSION_RATIO) {
      return `Arsip ZIP ditolak: rasio kompresi tidak wajar pada '${entryName}' (potensi zip bomb).`;
    }
    return null;
  };

  let entries = 0;
  let totalUncompressed = 0;

  // Walk Local File Headers (PK\x03\x04)
  let pos = 0;
  while (pos + 30 <= buf.length) {
    if (buf[pos] === 0x50 && buf[pos + 1] === 0x4b && buf[pos + 2] === 0x03 && buf[pos + 3] === 0x04) {
      entries += 1;
      if (entries > MAX_ZIP_ENTRIES) {
        return { ok: false, status: 400, error: `Arsip ZIP melebihi batas ${MAX_ZIP_ENTRIES} entri.` };
      }
      const compSize = buf.readUInt32LE(pos + 18);
      const uncompSize = buf.readUInt32LE(pos + 22);
      const fnameLen = buf.readUInt16LE(pos + 26);
      const extraLen = buf.readUInt16LE(pos + 28);
      const nameStart = pos + 30;
      const nameEnd = Math.min(buf.length, nameStart + fnameLen);
      const entryName = buf.subarray(nameStart, nameEnd).toString('utf8');

      totalUncompressed += uncompSize;
      if (totalUncompressed > MAX_ZIP_UNCOMPRESSED_BYTES) {
        return { ok: false, status: 400, error: 'Total ukuran terdekompresi arsip ZIP melebihi batas aman 50 MB.' };
      }

      const errMsg = checkEntryMeta(entryName, compSize, uncompSize);
      if (errMsg) return { ok: false, status: 400, error: errMsg };

      const step = 30 + fnameLen + extraLen + (compSize > 0 ? compSize : 0);
      pos += step > 30 ? step : 4;
    } else if (buf[pos] === 0x50 && buf[pos + 1] === 0x4b && buf[pos + 2] === 0x01 && buf[pos + 3] === 0x02) {
      // Also inspect Central Directory headers (PK\x01\x02) for true metadata
      if (pos + 46 > buf.length) break;
      const compSize = buf.readUInt32LE(pos + 20);
      const uncompSize = buf.readUInt32LE(pos + 24);
      const fnameLen = buf.readUInt16LE(pos + 28);
      const extraLen = buf.readUInt16LE(pos + 30);
      const commentLen = buf.readUInt16LE(pos + 32);
      const nameStart = pos + 46;
      const nameEnd = Math.min(buf.length, nameStart + fnameLen);
      const entryName = buf.subarray(nameStart, nameEnd).toString('utf8');
      const errMsg = checkEntryMeta(entryName, compSize, uncompSize);
      if (errMsg) return { ok: false, status: 400, error: errMsg };
      pos += Math.max(46 + fnameLen + extraLen + commentLen, 4);
    } else {
      const nextLocal = buf.indexOf('PK\x03\x04', pos + 1, 'latin1');
      const nextCd = buf.indexOf('PK\x01\x02', pos + 1, 'latin1');
      const candidates = [nextLocal, nextCd].filter((v) => v !== -1);
      if (candidates.length === 0) break;
      pos = Math.min(...candidates);
    }
  }

  return { ok: true, method: 'magic-bytes+zip-structural-scan:zip-quarantined' };
}

/**
 * Inspect binary signatures and structural headers on chunk 0.
 */
export function validateChunkIntegrity(ext, mimeType, buf, totalSize, isFinalChunk = true) {
  const headText = buf.subarray(0, Math.min(buf.length, 512)).toString('utf8').trimStart();
  const isExe = startsWithAscii(buf, 'MZ') || startsWithBytes(buf, [0x7f, 0x45, 0x4c, 0x46]);
  const isShebang = startsWithAscii(buf, '#!');
  if (isExe || isShebang) {
    return {
      ok: false,
      status: 400,
      error: 'Integritas berkas ditolak: terdeteksi signature berkas eksekusi / skrip sistem.',
    };
  }

  if (ext !== 'svg') {
    if (/^(?:<!doctype\s+html|<html\b|<script\b|<\?php\b)/i.test(headText)) {
      return {
        ok: false,
        status: 400,
        error: 'Integritas berkas ditolak: konten HTML/skrip aktif tidak diizinkan disamarkan sebagai media.',
      };
    }
  }

  switch (ext) {
    case 'jpg':
    case 'jpeg': {
      if (buf.length < 12 || !startsWithBytes(buf, [0xff, 0xd8, 0xff])) {
        return { ok: false, status: 400, error: 'Signature biner JPEG (FF D8 FF) tidak valid.' };
      }
      // Fourth byte must be valid JPEG marker (e.g., E0..EF, DB, C0..CF, FE)
      const marker = buf[3];
      if (marker < 0xc0) {
        return { ok: false, status: 400, error: 'Marker header JPEG rusak / malformed.' };
      }
      if (isFinalChunk) {
        const eoi = buf.lastIndexOf(Buffer.from([0xff, 0xd9]));
        if (eoi !== -1) {
          const tail = buf.subarray(eoi + 2);
          const tailText = tail.toString('latin1');
          if (tail.length > 256 || /<script|PK\x03\x04|MZ/i.test(tailText)) {
            return {
              ok: false,
              status: 400,
              error: 'Integritas JPEG ditolak: ditemukan payload mencurigakan setelah marker akhir EOI.',
            };
          }
        }
      }
      return { ok: true, method: 'magic-bytes+marker:jpeg' };
    }

    case 'png': {
      if (buf.length < 29 || !startsWithBytes(buf, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
        return { ok: false, status: 400, error: 'Signature biner PNG (89 50 4E 47) tidak valid.' };
      }
      if (!startsWithAscii(buf, 'IHDR', 12)) {
        return { ok: false, status: 400, error: 'Struktur PNG malformed: chunk IHDR tidak ditemukan.' };
      }
      const w = buf.readUInt32BE(16);
      const h = buf.readUInt32BE(20);
      if (w === 0 || h === 0 || w > 30000 || h > 30000) {
        return { ok: false, status: 400, error: 'Dimensi IHDR PNG tidak valid.' };
      }
      if (isFinalChunk) {
        const iendIdx = buf.lastIndexOf('IEND');
        if (iendIdx !== -1 && buf.length - (iendIdx + 8) > 128) {
          return {
            ok: false,
            status: 400,
            error: 'Integritas PNG ditolak: ditemukan data berlebih setelah chunk penutup IEND.',
          };
        }
      }
      return { ok: true, method: 'magic-bytes+ihdr:png' };
    }

    case 'webp': {
      if (
        buf.length < 20 ||
        !startsWithAscii(buf, 'RIFF', 0) ||
        !startsWithAscii(buf, 'WEBP', 8) ||
        !/^VP8[ LX]?$/.test(buf.subarray(12, 16).toString('ascii'))
      ) {
        return { ok: false, status: 400, error: 'Signature biner/header chunk WebP tidak valid.' };
      }
      return { ok: true, method: 'magic-bytes:webp' };
    }

    case 'avif': {
      const hasFtyp = startsWithAscii(buf, 'ftyp', 4);
      const brandSlice = buf.subarray(8, Math.min(buf.length, 32)).toString('ascii');
      if (!hasFtyp || !/(avif|avis|mif1)/i.test(brandSlice)) {
        return { ok: false, status: 400, error: 'Signature ISO-BMFF AVIF (ftyp/avif) tidak valid.' };
      }
      return { ok: true, method: 'magic-bytes:avif' };
    }

    case 'tif':
    case 'tiff': {
      const le = startsWithBytes(buf, [0x49, 0x49, 0x2a, 0x00]);
      const be = startsWithBytes(buf, [0x4d, 0x4d, 0x00, 0x2a]);
      if ((!le && !be) || buf.length < 16) {
        return { ok: false, status: 400, error: 'Signature biner TIFF (II*/MM*) tidak valid.' };
      }
      return { ok: true, method: 'magic-bytes:tiff' };
    }

    case 'svg':
      return validateSvgXml(buf, totalSize);

    case 'pdf': {
      const pdfHead = buf.subarray(0, Math.min(buf.length, 32)).toString('ascii');
      if (!pdfHead.includes('%PDF-')) {
        return { ok: false, status: 400, error: 'Signature biner PDF (%PDF-) tidak valid.' };
      }
      const pdfText = buf.toString('latin1');
      if (/\/(?:JavaScript|JS|Launch|RichMedia|OpenAction|AA|SubmitForm|ImportData|EmbeddedFiles|XFA)\b/i.test(pdfText)) {
        return {
          ok: false,
          status: 400,
          error: 'Berkas PDF ditolak: terdeteksi instruksi aksi otomatis atau skrip tertanam (/JavaScript, /OpenAction, /Launch, /AA).',
        };
      }
      if (isFinalChunk && !pdfText.includes('%%EOF')) {
        return { ok: false, status: 400, error: 'Struktur PDF malformed: penutup %%EOF tidak ditemukan.' };
      }
      return { ok: true, method: 'magic-bytes+action-scan:pdf' };
    }

    case 'zip':
      return validateZipArchive(buf, totalSize);

    case 'wav': {
      if (buf.length < 44 || !startsWithAscii(buf, 'RIFF', 0) || !startsWithAscii(buf, 'WAVE', 8)) {
        return { ok: false, status: 400, error: 'Signature/header biner audio WAV (RIFF/WAVE) tidak valid.' };
      }
      return { ok: true, method: 'magic-bytes:wav' };
    }

    case 'ogg': {
      if (buf.length < 28 || !startsWithAscii(buf, 'OggS', 0)) {
        return { ok: false, status: 400, error: 'Signature biner audio OGG (OggS) tidak valid.' };
      }
      return { ok: true, method: 'magic-bytes:ogg' };
    }

    case 'mp3': {
      const hasId3 = startsWithAscii(buf, 'ID3', 0);
      const hasMpegSync = buf.length >= 2 && buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0;
      if (!hasId3 && !hasMpegSync) {
        return { ok: false, status: 400, error: 'Signature biner audio MP3 (ID3 / MPEG frame sync) tidak valid.' };
      }
      return { ok: true, method: 'magic-bytes:mp3' };
    }

    case 'aac': {
      const hasAdts = buf.length >= 2 && buf[0] === 0xff && (buf[1] & 0xf0) === 0xf0;
      const hasMp4Aac = startsWithAscii(buf, 'ftyp', 4);
      if (!hasAdts && !hasMp4Aac) {
        return { ok: false, status: 400, error: 'Signature biner audio AAC (ADTS / M4A ftyp) tidak valid.' };
      }
      return { ok: true, method: 'magic-bytes:aac' };
    }

    case 'mp4': {
      if (buf.length < 16 || !startsWithAscii(buf, 'ftyp', 4)) {
        return { ok: false, status: 400, error: 'Signature biner video MP4 (ISO-BMFF ftyp) tidak valid.' };
      }
      return { ok: true, method: 'magic-bytes:mp4' };
    }

    case 'webm': {
      if (buf.length < 16 || !startsWithBytes(buf, [0x1a, 0x45, 0xdf, 0xa3])) {
        return { ok: false, status: 400, error: 'Signature biner video WebM (EBML) tidak valid.' };
      }
      return { ok: true, method: 'magic-bytes:webm' };
    }

    default:
      return { ok: false, status: 400, error: `Format '.${ext}' tidak memiliki validator integritas.` };
  }
}

/**
 * Create HMAC-SHA256 bound upload session token binding owner, fileId, immutable metadata & TTL.
 */
export function signUploadSession(payload, secret) {
  if (!secret || typeof secret !== 'string' || secret.length < 16) {
    throw new Error('Server UPLOAD_SESSION_SECRET tidak terkonfigurasi.');
  }
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

export function verifyUploadSession(token, secret, nowMs = Date.now()) {
  if (!token || typeof token !== 'string' || !token.includes('.')) {
    return { ok: false, status: 401, error: 'Token sesi unggahan tidak valid atau tidak disertakan.' };
  }
  if (!secret || typeof secret !== 'string' || secret.length < 16) {
    return { ok: false, status: 500, error: 'Konfigurasi rahasia sesi server tidak lengkap.' };
  }

  const parts = token.split('.');
  if (parts.length !== 2) {
    return { ok: false, status: 401, error: 'Format token sesi unggahan rusak.' };
  }

  const [encoded, providedSig] = parts;
  const expectedSig = crypto.createHmac('sha256', secret).update(encoded).digest('base64url');

  const a = Buffer.from(providedSig, 'utf8');
  const b = Buffer.from(expectedSig, 'utf8');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return { ok: false, status: 403, error: 'Signature token sesi unggahan tidak sah.' };
  }

  let session;
  try {
    session = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
  } catch {
    return { ok: false, status: 400, error: 'Payload token sesi tidak dapat dibaca.' };
  }

  if (!session?.sessionId || !session?.ownerUserId || !session?.fileId) {
    return { ok: false, status: 400, error: 'Token sesi kehilangan identitas kepemilikan atau file.' };
  }

  if (typeof session.expiresAt !== 'number' || nowMs > session.expiresAt) {
    return {
      ok: false,
      status: 410,
      expired: true,
      session,
      error: 'Sesi unggahan telah kedaluwarsa. Silakan mulai unggahan ulang.',
    };
  }

  return { ok: true, session };
}

/**
 * In-memory sliding window rate limiter for abuse protection within runtime containers.
 */
export class SlidingWindowRateLimiter {
  constructor() {
    this.buckets = new Map();
  }

  consume(key, maxHits, windowMs, nowMs = Date.now()) {
    if (this.buckets.size > 2000) {
      for (const [k, stamps] of this.buckets.entries()) {
        if (stamps.length === 0 || nowMs - stamps[stamps.length - 1] > windowMs) {
          this.buckets.delete(k);
        }
      }
    }
    const cutoff = nowMs - windowMs;
    const prev = this.buckets.get(key) || [];
    const active = prev.filter((t) => t > cutoff);
    if (active.length >= maxHits) {
      this.buckets.set(key, active);
      const retryAfterSec = Math.max(1, Math.ceil((active[0] + windowMs - nowMs) / 1000));
      return { allowed: false, remaining: 0, retryAfterSec };
    }
    active.push(nowMs);
    this.buckets.set(key, active);
    return { allowed: true, remaining: Math.max(0, maxHits - active.length), retryAfterSec: 0 };
  }
}

export function sanitizeErrorForClient(err, fallbackMsg = 'Terjadi kesalahan server internal.') {
  const status = typeof err?.status === 'number'
    ? err.status
    : typeof err?.code === 'number' && err.code >= 400 && err.code < 600
    ? err.code
    : 500;
  if (status < 500 && err?.message) {
    return { status, message: String(err.message).slice(0, 300) };
  }
  return { status: 500, message: fallbackMsg };
}

/**
 * Pure non-destructive reconciliation analyzer across Storage files, media_assets, junctions & audit_logs.
 */
export function reconcileMediaInventory({ storageFiles = [], assetRows = [], auditRows = [] }) {
  const assetById = new Map();
  for (const a of assetRows) {
    assetById.set(a.fileId || a.$id, a);
  }
  const storageById = new Map();
  for (const f of storageFiles) {
    storageById.set(f.$id, f);
  }

  const gatewayCreatedIds = new Set();
  for (const log of auditRows) {
    if (log.entityType === 'media_assets' && log.action === 'create') {
      try {
        const meta = JSON.parse(log.changesJson || '{}');
        if (meta.via === 'server-gateway') {
          gatewayCreatedIds.add(log.entityId);
        }
      } catch {}
    }
  }

  const storageWithoutMetadata = [];
  const incompleteUploads = [];
  const quarantinedFiles = [];
  const publicWithoutMetadata = [];

  for (const f of storageFiles) {
    const perms = Array.isArray(f.$permissions) ? f.$permissions : [];
    const isPub = perms.some((p) => typeof p === 'string' && p.trim() === 'read("any")');
    const hasMeta = assetById.has(f.$id);
    const incomplete =
      typeof f.chunksTotal === 'number' &&
      typeof f.chunksUploaded === 'number' &&
      f.chunksUploaded < f.chunksTotal;

    if (incomplete) {
      incompleteUploads.push({
        fileId: f.$id,
        name: f.name,
        chunksUploaded: f.chunksUploaded,
        chunksTotal: f.chunksTotal,
        createdAt: f.$createdAt,
      });
    }

    if (!hasMeta) {
      storageWithoutMetadata.push({
        fileId: f.$id,
        name: f.name,
        isPublic: isPub,
        permissions: perms,
        knownSeedSample: f.$id === 'public-motif-sample' || f.$id === 'private-kkn-archive',
      });
      if (isPub) {
        publicWithoutMetadata.push({ fileId: f.$id, name: f.name, permissions: perms });
      }
    }

    const qReason = getQuarantineReason({
      mimeType: f.mimeType,
      fileSizeBytes: f.sizeOriginal,
      chunksUploaded: f.chunksUploaded,
      chunksTotal: f.chunksTotal,
    });
    if (qReason) {
      quarantinedFiles.push({
        fileId: f.$id,
        name: f.name,
        mimeType: f.mimeType,
        sizeOriginal: f.sizeOriginal,
        reason: qReason,
        isPublic: isPub,
      });
    }
  }

  const metadataWithoutStorage = [];
  const missingAuditTrail = [];
  for (const a of assetRows) {
    const fid = a.fileId || a.$id;
    if (!storageById.has(fid)) {
      metadataWithoutStorage.push({ assetId: a.$id, fileId: fid, captionId: a.captionId });
    }
    if (!gatewayCreatedIds.has(a.$id)) {
      missingAuditTrail.push({ assetId: a.$id, fileId: fid });
    }
  }

  return {
    summary: {
      totalStorageFiles: storageFiles.length,
      totalMediaAssets: assetRows.length,
      storageWithoutMetadataCount: storageWithoutMetadata.length,
      metadataWithoutStorageCount: metadataWithoutStorage.length,
      incompleteUploadsCount: incompleteUploads.length,
      quarantinedFilesCount: quarantinedFiles.length,
      publicWithoutMetadataCount: publicWithoutMetadata.length,
      missingAuditTrailCount: missingAuditTrail.length,
    },
    storageWithoutMetadata,
    metadataWithoutStorage,
    incompleteUploads,
    quarantinedFiles,
    publicWithoutMetadata,
    missingAuditTrail,
  };
}
