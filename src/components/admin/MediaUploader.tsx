import React, { useState } from 'react';
import { Upload, CheckCircle2, AlertCircle, File, Eye, Lock, Globe } from 'lucide-react';
import { ID, Permission, Role } from 'appwrite';
import { storage, tablesDB } from '../../appwrite/client';
import { APPWRITE_CONFIG } from '../../appwrite/config';
import { useAuth } from '../../context/AuthContext';
import { MediaAsset, MediaType } from '../../types/schema';
import { formatBytes } from '../../utils/media';

interface MediaUploaderProps {
  onSuccess: (asset: MediaAsset) => void;
  allowedTypes?: 'images' | 'all';
}

export const MediaUploader: React.FC<MediaUploaderProps> = ({
  onSuccess,
  allowedTypes = 'all',
}) => {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(true);
  const [captionId, setCaptionId] = useState('');
  const [captionEn, setCaptionEn] = useState('');
  const [photographer, setPhotographer] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setError(null);

    // Validate size (50MB max ceiling)
    if (selected.size > 50 * 1024 * 1024) {
      setError('Ukuran file melebihi batas maksimum 50MB.');
      return;
    }

    setFile(selected);

    // Image preview
    if (selected.type.startsWith('image/')) {
      const url = URL.createObjectURL(selected);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const determineMediaType = (mime: string): MediaType => {
    if (mime.startsWith('image/')) return 'photo';
    if (mime.startsWith('video/')) return 'video';
    if (mime.startsWith('audio/')) return 'audio';
    return 'document';
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !user) return;

    try {
      setUploading(true);
      setProgress(0);
      setError(null);

      const fileId = ID.unique();
      const permissions = isPublic
        ? [
            Permission.read(Role.any()),
            Permission.update(Role.team(APPWRITE_CONFIG.adminTeamId)),
            Permission.delete(Role.team(APPWRITE_CONFIG.adminTeamId, 'owner')),
          ]
        : [
            Permission.read(Role.team(APPWRITE_CONFIG.adminTeamId)),
            Permission.update(Role.team(APPWRITE_CONFIG.adminTeamId)),
            Permission.delete(Role.team(APPWRITE_CONFIG.adminTeamId, 'owner')),
          ];

      // 1. Upload to Storage Bucket
      const fileRes = await storage.createFile(
        APPWRITE_CONFIG.storageBucketId,
        fileId,
        file,
        permissions,
        undefined,
        (progressEvent: any) => {
          const percent = Math.round((progressEvent.progress || 0) * 100);
          setProgress(percent);
        }
      );

      // 2. Register metadata in media_assets table
      const assetData = {
        fileId: fileRes.$id,
        bucketId: APPWRITE_CONFIG.storageBucketId,
        mediaType: determineMediaType(file.type),
        mimeType: file.type || 'application/octet-stream',
        fileSizeBytes: file.size,
        captionId: captionId || file.name,
        captionEn: captionEn || file.name,
        photographer: photographer || user.name || 'Staf Museum',
        createdById: user.$id,
      };

      const assetRow = await tablesDB.createRow(
        APPWRITE_CONFIG.databaseId,
        'media_assets',
        ID.unique(),
        assetData
      );

      onSuccess(assetRow as unknown as MediaAsset);

      // Reset form
      setFile(null);
      setPreviewUrl(null);
      setCaptionId('');
      setCaptionEn('');
      setPhotographer('');
      setProgress(100);
    } catch (err: any) {
      setError(err.message || 'Gagal mengunggah file.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleUpload} className="space-y-6 bg-surface p-6 rounded-2xl border border-border">
      <div>
        <h3 className="font-serif text-lg font-bold text-text">Unggah Berkas Media</h3>
        <p className="text-xs text-muted">
          Penyimpanan terenkripsi pada bucket <code className="font-mono text-primary">{APPWRITE_CONFIG.storageBucketId}</code>.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* File Dropzone Input */}
      <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:bg-sand-50 transition-colors relative">
        <input
          type="file"
          onChange={handleFileChange}
          accept={allowedTypes === 'images' ? 'image/*' : 'image/*,video/*,audio/*,application/pdf'}
          disabled={uploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
          <Upload className="w-8 h-8 text-primary" />
          <p className="text-sm font-semibold text-text">
            {file ? file.name : 'Pilih atau Tarik Berkas ke Sini'}
          </p>
          <p className="text-xs text-muted">
            {file ? `${formatBytes(file.size)} • ${file.type}` : 'Format: JPG, PNG, WEBP, MP4, MP3, PDF (Maks. 50MB)'}
          </p>
        </div>
      </div>

      {/* Preview Thumbnail if image */}
      {previewUrl && (
        <div className="w-32 aspect-4/3 rounded-xl border border-border overflow-hidden bg-sand-100">
          <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Metadata Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-text mb-1">
            Keterangan Foto / Judul (ID)
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
            Caption / Title (EN)
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
            Fotografer / Kontributor
          </label>
          <input
            type="text"
            value={photographer}
            onChange={(e) => setPhotographer(e.target.value)}
            placeholder="Nama fotografer / Tim KKN"
            className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-sand-50 focus:bg-surface focus:outline-hidden"
          />
        </div>

        {/* Access Visibility Level */}
        <div>
          <label className="block text-xs font-semibold text-text mb-1">
            Tingkat Aksesibilitas Berkas
          </label>
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsPublic(true)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold border transition-colors ${
                isPublic ? 'bg-primary text-surface border-primary' : 'bg-sand-50 text-text border-border'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Publik (CDN)</span>
            </button>
            <button
              type="button"
              onClick={() => setIsPublic(false)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold border transition-colors ${
                !isPublic ? 'bg-accent text-surface border-accent' : 'bg-sand-50 text-text border-border'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Internal Staf</span>
            </button>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {uploading && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted">
            <span>Mengunggah berkas...</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-sand-200 overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!file || uploading}
        className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary-hover disabled:opacity-50 text-surface text-sm font-semibold transition-colors shadow-xs"
      >
        {uploading ? `Mengunggah (${progress}%)...` : 'Simpan & Unggah ke Storage'}
      </button>
    </form>
  );
};
