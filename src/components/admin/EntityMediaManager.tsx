import React, { useEffect, useState } from 'react';
import {
  ArrowUp,
  ArrowDown,
  Trash2,
  Star,
  Upload,
  FolderOpen,
  Lock,
  Globe,
  ShieldAlert,
} from 'lucide-react';
import { Query } from 'appwrite';
import { tablesDB } from '../../appwrite/client';
import { APPWRITE_CONFIG } from '../../appwrite/config';
import { useAuth } from '../../context/AuthContext';
import { MediaAsset } from '../../types/schema';
import { formatBytes } from '../../utils/media';
import {
  fetchBucketFileAccessMap,
  setMediaFilePublicAccess,
  StorageAccessInfo,
} from '../../utils/mediaAccess';
import { MediaUploader } from './MediaUploader';
import { AuthorizedMediaPreview } from '../common/AuthorizedMediaPreview';

export interface GalleryDraftItem {
  relationId?: string;
  mediaAssetId: string;
  fileId: string;
  mediaType: string;
  captionId?: string | null;
  sortOrder: number;
  isPatternDiagram?: boolean;
  isAudioChant?: boolean;
  role?: 'cover' | 'gallery' | 'process' | 'close_up';
}

interface EntityMediaManagerProps {
  entityType: 'motif' | 'craft' | 'culture';
  items: GalleryDraftItem[];
  onChange: (items: GalleryDraftItem[]) => void;
}

