import { ID, Permission, Role } from 'appwrite';
import { tablesDB } from '../appwrite/client';
import { APPWRITE_CONFIG } from '../appwrite/config';

/**
 * Generates standard TablesDB row permissions compatible with all team roles (including Admin KKN).
 * Note: Table-level ACLs on Appwrite already grant update to 'team:museum-admins/desa' & 'owner',
 * and delete exclusively to 'team:museum-admins/owner'. Do NOT add 'owner' permission from non-owner client calls.
 */
export function buildCreatorRowPermissions(userId: string): string[] {
  return [
    Permission.read(Role.team(APPWRITE_CONFIG.adminTeamId)),
    Permission.update(Role.user(userId)),
  ];
}

export async function recordAuditLog(params: {
  actorUserId: string;
  action: 'create' | 'update' | 'publish' | 'unpublish' | 'archive' | 'delete';
  entityType: string;
  entityId: string;
  changes?: Record<string, unknown>;
}): Promise<void> {
  try {
    await tablesDB.createRow(
      APPWRITE_CONFIG.databaseId,
      'audit_logs',
      ID.unique(),
      {
        actorUserId: params.actorUserId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        changesJson: params.changes ? JSON.stringify(params.changes).slice(0, 4000) : null,
      },
      [Permission.read(Role.team(APPWRITE_CONFIG.adminTeamId))]
    );
  } catch (err) {
    // Non-blocking audit logging
    console.warn('Audit log skipped:', err);
  }
}

export function formatAppwriteError(err: any, refreshAuth?: () => Promise<void>): string {
  if (err?.code === 401) {
    if (refreshAuth) {
      refreshAuth().catch(() => {});
    }
    return 'Sesi atau hak akses Anda tidak memadai / telah kedaluwarsa (HTTP 401). Silakan periksa peran akun atau login ulang.';
  }
  if (err?.code === 409) {
    return 'Slug atau pengenal unik sudah digunakan oleh arsip lain. Gunakan slug yang berbeda.';
  }
  return err?.message || 'Terjadi kendala saat menyimpan ke Appwrite.';
}
