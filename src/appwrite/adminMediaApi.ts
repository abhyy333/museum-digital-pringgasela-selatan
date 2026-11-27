import { account } from './client';
import { APPWRITE_CONFIG } from './config';
import { MediaAsset } from '../types/schema';

export const GATEWAY_CHUNK_BYTES = 5 * 1024 * 1024; // 5 MiB per chunk (up to 50 MB total)

const EXT_FALLBACK_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  avif: 'image/avif',
  tif: 'image/tiff',
  tiff: 'image/tiff',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  aac: 'audio/aac',
  ogg: 'audio/ogg',
  mp4: 'video/mp4',
  webm: 'video/webm',
  pdf: 'application/pdf',
  zip: 'application/zip',
};

export interface GatewayUploadResult {
  asset: MediaAsset;
  storagePermissions: string[];
  isPublic: boolean;
  quarantined?: boolean;
  quarantineReason?: string | null;
  integrityCheck?: string;
  antivirusCoverage?: string;
}

export interface GatewayPublishResult {
  fileId: string;
  isPublic: boolean;
  permissions: string[];
}

export class GatewayApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'GatewayApiError';
    this.status = status;
  }
}

async function createUserJwt(): Promise<string> {
  try {
    const res = await account.createJWT();
    if (!res?.jwt) {
      throw new Error('JWT kosong.');
    }
    return res.jwt;
  } catch (err: any) {
    throw new GatewayApiError(
      err?.message || 'Sesi autentikasi tidak aktif. Silakan masuk kembali sebelum melanjutkan.',
      401
    );
  }
}

function resolveMimeType(file: File): string {
  if (file.type && file.type.trim().length > 0) {
    return file.type.split(';')[0].trim().toLowerCase();
  }
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  return EXT_FALLBACK_MIME[ext] || 'application/octet-stream';
}

async function parseGatewayJson(response: Response): Promise<any> {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { error: text || `Kesalahan HTTP ${response.status}` };
  }
}

async function computeSha256Hex(blob: Blob): Promise<string | null> {
  try {
    if (typeof crypto === 'undefined' || !crypto.subtle) return null;
    const buffer = await blob.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  } catch {
    return null;
  }
}

async function fetchWithBoundedRetry(
  url: string,
  init: RequestInit,
  maxTransientRetries = 2
): Promise<Response> {
  let attempt = 0;
  while (true) {
    try {
      const res = await fetch(url, init);
      if (res.status < 502 || attempt >= maxTransientRetries) {
        return res;
      }
    } catch (err) {
      if (attempt >= maxTransientRetries) {
        throw err;
      }
    }
    attempt += 1;
    await new Promise((resolve) => setTimeout(resolve, 600 * attempt));
  }
}

/**
 * Upload media exclusively via the server-authoritative Appwrite Function gateway.
 * Files are split into <= 5 MiB binary chunks with HMAC-bound session tokens, strict chunk
 * ordering, and single-chunk SHA-256 integrity verification.
 */