export const EntityMediaManager: React.FC<EntityMediaManagerProps> = ({
  entityType,
  items,
  onChange,
}) => {
  const { user, canPublish, refreshAuth } = useAuth();
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [libraryAssets, setLibraryAssets] = useState<MediaAsset[]>([]);
  const [accessMap, setAccessMap] = useState<Map<string, StorageAccessInfo>>(new Map());
  const [loadingLib, setLoadingLib] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [statusNote, setStatusNote] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const refreshAccessMap = async () => {
    const res = await fetchBucketFileAccessMap();
    setAccessMap(res.byId);
  };

  useEffect(() => {
    refreshAccessMap();
  }, [items.length]);

  const loadLibrary = async () => {
    try {
      setLoadingLib(true);
      const [assetsRes, bucketRes] = await Promise.all([
        tablesDB.listRows(APPWRITE_CONFIG.databaseId, 'media_assets', [
          Query.limit(50),
          Query.orderDesc('$createdAt'),
        ]),
        fetchBucketFileAccessMap(),
      ]);
      setLibraryAssets(assetsRes.rows as unknown as MediaAsset[]);
      setAccessMap(bucketRes.byId);
    } catch {
      // ignore silently
    } finally {
      setLoadingLib(false);
    }
  };

  useEffect(() => {
    if (libraryOpen) {
      loadLibrary();
    }
  }, [libraryOpen]);

  const attachAsset = (asset: MediaAsset) => {
    if (items.some((i) => i.mediaAssetId === asset.$id)) return;
    const isFirst = items.length === 0;
    const nextItem: GalleryDraftItem = {
      mediaAssetId: asset.$id,
      fileId: asset.fileId,
      mediaType: asset.mediaType,
      captionId: asset.captionId,
      sortOrder: items.length,
      isPatternDiagram: false,
      isAudioChant: asset.mediaType === 'audio',
      role: isFirst ? 'cover' : 'gallery',
    };
    onChange([...items, nextItem]);
  };

  const removeItem = (idx: number) => {
    const updated = items
      .filter((_, i) => i !== idx)
      .map((item, i) => ({
        ...item,
        sortOrder: i,
        role: entityType === 'craft' && i === 0 ? 'cover' : item.role,
      }));
    onChange(updated);
  };

  const makePrimary = (idx: number) => {
    const selected = items[idx];
    const rest = items.filter((_, i) => i !== idx);
    const reordered = [selected, ...rest].map((item, i) => ({
      ...item,
      sortOrder: i,
      role:
        entityType === 'craft'
          ? i === 0
            ? 'cover'
            : item.role === 'cover'
            ? 'gallery'
            : item.role
          : item.role,
    }));
    onChange(reordered);
  };

  const moveItem = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= items.length) return;
    const copy = [...items];
    const tmp = copy[idx];
    copy[idx] = copy[target];
    copy[target] = tmp;
    onChange(
      copy.map((item, i) => ({
        ...item,
        sortOrder: i,
        role:
          entityType === 'craft'
            ? i === 0
              ? 'cover'
              : item.role === 'cover'
              ? 'gallery'
              : item.role
            : item.role,
      }))
    );
  };

  const updateMeta = (idx: number, patch: Partial<GalleryDraftItem>) => {
    onChange(items.map((item, i) => (i === idx ? { ...item, ...patch } : item)));
  };

  const handleToggleAccess = async (fileId: string, label: string, targetPublic: boolean) => {
    if (!user || !canPublish) return;
    const msg = targetPublic
      ? `Publikasikan berkas '${label}' agar tampil ke website publik? Pastikan sudah ada izin narasumber.`
      : `Ubah berkas '${label}' kembali ke mode Privat (hanya staf)?`;
    if (!window.confirm(msg)) return;

    try {
      setTogglingId(fileId);
      setStatusNote(null);
      const updated = await setMediaFilePublicAccess({
        fileId,
        makePublic: targetPublic,
        actorUserId: user.$id,
        canPublish,
        refreshAuth,
      });
      setAccessMap((prev) => {
        const next = new Map(prev);
        next.set(fileId, updated);
        return next;
      });
      setStatusNote({
        type: 'success',
        text: targetPublic
          ? `Berkas '${label}' dipublikasikan (read("any") aktif di Storage).`
          : `Berkas '${label}' dikembalikan ke Privat.`,
      });
    } catch (err: any) {
      setStatusNote({
        type: 'error',
        text: err.message || 'Gagal mengubah izin berkas Storage.',
      });
    } finally {
      setTogglingId(null);
    }
  };

  const hasPrivateAttached = items.some((item) => {
    const info = accessMap.get(item.fileId || item.mediaAssetId);
    return info && !info.isPublic;
  });

  return (
    <div className="bg-sand-50 p-4 rounded-xl border border-border space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="font-serif text-sm font-bold text-text">
            Galeri Foto & Dokumentasi Multimedia
          </h4>
          <p className="text-[11px] text-muted">
            Urutan #1 menjadi media utama. Menautkan berkas Privat TIDAK otomatis membukanya ke
            publik sebelum disetujui eksplisit oleh Admin Desa / Super Admin.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setLibraryOpen((v) => !v);
              setUploadOpen(false);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface hover:bg-sand-100 text-xs font-semibold text-text"
          >
            <FolderOpen className="w-3.5 h-3.5 text-secondary" />
            <span>Pilih dari Pustaka Media</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setUploadOpen((v) => !v);
              setLibraryOpen(false);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-surface hover:bg-primary-hover text-xs font-semibold"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Unggah Baru</span>
          </button>
        </div>
      </div>

      {statusNote && (
        <div
          className={`p-2.5 rounded-lg text-[11px] border ${
            statusNote.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {statusNote.text}
        </div>
      )}

      {hasPrivateAttached && (
        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-start gap-2">
          <Lock className="w-4 h-4 shrink-0 text-amber-700 mt-0.5" />
          <span>
            Satu atau lebih berkas terlampir masih berstatus <strong>Privat (Staf)</strong>. Berkas
            privat tetap disembunyikan oleh <code className="font-mono">museum-public-api</code>{' '}
            meskipun entri ini diterbitkan, hingga Admin Desa mempublikasikan berkas tersebut.
          </span>
        </div>
      )}

      {/* Inline Uploader (strictly private by default) */}
      {uploadOpen && (
        <MediaUploader
          defaultPublic={false}
          allowedTypes="all"
          onSuccess={(asset) => {
            attachAsset(asset);
            refreshAccessMap();
            setUploadOpen(false);
          }}
        />
      )}

      {/* Existing Media Library Picker */}
      {libraryOpen && (
        <div className="bg-surface p-3 rounded-xl border border-border space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-text">
            <span>Pilih Aset dari Bucket museum-media</span>
            <button
              type="button"
              onClick={() => setLibraryOpen(false)}
              className="text-muted hover:text-text"
            >
              Tutup
            </button>
          </div>
          {loadingLib ? (
            <p className="text-xs text-muted py-4 text-center">Memuat pustaka media...</p>
          ) : libraryAssets.length === 0 ? (
            <p className="text-xs text-muted py-4 text-center">
              Belum ada aset di pustaka. Silakan unggah baru.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-60 overflow-y-auto p-1">
              {libraryAssets.map((asset) => {
                const isAttached = items.some((i) => i.mediaAssetId === asset.$id);
                const info = accessMap.get(asset.fileId);
                const isPub = Boolean(info?.isPublic);
                return (
                  <button
                    key={asset.$id}
                    type="button"
                    disabled={isAttached}
                    onClick={() => attachAsset(asset)}
                    className={`text-left border rounded-lg overflow-hidden p-1.5 transition-all relative ${
                      isAttached
                        ? 'border-primary bg-primary/5 opacity-60 cursor-default'
                        : 'border-border hover:border-primary'
                    }`}
                  >
                    <div className="aspect-4/3 bg-sand-100 rounded overflow-hidden flex items-center justify-center mb-1 relative">
                      <AuthorizedMediaPreview
                        fileId={asset.fileId}
                        mediaType={asset.mediaType}
                        mimeType={asset.mimeType}
                        isPublic={isPub}
                        width={200}
                        height={150}
                        controls={false}
                        className="w-full h-full object-cover"
                      />
                      <span
                        className={`absolute top-1 right-1 px-1.5 py-0.5 rounded text-[9px] font-bold text-white ${
                          isPub ? 'bg-emerald-700' : 'bg-amber-700'
                        }`}
                      >
                        {isPub ? 'Publik' : 'Privat'}
                      </span>
                    </div>
                    <p className="text-[11px] font-medium text-text truncate">
                      {asset.captionId || asset.fileId}
                    </p>
                    <p className="text-[10px] text-muted">
                      {asset.mediaType} • {formatBytes(asset.fileSizeBytes)}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Attached Gallery List */}
      {items.length === 0 ? (
        <p className="text-xs text-muted italic py-2">
          Belum ada foto/media yang dihubungkan ke entri ini.
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((item, idx) => {
            const fid = item.fileId || item.mediaAssetId;
            const info = accessMap.get(fid);
            const existsInStorage = info ? info.exists : true;
            const isPub = Boolean(info?.isPublic);
            const ext = (info?.name || fid || '').split('.').pop()?.toLowerCase() || '';
            const isQuarantined = Boolean(
              info?.quarantined ||
                (info?.sizeOriginal && info.sizeOriginal > 20_000_000) ||
                info?.mimeType === 'image/svg+xml' ||
                info?.mimeType?.includes('zip') ||
                ext === 'svg' ||
                ext === 'zip'
            );
            const isBusy = togglingId === fid;

            return (
              <div
                key={item.mediaAssetId}
                className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 bg-surface p-2.5 rounded-lg border border-border"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-mono text-xs font-bold text-primary w-5 text-center">
                    #{idx + 1}
                  </span>
                  <div className="w-16 h-12 rounded bg-sand-100 border border-border overflow-hidden flex items-center justify-center shrink-0">
                    <AuthorizedMediaPreview
                      fileId={fid}
                      mediaType={item.mediaType}
                      isPublic={isPub}
                      width={120}
                      height={90}
                      controls={false}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-text truncate">
                      {item.captionId || fid}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      {idx === 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-primary/15 text-primary text-[10px] font-bold">
                          Media Utama
                        </span>
                      )}
                      {!existsInStorage ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-bold">
                          <ShieldAlert className="w-2.5 h-2.5" /> File Hilang
                        </span>
                      ) : isPub ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          <Globe className="w-2.5 h-2.5" /> Publik
                        </span>
                      ) : isQuarantined ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-800 text-amber-200 text-[10px] font-bold">
                          <ShieldAlert className="w-2.5 h-2.5" /> Karantina
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-bold">
                          <Lock className="w-2.5 h-2.5" /> Privat (Staf)
                        </span>
                      )}
                      {entityType === 'motif' && (
                        <label className="inline-flex items-center gap-1 text-[11px] text-muted cursor-pointer">
                          <input
                            type="checkbox"
                            checked={Boolean(item.isPatternDiagram)}
                            onChange={(e) =>
                              updateMeta(idx, { isPatternDiagram: e.target.checked })
                            }
                            className="rounded border-border text-primary w-3.5 h-3.5"
                          />
                          <span>Diagram Pola</span>
                        </label>
                      )}
                      {entityType === 'culture' && (
                        <label className="inline-flex items-center gap-1 text-[11px] text-muted cursor-pointer">
                          <input
                            type="checkbox"
                            checked={Boolean(item.isAudioChant)}
                            onChange={(e) => updateMeta(idx, { isAudioChant: e.target.checked })}
                            className="rounded border-border text-accent w-3.5 h-3.5"
                          />
                          <span>Audio Zikir/Lantunan</span>
                        </label>
                      )}
                      {entityType === 'craft' && (
                        <select
                          value={item.role || 'gallery'}
                          onChange={(e) => updateMeta(idx, { role: e.target.value as any })}
                          className="text-[11px] border border-border rounded px-1.5 py-0.5 bg-sand-50"
                        >
                          <option value="cover">Foto Sampul</option>
                          <option value="gallery">Galeri</option>
                          <option value="process">Tahap Proses</option>
                          <option value="close_up">Detail Close-Up</option>
                        </select>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {canPublish && existsInStorage && (
                    <button
                      type="button"
                      disabled={isBusy || (!isPub && isQuarantined)}
                      onClick={() => handleToggleAccess(fid, item.captionId || fid, !isPub)}
                      title={
                        !isPub && isQuarantined
                          ? 'Berkas karantina (>20 MB / SVG / ZIP) tidak dapat dipublikasikan'
                          : isPub
                          ? 'Tarik ke Privat'
                          : 'Publikasikan Media Ini'
                      }
                      className={`px-2 py-1 rounded text-[10px] font-semibold border transition-colors mr-1 disabled:opacity-50 disabled:cursor-not-allowed ${
                        isPub
                          ? 'bg-amber-50 border-amber-200 text-amber-900 hover:bg-amber-100'
                          : isQuarantined
                          ? 'bg-slate-100 border-slate-300 text-slate-600'
                          : 'bg-emerald-50 border-emerald-200 text-emerald-900 hover:bg-emerald-100'
                      }`}
                    >
                      {isBusy ? '...' : isPub ? 'Privatkan' : isQuarantined ? 'Karantina' : 'Publikasikan'}
                    </button>
                  )}
                  {idx !== 0 && (
                    <button
                      type="button"
                      onClick={() => makePrimary(idx)}
                      title="Jadikan Foto Utama"
                      className="p-1.5 rounded hover:bg-amber-50 text-amber-700 text-xs"
                    >
                      <Star className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => moveItem(idx, -1)}
                    title="Naikkan urutan"
                    className="p-1.5 rounded hover:bg-sand-100 disabled:opacity-30 text-text"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === items.length - 1}
                    onClick={() => moveItem(idx, 1)}
                    title="Turunkan urutan"
                    className="p-1.5 rounded hover:bg-sand-100 disabled:opacity-30 text-text"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    title="Lepas dari entri ini"
                    className="p-1.5 rounded hover:bg-rose-50 text-rose-700"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
