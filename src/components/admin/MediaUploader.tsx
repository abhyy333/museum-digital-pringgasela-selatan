import React, { useEffect, useState } from 'react';
import { Upload, AlertCircle, File, Lock, Globe, ShieldCheck } from 'lucide-react';
import {
  setMediaVisibilityViaGateway,
  uploadMediaViaGateway,
} from '../../appwrite/adminMediaApi';
import { APPWRITE_CONFIG } from '../../appwrite/config';
import { useAuth } from '../../context/AuthContext';
import { MediaAsset } from '../../types/schema';
import { formatBytes } from '../../utils/media';
import { formatAppwriteError } from '../../utils/audit';

interface MediaUploaderProps {
  onSuccess: (asset: MediaAsset) => void;
  allowedTypes?: 'images' | 'all';
  defaultPublic?: boolean;
}

const ALLOWED_EXTENSIONS = new Set([
  'jpg', 'jpeg', 'png', 'webp', 'svg', 'avif', 'tif', 'tiff',
  'mp3', 'wav', 'aac', 'ogg',
  'mp4', 'webm',
  'pdf', 'zip',
]);

// Match Appwrite Bucket maximumFileSize (50,000,000 bytes) & Appwrite AV ceiling (20,000,000 bytes)
const MAX_FILE_BYTES = 50_000_000;
const ANTIVIRUS_SCAN_CEILING = 20_000_000;

function getQuarantineNotice(selected: File | null): string | null {
  if (!selected) return null;
  const ext = selected.name.split('.').pop()?.toLowerCase() || '';
  if (selected.size > ANTIVIRUS_SCAN_CEILING) {
    return `Berkas melebihi 20 MB (${formatBytes(selected.size)}) sehingga tidak dipindai antivirus otomatis Appwrite. Sistem mengunci berkas ini dalam Karantina Privat.`;
  }
  if (ext === 'svg' || selected.type === 'image/svg+xml') {
    return 'Berkas SVG masuk Karantina Privat dan dilarang dipublikasikan langsung ke pengunjung publik.';
  }
  if (ext === 'zip' || selected.type.includes('zip')) {
    return 'Arsip ZIP masuk Karantina Privat untuk pengarsipan internal dan dilarang dipublikasikan ke situs publik.';
  }
  return null;
}

