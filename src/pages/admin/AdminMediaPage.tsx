import React, { useEffect, useState } from 'react';
import { Plus, Image, Trash2, Globe, Lock, Copy, CheckCircle2, AlertCircle, FileText } from 'lucide-react';
import { Query } from 'appwrite';
import { tablesDB, storage } from '../../appwrite/client';
import { APPWRITE_CONFIG } from '../../appwrite/config';
import { useAuth } from '../../context/AuthContext';
import { MediaAsset } from '../../types/schema';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Modal } from '../../components/common/Modal';
import { MediaUploader } from '../../components/admin/MediaUploader';
import { formatBytes, getFilePreviewUrl, getFileViewUrl } from '../../utils/media';

export const AdminMediaPage: React.FC = () => {
  const { canDelete } = useAuth();
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploaderOpen, setUploaderOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchMedia = async () => {
    try {
      setLoading(true);
      const res = await tablesDB.listRows(APPWRITE_CONFIG.databaseId, 'media_assets', [
        Query.limit(50),
        Query.orderDesc('$createdAt'),
      ]);
      setAssets(res.rows as unknown as MediaAsset[]);
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: err.message || 'Gagal memuat media.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const handleCopyUrl = (fileId: string) => {
    const url = getFileViewUrl(fileId);
    navigator.clipboard.writeText(url);
    setCopiedId(fileId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (asset: MediaAsset) => {
    if (!canDelete) {
      alert('Hanya Super Admin yang berwenang menghapus berkas penyimpanan secara permanen.');
      return;
    }

    if (confirm(`Yakin menghapus file '${asset.captionId || asset.fileId}' dari penyimpanan cloud?`)) {
      try {
        await storage.deleteFile(APPWRITE_CONFIG.storageBucketId, asset.fileId);
        await tablesDB.deleteRow(APPWRITE_CONFIG.databaseId, 'media_assets', asset.$id);
        setAlertMsg({ type: 'success', text: 'Berkas media berhasil dihapus.' });
        await fetchMedia();
      } catch (err: any) {
        setAlertMsg({ type: 'error', text: err.message || 'Gagal menghapus media.' });
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-text flex items-center gap-2">
            <Image className="w-6 h-6 text-primary" />
            <span>Pustaka Berkas & Media Storage</span>
          </h1>
          <p className="text-xs text-muted">
            Bucket: <code className="font-mono text-primary font-bold">{APPWRITE_CONFIG.storageBucketId}</code> • Kuota 50MB per berkas • Terenkripsi AES-256.
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

      {alertMsg && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-2 ${
            alertMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {alertMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{alertMsg.text}</span>
        </div>
      )}

      {loading ? (
        <LoadingSpinner message="Mengambil daftar aset media..." />
      ) : assets.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {assets.map((asset) => {
            const isImage = asset.mimeType?.startsWith('image/');
            const previewUrl = isImage ? getFilePreviewUrl(asset.fileId, { width: 400, height: 300 }) : null;

            return (
              <div
                key={asset.$id}
                className="bg-surface rounded-2xl border border-border overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                {/* Visual Area */}
                <div className="relative aspect-4/3 bg-sand-100 flex items-center justify-center overflow-hidden">
                  {previewUrl ? (
                    <img src={previewUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <FileText className="w-12 h-12 text-muted" />
                  )}

                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-sand-900/80 text-surface text-[10px] font-mono">
                    {asset.mediaType.toUpperCase()}
                  </span>
                </div>

                {/* Info Area */}
                <div className="p-4 space-y-2 text-xs">
                  <p className="font-semibold text-text line-clamp-1" title={asset.captionId || asset.fileId}>
                    {asset.captionId || asset.fileId}
                  </p>
                  <p className="text-[11px] text-muted">
                    {formatBytes(asset.fileSizeBytes)} • {asset.photographer || 'Staf'}
                  </p>

                  <div className="pt-2 border-t border-border/60 flex items-center justify-between">
                    <button
                      onClick={() => handleCopyUrl(asset.fileId)}
                      className="inline-flex items-center gap-1 text-[11px] text-secondary hover:text-secondary-hover font-semibold"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedId === asset.fileId ? 'Tersalin!' : 'Salin URL'}</span>
                    </button>

                    <button
                      onClick={() => handleDelete(asset)}
                      className="p-1 rounded text-rose-700 hover:bg-rose-50"
                      title="Hapus Media"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-surface p-12 text-center rounded-2xl border border-border">
          <p className="text-muted text-xs">Belum ada berkas media di storage. Silakan unggah berkas baru.</p>
        </div>
      )}

      {/* UPLOADER MODAL */}
      <Modal isOpen={uploaderOpen} onClose={() => setUploaderOpen(false)} title="Unggah Berkas ke Storage" maxWidth="2xl">
        <MediaUploader
          onSuccess={() => {
            setUploaderOpen(false);
            setAlertMsg({ type: 'success', text: 'Berkas media berhasil diunggah!' });
            fetchMedia();
          }}
        />
      </Modal>

    </div>
  );
};
