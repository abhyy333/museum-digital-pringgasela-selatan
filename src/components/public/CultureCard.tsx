import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Moon } from 'lucide-react';
import { Culture } from '../../types/schema';
import { useLanguage } from '../../context/LanguageContext';
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
    insidental: { id: 'Ritual Khusus Adat', en: 'Special Sacred Ritual' },
  };

  const periodLabel = periodicityMap[culture.periodicity] || periodicityMap.insidental;

  return (
    <article className="group bg-[#0E1A27] rounded-lg border border-[#1E3246] overflow-hidden hover:border-terracotta/70 transition-all duration-300 flex flex-col">
      <div className="relative aspect-[4/3] bg-[#17283A] overflow-hidden">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0E1A27] via-transparent to-transparent opacity-60" />
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#0B1623]/85 backdrop-blur-xs text-terracotta border border-[#1E3246] text-xs font-semibold uppercase tracking-wider">
            <Moon className="w-3 h-3 text-terracotta" />
            {t(periodLabel.id, periodLabel.en)}
          </span>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <h3 className="font-serif text-lg font-bold text-[#F8F5EF] group-hover:text-terracotta transition-colors line-clamp-1 mb-2">
            {title}
          </h3>
          <p className="text-xs sm:text-sm text-[#E8DCC9]/75 line-clamp-3 leading-relaxed font-sans">
            {summary || t('Kesenian dan tradisi lisan luhur masyarakat Sasak Pringgasela.', 'Sacred traditional arts and oral heritage of the Sasak Pringgasela community.')}
          </p>
        </div>

        <div className="pt-3 border-t border-[#1E3246]/60 flex items-center justify-between">
          <span className="text-[11px] text-[#8D9CAE]">
            {t('Tradisi Hidup', 'Living Heritage')}
          </span>
          <Link
            to={`/cultures/${culture.slug}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-terracotta hover:text-terracotta-burnt transition-colors group/link"
          >
            <span>{t('Kaji Tradisi', 'Explore Tradition')}</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover/link:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </article>
  );
};
