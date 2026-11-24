import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { WeavingMotif } from '../../types/schema';
import { useLanguage } from '../../context/LanguageContext';
import { Badge } from '../common/Badge';
import { getFallbackImage, getFilePreviewUrl } from '../../utils/media';

interface MotifCardProps {
  motif: WeavingMotif;
}

export const MotifCard: React.FC<MotifCardProps> = ({ motif }) => {
  const { locale, t } = useLanguage();

  // Find active translation
  const trans =
    motif.translations?.find((tr) => tr.locale === locale) ||
    motif.translations?.find((tr) => tr.locale === 'id') ||
    motif.translations?.[0];

  const name = trans?.name || motif.slug;
  const philosophy = trans?.philosophy || '';
  const visualDesc = trans?.visualDescription || '';

  // Find primary media or pattern diagram
  const primaryMediaId = motif.media?.[0]?.mediaAssetId;
  const imageUrl = primaryMediaId
    ? getFilePreviewUrl(primaryMediaId, { width: 600, height: 400 })
    : getFallbackImage('motif');

  return (
    <article className="group bg-surface/95 rounded-[3px] border border-naturalBeige/80 overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 flex flex-col">
      {/* Motif Preview Visual */}
      <div className="relative aspect-4/3 bg-aged overflow-hidden border-b border-softLinen">
        <img
          src={imageUrl}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute top-3 left-3 flex items-center gap-2">
          {motif.codeName && (
            <span className="px-2.5 py-1 rounded-[2px] bg-charcoal/85 text-ivory text-xs font-mono font-medium tracking-wider">
              {motif.codeName}
            </span>
          )}
          {motif.isFeatured && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-[2px] bg-terracotta text-surface text-xs font-medium shadow-xs">
              <Sparkles className="w-3 h-3" />
              {t('Unggulan', 'Featured')}
            </span>
          )}
        </div>
      </div>

      {/* Motif Details Content */}
      <div className="p-6 flex-1 flex flex-col justify-between">
        <div>
          <div className="mb-2">
            <Badge variant="primary" size="sm">
              {t('Motif Tenun Sasak', 'Sasak Weaving Motif')}
            </Badge>
          </div>
          <h3 className="font-serif text-xl font-bold text-text group-hover:text-primary transition-colors line-clamp-1 mb-2">
            {name}
          </h3>
          <p className="text-sm text-muted line-clamp-3 leading-relaxed mb-4">
            {philosophy || visualDesc || t('Belum ada deskripsi filosofi.', 'No philosophical description available.')}
          </p>
        </div>

        <div className="pt-4 border-t border-border/60 flex items-center justify-between">
          <span className="text-xs text-secondary font-medium">
            {motif.contributor?.name ? `Koleksi: ${motif.contributor.name}` : t('Tradisi Sasak', 'Sasak Heritage')}
          </span>
          <Link
            to={`/motifs/${motif.slug}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-hover group/link transition-colors"
          >
            <span>{t('Pelajari Filosofi', 'Explore Meaning')}</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover/link:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </article>
  );
};