export const MediaUploader: React.FC<MediaUploaderProps> = ({
  onSuccess,
  allowedTypes = 'all',
  defaultPublic = false,
}) => {
  const { user, canPublish, refreshAuth } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  // Private by default; only roles with canPublish may opt in to direct public upload
  const [isPublic, setIsPublic] = useState<boolean>(canPublish && defaultPublic);
  const [captionId, setCaptionId] = useState('');
  const [captionEn, setCaptionEn] = useState('');
  const [photographer, setPhotographer] = useState('');
  const [consentChecked, setConsentChecked] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadStatusText, setUploadStatusText] = useState('Mengunggah berkas privat...');
  const [error, setError] = useState<string | null>(null);

  const quarantineNotice = getQuarantineNotice(file);
  const allowPublicOption = canPublish && !quarantineNotice;

  useEffect(() => {
    if ((!canPublish || quarantineNotice) && isPublic) {
      setIsPublic(false);
      setConsentChecked(false);
    }
  }, [canPublish, quarantineNotice, isPublic]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setError(null);

    const ext = selected.name.split('.').pop()?.toLowerCase() || '';
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      setError(
        `Format berkas '.${ext}' tidak didukung bucket penyimpanan. Format diizinkan: ${Array.from(ALLOWED_EXTENSIONS).join(', ')}.`
      );
      return;
    }

    if (allowedTypes === 'images' && !selected.type.startsWith('image/')) {
      setError('Kolom ini hanya menerima berkas foto / gambar.');
      return;
    }

    if (selected.size > MAX_FILE_BYTES) {
      setError(
        `Ukuran file (${formatBytes(selected.size)}) melebihi batas maksimum bucket 50.000.000 bytes (~47.6 MiB).`
      );
      return;
    }

    setFile(selected);
    if (getQuarantineNotice(selected)) {
      setIsPublic(false);
      setConsentChecked(false);
    }

    if (
      selected.type.startsWith('image/') ||
      selected.type.startsWith('video/') ||
      selected.type.startsWith('audio/')
    ) {
      const url = URL.createObjectURL(selected);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !user) return;

    const effectivePublic = Boolean(allowPublicOption && isPublic);
    if (isPublic && !allowPublicOption) {
      setError(
        quarantineNotice ||
          'Akun KKN tidak diizinkan menerbitkan berkas secara publik. Ubah akses ke Privat (Staf).'
      );
      setIsPublic(false);
      return;
    }

    if (effectivePublic && !consentChecked) {
      setError(
        'Mohon konfirmasi persetujuan dokumentasi & publikasi sebelum menandai berkas sebagai Publik.'
      );
      return;
    }

    if (
      effectivePublic &&
      !window.confirm(
        `Anda akan mengunggah '${file.name}' secara privat terlebih dahulu lalu langsung menerbitkannya dengan izin baca PUBLIK (read("any")) via server gateway. Lanjutkan?`
      )
    ) {
      return;
    }

    try {
      setUploading(true);
      setProgress(0);
      setUploadStatusText('Mempersiapkan sesi unggahan aman...');
      setError(null);

      // 1. Upload strictly through server-authoritative Appwrite Function gateway (private-by-default)
      const uploadResult = await uploadMediaViaGateway({
        file,
        captionId: captionId || file.name,
        captionEn: captionEn || captionId || file.name,
        photographer: photographer || user.name || 'Staf Museum',
        isPublicIntent: effectivePublic,
        onProgress: (percent) => setProgress(percent),
        onStatus: ({ chunkIndex, totalChunks, phase, retryAttempt }) => {
          if (phase === 'hashing') {
            setUploadStatusText('Menghitung checksum integritas SHA-256...');
          } else if (phase === 'retrying') {
            setUploadStatusText(
              `Gangguan jaringan pada potongan ${chunkIndex + 1}/${totalChunks}, mencoba ulang (${retryAttempt})...`
            );
          } else if (phase === 'finalizing') {
            setUploadStatusText(
              totalChunks > 1
                ? `Mengunggah potongan akhir ${chunkIndex + 1}/${totalChunks} & memverifikasi server...`
                : 'Mengunggah & memverifikasi integritas + metadata di server...'
            );
          } else {
            setUploadStatusText(`Mengunggah potongan aman ${chunkIndex + 1}/${totalChunks}...`);
          }
        },
      });

      // 2. If authorized curator explicitly opted in to immediate publish, perform explicit server publish step
      if (effectivePublic) {
        try {
          await setMediaVisibilityViaGateway(uploadResult.asset.fileId, true);
        } catch (pubErr: any) {
          throw new Error(
            `Berkas '${file.name}' telah tersimpan sebagai PRIVAT di pustaka media, namun publikasi otomatis gagal: ${
              pubErr?.message || 'kesalahan server'
            }`
          );
        }
      }

      onSuccess(uploadResult.asset);

      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setFile(null);
      setPreviewUrl(null);
      setCaptionId('');
      setCaptionEn('');
      setPhotographer('');
      setConsentChecked(false);
      setIsPublic(false);
      setProgress(100);
    } catch (err: any) {
      setError(formatAppwriteError(err, refreshAuth));
    } finally {
      setUploading(false);
    }
  };

  return (
    <form
      onSubmit={handleUpload}
      className="space-y-5 bg-surface p-5 rounded-xl border border-border"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-serif text-lg font-bold text-text">Unggah Berkas Media</h3>
          <p className="text-xs text-muted">
            Bucket{' '}
            <code className="font-mono text-primary">{APPWRITE_CONFIG.storageBucketId}</code>{' '}
            • Maks. 50.000.000 bytes • Default Privat (Staf).
          </p>
        </div>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-semibold">
          <Lock className="w-3 h-3" /> Privat secara Default
        </span>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* File Dropzone Input */}
      <div className="border-2 border-dashed border-border rounded-xl p-5 text-center hover:bg-sand-50 transition-colors relative">
        <input
          type="file"
          onChange={handleFileChange}
          accept={
            allowedTypes === 'images'
              ? '.jpg,.jpeg,.png,.webp,.svg,.avif,.tif,.tiff,image/*'
              : '.jpg,.jpeg,.png,.webp,.svg,.avif,.tif,.tiff,.mp3,.wav,.aac,.ogg,.mp4,.webm,.pdf,.zip'
          }
          disabled={uploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="flex flex-col items-center justify-center space-y-1.5 pointer-events-none">
          <Upload className="w-7 h-7 text-primary" />
          <p className="text-sm font-semibold text-text">
            {file ? file.name : 'Pilih atau Tarik Berkas ke Sini'}
          </p>
          <p className="text-xs text-muted">
            {file
              ? `${formatBytes(file.size)} • ${file.type || 'unknown MIME'}`
              : 'Foto (JPG, PNG, WEBP, SVG, AVIF, TIF), Video (MP4, WEBM), Audio (MP3, WAV, OGG), Dokumen (PDF, ZIP)'}
          </p>
        </div>
      </div>

      {/* Preview Media */}
      {previewUrl && file?.type.startsWith('image/') && (
        <div className="w-40 aspect-4/3 rounded-xl border border-border overflow-hidden bg-sand-100">
          <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
        </div>
      )}
      {previewUrl && file?.type.startsWith('video/') && (
        <video
          src={previewUrl}
          controls
          className="w-full max-w-sm rounded-xl border border-border bg-black"
        />
      )}
      {previewUrl && file?.type.startsWith('audio/') && (
        <audio src={previewUrl} controls className="w-full" />
      )}
      {file && !previewUrl && (
        <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-sand-100 text-xs text-text border border-border">
          <File className="w-4 h-4 text-primary" />
          <span>
            {file.name} ({formatBytes(file.size)})
          </span>
        </div>
      )}

      {/* Metadata Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-text mb-1">
            Keterangan / Alt Text (ID)
          </label>
          <input
            type="text"
            value={captionId}
            onChange={(e) => setCaptionId(e.target.value)}
            placeholder="misal: Penenun Dusun Gubuk Timuk"
            className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-sand-50 focus:bg-surface focus:outline-hidden"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-text mb-1">
            Caption / Alt Text (EN)
          </label>
          <input
            type="text"
            value={captionEn}
            onChange={(e) => setCaptionEn(e.target.value)}
            placeholder="e.g. Master Weaver in Loom Workshop"
            className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-sand-50 focus:bg-surface focus:outline-hidden"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-text mb-1">
            Fotografer / Perekam / Sumber
          </label>
          <input
            type="text"
            value={photographer}
            onChange={(e) => setPhotographer(e.target.value)}
            placeholder="Nama fotografer / Tim Dokumentasi"
            className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-sand-50 focus:bg-surface focus:outline-hidden"
          />
        </div>

        {/* Access Visibility Level */}
        <div>
          <label className="block text-xs font-semibold text-text mb-1">
            Tingkat Aksesibilitas Berkas
          </label>
          <div className="flex items-center gap-2 pt-0.5">
            <button
              type="button"
              onClick={() => {
                setIsPublic(false);
                setConsentChecked(false);
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold border transition-colors ${
                !isPublic
                  ? 'bg-accent text-surface border-accent'
                  : 'bg-sand-50 text-text border-border'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Privat (Staf)</span>
            </button>
            <button
              type="button"
              disabled={!allowPublicOption}
              onClick={() => allowPublicOption && setIsPublic(true)}
              title={
                quarantineNotice
                  ? quarantineNotice
                  : canPublish
                  ? 'Langsung tandai dapat dibaca publik'
                  : 'Hanya Admin Desa & Super Admin yang berwenang mengatur publikasi media'
              }
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold border transition-colors disabled:opacity-45 disabled:cursor-not-allowed ${
                isPublic
                  ? 'bg-primary text-surface border-primary'
                  : 'bg-sand-50 text-text border-border'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Publik</span>
            </button>
          </div>
          <p className="text-[11px] text-muted mt-1">
            {quarantineNotice
              ? quarantineNotice
              : !canPublish
              ? 'Unggahan Tim KKN otomatis berstatus Privat hingga diverifikasi & dipublikasikan oleh Admin Desa.'
              : isPublic
              ? 'Dapat diakses publik (`read("any")`) bila persetujuan di bawah dicentang.'
              : 'Hanya dapat diakses pengelola yang login (aman untuk proses kurasi sebelum terbit).'}
          </p>
        </div>
      </div>

      {canPublish && isPublic && (
        <label className="flex items-start gap-2.5 p-3 rounded-lg bg-sand-50 border border-border text-xs text-text cursor-pointer">
          <input
            type="checkbox"
            checked={consentChecked}
            onChange={(e) => setConsentChecked(e.target.checked)}
            className="mt-0.5 rounded border-border text-primary w-4 h-4"
          />
          <span>
            <ShieldCheck className="w-3.5 h-3.5 inline mr-1 text-primary" />
            Saya menyatakan berkas ini memiliki izin dokumentasi & publikasi dari
            narasumber/pengrajin terkait serta disetujui untuk tayang ke masyarakat umum.
          </span>
        </label>
      )}

      {/* Progress Bar */}
      {uploading && (
        <div className="space-y-1">
          <div className="flex justify-between gap-2 text-xs text-muted">
            <span className="truncate">{uploadStatusText}</span>
            <span className="font-mono shrink-0">{progress}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-sand-200 overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={!file || uploading}
        className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary-hover disabled:opacity-50 text-surface text-sm font-semibold transition-colors shadow-xs"
      >
        {uploading
          ? `Mengunggah (${progress}%)...`
          : isPublic && canPublish
          ? 'Unggah & Publikasikan ke Storage'
          : 'Unggah Sebagai Berkas Privat'}
      </button>
    </form>
  );
};
