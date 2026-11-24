import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Layers, Sparkles, Compass } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { publicApi } from '../../appwrite/publicApi';
import { WeavingMotif, Craft, Culture, VillageHistory } from '../../types/schema';
import { MotifCard } from '../../components/public/MotifCard';
import { CraftCard } from '../../components/public/CraftCard';
import { CultureCard } from '../../components/public/CultureCard';
import {
  SweepingYarnCurves,
  SasakStarCluster,
  TerracottaBrushUnderline
} from '../../components/common/DecorativeIcons';

export const HomePage: React.FC = () => {
  const { locale, t } = useLanguage();
  const [motifs, setMotifs] = useState<WeavingMotif[]>([]);
  const [crafts, setCrafts] = useState<Craft[]>([]);
  const [cultures, setCultures] = useState<Culture[]>([]);
  const [_historyEras, setHistoryEras] = useState<VillageHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [motifRes, craftRes, cultRes, histRes] = await Promise.allSettled([
          publicApi.getMotifs({ limit: 4 }),
          publicApi.getCrafts({ limit: 3 }),
          publicApi.getCultures({ limit: 2 }),
          publicApi.getHistory(),
        ]);

        if (motifRes.status === 'fulfilled') setMotifs(motifRes.value.items || []);
        if (craftRes.status === 'fulfilled') setCrafts(craftRes.value.items || []);
        if (cultRes.status === 'fulfilled') setCultures(cultRes.value.items || []);
        if (histRes.status === 'fulfilled') setHistoryEras(histRes.value.eras || []);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="bg-[#0B1623] text-[#F2E9DC] min-h-screen">
      
      {/* =========================================================================
          1. HERO SECTION — EDITORIAL SIGNATURE COMPOSITION
          ========================================================================= */}
      <section className="relative bg-indigo-textile pt-10 sm:pt-14 pb-16 md:pb-24 border-b border-[#1E3246]/60 overflow-hidden">
        
        {/* Layer 2: Decorative Sweeping Yarn Curves & Sasak Diamond Stars */}
        <SweepingYarnCurves className="absolute inset-0 w-full h-full pointer-events-none opacity-80" />
        <SasakStarCluster className="absolute right-[32%] top-8 hidden xl:block" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-4 items-center">
            
            {/* Left Column (Headline & Content: 6 Cols) */}
            <div className="lg:col-span-6 space-y-6 lg:pr-4">
              
              {/* Eyebrow Label */}
              <div className="flex items-center gap-3">
                <span className="text-[11px] sm:text-xs uppercase tracking-[0.22em] text-[#E8DCC9]/70 font-semibold">
                  {t('ARSIP BUDAYA PRINGGASELA SELATAN —', 'PRINGGASELA SELATAN CULTURAL ARCHIVES —')}
                </span>
              </div>

              {/* Master Headline in Playfair Display Editorial Serif */}
              <h1 className="font-serif text-4xl sm:text-5xl xl:text-6xl font-bold tracking-tight text-[#F8F5EF] leading-[1.08]">
                Tenun,<br />
                Manusia,<br />
                dan Cerita Desa.
              </h1>

              {/* Terracotta Brush Stroke Accent */}
              <div className="-mt-2">
                <TerracottaBrushUnderline className="h-2 w-48 text-terracotta" />
              </div>

              {/* Supporting Cultural Narrative */}
              <p className="text-sm sm:text-base text-[#E8DCC9]/85 font-normal leading-relaxed max-w-lg">
                {t(
                  'Museum digital untuk menyimpan, mendokumentasikan, dan merawat warisan tenun serta kehidupan budaya masyarakat Pringgasela Selatan.',
                  'A digital museum to preserve, document, and steward the weaving heritage and cultural life of the South Pringgasela community.'
                )}
              </p>

              {/* Primary Call to Action Button */}
              <div className="pt-2">
                <Link
                  to="/motifs"
                  className="inline-flex items-center gap-3 px-6 py-3.5 rounded-lg bg-terracotta hover:bg-terracotta-hover text-[#F8F5EF] font-medium text-sm transition-all shadow-md hover:shadow-lg group"
                >
                  <span>{t('Jelajahi Koleksi', 'Explore Collection')}</span>
                  <ArrowRight className="w-4 h-4 text-[#F8F5EF] group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

            </div>

            {/* Right Column: Layer 3 & 4 Out-of-Frame Weaver & Loom Visual (6 Cols) */}
            <div className="lg:col-span-6 relative mt-6 lg:mt-0 flex justify-center lg:justify-end">
              <div className="relative w-full max-w-2xl lg:max-w-none -mr-4 sm:-mr-6 lg:-mr-12">
                
                {/* Out-of-frame Layered Weaver Image with Horizontal Loom Beam */}
                <div className="relative z-20 group">
                  <img
                    src="/assets/hero-weaver-clean.webp"
                    alt="Penenun Tradisional Gedogan Desa Pringgasela Selatan"
                    className="w-full h-auto object-cover rounded-tl-xl drop-shadow-2xl transition-transform duration-500 hover:scale-[1.01]"
                  />
                  {/* Subtle blend gradient on left edge */}
                  <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[#0B1623] to-transparent pointer-events-none hidden sm:block" />
                </div>

              </div>
            </div>

          </div>
        </div>

      </section>

      {/* =========================================================================
          2. FEATURED COLLECTION & CURATORIAL NOTE SECTION
          ========================================================================= */}
      <section className="relative bg-[#0B1623] border-b border-[#1E3246]/60 pt-10 pb-16 overflow-hidden">
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            
            {/* Left Area: KOLEKSI PILIHAN (3 Cards: 7 Cols) */}
            <div className="lg:col-span-7 space-y-5">
              
              {/* Section Header */}
              <div className="flex items-center gap-3">
                <span className="text-xs uppercase tracking-[0.2em] text-terracotta font-bold">
                  {t('— KOLEKSI PILIHAN', '— FEATURED COLLECTION')}
                </span>
              </div>

              {/* 3 Horizontal Editorial Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                {/* Card 1: Ragam Motif */}
                <Link
                  to="/motifs"
                  className="group block bg-[#0E1A27] rounded-lg border border-[#1E3246] overflow-hidden hover:border-terracotta/60 transition-all duration-300"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-[#17283A]">
                    <img
                      src="/assets/card-motif-clean.webp"
                      alt="Ragam Motif Tenun Tradisional Pringgasela"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0E1A27] via-transparent to-transparent opacity-80" />
                  </div>
                  <div className="p-3.5 flex items-center justify-between">
                    <span className="font-serif text-sm font-semibold text-[#F8F5EF] group-hover:text-terracotta transition-colors">
                      {t('Ragam Motif', 'Motif Varieties')}
                    </span>
                    <ArrowRight className="w-4 h-4 text-[#E8DCC9]/60 group-hover:text-terracotta group-hover:translate-x-1 transition-all" />
                  </div>
                </Link>

                {/* Card 2: Alat Tenun */}
                <Link
                  to="/crafts"
                  className="group block bg-[#0E1A27] rounded-lg border border-[#1E3246] overflow-hidden hover:border-terracotta/60 transition-all duration-300"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-[#17283A]">
                    <img
                      src="/assets/card-loom-clean.webp"
                      alt="Alat Tenun Tradisional Gedogan"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0E1A27] via-transparent to-transparent opacity-80" />
                  </div>
                  <div className="p-3.5 flex items-center justify-between">
                    <span className="font-serif text-sm font-semibold text-[#F8F5EF] group-hover:text-terracotta transition-colors">
                      {t('Alat Tenun', 'Weaving Looms')}
                    </span>
                    <ArrowRight className="w-4 h-4 text-[#E8DCC9]/60 group-hover:text-terracotta group-hover:translate-x-1 transition-all" />
                  </div>
                </Link>

                {/* Card 3: Bahan & Pewarna */}
                <Link
                  to="/crafts"
                  className="group block bg-[#0E1A27] rounded-lg border border-[#1E3246] overflow-hidden hover:border-terracotta/60 transition-all duration-300"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-[#17283A]">
                    <img
                      src="/assets/card-material-clean.webp"
                      alt="Bahan Baku Kapas dan Pewarna Alami"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0E1A27] via-transparent to-transparent opacity-80" />
                  </div>
                  <div className="p-3.5 flex items-center justify-between">
                    <span className="font-serif text-sm font-semibold text-[#F8F5EF] group-hover:text-terracotta transition-colors">
                      {t('Bahan & Pewarna', 'Materials & Dyes')}
                    </span>
                    <ArrowRight className="w-4 h-4 text-[#E8DCC9]/60 group-hover:text-terracotta group-hover:translate-x-1 transition-all" />
                  </div>
                </Link>

              </div>

            </div>

            {/* Right Area: CATATAN KURATORIAL & Fringed Textile (5 Cols) */}
            <div className="lg:col-span-5 relative flex items-center lg:border-l lg:border-[#1E3246]/70 lg:pl-8">
              
              <div className="space-y-4 max-w-md pr-12 lg:pr-20 z-10">
                <span className="block text-xs uppercase tracking-[0.2em] text-terracotta font-bold">
                  {t('CATATAN KURATORIAL', 'CURATORIAL NOTE')}
                </span>

                <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#F8F5EF] leading-snug">
                  {t('Menelusuri Jejak Tenun Pringgasela', 'Tracing the Threads of Pringgasela Weaving')}
                </h3>

                <p className="text-xs sm:text-sm text-[#E8DCC9]/80 leading-relaxed font-sans">
                  {t(
                    'Sebuah upaya kuratorial untuk memahami tenun sebagai praktik budaya yang hidup—menghubungkan keterampilan, lingkungan, dan ingatan kolektif masyarakat.',
                    'A curatorial endeavor to understand weaving as a living cultural practice—connecting craftsmanship, ecology, and the collective memory of the community.'
                  )}
                </p>

                <div className="pt-1">
                  <Link
                    to="/about"
                    className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider text-terracotta hover:text-terracotta-burnt transition-colors group cursor-pointer"
                  >
                    <span>{t('Baca Selengkapnya', 'Read Full Note')}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-terracotta group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>

              {/* Fringed Raw Textile Cloth Coming from Right Border */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-28 sm:w-36 lg:w-44 pointer-events-none select-none opacity-90 hidden sm:block">
                <img
                  src="/assets/curatorial-fringe-clean.webp"
                  alt="Kain Tenun Tradisional Pringgasela dengan Rumbai"
                  className="w-full h-auto object-contain drop-shadow-xl"
                />
              </div>

            </div>

          </div>
        </div>

      </section>

      {/* =========================================================================
          3. FEATURED MOTIF ENCYCLOPEDIA (FROM APPWRITE CLOUD BACKEND)
          ========================================================================= */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#1E3246]/60 pb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-terracotta font-semibold">
              <Sparkles className="w-4 h-4 text-terracotta" />
              <span>{t('Ensiklopedia Ragam Hias', 'Motif Encyclopedia')}</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#F8F5EF]">
              {t('Motif Tenun Pilihan & Makna Filosofis', 'Selected Weaving Motifs & Philosophical Meanings')}
            </h2>
          </div>
          <Link
            to="/motifs"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-wider font-semibold text-terracotta hover:text-terracotta-burnt transition-colors"
          >
            <span>{t('Lihat Seluruh Motif (30+)', 'View All Motifs (30+)')}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {motifs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {motifs.map((motif) => (
              <MotifCard key={motif.$id} motif={motif} />
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-xl bg-[#0E1A27] border border-[#1E3246] text-center space-y-3">
            <Layers className="w-8 h-8 text-terracotta mx-auto opacity-70" />
            <p className="text-sm text-[#E8DCC9]/80 font-serif">
              {t('Memuat katalog motif tenun dari repositori budaya...', 'Loading motif catalog from cultural repository...')}
            </p>
          </div>
        )}
      </section>

      {/* =========================================================================
          4. TRADITIONAL CRAFTS & LIVING CULTURE (TENUN, SASAMBO, DZIKIR SAMAN)
          ========================================================================= */}
      <section className="bg-indigo-textile py-20 border-y border-[#1E3246]/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          
          {/* Crafts Section */}
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <span className="text-xs uppercase tracking-[0.2em] text-terracotta font-semibold block mb-2">
                  {t('Kriya Tekstil Tradisional', 'Traditional Textile Crafts')}
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#F8F5EF]">
                  {t('Tenun Gedogan & Batik Sasambo', 'Gedogan Loom Weaving & Sasambo Batik')}
                </h3>
              </div>
              <Link
                to="/crafts"
                className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider font-semibold text-terracotta hover:text-terracotta-burnt transition-colors"
              >
                <span>{t('Jelajahi Kerajinan', 'Explore Crafts')}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {crafts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {crafts.map((craft) => (
                  <CraftCard key={craft.$id} craft={craft} />
                ))}
              </div>
            ) : null}
          </div>

          {/* Living Culture: Dzikir Saman */}
          <div className="space-y-8 pt-8 border-t border-[#1E3246]/60">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <span className="text-xs uppercase tracking-[0.2em] text-terracotta font-semibold block mb-2">
                  {t('Tradisi & Seni Pertunjukan Sakral', 'Sacred Traditions & Oral Arts')}
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#F8F5EF]">
                  {t('Dzikir Saman Pringgasela & Upacara Adat', 'Pringgasela Dzikir Saman & Rites')}
                </h3>
              </div>
              <Link
                to="/cultures"
                className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider font-semibold text-terracotta hover:text-terracotta-burnt transition-colors"
              >
                <span>{t('Lihat Tradisi Lengkap', 'View All Traditions')}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {cultures.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {cultures.map((culture) => (
                  <CultureCard key={culture.$id} culture={culture} />
                ))}
              </div>
            ) : null}
          </div>

        </div>
      </section>

      {/* =========================================================================
          5. HISTORICAL TIMELINE TEASER & VILLAGE HERITAGE
          ========================================================================= */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs uppercase tracking-[0.2em] text-terracotta font-semibold block">
            {t('Babak Sejarah Peradaban', 'Historical Eras')}
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#F8F5EF]">
            {t('Linimasa Sejarah Desa Pringgasela Selatan', 'South Pringgasela Historical Timeline')}
          </h2>
          <p className="text-xs sm:text-sm text-[#E8DCC9]/75 font-sans leading-relaxed">
            {t(
              'Menelusuri jejak perintisan sentra tenun sejak masa Kesultanan Selaparang hingga era kemandirian desa di lereng Gunung Rinjani.',
              'Tracing the weaving settlement origins from the Selaparang Sultanate era to the modern autonomous village on Mount Rinjani’s slopes.'
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          <div className="p-6 rounded-lg bg-[#0E1A27] border border-[#1E3246] space-y-3">
            <span className="font-mono text-xs font-semibold text-terracotta">1820 – 1900</span>
            <h4 className="font-serif text-lg font-bold text-[#F8F5EF]">
              {t('Era Perintisan & Sentra Tenun Sasak', 'Pioneering Era & Sasak Weaving Center')}
            </h4>
            <p className="text-xs text-[#E8DCC9]/75 leading-relaxed font-sans">
              {t(
                'Lahirnya tradisi tenun gedogan rumahan yang berkembang pesat menjadi pusat kerajinan tekstil utama di Lombok bagian timur.',
                'The rise of home backstrap loom traditions developing into the premier textile craft center of eastern Lombok.'
              )}
            </p>
          </div>

          <div className="p-6 rounded-lg bg-[#0E1A27] border border-[#1E3246] space-y-3">
            <span className="font-mono text-xs font-semibold text-terracotta">1900 – 1980</span>
            <h4 className="font-serif text-lg font-bold text-[#F8F5EF]">
              {t('Era Ketahanan Budaya & Pewarna Alami', 'Cultural Resilience & Natural Dyes')}
            </h4>
            <p className="text-xs text-[#E8DCC9]/75 leading-relaxed font-sans">
              {t(
                'Pelestarian resep ramuan pewarna nabati tarum (indigo) dan kulit kayu mahoni di tengah masuknya benang pabrikan.',
                'Preservation of ancestral botanical dye formulas amidst the influx of modern industrial threads.'
              )}
            </p>
          </div>

          <div className="p-6 rounded-lg bg-[#0E1A27] border border-[#1E3246] space-y-3">
            <span className="font-mono text-xs font-semibold text-terracotta">1980 – Sekarang</span>
            <h4 className="font-serif text-lg font-bold text-[#F8F5EF]">
              {t('Era Preservasi Digital & Pengakuan Global', 'Digital Preservation & Global Acclaim')}
            </h4>
            <p className="text-xs text-[#E8DCC9]/75 leading-relaxed font-sans">
              {t(
                'Pencatatan arsip digital dan pemajuan kebudayaan desa untuk melindungi hak intelektual maestro penenun tradisional.',
                'Digital archiving and community heritage governance protecting master weavers’ intellectual legacy.'
              )}
            </p>
          </div>
        </div>

        <div className="text-center pt-4">
          <Link
            to="/history"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-[#1E3246] bg-[#0E1A27] hover:bg-[#132334] text-[#F8F5EF] text-xs font-semibold uppercase tracking-wider transition-all"
          >
            <span>{t('Buka Linimasa Lengkap', 'Open Full Timeline')}</span>
            <ArrowRight className="w-4 h-4 text-terracotta" />
          </Link>
        </div>
      </section>

    </div>
  );
};
