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
  const status = typeof err?.status === 'number' ? err.status : err?.code;
  const serverMsg = typeof err?.message === 'string' && err.message.trim() ? err.message.trim() : '';

  if (status === 401) {
    if (refreshAuth) {
      refreshAuth().catch(() => {});
    }
    return 'Sesi autentikasi telah kedaluwarsa atau tidak sah (HTTP 401). Silakan masuk ulang dan mulai operasi dari awal.';
  }
  if (status === 403) {
    return (
      serverMsg ||
      'Akses ditolak (HTTP 403): peran akun Anda tidak memiliki wewenang untuk tindakan ini.'
    );
  }
  if (status === 409) {
    return (
      serverMsg ||
      'Terjadi konflik data atau urutan chunk unggahan (HTTP 409). Muat ulang halaman sebelum mencoba kembali.'
    );
  }
  if (status === 410) {
    return (
      serverMsg ||
      'Sesi unggahan server telah kedaluwarsa (HTTP 410). Silakan mulai unggahan ulang dari awal.'
    );
  }
  if (status === 413) {
    return (
      serverMsg ||
      'Ukuran berkas melebihi batas yang diizinkan server (HTTP 413).'
    );
  }
  if (status === 422) {
    return (
      serverMsg ||
      'Berkas dikarantina atau gagal verifikasi integritas server (HTTP 422).'
    );
  }
  if (status === 429) {
    return (
      serverMsg ||
      'Terlalu banyak permintaan dalam waktu singkat (HTTP 429). Tunggu beberapa saat lalu coba lagi.'
    );
  }
  return serverMsg || 'Terjadi kendala saat berkomunikasi dengan server Appwrite.';
}
