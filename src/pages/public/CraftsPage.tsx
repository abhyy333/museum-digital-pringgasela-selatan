import React, { useEffect, useState, useMemo } from 'react';
import { Search, Sparkles } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { publicApi } from '../../appwrite/publicApi';
import { Craft } from '../../types/schema';
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
    { key: 'tenun', labelId: 'Tenun Gedogan Tradisional', labelEn: 'Traditional Weaving' },
    { key: 'batik', labelId: 'Batik Sasambo', labelEn: 'Sasambo Batik' },
    { key: 'kerajinan_tangan', labelId: 'Kriya Tangan Adat', labelEn: 'Customary Crafts' },
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      
      {/* Header */}
      <div className="max-w-3xl space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#132334] border border-[#1E3246] text-xs font-semibold text-terracotta uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{t('Arsip Kriya Tekstil Adat', 'Customary Textile Crafts Archive')}</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-[#F8F5EF]">
          {t('Kriya Tekstil Tradisional & Batik Sasambo', 'Traditional Textile Crafts & Sasambo Batik')}
        </h1>
        <p className="text-[#E8DCC9]/80 text-sm sm:text-base leading-relaxed">
          {t(
            'Katalog komprehensif tenun gedogan Pringgasela dan karya batik Sasambo khas Nusa Tenggara Barat. Telusuri bahan baku serat alami, teknik pewarnaan nabati, dan proses pembuatan tangan.',
            'Comprehensive catalog of Pringgasela backstrap loom textiles and West Nusa Tenggara Sasambo batik. Explore raw botanical fibers, natural dyeing, and manual handcrafting.'
          )}
        </p>
      </div>

      {/* Toolbar */}
      <div className="bg-[#0E1A27] p-4 sm:p-5 rounded-lg border border-[#1E3246] flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-[#8D9CAE] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('Cari jenis kerajinan, bahan, teknik...', 'Search craft type, material, technique...')}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#1E3246] bg-[#0B1623] focus:border-terracotta focus:outline-hidden text-sm text-[#F8F5EF] placeholder-[#8D9CAE] transition-all"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          {craftTypes.map((type) => (
            <button
              key={type.key}
              onClick={() => setSelectedType(type.key)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedType === type.key
                  ? 'bg-terracotta text-[#F8F5EF] shadow-xs'
                  : 'bg-[#132334] text-[#E8DCC9]/80 border border-[#1E3246] hover:bg-[#1E3246]'
              }`}
            >
              {t(type.labelId, type.labelEn)}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="py-20">
          <LoadingSpinner message={t('Mengakses katalog kerajinan...', 'Loading crafts catalog...')} />
        </div>
      ) : error ? (
        <ErrorState
          title={t('Gagal Memuat Kriya', 'Failed to Load Crafts')}
          message={error}
          onRetry={fetchCrafts}
        />
      ) : filteredCrafts.length === 0 ? (
        <EmptyState
          title={t('Kriya Tidak Ditemukan', 'No Crafts Found')}
          message={t(
            'Tidak ada kerajinan yang sesuai dengan pencarian Anda.',
            'No textile crafts match your search criteria.'
          )}
          actionLabel={t('Reset Pencarian', 'Reset Search')}
          onAction={() => {
            setSearchQuery('');
            setSelectedType('all');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCrafts.map((craft) => (
            <CraftCard key={craft.$id} craft={craft} />
          ))}
        </div>
      )}

    </div>
  );
};
