import React, { useEffect, useState } from 'react';
import { Search, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { publicApi } from '../../appwrite/publicApi';
import { Culture } from '../../types/schema';
import { CultureCard } from '../../components/public/CultureCard';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorState } from '../../components/common/ErrorState';
import { EmptyState } from '../../components/common/EmptyState';

export const CulturesPage: React.FC = () => {
  const { locale, t } = useLanguage();
  const [cultures, setCultures] = useState<Culture[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCultures = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await publicApi.getCultures({ limit: 50 });
      setCultures(res.items || []);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat warisan budaya.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCultures();
  }, []);

  const filteredCultures = cultures.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const trans =
      c.translations?.find((tr) => tr.locale === locale) ||
      c.translations?.[0];
    const titleMatch = trans?.title?.toLowerCase().includes(q) || false;
    const sumMatch = trans?.summary?.toLowerCase().includes(q) || false;
    const slugMatch = c.slug.toLowerCase().includes(q);
    return titleMatch || sumMatch || slugMatch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      
      {/* Header */}
      <div className="max-w-3xl space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-sand-200 text-xs font-semibold text-accent uppercase tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{t('Warisan Budaya Takbenda', 'Intangible Living Traditions')}</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-text">
          {t('Tradisi Adat & Dzikir Saman', 'Cultural Rites & Dzikir Saman')}
        </h1>
        <p className="text-muted text-base leading-relaxed">
          {t(
            'Preservasi dokumentasi seni zikir gerak dan suara Dzikir Saman, upacara daur hidup Sasak, serta norma adat luhur yang mengakar di Desa Pringgasela Selatan.',
            'Documentation of sacred communal chants, life-cycle rituals, and customary values of South Pringgasela.'
          )}
        </p>
      </div>

      {/* Search Bar */}
      <div className="bg-surface p-4 sm:p-6 rounded-2xl border border-border shadow-xs flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('Cari nama ritual, doa, tradisi...', 'Search ritual name, tradition...')}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-sand-50 focus:bg-surface focus:border-primary focus:outline-hidden text-sm"
          />
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <LoadingSpinner message={t('Menghimpun arsip tradisi...', 'Loading traditions...')} size="lg" />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchCultures} />
      ) : filteredCultures.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCultures.map((cult) => (
            <CultureCard key={cult.$id} culture={cult} />
          ))}
        </div>
      ) : (
        <EmptyState
          title={t('Tradisi Tidak Ditemukan', 'No Cultural Traditions Found')}
          message={t('Tidak ada data tradisi yang cocok.', 'No cultural entries matched your query.')}
          actionText={t('Reset Pencarian', 'Reset Search')}
          onAction={() => setSearchQuery('')}
        />
      )}

    </div>
  );
};
