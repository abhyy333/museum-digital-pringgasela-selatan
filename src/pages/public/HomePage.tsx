import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Sparkles, Compass, History, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { publicApi } from '../../appwrite/publicApi';
import { WeavingMotif, Craft, Culture } from '../../types/schema';
import { MotifCard } from '../../components/public/MotifCard';
import { CraftCard } from '../../components/public/CraftCard';
import { CultureCard } from '../../components/public/CultureCard';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const HomePage: React.FC = () => {
  const { t } = useLanguage();
  const [motifs, setMotifs] = useState<WeavingMotif[]>([]);
  const [crafts, setCrafts] = useState<Craft[]>([]);
  const [cultures, setCultures] = useState<Culture[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [motifRes, craftRes, cultRes] = await Promise.allSettled([
          publicApi.getMotifs({ limit: 3 }),
          publicApi.getCrafts({ limit: 3 }),
          publicApi.getCultures({ limit: 3 }),
        ]);

        if (motifRes.status === 'fulfilled') setMotifs(motifRes.value.items || []);
        if (craftRes.status === 'fulfilled') setCrafts(craftRes.value.items || []);
        if (cultRes.status === 'fulfilled') setCultures(cultRes.value.items || []);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="space-y-24 pb-20">
      
      {/* 1. HERO SECTION */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 overflow-hidden border-b border-border/80 bg-linear-to-b from-sand-100 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sand-200 border border-border text-xs font-semibold text-secondary uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              <span>{t('Pusat Dokumentasi Budaya Sasak', 'Sasak Cultural Documentation Center')}</span>
            </div>

            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-text leading-[1.15]">
              {t(
                'Menyulam Makna, Merawat Peradaban Leluhur',
                'Weaving Wisdom, Safeguarding Living Ancestral Heritage'
              )}
            </h1>

            <p className="text-lg sm:text-xl text-muted font-normal leading-relaxed">
              {t(
                'Selamat datang di repositori digital resmi Desa Pringgasela Selatan. Jelajahi ensiklopedia motif tenun tradisional, ragam hias Batik Sasambo, lantunan sakral Dzikir Saman, dan narasi perintis desa di kaki Gunung Rinjani.',
                'Welcome to the official cultural repository of South Pringgasela. Explore the encyclopedia of backstrap loom weaving motifs, Sasambo batik textiles, sacred Dzikir Saman rituals, and founding village histories.'
              )}
            </p>

            <div className="pt-4 flex flex-wrap items-center gap-4">
              <Link
                to="/motifs"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-primary hover:bg-primary-hover text-surface font-semibold text-sm transition-all shadow-md hover:shadow-lg"
              >
                <BookOpen className="w-4 h-4" />
                <span>{t('Jelajahi Ensiklopedia Motif', 'Explore Motif Encyclopedia')}</span>
              </Link>
              <Link
                to="/crafts"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl border border-border bg-surface hover:bg-sand-100 text-text font-semibold text-sm transition-colors"
              >
                <span>{t('Katalog Kerajinan', 'Textile Crafts')}</span>
                <ArrowRight className="w-4 h-4 text-muted" />
              </Link>
            </div>
          </div>
        </div>

        {/* Subtle decorative background rhombus motif */}
        <div className="absolute right-0 bottom-0 translate-x-1/4 translate-y-1/4 pointer-events-none opacity-5">
          <svg width="600" height="600" viewBox="0 0 100 100">
            <polygon points="50,5 95,50 50,95 5,50" fill="currentColor" />
          </svg>
        </div>
      </section>

      {/* 2. STATS & ARCHIVAL HIGHLIGHTS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-8 rounded-2xl bg-surface border border-border shadow-xs">
          <div className="space-y-1 text-center md:text-left">
            <p className="font-serif text-3xl sm:text-4xl font-bold text-primary">30+</p>
            <p className="text-xs uppercase tracking-wider text-muted font-semibold">
              {t('Motif Tenun Kuno', 'Ancient Weaving Motifs')}
            </p>
          </div>
          <div className="space-y-1 text-center md:text-left">
            <p className="font-serif text-3xl sm:text-4xl font-bold text-secondary">1820</p>
            <p className="text-xs uppercase tracking-wider text-muted font-semibold">
              {t('Akar Sejarah Peradaban', 'Century Historical Roots')}
            </p>
          </div>
          <div className="space-y-1 text-center md:text-left">
            <p className="font-serif text-3xl sm:text-4xl font-bold text-accent">100%</p>
            <p className="text-xs uppercase tracking-wider text-muted font-semibold">
              {t('Pewarna Alami & Tradisional', 'Natural Fibers & Dyes')}
            </p>
          </div>
          <div className="space-y-1 text-center md:text-left">
            <p className="font-serif text-3xl sm:text-4xl font-bold text-text">Bilingual</p>
            <p className="text-xs uppercase tracking-wider text-muted font-semibold">
              {t('Akses IDN / ENG', 'English & Indonesian')}
            </p>
          </div>
        </div>
      </section>

      {/* 3. ENSIKLOPEDIA MOTIF TENUN SPOTLIGHT */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border/80 pb-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
              <Compass className="w-4 h-4" />
              <span>{t('Arsip Visual & Filosofi', 'Visual Archive & Morphology')}</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-text">
              {t('Ensiklopedia Motif Tenun', 'Weaving Motif Encyclopedia')}
            </h2>
            <p className="text-muted text-sm max-w-2xl">
              {t(
                'Setiap guratan benang pakan dan lungsi pada tenun Pringgasela memuat doa luhur, ketakwaan, serta hubungan kosmis manusia Sasak dengan alam.',
                'Every thread of Pringgasela textile carries profound prayers, divine gratitude, and the harmonious connection between Sasak community and nature.'
              )}
            </p>
          </div>
          <Link
            to="/motifs"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-hover shrink-0"
          >
            <span>{t('Lihat Semua Motif', 'View All Motifs')}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : motifs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {motifs.map((motif) => (
              <MotifCard key={motif.$id} motif={motif} />
            ))}
          </div>
        ) : (
          <div className="p-12 text-center bg-surface border border-border rounded-xl">
            <p className="text-muted text-sm">{t('Belum ada motif publik yang ditampilkan.', 'No published motifs to display.')}</p>
          </div>
        )}
      </section>

      {/* 4. TRADISI BUDAYA & DZIKIR SAMAN */}
      <section className="bg-sand-100 border-y border-border py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border/80 pb-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent">
                <ShieldCheck className="w-4 h-4" />
                <span>{t('Warisan Takbenda Desa', 'Intangible Living Traditions')}</span>
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-text">
                {t('Tradisi Adat & Dzikir Saman', 'Cultural Rites & Dzikir Saman')}
              </h2>
              <p className="text-muted text-sm max-w-2xl">
                {t(
                  'Dokumentasi komprehensif seni vokal zikir sakral Dzikir Saman, ritual upacara daur hidup, dan tatanan adat luhur masyarakat Sasak Pringgasela Selatan.',
                  'Comprehensive documentation of sacred communal chants, life-cycle rituals, and customary values of South Pringgasela.'
                )}
              </p>
            </div>
            <Link
              to="/cultures"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:text-accent-hover shrink-0"
            >
              <span>{t('Lihat Seluruh Tradisi', 'View All Traditions')}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <LoadingSpinner />
          ) : cultures.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {cultures.map((culture) => (
                <CultureCard key={culture.$id} culture={culture} />
              ))}
            </div>
          ) : (
            <div className="p-12 text-center bg-surface border border-border rounded-xl">
              <p className="text-muted text-sm">{t('Belum ada tradisi budaya yang diterbitkan.', 'No published cultural entries.')}</p>
            </div>
          )}
        </div>
      </section>

      {/* 5. SEJARAH DESA BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-sand-900 text-sand-100 rounded-3xl p-8 sm:p-14 relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-xl z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-accent/20 text-accent text-xs font-semibold uppercase tracking-wider">
              <History className="w-3.5 h-3.5" />
              <span>{t('Linimasa Perintis Desa', 'Historical Timeline')}</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-surface">
              {t(
                'Jejak Peradaban Sejarah Desa Pringgasela Selatan',
                'Historical Chronology of South Pringgasela Village'
              )}
            </h2>
            <p className="text-sand-300 text-sm leading-relaxed">
              {t(
                'Pelajari narasi berdirinya desa, era kepemimpinan tetua adat, hingga transformasi sentra tenun tradisional menjadi warisan kebudayaan nasional yang diakui.',
                'Discover the foundational accounts, customary leadership eras, and the preservation of home-based backstrap weaving down through the centuries.'
              )}
            </p>
            <div className="pt-2">
              <Link
                to="/history"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent hover:bg-accent-hover text-surface text-sm font-semibold transition-colors"
              >
                <span>{t('Baca Linimasa Sejarah', 'Explore Village History')}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="shrink-0 w-full lg:w-72 aspect-4/3 bg-sand-800 rounded-2xl border border-sand-700 p-6 flex flex-col justify-center text-center space-y-2 z-10">
            <span className="font-serif text-4xl font-bold text-accent">1820 – Kini</span>
            <span className="text-xs uppercase tracking-wider text-sand-400">
              {t('Dua Abad Preservasi Budaya', 'Two Centuries of Living Heritage')}
            </span>
          </div>
        </div>
      </section>

    </div>
  );
};
