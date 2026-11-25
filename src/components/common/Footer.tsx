import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Mail, Shield } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { WovenGridLogo } from './DecorativeIcons';

export const Footer: React.FC = () => {
  const { t } = useLanguage();

  return (
    <footer className="archival-paper-band text-[#23211E] pt-14 pb-10 border-t border-[#D4C7B2]">
      <div className="max-w-[1440px] mx-auto px-6 sm:px-10 xl:px-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 mb-10">
          {/* Museum Identity (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <WovenGridLogo className="w-8 h-8 text-[#9A4428]" />
              <div>
                <span className="block font-serif text-base font-bold tracking-[0.12em] text-[#23211E] uppercase">
                  Museum Digital
                </span>
                <span className="block text-[10px] uppercase tracking-[0.22em] text-[#5C544A] font-medium">
                  Pringgasela Selatan
                </span>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-[#4C463E] leading-relaxed max-w-md">
              {t(
                'Arsip kuratorial digital untuk merawat martabat warisan tenun gedogan, kesenian sakral Dzikir Saman, dan narasi peradaban masyarakat Desa Pringgasela Selatan di lereng Gunung Rinjani.',
                'A digital curatorial archive stewarding the heritage of backstrap loom weaving, sacred Dzikir Saman oral arts, and the cultural history of South Pringgasela village.'
              )}
            </p>
          </div>

          {/* Collection Links (3 cols) */}
          <div className="lg:col-span-3">
            <h4 className="font-serif text-xs font-bold uppercase tracking-[0.18em] text-[#9A4428] mb-3.5">
              {t('Koleksi & Arsip', 'Collections & Archive')}
            </h4>
            <ul className="space-y-1.5 text-xs sm:text-sm text-[#3E3831]">
              <li>
                <Link to="/motifs" className="inline-flex items-center min-h-[36px] hover:text-[#9A4428] transition-colors">
                  {t('Ragam Motif Tenun', 'Motif Encyclopedia')}
                </Link>
              </li>
              <li>
                <Link to="/crafts" className="inline-flex items-center min-h-[36px] hover:text-[#9A4428] transition-colors">
                  {t('Alat Tenun & Pewarna Alami', 'Traditional Looms & Natural Dyes')}
                </Link>
              </li>
              <li>
                <Link to="/cultures" className="inline-flex items-center min-h-[36px] hover:text-[#9A4428] transition-colors">
                  {t('Cerita & Tradisi Dzikir Saman', 'Stories & Dzikir Saman')}
                </Link>
              </li>
              <li>
                <Link to="/history" className="inline-flex items-center min-h-[36px] hover:text-[#9A4428] transition-colors">
                  {t('Kuratorial & Sejarah Desa', 'Curatorial & Village History')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Secretariat & Portal (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <h4 className="font-serif text-xs font-bold uppercase tracking-[0.18em] text-[#9A4428]">
              {t('Sekretariat & Tata Kelola', 'Secretariat & Governance')}
            </h4>
            <div className="space-y-2.5 text-xs sm:text-sm text-[#3E3831]">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#9A4428] shrink-0 mt-0.5" aria-hidden="true" />
                <span>
                  Kantor Desa Pringgasela Selatan, Kec. Pringgasela, Kab. Lombok Timur, NTB 83661
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#9A4428] shrink-0" aria-hidden="true" />
                <span className="font-mono text-xs">pemdes@pringgaselaselatan.desa.id</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Shield className="w-4 h-4 text-[#9A4428] shrink-0" aria-hidden="true" />
                <span>{t('Warisan Budaya Hidup Sasak', 'Living Sasak Cultural Heritage')}</span>
              </div>
            </div>

            <div className="pt-1">
              <Link
                to="/admin/login"
                className="inline-flex items-center justify-center min-h-[44px] text-xs font-semibold px-4 py-2 rounded-md bg-[#FAF5EB] hover:bg-[#EFE6D6] border border-[#C8B9A2] text-[#23211E] transition-colors"
              >
                {t('Masuk Portal Pengelola', 'Staff Management Portal')}
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-[#D4C7B2] pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-[#5C544A] gap-3">
          <p>
            &copy; {new Date().getFullYear()} Museum Digital Pringgasela Selatan. {t('Pelestarian Tenun dan Budaya Sasak.', 'Preserving Sasak Weaving & Heritage.')}
          </p>
          <Link to="/about" className="hover:text-[#9A4428] transition-colors">
            {t('Tentang Museum', 'About the Museum')}
          </Link>
        </div>
      </div>
    </footer>
  );
};
