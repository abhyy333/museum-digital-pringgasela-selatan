import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const ArchiveHeroSection: React.FC = () => {
  const { locale, t } = useLanguage();

  return (
    <section
      className="relative overflow-x-clip pt-4 sm:pt-5 lg:pt-5 xl:pt-6 pb-1.5 sm:pb-2 lg:pb-1.5"
      aria-labelledby="hero-heading"
    >
      <div className="max-w-[1380px] mx-auto px-5 sm:px-8 lg:px-12 xl:px-14 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-4 items-center">
          {/* LEFT: Editorial Title & Actions (Cols 1-5) */}
          <div className="lg:col-span-5 relative z-30 space-y-3 sm:space-y-3.5 lg:pr-2">
            {/* Eyebrow with extending archival hairline */}
            <div className="flex items-center gap-3.5">
              <span className="font-sans text-[11px] font-medium uppercase tracking-[0.18em] text-terracotta whitespace-nowrap">
                {t('Arsip Budaya Pringgasela', 'Pringgasela Cultural Archive')}
              </span>
              <span className="h-[1px] w-14 sm:w-20 bg-naturalBeige/90" aria-hidden="true" />
            </div>

            {/* Headline — responsive fluid serif hierarchy preserving exact 3-line structure */}
            <h1
              id="hero-heading"
              className="font-serif font-semibold text-charcoal leading-[1.05] tracking-[-0.015em]"
              style={{ fontSize: 'clamp(32px, 3.25vw, 52px)' }}
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
            <p className="font-sans text-[13.5px] sm:text-[14.5px] leading-[1.55] text-[#494037] max-w-[385px]">
              {t(
                'Ruang digital untuk melestarikan, mendokumentasikan, dan mengenalkan kekayaan tenun dan budaya Pringgasela Selatan.',
                'A digital museum space to preserve, document, and introduce the rich handwoven textiles and living traditions of South Pringgasela.'
              )}
            </p>

            {/* Primary & Secondary CTAs */}
            <div className="pt-1 flex flex-wrap items-center gap-3.5">
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

          {/* RIGHT: 6-Layer 3D Optical Archive Stage (Cols 6-12) */}
          <div className="lg:col-span-7 relative flex justify-end items-end mt-1 lg:mt-0">
            {/* Aspect-locked stage ensures weaver head NEVER clips behind sticky header and emerges above Layer 3 frame */}
            <div className="relative w-full max-w-[700px] xl:max-w-[735px] ml-auto aspect-[1.58/1] sm:aspect-[1.64/1]">
              {/* Layer 2 + Layer 3: Recessed Sepia Documentary Backdrop inside Vintage Textured Paper Frame */}
              <div
                className="absolute top-[11%] sm:top-[13%] right-[1%] sm:right-[1.5%] w-[86%] sm:w-[77%] bottom-[7.5%] z-10 pointer-events-none select-none"
                style={{
                  filter: 'drop-shadow(7px 14px 20px rgba(37, 34, 31, 0.19))',
                }}
              >
                {/* Layer 2: Sepia heritage house window aligned inside paper matte */}
                <div className="relative w-full h-full p-[3.5%] bg-[#E7DAC4]">
                  <div className="relative w-full h-full overflow-hidden bg-aged">
                    <img
                      src="/images/hero/hero-background.webp"
                      alt={t(
                        'Arsip dokumentasi suasana rumah tenun tradisional Pringgasela',
                        'Archival documentary photograph of a traditional Sasak weaving house'
                      )}
                      width={2560}
                      height={1600}
                      fetchPriority="high"
                      className="w-full h-full object-cover object-center opacity-[0.94] sepia-[0.14] contrast-[1.02]"
                    />
                    {/* Subtle warm archival vignette inside photo pane */}
                    <div
                      className="pointer-events-none absolute inset-0"
                      style={{
                        boxShadow: 'inset 0 0 28px rgba(42, 33, 24, 0.28)',
                      }}
                    />
                    {/* Directional soft ambient occlusion shadow cast by weaver shoulder/back onto backdrop frame */}
                    <div
                      className="pointer-events-none absolute right-[12%] top-[10%] bottom-0 w-[56%] opacity-35"
                      style={{
                        background:
                          'radial-gradient(ellipse at 68% 58%, rgba(30,24,18,0.65) 0%, rgba(30,24,18,0.22) 48%, transparent 74%)',
                      }}
                    />
                  </div>

                  {/* Layer 3: Textured irregular cream archival paper frame mount */}
                  <img
                    src="/images/hero/paper-frame.webp"
                    alt=""
                    aria-hidden="true"
                    width={2560}
                    height={1600}
                    className="pointer-events-none absolute inset-0 w-full h-full object-fill"
                  />
                </div>
              </div>

              {/* Layer 6 (Bottom Surface Contact): Smooth SVG/blurred ambient contact shadow grounding loom mat & cloth */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute z-[15] left-[2%] right-[2%] bottom-[-1%] h-[18%] blur-md"
                style={{
                  background:
                    'radial-gradient(ellipse 46% 36% at 54% 66%, rgba(45, 34, 24, 0.24) 0%, rgba(45, 34, 24, 0.09) 46%, transparent 74%)',
                }}
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute z-[15] left-[0%] w-[52%] bottom-[-2%] h-[22%] -rotate-[19deg] blur-md"
                style={{
                  background:
                    'radial-gradient(ellipse 42% 24% at 46% 62%, rgba(28, 35, 44, 0.22) 0%, rgba(37, 34, 31, 0.07) 48%, transparent 74%)',
                }}
              />

              {/* Layer 4: Master 3000px Weaver Cutout rising above & forward from the Vintage Paper Frame */}
              <div className="absolute inset-0 z-20 pointer-events-none select-none flex items-end justify-end">
                <picture className="w-full h-full flex items-end justify-end">
                  <source srcSet="/images/hero/weaver-foreground.webp" type="image/webp" />
                  <img
                    src="/images/hero/weaver-foreground.png"
                    alt={t(
                      'Maestro penenun Pringgasela Selatan menenun kain motif indigo menggunakan alat tenun gedogan tradisional',
                      'Master artisan weaver of South Pringgasela crafting deep indigo motif cloth on a traditional backstrap loom'
                    )}
                    width={3000}
                    height={1833}
                    fetchPriority="high"
                    className="w-full h-full object-contain object-bottom drop-shadow-[3px_8px_12px_rgba(37,34,31,0.18)]"
                  />
                </picture>
              </div>

              {/* Layer 5: Foreground Draping Indigo Fabric & Warp Depth Layer Overlapping Frame Boundary */}
              <div className="absolute inset-0 z-[25] pointer-events-none select-none flex items-end justify-end">
                <img
                  src="/images/hero/woven-fabric-foreground.webp"
                  alt=""
                  aria-hidden="true"
                  width={3000}
                  height={1833}
                  fetchPriority="high"
                  className="w-full h-full object-contain object-bottom drop-shadow-[0_10px_16px_rgba(24,33,44,0.22)]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
