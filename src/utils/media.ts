import { APPWRITE_CONFIG } from '../appwrite/config';
import { ResolvedMediaItem } from '../types/schema';

export function resolveMediaFileId(item?: Partial<ResolvedMediaItem> | null): string {
  if (!item) return '';
  return item.fileId || item.mediaAssetId || '';
}

export function getFileViewUrl(fileId?: string | null): string {
  if (!fileId) return '';
  return `${APPWRITE_CONFIG.endpoint}/storage/buckets/${APPWRITE_CONFIG.storageBucketId}/files/${fileId}/view?project=${APPWRITE_CONFIG.projectId}`;
}

/**
 * Returns a direct view URL compatible with Appwrite Cloud Starter/Free tier
 * (Appwrite Starter blocks /preview image transformations with HTTP 403).
 */
export function getFilePreviewUrl(
  fileId?: string | null,
  _options: { width?: number; height?: number; quality?: number } = {}
): string {
  return getFileViewUrl(fileId);
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Fallback cultural imagery patterns based on entity type
export function getFallbackImage(type: 'motif' | 'craft' | 'culture' | 'history' | 'profile'): string {
  switch (type) {
    case 'motif':
      return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%23F2ECE7"/><pattern id="p" width="80" height="80" patternUnits="userSpaceOnUse"><polygon points="40,10 70,40 40,70 10,40" fill="none" stroke="%23984323" stroke-width="2"/><polygon points="40,22 58,40 40,58 22,40" fill="%23243A4A" opacity="0.22"/><circle cx="40" cy="40" r="4" fill="%23984323"/></pattern><rect width="600" height="400" fill="url(%23p)"/><text x="50%" y="85%" font-family="Georgia" font-size="20" fill="%23984323" text-anchor="middle" font-weight="bold">MOTIF TENUN PRINGGASELA</text></svg>`;
    case 'craft':
      return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%23F8F3EE"/><pattern id="c" width="40" height="40" patternUnits="userSpaceOnUse"><line x1="0" y1="0" x2="40" y2="40" stroke="%23806B58" stroke-width="1.5"/><line x1="40" y1="0" x2="0" y2="40" stroke="%23806B58" stroke-width="1.5"/></pattern><rect width="600" height="400" fill="url(%23c)"/><text x="50%" y="85%" font-family="Georgia" font-size="20" fill="%23984323" text-anchor="middle" font-weight="bold">KERAJINAN TEKSTIL SASAK</text></svg>`;
    case 'culture':
      return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%23F5EAE3"/><circle cx="300" cy="180" r="90" fill="none" stroke="%23984323" stroke-width="3"/><circle cx="300" cy="180" r="70" fill="none" stroke="%23243A4A" stroke-width="1.5"/><text x="50%" y="85%" font-family="Georgia" font-size="20" fill="%23984323" text-anchor="middle" font-weight="bold">TRADISI BUDAYA PRINGGASELA</text></svg>`;
    case 'history':
      return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%23E9DFD0"/><rect x="80" y="60" width="440" height="260" fill="none" stroke="%23984323" stroke-width="2"/><text x="50%" y="85%" font-family="Georgia" font-size="20" fill="%23984323" text-anchor="middle" font-weight="bold">ARSIP SEJARAH DESA</text></svg>`;
    default:
      return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="%23E9DFD0"/><circle cx="100" cy="80" r="40" fill="%23C9B69C"/><path d="M40,170 C40,130 160,130 160,170" fill="%23C9B69C"/></svg>`;
  }
}