export async function uploadMediaViaGateway(params: {
  file: File;
  captionId?: string;
  captionEn?: string;
  photographer?: string;
  isPublicIntent?: boolean;
  onProgress?: (percent: number) => void;
  onStatusChange?: (stage: string) => void;
}): Promise<GatewayUploadResult> {
  const {
    file,
    captionId,
    captionEn,
    photographer,
    isPublicIntent = false,
    onProgress,
    onStatusChange,
  } = params;
  const totalSize = file.size;
  if (totalSize <= 0) {
    throw new GatewayApiError('Berkas kosong tidak dapat diunggah.', 400);
  }

  onStatusChange?.('Menyiapkan sesi autentikasi & validasi berkas...');
  const jwt = await createUserJwt();
  const mimeType = resolveMimeType(file);
  const totalChunks = Math.max(1, Math.ceil(totalSize / GATEWAY_CHUNK_BYTES));
  let uploadId = '';
  let sessionToken = '';

  let singleChunkSha256: string | null = null;
  if (totalChunks === 1) {
    onStatusChange?.('Menghitung checksum SHA-256...');
    singleChunkSha256 = await computeSha256Hex(file);
  }

  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex += 1) {
    const start = chunkIndex * GATEWAY_CHUNK_BYTES;
    const endExclusive = Math.min(totalSize, start + GATEWAY_CHUNK_BYTES);
    const end = endExclusive - 1;
    const chunkBlob = file.slice(start, endExclusive, mimeType);
    const isFinalChunk = chunkIndex === totalChunks - 1;

    onStatusChange?.(
      totalChunks === 1
        ? 'Mengirim & memvalidasi berkas di server...'
        : isFinalChunk
        ? `Mengunggah potongan akhir (${chunkIndex + 1}/${totalChunks}) & finalisasi...`
        : `Mengunggah potongan ${chunkIndex + 1}/${totalChunks}...`
    );

    const headers: Record<string, string> = {
      Authorization: `Bearer ${jwt}`,
      'X-Appwrite-Project': APPWRITE_CONFIG.projectId,
      'Content-Type': 'application/octet-stream',
      'Content-Range': `bytes ${start}-${end}/${totalSize}`,
      'X-File-Name': encodeURIComponent(file.name),
      'X-File-Mime': mimeType,
      'X-File-Size': String(totalSize),
      'X-Is-Public': String(Boolean(isPublicIntent)),
    };

    if (singleChunkSha256) {
      headers['X-File-Sha256'] = singleChunkSha256;
    }

    if (uploadId) {
      headers['X-Upload-File-Id'] = uploadId;
    }
    if (sessionToken) {
      headers['X-Upload-Session-Token'] = sessionToken;
    }

    if (isFinalChunk) {
      if (captionId) headers['X-Caption-Id'] = encodeURIComponent(captionId);
      if (captionEn) headers['X-Caption-En'] = encodeURIComponent(captionEn);
      if (photographer) headers['X-Photographer'] = encodeURIComponent(photographer);
    }

    const res = await fetchWithBoundedRetry(`${APPWRITE_CONFIG.adminMediaGatewayUrl}/upload-chunk`, {
      method: 'POST',
      headers,
      body: chunkBlob,
    });

    const data = await parseGatewayJson(res);
    if (!res.ok) {
      // Never retain or resume stale upload session token after 401/410 auth/session expiration
      if (res.status === 401 || res.status === 410) {
        uploadId = '';
        sessionToken = '';
      }
      throw new GatewayApiError(
        data?.error || data?.message || `Unggahan ditolak server (HTTP ${res.status}).`,
        res.status
      );
    }

    const percent = Math.min(99, Math.round((endExclusive / totalSize) * 100));
    onProgress?.(data?.completed ? 100 : percent);

    if (data?.completed) {
      onStatusChange?.('Unggahan selesai & tercatat di server.');
      return {
        asset: data.asset as MediaAsset,
        storagePermissions: Array.isArray(data.storagePermissions) ? data.storagePermissions : [],
        isPublic: Boolean(data.isPublic),
        quarantined: Boolean(data.quarantined),
        quarantineReason: data.quarantineReason ?? null,
        integrityCheck: data.integrityCheck,
        antivirusCoverage: data.antivirusCoverage,
      };
    }

    if (data?.uploadId) {
      uploadId = String(data.uploadId);
    }
    if (data?.sessionToken) {
      sessionToken = String(data.sessionToken);
    }
  }

  throw new GatewayApiError('Unggahan selesai tanpa konfirmasi metadata dari server.', 500);
}

/**
 * Authorize publication or revocation of a Storage media file through the Server SDK gateway.
 */
export async function setMediaVisibilityViaGateway(
  fileId: string,
  makePublic: boolean
): Promise<GatewayPublishResult> {
  const jwt = await createUserJwt();
  const action = makePublic ? 'publish' : 'unpublish';
  const res = await fetch(`${APPWRITE_CONFIG.adminMediaGatewayUrl}/media/${encodeURIComponent(fileId)}/${action}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${jwt}`,
      'X-Appwrite-Project': APPWRITE_CONFIG.projectId,
    },
  });

  const data = await parseGatewayJson(res);
  if (!res.ok) {
    throw new GatewayApiError(
      data?.error || data?.message || `Gagal memperbarui status akses media (HTTP ${res.status}).`,
      res.status
    );
  }

  return {
    fileId: String(data.fileId || fileId),
    isPublic: Boolean(data.isPublic),
    permissions: Array.isArray(data.permissions) ? data.permissions : [],
  };
}

