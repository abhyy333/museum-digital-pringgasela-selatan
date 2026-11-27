import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, RefreshCw } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { WeavingMotif, VillageHistory, Culture } from '../../types/schema';
import { getFilePreviewUrl, resolveMediaFileId } from '../../utils/media';
import { pickTranslation } from '../../utils/i18n';

interface LiveMuseumArchiveProps {
  motifs: WeavingMotif[];
  cultures: Culture[];
  historyEras: VillageHistory[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

/**
 * LiveMuseumArchive — Below-the-fold live Appwrite Cloud archive bridge.
 * Renders real CMS records from museum-public-api on the continuous archival paper canvas
 * with explicit loading, empty, and error states.
 */
export const LiveMuseumArchive: React.FC<LiveMuseumArchiveProps> = ({
  motifs,
  cultures,
  historyEras,
  loading,
  error,
  onRetry,
}) => {
  const { locale, t } = useLanguage();

  return (
    <section
      aria-labelledby="arsip-digital-heading"
      className="relative archival-paper-canvas py-12 sm:py-16"
    >
      <div className="max-w-[1440px] mx-auto px-6 sm:px-10 xl:px-14 space-y-12">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#D7CBB6] pb-5">
          <div className="space-y-1.5">
            <span className="text-[11px] uppercase tracking-[0.2em] text-[#9A4428] font-semibold block">
              {t('REPOSITORI KURATORIAL TERKINI', 'CURRENT CURATORIAL REPOSITORY')}
            </span>
            <h2 id="arsip-digital-heading" className="font-serif text-2xl sm:text-3xl font-bold text-[#23211E]">
              {t('Dokumentasi Arsip Digital Desa', 'Village Digital Archive Records')}
            </h2>
          </div>
          <Link
            to="/motifs"
            className="inline-flex items-center gap-2 min-h-[44px] text-xs font-semibold uppercase tracking-wider text-[#9A4428] hover:text-[#7A331C] transition-colors"
          >
            <span>{t('Buka Katalog Lengkap', 'Open Full Catalog')}</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>

        {/* Loading / Error / Data States */}
        {loading ? (
          <div
            role="status"
            aria-live="polite"
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {[0, 1, 2].map((idx) => (
              <div
                key={idx}
                className="bg-[#FAF5EB] border border-[#DDD2BE] p-5 space-y-3 animate-pulse"
              >
                <div className="aspect-[16/10] bg-[#E8DEC9]" />
                <div className="h-4 w-2/3 bg-[#E8DEC9]" />
                <div className="h-3 w-full bg-[#EFE7D8]" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div
            role="alert"
            className="bg-[#FAF5EB] border border-[#D4B5A7] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="space-y-1">
              <h3 className="font-serif text-lg font-bold text-[#23211E]">
                {t('Gagal memuat data arsip dari server museum', 'Unable to load archive records from museum server')}
              </h3>
              <p className="text-sm text-[#5A5248]">{error}</p>
            </div>
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-2 min-h-[44px] px-5 py-2.5 bg-[#9A4428] hover:bg-[#7E351D] text-[#FAF6EE] text-xs font-semibold rounded-md transition-colors shrink-0"
            >
              <RefreshCw className="w-4 h-4" aria-hidden="true" />
              <span>{t('Muat Ulang Arsip', 'Retry Archive')}</span>
            </button>
          </div>
        ) : motifs.length === 0 && cultures.length === 0 && historyEras.length === 0 ? (
          <div className="bg-[#FAF5EB] border border-[#DDD2BE] p-8 text-center space-y-2">
            <h3 className="font-serif text-lg font-bold text-[#23211E]">
              {t('Belum ada arsip yang dipublikasikan', 'No published archive entries yet')}
            </h3>
            <p className="text-sm text-[#5A5248]">
              {t(
                'Kurator desa dapat mempublikasikan motif, tradisi, dan catatan sejarah melalui Portal Pengelola.',
                'Village curators can publish motifs, traditions, and historical chronicles via the Staff Portal.'
              )}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Column 1: Featured Motifs from Appwrite */}
            {motifs.slice(0, 1).map((motif) => {
              const trans = pickTranslation(motif.translations, locale);
              const mediaId = resolveMediaFileId(motif.media?.[0]);
              const imgUrl = mediaId
                ? getFilePreviewUrl(mediaId, { width: 800, height: 500 })
                : '/assets/collection-motif-tenun.webp';

              return (
                <article
                  key={motif.$id}
                  className="bg-[#FAF5EB] border border-[#D7CBB6] flex flex-col justify-between overflow-hidden"
                >
                  <div>
                    <div className="aspect-[16/10] bg-[#E8DEC9] overflow-hidden">
                      <img
                        src={imgUrl}
                        alt={trans?.name || motif.slug}
                        width={800}
                        height={500}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-5 space-y-2">
                      <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-[#9A4428] font-semibold">
                        <span>{t('Entri Motif', 'Motif Entry')}</span>
                        {motif.codeName && <span className="font-mono text-[#5A5248]">{motif.codeName}</span>}
                      </div>
                      <h3 className="font-serif text-xl font-bold text-[#23211E]">
                        {trans?.name || motif.slug}
                      </h3>
                      <p className="text-xs sm:text-sm text-[#4F4840] leading-relaxed line-clamp-3">
                        {trans?.philosophy || trans?.visualDescription}
                      </p>
                    </div>
                  </div>
                  <div className="px-5 pb-5">
                    <Link
                      to={`/motifs/${motif.slug}`}
                      className="inline-flex items-center gap-2 min-h-[44px] text-xs font-semibold text-[#9A4428] hover:text-[#7A331C] transition-colors"
                    >
                      <span>{t('Kaji Dokumentasi Motif', 'Read Motif Record')}</span>
                      <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </Link>
                  </div>
                </article>
              );
            })}

            {/* Column 2: Living Culture Entry from Appwrite */}
            {cultures.slice(0, 1).map((culture) => {
              const trans = pickTranslation(culture.translations, locale);
              const mediaId = resolveMediaFileId(culture.media?.[0]);
              const imgUrl = mediaId
                ? getFilePreviewUrl(mediaId, { width: 800, height: 500 })
                : '/assets/collection-arsitektur.webp';

              return (
                <article
                  key={culture.$id}
                  className="bg-[#FAF5EB] border border-[#D7CBB6] flex flex-col justify-between overflow-hidden"
                >
                  <div>
                    <div className="aspect-[16/10] bg-[#E8DEC9] overflow-hidden">
                      <img
                        src={imgUrl}
                        alt={trans?.title || culture.slug}
                        width={800}
                        height={500}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-5 space-y-2">
                      <span className="text-[11px] uppercase tracking-wider text-[#9A4428] font-semibold block">
                        {t('Tradisi & Kisah Lisan', 'Living Tradition')}
                      </span>
                      <h3 className="font-serif text-xl font-bold text-[#23211E]">
                        {trans?.title || culture.slug}
                      </h3>
                      <p className="text-xs sm:text-sm text-[#4F4840] leading-relaxed line-clamp-3">
                        {trans?.summary || trans?.description}
                      </p>
                    </div>
                  </div>
                  <div className="px-5 pb-5">
                    <Link
                      to={`/cultures/${culture.slug}`}
                      className="inline-flex items-center gap-2 min-h-[44px] text-xs font-semibold text-[#9A4428] hover:text-[#7A331C] transition-colors"
                    >
                      <span>{t('Baca Catatan Tradisi', 'Read Tradition Record')}</span>
                      <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </Link>
                  </div>
                </article>
              );
            })}

            {/* Column 3: Historical Era Chronicle from Appwrite */}
            {historyEras.slice(0, 1).map((era) => {
              const trans = pickTranslation(era.translations, locale);

              return (
                <article
                  key={era.$id}
                  className="bg-[#FAF5EB] border border-[#D7CBB6] p-6 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-[#E3D8C5] pb-3">
                      <span className="text-[11px] uppercase tracking-wider text-[#9A4428] font-semibold">
                        {t('Kronik Sejarah Desa', 'Village Chronicle')}
                      </span>
                      <span className="font-mono text-xs font-semibold text-[#4F4840]">
                        {era.startYear} - {era.endYear || t('Sekarang', 'Present')}
                      </span>
                    </div>
                    <h3 className="font-serif text-xl font-bold text-[#23211E]">
                      {trans?.eraTitle || era.slug}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#4F4840] leading-relaxed line-clamp-5">
                      {trans?.narrative}
                    </p>
                  </div>
                  <div className="pt-4">
                    <Link
                      to="/history"
                      className="inline-flex items-center gap-2 min-h-[44px] text-xs font-semibold text-[#9A4428] hover:text-[#7A331C] transition-colors"
                    >
                      <span>{t('Telusuri Linimasa Lengkap', 'Explore Full Timeline')}</span>
                      <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
