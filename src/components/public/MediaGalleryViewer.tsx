import React, { useState } from 'react';
import { Film, Music, FileText, Sparkles, ExternalLink, Camera } from 'lucide-react';
import { ResolvedMediaItem } from '../../types/schema';
import { useLanguage } from '../../context/LanguageContext';
import { getFallbackImage, getFilePreviewUrl, getFileViewUrl, resolveMediaFileId } from '../../utils/media';

interface MediaGalleryViewerProps {
  media?: ResolvedMediaItem[];
  fallbackType: 'motif' | 'craft' | 'culture';
  title: string;
  aspectClass?: string;
}

export const MediaGalleryViewer: React.FC<MediaGalleryViewerProps> = ({
  media = [],
  fallbackType,
  title,
  aspectClass = 'aspect-4/3',
}) => {
  const { locale, t } = useLanguage();
  const [selectedIdx, setSelectedIdx] = useState(0);

  const safeIdx = selectedIdx < media.length ? selectedIdx : 0;
  const activeItem = media[safeIdx];
  const activeFileId = resolveMediaFileId(activeItem);
  const activeMediaType = activeItem?.mediaType || 'image';
  const viewUrl = activeFileId ? getFileViewUrl(activeFileId) : '';

  const caption = activeItem
    ? locale === 'en'
      ? activeItem.captionEn || activeItem.captionId
      : activeItem.captionId || activeItem.captionEn
    : '';
  const altText = activeItem
    ? locale === 'en'
      ? activeItem.altTextEn || activeItem.altTextId || title
      : activeItem.altTextId || activeItem.altTextEn || title
    : title;

  return (
    <div className="space-y-4">
      <div
        className={`rounded-2xl border border-border overflow-hidden bg-sand-100 ${aspectClass} shadow-sm relative group`}
      >
        {!activeFileId ? (
          <img
            src={getFallbackImage(fallbackType)}
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : activeMediaType === 'video' ? (
          <video
            key={activeFileId}
            controls
            playsInline
            preload="metadata"
            className="w-full h-full object-contain bg-charcoal"
            src={viewUrl}
          >
            {t('Browser Anda tidak mendukung pemutar video.', 'Your browser does not support video playback.')}
          </video>
        ) : activeMediaType === 'audio' ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 sm:p-8 text-center bg-gradient-to-br from-sand-100 to-sand-200 space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Music className="w-8 h-8" />
            </div>
            <div className="space-y-1 max-w-md">
              <p className="text-xs font-semibold uppercase tracking-wider text-secondary">
                {activeItem?.isAudioChant
                  ? t('Rekaman Audio / Pelafalan Adat', 'Cultural Chant / Audio Recording')
                  : t('Arsip Audio Museum', 'Museum Audio Archive')}
              </p>
              <p className="font-serif text-lg font-bold text-text">
                {caption || title}
              </p>
            </div>
            <audio key={activeFileId} controls preload="metadata" className="w-full max-w-md" src={viewUrl}>
              {t('Browser Anda tidak mendukung pemutar audio.', 'Your browser does not support audio playback.')}
            </audio>
          </div>
        ) : activeMediaType === 'document' ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-sand-50 space-y-3">
            <FileText className="w-12 h-12 text-primary" />
            <p className="font-serif text-lg font-bold text-text">{caption || title}</p>
            <a
              href={viewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary-hover transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              {t('Buka Dokumen Arsip', 'Open Archival Document')}
            </a>
          </div>
        ) : (
          <img
            src={viewUrl}
            alt={altText}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
          />
        )}
      </div>

      {(caption || activeItem?.photographer) && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-muted">
          {caption && <p className="italic">{caption}</p>}
          {activeItem?.photographer && (
            <span className="inline-flex items-center gap-1.5 font-medium text-secondary">
              <Camera className="w-3.5 h-3.5" />
              {t('Dokumentasi:', 'Credit:')} {activeItem.photographer}
            </span>
          )}
        </div>
      )}

      {media.length > 1 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-2">
          {media.map((m, idx) => {
            const fid = resolveMediaFileId(m);
            const mType = m.mediaType || 'image';
            const isSelected = safeIdx === idx;
            return (
              <button
                key={`${fid}-${idx}`}
                type="button"
                onClick={() => setSelectedIdx(idx)}
                className={`relative w-24 h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 bg-sand-100 ${
                  isSelected
                    ? 'border-primary ring-2 ring-primary/20'
                    : 'border-border hover:border-secondary'
                }`}
              >
                {mType === 'video' ? (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-charcoal text-white text-[10px] gap-1">
                    <Film className="w-4 h-4" />
                    <span>Video</span>
                  </div>
                ) : mType === 'audio' ? (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-sand-200 text-primary text-[10px] gap-1">
                    <Music className="w-4 h-4" />
                    <span>Audio</span>
                  </div>
                ) : mType === 'document' ? (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-sand-50 text-muted text-[10px] gap-1">
                    <FileText className="w-4 h-4" />
                    <span>PDF</span>
                  </div>
                ) : (
                  <img
                    src={getFilePreviewUrl(fid, { width: 150, height: 100 })}
                    alt={m.captionId || `${title} ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                )}
                {m.isPatternDiagram && (
                  <span className="absolute bottom-0 inset-x-0 bg-primary/90 text-white text-[9px] font-bold py-0.5 text-center flex items-center justify-center gap-0.5">
                    <Sparkles className="w-2.5 h-2.5" /> Diagram
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
