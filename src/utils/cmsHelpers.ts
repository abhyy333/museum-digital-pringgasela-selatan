import { ID, Permission, Query, Role } from 'appwrite';
import { tablesDB } from '../appwrite/client';
import { APPWRITE_CONFIG } from '../appwrite/config';
import { GalleryDraftItem } from '../components/admin/EntityMediaManager';
import { MediaAsset } from '../types/schema';
import { buildCreatorRowPermissions } from './audit';

export type MediaEntityKind = 'motif' | 'craft' | 'culture';

const MEDIA_TABLE_MAP: Record<
  MediaEntityKind,
  { tableId: string; foreignKey: string; translationTableId: string; entityTableId: string }
> = {
  motif: {
    tableId: 'motif_media',
    foreignKey: 'motifId',
    translationTableId: 'motif_translations',
    entityTableId: 'weaving_motifs',
  },
  craft: {
    tableId: 'craft_media',
    foreignKey: 'craftId',
    translationTableId: 'craft_translations',
    entityTableId: 'crafts',
  },
  culture: {
    tableId: 'culture_media',
    foreignKey: 'cultureId',
    translationTableId: 'culture_translations',
    entityTableId: 'cultures',
  },
};

export async function loadEntityGallery(
  kind: MediaEntityKind,
  entityId: string
): Promise<GalleryDraftItem[]> {
  const cfg = MEDIA_TABLE_MAP[kind];
  const relRes = await tablesDB.listRows(APPWRITE_CONFIG.databaseId, cfg.tableId, [
    Query.equal(cfg.foreignKey, entityId),
    Query.orderAsc('sortOrder'),
    Query.limit(50),
  ]);

  if (relRes.rows.length === 0) return [];

  const assetIds = Array.from(
    new Set(relRes.rows.map((r: any) => r.mediaAssetId).filter(Boolean))
  );
  const assetMap = new Map<string, MediaAsset>();
  if (assetIds.length > 0) {
    try {
      const assetsRes = await tablesDB.listRows(APPWRITE_CONFIG.databaseId, 'media_assets', [
        Query.equal('$id', assetIds),
        Query.limit(50),
      ]);
      for (const asset of assetsRes.rows as unknown as MediaAsset[]) {
        assetMap.set(asset.$id, asset);
      }
    } catch {
      // Ignore batch metadata lookup failure safely
    }
  }

  return relRes.rows.map((r: any, idx: number) => {
    const asset = assetMap.get(r.mediaAssetId);
    return {
      relationId: r.$id,
      mediaAssetId: r.mediaAssetId,
      fileId: asset?.fileId || r.mediaAssetId,
      mediaType: asset?.mediaType || 'image',
      captionId: asset?.captionId || null,
      sortOrder: typeof r.sortOrder === 'number' ? r.sortOrder : idx,
      isPatternDiagram: Boolean(r.isPatternDiagram),
      isAudioChant: Boolean(r.isAudioChant),
      role: r.role || (idx === 0 ? 'cover' : 'gallery'),
    };
  });
}

export async function syncEntityGallery(
  kind: MediaEntityKind,
  entityId: string,
  items: GalleryDraftItem[],
  userId: string
): Promise<void> {
  const cfg = MEDIA_TABLE_MAP[kind];
  const existingRes = await tablesDB.listRows(APPWRITE_CONFIG.databaseId, cfg.tableId, [
    Query.equal(cfg.foreignKey, entityId),
    Query.limit(50),
  ]);

  const existingRows = existingRes.rows as any[];
  const keptRelationIds = new Set(items.map((i) => i.relationId).filter(Boolean));

  // Remove detached relations
  for (const row of existingRows) {
    if (!keptRelationIds.has(row.$id)) {
      await tablesDB.deleteRow(APPWRITE_CONFIG.databaseId, cfg.tableId, row.$id);
    }
  }

  // Create or update ordered items
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const basePayload: Record<string, any> = {
      [cfg.foreignKey]: entityId,
      mediaAssetId: item.mediaAssetId,
      sortOrder: i,
    };

    if (kind === 'motif') {
      basePayload.isPatternDiagram = Boolean(item.isPatternDiagram);
    } else if (kind === 'craft') {
      basePayload.role = item.role || (i === 0 ? 'cover' : 'gallery');
    } else if (kind === 'culture') {
      basePayload.isAudioChant = Boolean(item.isAudioChant);
    }

    if (item.relationId && existingRows.some((r) => r.$id === item.relationId)) {
      await tablesDB.updateRow(
        APPWRITE_CONFIG.databaseId,
        cfg.tableId,
        item.relationId,
        basePayload
      );
    } else {
      await tablesDB.createRow(
        APPWRITE_CONFIG.databaseId,
        cfg.tableId,
        ID.unique(),
        basePayload,
        [...buildCreatorRowPermissions(userId), Permission.delete(Role.user(userId))]
      );
    }
  }
}

export async function cascadeDeleteEntityChildren(
  kind: MediaEntityKind | 'history',
  entityId: string
): Promise<void> {
  if (kind === 'history') {
    const trans = await tablesDB.listRows(APPWRITE_CONFIG.databaseId, 'history_translations', [
      Query.equal('historyId', entityId),
      Query.limit(20),
    ]);
    for (const row of trans.rows) {
      await tablesDB.deleteRow(APPWRITE_CONFIG.databaseId, 'history_translations', row.$id);
    }
    return;
  }

  const cfg = MEDIA_TABLE_MAP[kind];
  const [transRes, mediaRes] = await Promise.all([
    tablesDB.listRows(APPWRITE_CONFIG.databaseId, cfg.translationTableId, [
      Query.equal(cfg.foreignKey, entityId),
      Query.limit(20),
    ]),
    tablesDB.listRows(APPWRITE_CONFIG.databaseId, cfg.tableId, [
      Query.equal(cfg.foreignKey, entityId),
      Query.limit(50),
    ]),
  ]);

  for (const row of transRes.rows) {
    await tablesDB.deleteRow(APPWRITE_CONFIG.databaseId, cfg.translationTableId, row.$id);
  }
  for (const row of mediaRes.rows) {
    await tablesDB.deleteRow(APPWRITE_CONFIG.databaseId, cfg.tableId, row.$id);
  }
}

export function saveDraftToSession(key: string, payload: Record<string, unknown>): void {
  try {
    sessionStorage.setItem(`museum_draft_${key}`, JSON.stringify(payload));
  } catch {
    // Ignore storage quota errors
  }
}

export function loadDraftFromSession<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(`museum_draft_${key}`);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function clearDraftFromSession(key: string): void {
  try {
    sessionStorage.removeItem(`museum_draft_${key}`);
  } catch {
    // Ignore
  }
}

export function slugifyInput(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}
