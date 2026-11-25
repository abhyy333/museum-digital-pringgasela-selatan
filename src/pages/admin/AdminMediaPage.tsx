import React, { useEffect, useState } from 'react';
import {
  Plus,
  Image,
  Trash2,
  Copy,
  CheckCircle2,
  AlertCircle,
  Lock,
  Globe,
  ShieldAlert,
} from 'lucide-react';
import { Query } from 'appwrite';
import { tablesDB } from '../../appwrite/client';
import { deleteMediaViaGateway } from '../../appwrite/adminMediaApi';
import { APPWRITE_CONFIG } from '../../appwrite/config';
import { useAuth } from '../../context/AuthContext';
import { MediaAsset } from '../../types/schema';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Modal } from '../../components/common/Modal';
import { MediaUploader } from '../../components/admin/MediaUploader';
import { AuthorizedMediaPreview } from '../../components/common/AuthorizedMediaPreview';
import { formatBytes, getFileViewUrl } from '../../utils/media';
import { formatAppwriteError } from '../../utils/audit';
import {
  fetchBucketFileAccessMap,
  isStorageFilePublic,
  setMediaFilePublicAccess,
  StorageAccessInfo,
} from '../../utils/mediaAccess';
import type { Models } from 'appwrite';

type AccessFilter = 'all' | 'private' | 'public' | 'missing';

