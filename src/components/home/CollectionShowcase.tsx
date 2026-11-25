import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface CollectionPortal {
  id: string;
  to: string;
  image: string;
  titleId: string;
  titleEn: string;
  altId: string;
  altEn: string;
}

const COLLECTION_PORTALS: CollectionPortal[] = [
  {
    id: 'motif-tenun',
    to: '/motifs',
    image: '/assets/collection-motif-tenun.webp',
    titleId: 'Motif Tenun',
    titleEn: 'Weaving Motifs',
    altId: 'Detail makro motif geometris tenun indigo dan krem dengan garis terakota',
    altEn: 'Macro detail of geometric indigo and cream woven motif with terracotta stripes',
  },
  {
    id: 'alat-tenun',
    to: '/crafts',
    image: '/assets/collection-alat-tenun.webp',
    titleId: 'Alat Tenun Tradisional',
    titleEn: 'Traditional Looms',
    altId: 'Teropong kayu tradisional alat tenun gedogan dengan gulungan benang kapas',
    altEn: 'Traditional carved wooden weaving shuttle holding cotton bobbin thread',
  },
  {
    id: 'pewarna-alami',
    to: '/crafts',
    image: '/assets/collection-pewarna-alami.webp',
    titleId: 'Pewarna Alami',
    titleEn: 'Natural Dyes',
    altId: 'Untaian benang kapas hasil pewarnaan alami indigo, terakota, dan kunyit',
    altEn: 'Skeins of handspun cotton yarn colored with botanical indigo, rust, and ochre dyes',
  },
  {
    id: 'arsitektur',
    to: '/cultures',
    image: '/assets/collection-arsitektur.webp',
    titleId: 'Arsitektur & Ruang Budaya',
    titleEn: 'Architecture & Cultural Space',
    altId: 'Rumah adat Sasak berdinding anyaman bambu dan beratap alang-alang',
    altEn: 'Traditional Sasak woven-bamboo house with thatched alang-alang roof',
  },
];

/**
 * CollectionShowcase — Section 2 ("KOLEKSI UNGGULAN / Ragam Warisan Pringgasela")
 * Asymmetric editorial strip on the continuous Layer 0 paper canvas:
 * left curatorial intro column + 4 independent high-res collection photography portals.
 */
export const CollectionShowcase: React.FC = () => {
  const { t } = useLanguage();

  return (
    <section
      aria-labelledby="koleksi-unggulan-heading"
      className="relative archival-paper-canvas border-b border-[#DDD2BE]"
    >
      <div className="max-w-[1440px] mx-auto px-6 sm:px-10 xl:px-14 py-9 sm:py-11">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 lg:gap-8 items-start">
          {/* Left Column: Editorial Intro (3 of 12 cols on desktop) */}
          <div className="lg:col-span-3 lg:pr-6 lg:border-r lg:border-[#D7CBB6] space-y-2.5">
            <span className="block text-[11px] uppercase tracking-[0.18em] text-[#9A4428] font-semibold">
              {t('KOLEKSI UNGGULAN', 'FEATURED COLLECTION')}
            </span>
            <h2
              id="koleksi-unggulan-heading"
              className="font-serif text-[26px] sm:text-[28px] font-bold text-[#23211E] leading-[1.15]"
            >
              {t('Ragam Warisan Pringgasela', 'Pringgasela Living Heritage')}
            </h2>
            <p className="text-[13px] sm:text-[13.5px] text-[#554E45] leading-[1.55] pt-0.5">
              {t(
                'Pilihan koleksi yang merekam keahlian, nilai, dan identitas budaya masyarakat Pringgasela Selatan.',
                'Selected collections documenting the craftsmanship, values, and cultural identity of South Pringgasela.'
              )}
            </p>
          </div>

          {/* Right Column: 4 Independent Collection Photography Portals (9 of 12 cols) */}
          <div className="lg:col-span-9 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {COLLECTION_PORTALS.map((item) => (
              <Link
                key={item.id}
                to={item.to}
                className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9A4428] rounded-sm"
              >
                <div className="relative aspect-[3/2] overflow-hidden bg-[#E5DAC7] border border-[#D4C7B2]">
                  <img
                    src={item.image}
                    alt={t(item.altId, item.altEn)}
                    width={1800}
                    height={1200}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="pt-2.5 flex items-center justify-between gap-2 min-h-[36px]">
                  <h3 className="font-serif text-[14.5px] font-semibold text-[#2B2723] group-hover:text-[#9A4428] transition-colors leading-snug">
                    {t(item.titleId, item.titleEn)}
                  </h3>
                  <ArrowRight
                    className="w-4 h-4 shrink-0 text-[#9A4428] transition-transform duration-200 group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
