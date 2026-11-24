import React, { useEffect, useState } from 'react';
import { Landmark, Compass, Users, MapPin, Mail, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { publicApi } from '../../appwrite/publicApi';

export const AboutPage: React.FC = () => {
  const { t } = useLanguage();
  const [settings, setSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    publicApi.getSettings().then((res) => {
      setSettings(res.settings || {});
    }).catch(() => {});
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      
      {/* Header */}
      <div className="max-w-3xl space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#132334] border border-[#1E3246] text-xs font-semibold text-terracotta uppercase tracking-wider">
          <Landmark className="w-3.5 h-3.5" />
          <span>{t('Pusat Preservasi Warisan Sasak', 'Sasak Cultural Preservation Center')}</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-[#F8F5EF]">
          {t('Tentang Museum Digital Pringgasela Selatan', 'About South Pringgasela Digital Museum')}
        </h1>
        <p className="text-[#E8DCC9]/80 text-sm sm:text-base leading-relaxed">
          {settings.museum_description_id ||
            t(
              'Sebuah inisiatif preservasi digital komprehensif untuk melindungi, mendokumentasikan, dan memperluas literasi kebudayaan tenun tradisional, Dzikir Saman, dan peradaban luhur Sasak Pringgasela Selatan.',
              'A digital heritage initiative dedicated to safeguarding and sharing traditional Sasak weaving, sacred chants, and the founding history of South Pringgasela.'
            )}
        </p>
      </div>

      {/* Vision & Mission Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-[#0E1A27] rounded-lg border border-[#1E3246] p-8 space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-lg bg-terracotta/15 text-terracotta flex items-center justify-center">
            <Compass className="w-6 h-6" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-[#F8F5EF]">
            {t('Visi Kebudayaan', 'Cultural Vision')}
          </h2>
          <p className="text-xs sm:text-sm text-[#E8DCC9]/80 leading-relaxed font-sans">
            {t(
              'Menjadikan warisan budaya Pringgasela Selatan sebagai lentera peradaban yang berdaya tahan, dikenal di kancah nasional dan internasional, serta memberikan kebanggaan dan kesejahteraan berkelanjutan bagi perajin tenun dan generasi muda desa.',
              'To preserve South Pringgasela heritage as a resilient cultural beacon recognized globally, instilling pride and sustainable well-being for traditional artisans.'
            )}
          </p>
        </div>

        <div className="bg-[#0E1A27] rounded-lg border border-[#1E3246] p-8 space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-lg bg-terracotta/15 text-terracotta flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-[#F8F5EF]">
            {t('Misi Preservasi', 'Preservation Mission')}
          </h2>
          <ul className="text-xs sm:text-sm text-[#E8DCC9]/80 space-y-2 list-disc list-inside leading-relaxed font-sans">
            <li>{t('Mendokumentasikan seluruh motif tenun kuno dan cerita lisan penenun.', 'Documenting ancient weaving motifs and oral histories.')}</li>
            <li>{t('Melindungi hak cipta intelektual dan ulayat motif Sasak Pringgasela.', 'Protecting intellectual and customary rights of Pringgasela motifs.')}</li>
            <li>{t('Mempromosikan pewarnaan alami berbasis keanekaragaman hayati lereng Rinjani.', 'Promoting botanical dyeing based on Mount Rinjani biodiversity.')}</li>
            <li>{t('Menyediakan repositori ilmiah terbuka dwibahasa bagi periset dunia.', 'Providing an open bilingual scholarly repository for global researchers.')}</li>
          </ul>
        </div>
      </div>

      {/* Village Contact & Cultural Stewardship Card */}
      <div className="bg-[#132334] rounded-lg border border-[#1E3246] p-8 sm:p-10 space-y-6">
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-terracotta font-bold">
          <Users className="w-4 h-4 text-terracotta" />
          <span>{t('Tata Kelola & Koordinat Desa', 'Governance & Coordinates')}</span>
        </div>
        <h3 className="font-serif text-2xl font-bold text-[#F8F5EF]">
          {t('Pemerintah Desa Pringgasela Selatan', 'South Pringgasela Village Governance')}
        </h3>
        <p className="text-xs sm:text-sm text-[#E8DCC9]/80 leading-relaxed font-sans">
          {t(
            'Desa Pringgasela Selatan, Kecamatan Pringgasela, Kabupaten Lombok Timur, Provinsi Nusa Tenggara Barat, Indonesia. Terletak di ketinggian lereng timur Gunung Rinjani dengan tradisi agraris dan kerajinan tenun gedogan yang telah berusia ratusan tahun.',
            'South Pringgasela Village, Pringgasela District, East Lombok Regency, West Nusa Tenggara Province, Indonesia. Situated on the fertile eastern foothills of Mount Rinjani with centuries-old traditions of agriculture and backstrap loom weaving.'
          )}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[#1E3246] text-xs text-[#E8DCC9]/80">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-terracotta" />
            <span>Kode Pos 83661, Nusa Tenggara Barat</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-terracotta" />
            <span className="font-mono">pemdes@pringgaselaselatan.desa.id</span>
          </div>
        </div>
      </div>

    </div>
  );
};
