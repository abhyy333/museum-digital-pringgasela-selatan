import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, User, Shield, Search } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { publicApi } from '../../appwrite/publicApi';
import { WovenGridLogo } from './DecorativeIcons';
import { pickTranslation } from '../../utils/i18n';

interface SearchResultItem {
  id: string;
  title: string;
  kind: string;
  to: string;
}

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const { locale, toggleLocale, t } = useLanguage();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navLinks = [
    { path: '/', labelId: 'Beranda', labelEn: 'Home' },
    { path: '/motifs', labelId: 'Koleksi', labelEn: 'Collection' },
    { path: '/cultures', labelId: 'Cerita & Tradisi', labelEn: 'Stories & Traditions' },
    { path: '/history', labelId: 'Kuratorial', labelEn: 'Curatorial' },
    { path: '/about', labelId: 'Tentang', labelEn: 'About' },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  // Close dialogs with Escape (R-26, R-32)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 40);
    }
  }, [searchOpen]);

  // Live Appwrite search across motifs, crafts, and cultures
  useEffect(() => {
    if (!searchOpen) return;
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      setSearchResults([]);
      setSearchError(null);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        setSearchLoading(true);
        setSearchError(null);
        const [mRes, cRes, cuRes] = await Promise.allSettled([
          publicApi.getMotifs({ limit: 20 }),
          publicApi.getCrafts({ limit: 20 }),
          publicApi.getCultures({ limit: 20 }),
        ]);

        if (cancelled) return;
        const found: SearchResultItem[] = [];

        if (mRes.status === 'fulfilled') {
          for (const m of mRes.value.items || []) {
            const tr = pickTranslation(m.translations, locale);
            const title = tr?.name || m.slug;
            if (title.toLowerCase().includes(q) || (m.codeName || '').toLowerCase().includes(q)) {
              found.push({ id: m.$id, title, kind: t('Motif Tenun', 'Weaving Motif'), to: `/motifs/${m.slug}` });
            }
          }
        }
        if (cRes.status === 'fulfilled') {
          for (const c of cRes.value.items || []) {
            const tr = pickTranslation(c.translations, locale);
            const title = tr?.title || c.slug;
            if (title.toLowerCase().includes(q)) {
              found.push({ id: c.$id, title, kind: t('Kriya Tradisional', 'Traditional Craft'), to: `/crafts/${c.slug}` });
            }
          }
        }
        if (cuRes.status === 'fulfilled') {
          for (const cu of cuRes.value.items || []) {
            const tr = pickTranslation(cu.translations, locale);
            const title = tr?.title || cu.slug;
            if (title.toLowerCase().includes(q)) {
              found.push({ id: cu.$id, title, kind: t('Cerita & Tradisi', 'Living Tradition'), to: `/cultures/${cu.slug}` });
            }
          }
        }

        if (
          mRes.status === 'rejected' &&
          cRes.status === 'rejected' &&
          cuRes.status === 'rejected'
        ) {
          setSearchError(t('Gagal mengakses indeks pencarian museum.', 'Unable to access museum search index.'));
        }
        setSearchResults(found.slice(0, 8));
      } finally {
        if (!cancelled) setSearchLoading(false);
      }
    }, 220);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery, searchOpen, locale, t]);

  return (
    <>
      <header className="sticky top-0 z-[60] archival-paper-canvas border-b border-[#D8CCB7]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 xl:px-14">
          <div className="flex items-center justify-between h-[70px] sm:h-[76px] gap-2">
            {/* Left: Brand Logo & Wordmark */}
            <div className="flex items-center shrink-0">
              <Link to="/" className="flex items-center gap-2.5 sm:gap-3 group min-h-[44px]">
                <WovenGridLogo className="w-7 h-7 sm:w-8 sm:h-8 text-[#9A4428] transition-transform duration-200 group-hover:scale-105 shrink-0" />
                <div className="flex flex-col">
                  <span className="font-serif text-[13px] sm:text-[15px] font-bold tracking-[0.09em] sm:tracking-[0.11em] text-[#23211E] uppercase leading-tight group-hover:text-[#9A4428] transition-colors whitespace-nowrap">
                    Museum Digital
                  </span>
                  <span className="text-[9.5px] sm:text-[10.5px] uppercase tracking-[0.16em] sm:tracking-[0.22em] text-[#5C544A] font-medium whitespace-nowrap">
                    Pringgasela Selatan
                  </span>
                </div>
              </Link>
              <div className="hidden xl:block h-7 w-px bg-[#D7CBB6] ml-7" aria-hidden="true" />
            </div>

            {/* Center: Desktop Navigation Links */}
            <nav aria-label={t('Navigasi utama', 'Primary navigation')} className="hidden lg:flex items-center gap-5 xl:gap-8">
              {navLinks.map((link) => {
                const active = isActive(link.path);
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    aria-current={active ? 'page' : undefined}
                    className={`relative py-2.5 text-[13.5px] tracking-wide transition-colors whitespace-nowrap ${
                      active
                        ? 'text-[#9A4428] font-semibold after:absolute after:bottom-1 after:left-0 after:right-0 after:h-[2px] after:bg-[#9A4428]'
                        : 'text-[#3A352E] hover:text-[#9A4428] font-medium'
                    }`}
                  >
                    {t(link.labelId, link.labelEn)}
                  </Link>
                );
              })}
            </nav>

            {/* Right: Language Switcher, Search & Staff Portal */}
            <div className="hidden sm:flex items-center gap-3 xl:gap-4 shrink-0">
              <button
                type="button"
                onClick={toggleLocale}
                className="min-h-[44px] px-2 text-xs tracking-wider text-[#5A5248] hover:text-[#23211E] transition-colors whitespace-nowrap"
                aria-label={t('Ganti bahasa ke Inggris', 'Switch language to Indonesian')}
              >
                <span className={locale === 'id' ? 'font-bold text-[#23211E]' : 'text-[#7A7165]'}>ID</span>
                <span className="mx-1.5 text-[#BEB29E]">|</span>
                <span className={locale === 'en' ? 'font-bold text-[#23211E]' : 'text-[#7A7165]'}>EN</span>
              </button>

              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="inline-flex items-center justify-center w-11 h-11 rounded-md text-[#3A352E] hover:text-[#9A4428] hover:bg-[#E7DCC9]/60 transition-colors"
                aria-label={t('Cari koleksi museum', 'Search museum collection')}
              >
                <Search className="w-4 h-4" aria-hidden="true" />
              </button>

              <Link
                to={user ? '/admin' : '/admin/login'}
                className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-md bg-[#9A4428] hover:bg-[#7E351D] text-[#FAF6EE] text-xs font-semibold tracking-wide transition-colors shadow-xs whitespace-nowrap"
              >
                {user ? (
                  <>
                    <Shield className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{t('Panel Admin', 'Admin Panel')}</span>
                  </>
                ) : (
                  <>
                    <User className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{t('Masuk Pengelola', 'Staff Portal')}</span>
                  </>
                )}
              </Link>
            </div>

            {/* Mobile Action Cluster */}
            <div className="flex sm:hidden items-center gap-1">
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="inline-flex items-center justify-center w-11 h-11 rounded-md text-[#23211E] hover:bg-[#E7DCC9]/70"
                aria-label={t('Cari arsip', 'Search archive')}
              >
                <Search className="w-5 h-5" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={toggleLocale}
                className="min-w-[44px] min-h-[44px] px-2 text-xs font-bold text-[#23211E]"
                aria-label={t('Ganti bahasa', 'Toggle language')}
              >
                {locale.toUpperCase()}
              </button>

              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center w-11 h-11 rounded-md text-[#23211E] hover:bg-[#E7DCC9]/70 transition-colors"
                aria-label={t('Buka menu navigasi', 'Toggle navigation menu')}
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X className="w-6 h-6" aria-hidden="true" /> : <Menu className="w-6 h-6" aria-hidden="true" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#F5EFE4] border-t border-[#D8CCB7] px-5 pt-3 pb-6 space-y-4 shadow-lg">
            <nav aria-label={t('Menu seluler', 'Mobile navigation')} className="flex flex-col space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3.5 min-h-[44px] flex items-center rounded-md text-sm font-medium ${
                    isActive(link.path)
                      ? 'bg-[#9A4428]/12 text-[#9A4428] font-semibold'
                      : 'text-[#35302B] hover:bg-[#EAE0CE]'
                  }`}
                >
                  {t(link.labelId, link.labelEn)}
                </Link>
              ))}
            </nav>

            <div className="pt-3 border-t border-[#D8CCB7]">
              <Link
                to={user ? '/admin' : '/admin/login'}
                onClick={() => setMobileMenuOpen(false)}
                className="w-full inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 rounded-md bg-[#9A4428] text-[#FAF6EE] text-xs font-semibold"
              >
                <User className="w-4 h-4" aria-hidden="true" />
                <span>{user ? t('Panel Admin', 'Admin Panel') : t('Masuk Pengelola', 'Staff Portal')}</span>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Accessible Archive Search Modal */}
      {searchOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t('Pencarian Arsip Museum', 'Museum Archive Search')}
          className="fixed inset-0 z-[80] bg-[#1F1C18]/50 backdrop-blur-xs flex items-start justify-center pt-16 sm:pt-24 px-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSearchOpen(false);
          }}
        >
          <div className="w-full max-w-xl bg-[#FAF5EB] border border-[#D4C7B2] rounded-lg shadow-2xl overflow-hidden text-[#23211E]">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[#E0D4C0]">
              <Search className="w-4 h-4 text-[#9A4428] shrink-0" aria-hidden="true" />
              <label htmlFor="museum-archive-search" className="sr-only">
                {t('Cari motif, kerajinan, atau tradisi', 'Search motifs, crafts, or traditions')}
              </label>
              <input
                id="museum-archive-search"
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('Cari motif tenun, kriya, atau tradisi...', 'Search motifs, crafts, or traditions...')}
                className="w-full bg-transparent text-sm text-[#23211E] placeholder-[#7A7165] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="w-11 h-11 inline-flex items-center justify-center rounded-md text-[#5A5248] hover:text-[#23211E] hover:bg-[#EBE0CE]"
                aria-label={t('Tutup pencarian', 'Close search')}
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <div className="p-4 max-h-80 overflow-y-auto space-y-2">
              {!searchQuery.trim() ? (
                <div className="space-y-2 text-xs text-[#5A5248]">
                  <p className="font-semibold uppercase tracking-wider text-[#9A4428]">
                    {t('Akses Cepat Koleksi', 'Quick Destinations')}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {[
                      { to: '/motifs', label: t('Motif Tenun', 'Weaving Motifs') },
                      { to: '/crafts', label: t('Alat & Pewarna', 'Looms & Dyes') },
                      { to: '/cultures', label: t('Cerita & Tradisi', 'Stories & Traditions') },
                      { to: '/history', label: t('Linimasa Kuratorial', 'Curatorial Timeline') },
                    ].map((quick) => (
                      <button
                        key={quick.to}
                        type="button"
                        onClick={() => {
                          setSearchOpen(false);
                          navigate(quick.to);
                        }}
                        className="min-h-[40px] px-3.5 py-2 rounded-md border border-[#D4C7B2] bg-[#F3ECE0] hover:border-[#9A4428] text-[#23211E] font-medium"
                      >
                        {quick.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : searchLoading ? (
                <p className="text-sm text-[#5A5248] py-4 text-center">
                  {t('Mencari dalam arsip museum...', 'Searching museum archive...')}
                </p>
              ) : searchError ? (
                <p className="text-sm text-[#9A4428] py-4 text-center">{searchError}</p>
              ) : searchResults.length === 0 ? (
                <p className="text-sm text-[#5A5248] py-4 text-center">
                  {t('Tidak ada entri yang cocok dengan kata kunci tersebut.', 'No matching archive records found.')}
                </p>
              ) : (
                <ul className="divide-y divide-[#E4D9C7]">
                  {searchResults.map((item) => (
                    <li key={item.id}>
                      <Link
                        to={item.to}
                        onClick={() => setSearchOpen(false)}
                        className="flex items-center justify-between py-2.5 px-2 hover:bg-[#EFE6D6] rounded-md min-h-[44px]"
                      >
                        <span className="font-serif font-semibold text-sm text-[#23211E]">{item.title}</span>
                        <span className="text-[11px] uppercase tracking-wider text-[#9A4428] font-medium">{item.kind}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
