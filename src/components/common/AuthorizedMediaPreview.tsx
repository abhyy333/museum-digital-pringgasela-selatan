import React, { useEffect, useState } from 'react';
import { FileText, Film, Lock, Music, Image as ImageIcon } from 'lucide-react';
import { APPWRITE_CONFIG } from '../../appwrite/config';
import { getFilePreviewUrl, getFileViewUrl } from '../../utils/media';

interface AuthorizedMediaPreviewProps {
  fileId: string;
  mediaType?: string;
  mimeType?: string;
  isPublic?: boolean;
  alt?: string;
  width?: number;
  height?: number;
  className?: string;
  controls?: boolean;
}

/**
 * Renders Storage media previews in CMS safely for both public and private files.
 * For private files (`read("team:museum-admins")`), attaches Appwrite session fallback cookies
 * via authenticated fetch into a temporary object URL so browser <img>/<video>/<audio> elements
 * render without leaking public access or failing with cross-origin anonymous 404s.
 */
export const AuthorizedMediaPreview: React.FC<AuthorizedMediaPreviewProps> = ({
  fileId,
  mediaType = 'image',
  mimeType = '',
  isPublic = false,
  alt = '',
  width = 400,
  height = 300,
  className = 'w-full h-full object-cover',
  controls = true,
}) => {
  const isImage = mediaType === 'image' || mimeType.startsWith('image/');
  const isVideo = mediaType === 'video' || mimeType.startsWith('video/');
  const isAudio = mediaType === 'audio' || mimeType.startsWith('audio/');

  const directUrl = isImage
    ? getFilePreviewUrl(fileId, { width, height })
    : getFileViewUrl(fileId);

  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [failedPrivateLoad, setFailedPrivateLoad] = useState(false);

  useEffect(() => {
    if (!fileId || isPublic || (!isImage && !isVideo && !isAudio)) {
      setBlobUrl(null);
      setFailedPrivateLoad(false);
      return;
    }

    let cancelled = false;
    let createdUrl: string | null = null;
    const controller = new AbortController();

    async function loadProtectedBlob() {
      try {
        setFailedPrivateLoad(false);
        const headers: Record<string, string> = {
          'X-Appwrite-Project': APPWRITE_CONFIG.projectId,
        };
        const cookieFallback = localStorage.getItem('cookieFallback');
        if (cookieFallback) {
          headers['X-Fallback-Cookies'] = cookieFallback;
        }

        const res = await fetch(directUrl, {
          credentials: 'include',
          headers,
          signal: controller.signal,
        });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const blob = await res.blob();
        createdUrl = URL.createObjectURL(blob);
        if (!cancelled) {
          setBlobUrl(createdUrl);
        } else {
          URL.revokeObjectURL(createdUrl);
        }
      } catch {
        if (!cancelled) {
          setFailedPrivateLoad(true);
          setBlobUrl(null);
        }
      }
    }

    loadProtectedBlob();

    return () => {
      cancelled = true;
      controller.abort();
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [fileId, isPublic, isImage, isVideo, isAudio, directUrl]);

  const effectiveUrl = isPublic ? directUrl : blobUrl;

  if (!fileId) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-sand-100 text-muted">
        <ImageIcon className="w-6 h-6" />
      </div>
    );
  }

  if (isImage) {
    if (!effectiveUrl) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-sand-100 text-muted text-[10px] gap-1 p-2 text-center">
          <Lock className="w-5 h-5 text-amber-700" />
          <span>{failedPrivateLoad ? 'Privat (Staf)' : 'Memuat pratinjau...'}</span>
        </div>
      );
    }
    return <img src={effectiveUrl} alt={alt} className={className} />;
  }

  if (isVideo) {
    if (!effectiveUrl) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-charcoal text-surface/80 text-[10px] gap-1 p-2">
          <Film className="w-6 h-6" />
          <span>{failedPrivateLoad ? 'Video Privat' : 'Memuat video...'}</span>
        </div>
      );
    }
    return <video src={effectiveUrl} controls={controls} className={className} />;
  }

  if (isAudio) {
    return (
      <div className="p-3 w-full flex flex-col items-center gap-2">
        <Music className="w-7 h-7 text-accent" />
        {effectiveUrl ? (
          <audio src={effectiveUrl} controls={controls} className="w-full" />
        ) : (
          <span className="text-[10px] text-muted">
            {failedPrivateLoad ? 'Audio Privat (Staf)' : 'Memuat audio...'}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center text-muted gap-1">
      <FileText className="w-8 h-8" />
      <span className="text-[10px] font-mono">Dokumen</span>
    </div>
  );
};