export interface GatewayStorageFileSummary {
  $id: string;
  name: string;
  mimeType: string;
  sizeOriginal: number;
  $createdAt: string;
  $updatedAt: string;
  $permissions: string[];
  isPublic: boolean;
  quarantined?: boolean;
  quarantineReason?: string | null;
  chunksUploaded?: number;
  chunksTotal?: number;
}

/**
 * Fetch authentic Storage file inventory & actual file permissions via authenticated Server Gateway.
 * Keeps AdminMediaPage & EntityMediaManager functional even with zero bucket-level ACL permissions.
 */
export async function listMediaFilesViaGateway(): Promise<GatewayStorageFileSummary[]> {
  const jwt = await createUserJwt();
  const res = await fetch(`${APPWRITE_CONFIG.adminMediaGatewayUrl}/media`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${jwt}`,
      'X-Appwrite-Project': APPWRITE_CONFIG.projectId,
    },
  });

  const data = await parseGatewayJson(res);
  if (!res.ok) {
    throw new GatewayApiError(
      data?.error || data?.message || `Gagal memuat daftar media melalui server gateway (HTTP ${res.status}).`,
      res.status
    );
  }

  return Array.isArray(data?.files) ? (data.files as GatewayStorageFileSummary[]) : [];
}

/**
 * Super Admin exclusive permanent deletion (cleans gallery links, Storage file, media_assets, audit_logs).
 */
export async function deleteMediaViaGateway(fileId: string): Promise<void> {
  const jwt = await createUserJwt();
  const res = await fetch(`${APPWRITE_CONFIG.adminMediaGatewayUrl}/media/${encodeURIComponent(fileId)}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${jwt}`,
      'X-Appwrite-Project': APPWRITE_CONFIG.projectId,
    },
  });

  const data = await parseGatewayJson(res);
  if (!res.ok) {
    throw new GatewayApiError(
      data?.error || data?.message || `Gagal menghapus media melalui server gateway (HTTP ${res.status}).`,
      res.status
    );
  }
}

export interface GatewayReconcileReport {
  summary: {
    totalStorageFiles: number;
    totalMediaAssets: number;
    storageWithoutMetadataCount: number;
    metadataWithoutStorageCount: number;
    incompleteUploadsCount: number;
    quarantinedFilesCount: number;
    publicWithoutMetadataCount: number;
    missingAuditTrailCount: number;
  };
  storageWithoutMetadata: Array<{
    fileId: string;
    name: string;
    isPublic: boolean;
    permissions: string[];
    knownSeedSample: boolean;
  }>;
  metadataWithoutStorage: Array<{ assetId: string; fileId: string; captionId?: string }>;
  incompleteUploads: Array<{
    fileId: string;
    name: string;
    chunksUploaded: number;
    chunksTotal: number;
    createdAt?: string;
  }>;
  quarantinedFiles: Array<{
    fileId: string;
    name: string;
    mimeType: string;
    sizeOriginal: number;
    reason: string;
    isPublic: boolean;
  }>;
  publicWithoutMetadata: Array<{ fileId: string; name: string; permissions: string[] }>;
  missingAuditTrail: Array<{ assetId: string; fileId: string }>;
}

/**
 * Inspect live Storage <-> media_assets <-> quarantine reconciliation report (Admin Desa / Super Admin).
 */
export async function reconcileMediaViaGateway(): Promise<GatewayReconcileReport> {
  const jwt = await createUserJwt();
  const res = await fetch(`${APPWRITE_CONFIG.adminMediaGatewayUrl}/media/reconcile`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${jwt}`,
      'X-Appwrite-Project': APPWRITE_CONFIG.projectId,
    },
  });

  const data = await parseGatewayJson(res);
  if (!res.ok) {
    throw new GatewayApiError(
      data?.error || data?.message || `Gagal menjalankan rekonsiliasi media (HTTP ${res.status}).`,
      res.status
    );
  }
  return data as GatewayReconcileReport;
}
