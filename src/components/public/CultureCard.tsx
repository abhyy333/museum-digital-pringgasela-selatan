import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Moon } from 'lucide-react';
import { Culture } from '../../types/schema';
import { useLanguage } from '../../context/LanguageContext';
import { Badge } from '../common/Badge';
import { getFallbackImage, getFilePreviewUrl } from '../../utils/media';

interface CultureCardProps {
  culture: Culture;
}

export const CultureCard: React.FC<CultureCardProps> = ({ culture }) => {
  const { locale, t } = useLanguage();

  const trans =
    culture.translations?.find((tr) => tr.locale === locale) ||
    culture.translations?.find((tr) => tr.locale === 'id') ||
    culture.translations?.[0];

  const title = trans?.title || culture.slug;
  const summary = trans?.summary || trans?.description || '';

  const primaryMediaId = culture.media?.[0]?.mediaAssetId;
  const imageUrl = primaryMediaId
    ? getFilePreviewUrl(primaryMediaId, { width: 600, height: 400 })
    : getFallbackImage('culture');

  const periodicityMap: Record<string, { id: string; en: string }> = {
    rutin_mingguan: { id: 'Rutin Mingguan', en: 'Weekly Ritual' },
    tahunan: { id: 'Perayaan Tahunan', en: 'Annual Celebration' },
    siklus_hidup: { id: 'Upacara Daur Hidup', en: 'Life-Cycle Ceremony' },
    insidental: { id: 'Ritual Khusus', en: 'Special Sacred Ritual' },
  };

  const periodLabel = periodicityMap[culture.periodicity] || periodicityMap.insidental;

  return (
    <article className="group bg-surface rounded-2xl border border-border overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col">
      <div className="relative aspect-4/3 bg-sand-100 overflow-hidden">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <Badge variant="accent" size="sm">
            <Moon className="w-3 h-3 mr-1" />
            {t(periodLabel.id, periodLabel.en)}
          </Badge>
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-serif text-xl font-bold text-text group-hover:text-primary transition-colors line-clamp-1 mb-2">
            {title}
          </h3>
          <p className="text-sm text-muted line-clamp-3 leading-relaxed mb-4">
            {summary || t('Tradisi spiritual dan adat masyarakat Pringgasela.', 'Spiritual tradition and customs of Pringgasela.')}
          </p>
        </div>

        <div className="pt-4 border-t border-border/60 flex items-center justify-between">
          <span className="text-xs text-secondary font-medium">
            {t('Warisan Takbenda', 'Intangible Heritage')}
          </span>
          <Link
            to={`/cultures/${culture.slug}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:text-accent-hover group/link transition-colors"
          >
            <span>{t('Pelajari Tradisi', 'Explore Heritage')}</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover/link:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </article>
  );
};
