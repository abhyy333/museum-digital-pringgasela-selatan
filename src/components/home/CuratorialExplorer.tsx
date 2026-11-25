import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Layers } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { WovenGridLogo } from '../common/DecorativeIcons';

/**
 * CuratorialExplorer — Section 3 ("Kuratorial" + Independent Landscape + "Jelajah Museum")
 * Preserves the layered archival-paper band with separate textile edge borders,
 * HTML curatorial essay, independent village landscape plate, and interactive Jelajah Museum links.
 */
export const CuratorialExplorer: React.FC = () => {
  const { t } = useLanguage();

  const exploreItems = [
    {
      to: '/motifs',
      labelId: 'Koleksi Tenun',
      labelEn: 'Weaving Collection',
      icon: <WovenGridLogo className="w-5 h-5 text-[#9A4428]" />,
    },
    {
      to: '/cultures',
      labelId: 'Kisah & Tradisi',
      labelEn: 'Stories & Traditions',
      icon: <BookOpen className="w-5 h-5 text-[#9A4428]" aria-hidden="true" />,
    },
    {
      to: '/history',
      labelId: 'Arsip & Dokumentasi',
      labelEn: 'Archives & Documentation',
      icon: <Layers className="w-5 h-5 text-[#9A4428]" aria-hidden="true" />,
    },
  ];

  return (
    <section
      aria-labelledby="kuratorial-heading"
      className="relative archival-paper-band border-b border-[#D8CCB7] overflow-hidden"
    >
      {/* Layer 1: Independent Left & Right Woven Textile Edge Accents */}
      <div
        className="hidden md:block absolute left-0 top-0 bottom-0 w-4 lg:w-6 z-[5] pointer-events-none select-none overflow-hidden opacity-75"
        aria-hidden="true"
      >
        <img
          src="/assets/textile-ornament-left.webp"
          alt=""
          width={670}
          height={2752}
          loading="lazy"
          className="w-full h-full object-cover object-right"
        />
      </div>
      <div
        className="hidden md:block absolute right-0 top-0 bottom-0 w-4 lg:w-6 z-[5] pointer-events-none select-none overflow-hidden opacity-75"
        aria-hidden="true"
      >
        <img
          src="/assets/textile-ornament-right.webp"
          alt=""
          width={670}
          height={2752}
          loading="lazy"
          className="w-full h-full object-cover object-left"
        />
      </div>

      <div className="relative z-10 max-w-[1440px] mx-auto px-6 sm:px-10 xl:px-14 py-9 sm:py-11">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6 items-center">
          {/* Left Zone: Editorial Curatorial Note (4 cols) */}
          <div className="lg:col-span-4 space-y-3 lg:pr-4">
            <span className="block font-serif italic text-[14px] text-[#9A4428] font-medium">
              {t('Kuratorial', 'Curatorial Note')}
            </span>
            <h2
              id="kuratorial-heading"
              className="font-serif text-[26px] sm:text-[30px] font-bold text-[#23211E] leading-[1.15]"
            >
              {t('Tenun dalam Siklus Kehidupan', 'Weaving Through the Cycle of Life')}
            </h2>
            <p className="text-[13.5px] sm:text-[14px] text-[#4B443C] leading-[1.6]">
              {t(
                'Tenun di Pringgasela Selatan bukan sekadar keterampilan, tetapi bagian dari siklus kehidupan masyarakat, mulai dari keluarga, upacara, hingga identitas sosial.',
                'In South Pringgasela, weaving is more than a craft; it belongs to the community life cycle, from family bonds and sacred ceremonies to social identity.'
              )}
            </p>
            <div className="pt-1">
              <Link
                to="/history"
                className="inline-flex items-center gap-2.5 min-h-[44px] py-1 text-[13.5px] font-semibold text-[#9A4428] hover:text-[#7A331C] transition-colors group"
              >
                <span>{t('Baca Ulasan Kuratorial', 'Read Curatorial Essay')}</span>
                <ArrowRight
                  className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </Link>
            </div>
          </div>

          {/* Center Zone: Independent Village Landscape Archival Plate (4 cols) */}
          <div className="lg:col-span-4 flex justify-center">
            <div className="relative w-full max-w-[460px]">
              <img
                src="/assets/curatorial-village-landscape.webp"
                alt={t(
                  'Lanskap Desa Pringgasela Selatan di kaki perbukitan berkabut lereng Gunung Rinjani',
                  'Landscape of the village settlement below the misty foothills of Mount Rinjani in East Lombok'
                )}
                width={2200}
                height={1320}
                loading="lazy"
                className="w-full h-auto block object-contain"
              />
            </div>
          </div>

          {/* Right Zone: Interactive "Jelajah Museum" Navigation Panel (4 cols) */}
          <div className="lg:col-span-4 lg:pl-6 lg:border-l lg:border-[#D4C7B2] space-y-3">
            <div className="space-y-1.5">
              <h2 className="font-serif text-[25px] sm:text-[28px] font-bold text-[#23211E] leading-[1.15]">
                {t('Jelajah Museum', 'Explore the Museum')}
              </h2>
              <p className="text-[13px] sm:text-[13.5px] text-[#554E45] leading-[1.5]">
                {t(
                  'Telusuri koleksi, cerita, dan dokumentasi budaya dalam beberapa tema utama.',
                  'Navigate collections, oral stories, and cultural archives across our core themes.'
                )}
              </p>
            </div>

            <nav aria-label={t('Navigasi tema museum', 'Museum thematic navigation')} className="divide-y divide-[#D4C7B2] border-t border-b border-[#D4C7B2]">
              {exploreItems.map((item) => (
                <Link
                  key={item.to + item.labelId}
                  to={item.to}
                  className="group flex items-center justify-between py-3.5 min-h-[48px] text-[#23211E] hover:text-[#9A4428] transition-colors"
                >
                  <span className="flex items-center gap-3.5">
                    <span className="shrink-0" aria-hidden="true">
                      {item.icon}
                    </span>
                    <span className="font-serif text-[15px] font-semibold">
                      {t(item.labelId, item.labelEn)}
                    </span>
                  </span>
                  <ArrowRight
                    className="w-4 h-4 text-[#9A4428] transition-transform duration-200 group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </section>
  );
};
