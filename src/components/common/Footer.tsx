import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Mail, Shield, Heart } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { WovenGridLogo } from './DecorativeIcons';

export const Footer: React.FC = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-[#0B1623] text-[#F2E9DC] pt-16 pb-12 border-t border-[#1E3246]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          
          {/* Column 1: Museum Identity */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <WovenGridLogo className="w-8 h-8 text-terracotta" />
              <div>
                <span className="block font-serif text-base font-bold tracking-wider text-[#F8F5EF] uppercase">
                  Museum Digital
                </span>
                <span className="block text-[10px] uppercase tracking-[0.22em] text-[#E8DCC9]/80 font-medium">
                  Pringgasela Selatan
                </span>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-[#E8DCC9]/75 leading-relaxed font-sans">
              {t(
                'Arsip kuratorial digital untuk merawat martabat warisan tenun gedogan, kesenian sakral Dzikir Saman, dan narasi peradaban masyarakat Desa Pringgasela Selatan di lereng Gunung Rinjani.',
                'A digital curatorial archive stewarding the dignity of backstrap loom weaving, sacred Dzikir Saman oral arts, and the civilization narrative of South Pringgasela village.'
              )}
            </p>
          </div>

          {/* Column 2: Navigation Links */}
          <div>
            <h4 className="font-serif text-xs font-bold uppercase tracking-[0.2em] text-terracotta mb-4">
              {t('Koleksi & Arsip', 'Collections & Archive')}
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-[#E8DCC9]/75">
              <li>
                <Link to="/motifs" className="hover:text-terracotta transition-colors">
                  {t('Ragam Motif Tenun (30+)', 'Motif Encyclopedia (30+)')}
                </Link>
              </li>
              <li>
                <Link to="/crafts" className="hover:text-terracotta transition-colors">
                  {t('Alat Tenun Gedogan', 'Traditional Weaving Looms')}
                </Link>
              </li>
              <li>
                <Link to="/crafts" className="hover:text-terracotta transition-colors">
                  {t('Bahan & Pewarna Alami', 'Natural Materials & Dyes')}
                </Link>
              </li>
              <li>
                <Link to="/cultures" className="hover:text-terracotta transition-colors">
                  {t('Kesenian Dzikir Saman', 'Dzikir Saman Sacred Chants')}
                </Link>
              </li>
              <li>
                <Link to="/history" className="hover:text-terracotta transition-colors">
                  {t('Linimasa Sejarah Desa', 'Village Historical Timeline')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Stewardship & Village Secretariat */}
          <div>
            <h4 className="font-serif text-xs font-bold uppercase tracking-[0.2em] text-terracotta mb-4">
              {t('Sekretariat Museum', 'Museum Secretariat')}
            </h4>
            <div className="space-y-3 text-xs sm:text-sm text-[#E8DCC9]/75">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-terracotta shrink-0 mt-0.5" />
                <span>
                  Kantor Desa Pringgasela Selatan, Kec. Pringgasela, Kab. Lombok Timur, Nusa Tenggara Barat 83661
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-terracotta shrink-0" />
                <span className="font-mono text-xs">pemdes@pringgaselaselatan.desa.id</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Shield className="w-4 h-4 text-terracotta shrink-0" />
                <span>Warisan Budaya Hidup Sasak</span>
              </div>
            </div>
          </div>

          {/* Column 4: Curatorial Governance & Staff Portal */}
          <div>
            <h4 className="font-serif text-xs font-bold uppercase tracking-[0.2em] text-terracotta mb-4">
              {t('Tata Kelola Adat', 'Cultural Governance')}
            </h4>
            <p className="text-xs text-[#E8DCC9]/75 leading-relaxed mb-4">
              {t(
                'Dikelola bersama Lembaga Adat Desa, Komunitas Maestro Penenun, dan Tim Mahasiswa KKN Pendamping Budaya.',
                'Stewarded jointly by the Village Customary Board, Master Weavers Guild, and Student Cultural Cohort.'
              )}
            </p>
            <Link
              to="/admin/login"
              className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg bg-[#132334] hover:bg-[#1E3246] border border-[#1E3246] text-[#F8F5EF] transition-colors"
            >
              <span>{t('Masuk Portal Pengelola', 'Staff Management Portal')}</span>
            </Link>
          </div>

        </div>

        {/* Bottom Bar: Copyright & Attribution */}
        <div className="border-t border-[#1E3246]/60 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-[#E8DCC9]/60 gap-4">
          <p>
            &copy; {new Date().getFullYear()} Museum Digital Pringgasela Selatan. Dilindungi Hukum Hak Cipta & Hak Ulayat Kebudayaan Sasak.
          </p>
          <div className="flex items-center gap-1 text-[#E8DCC9]/70">
            <span>Dirawat dengan dedikasi untuk pelestarian tenun Nusantara</span>
            <Heart className="w-3.5 h-3.5 text-terracotta fill-terracotta inline" />
          </div>
        </div>

      </div>
    </footer>
  );
};
