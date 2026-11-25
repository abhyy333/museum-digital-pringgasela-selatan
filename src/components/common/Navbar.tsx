import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Search, User } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { MuseumLogo } from './MuseumLogo';
import { SearchOverlay } from './SearchOverlay';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { locale, setLocale, t } = useLanguage();
  const { user } = useAuth();
  const location = useLocation();

  const navLinks = [
    {
      path: '/',
      labelId: 'Beranda',
      labelEn: 'Home',
      matchPaths: ['/'],
    },
    {
      path: '/motifs',
      labelId: 'Koleksi',
      labelEn: 'Collections',
      matchPaths: ['/motifs', '/crafts'],
    },
    {
      path: '/cultures',
      labelId: 'Cerita & Tradisi',
      labelEn: 'Stories & Traditions',
      matchPaths: ['/cultures'],
    },
    {
      path: '/curatorial',
      labelId: 'Kuratorial',
      labelEn: 'Curatorial',
      matchPaths: ['/curatorial', '/history'],
    },
    {
      path: '/about',
      labelId: 'Tentang',
      labelEn: 'About',
      matchPaths: ['/about'],
    },
  ];

  const isActive = (matchPaths: string[]) => {
    if (matchPaths.includes('/') && location.pathname === '/') return true;
    return matchPaths.some((p) => p !== '/' && location.pathname.startsWith(p));
  };

  return (
    <>
      <header className="sticky top-0 z-40 surface-warm-ivory border-b border-softLinen/80">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-8 xl:px-14">
          <div className="flex items-center justify-between gap-4 h-[60px] lg:h-[64px]">
            {/* LEFT: Brand Mark + Title */}
            <Link to="/" className="flex items-center gap-2.5 sm:gap-3 group shrink-0">
              <MuseumLogo className="w-7 h-7 sm:w-8 sm:h-8 xl:w-[34px] xl:h-[34px] text-terracotta group-hover:text-terracotta-hover transition-colors" />
              <div className="leading-none">
                <span className="block font-serif text-[15px] sm:text-[17px] xl:text-[20px] font-semibold tracking-[0.04em] text-charcoal uppercase whitespace-nowrap">
                  Museum Digital
                </span>
                <span className="block font-sans text-[8.5px] sm:text-[9px] xl:text-[10px] font-medium tracking-[0.14em] sm:tracking-[0.2em] text-mutedBrown uppercase mt-1 whitespace-nowrap">
                  Pringgasela Selatan
                </span>
              </div>
            </Link>

            {/* CENTER: Editorial Navigation */}
            <nav className="hidden lg:flex items-center gap-4 xl:gap-8" aria-label={t('Navigasi Utama', 'Main Navigation')}>
              {navLinks.map((link) => {
                const active = isActive(link.matchPaths);
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`relative py-1.5 text-[13px] xl:text-[14px] tracking-[0.01em] whitespace-nowrap transition-colors ${
                      active
                        ? 'text-terracotta font-medium after:content-[""] after:absolute after:left-0 after:right-0 after:-bottom-0.5 after:h-[1.5px] after:bg-terracotta'
                        : 'text-charcoal/85 hover:text-terracotta font-normal'
                    }`}
                  >
                    {t(link.labelId, link.labelEn)}
                  </Link>
                );
              })}
            </nav>

            {/* RIGHT: Language Switcher (ID | EN), Search Icon, Login CTA */}
            <div className="hidden lg:flex items-center gap-3 xl:gap-5 shrink-0">
              <div className="flex items-center text-[12.5px] tracking-wider select-none" role="group" aria-label={t('Pilihan Bahasa', 'Language Switcher')}>
                <button
                  type="button"
                  onClick={() => setLocale('id')}
                  className={`px-1 py-0.5 transition-colors ${
                    locale === 'id'
                      ? 'font-semibold text-charcoal'
                      : 'font-normal text-mutedBrown hover:text-charcoal'
                  }`}
                >
                  ID
                </button>
                <span className="text-naturalBeige mx-1">|</span>
                <button
                  type="button"
                  onClick={() => setLocale('en')}
                  className={`px-1 py-0.5 transition-colors ${
                    locale === 'en'
                      ? 'font-semibold text-charcoal'
                      : 'font-normal text-mutedBrown hover:text-charcoal'
                  }`}
                >
                  EN
                </button>
              </div>

              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                aria-label={t('Cari Koleksi', 'Search Archive')}
                className="p-1.5 text-charcoal hover:text-terracotta transition-colors"
              >
                <Search className="w-[18px] h-[18px]" strokeWidth={1.75} />
              </button>

              <Link
                to={user ? '/admin' : '/admin/login'}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-[4px] bg-terracotta hover:bg-terracotta-hover text-[#FBF8F3] text-[13px] font-medium tracking-[0.01em] transition-colors shadow-xs"
              >
                <User className="w-3.5 h-3.5" strokeWidth={2} />
                <span>{user ? t('Panel CMS', 'CMS Portal') : t('Masuk Pengelola', 'Curator Login')}</span>
              </Link>
            </div>

            {/* MOBILE / TABLET CONTROLS */}
            <div className="flex lg:hidden items-center gap-2 sm:gap-3">
              <div className="flex items-center text-xs tracking-wide border border-softLinen rounded-[4px] px-2 py-1 bg-surface/70">
                <button
                  type="button"
                  onClick={() => setLocale('id')}
                  className={locale === 'id' ? 'font-semibold text-terracotta' : 'text-mutedBrown'}
                >
                  ID
                </button>
                <span className="text-naturalBeige mx-1">|</span>
                <button
                  type="button"
                  onClick={() => setLocale('en')}
                  className={locale === 'en' ? 'font-semibold text-terracotta' : 'text-mutedBrown'}
                >
                  EN
                </button>
              </div>

              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                aria-label={t('Cari Koleksi', 'Search Archive')}
                className="p-2 text-charcoal hover:text-terracotta transition-colors"
              >
                <Search className="w-[19px] h-[19px]" strokeWidth={1.8} />
              </button>

              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-[4px] text-charcoal hover:bg-aged transition-colors"
                aria-label={t('Buka menu navigasi', 'Toggle navigation menu')}
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-softLinen bg-ivory px-5 pt-3 pb-6 space-y-1.5 shadow-md">
            {navLinks.map((link) => {
              const active = isActive(link.matchPaths);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2.5 text-sm border-l-2 transition-colors ${
                    active
                      ? 'border-terracotta text-terracotta font-semibold bg-aged/60'
                      : 'border-transparent text-charcoal hover:text-terracotta hover:bg-aged/40'
                  }`}
                >
                  {t(link.labelId, link.labelEn)}
                </Link>
              );
            })}

            <div className="pt-4 mt-2 border-t border-softLinen flex items-center justify-between gap-3">
              <Link
                to={user ? '/admin' : '/admin/login'}
                onClick={() => setMobileMenuOpen(false)}
                className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-[4px] bg-terracotta hover:bg-terracotta-hover text-[#FBF8F3] text-xs font-medium"
              >
                <User className="w-4 h-4" />
                <span>{user ? t('Buka Panel Pengelola (CMS)', 'Open CMS Portal') : t('Masuk Pengelola', 'Curator Login')}</span>
              </Link>
            </div>
          </div>
        )}
      </header>

      <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
};
