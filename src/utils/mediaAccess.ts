import { Permission, Role } from 'appwrite';
import {
  GatewayStorageFileSummary,
  listMediaFilesViaGateway,
  setMediaVisibilityViaGateway,
} from '../appwrite/adminMediaApi';
import { APPWRITE_CONFIG } from '../appwrite/config';
import { formatAppwriteError } from './audit';

export type StorageFileSummary = GatewayStorageFileSummary;

export interface StorageAccessInfo {
  fileId: string;
  exists: boolean;
  isPublic: boolean;
  permissions: string[];
  name?: string;
  mimeType?: string;
  sizeOriginal?: number;
  quarantined?: boolean;
  quarantineReason?: string | null;
}

export function isStorageFilePublic(permissions?: string[] | null): boolean {
  if (!Array.isArray(permissions)) return false;
  return permissions.some((p) => typeof p === 'string' && p.trim() === 'read("any")');
}

/**
 * Default permissions for newly uploaded media files:
 * Strictly read-only for museum-admins team members. No client update or delete permission.
 */
export function buildPrivateMediaPermissions(): string[] {
  return [Permission.read(Role.team(APPWRITE_CONFIG.adminTeamId))];
}

/**
 * Explicit public media permissions (only assigned by Admin Desa / Super Admin via Server Gateway).
 */
export function buildPublicMediaPermissions(): string[] {
  return [
    Permission.read(Role.any()),
    Permission.read(Role.team(APPWRITE_CONFIG.adminTeamId)),
  ];
}

export async function fetchBucketFileAccessMap(): Promise<{
  byId: Map<string, StorageAccessInfo>;
  files: StorageFileSummary[];
}> {
  const byId = new Map<string, StorageAccessInfo>();
  try {
    const files = await listMediaFilesViaGateway();
    for (const f of files) {
      const perms = f.$permissions || [];
      byId.set(f.$id, {
        fileId: f.$id,
        exists: true,
        isPublic: isStorageFilePublic(perms),
        permissions: perms,
        name: f.name,
        mimeType: f.mimeType,
        sizeOriginal: f.sizeOriginal,
        quarantined: Boolean(f.quarantined),
        quarantineReason: f.quarantineReason ?? null,
      });
    }
    return { byId, files };
  } catch {
    return { byId, files: [] };
  }
}

export async function getStorageFileAccess(fileId: string): Promise<StorageAccessInfo> {
  if (!fileId) {
    return { fileId: '', exists: false, isPublic: false, permissions: [] };
  }
  const { byId } = await fetchBucketFileAccessMap();
  return byId.get(fileId) || { fileId, exists: false, isPublic: false, permissions: [] };
}

export async function setMediaFilePublicAccess(params: {
  fileId: string;
  makePublic: boolean;
  actorUserId: string;
  canPublish: boolean;
  refreshAuth?: () => Promise<void>;
}): Promise<StorageAccessInfo> {
  if (!params.canPublish) {
    throw new Error(
      'Hanya Admin Desa atau Super Admin yang berwenang mempublikasikan atau mencabut akses publik berkas media.'
    );
  }

  try {
    const gatewayRes = await setMediaVisibilityViaGateway(params.fileId, params.makePublic);

    if (gatewayRes.isPublic !== params.makePublic) {
      throw new Error(
        'Verifikasi permission Appwrite Storage di server tidak sesuai permintaan. Status publikasi tidak diubah.'
      );
    }

    return {
      fileId: gatewayRes.fileId,
      exists: true,
      isPublic: gatewayRes.isPublic,
      permissions: gatewayRes.permissions,
    };
  } catch (err: any) {
    throw new Error(formatAppwriteError(err, params.refreshAuth));
  }
}
