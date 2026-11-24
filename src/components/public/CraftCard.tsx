import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Craft } from '../../types/schema';
import { useLanguage } from '../../context/LanguageContext';
import { Badge } from '../common/Badge';
import { getFallbackImage, getFilePreviewUrl } from '../../utils/media';

interface CraftCardProps {
  craft: Craft;
}

export const CraftCard: React.FC<CraftCardProps> = ({ craft }) => {
  const { locale, t } = useLanguage();

  const trans =
    craft.translations?.find((tr) => tr.locale === locale) ||
    craft.translations?.find((tr) => tr.locale === 'id') ||
    craft.translations?.[0];

  const title = trans?.title || craft.slug;
  const summary = trans?.summary || trans?.technique || '';

  const primaryMediaId = craft.media?.[0]?.mediaAssetId;
  const imageUrl = primaryMediaId
    ? getFilePreviewUrl(primaryMediaId, { width: 600, height: 400 })
    : getFallbackImage('craft');

  const typeLabels: Record<string, { id: string; en: string }> = {
    tenun: { id: 'Tenun Tradisional', en: 'Traditional Weaving' },
    batik: { id: 'Batik Sasambo', en: 'Sasambo Batik' },
    kerajinan_tangan: { id: 'Kerajinan Tangan', en: 'Handicraft' },
    lainnya: { id: 'Karya Tekstil', en: 'Textile Artifact' },
  };

  const typeLabel = typeLabels[craft.craftType] || typeLabels.tenun;

  return (
    <article className="group bg-surface/95 rounded-[3px] border border-naturalBeige/80 overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 flex flex-col">
      <div className="relative aspect-4/3 bg-aged overflow-hidden border-b border-softLinen">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute top-3 left-3">
          <Badge variant="secondary" size="sm">
            {t(typeLabel.id, typeLabel.en)}
          </Badge>
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-serif text-xl font-bold text-text group-hover:text-primary transition-colors line-clamp-1 mb-2">
            {title}
          </h3>
          <p className="text-sm text-muted line-clamp-3 leading-relaxed mb-4">
            {summary || t('Karya tekstil luhur warisan leluhur Sasak.', 'Heritage textile craft of the Sasak ancestors.')}
          </p>
        </div>

        <div className="pt-4 border-t border-border/60 flex items-center justify-between">
          <span className="text-xs text-secondary font-medium">
            {craft.contributor?.name || t('Sentra Pringgasela', 'Pringgasela Artisan')}
          </span>
          <Link
            to={`/crafts/${craft.slug}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-hover group/link transition-colors"
          >
            <span>{t('Lihat Detail', 'View Details')}</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover/link:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </article>
  );
};
