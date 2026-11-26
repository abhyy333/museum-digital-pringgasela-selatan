import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, Compass } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { publicApi } from '../../appwrite/publicApi';
import { WeavingMotif, Category } from '../../types/schema';
import { MotifCard } from '../../components/public/MotifCard';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorState } from '../../components/common/ErrorState';
import { EmptyState } from '../../components/common/EmptyState';

export const MotifsPage: React.FC = () => {
  const { locale, t } = useLanguage();
  const [searchParams] = useSearchParams();
  const [motifs, setMotifs] = useState<WeavingMotif[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(() => searchParams.get('category') || 'all');
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('q') || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMotifs = async () => {
    try {
      setLoading(true);
      setError(null);
      const [motifRes, catRes] = await Promise.all([
        publicApi.getMotifs({ limit: 50 }),
        publicApi.getCategories('craft'),
      ]);
      setMotifs(motifRes.items || []);
      setCategories(catRes.categories || []);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat ensiklopedia motif.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSelectedCategory(searchParams.get('category') || 'all');
    setSearchQuery(searchParams.get('q') || '');
  }, [searchParams]);

  useEffect(() => {
    fetchMotifs();
  }, []);

  // Filtered motifs by search and category
  const filteredMotifs = useMemo(() => {
    return motifs.filter((motif) => {
      // Category filter
      if (selectedCategory !== 'all' && motif.categoryId !== selectedCategory) {
        return false;
      }

      // Search query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();

      const trans =
        motif.translations?.find((tr) => tr.locale === locale) ||
        motif.translations?.[0];

      const nameMatch = trans?.name?.toLowerCase().includes(q) || false;
      const codeMatch = motif.codeName?.toLowerCase().includes(q) || false;
      const philMatch = trans?.philosophy?.toLowerCase().includes(q) || false;
      const techMatch = trans?.technique?.toLowerCase().includes(q) || false;
      const visMatch = trans?.visualDescription?.toLowerCase().includes(q) || false;
      const slugMatch = motif.slug.toLowerCase().includes(q);

      return nameMatch || codeMatch || philMatch || techMatch || visMatch || slugMatch;
    });
  }, [motifs, selectedCategory, searchQuery, locale]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      
      {/* Header */}
      <div className="max-w-3xl space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-sand-200 text-xs font-semibold text-primary uppercase tracking-wider">
          <Compass className="w-3.5 h-3.5" />
          <span>{t('Ensiklopedia Tekstil Sasak', 'Sasak Textile Encyclopedia')}</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-text">
          {t('Ensiklopedia Motif Tenun Pringgasela', 'Pringgasela Weaving Motif Encyclopedia')}
        </h1>
        <p className="text-muted text-base leading-relaxed">
          {t(
            'Dokumentasi ilmiah dan kultural motif tenun pusaka Sasak Pringgasela Selatan. Telusuri makna filosofis di balik pola belah ketupat, garis simetris, dan teknik tenun gedogan yang diwariskan turun-temurun.',
            'Scholarly and cultural documentation of heirloom Sasak weaving motifs in South Pringgasela. Discover the sacred symbolism behind rhombus patterns, loom techniques, and oral folklore.'
          )}
        </p>
      </div>

      {/* Search and Filters Toolbar */}
      <div className="bg-surface p-4 sm:p-6 rounded-2xl border border-border shadow-xs flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Search Input */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('Cari nama motif, kode, filosofi...', 'Search motif name, code, meaning...')}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-sand-50 focus:bg-surface focus:border-primary focus:outline-hidden text-sm transition-all"
          />
        </div>

        {/* Category Filter Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          <Filter className="w-4 h-4 text-muted shrink-0 mr-1 hidden sm:block" />
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedCategory === 'all'
                ? 'bg-primary text-surface shadow-xs'
                : 'bg-sand-100 text-text hover:bg-sand-200'
            }`}
          >
            {t('Semua Kategori', 'All Categories')}
          </button>
          {categories.map((cat) => (
            <button
              key={cat.$id}
              onClick={() => setSelectedCategory(cat.$id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat.$id
                  ? 'bg-primary text-surface shadow-xs'
                  : 'bg-sand-100 text-text hover:bg-sand-200'
              }`}
            >
              {locale === 'en' ? cat.nameEn : cat.nameId}
            </button>
          ))}
        </div>
      </div>

      {/* Content Rendering */}
      {loading ? (
        <LoadingSpinner message={t('Menyusun katalog motif...', 'Compiling motif catalog...')} size="lg" />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchMotifs} />
      ) : filteredMotifs.length > 0 ? (
        <div className="space-y-6">
          <p className="text-xs uppercase tracking-wider text-muted font-medium">
            {t(`Menampilkan ${filteredMotifs.length} motif tenun`, `Displaying ${filteredMotifs.length} weaving motifs`)}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredMotifs.map((motif) => (
              <MotifCard key={motif.$id} motif={motif} />
            ))}
          </div>
        </div>
      ) : (
        <EmptyState
          title={t('Motif Tidak Ditemukan', 'No Motifs Found')}
          message={t(
            'Tidak ada motif yang cocok dengan kriteria pencarian Anda. Coba kata kunci lain atau pilih semua kategori.',
            'No weaving motifs match your search criteria. Try a different query or select all categories.'
          )}
          actionText={t('Reset Pencarian', 'Reset Filters')}
          onAction={() => {
            setSearchQuery('');
            setSelectedCategory('all');
          }}
        />
      )}

    </div>
  );
};
