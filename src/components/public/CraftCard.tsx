import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Craft } from '../../types/schema';
import { useLanguage } from '../../context/LanguageContext';
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
    tenun: { id: 'Tenun Gedogan Tradisional', en: 'Traditional Backstrap Weaving' },
    batik: { id: 'Batik Sasambo NTB', en: 'Sasambo Batik NTB' },
    kerajinan_tangan: { id: 'Kriya Tangan Adat', en: 'Customary Craft' },
    lainnya: { id: 'Karya Tekstil Sasak', en: 'Sasak Textile Artifact' },
  };

  const typeLabel = typeLabels[craft.craftType] || typeLabels.tenun;

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
        <div className="absolute top-3 left-3">
          <span className="px-2.5 py-1 rounded-md bg-[#0B1623]/85 backdrop-blur-xs text-[#E8DCC9] border border-[#1E3246] text-xs font-semibold uppercase tracking-wider">
            {t(typeLabel.id, typeLabel.en)}
          </span>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <h3 className="font-serif text-lg font-bold text-[#F8F5EF] group-hover:text-terracotta transition-colors line-clamp-1 mb-2">
            {title}
          </h3>
          <p className="text-xs sm:text-sm text-[#E8DCC9]/75 line-clamp-3 leading-relaxed font-sans">
            {summary || t('Karya tekstil luhur warisan leluhur Sasak di Pringgasela Selatan.', 'Heritage textile craft of the Sasak ancestors in South Pringgasela.')}
          </p>
        </div>

        <div className="pt-3 border-t border-[#1E3246]/60 flex items-center justify-between">
          <span className="text-[11px] text-[#8D9CAE]">
            {t('Kriya Budaya', 'Cultural Craft')}
          </span>
          <Link
            to={`/crafts/${craft.slug}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-terracotta hover:text-terracotta-burnt transition-colors group/link"
          >
            <span>{t('Pelajari Kriya', 'Discover Craft')}</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover/link:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </article>
  );
};
