import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Globe, Lock, Shield } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { locale, toggleLocale, t } = useLanguage();
  const { user } = useAuth();
  const location = useLocation();

  const navLinks = [
    { path: '/', labelId: 'Beranda', labelEn: 'Home' },
    { path: '/motifs', labelId: 'Ensiklopedia Motif', labelEn: 'Motif Encyclopedia' },
    { path: '/crafts', labelId: 'Kerajinan & Tenun', labelEn: 'Crafts & Textiles' },
    { path: '/cultures', labelId: 'Tradisi Budaya', labelEn: 'Cultural Heritage' },
    { path: '/history', labelId: 'Sejarah Desa', labelEn: 'Village History' },
    { path: '/about', labelId: 'Tentang Museum', labelEn: 'About' },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur-md border-b border-border transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-primary text-surface flex items-center justify-center shadow-xs group-hover:bg-primary-hover transition-colors">
              <svg viewBox="0 0 100 100" className="w-6 h-6 fill-none stroke-current" strokeWidth="6">
                <polygon points="50,15 85,50 50,85 15,50" />
                <polygon points="50,30 70,50 50,70 30,50" fill="#B86B4B" />
                <circle cx="50" cy="50" r="6" fill="#F8F6F1" />
              </svg>
            </div>
            <div>
              <span className="block font-serif text-lg sm:text-xl font-bold tracking-tight text-text leading-tight group-hover:text-primary transition-colors">
                Museum Digital
              </span>
              <span className="block text-xs uppercase tracking-widest text-secondary font-medium">
                Pringgasela Selatan
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => {
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'text-primary bg-primary/10 font-semibold'
                      : 'text-text/80 hover:text-primary hover:bg-sand-100'
                  }`}
                >
                  {t(link.labelId, link.labelEn)}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Tools: Language & Admin */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Language Switcher */}
            <button
              onClick={toggleLocale}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-sand-50 hover:bg-sand-100 text-xs font-semibold text-text transition-colors"
              title="Ganti Bahasa / Switch Language"
            >
              <Globe className="w-3.5 h-3.5 text-secondary" />
              <span>{locale === 'id' ? 'ID (IDN)' : 'EN (ENG)'}</span>
            </button>

            {/* Admin Portal Gateway */}
            <Link
              to={user ? '/admin' : '/admin/login'}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sand-200 hover:bg-sand-300 text-xs font-medium text-text transition-colors"
            >
              {user ? (
                <>
                  <Shield className="w-3.5 h-3.5 text-primary" />
                  <span>CMS Pengelola</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-muted" />
                  <span>Masuk Staf</span>
                </>
              )}
            </Link>
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex sm:hidden items-center gap-2">
            <button
              onClick={toggleLocale}
              className="p-2 text-xs font-bold text-secondary uppercase"
            >
              {locale}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-text hover:bg-sand-100 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-border bg-surface px-4 pt-3 pb-6 space-y-2 animate-in slide-in-from-top-2 duration-150">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-4 py-2.5 rounded-lg text-sm font-medium ${
                isActive(link.path)
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'text-text hover:bg-sand-100'
              }`}
            >
              {t(link.labelId, link.labelEn)}
            </Link>
          ))}
          <div className="pt-4 border-t border-border flex items-center justify-between">
            <Link
              to={user ? '/admin' : '/admin/login'}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-surface text-xs font-medium"
            >
              <Shield className="w-4 h-4" />
              {user ? 'Buka Panel CMS' : 'Login Staf Museum'}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
