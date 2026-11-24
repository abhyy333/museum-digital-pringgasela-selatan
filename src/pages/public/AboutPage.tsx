import React, { useEffect, useState } from 'react';
import { Landmark, Compass, Users, MapPin, Mail, Clock, ShieldCheck } from 'lucide-react';
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
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-sand-200 text-xs font-semibold text-primary uppercase tracking-wider">
          <Landmark className="w-3.5 h-3.5" />
          <span>{t('Pusat Preservasi Warisan Sasak', 'Sasak Cultural Preservation Center')}</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-text">
          {t('Tentang Museum Digital Pringgasela Selatan', 'About South Pringgasela Digital Museum')}
        </h1>
        <p className="text-muted text-base leading-relaxed">
          {settings.museum_description_id ||
            t(
              'Sebuah inisiatif preservasi digital komprehensif untuk melindungi, mendokumentasikan, dan memperluas literasi kebudayaan tenun tradisional, Dzikir Saman, dan peradaban luhur Sasak Pringgasela Selatan.',
              'A digital heritage initiative dedicated to safeguarding and sharing traditional Sasak weaving, sacred chants, and the founding history of South Pringgasela.'
            )}
        </p>
      </div>

      {/* Vision & Mission Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-surface rounded-2xl border border-border p-8 space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Compass className="w-6 h-6" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-text">
            {t('Visi Kebudayaan', 'Cultural Vision')}
          </h2>
          <p className="text-sm text-text/80 leading-relaxed">
            {t(
              'Menjadikan warisan budaya Pringgasela Selatan sebagai lentera peradaban yang berdaya tahan, dikenal di kancah nasional dan internasional, serta memberikan kebanggaan dan kesejahteraan berkelanjutan bagi perajin tenun dan generasi muda desa.',
              'To preserve South Pringgasela heritage as a resilient cultural beacon recognized globally, instilling pride and sustainable well-being for traditional artisans.'
            )}
          </p>
        </div>

        <div className="bg-surface rounded-2xl border border-border p-8 space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-text">
            {t('Misi Preservasi', 'Preservation Mission')}
          </h2>
          <ul className="text-sm text-text/80 leading-relaxed space-y-2 list-disc list-inside">
            <li>{t('Mendokumentasikan secara ilmiah dan visual motif tenun kuno.', 'Scholarly documentation of ancient weaving motifs.')}</li>
            <li>{t('Melindungi hak kekayaan intelektual komunal warga Sasak.', 'Safeguarding communal intellectual property rights.')}</li>
            <li>{t('Mendorong regenerasi penenun muda alat gedogan.', 'Fostering younger generations in loom craftsmanship.')}</li>
            <li>{t('Menyediakan akses arsip sejarah desa terbuka dan kredibel.', 'Providing open, credible village historical archives.')}</li>
          </ul>
        </div>
      </div>

      {/* Collaborative Stewardship Note */}
      <section className="bg-sand-100 rounded-3xl border border-border p-8 sm:p-12 space-y-6">
        <div className="flex items-center gap-2 text-xs font-semibold text-secondary uppercase tracking-wider">
          <Users className="w-4 h-4" />
          <span>{t('Kolaborasi & Tata Kelola', 'Collaborative Stewardship')}</span>
        </div>
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-text">
          {t('Menjaga Warisan Secara Komunal', 'Communal Custodianship')}
        </h2>
        <p className="text-sm sm:text-base text-text/80 leading-relaxed">
          {t(
            'Museum Digital Pringgasela Selatan dikelola secara kolaboratif oleh Pemerintah Desa Pringgasela Selatan, Dewan Kebudayaan Desa, para Maestro Penenun Dusun Gubuk Timuk & Gubuk Barat, Tokoh Adat, dan Tim Peneliti KKN Tematik Kebudayaan Perguruan Tinggi. Seluruh data diverifikasi bersama para tetua adat guna menjamin keaslian orisinalitas kultural.',
            'Managed collaboratively by the Village Government of South Pringgasela, Cultural Board, Master Weavers, Customary Elders, and University Field Researchers.'
          )}
        </p>

        {/* Contact Coordinates */}
        <div className="pt-6 border-t border-border/80 grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs text-text/90">
          <div className="space-y-1">
            <span className="font-semibold text-secondary flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-accent" />
              {t('Alamat Sekretariat', 'Location')}:
            </span>
            <p className="text-muted leading-relaxed">
              {settings.village_address || 'Jl. Pariwisata Budaya Pringgasela Selatan, Kec. Pringgasela, Kab. Lombok Timur, NTB 83661'}
            </p>
          </div>

          <div className="space-y-1">
            <span className="font-semibold text-secondary flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-accent" />
              {t('Surel Resmi', 'Official Email')}:
            </span>
            <p className="text-muted">
              {settings.contact_email || 'museum@pringgasela.desa.id'}
            </p>
          </div>

          <div className="space-y-1">
            <span className="font-semibold text-secondary flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-accent" />
              {t('Jam Operasional', 'Visiting Hours')}:
            </span>
            <p className="text-muted leading-relaxed">
              {settings.opening_hours || 'Senin – Sabtu: 08.00 – 16.00 WITA | Daring 24/7'}
            </p>
          </div>
        </div>
      </section>

    </div>
  );
};
