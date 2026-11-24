import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { WeavingMotif } from '../../types/schema';
import { useLanguage } from '../../context/LanguageContext';
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
    <article className="group bg-[#0E1A27] rounded-lg border border-[#1E3246] overflow-hidden hover:border-terracotta/70 transition-all duration-300 flex flex-col">
      {/* Motif Preview Visual */}
      <div className="relative aspect-[4/3] bg-[#17283A] overflow-hidden">
        <img
          src={imageUrl}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0E1A27] via-transparent to-transparent opacity-60" />
        <div className="absolute top-3 left-3 flex items-center gap-2">
          {motif.codeName && (
            <span className="px-2.5 py-1 rounded-md bg-[#0B1623]/85 backdrop-blur-xs text-[#E8DCC9] border border-[#1E3246] text-xs font-mono font-medium tracking-wider">
              {motif.codeName}
            </span>
          )}
          {motif.isFeatured && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-terracotta text-[#F8F5EF] text-xs font-medium shadow-xs">
              <Sparkles className="w-3 h-3" />
              {t('Unggulan', 'Featured')}
            </span>
          )}
        </div>
      </div>

      {/* Motif Details Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-terracotta block mb-1">
            {t('Motif Tenun Sasak', 'Sasak Weaving Motif')}
          </span>
          <h3 className="font-serif text-lg font-bold text-[#F8F5EF] group-hover:text-terracotta transition-colors line-clamp-1 mb-2">
            {name}
          </h3>
          <p className="text-xs sm:text-sm text-[#E8DCC9]/75 line-clamp-3 leading-relaxed font-sans">
            {philosophy || visualDesc || t('Belum ada uraian filosofi lisan.', 'No oral philosophical description available.')}
          </p>
        </div>

        <div className="pt-3 border-t border-[#1E3246]/60 flex items-center justify-between">
          <span className="text-[11px] text-[#8D9CAE]">
            {t('Pringgasela Selatan', 'South Pringgasela')}
          </span>
          <Link
            to={`/motifs/${motif.slug}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-terracotta hover:text-terracotta-burnt transition-colors group/link"
          >
            <span>{t('Kaji Filosofi', 'Read Philosophy')}</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover/link:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </article>
  );
};
