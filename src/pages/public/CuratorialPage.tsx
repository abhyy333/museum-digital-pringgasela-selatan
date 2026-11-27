import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Compass, History as HistoryIcon } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { publicApi } from '../../appwrite/publicApi';
import { WeavingMotif, Culture, VillageHistory } from '../../types/schema';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { MotifCard } from '../../components/public/MotifCard';
import { CultureCard } from '../../components/public/CultureCard';
import { pickTranslation, useDocumentTitle } from '../../utils/i18n';

export const CuratorialPage: React.FC = () => {
  const { locale, t } = useLanguage();
  useDocumentTitle(
    t(
      'Ulasan Kuratorial — Museum Digital Pringgasela Selatan',
      'Curatorial Essay — South Pringgasela Digital Museum'
    )
  );
  const [motifs, setMotifs] = useState<WeavingMotif[]>([]);
  const [cultures, setCultures] = useState<Culture[]>([]);
  const [eras, setEras] = useState<VillageHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      publicApi.getMotifs({ limit: 3 }),
      publicApi.getCultures({ limit: 3 }),
      publicApi.getHistory(),
    ])
      .then(([mRes, cuRes, hRes]) => {
        if (mRes.status === 'fulfilled') setMotifs(mRes.value.items || []);
        if (cuRes.status === 'fulfilled') setCultures(cuRes.value.items || []);
        if (hRes.status === 'fulfilled') setEras(hRes.value.eras || []);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <article className="max-w-6xl mx-auto px-5 sm:px-8 lg:px-14 py-12 space-y-16">
      {/* Editorial Essay Header */}
      <header className="max-w-3xl space-y-4">
        <span className="block font-serif italic text-base text-terracotta">
          {t('Ulasan Kuratorial', 'Curatorial Essay')}
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl font-semibold text-charcoal leading-[1.12]">
          {t(
            'Tenun dalam Siklus Kehidupan Masyarakat Pringgasela Selatan',
            'Handloom Weaving Within the Life Cycle of South Pringgasela'
          )}
        </h1>
        <p className="text-base sm:text-lg text-[#494037] leading-relaxed">
          {t(
            'Di Desa Pringgasela Selatan, setiap lembar kain tenun gedogan adalah arsip hidup—menyimpan doa kesabaran perempuan penenun, penanda kedewasaan sosial, hingga pengikat sakral upacara adat Sasak.',
            'In South Pringgasela, each backstrap-woven cloth is a living manuscript—preserving ancestral prayers, rites of passage, and social harmony.'
          )}
        </p>
      </header>

      {/* Main Feature Landscape + Narrative */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 overflow-hidden border border-naturalBeige/80 bg-aged">
          <img
            src="/images/editorial/village-landscape.webp"
            alt={t('Lanskap Pringgasela Selatan di lereng Gunung Rinjani', 'South Pringgasela landscape beneath Rinjani')}
            width={2000}
            height={1200}
            className="w-full h-auto object-cover"
          />
        </div>
        <div className="lg:col-span-5 space-y-4 text-sm sm:text-base text-[#4D443B] leading-relaxed bg-surface/90 border border-softLinen p-6 sm:p-8">
          <h2 className="font-serif text-2xl font-semibold text-charcoal">
            {t('Dari Serat Kapas Hingga Ruang Upacara', 'From Raw Cotton to Sacred Gatherings')}
          </h2>
          <p>
            {t(
              'Proses menenun dengan alat gedogan (cag-cag) menuntut keselarasan gerak tubuh penenun, napas, serta perhitungan rumit benang pakan dan lungsi. Pewarna alami dari daun tarum (indigo), akar mengkudu, kulit kayu mahoni, dan kunyit menghadirkan palet bumi yang selaras dengan lanskap Rinjani.',
              'Weaving on the traditional cag-cag backstrap loom unifies physical cadence, breath, and intricate warp-weft reckoning dyed with indigo leaf, mahogany bark, and turmeric.'
            )}
          </p>
          <p>
            {t(
              'Kain bermotif pusaka seperti Subahnale dikenakan pada upacara perkawinan adat, penjemputan tokoh desa, serta perayaan keagamaan dan Dzikir Saman komunal.',
              'Heirloom textiles such as Subahnale are worn during customary weddings, welcoming dignitaries, and communal Dzikir Saman gatherings.'
            )}
          </p>
          <div className="pt-2 flex flex-wrap gap-4 border-t border-softLinen">
            <Link
              to="/history"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-terracotta hover:text-terracotta-hover"
            >
              <HistoryIcon className="w-4 h-4" />
              <span>{t('Telusuri Linimasa Sejarah', 'Explore Historical Timeline')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Live Published Curated Entries from Appwrite Backend */}
      {loading ? (
        <LoadingSpinner message={t('Menghimpun catatan kuratorial dari arsip...', 'Loading curated records from archive...')} />
      ) : (
        <div className="space-y-14">
          {motifs.length > 0 && (
            <section className="space-y-6">
              <div className="flex items-end justify-between border-b border-softLinen pb-3">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-terracotta" />
                  <h2 className="font-serif text-2xl font-semibold text-charcoal">
                    {t('Kajian Motif Pilihan', 'Curated Motif Studies')}
                  </h2>
                </div>
                <Link to="/motifs" className="text-xs font-medium text-terracotta hover:underline">
                  {t('Semua Motif →', 'All Motifs →')}
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
                {motifs.map((m) => (
                  <MotifCard key={m.$id} motif={m} />
                ))}
              </div>
            </section>
          )}

          {cultures.length > 0 && (
            <section className="space-y-6">
              <div className="flex items-end justify-between border-b border-softLinen pb-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-terracotta" />
                  <h2 className="font-serif text-2xl font-semibold text-charcoal">
                    {t('Tradisi & Kehidupan Komunal', 'Living Cultural Rites')}
                  </h2>
                </div>
                <Link to="/cultures" className="text-xs font-medium text-terracotta hover:underline">
                  {t('Semua Tradisi →', 'All Traditions →')}
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
                {cultures.map((c) => (
                  <CultureCard key={c.$id} culture={c} />
                ))}
              </div>
            </section>
          )}

          {eras.length > 0 && (
            <section className="bg-aged/75 border border-naturalBeige p-6 sm:p-8 space-y-4">
              <h2 className="font-serif text-2xl font-semibold text-charcoal">
                {t('Babak Arsip Sejarah Terverifikasi', 'Verified Historical Annals')}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {eras.map((era) => {
                  const tr = pickTranslation(era.translations, locale);
                  return (
                    <div key={era.$id} className="bg-surface/90 border border-softLinen p-5 space-y-2">
                      <span className="font-mono text-xs font-semibold text-terracotta">
                        {era.startYear} {era.endYear ? `– ${era.endYear}` : ''}
                      </span>
                      <h3 className="font-serif text-lg font-semibold text-charcoal">
                        {tr?.eraTitle || era.slug}
                      </h3>
                      <p className="text-xs sm:text-sm text-[#4D443B] line-clamp-3 leading-relaxed">
                        {tr?.narrative}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      )}
    </article>
  );
};
