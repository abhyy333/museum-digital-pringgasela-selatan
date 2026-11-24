import React, { useEffect, useState, useMemo } from 'react';
import { Search, Sparkles } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { publicApi } from '../../appwrite/publicApi';
import { Craft, CraftType } from '../../types/schema';
import { CraftCard } from '../../components/public/CraftCard';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorState } from '../../components/common/ErrorState';
import { EmptyState } from '../../components/common/EmptyState';

export const CraftsPage: React.FC = () => {
  const { locale, t } = useLanguage();
  const [crafts, setCrafts] = useState<Craft[]>([]);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCrafts = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await publicApi.getCrafts({ limit: 50 });
      setCrafts(res.items || []);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat katalog kerajinan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCrafts();
  }, []);

  const craftTypes: Array<{ key: string; labelId: string; labelEn: string }> = [
    { key: 'all', labelId: 'Semua Tekstil', labelEn: 'All Textiles' },
    { key: 'tenun', labelId: 'Tenun Tradisional', labelEn: 'Traditional Weaving' },
    { key: 'batik', labelId: 'Batik Sasambo', labelEn: 'Sasambo Batik' },
    { key: 'kerajinan_tangan', labelId: 'Kerajinan Tangan', labelEn: 'Handicrafts' },
  ];

  const filteredCrafts = useMemo(() => {
    return crafts.filter((craft) => {
      if (selectedType !== 'all' && craft.craftType !== selectedType) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();

      const trans =
        craft.translations?.find((tr) => tr.locale === locale) ||
        craft.translations?.[0];

      const titleMatch = trans?.title?.toLowerCase().includes(q) || false;
      const sumMatch = trans?.summary?.toLowerCase().includes(q) || false;
      const slugMatch = craft.slug.toLowerCase().includes(q);

      return titleMatch || sumMatch || slugMatch;
    });
  }, [crafts, selectedType, searchQuery, locale]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      
      {/* Header */}
      <div className="max-w-3xl space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-sand-200 text-xs font-semibold text-secondary uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{t('Koleksi Tekstil & Kriya Sasak', 'Sasak Textiles & Craft Collection')}</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-text">
          {t('Katalog Kerajinan & Tenun Tradisional', 'Crafts & Traditional Weaving Catalog')}
        </h1>
        <p className="text-muted text-base leading-relaxed">
          {t(
            'Eksplorasi karya tekstil autentik Pringgasela Selatan: Tenun gedogan benang serat kapas alami hingga Batik Sasambo khas Lombok Timur.',
            'Explore authentic textile heritage from South Pringgasela: handloom backstrap weaving with organic plant dyes to distinctive Sasambo batik.'
          )}
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-surface p-4 sm:p-6 rounded-2xl border border-border shadow-xs flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('Cari nama tenun, teknik, bahan...', 'Search craft title, technique...')}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-sand-50 focus:bg-surface focus:border-primary focus:outline-hidden text-sm"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          {craftTypes.map((type) => (
            <button
              key={type.key}
              onClick={() => setSelectedType(type.key)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedType === type.key
                  ? 'bg-secondary text-surface shadow-xs'
                  : 'bg-sand-100 text-text hover:bg-sand-200'
              }`}
            >
              {t(type.labelId, type.labelEn)}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <LoadingSpinner message={t('Memuat katalog kriya...', 'Loading craft catalog...')} size="lg" />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchCrafts} />
      ) : filteredCrafts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCrafts.map((craft) => (
            <CraftCard key={craft.$id} craft={craft} />
          ))}
        </div>
      ) : (
        <EmptyState
          title={t('Karya Tidak Ditemukan', 'No Crafts Found')}
          message={t('Tidak ada kerajinan yang sesuai dengan filter saat ini.', 'No crafts matched your filter.')}
          actionText={t('Tampilkan Semua', 'Show All')}
          onAction={() => {
            setSearchQuery('');
            setSelectedType('all');
          }}
        />
      )}

    </div>
  );
};
