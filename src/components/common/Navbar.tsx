import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, User, Shield } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { WovenGridLogo } from './DecorativeIcons';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { locale, toggleLocale, t } = useLanguage();
  const { user } = useAuth();
  const location = useLocation();

  const navLinks = [
    { path: '/', labelId: 'Beranda', labelEn: 'Home' },
    { path: '/motifs', labelId: 'Koleksi', labelEn: 'Collection' },
    { path: '/cultures', labelId: 'Cerita & Tradisi', labelEn: 'Stories & Traditions' },
    { path: '/history', labelId: 'Ruang Kuratorial', labelEn: 'Curatorial Space' },
    { path: '/about', labelId: 'Tentang', labelEn: 'About' },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-50 bg-[#0B1623]/95 backdrop-blur-md border-b border-[#1E3246]/60 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Brand Logo & Wordmark */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="transition-transform group-hover:scale-105 duration-200">
                <WovenGridLogo className="w-8 h-8 text-terracotta" />
              </div>
              <div className="flex flex-col">
                <span className="font-serif text-sm sm:text-base font-bold tracking-[0.12em] text-[#F8F5EF] uppercase leading-tight group-hover:text-terracotta transition-colors">
                  Museum Digital
                </span>
                <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.22em] text-[#E8DCC9]/80 font-medium">
                  Pringgasela Selatan
                </span>
              </div>
            </Link>

            {/* Subtle Vertical Divider */}
            <div className="hidden md:block h-6 w-px bg-[#1E3246] mx-5" />
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-7">
            {navLinks.map((link) => {
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`text-sm tracking-wide transition-all relative py-1 ${
                    active
                      ? 'text-[#F8F5EF] font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-terracotta'
                      : 'text-[#E8DCC9]/75 hover:text-[#F8F5EF]'
                  }`}
                >
                  {t(link.labelId, link.labelEn)}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Tools: Language & Admin Entry */}
          <div className="hidden sm:flex items-center gap-5">
            {/* Language Switcher */}
            <button
              onClick={toggleLocale}
              className="text-xs font-semibold tracking-wider text-[#E8DCC9]/80 hover:text-[#F8F5EF] transition-colors py-1 cursor-pointer"
              title="Ganti Bahasa / Switch Language"
            >
              <span>{locale === 'id' ? 'ID | EN' : 'EN | ID'}</span>
            </button>

            {/* Admin Entry Gateway Button */}
            <Link
              to={user ? '/admin' : '/admin/login'}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-terracotta hover:bg-terracotta-hover text-[#F8F5EF] text-xs font-semibold tracking-wide transition-all shadow-sm hover:shadow-md cursor-pointer"
            >
              {user ? (
                <>
                  <Shield className="w-3.5 h-3.5" />
                  <span>{t('Panel Admin', 'Admin Panel')}</span>
                </>
              ) : (
                <>
                  <User className="w-3.5 h-3.5" />
                  <span>{t('Masuk Pengelola', 'Staff Portal')}</span>
                </>
              )}
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex sm:hidden items-center gap-2">
            <button
              onClick={toggleLocale}
              className="px-2 py-1 text-xs font-semibold text-[#E8DCC9]"
            >
              {locale.toUpperCase()}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-[#E8DCC9] hover:text-white hover:bg-[#132334] transition-colors"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="sm:hidden bg-[#0B1623] border-b border-[#1E3246] px-4 pt-3 pb-6 space-y-4 shadow-xl">
          <nav className="flex flex-col space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive(link.path)
                    ? 'bg-terracotta/15 text-terracotta font-semibold'
                    : 'text-[#E8DCC9]/80 hover:text-white'
                }`}
              >
                {t(link.labelId, link.labelEn)}
              </Link>
            ))}
          </nav>

          <div className="pt-3 border-t border-[#1E3246]/60 flex items-center justify-between">
            <Link
              to={user ? '/admin' : '/admin/login'}
              onClick={() => setMobileMenuOpen(false)}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-terracotta text-[#F8F5EF] text-xs font-semibold"
            >
              <User className="w-4 h-4" />
              <span>{user ? t('Panel Admin', 'Admin Panel') : t('Masuk Pengelola', 'Staff Portal')}</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
