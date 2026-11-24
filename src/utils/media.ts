import { APPWRITE_CONFIG } from '../appwrite/config';

export function getFileViewUrl(fileId?: string | null): string {
  if (!fileId) return '';
  return `${APPWRITE_CONFIG.endpoint}/storage/buckets/${APPWRITE_CONFIG.storageBucketId}/files/${fileId}/view?project=${APPWRITE_CONFIG.projectId}`;
}

export function getFilePreviewUrl(
  fileId?: string | null,
  options: { width?: number; height?: number; quality?: number } = {}
): string {
  if (!fileId) return '';
  const params = new URLSearchParams({
    project: APPWRITE_CONFIG.projectId,
    output: 'webp',
  });
  if (options.width) params.append('width', options.width.toString());
  if (options.height) params.append('height', options.height.toString());
  if (options.quality) params.append('quality', options.quality.toString());

  return `${APPWRITE_CONFIG.endpoint}/storage/buckets/${APPWRITE_CONFIG.storageBucketId}/files/${fileId}/preview?${params.toString()}`;
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
      // Elegant SVG pattern data URL for Sasak stepped rhombus geometry
      return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%23F2ECE7"/><pattern id="p" width="80" height="80" patternUnits="userSpaceOnUse"><polygon points="40,10 70,40 40,70 10,40" fill="none" stroke="%2379543B" stroke-width="2"/><polygon points="40,22 58,40 40,58 22,40" fill="%23B86B4B" opacity="0.3"/><circle cx="40" cy="40" r="4" fill="%2379543B"/></pattern><rect width="600" height="400" fill="url(%23p)"/><text x="50%" y="85%" font-family="Georgia" font-size="20" fill="%2379543B" text-anchor="middle" font-weight="bold">MOTIF TENUN PRINGGASELA</text></svg>`;
    case 'craft':
      return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%23F8F3EE"/><pattern id="c" width="40" height="40" patternUnits="userSpaceOnUse"><line x1="0" y1="0" x2="40" y2="40" stroke="%23A47752" stroke-width="1.5"/><line x1="40" y1="0" x2="0" y2="40" stroke="%23A47752" stroke-width="1.5"/></pattern><rect width="600" height="400" fill="url(%23c)"/><text x="50%" y="85%" font-family="Georgia" font-size="20" fill="%2379543B" text-anchor="middle" font-weight="bold">KERAJINAN TEKSTIL SASAK</text></svg>`;
    case 'culture':
      return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%23FAEDE7"/><circle cx="300" cy="180" r="90" fill="none" stroke="%23B86B4B" stroke-width="3"/><circle cx="300" cy="180" r="70" fill="none" stroke="%2379543B" stroke-width="1.5"/><text x="50%" y="85%" font-family="Georgia" font-size="20" fill="%23B86B4B" text-anchor="middle" font-weight="bold">TRADISI BUDAYA PRINGGASELA</text></svg>`;
    case 'history':
      return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%23EFEAE1"/><rect x="80" y="60" width="440" height="260" fill="none" stroke="%2379543B" stroke-width="2"/><text x="50%" y="85%" font-family="Georgia" font-size="20" fill="%2379543B" text-anchor="middle" font-weight="bold">ARSIP SEJARAH DESA</text></svg>`;
    default:
      return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="%23EFEAE1"/><circle cx="100" cy="80" r="40" fill="%23C9BEAD"/><path d="M40,170 C40,130 160,130 160,170" fill="%23C9BEAD"/></svg>`;
  }
}
