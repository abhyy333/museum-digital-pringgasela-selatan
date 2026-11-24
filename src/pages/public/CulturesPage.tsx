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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      
      {/* Header */}
      <div className="max-w-3xl space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#132334] border border-[#1E3246] text-xs font-semibold text-terracotta uppercase tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{t('Warisan Budaya Takbenda', 'Intangible Living Traditions')}</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-[#F8F5EF]">
          {t('Tradisi Adat & Dzikir Saman Pringgasela', 'Customary Rites & Pringgasela Dzikir Saman')}
        </h1>
        <p className="text-[#E8DCC9]/80 text-sm sm:text-base leading-relaxed">
          {t(
            'Dokumentasi kesenian vokal zikir komunal, ritual daur hidup, dan tradisi keagamaan masyarakat Sasak Pringgasela Selatan. Menjaga nilai spiritualitas luhur dan kebersamaan antar-warga.',
            'Documentation of communal sacred vocal zikir, life-cycle rituals, and religious traditions of the Sasak community in South Pringgasela. Nurturing spiritual brotherhood and ancestral wisdom.'
          )}
        </p>
      </div>

      {/* Toolbar */}
      <div className="bg-[#0E1A27] p-4 sm:p-5 rounded-lg border border-[#1E3246]">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-[#8D9CAE] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('Cari tradisi, nama zikir, tata cara...', 'Search traditions, ritual, chant...')}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#1E3246] bg-[#0B1623] focus:border-terracotta focus:outline-hidden text-sm text-[#F8F5EF] placeholder-[#8D9CAE] transition-all"
          />
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="py-20">
          <LoadingSpinner message={t('Mengakses khazanah tradisi budaya...', 'Loading cultural traditions...')} />
        </div>
      ) : error ? (
        <ErrorState
          title={t('Gagal Memuat Tradisi', 'Failed to Load Traditions')}
          message={error}
          onRetry={fetchCultures}
        />
      ) : filteredCultures.length === 0 ? (
        <EmptyState
          title={t('Tradisi Tidak Ditemukan', 'No Traditions Found')}
          message={t(
            'Tidak ada tradisi adat yang sesuai dengan pencarian Anda.',
            'No cultural traditions match your search criteria.'
          )}
          actionLabel={t('Reset Pencarian', 'Reset Search')}
          onAction={() => setSearchQuery('')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredCultures.map((culture) => (
            <CultureCard key={culture.$id} culture={culture} />
          ))}
        </div>
      )}

    </div>
  );
};
