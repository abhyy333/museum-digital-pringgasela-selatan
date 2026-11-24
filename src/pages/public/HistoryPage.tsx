import React, { useEffect, useState } from 'react';
import { History as HistoryIcon, Bookmark, Landmark } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { publicApi } from '../../appwrite/publicApi';
import { VillageHistory, HistoryTranslation } from '../../types/schema';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorState } from '../../components/common/ErrorState';

export const HistoryPage: React.FC = () => {
  const { locale, t } = useLanguage();
  const [eras, setEras] = useState<VillageHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await publicApi.getHistory();
      setEras(res.eras || []);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat catatan sejarah desa.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-14">
      
      {/* Header */}
      <div className="max-w-3xl space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#132334] border border-[#1E3246] text-xs font-semibold text-terracotta uppercase tracking-wider">
          <HistoryIcon className="w-3.5 h-3.5" />
          <span>{t('Ruang Kuratorial & Linimasa', 'Curatorial Space & Timeline')}</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-[#F8F5EF]">
          {t('Linimasa Sejarah Peradaban Desa Pringgasela Selatan', 'Historical Chronicle of South Pringgasela')}
        </h1>
        <p className="text-[#E8DCC9]/80 text-sm sm:text-base leading-relaxed">
          {t(
            'Menelusuri jejak perintis pemukiman agraris, tumbuhnya sentra kerajinan tenun gedogan di lereng Rinjani, hingga pemekaran dan pelestarian identitas budaya Pringgasela Selatan.',
            'Tracing the roots of agrarian pioneers, the flourishing of backstrap weaving on Mount Rinjani’s foothills, to the official establishment of South Pringgasela.'
          )}
        </p>
      </div>

      {/* Timeline Section */}
      {loading ? (
        <LoadingSpinner message={t('Menyusun lembaran sejarah...', 'Compiling history annals...')} size="lg" />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchHistory} />
      ) : eras.length > 0 ? (
        <div className="relative border-l-2 border-terracotta/40 ml-4 sm:ml-8 pl-6 sm:pl-10 space-y-12">
          {eras.map((era) => {
            const trans: HistoryTranslation | undefined =
              era.translations?.find((tr: HistoryTranslation) => tr.locale === locale) ||
              era.translations?.find((tr: HistoryTranslation) => tr.locale === 'id') ||
              era.translations?.[0];

            return (
              <div key={era.$id} className="relative group">
                {/* Node on vertical timeline */}
                <div className="absolute -left-[31px] sm:-left-[47px] top-1.5 w-4 h-4 rounded-full bg-terracotta border-4 border-[#0B1623] shadow-md group-hover:scale-125 transition-transform" />

                <div className="bg-[#0E1A27] rounded-lg border border-[#1E3246] p-6 sm:p-8 space-y-5 hover:border-terracotta/70 transition-all shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1E3246]/60 pb-3">
                    <span className="font-mono text-xs sm:text-sm font-bold text-terracotta tracking-wider">
                      {era.startYear} – {era.endYear ? era.endYear : t('Sekarang', 'Present')}
                    </span>
                    <span className="text-[11px] text-[#8D9CAE] uppercase tracking-wider font-semibold">
                      {t('Babak Sejarah', 'Historical Era')}
                    </span>
                  </div>

                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#F8F5EF]">
                    {trans?.eraTitle || era.slug}
                  </h3>

                  <p className="text-sm text-[#E8DCC9]/85 font-sans leading-relaxed whitespace-pre-line">
                    {trans?.narrative}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-[#1E3246]/60 text-xs text-[#E8DCC9]/75">
                    {trans?.keyFigures && (
                      <div className="space-y-1">
                        <span className="text-[#8D9CAE] uppercase tracking-wider block font-semibold flex items-center gap-1.5">
                          <Bookmark className="w-3.5 h-3.5 text-terracotta" />
                          {t('Tokoh Kunci & Sesepuh', 'Key Figures & Elders')}
                        </span>
                        <p className="font-medium text-[#F8F5EF]">{trans.keyFigures}</p>
                      </div>
                    )}
                    {trans?.legacyToday && (
                      <div className="space-y-1">
                        <span className="text-[#8D9CAE] uppercase tracking-wider block font-semibold flex items-center gap-1.5">
                          <Landmark className="w-3.5 h-3.5 text-terracotta" />
                          {t('Warisan Budaya Hidup', 'Living Legacy Today')}
                        </span>
                        <p className="font-medium text-[#F8F5EF]">{trans.legacyToday}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-8 rounded-lg bg-[#0E1A27] border border-[#1E3246] text-center">
          <p className="text-sm text-[#E8DCC9]/80 font-serif">
            {t('Catatan sejarah desa sedang disempurnakan...', 'Village history annals are being compiled...')}
          </p>
        </div>
      )}

    </div>
  );
};
