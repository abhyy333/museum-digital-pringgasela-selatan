import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Layers } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { publicApi } from '../../appwrite/publicApi';
import { Category } from '../../types/schema';
import { ArchiveHeroSection } from '../../components/hero/ArchiveHeroSection';
import { MuseumLogo } from '../../components/common/MuseumLogo';

interface FeaturedCollectionItem {
  key: string;
  titleId: string;
  titleEn: string;
  imageSrc: string;
  altId: string;
  altEn: string;
  to: string;
  matchSlugs?: string[];
}

const DEFAULT_FEATURED_CATEGORIES: FeaturedCollectionItem[] = [
  {
    key: 'motif-tenun',
    titleId: 'Motif Tenun',
    titleEn: 'Weaving Motifs',
    imageSrc: '/images/collections/motif-tenun.webp',
    altId: 'Detail tekstur kain tenun Pringgasela motif geometris indigo dan garis terakota',
    altEn: 'Macro detail of handwoven Pringgasela indigo diamond motif textile',
    to: '/motifs',
    matchSlugs: ['tenun-tradisional', 'motif-tenun'],
  },
  {
    key: 'alat-tenun',
    titleId: 'Alat Tenun Tradisional',
    titleEn: 'Traditional Looms',
    imageSrc: '/images/collections/alat-tenun.webp',
    altId: 'Teropong kayu alat tenun tradisional di atas kain tenun indigo dan terakota',
    altEn: 'Carved wooden boat shuttle resting over handwoven indigo and terracotta textile',
    to: '/crafts?craftType=tenun',
    matchSlugs: ['alat-tenun', 'kerajinan-tenun'],
  },
  {
    key: 'pewarna-alami',
    titleId: 'Pewarna Alami',
    titleEn: 'Natural Dyes',
    imageSrc: '/images/collections/pewarna-alami.webp',
    altId: 'Gantungan benang kapas pewarna alami tarum indigo, merah tanah, dan kuning kunyit',
    altEn: 'Hanging skeins of natural indigo, terracotta earth, and turmeric-dyed yarns',
    to: '/motifs?q=pewarna',
    matchSlugs: ['pewarna-alami'],
  },
  {
    key: 'arsitektur-desa',
    titleId: 'Arsitektur & Ruang Budaya',
    titleEn: 'Architecture & Cultural Space',
    imageSrc: '/images/collections/arsitektur-desa.webp',
    altId: 'Bale adat dan ruang menenun tradisional beratap alang-alang di Pringgasela Selatan',
    altEn: 'Traditional Sasak thatched-roof weaving pavilion surrounded by trees',
    to: '/cultures',
    matchSlugs: ['arsitektur-budaya', 'ruang-budaya'],
  },
];

