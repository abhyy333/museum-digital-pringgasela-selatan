import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Mail, Clock, Heart } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const Footer: React.FC = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-sand-900 text-sand-100 pt-16 pb-12 border-t border-sand-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          
          {/* Column 1: Museum Identity */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent text-surface flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-6 h-6 fill-none stroke-current" strokeWidth="6">
                  <polygon points="50,15 85,50 50,85 15,50" />
                  <polygon points="50,30 70,50 50,70 30,50" fill="#79543B" />
                  <circle cx="50" cy="50" r="6" fill="#F8F6F1" />
                </svg>
              </div>
              <div>
                <span className="block font-serif text-lg font-bold text-surface">
                  Museum Digital
                </span>
                <span className="block text-xs uppercase tracking-widest text-accent font-medium">
                  Pringgasela Selatan
                </span>
              </div>
            </div>
            <p className="text-sand-400 text-sm leading-relaxed">
              {t(
                'Arsip digital kebudayaan luhur, ensiklopedia motif tenun tradisional Sasak, Batik Sasambo, tradisi Dzikir Saman, dan catatan sejarah peradaban Desa Pringgasela Selatan.',
                'A digital cultural repository preserving ancestral Sasak traditional weaving motifs, Sasambo batik, Dzikir Saman chants, and the founding history of South Pringgasela.'
              )}
            </p>
          </div>

          {/* Column 2: Navigation Links */}
          <div>
            <h4 className="font-serif text-sm font-semibold uppercase tracking-wider text-sand-300 mb-4">
              {t('Koleksi & Arsip', 'Collections & Archive')}
            </h4>
            <ul className="space-y-2.5 text-sm text-sand-400">
              <li>
                <Link to="/motifs" className="hover:text-accent transition-colors">
                  {t('Ensiklopedia Motif Tenun', 'Weaving Motif Encyclopedia')}
                </Link>
              </li>
              <li>
                <Link to="/crafts" className="hover:text-accent transition-colors">
                  {t('Katalog Kerajinan & Tenun', 'Crafts & Textiles Catalog')}
                </Link>
              </li>
              <li>
                <Link to="/cultures" className="hover:text-accent transition-colors">
                  {t('Tradisi Budaya & Dzikir Saman', 'Cultural Heritage & Rituals')}
                </Link>
              </li>
              <li>
                <Link to="/history" className="hover:text-accent transition-colors">
                  {t('Linimasa Sejarah Desa', 'Village Historical Timeline')}
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-accent transition-colors">
                  {t('Visi & Misi Museum', 'About & Mission')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Contact & Location */}
          <div>
            <h4 className="font-serif text-sm font-semibold uppercase tracking-wider text-sand-300 mb-4">
              {t('Sekretariat & Jam Layanan', 'Contact & Visiting')}
            </h4>
            <ul className="space-y-3 text-sm text-sand-400">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <span>
                  Jl. Pariwisata Budaya Pringgasela Selatan, Kec. Pringgasela, Kab. Lombok Timur, NTB 83661
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-accent shrink-0" />
                <span>museum@pringgasela.desa.id</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <span>Senin – Sabtu: 08.00 – 16.00 WITA<br />Layanan Daring 24/7</span>
              </li>
            </ul>
          </div>

          {/* Column 4: Cultural Board & KKN Attribution */}
          <div>
            <h4 className="font-serif text-sm font-semibold uppercase tracking-wider text-sand-300 mb-4">
              {t('Pemberdayaan Budaya', 'Heritage Stewardship')}
            </h4>
            <p className="text-sand-400 text-xs leading-relaxed mb-4">
              {t(
                'Kolaborasi Pemerintah Desa Pringgasela Selatan, Dewan Kebudayaan Desa, Tetua Adat, Perkumpulan Penenun Tradisional, dan Tim Peneliti KKN Tematik Kebudayaan.',
                'A collaborative initiative of South Pringgasela Village Government, Customary Elders, Traditional Weavers Collective, and University Heritage Research Team.'
              )}
            </p>
            <div className="pt-2">
              <Link
                to="/admin/login"
                className="inline-flex items-center text-xs text-sand-400 hover:text-surface underline underline-offset-4 transition-colors"
              >
                {t('Masuk Portal Pengelola (CMS)', 'Curator & Staff Login')}
              </Link>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-sand-800 flex flex-col sm:flex-row items-center justify-between text-xs text-sand-500 gap-4">
          <p>© {new Date().getFullYear()} Pemerintah Desa Pringgasela Selatan. Dilindungi Hak Cipta Kebudayaan.</p>
          <p className="flex items-center gap-1">
            <span>Didedikasikan untuk Pelestarian Tenun Sasak</span>
            <Heart className="w-3.5 h-3.5 text-accent fill-accent inline" />
          </p>
        </div>
      </div>
    </footer>
  );
};
