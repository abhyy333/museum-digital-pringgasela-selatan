import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

/**
 * HeroStage — Layered 3D Editorial Canvas
 * Renders 7 independent visual depth layers anchored relative to HeroStage:
 *   Layer 0: CanvasBackground (paper-canvas.webp)
 *   Layer 1: TextileOrnamentLeft & TextileOrnamentRight (woven geometric textile borders)
 *   Layer 2: ArchivePhotoFrame (archive-frame.webp) + ArchiveBackgroundImage (archive-scene.webp)
 *   Layer 3: WeaverSubjectLayer (weaver-cutout.webp transparent cutout)
 *   Layer 4: FabricForegroundLayer (fabric-foreground.webp transparent cutout)
 *   Layer 5: NaturalShadowLayers (frame, ambient, and fabric contact shadows)
 *   Layer 6: HeroTextContent & HeroActions (interactive HTML & React UI)
 */
export const HeroStage: React.FC = () => {
  const { locale, t } = useLanguage();

  const ctaLinks = (
    <div className="flex flex-wrap items-center gap-2.5 sm:gap-3.5">
      <Link
        to="/motifs"
        className="inline-flex items-center justify-center gap-2 sm:gap-2.5 min-h-[44px] px-4 sm:px-6 py-3 rounded-md bg-[#9A4428] hover:bg-[#7E351D] text-[#FAF6EE] font-medium text-[13.5px] sm:text-sm transition-colors shadow-sm"
      >
        <span>{t('Jelajahi Koleksi', 'Explore Collection')}</span>
        <ArrowRight className="w-4 h-4" aria-hidden="true" />
      </Link>
      <Link
        to="/cultures"
        className="inline-flex items-center justify-center gap-2 sm:gap-2.5 min-h-[44px] px-4 sm:px-5 py-3 rounded-md border border-[#C6B7A0] bg-[#F7F1E6]/80 hover:bg-[#EDE3D2] text-[#35302B] font-medium text-[13.5px] sm:text-sm transition-colors"
      >
        <BookOpen className="w-4 h-4 text-[#7D4934]" aria-hidden="true" />
        <span>{t('Baca Cerita', 'Read Stories')}</span>
      </Link>
    </div>
  );

  return (
    <section
      aria-label={t('Panggung Utama Museum Digital Pringgasela Selatan', 'South Pringgasela Digital Museum Hero Stage')}
      className="hero-stage archival-paper-canvas relative overflow-x-clip border-b border-[#DDD2BE]"
    >
      {/* LAYER 0: Explicit Global Paper Canvas Texture Plane */}
      <div className="absolute inset-0 z-0 pointer-events-none select-none" aria-hidden="true">
        <img
          src="/assets/paper-canvas.webp"
          alt=""
          width={2048}
          height={2048}
          className="w-full h-full object-cover opacity-55 mix-blend-multiply"
        />
      </div>

      {/* LAYER 1: Independent Woven Textile Ornaments (Geometric Textile Interpretation) */}
      <div
        className="hidden sm:block absolute left-0 top-0 bottom-0 z-[5] pointer-events-none select-none overflow-hidden"
        style={{ width: 'var(--ornament-left-width)' }}
        aria-hidden="true"
      >
        <img
          src="/assets/textile-ornament-left.webp"
          alt=""
          width={670}
          height={2752}
          className="w-full h-full object-cover object-right opacity-55"
        />
      </div>

      <div
        className="hidden sm:block absolute right-0 top-0 bottom-0 z-[5] pointer-events-none select-none overflow-hidden"
        style={{ width: 'var(--ornament-right-width)' }}
        aria-hidden="true"
      >
        <img
          src="/assets/textile-ornament-right.webp"
          alt=""
          width={670}
          height={2752}
          className="w-full h-full object-cover object-left opacity-85"
        />
      </div>

      {/* =====================================================================
          DESKTOP & WIDE STAGE (>= 1024px): Full 3D Layered Composition
          ===================================================================== */}
      <div className="hidden lg:block relative w-full min-h-[var(--hero-min-height)]">
        {/* LAYER 5A: Independent Frame & Ambient Shadows */}
        <div
          className="absolute pointer-events-none z-[15]"
          aria-hidden="true"
          style={{
            left: 'calc(var(--frame-left) + 0.5cqw)',
            top: 'calc(var(--frame-top) + 0.8cqw)',
            width: 'var(--frame-width)',
            aspectRatio: '2720 / 1700',
            background: 'radial-gradient(ellipse at 52% 52%, rgba(45, 34, 22, 0.22) 0%, rgba(45, 34, 22, 0.08) 65%, transparent 82%)',
            filter: 'blur(12px)',
            opacity: 'var(--shadow-intensity)',
          }}
        />

        {/* LAYER 2: Archival Photograph (2A) & Paper Frame (2B) as Separate Elements */}
        <div
          className="absolute z-[20] pointer-events-none select-none"
          style={{
            left: 'var(--frame-left)',
            top: 'var(--frame-top)',
            width: 'var(--frame-width)',
            aspectRatio: '2720 / 1700',
          }}
        >
          {/* Layer 2A: Clean Sepia Documentary Background Scene (no weaver) */}
          <img
            src="/assets/archive-scene.webp"
            alt={t(
              'Foto arsip dokumenter rumah adat Sasak beranyaman bambu dengan latar pepohonan desa',
              'Documentary archival photograph of a traditional woven-bamboo Sasak house and village trees'
            )}
            width={2560}
            height={1554}
            fetchPriority="high"
            className="absolute left-[2.94%] top-[4.29%] w-[94.12%] h-[91.41%] object-cover z-[1]"
          />

          {/* Layer 2B: Independent Deckled Archival Paper Frame with Transparent Aperture */}
          <img
            src="/assets/archive-frame.webp"
            alt=""
            width={2720}
            height={1700}
            fetchPriority="high"
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-fill z-[2]"
          />
        </div>

        {/* LAYER 5B: Weaver Ambient Shadow onto Archival Print */}
        <div
          className="absolute pointer-events-none z-[25]"
          aria-hidden="true"
          style={{
            left: 'calc(var(--weaver-left) + 18cqw)',
            top: 'calc(var(--weaver-top) + 4cqw)',
            width: '32cqw',
            height: '26cqw',
            background: 'radial-gradient(ellipse at 48% 55%, rgba(34, 25, 16, 0.30) 0%, rgba(34, 25, 16, 0.08) 58%, transparent 78%)',
            filter: 'blur(14px)',
            opacity: 'var(--shadow-intensity)',
          }}
        />

        {/* LAYER 5D: Woven Mat Contact Shadow onto Paper Canvas */}
        <div
          className="absolute pointer-events-none z-[28]"
          aria-hidden="true"
          style={{
            left: 'calc(var(--weaver-left) + 21cqw)',
            top: 'calc(var(--weaver-top) + 30.8cqw)',
            width: '35cqw',
            height: '2.8cqw',
            background: 'radial-gradient(ellipse at 50% 45%, rgba(36, 26, 16, 0.24) 0%, rgba(36, 26, 16, 0.08) 65%, transparent 85%)',
            filter: 'blur(6px)',
            opacity: 'var(--shadow-intensity)',
          }}
        />

        {/* LAYER 3: Weaver + Backstrap Loom + Woven Mat Subject Cutout */}
        <div
          className="absolute z-[30] pointer-events-none select-none"
          style={{
            left: 'var(--weaver-left)',
            top: 'var(--weaver-top)',
            width: 'var(--weaver-width)',
            transform: 'scale(var(--weaver-scale))',
            transformOrigin: 'top left',
          }}
        >
          <img
            src="/assets/weaver-cutout.webp"
            alt={t(
              'Perempuan pengrajin tenun Pringgasela Selatan sedang menenun kain indigo menggunakan alat tenun gedogan tradisional',
              'Elder weaver from South Pringgasela operating a traditional wooden gedogan backstrap loom'
            )}
            width={2190}
            height={1250}
            fetchPriority="high"
            className="w-full h-auto block"
          />
        </div>

        {/* LAYER 5C: Foreground Woven Fabric Contact Shadow onto Paper Canvas */}
        <div
          className="absolute pointer-events-none z-[35]"
          aria-hidden="true"
          style={{
            left: 'calc(var(--fabric-left) + 2cqw)',
            top: 'calc(var(--fabric-top) + 11.2cqw)',
            width: 'calc(var(--fabric-width) * 0.94)',
            height: '8.8cqw',
            background: 'linear-gradient(166deg, transparent 14%, rgba(32, 24, 15, 0.25) 54%, rgba(32, 24, 15, 0.08) 82%, transparent 100%)',
            filter: 'blur(9px)',
            transform: 'rotate(-9deg)',
            opacity: 'var(--shadow-intensity)',
          }}
        />

        {/* LAYER 4: Foreground Woven Fabric Cutout (Independent of Weaver) */}
        <div
          className="absolute z-[40] pointer-events-none select-none"
          style={{
            left: 'var(--fabric-left)',
            top: 'var(--fabric-top)',
            width: 'var(--fabric-width)',
            transform: 'scale(var(--fabric-scale)) rotate(var(--fabric-rotate))',
            transformOrigin: 'top right',
          }}
        >
          <img
            src="/assets/fabric-foreground.webp"
            alt={t(
              'Kain tenun indigo bermotif geometris krem dan garis terakota yang terbentang keluar dari bingkai arsip',
              'Handwoven deep indigo textile with cream geometric motifs and terracotta stripes extending across the canvas foreground'
            )}
            width={2130}
            height={910}
            fetchPriority="high"
            className="w-full h-auto block"
          />
        </div>

        {/* LAYER 6: Interactive HTML Headline, Narrative, & Hero Actions */}
        <div className="relative z-[50] max-w-[1440px] mx-auto px-8 xl:px-14 pt-8 xl:pt-10 pb-12">
          <div className="grid grid-cols-12 items-start">
            <div className="col-span-5 space-y-4 xl:space-y-5 pr-2">
              {/* Eyebrow Label + Rule */}
              <div className="flex items-center gap-3.5 max-w-[330px]">
                <span className="text-[11px] uppercase tracking-[0.2em] text-[#9A4428] font-semibold whitespace-nowrap">
                  {t('ARSIP BUDAYA PRINGGASELA', 'PRINGGASELA CULTURAL ARCHIVE')}
                </span>
                <span className="h-px flex-1 bg-[#B88972]/60" aria-hidden="true" />
              </div>

              {/* Master Headline */}
              <h1 className="font-serif text-[36px] xl:text-[48px] 2xl:text-[52px] font-bold text-[#23211E] leading-[1.06] tracking-[-0.02em]">
                {locale === 'en' ? (
                  <>
                    Weaving, Tradition,<br />
                    and Community<br />
                    Heritage
                  </>
                ) : (
                  <>
                    Tenun, Tradisi,<br />
                    dan Kehidupan<br />
                    Masyarakat
                  </>
                )}
              </h1>

              {/* Editorial Narrative */}
              <p className="text-[14.5px] xl:text-[15.5px] text-[#4C463E] leading-[1.6] max-w-[400px] font-normal">
                {t(
                  'Ruang digital untuk melestarikan, mendokumentasikan, dan mengenalkan kekayaan tenun dan budaya Pringgasela Selatan.',
                  'A digital museum space preserving, documenting, and sharing the weaving heritage and cultural life of South Pringgasela.'
                )}
              </p>

              {/* HeroActions */}
              <div className="pt-1">
                {ctaLinks}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================================
          MOBILE & TABLET STAGE (< 1024px): Reflowed Order Without Overlap
          1. Headline & Description -> 2. Layered Visual Stage -> 3. HeroActions
          ===================================================================== */}
      <div className="lg:hidden relative z-[30] px-6 sm:px-10 pt-7 pb-8 flex flex-col gap-5">
        {/* 1. Headline & Description */}
        <div className="space-y-3.5 max-w-xl">
          <div className="flex items-center gap-3 max-w-[290px]">
            <span className="text-[10.5px] uppercase tracking-[0.18em] text-[#9A4428] font-semibold whitespace-nowrap">
              {t('ARSIP BUDAYA PRINGGASELA', 'PRINGGASELA CULTURAL ARCHIVE')}
            </span>
            <span className="h-px flex-1 bg-[#B88972]/60" aria-hidden="true" />
          </div>

          <h1 className="font-serif text-3xl sm:text-[40px] font-bold text-[#23211E] leading-[1.08]">
            {t('Tenun, Tradisi, dan Kehidupan Masyarakat', 'Weaving, Tradition, and Community Heritage')}
          </h1>

          <p className="text-sm sm:text-[15px] text-[#4C463E] leading-relaxed">
            {t(
              'Ruang digital untuk melestarikan, mendokumentasikan, dan mengenalkan kekayaan tenun dan budaya Pringgasela Selatan.',
              'A digital museum space preserving, documenting, and sharing the weaving heritage and cultural life of South Pringgasela.'
            )}
          </p>
        </div>

        {/* Tablet: show CTAs right after text; Mobile: show CTAs below layered visual */}
        <div className="hidden sm:block">
          {ctaLinks}
        </div>

        {/* 2 & 3. Independent Layered Visual Stage (Frame + Weaver + Foreground Fabric) */}
        <div className="relative w-full h-[54cqw] sm:h-[51cqw] min-h-[205px]">
          {/* Layer 5A: Frame shadow */}
          <div
            className="absolute pointer-events-none z-[15]"
            aria-hidden="true"
            style={{
              left: 'calc(var(--frame-left) + 0.8cqw)',
              top: 'calc(var(--frame-top) + 1cqw)',
              width: 'var(--frame-width)',
              aspectRatio: '2720 / 1700',
              background: 'radial-gradient(ellipse at 50% 50%, rgba(45, 34, 22, 0.22) 0%, transparent 78%)',
              filter: 'blur(8px)',
            }}
          />

          {/* Layer 2: Archive Scene + Frame */}
          <div
            className="absolute z-[20] pointer-events-none select-none"
            style={{
              left: 'var(--frame-left)',
              top: 'var(--frame-top)',
              width: 'var(--frame-width)',
              aspectRatio: '2720 / 1700',
            }}
          >
            <img
              src="/assets/archive-scene.webp"
              alt={t('Foto arsip rumah adat Sasak', 'Archival Sasak house photograph')}
              width={2560}
              height={1554}
              className="absolute left-[2.94%] top-[4.29%] w-[94.12%] h-[91.41%] object-cover z-[1]"
            />
            <img
              src="/assets/archive-frame.webp"
              alt=""
              width={2720}
              height={1700}
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-fill z-[2]"
            />
          </div>

          {/* Layer 3: Weaver + Loom */}
          <div
            className="absolute z-[30] pointer-events-none select-none"
            style={{
              left: 'var(--weaver-left)',
              top: 'var(--weaver-top)',
              width: 'var(--weaver-width)',
            }}
          >
            <img
              src="/assets/weaver-cutout.webp"
              alt={t('Pengrajin tenun gedogan Pringgasela Selatan', 'South Pringgasela backstrap loom weaver')}
              width={2190}
              height={1250}
              className="w-full h-auto block"
            />
          </div>

          {/* Layer 5C: Fabric Contact Shadow */}
          <div
            className="absolute pointer-events-none z-[35]"
            aria-hidden="true"
            style={{
              left: 'calc(var(--fabric-left) + 2cqw)',
              top: 'calc(var(--fabric-top) + 11cqw)',
              width: 'var(--fabric-width)',
              height: '9cqw',
              background: 'radial-gradient(ellipse at 50% 50%, rgba(32, 24, 15, 0.24) 0%, transparent 74%)',
              filter: 'blur(7px)',
            }}
          />

          {/* Layer 4: Foreground Woven Fabric */}
          <div
            className="absolute z-[40] pointer-events-none select-none"
            style={{
              left: 'var(--fabric-left)',
              top: 'var(--fabric-top)',
              width: 'var(--fabric-width)',
              transform: 'rotate(var(--fabric-rotate))',
            }}
          >
            <img
              src="/assets/fabric-foreground.webp"
              alt={t('Kain tenun indigo motif geometris', 'Handwoven indigo geometric textile')}
              width={2130}
              height={910}
              className="w-full h-auto block"
            />
          </div>
        </div>

        {/* 4. Mobile CTA Actions (cleanly below visual stage, zero overlap) */}
        <div className="sm:hidden pt-1">
          {ctaLinks}
        </div>
      </div>
    </section>
  );
};
