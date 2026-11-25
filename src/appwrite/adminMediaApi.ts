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

/**
 * Upload media exclusively via the server-authoritative Appwrite Function gateway.
 * Files are split into <= 5 MiB binary chunks so large audio/video (<= 50 MB) stream
 * cleanly without holding base64 payloads or direct bucket `create` ACL permissions.
 */
export async function uploadMediaViaGateway(params: {
  file: File;
  captionId?: string;
  captionEn?: string;
  photographer?: string;
  isPublicIntent?: boolean;
  onProgress?: (percent: number) => void;
}): Promise<GatewayUploadResult> {
  const { file, captionId, captionEn, photographer, isPublicIntent = false, onProgress } = params;
  const totalSize = file.size;
  if (totalSize <= 0) {
    throw new GatewayApiError('Berkas kosong tidak dapat diunggah.', 400);
  }

  const jwt = await createUserJwt();
  const mimeType = resolveMimeType(file);
  const totalChunks = Math.max(1, Math.ceil(totalSize / GATEWAY_CHUNK_BYTES));
  let uploadId = '';

  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex += 1) {
    const start = chunkIndex * GATEWAY_CHUNK_BYTES;
    const endExclusive = Math.min(totalSize, start + GATEWAY_CHUNK_BYTES);
    const end = endExclusive - 1;
    const chunkBlob = file.slice(start, endExclusive, mimeType);

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

    if (uploadId) {
      headers['X-Upload-File-Id'] = uploadId;
    }

    if (chunkIndex === totalChunks - 1) {
      if (captionId) headers['X-Caption-Id'] = encodeURIComponent(captionId);
      if (captionEn) headers['X-Caption-En'] = encodeURIComponent(captionEn);
      if (photographer) headers['X-Photographer'] = encodeURIComponent(photographer);
    }

    const res = await fetch(`${APPWRITE_CONFIG.adminMediaGatewayUrl}/upload-chunk`, {
      method: 'POST',
      headers,
      body: chunkBlob,
    });

    const data = await parseGatewayJson(res);
    if (!res.ok) {
      throw new GatewayApiError(
        data?.error || data?.message || `Unggahan ditolak server (HTTP ${res.status}).`,
        res.status
      );
    }

    const percent = Math.min(99, Math.round((endExclusive / totalSize) * 100));
    onProgress?.(data?.completed ? 100 : percent);

    if (data?.completed) {
      return {
        asset: data.asset as MediaAsset,
        storagePermissions: Array.isArray(data.storagePermissions) ? data.storagePermissions : [],
        isPublic: Boolean(data.isPublic),
      };
    }

    if (data?.uploadId) {
      uploadId = String(data.uploadId);
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