export const AdminMediaPage: React.FC = () => {
  const { user, canPublish, canDelete, refreshAuth } = useAuth();
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [accessMap, setAccessMap] = useState<Map<string, StorageAccessInfo>>(new Map());
  const [orphanFiles, setOrphanFiles] = useState<Models.File[]>([]);
  const [filterMode, setFilterMode] = useState<AccessFilter>('all');
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploaderOpen, setUploaderOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchMedia = async () => {
    try {
      setLoading(true);
      const [assetsRes, bucketAccess] = await Promise.all([
        tablesDB.listRows(APPWRITE_CONFIG.databaseId, 'media_assets', [
          Query.limit(100),
          Query.orderDesc('$createdAt'),
        ]),
        fetchBucketFileAccessMap(),
      ]);

      const assetRows = assetsRes.rows as unknown as MediaAsset[];
      const linkedFileIds = new Set(assetRows.map((a) => a.fileId));
      const orphans = bucketAccess.files.filter((f) => !linkedFileIds.has(f.$id));

      setAssets(assetRows);
      setAccessMap(bucketAccess.byId);
      setOrphanFiles(orphans);
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: formatAppwriteError(err, refreshAuth) });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const handleCopyUrl = (fileId: string, isPublic: boolean) => {
    const url = getFileViewUrl(fileId);
    navigator.clipboard.writeText(url);
    setCopiedId(fileId);
    if (!isPublic) {
      setAlertMsg({
        type: 'success',
        text: 'URL internal disalin. Catatan: berkas Privat hanya dapat dibuka pengelola yang sudah login.',
      });
    }
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleTogglePublicAccess = async (asset: MediaAsset, targetPublic: boolean) => {
    if (!user) return;
    if (!canPublish) {
      setAlertMsg({
        type: 'error',
        text: 'Hanya Admin Desa atau Super Admin yang berwenang mengubah status publikasi berkas media.',
      });
      return;
    }

    const actionPrompt = targetPublic
      ? `Publikasikan '${asset.captionId || asset.fileId}'?\n\nTindakan ini menambahkan izin baca publik (read("any")) di Appwrite Storage. Pastikan narasumber/penenun menyetujui publikasi.`
      : `Tarik '${asset.captionId || asset.fileId}' ke mode PRIVAT?\n\nAkses publik (read("any")) akan dicabut sehingga hanya staf museum yang dapat membuka file ini.`;

    if (!window.confirm(actionPrompt)) return;

    try {
      setTogglingId(asset.fileId);
      setAlertMsg(null);
      const verified = await setMediaFilePublicAccess({
        fileId: asset.fileId,
        makePublic: targetPublic,
        actorUserId: user.$id,
        canPublish,
        refreshAuth,
      });

      setAccessMap((prev) => {
        const next = new Map(prev);
        next.set(asset.fileId, verified);
        return next;
      });

      setAlertMsg({
        type: 'success',
        text: targetPublic
          ? `Berkas '${asset.captionId || asset.fileId}' kini berstatus PUBLIK (terverifikasi pada Appwrite Storage).`
          : `Berkas '${asset.captionId || asset.fileId}' dikembalikan ke PRIVAT (akses publik dicabut).`,
      });
    } catch (err: any) {
      // Do not optimistically flip UI on Storage failure
      setAlertMsg({
        type: 'error',
        text: `Gagal mengubah permission Storage (status tidak diubah): ${err.message || 'Unknown error'}`,
      });
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (asset: MediaAsset) => {
    if (!canDelete) {
      setAlertMsg({
        type: 'error',
        text: 'Hanya Super Admin yang berwenang menghapus berkas penyimpanan secara permanen.',
      });
      return;
    }

    if (
      confirm(
        `Yakin menghapus permanen '${asset.captionId || asset.fileId}' dari Storage & memutus tautannya di motif/kriya/tradisi?`
      )
    ) {
      try {
        await deleteMediaViaGateway(asset.fileId);
        setAlertMsg({
          type: 'success',
          text: 'Berkas media dan relasi galeri terkait berhasil dibersihkan secara aman melalui server gateway.',
        });
        await fetchMedia();
      } catch (err: any) {
        setAlertMsg({ type: 'error', text: formatAppwriteError(err, refreshAuth) });
      }
    }
  };

  const publicCount = assets.filter((a) => accessMap.get(a.fileId)?.isPublic).length;
  const privateCount = assets.filter((a) => {
    const info = accessMap.get(a.fileId);
    return info?.exists && !info.isPublic;
  }).length;
  const missingCount = assets.filter((a) => !accessMap.get(a.fileId)?.exists).length;

  const filteredAssets = assets.filter((asset) => {
    const info = accessMap.get(asset.fileId);
    if (filterMode === 'public') return Boolean(info?.exists && info.isPublic);
    if (filterMode === 'private') return Boolean(info?.exists && !info.isPublic);
    if (filterMode === 'missing') return !info?.exists;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-text flex items-center gap-2">
            <Image className="w-6 h-6 text-primary" />
            <span>Pustaka Berkas & Keamanan Media Storage</span>
          </h1>
          <p className="text-xs text-muted">
            Bucket:{' '}
            <code className="font-mono text-primary font-bold">
              {APPWRITE_CONFIG.storageBucketId}
            </code>{' '}
            • Default Privat • Publikasi eksplisit hanya oleh Admin Desa / Super Admin.
          </p>
        </div>

        <button
          onClick={() => setUploaderOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-surface text-xs font-semibold transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Unggah Berkas Baru</span>
        </button>
      </div>

      {/* Security Policy & Filter Summary */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-surface p-4 rounded-2xl border border-border">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              filterMode === 'all' ? 'bg-primary text-surface' : 'bg-sand-100 text-text'
            }`}
          >
            Semua ({assets.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('private')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              filterMode === 'private' ? 'bg-amber-700 text-white' : 'bg-amber-50 text-amber-900'
            }`}
          >
            <Lock className="w-3.5 h-3.5" /> Privat / Kurasi ({privateCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('public')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              filterMode === 'public' ? 'bg-emerald-700 text-white' : 'bg-emerald-50 text-emerald-900'
            }`}
          >
            <Globe className="w-3.5 h-3.5" /> Publik Aktif ({publicCount})
          </button>
          {missingCount > 0 && (
            <button
              type="button"
              onClick={() => setFilterMode('missing')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                filterMode === 'missing' ? 'bg-rose-700 text-white' : 'bg-rose-50 text-rose-900'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" /> Bermasalah ({missingCount})
            </button>
          )}
        </div>

        <span className="text-[11px] text-muted">
          File Storage tanpa metadata <code className="font-mono">media_assets</code>:{' '}
          <strong>{orphanFiles.length}</strong>
        </span>
      </div>

      {alertMsg && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-2 ${
            alertMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {alertMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{alertMsg.text}</span>
        </div>
      )}

      {loading ? (
        <LoadingSpinner message="Mengambil daftar aset media dan memeriksa izin Storage..." />
      ) : filteredAssets.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAssets.map((asset) => {
            const access = accessMap.get(asset.fileId);
            const existsInStorage = Boolean(access?.exists);
            const isPublic = Boolean(access?.isPublic);
            const isBusy = togglingId === asset.fileId;

            return (
              <div
                key={asset.$id}
                className="bg-surface rounded-2xl border border-border overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div className="relative aspect-4/3 bg-sand-100 flex items-center justify-center overflow-hidden">
                  <AuthorizedMediaPreview
                    fileId={asset.fileId}
                    mediaType={asset.mediaType}
                    mimeType={asset.mimeType}
                    isPublic={isPublic}
                    alt={asset.altTextId || ''}
                    width={400}
                    height={300}
                    className="w-full h-full object-cover"
                  />

                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-sand-900/80 text-surface text-[10px] font-mono">
                    {asset.mediaType.toUpperCase()}
                  </span>

                  <span
                    className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 shadow-xs ${
                      !existsInStorage
                        ? 'bg-rose-600 text-white'
                        : isPublic
                        ? 'bg-emerald-700 text-white'
                        : 'bg-amber-700 text-white'
                    }`}
                  >
                    {!existsInStorage ? (
                      <>
                        <ShieldAlert className="w-3 h-3" /> Hilang
                      </>
                    ) : isPublic ? (
                      <>
                        <Globe className="w-3 h-3" /> Publik
                      </>
                    ) : (
                      <>
                        <Lock className="w-3 h-3" /> Privat
                      </>
                    )}
                  </span>
                </div>

                <div className="p-4 space-y-2.5 text-xs">
                  <div>
                    <p
                      className="font-semibold text-text line-clamp-1"
                      title={asset.captionId || asset.fileId}
                    >
                      {asset.captionId || asset.fileId}
                    </p>
                    <p className="text-[11px] text-muted">
                      {formatBytes(asset.fileSizeBytes)} • {asset.photographer || 'Staf'}
                    </p>
                  </div>

                  {canPublish && existsInStorage && (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleTogglePublicAccess(asset, !isPublic)}
                      className={`w-full py-1.5 px-3 rounded-lg text-[11px] font-semibold border transition-colors inline-flex items-center justify-center gap-1.5 disabled:opacity-50 ${
                        isPublic
                          ? 'bg-amber-50 border-amber-200 text-amber-900 hover:bg-amber-100'
                          : 'bg-emerald-50 border-emerald-200 text-emerald-900 hover:bg-emerald-100'
                      }`}
                    >
                      {isPublic ? (
                        <>
                          <Lock className="w-3 h-3" />
                          <span>{isBusy ? 'Memproses...' : 'Tarik ke Privat'}</span>
                        </>
                      ) : (
                        <>
                          <Globe className="w-3 h-3" />
                          <span>{isBusy ? 'Memproses...' : 'Publikasikan Media'}</span>
                        </>
                      )}
                    </button>
                  )}

                  <div className="pt-2 border-t border-border/60 flex items-center justify-between">
                    <button
                      onClick={() => handleCopyUrl(asset.fileId, isPublic)}
                      className="inline-flex items-center gap-1 text-[11px] text-secondary hover:text-secondary-hover font-semibold"
                    >
                      <Copy className="w-3 h-3" />
                      <span>
                        {copiedId === asset.fileId
                          ? 'Tersalin!'
                          : isPublic
                          ? 'Salin URL Publik'
                          : 'Salin URL Staf'}
                      </span>
                    </button>

                    {canDelete && (
                      <button
                        onClick={() => handleDelete(asset)}
                        className="p-1 rounded text-rose-700 hover:bg-rose-50"
                        title="Hapus Media"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-surface p-12 text-center rounded-2xl border border-border">
          <p className="text-muted text-xs">
            Belum ada berkas pada filter ini di tabel <code className="font-mono">media_assets</code>.
          </p>
        </div>
      )}

      {/* Orphan / Unregistered Storage Files Security Audit Table */}
      {orphanFiles.length > 0 && (
        <div className="bg-surface rounded-2xl border border-border overflow-hidden shadow-xs">
          <div className="px-6 py-4 border-b border-border bg-sand-50/80">
            <h2 className="font-serif text-sm font-bold text-text flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-700" />
              Audit Berkas Storage Tanpa Metadata (Belum Terdaftar di <code className="font-mono">media_assets</code>)
            </h2>
            <p className="text-[11px] text-muted mt-0.5">
              Berkas di bawah tersimpan langsung pada bucket <code className="font-mono">museum-media</code> tanpa
              baris metadata di TablesDB sehingga tidak otomatis tertaut ke koleksi maupun terekspos API publik.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-sand-50 border-b border-border text-muted font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3">File ID</th>
                  <th className="px-6 py-3">Nama Berkas</th>
                  <th className="px-6 py-3">MIME & Ukuran</th>
                  <th className="px-6 py-3">Status Storage ACL</th>
                  <th className="px-6 py-3">Permission Aktual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {orphanFiles.map((f) => {
                  const isPub = isStorageFilePublic(f.$permissions);
                  return (
                    <tr key={f.$id} className="hover:bg-sand-50/40">
                      <td className="px-6 py-3 font-mono text-text">{f.$id}</td>
                      <td className="px-6 py-3 font-medium text-text">{f.name}</td>
                      <td className="px-6 py-3 text-muted">
                        {f.mimeType} • {formatBytes(f.sizeOriginal)}
                      </td>
                      <td className="px-6 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            isPub ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-900'
                          }`}
                        >
                          {isPub ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                          {isPub ? 'Publik (Sampel/Uji)' : 'Privat (Staf)'}
                        </span>
                      </td>
                      <td className="px-6 py-3 font-mono text-[10px] text-muted">
                        {JSON.stringify(f.$permissions || [])}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        isOpen={uploaderOpen}
        onClose={() => setUploaderOpen(false)}
        title="Unggah Berkas ke Storage (Default Privat)"
        maxWidth="2xl"
      >
        <MediaUploader
          defaultPublic={false}
          onSuccess={() => {
            setUploaderOpen(false);
            setAlertMsg({
              type: 'success',
              text: 'Berkas media berhasil diunggah ke museum-media!',
            });
            fetchMedia();
          }}
        />
      </Modal>
    </div>
  );
};
