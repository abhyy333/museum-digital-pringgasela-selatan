import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const ArchiveHeroSection: React.FC = () => {
  const { locale, t } = useLanguage();

  return (
    <section
      className="relative overflow-x-clip pt-4 pb-3 sm:pt-6 sm:pb-4 lg:pt-5 lg:pb-3"
      aria-labelledby="hero-heading"
    >
      <div className="max-w-[1380px] mx-auto px-5 sm:px-8 lg:px-14 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-4 items-center">
          {/* LEFT: Editorial Title & Actions (Cols 1-5) */}
          <div className="lg:col-span-5 relative z-30 space-y-3.5 sm:space-y-4 lg:pr-2">
            {/* Eyebrow with extending archival hairline */}
            <div className="flex items-center gap-3.5">
              <span className="font-sans text-[11px] font-medium uppercase tracking-[0.18em] text-terracotta whitespace-nowrap">
                {t('Arsip Budaya Pringgasela', 'Pringgasela Cultural Archive')}
              </span>
              <span className="h-[1px] w-14 sm:w-20 bg-naturalBeige/90" aria-hidden="true" />
            </div>

            {/* Headline — crisp 3-line editorial hierarchy */}
            <h1
              id="hero-heading"
              className="font-serif font-semibold text-charcoal text-[35px] sm:text-[44px] lg:text-[48px] xl:text-[54px] leading-[1.06] tracking-[-0.015em]"
            >
              {locale === 'id' ? (
                <>
                  Tenun, Tradisi,
                  <br />
                  dan Kehidupan
                  <br />
                  Masyarakat
                </>
              ) : (
                <>
                  Weaving, Tradition,
                  <br />
                  and Community
                  <br />
                  Heritage
                </>
              )}
            </h1>

            {/* Description */}
            <p className="font-sans text-[14px] sm:text-[15px] leading-[1.58] text-[#494037] max-w-[385px]">
              {t(
                'Ruang digital untuk melestarikan, mendokumentasikan, dan mengenalkan kekayaan tenun dan budaya Pringgasela Selatan.',
                'A digital museum space to preserve, document, and introduce the rich handwoven textiles and living traditions of South Pringgasela.'
              )}
            </p>

            {/* Primary & Secondary CTAs */}
            <div className="pt-1.5 flex flex-wrap items-center gap-3.5">
              <Link
                to="/motifs"
                className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-[4px] bg-terracotta hover:bg-terracotta-hover text-[#FBF8F3] font-sans text-[13.5px] font-medium tracking-[0.01em] shadow-xs transition-colors"
              >
                <span>{t('Jelajahi Koleksi', 'Explore Collections')}</span>
                <ArrowRight className="w-4 h-4" strokeWidth={1.8} />
              </Link>

              <Link
                to="/cultures"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[4px] border border-terracotta/55 bg-ivory/80 hover:bg-terracotta/10 text-charcoal font-sans text-[13.5px] font-medium tracking-[0.01em] transition-colors"
              >
                <BookOpen className="w-4 h-4 text-terracotta" strokeWidth={1.8} />
                <span>{t('Baca Cerita', 'Read Stories')}</span>
              </Link>
            </div>
          </div>

          {/* RIGHT: Layered "The Weaver Emerges from the Archive Frame" Visual (Cols 6-12) */}
          <div className="lg:col-span-7 relative flex justify-end items-end mt-2 lg:mt-0">
            <div className="relative w-full max-w-[760px] ml-auto pt-1 sm:pt-2 pb-5 sm:pb-7 lg:pb-7">
              {/* Layer 1 (z-10): Archival Paper Mount & Sepia Heritage Photo */}
              <div className="relative z-10 w-[85%] sm:w-[76%] ml-auto mr-0 sm:mr-2 lg:mr-3">
                <div
                  className="bg-[#ECE2D0] p-[8px] sm:p-[12px] lg:p-[14px] archival-frame-edge shadow-[0_12px_28px_rgba(37,34,31,0.13)]"
                  style={{
                    backgroundImage:
                      "linear-gradient(145deg, rgba(243,238,229,0.72), rgba(226,214,194,0.88)), url('/images/textures/paper-texture.webp')",
                    backgroundSize: 'cover',
                  }}
                >
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-aged">
                    <img
                      src="/images/hero/weaver-background.webp"
                      alt={t(
                        'Arsip dokumentasi suasana rumah tenun tradisional Pringgasela',
                        'Archival documentary photograph of a traditional Sasak weaving house'
                      )}
                      width={2560}
                      height={1600}
                      fetchPriority="high"
                      className="w-full h-full object-cover object-center opacity-92"
                    />
                    <div
                      className="pointer-events-none absolute inset-0"
                      style={{
                        boxShadow: 'inset 0 0 26px rgba(37, 34, 31, 0.2)',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Layer 2 (z-20): Foreground Cutout Weaver & Loom Emerging Top/Left/Bottom Outside Frame */}
              <div className="relative sm:absolute z-20 -mt-[49%] sm:mt-0 sm:-bottom-1 lg:-bottom-2 -ml-3 sm:ml-0 sm:-left-[3%] md:-left-[5%] lg:-left-[6%] w-[102%] sm:w-[98%] lg:w-[99%] pointer-events-none select-none">
                <picture>
                  <source srcSet="/images/hero/weaver-foreground.webp" type="image/webp" />
                  <img
                    src="/images/hero/weaver-foreground.png"
                    alt={t(
                      'Maestro penenun Pringgasela Selatan menenun kain motif indigo menggunakan alat tenun gedogan tradisional',
                      'Master artisan weaver of South Pringgasela crafting deep indigo motif cloth on a traditional backstrap loom'
                    )}
                    width={2000}
                    height={1222}
                    fetchPriority="high"
                    className="w-full h-auto object-contain drop-shadow-[0_12px_18px_rgba(37,34,31,0.22)]"
                  />
                </picture>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
