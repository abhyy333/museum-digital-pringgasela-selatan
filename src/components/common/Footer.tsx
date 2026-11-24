import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Mail, Clock, Heart } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { MuseumLogo } from './MuseumLogo';

export const Footer: React.FC = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-charcoal text-ivory pt-14 pb-10 border-t border-naturalBeige/30">
      <div className="max-w-[1380px] mx-auto px-5 sm:px-8 lg:px-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
          {/* Column 1: Museum Identity */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <MuseumLogo className="w-9 h-9 text-terracotta shrink-0" />
              <div className="leading-none">
                <span className="block font-serif text-lg font-semibold tracking-[0.04em] text-[#FBF8F3] uppercase">
                  Museum Digital
                </span>
                <span className="block font-sans text-[10px] uppercase tracking-[0.2em] text-naturalBeige mt-1">
                  Pringgasela Selatan
                </span>
              </div>
            </div>
            <p className="text-[#CFC4B4] text-sm leading-relaxed">
              {t(
                'Arsip digital kebudayaan luhur, ensiklopedia motif tenun tradisional Sasak, Batik Sasambo, tradisi Dzikir Saman, dan catatan sejarah peradaban Desa Pringgasela Selatan.',
                'A digital cultural repository preserving ancestral Sasak traditional weaving motifs, Sasambo batik, Dzikir Saman chants, and the founding history of South Pringgasela.'
              )}
            </p>
          </div>

          {/* Column 2: Navigation Links */}
          <div>
            <h4 className="font-serif text-sm font-semibold uppercase tracking-wider text-parchment mb-4">
              {t('Koleksi & Arsip', 'Collections & Archive')}
            </h4>
            <ul className="space-y-2.5 text-sm text-[#CFC4B4]">
              <li>
                <Link to="/motifs" className="hover:text-parchment transition-colors">
                  {t('Ensiklopedia Motif Tenun', 'Weaving Motif Encyclopedia')}
                </Link>
              </li>
              <li>
                <Link to="/crafts" className="hover:text-parchment transition-colors">
                  {t('Katalog Kerajinan & Tenun', 'Crafts & Textiles Catalog')}
                </Link>
              </li>
              <li>
                <Link to="/cultures" className="hover:text-parchment transition-colors">
                  {t('Cerita & Tradisi Budaya', 'Stories & Cultural Heritage')}
                </Link>
              </li>
              <li>
                <Link to="/curatorial" className="hover:text-parchment transition-colors">
                  {t('Ulasan Kuratorial', 'Curatorial Essays')}
                </Link>
              </li>
              <li>
                <Link to="/history" className="hover:text-parchment transition-colors">
                  {t('Linimasa Sejarah Desa', 'Village Historical Timeline')}
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-parchment transition-colors">
                  {t('Tentang Museum', 'About Museum')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Contact & Location */}
          <div>
            <h4 className="font-serif text-sm font-semibold uppercase tracking-wider text-parchment mb-4">
              {t('Sekretariat & Jam Layanan', 'Contact & Visiting')}
            </h4>
            <ul className="space-y-3 text-sm text-[#CFC4B4]">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-terracotta shrink-0 mt-0.5" />
                <span>
                  Jl. Pariwisata Budaya Pringgasela Selatan, Kec. Pringgasela, Kab. Lombok Timur, NTB 83661
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-terracotta shrink-0" />
                <span>museum@pringgasela.desa.id</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-terracotta shrink-0 mt-0.5" />
                <span>
                  Senin – Sabtu: 08.00 – 16.00 WITA
                  <br />
                  Layanan Daring 24/7
                </span>
              </li>
            </ul>
          </div>

          {/* Column 4: Cultural Board & KKN Attribution */}
          <div>
            <h4 className="font-serif text-sm font-semibold uppercase tracking-wider text-parchment mb-4">
              {t('Pemberdayaan Budaya', 'Heritage Stewardship')}
            </h4>
            <p className="text-[#CFC4B4] text-xs leading-relaxed mb-4">
              {t(
                'Kolaborasi Pemerintah Desa Pringgasela Selatan, Dewan Kebudayaan Desa, Tetua Adat, Perkumpulan Penenun Tradisional, dan Tim Peneliti KKN Tematik Kebudayaan.',
                'A collaborative initiative of South Pringgasela Village Government, Customary Elders, Traditional Weavers Collective, and University Heritage Research Team.'
              )}
            </p>
            <div className="pt-1">
              <Link
                to="/admin/login"
                className="inline-flex items-center text-xs text-parchment/85 hover:text-white underline underline-offset-4 transition-colors"
              >
                {t('Masuk Portal Pengelola (CMS)', 'Curator & Staff Login')}
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-7 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-[#A39583] gap-4">
          <p>© {new Date().getFullYear()} Pemerintah Desa Pringgasela Selatan. Dilindungi Hak Cipta Kebudayaan.</p>
          <p className="flex items-center gap-1.5">
            <span>Didedikasikan untuk Pelestarian Tenun Sasak</span>
            <Heart className="w-3.5 h-3.5 text-terracotta fill-terracotta inline" />
          </p>
        </div>
      </div>
    </footer>
  );
};