export const HomePage: React.FC = () => {
  const { locale, t } = useLanguage();
  const [cmsCategories, setCmsCategories] = useState<Category[]>([]);

  useEffect(() => {
    publicApi
      .getCategories()
      .then((res) => {
        if (Array.isArray(res.categories)) {
          setCmsCategories(res.categories);
        }
      })
      .catch(() => {
        // Silent graceful fallback to reference museum pathways
      });
  }, []);

  const collectionCards = DEFAULT_FEATURED_CATEGORIES.map((item) => {
    const matched = cmsCategories.find((c) => item.matchSlugs?.includes(c.slug));
    if (!matched) return item;
    return {
      ...item,
      titleId: matched.nameId && item.key === 'motif-tenun' ? item.titleId : matched.nameId || item.titleId,
      titleEn: matched.nameEn && item.key === 'motif-tenun' ? item.titleEn : matched.nameEn || item.titleEn,
      to: matched.type === 'craft' && item.key === 'motif-tenun' ? `/motifs?category=${matched.$id}` : item.to,
    };
  });

  return (
    <div className="relative overflow-x-clip">
      {/* ================================================================= */}
      {/* DECORATIVE CULTURAL MARGINS (Subtle Woven Selvedge & Linework)    */}
      {/* ================================================================= */}

      {/* Far-Right Authentic Deep Indigo Songket Selvedge Strip */}
      <div
        className="pointer-events-none hidden xl:block absolute top-0 right-0 w-[52px] 2xl:w-[68px] h-[640px] z-30 overflow-hidden select-none"
        aria-hidden="true"
      >
        <img
          src="/images/textures/indigo-textile.webp"
          alt=""
          className="w-full h-full object-cover object-center drop-shadow-[-4px_4px_10px_rgba(37,34,31,0.18)]"
        />
        <div
          className="absolute inset-x-0 bottom-0 h-28"
          style={{
            background: 'linear-gradient(to bottom, rgba(243,238,229,0), rgba(243,238,229,1))',
          }}
        />
      </div>

      {/* Far-Left Delicate Indigo Woven Geometry Margin Filigree */}
      <div
        className="pointer-events-none hidden xl:block absolute top-0 left-0 w-[22px] 2xl:w-[26px] h-[360px] z-10 overflow-hidden select-none opacity-45"
        aria-hidden="true"
      >
        <svg viewBox="0 0 28 360" className="w-full h-full text-indigoTextile">
          <defs>
            <pattern id="leftWarpFiligree" width="28" height="44" patternUnits="userSpaceOnUse">
              <path
                d="M14,2 L24,12 L14,22 L4,12 Z M14,8 L18,12 L14,16 L10,12 Z M14,22 L24,32 L14,42 L4,32 Z M2,0 L2,44 M25,0 L25,44"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
              />
            </pattern>
          </defs>
          <rect width="28" height="360" fill="url(#leftWarpFiligree)" />
        </svg>
        <div
          className="absolute inset-x-0 bottom-0 h-24"
          style={{
            background: 'linear-gradient(to bottom, rgba(243,238,229,0), rgba(243,238,229,1))',
          }}
        />
      </div>

      {/* Faint archival diamond seal accent peeking near Koleksi Unggulan left margin */}
      <svg
        aria-hidden="true"
        viewBox="0 0 120 140"
        className="pointer-events-none hidden lg:block absolute top-[415px] -left-7 w-24 h-28 text-indigoTextile opacity-[0.07] z-0"
      >
        <g fill="none" stroke="currentColor" strokeWidth="2.2">
          <polygon points="60,8 106,54 60,100 14,54" />
          <polygon points="60,24 90,54 60,84 30,54" />
          <polygon points="60,40 74,54 60,68 46,54" />
        </g>
      </svg>

      {/* ================================================================= */}
      {/* SECTION 2: HERO — TENUN, TRADISI, DAN KEHIDUPAN MASYARAKAT        */}
      {/* ================================================================= */}
      <ArchiveHeroSection />

      {/* Organic Horizontal Archival Paper Seam Divider */}
      <div className="relative z-10 w-full h-[12px] overflow-hidden -mt-4 pointer-events-none" aria-hidden="true">
        <svg viewBox="0 0 1440 16" preserveAspectRatio="none" className="w-full h-full">
          <path
            d="M0,10 Q180,4 360,9 T720,7 T1080,10 T1440,6 L1440,16 L0,16 Z"
            fill="rgba(233, 223, 208, 0.35)"
          />
          <path
            d="M0,10 Q180,4 360,9 T720,7 T1080,10 T1440,6"
            fill="none"
            stroke="#C9B69C"
            strokeWidth="1"
            strokeOpacity="0.65"
          />
        </svg>
      </div>

      {/* ================================================================= */}
      {/* SECTION 3: KOLEKSI UNGGULAN — RAGAM WARISAN PRINGGASELA           */}
      {/* ================================================================= */}
      <section
        className="relative z-10 py-5 sm:py-6 lg:py-5"
        aria-labelledby="collections-heading"
      >
        <div className="max-w-[1380px] mx-auto px-5 sm:px-8 lg:px-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-5 items-start">
            {/* Left Intro Column (Cols 1-3) */}
            <div className="lg:col-span-3 space-y-2">
              <span className="block font-sans text-[11px] font-medium uppercase tracking-[0.16em] text-terracotta">
                {t('Koleksi Unggulan', 'Featured Collections')}
              </span>
              <h2
                id="collections-heading"
                className="font-serif text-[26px] sm:text-[29px] xl:text-[32px] font-semibold text-charcoal leading-[1.12] tracking-[-0.01em]"
              >
                {locale === 'id' ? (
                  <>
                    Ragam Warisan
                    <br className="hidden lg:inline" /> Pringgasela
                  </>
                ) : (
                  <>
                    Pringgasela
                    <br className="hidden lg:inline" /> Living Heritage
                  </>
                )}
              </h2>
              <p className="font-sans text-[13px] leading-[1.55] text-[#4D443B] pt-0.5 max-w-[270px]">
                {t(
                  'Pilihan koleksi yang merekam keahlian, nilai, dan identitas budaya masyarakat Pringgasela Selatan.',
                  'Curated collections documenting craftsmanship, ancestral philosophy, and cultural identity of South Pringgasela.'
                )}
              </p>
            </div>

            {/* Right 4 Category Plates in One Desktop Row (Cols 4-12) */}
            <div className="lg:col-span-9 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-4 xl:gap-5">
              {collectionCards.map((cat) => (
                <Link
                  key={cat.key}
                  to={cat.to}
                  className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
                >
                  {/* Image Plate */}
                  <div className="aspect-[16/10] w-full overflow-hidden border border-naturalBeige/80 bg-aged rounded-[2px]">
                    <img
                      src={cat.imageSrc}
                      alt={t(cat.altId, cat.altEn)}
                      width={1600}
                      height={1000}
                      loading="eager"
                      className="w-full h-full object-cover object-center group-hover:scale-[1.03] transition-transform duration-500"
                    />
                  </div>

                  {/* Minimalist Serif Caption + Terracotta Arrow */}
                  <div className="pt-2 flex items-center justify-between gap-2">
                    <h3 className="font-serif text-[14px] lg:text-[13.5px] xl:text-[15px] font-semibold text-charcoal group-hover:text-terracotta transition-colors leading-snug">
                      {t(cat.titleId, cat.titleEn)}
                    </h3>
                    <ArrowRight
                      className="w-4 h-4 text-terracotta shrink-0 group-hover:translate-x-1 transition-transform"
                      strokeWidth={1.75}
                    />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Irregular Organic Archival Paper Deckle Edge Above Kuratorial Band */}
      <div className="relative z-10 w-full h-[18px] overflow-hidden -mb-[1px] pointer-events-none" aria-hidden="true">
        <svg viewBox="0 0 1440 20" preserveAspectRatio="none" className="w-full h-full">
          <path
            d="M0,14 L110,10 L240,15 L390,7 L530,12 L675,5 L820,11 L975,6 L1120,13 L1290,8 L1440,12 L1440,20 L0,20 Z"
            fill="rgba(233, 223, 208, 0.56)"
          />
          <path
            d="M0,14 L110,10 L240,15 L390,7 L530,12 L675,5 L820,11 L975,6 L1120,13 L1290,8 L1440,12"
            fill="none"
            stroke="#C9B69C"
            strokeWidth="1"
            strokeOpacity="0.8"
          />
        </svg>
      </div>

      {/* ================================================================= */}
      {/* SECTION 4: KURATORIAL & JELAJAH MUSEUM (3-Column Editorial Band)   */}
      {/* ================================================================= */}
      <section
        id="kuratorial"
        className="relative z-10 surface-aged-paper py-6 sm:py-8 lg:py-6 border-b border-softLinen/90"
        aria-labelledby="curatorial-heading"
      >
        <div className="max-w-[1380px] mx-auto px-5 sm:px-8 lg:px-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 lg:gap-6 items-center">
            {/* LEFT: Kuratorial Editorial Statement (Cols 1-3) */}
            <div className="lg:col-span-4 xl:col-span-3 space-y-2.5">
              <span className="block font-serif italic text-[14.5px] text-terracotta">
                {t('Kuratorial', 'Curatorial')}
              </span>
              <h2
                id="curatorial-heading"
                className="font-serif text-[25px] sm:text-[28px] font-semibold text-charcoal leading-[1.15] tracking-[-0.01em]"
              >
                {locale === 'id' ? (
                  <>
                    Tenun dalam
                    <br />
                    Siklus Kehidupan
                  </>
                ) : (
                  <>
                    Weaving Through
                    <br />
                    Life’s Ceremonies
                  </>
                )}
              </h2>
              <p className="font-sans text-[13px] sm:text-[13.5px] leading-[1.58] text-[#4D443B]">
                {t(
                  'Tenun di Pringgasela Selatan bukan sekadar keterampilan, tetapi bagian dari siklus kehidupan masyarakat—dari keluarga, upacara, hingga identitas sosial.',
                  'In South Pringgasela, handloom weaving is more than textile artistry; it anchors kinship bonds, life-cycle rituals, and social dignity.'
                )}
              </p>
              <div className="pt-1">
                <Link
                  to="/curatorial"
                  className="inline-flex items-center gap-2 font-sans text-[13px] font-medium text-terracotta hover:text-terracotta-hover group transition-colors"
                >
                  <span>{t('Baca Ulasan Kuratorial', 'Read Curatorial Essay')}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" strokeWidth={1.75} />
                </Link>
              </div>
            </div>

            {/* CENTER: Natural Documentary Village Landscape with Organic Crop (Cols 5-8) */}
            <div className="lg:col-span-4 xl:col-span-5">
              <div className="relative w-full aspect-[16/10] lg:max-h-[220px] xl:max-h-[240px] overflow-hidden landscape-organic-crop">
                <img
                  src="/images/editorial/village-landscape.webp"
                  alt={t(
                    'Lanskap pedesaan Pringgasela Selatan berlatar pepohonan dan perbukitan Gunung Rinjani',
                    'Documentary view across South Pringgasela village rooftops beneath Mount Rinjani foothills'
                  )}
                  width={2000}
                  height={1200}
                  loading="eager"
                  className="w-full h-full object-cover object-center"
                />
              </div>
            </div>

            {/* RIGHT: Jelajah Museum Thematic Directory (Cols 9-12) */}
            <div className="lg:col-span-4 xl:col-span-4 lg:pl-6 xl:pl-8 space-y-2.5 border-t lg:border-t-0 lg:border-l border-naturalBeige/65 pt-6 lg:pt-0">
              <h2 className="font-serif text-[25px] sm:text-[28px] font-semibold text-charcoal leading-[1.15]">
                {t('Jelajah Museum', 'Explore Museum')}
              </h2>
              <p className="font-sans text-[13px] sm:text-[13.5px] leading-[1.55] text-[#4D443B] pb-1">
                {t(
                  'Telusuri koleksi, cerita, dan dokumentasi budaya dalam beberapa tema utama.',
                  'Navigate curated collections, oral histories, and archival records by core themes.'
                )}
              </p>

              <nav
                className="border-t border-b border-naturalBeige/80 divide-y divide-naturalBeige/80"
                aria-label={t('Tema Jelajah Museum', 'Museum Exploration Themes')}
              >
                <Link
                  to="/motifs"
                  className="flex items-center justify-between py-2.5 group hover:bg-ivory/40 px-1 transition-colors"
                >
                  <span className="flex items-center gap-3.5">
                    <MuseumLogo className="w-[18px] h-[18px] text-terracotta shrink-0" />
                    <span className="font-sans text-[14px] font-medium text-charcoal group-hover:text-terracotta transition-colors">
                      {t('Koleksi Tenun', 'Woven Collections')}
                    </span>
                  </span>
                  <ArrowRight className="w-4 h-4 text-terracotta group-hover:translate-x-1 transition-transform" strokeWidth={1.75} />
                </Link>

                <Link
                  to="/cultures"
                  className="flex items-center justify-between py-2.5 group hover:bg-ivory/40 px-1 transition-colors"
                >
                  <span className="flex items-center gap-3.5">
                    <BookOpen className="w-[18px] h-[18px] text-terracotta shrink-0" strokeWidth={1.75} />
                    <span className="font-sans text-[14px] font-medium text-charcoal group-hover:text-terracotta transition-colors">
                      {t('Kisah & Tradisi', 'Stories & Traditions')}
                    </span>
                  </span>
                  <ArrowRight className="w-4 h-4 text-terracotta group-hover:translate-x-1 transition-transform" strokeWidth={1.75} />
                </Link>

                <Link
                  to="/history"
                  className="flex items-center justify-between py-2.5 group hover:bg-ivory/40 px-1 transition-colors"
                >
                  <span className="flex items-center gap-3.5">
                    <Layers className="w-[18px] h-[18px] text-terracotta shrink-0" strokeWidth={1.75} />
                    <span className="font-sans text-[14px] font-medium text-charcoal group-hover:text-terracotta transition-colors">
                      {t('Arsip & Dokumentasi', 'Archives & Documentation')}
                    </span>
                  </span>
                  <ArrowRight className="w-4 h-4 text-terracotta group-hover:translate-x-1 transition-transform" strokeWidth={1.75} />
                </Link>
              </nav>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
