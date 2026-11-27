import React, { useEffect, useState } from 'react';
import { History as HistoryIcon, Calendar, Bookmark, Landmark } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { publicApi } from '../../appwrite/publicApi';
import { VillageHistory } from '../../types/schema';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorState } from '../../components/common/ErrorState';
import { EmptyState } from '../../components/common/EmptyState';
import { pickTranslation, useDocumentTitle } from '../../utils/i18n';

export const HistoryPage: React.FC = () => {
  const { locale, t } = useLanguage();
  useDocumentTitle(
    t(
      'Linimasa Sejarah Desa — Museum Digital Pringgasela Selatan',
      'Village Historical Chronicle — South Pringgasela Digital Museum'
    )
  );
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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      
      {/* Header */}
      <div className="max-w-3xl space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-sand-200 text-xs font-semibold text-primary uppercase tracking-wider">
          <HistoryIcon className="w-3.5 h-3.5" />
          <span>{t('Arsip Kronologis Desa', 'Chronological Village Archives')}</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-text">
          {t('Linimasa Sejarah Peradaban Desa Pringgasela Selatan', 'Historical Chronicle of South Pringgasela')}
        </h1>
        <p className="text-muted text-base leading-relaxed">
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
        <div className="relative border-l-2 border-primary/30 ml-4 sm:ml-8 pl-6 sm:pl-10 space-y-12">
          {eras.map((era, index) => {
            const trans = pickTranslation(era.translations, locale);

            const title = trans?.eraTitle || era.slug;
            const narrative = trans?.narrative || '';
            const keyFigures = trans?.keyFigures || '';
            const legacy = trans?.legacyToday || '';

            return (
              <div key={era.$id} className="relative group">
                
                {/* Node bullet */}
                <div className="absolute -left-[31px] sm:-left-[47px] top-1.5 w-6 h-6 rounded-full bg-surface border-4 border-primary flex items-center justify-center shadow-xs group-hover:scale-125 transition-transform" />

                {/* Card Container */}
                <article className="bg-surface rounded-2xl border border-border p-6 sm:p-8 space-y-5 shadow-xs hover:shadow-md transition-shadow">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
                    <span className="flex items-center gap-2 font-mono text-sm font-bold text-accent bg-accent/10 px-3 py-1 rounded-md">
                      <Calendar className="w-4 h-4" />
                      {era.startYear ? `${era.startYear} ${era.endYear ? `– ${era.endYear}` : '– Kini'}` : 'Era Leluhur'}
                    </span>
                    <span className="text-xs uppercase tracking-wider text-muted font-medium">
                      {t(`Fase ${index + 1}`, `Phase ${index + 1}`)}
                    </span>
                  </div>

                  <h3 className="font-serif text-2xl sm:text-3xl font-bold text-text">
                    {title}
                  </h3>

                  <div className="text-base text-text/90 leading-relaxed font-sans whitespace-pre-line">
                    {narrative}
                  </div>

                  {keyFigures && (
                    <div className="bg-sand-50 p-4 rounded-xl border border-border/60 text-xs space-y-1">
                      <span className="font-semibold text-secondary flex items-center gap-1.5">
                        <Landmark className="w-3.5 h-3.5" />
                        {t('Tokoh Kunci & Pemimpin Adat', 'Key Pioneers & Customary Elders')}:
                      </span>
                      <p className="text-text/80">{keyFigures}</p>
                    </div>
                  )}

                  {legacy && (
                    <div className="bg-sand-100 p-4 rounded-xl border border-border/60 text-xs space-y-1">
                      <span className="font-semibold text-primary flex items-center gap-1.5">
                        <Bookmark className="w-3.5 h-3.5" />
                        {t('Warisan Abadi Masa Kini', 'Lasting Legacy Today')}:
                      </span>
                      <p className="text-text/80">{legacy}</p>
                    </div>
                  )}
                </article>

              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title={t('Arsip Sejarah Belum Tersedia', 'History Timeline Empty')}
          message={t('Belum ada babak sejarah yang dipublikasikan.', 'No historical eras published.')}
        />
      )}

    </div>
  );
};
